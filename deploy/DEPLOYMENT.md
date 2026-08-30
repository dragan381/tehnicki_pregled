# Production Deployment Guide

## Architecture

```
[Vercel — free]                      [Oracle Cloud Always Free — Frankfurt]
┌──────────────┐                     ┌──────────────────────────────────┐
│  Astro SSG   │◄── build fetch ────►│  Caddy (auto-HTTPS, :80/:443)    │
│  (static)    │                     │    └─► Strapi 5 (PM2, :1337)     │
│  Global CDN  │── form POSTs ──────►│  PostgreSQL 16 (localhost)       │
└──────────────┘                     │  Media uploads → local disk      │
       ▲                             │  Daily pg_dump + uploads backup  │
       └──── deploy webhook ─────────┘
```

**Cost: $0/month.** Oracle Cloud's Always Free tier is permanent, not a trial.

The frontend talks to the CMS through exactly one variable — `STRAPI_URL`. Nothing
in `src/` is aware of where Strapi is hosted.

---

## Step 1: Oracle Cloud VM

### 1.1 Create the account

Sign up at [cloud.oracle.com](https://cloud.oracle.com).

> **⚠️ Set the home region to `eu-frankfurt-1` (Germany — Central).**
> This is **permanent**. Always Free resources only qualify in the tenancy's home
> region, and the home region cannot be changed afterwards. Picking the wrong one
> means starting over with a new account. Frankfurt is also the closest free
> region to Serbia and has reliable ARM capacity.

A payment card is required for identity verification. Always Free resources are
not charged.

### 1.2 Create the instance

Compute → Instances → Create instance:

| Setting | Value |
| --- | --- |
| Image | **Ubuntu 24.04** (aarch64 / ARM) |
| Shape | **VM.Standard.A1.Flex** |
| OCPUs / Memory | **1 OCPU / 6 GB** |
| Boot volume | 50 GB (default) |
| SSH key | upload your public key |

> If you see **"Out of host capacity"**, just retry — Frankfurt normally clears
> within minutes. The Always Free allocation is 4 OCPU / 24 GB total, so 1/6 uses
> a quarter of it and leaves room to grow.

### 1.3 Reserve a static public IP

First create the address: **Networking → IP management → Reserved public IPs →
Reserve public IP address**. Name it `strapi-cms-ip`, source **Oracle**, and make
sure it is in the **same region as the instance**. It should show as `Available`.

Then attach it — and note this takes **two passes** through the same dialog,
because a private IP can only hold one public IP, so the console will not offer
"Reserved" while an ephemeral one is still attached:

Instance → **Details** → **Attached VNICs** → the primary VNIC → **IP
administration** → **Edit** on the primary private IP row (`10.0.0.x`), then:

1. Select **No public IP** → **Update**. The ephemeral address is released
   immediately and permanently — your SSH session will drop.
2. Re-open the same **Edit** dialog. The **Reserved public IP** radio is now
   present; pick `strapi-cms-ip` from the dropdown → **Update**.

**The reserved IP for this deployment is `92.5.61.105`** — it is written into
the `ssh`/`scp` commands throughout this doc.

Free, and it stops the DNS record from going stale after a reboot.

> The **IP lifetime** column on the IP administration table may still read
> `Ephemeral` after the swap — that is a console display quirk. The `(Reserved)`
> parenthetical next to the public IP is authoritative, as is the entry showing
> `Assigned` under Networking → IP management → Reserved public IPs. To settle it
> for certain: `oci network public-ip get --public-ip-address 92.5.61.105` should
> report `"lifetime": "RESERVED"`.

### 1.4 Open ports 80 and 443 — in **both** firewalls

This trips up almost everyone. Oracle filters traffic in two independent places
and both must allow the port:

**a) VCN Security List** (the cloud-side firewall)

Networking → Virtual Cloud Networks → your VCN → Security Lists → Default →
Add Ingress Rules:

| Source CIDR | Protocol | Destination Port |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

**b) Instance `iptables`** (the OS-side firewall)

Oracle's Ubuntu images ship with restrictive `iptables` rules persisted by
`netfilter-persistent`. `setup-vps.sh` handles this automatically in step `[2/9]`.

> **Symptom if you get this wrong:** the site simply hangs, and Caddy never
> obtains a certificate because Let's Encrypt cannot reach port 80 for the
> HTTP-01 challenge. If HTTPS never comes up, check both firewalls first.

### 1.5 DNS

