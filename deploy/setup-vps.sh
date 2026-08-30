#!/bin/bash
# =============================================
# Oracle Cloud Always Free — Strapi + PostgreSQL setup
# Run with sudo on a fresh Ubuntu 24.04 LTS instance
# Tested shape: VM.Standard.A1.Flex (ARM64), 1 OCPU / 6 GB, eu-frankfurt-1
# =============================================
#
# BEFORE RUNNING:
#   1. Reserve a static public IP for the instance (OCI console -> VNIC).
#   2. Open TCP 80 and 443 in the VCN Security List (ingress, 0.0.0.0/0).
#      This script opens the *instance* firewall; the VCN rules are separate
#      and BOTH are required. See step [2/9].
#   3. Point $STRAPI_DOMAIN at the reserved IP (DuckDNS) and let it resolve.
#
# SMTP credentials are read from the environment so they never land in git.
# Run it like this (values come from your existing strapi/.env):
#
#   sudo SMTP_USERNAME='you@gmail.com' SMTP_PASSWORD='app password' ./setup-vps.sh
#
# =============================================

set -euo pipefail

# Non-interactive apt: installing iptables-persistent otherwise opens a debconf
# dialog asking whether to save current rules, which hangs the whole script.
# NEEDRESTART_MODE=a stops Ubuntu 24.04's needrestart from prompting about
# service restarts during `apt upgrade`.
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

echo "============================================"
echo "  Strapi Production Server Setup (Oracle)"
echo "============================================"

# --- Variables (customize these) ---
STRAPI_USER="strapi"
STRAPI_DOMAIN="${STRAPI_DOMAIN:-prvibalkan-cms.duckdns.org}"
NODE_VERSION="20"
REPO_URL="https://github.com/dragan381/tehnicki_pregled.git"
REPO_BRANCH="${REPO_BRANCH:-main}"
FRONTEND_ORIGINS="${FRONTEND_ORIGINS:-https://prvibalkan.rs,https://www.prvibalkan.rs,https://tehnicki-pregled.vercel.app}"

# SMTP — passed in as environment variables, not stored in the repo
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-465}"
SMTP_SECURE="${SMTP_SECURE:-true}"
SMTP_USERNAME="${SMTP_USERNAME:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"
SMTP_FROM="${SMTP_FROM:-$SMTP_USERNAME}"
SMTP_REPLY_TO="${SMTP_REPLY_TO:-$SMTP_USERNAME}"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run this with sudo (Oracle logs you in as 'ubuntu', not root)." >&2
  exit 1
fi

if [ -z "$SMTP_USERNAME" ] || [ -z "$SMTP_PASSWORD" ]; then
  echo "WARNING: SMTP_USERNAME / SMTP_PASSWORD not set."
  echo "         Strapi will install fine but contact + calculator emails will fail."
  echo "         Fill them in later at /home/$STRAPI_USER/tehnicki_pregled/strapi/.env"
  echo ""
fi

# --- DNS sanity check (a wrong record means Caddy can never get a certificate) ---
PUBLIC_IP="$(curl -fsS --max-time 10 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]' || true)"
RESOLVED_IP="$(getent ahostsv4 "$STRAPI_DOMAIN" 2>/dev/null | awk 'NR==1 {print $1}' || true)"
if [ -n "$PUBLIC_IP" ] && [ "$RESOLVED_IP" != "$PUBLIC_IP" ]; then
  echo "WARNING: $STRAPI_DOMAIN resolves to '${RESOLVED_IP:-nothing}' but this host is $PUBLIC_IP."
  echo "         Caddy will fail to obtain an HTTPS certificate until DNS matches."
  echo "         Continuing in 10s — Ctrl+C to abort and fix DNS first."
  sleep 10
fi

# --- System Updates ---
echo "[1/9] Updating system..."
apt update && apt upgrade -y
# NOTE: do NOT add `ufw` here. On Ubuntu 24.04 the ufw and iptables-persistent
# packages declare a mutual `Breaks:` and apt refuses to install both. Oracle's
# image already persists its iptables ruleset via netfilter-persistent, so that
# is the layer we manage below; ufw would be a redundant second one.
apt install -y curl git build-essential fail2ban iptables-persistent unattended-upgrades

