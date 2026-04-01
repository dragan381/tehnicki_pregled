# Production Deployment Guide

## Architecture

```
[Vercel - Free]              [Contabo VPS S - ~€8.45/mo]
┌──────────────┐             ┌─────────────────────────┐
│  Astro SSG   │◄── build ──►│  Strapi 5 (PM2)         │
│  (static)    │   webhook   │  PostgreSQL 16           │
│  Global CDN  │             │  Caddy (reverse proxy)   │
└──────────────┘             │  Media uploads (disk)    │
                             │  Daily backups (cron)    │
                             └─────────────────────────┘
```

**Estimated cost: ~€8.45/month** (Contabo VPS S €6.99 + snapshot add-on €1.46)

---

## Step 1: Contabo VPS Setup

### 1.1 Create Server

1. Go to [Contabo](https://contabo.com/en/vps/) → VPS S SSD
2. **Region**: European Union (Germany) — closest to Serbia (~25ms latency)
3. **Image**: Ubuntu 24.04
4. **Type**: VPS S SSD (4 vCPU, 8GB RAM, 200GB SSD) — €6.99/mo
5. **Password**: Set a strong root password (you'll switch to SSH key later)
6. **Add-ons**: Enable Automatic Snapshots (€1.46/mo)
7. **Name**: `strapi-prod`
8. After provisioning, you'll receive the server IP and credentials via email

> **Tip**: Once logged in, add your SSH public key to `/root/.ssh/authorized_keys` and disable password auth for better security.

### 1.2 DNS Setup

> **Your setup**: Domain `prvibalkan.rs` registered at AdriaHost.rs, currently pointing to old hosting at `81.171.10.91`. You want to stop paying for AdriaHost hosting but keep the domain registered there.

Transfer nameservers to Vercel — Vercel becomes your DNS manager, you control all records from the Vercel dashboard. AdriaHost only handles domain registration (no hosting needed).

**Step 1**: Contact AdriaHost support and ask them to change the nameservers for `prvibalkan.rs` to:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

> AdriaHost currently uses `ns759.adriahost.com` and `ns760.adriahost.com`. You need AdriaHost to change these at the registrar level. This is a standard request — tell them: _"Molim vas da promenite nameservere za domen prvibalkan.rs na ns1.vercel-dns.com i ns2.vercel-dns.com"_

**Step 2**: After nameservers propagate (up to 24-48h), check DNS records in **Vercel Dashboard → [Domains](https://vercel.com/dashboard/domains) → prvibalkan.rs** (account-level, not project-level). Vercel auto-creates several records when you assign the domain to your project:

| Type    | Name  | Value                                                                  | Status                                                 |
| ------- | ----- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `ALIAS` |       | `ef763939a...vercel-dns-017.com`                                       | Auto-created by Vercel — don't touch                   |
| `ALIAS` | `*`   | `cname.vercel-dns-017.com`                                             | Auto-created by Vercel — don't touch                   |
| `CAA`   |       | `pki.goog`, `sectigo.com`, `letsencrypt.org`                           | Auto-created by Vercel — don't touch                   |
| `A`     | `cms` | `YOUR_CONTABO_IP`                                                      | **Add manually** after Contabo is ready                |
| `TXT`   | `@`   | `google-site-verification=uzf2ILrgzovnuE_g2PQ-TRW3TSSDbdgHeviC4zLMxSA` | **Add manually** (optional, for Google Search Console) |

> **How to add the `cms` record**: In Vercel Dashboard → Domains → prvibalkan.rs → DNS Records → click **Add Record** → Type: `A`, Name: `cms`, Value: your Contabo server IP address.

**Step 3**: Cancel AdriaHost hosting plan (keep only domain registration).

---

#### DNS Records Summary (Final State)

After setup, your DNS should look like this:

```
prvibalkan.rs        ALIAS  →  Vercel (auto-managed)
www.prvibalkan.rs    ALIAS  →  Vercel (auto-managed via wildcard *)
cms.prvibalkan.rs    A      →  Contabo VPS IP (your Strapi server)
```

DNS propagation takes **5 minutes to 48 hours**. Use [dnschecker.org](https://dnschecker.org) to verify.

### 1.3 Run Setup Script

```bash
ssh root@YOUR_CONTABO_IP

# Upload and run the setup script
curl -sL https://raw.githubusercontent.com/dragan381/tehnicki_pregled/main/deploy/setup-vps.sh -o setup-vps.sh

# Edit the variables at the top of the script:
nano setup-vps.sh
# Change STRAPI_DOMAIN="cms.yourdomain.com" to "cms.prvibalkan.rs"

chmod +x setup-vps.sh
./setup-vps.sh
```

**IMPORTANT**: Save the database password shown at the end of the script!

### 1.4 Create First Admin User

Visit `https://cms.prvibalkan.rs/admin` and create your admin account.

---

## Step 2: Vercel Deployment (Astro Frontend)

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `dragan381/tehnicki_pregled` from GitHub
3. **Framework**: Astro (auto-detected)
4. **Root Directory**: `.` (root, not strapi/)

### 2.2 Add Custom Domain

1. Vercel → Project → Settings → Domains
2. Add `prvibalkan.rs`
3. Also add `www.prvibalkan.rs` (Vercel will auto-redirect)
4. Vercel will show "Invalid Configuration" until DNS propagates — this is normal

### 2.3 Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable           | Value                                            |
| ------------------ | ------------------------------------------------ |
| `STRAPI_URL`       | `https://cms.prvibalkan.rs`                      |
| `STRAPI_API_TOKEN` | Generate in Strapi Admin → Settings → API Tokens |
| `SITE_URL`         | `https://prvibalkan.rs`                          |

---

## Step 3: Vercel Build Hook (Auto-rebuild on Content Change)

### 3.1 Create Deploy Hook

1. Vercel → Project → Settings → Git → Deploy Hooks
2. Name: `strapi-content-update`, Branch: `release` (matches your vercel.json deployment branch)
3. Copy the webhook URL

### 3.2 Configure Strapi Webhook

1. Strapi Admin → Settings → Webhooks → Add new webhook
2. **Name**: `Vercel Rebuild`
3. **URL**: Paste the Vercel deploy hook URL
4. **Events**: Select all content-type events (entry.create, entry.update, entry.delete, entry.publish, entry.unpublish)

Now whenever you publish content in Strapi, Vercel will automatically rebuild the site.

---

## Maintenance

### Deploy Strapi Updates

```bash
ssh strapi@YOUR_SERVER_IP
./tehnicki_pregled/deploy/deploy-strapi.sh
```

### Manual Backup

```bash
ssh strapi@YOUR_SERVER_IP
./backup.sh
```

### Restore Database

```bash
pg_restore -U strapi -d strapi -c /home/strapi/backups/db_YYYY-MM-DD_HH-MM-SS.dump
```

### View Strapi Logs

```bash
ssh strapi@YOUR_SERVER_IP
pm2 logs strapi
pm2 monit  # real-time monitoring
```

### Restart Strapi

```bash
pm2 restart strapi
```

---

## Backup Strategy

| Layer           | Method            | Frequency     | Retention       |
| --------------- | ----------------- | ------------- | --------------- |
| **Database**    | `pg_dump` cron    | Daily 3 AM    | 14 days         |
| **Uploads**     | tar.gz cron       | Daily 3 AM    | 14 days         |
| **Full Server** | Contabo snapshots | Weekly (auto) | Latest snapshot |
| **Code**        | Git (GitHub)      | Every push    | Unlimited       |

---

## Security Checklist

- [x] UFW firewall (only SSH, HTTP, HTTPS)
- [x] Fail2Ban for SSH brute-force protection
- [x] Caddy auto-HTTPS (Let's Encrypt)
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] CORS restricted to frontend domain
- [x] Strapi runs as non-root user
- [x] Strong auto-generated secrets
- [ ] Enable SSH key-only login (disable password auth in `/etc/ssh/sshd_config`)
- [ ] Setup monitoring (UptimeRobot free tier — monitors https://cms.prvibalkan.rs)
- [ ] Enable Contabo automatic snapshots in the Customer Control Panel