Oracle does not give compute instances a hostname, only a bare IP — and HTTPS is
mandatory here, because the site is served over HTTPS and browsers block form
POSTs from an HTTPS page to an `http://` endpoint as mixed content.

Register a free subdomain at [duckdns.org](https://www.duckdns.org) (sign in with
GitHub/Google), e.g. `prvibalkan-cms`, and point it at `92.5.61.105`.

> **Why DuckDNS and not sslip.io/nip.io?** `duckdns.org` is on the Public Suffix
> List, so each subdomain gets its own Let's Encrypt rate-limit budget.
> `sslip.io` and `nip.io` are not, so every certificate issued for them worldwide
> shares one budget and issuance fails unpredictably.

**Upgrading to `cms.prvibalkan.rs` later** is three small edits — an `A` record at
your DNS provider, the hostname in [`Caddyfile`](Caddyfile), and `STRAPI_URL` in
Vercel. You are not locked in.

### 1.6 Run the setup script

```bash
ssh ubuntu@92.5.61.105

curl -sL https://raw.githubusercontent.com/dragan381/tehnicki_pregled/main/deploy/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh

sudo STRAPI_DOMAIN='prvibalkan-cms.duckdns.org' \
     SMTP_USERNAME='your_email@gmail.com' \
     SMTP_PASSWORD='your_gmail_app_password' \
     ./setup-vps.sh
```

SMTP credentials are passed as environment variables rather than written into the
repo. Without them Strapi installs fine, but the contact and calculator forms will
not send email.

**Save the database password printed at the end.**

### 1.7 (Recommended) Avoid idle reclamation

Oracle may **stop** an Always Free instance that has, over 7 consecutive days,
CPU (95th percentile) < 20% **and** network < 20% **and** memory < 20%. All three
must be true. The instance is stopped, not deleted — the boot volume and your data
survive and it can be restarted — but the CMS is down until you notice, which
also takes the website's forms down.

Two mitigations, use either or both:

- **Convert the tenancy to Pay As You Go.** This exempts the instance entirely and
  still costs $0 while you stay inside Always Free limits. Pair it with a **budget
  alert at $1** (Billing → Budgets) so any accidental overage surfaces immediately.