# --- Oracle Cloud instance firewall ---
# Oracle's Ubuntu images ship with restrictive iptables rules persisted by
# netfilter-persistent. These silently drop 80/443 even when
# the VCN Security List allows them. This is the #1 reason an OCI box looks dead.
echo "[2/9] Opening ports 80/443 in the Oracle instance firewall..."
# Insert at the top of INPUT rather than a fixed index: a fixed position fails
# outright ("Index of insertion too big") if the chain is shorter than expected.
# `-C` first so re-running the script does not stack duplicate rules.
IPTABLES_CHANGED=0
for port in 80 443; do
  if iptables -C INPUT -m state --state NEW -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    echo "      port $port already allowed."
  else
    iptables -I INPUT -m state --state NEW -p tcp --dport "$port" -j ACCEPT
    echo "      port $port allowed."
    IPTABLES_CHANGED=1
  fi
done
if [ "$IPTABLES_CHANGED" -eq 1 ]; then
  netfilter-persistent save
  echo "      iptables rules saved (persist across reboot)."
fi
echo "      REMINDER: the VCN Security List must ALSO allow ingress on 80/443."

# --- Firewall sanity check ---
# There is no ufw here by design (see the apt note above). Verify the ruleset we
# are relying on is actually default-deny, so a misconfigured image cannot leave
# the box wide open silently.
echo "[3/9] Verifying the instance firewall is default-deny..."
if iptables -S INPUT | grep -qE '^-P INPUT (DROP|REJECT)|-A INPUT -j (DROP|REJECT)'; then
  echo "      INPUT chain has a default-deny policy."
else
  echo "WARNING: the INPUT chain has no default-deny rule — every port is open at"
  echo "         the instance level and only the VCN Security List is protecting"
  echo "         this host. Review 'iptables -S INPUT' before going live." >&2
fi
if iptables -C INPUT -m state --state NEW -p tcp --dport 22 -j ACCEPT 2>/dev/null; then
  echo "      port 22 (SSH) explicitly allowed."
else
  echo "NOTE: no explicit ACCEPT for port 22 found; SSH is presumably reaching you"
  echo "      via another rule. Do not reboot until you have confirmed why."
fi

# --- Fail2Ban (SSH protection) ---
systemctl enable fail2ban
systemctl start fail2ban

# --- Create strapi user ---
echo "[4/9] Creating strapi user..."
if ! id "$STRAPI_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$STRAPI_USER"
  usermod -aG sudo "$STRAPI_USER"
fi
mkdir -p /home/$STRAPI_USER/logs
mkdir -p /home/$STRAPI_USER/backups

# --- Install Node.js ---
echo "[5/9] Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
npm install -g pm2

# --- Install PostgreSQL ---
echo "[6/9] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Create database and user
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
sudo -u postgres psql <<EOF
CREATE USER strapi WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;
EOF
# PostgreSQL 15+ locks down the public schema; grant it explicitly.
sudo -u postgres psql -d strapi <<EOF
GRANT ALL ON SCHEMA public TO strapi;
EOF

echo ""
echo "  !! SAVE THIS DATABASE PASSWORD: $DB_PASSWORD"
echo ""

# --- Install Caddy ---
echo "[7/9] Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
mkdir -p /var/log/caddy

# --- Clone Strapi and write its environment ---
# The .env MUST exist before `strapi build` so the build sees its configuration.
echo "[8/9] Cloning Strapi and generating environment file..."
sudo -u "$STRAPI_USER" git clone --branch "$REPO_BRANCH" "$REPO_URL" /home/$STRAPI_USER/tehnicki_pregled

APP_KEYS="$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

cat > /home/$STRAPI_USER/tehnicki_pregled/strapi/.env <<ENVEOF
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production
PUBLIC_URL=https://$STRAPI_DOMAIN

