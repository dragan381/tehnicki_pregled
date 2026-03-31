#!/bin/bash
# =============================================
# Contabo VPS Setup Script for Strapi + PostgreSQL
# Run as root on a fresh Ubuntu 24.04 LTS server
# Tested on: Contabo VPS S SSD (4 vCPU, 8GB RAM)
# =============================================

set -euo pipefail

echo "============================================"
echo "  Strapi Production Server Setup"
echo "============================================"

# --- Variables (customize these) ---
STRAPI_USER="strapi"
STRAPI_DOMAIN="cms.prvibalkan.rs"
NODE_VERSION="20"
REPO_URL="https://github.com/dragan381/tehnicki_pregled.git"

# --- System Updates ---
echo "[1/8] Updating system..."
apt update && apt upgrade -y
apt install -y curl git build-essential ufw fail2ban

# --- Firewall ---
echo "[2/8] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# --- Fail2Ban (SSH protection) ---
systemctl enable fail2ban
systemctl start fail2ban

# --- Create strapi user ---
echo "[3/8] Creating strapi user..."
if ! id "$STRAPI_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$STRAPI_USER"
  usermod -aG sudo "$STRAPI_USER"
fi
mkdir -p /home/$STRAPI_USER/logs
mkdir -p /home/$STRAPI_USER/backups

# --- Install Node.js ---
echo "[4/8] Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
npm install -g pm2

# --- Install PostgreSQL ---
echo "[5/8] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Create database and user
DB_PASSWORD=$(openssl rand -base64 24)
sudo -u postgres psql <<EOF
CREATE USER strapi WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE strapi OWNER strapi;
GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;
EOF

echo ""
echo "  !! SAVE THIS DATABASE PASSWORD: $DB_PASSWORD"
echo ""

# --- Install Caddy ---
echo "[6/8] Installing Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
mkdir -p /var/log/caddy

# --- Clone & Setup Strapi ---
echo "[7/8] Setting up Strapi..."
sudo -u "$STRAPI_USER" bash <<USEREOF
cd /home/$STRAPI_USER
git clone $REPO_URL
cd tehnicki_pregled/strapi

# Install pg driver (replacing SQLite for production)
npm install pg
npm install
npm run build
USEREOF

# --- Generate Strapi Secrets ---
echo "[8/8] Generating environment file..."
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

# CORS
CORS_ORIGINS=https://prvibalkan.rs,https://www.prvibalkan.rs,https://tehnicki-pregled.vercel.app

# Email (configure these manually)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USERNAME=your_email@gmail.com
# SMTP_PASSWORD=your_app_password
# SMTP_FROM=your_email@gmail.com
# SMTP_REPLY_TO=your_email@gmail.com
ENVEOF

chown -R $STRAPI_USER:$STRAPI_USER /home/$STRAPI_USER/

# --- Configure Caddy ---
cp /home/$STRAPI_USER/tehnicki_pregled/deploy/Caddyfile /etc/caddy/Caddyfile
sed -i "s/cms.prvibalkan.rs/$STRAPI_DOMAIN/g" /etc/caddy/Caddyfile
systemctl restart caddy

# --- Setup backup cron ---
cp /home/$STRAPI_USER/tehnicki_pregled/deploy/backup.sh /home/$STRAPI_USER/backup.sh
chmod +x /home/$STRAPI_USER/backup.sh
chown $STRAPI_USER:$STRAPI_USER /home/$STRAPI_USER/backup.sh

# Daily backup at 3 AM
(crontab -u $STRAPI_USER -l 2>/dev/null; echo "0 3 * * * /home/$STRAPI_USER/backup.sh >> /home/$STRAPI_USER/logs/backup.log 2>&1") | crontab -u $STRAPI_USER -

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
echo "  1. Point DNS A record for $STRAPI_DOMAIN to this server's IP"
echo "  2. Edit CORS_ORIGINS in /home/$STRAPI_USER/tehnicki_pregled/strapi/.env"
echo "  3. Configure SMTP settings in .env for email"
echo "  4. Create first admin user at https://$STRAPI_DOMAIN/admin"
echo "  5. Set STRAPI_URL and STRAPI_API_TOKEN in Vercel env vars"
echo "  6. Enable Contabo automatic snapshots in the Customer Control Panel"
echo ""