- **Monitor it.** Add a free [UptimeRobot](https://uptimerobot.com) check against
  `https://<your-domain>/_health` every 5 minutes.

---

## Step 2: Import content from the Phase 0 archive

One-time, during migration only.

Phase 0 already pulled everything off Cloud — see
[`PHASE0-EXTRACTION.md`](PHASE0-EXTRACTION.md). Import from that archive rather
than pulling from Cloud again:

```bash
scp backups/cloud-full-2026-08-21.tar.gz strapi@92.5.61.105:~/

ssh strapi@92.5.61.105
pm2 stop strapi          # import must run with the app not serving

cd /home/strapi/tehnicki_pregled/strapi
npx strapi import --file ~/cloud-full-2026-08-21.tar.gz

pm2 start strapi
```

Why the archive and not a live pull:

- **Cloud no longer has to be alive.** The migration is decoupled from the expiry
  date entirely.
- **Repeatable.** Wreck the VPS and re-import as many times as you like. A live
  pull needs a fresh token each time and only works while Cloud runs.
- **No version coupling.** A live `transfer` aborts if Cloud's Strapi version
  differs from the VPS. The archive was written by 5.35.0 and imports into 5.35.0.
- **SQLite → PostgreSQL is fine.** The archive was exported from a local SQLite
  DB, but DTS works at the entity level, not the SQL level. The VPS's Postgres
  is a valid destination.

Notes:

- Do **not** pass `--exclude files` — the media library is the point. Expect
  **95 assets** and **250 entities** in the summary table.
- **`strapi import` erases the destination first.** Safe on a fresh server,
  destructive later. See the warning in [`strapi/README.md`](../strapi/README.md).
- The archive is unencrypted, so no `--key` is needed. It contains customer
  contact messages — delete it from the VPS home directory once the import
  succeeds.

<details>
<summary>Fallback: pull live from Cloud instead</summary>

Only if the archive is unusable and Cloud is still running. Requires a **Pull**
transfer token from Cloud admin → Settings → Transfer Tokens, and Cloud's Strapi
version must match the VPS's.

```bash
npx strapi transfer \
  --from https://playful-frog-24c9517ccc.strapiapp.com/admin \
  --from-token <PULL_TOKEN>
```

The `--from` URL **must** end in `/admin`.
</details>

### After the import

Log in at `https://<your-domain>/admin` with your **Strapi Cloud credentials** —
admin users transfer across, and bcrypt password hashes are independent of the
server's secrets.

- **Confirm counts in the Content Manager** — 3 locations, 1 settings entry, 2
  prices, 4 services, 3 blog posts, 6 FAQs, 3 testimonials.

  > Do **not** dedupe based on raw database row counts. Strapi 5 stores a draft
  > row *and* a published row per document, so `SELECT COUNT(*) FROM locations`
  > returns 6 for 3 locations. That is correct and expected. Verified 2026-08-21:
  > every type has exactly 2 rows per document and there are no duplicates.
  > `getSettings()` reads index `[0]`, so it matters that there is genuinely one
  > settings *document* — there is.

- Confirm the Media Library renders **29 files** (95 on disk, counting the
  thumbnail/small/medium/large variants Strapi generates per image).
- Settings → **API Tokens**: the transferred tokens are hashed against the old
  server's `API_TOKEN_SALT` and no longer work. Delete them and create a fresh
  **read-only** token.
- Settings → Users & Permissions → **Public** role: confirm `create` is enabled on
  `contact-message` and `calculator-request` (the website forms need it).

---

## Step 3: Vercel (Astro frontend)

### 3.1 Environment variables

Vercel → Project → Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `STRAPI_URL` | `https://prvibalkan-cms.duckdns.org` |
| `STRAPI_API_TOKEN` | the read-only token created above |
| `SITE_URL` | `https://prvibalkan.rs` |

Redeploy.

> **Verify the rendered pages, not just the build status.** `src/utils/strapi.ts`
> swallows fetch errors and returns `[]`, so a bad URL or dead token produces a
> green build that ships an **empty site**.

### 3.2 Auto-rebuild on content change

1. Vercel → Settings → Git → **Deploy Hooks** → name `strapi-content-update`,
   branch `release` (matching `vercel.json`). Copy the URL.
2. Strapi admin → Settings → **Webhooks** → Add new webhook → paste the URL →
   select all entry events (create, update, delete, publish, unpublish).

---

## Step 4: Decommission Strapi Cloud

Only after everything above is verified:

1. Delete the old Cloud → Vercel webhook.
2. Revoke the Cloud transfer and API tokens.
3. Delete the Strapi Cloud project.

Keep an offline copy of the migrated data for at least a month.

---

## Maintenance

### Deploy Strapi updates

```bash
ssh strapi@92.5.61.105
./tehnicki_pregled/deploy/deploy-strapi.sh
```

### Manual backup

```bash
ssh strapi@92.5.61.105
./backup.sh
```

### Restore database

```bash
pg_restore -U strapi -d strapi -c /home/strapi/backups/db_YYYY-MM-DD_HH-MM-SS.dump
```

### Logs and process control

```bash
pm2 logs strapi
pm2 monit
pm2 restart strapi
```

### Caddy / HTTPS

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 100     # certificate errors show up here
```

Certificates renew automatically; no cron needed.

---

## Backup Strategy

| Layer | Method | Frequency | Retention |
| --- | --- | --- | --- |
| **Database** | `pg_dump` cron | Daily 3 AM | 14 days |
| **Uploads** | tar.gz cron | Daily 3 AM | 14 days |
| **Boot volume** | OCI volume backup | Manual/policy | 5 backups (free tier limit) |
| **Code** | Git (GitHub) | Every push | Unlimited |

> Backups live on the same disk as the data they protect. Periodically copy a
> `db_*.dump` off the server — `scp strapi@92.5.61.105:~/backups/db_*.dump .`

---

## Security Checklist

- [x] Instance firewall via iptables/netfilter-persistent (only SSH, HTTP, HTTPS)
- [x] Oracle instance `iptables` rules for 80/443
- [x] Fail2Ban for SSH brute-force protection
- [x] Caddy auto-HTTPS (Let's Encrypt)
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] CORS restricted to the frontend origins via `CORS_ORIGINS`
- [x] Strapi runs as a non-root user
- [x] Strong auto-generated secrets; `.env` is `chmod 600`
- [x] SMTP credentials passed at runtime, never committed
- [ ] Disable SSH password auth in `/etc/ssh/sshd_config` (Oracle images default to key-only, verify)
- [ ] Set up UptimeRobot monitoring
- [ ] Convert tenancy to Pay As You Go + $1 budget alert (idle-reclamation exemption)