# Security Keys
APP_KEYS=$APP_KEYS
API_TOKEN_SALT=$API_TOKEN_SALT
ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Database
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_SSL=false

# CORS — origins allowed to POST the contact + calculator forms
CORS_ORIGINS=$FRONTEND_ORIGINS

# Email (SMTP)
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=$SMTP_SECURE
SMTP_USERNAME=$SMTP_USERNAME
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_FROM=$SMTP_FROM
SMTP_REPLY_TO=$SMTP_REPLY_TO
ENVEOF

chmod 600 /home/$STRAPI_USER/tehnicki_pregled/strapi/.env
chown -R $STRAPI_USER:$STRAPI_USER /home/$STRAPI_USER/

# --- Install dependencies and build the admin panel ---
echo "[9/9] Installing dependencies and building Strapi..."
sudo -u "$STRAPI_USER" bash <<USEREOF
set -euo pipefail
cd /home/$STRAPI_USER/tehnicki_pregled/strapi
npm ci
NODE_ENV=production npm run build
USEREOF

# --- Configure Caddy ---
cp /home/$STRAPI_USER/tehnicki_pregled/deploy/Caddyfile /etc/caddy/Caddyfile
sed -i "s/prvibalkan-cms.duckdns.org/$STRAPI_DOMAIN/g" /etc/caddy/Caddyfile
systemctl restart caddy

# --- Setup backup cron ---
cp /home/$STRAPI_USER/tehnicki_pregled/deploy/backup.sh /home/$STRAPI_USER/backup.sh
chmod +x /home/$STRAPI_USER/backup.sh
chown $STRAPI_USER:$STRAPI_USER /home/$STRAPI_USER/backup.sh

# Daily backup at 3 AM.
# `crontab -l` exits 1 when the user has no crontab yet. `set -e` propagates into
# subshells, so without the `|| true` the subshell aborts before the echo, the
# pipeline fails under pipefail, and the whole script dies silently here.
(crontab -u $STRAPI_USER -l 2>/dev/null || true; echo "0 3 * * * /home/$STRAPI_USER/backup.sh >> /home/$STRAPI_USER/logs/backup.log 2>&1") | crontab -u $STRAPI_USER -

# --- Start Strapi with PM2 ---
sudo -u "$STRAPI_USER" bash <<USEREOF
cd /home/$STRAPI_USER/tehnicki_pregled/strapi
pm2 start ecosystem.config.cjs
pm2 save
USEREOF

# PM2 startup on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $STRAPI_USER --hp /home/$STRAPI_USER

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "  Strapi URL:    https://$STRAPI_DOMAIN"
echo "  Strapi Admin:  https://$STRAPI_DOMAIN/admin"
echo "  DB Password:   $DB_PASSWORD"
echo ""
echo "  NEXT STEPS:"
echo "  1. Confirm https://$STRAPI_DOMAIN/admin loads over HTTPS."
echo "     If it hangs, ports 80/443 are open in only one of the two firewalls"
echo "     (VCN Security List vs. instance iptables) — check both."
echo "  2. Import content from Strapi Cloud (ERASES this server's database):"
echo "       pm2 stop strapi"
echo "       cd /home/$STRAPI_USER/tehnicki_pregled/strapi"
echo "       npx strapi transfer --from https://<cloud-project>.strapiapp.com/admin --from-token <PULL_TOKEN>"
echo "       pm2 start strapi"
echo "  3. Log into /admin with your Strapi Cloud credentials, then dedupe"
echo "     'locations' to 3 and 'settings' to 1."
echo "  4. Settings -> API Tokens: delete the transferred (now-invalid) tokens"
echo "     and create a fresh read-only token."
echo "  5. In Vercel set STRAPI_URL=https://$STRAPI_DOMAIN and the new"
echo "     STRAPI_API_TOKEN, then redeploy."
echo "  6. Recreate the Vercel deploy hook as a webhook in the new Strapi admin."
echo ""
