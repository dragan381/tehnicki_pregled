# Production Deployment Guide

## Architecture

```
[Vercel - Free]              [Hetzner VPS CX22 - ~€5.40/mo]
┌──────────────┐             ┌─────────────────────────┐
│  Astro SSG   │◄── build ──►│  Strapi 5 (PM2)         │
│  (static)    │   webhook   │  PostgreSQL 16           │
│  Global CDN  │             │  Caddy (reverse proxy)   │
└──────────────┘             │  Media uploads (disk)    │
                             │  Daily backups (cron)    │
                             └─────────────────────────┘
```

**Estimated cost: ~€5.40/month** (Hetzner CX22 + automated snapshots)

---

## Step 1: Hetzner VPS Setup

### 1.1 Create Server

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create new project → Add Server
3. **Location**: Falkenstein (EU, closest to Serbia)
4. **Image**: Ubuntu 24.04
5. **Type**: CX22 (2 vCPU, 4GB RAM, 40GB disk) — €4.51/mo
6. **SSH Key**: Add your public SSH key
7. **Backups**: Enable (€0.90/mo — automated weekly snapshots)
8. **Name**: `strapi-prod`

### 1.2 DNS Setup

Point your Strapi subdomain to the server IP:

```
A  cms.yourdomain.com  →  YOUR_SERVER_IP
```

### 1.3 Run Setup Script

```bash
ssh root@YOUR_SERVER_IP

# Upload and run the setup script
curl -sL https://raw.githubusercontent.com/dragan381/tehnicki_pregled/main/deploy/setup-vps.sh -o setup-vps.sh

# Edit the variables at the top of the script:
nano setup-vps.sh
# Change STRAPI_DOMAIN="cms.yourdomain.com" to your actual domain

chmod +x setup-vps.sh
./setup-vps.sh
```

**IMPORTANT**: Save the database password shown at the end of the script!

### 1.4 Create First Admin User

Visit `https://cms.yourdomain.com/admin` and create your admin account.

---

## Step 2: Vercel Deployment (Astro Frontend)

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import `dragan381/tehnicki_pregled` from GitHub
3. **Framework**: Astro (auto-detected)
4. **Root Directory**: `.` (root, not strapi/)

### 2.2 Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable           | Value                                            |
| ------------------ | ------------------------------------------------ |
| `STRAPI_URL`       | `https://cms.yourdomain.com`                     |
| `STRAPI_API_TOKEN` | Generate in Strapi Admin → Settings → API Tokens |
| `SITE_URL`         | `https://yourdomain.com` (or your Vercel URL)    |

### 2.3 Custom Domain (Optional)

In Vercel → Settings → Domains, add your custom domain.

---

## Step 3: Vercel Build Hook (Auto-rebuild on Content Change)

### 3.1 Create Deploy Hook

1. Vercel → Project → Settings → Git → Deploy Hooks
2. Name: `strapi-content-update`, Branch: `main`
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

| Layer           | Method            | Frequency     | Retention   |
| --------------- | ----------------- | ------------- | ----------- |
| **Database**    | `pg_dump` cron    | Daily 3 AM    | 14 days     |
| **Uploads**     | tar.gz cron       | Daily 3 AM    | 14 days     |
| **Full Server** | Hetzner snapshots | Weekly (auto) | 3 snapshots |
| **Code**        | Git (GitHub)      | Every push    | Unlimited   |

---

## Security Checklist

- [x] UFW firewall (only SSH, HTTP, HTTPS)
- [x] Fail2Ban for SSH brute-force protection
- [x] Caddy auto-HTTPS (Let's Encrypt)
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] CORS restricted to frontend domain
- [x] Strapi runs as non-root user
- [x] Strong auto-generated secrets
- [ ] Enable SSH key-only login (disable password auth)
- [ ] Setup monitoring (UptimeRobot free tier)
