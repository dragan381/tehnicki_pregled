# Phase 0 — Get the data off Strapi Cloud

**Goal:** a verified, restorable copy of the Cloud CMS on your machine, before
anything is built on Oracle. Once this is done the Cloud expiry date stops being
a deadline.

Nothing here touches Oracle, the VPS, or the live site. It is read-only against
Cloud.

| | |
| --- | --- |
| Source | `https://playful-frog-24c9517ccc.strapiapp.com` |
| Local Strapi | 5.35.0 (`strapi/package.json`) |
| Content types | blog-posts, calculator-requests, contact-messages, faqs, locations, prices, services, settings, testimonials |
| Media fields | `blog-post.featured_image`, `location.coverImage`, `location.gallery` (multiple), `service.image`, `setting.logo`, `setting.heroImage`, `setting.insuranceCoverImage`, `testimonial.image` |

Do **Track A** and **Track B**. They fail in different ways, which is the point —
A is high fidelity but version-coupled, B is crude but works no matter what.

> **Track B cannot be complete on its own.** `contact-message` and
> `calculator-request` set `only: ['create']` in their routers, so the read
> endpoints do not exist and `GET /api/contact-messages` returns 404 for every
> token regardless of permissions. Those two collections — the customer form
> submissions — are reachable **only** through Track A, which reads at the
> entity level and bypasses the REST router. Track A is mandatory, not a
> second opinion.

---

## Track A — `strapi transfer` (the real backup)

Strapi's Data Transfer System moves entities, relations, media files, admin
users and roles, and config in one shot. This is what you actually restore from.

### A.1 Create a Transfer Token on Cloud

Cloud admin panel → **Settings → Transfer Tokens → Create new Transfer Token**

- Name: `phase-0-pull`
- Duration: **7 days**
- Type: **Full access**

Copy the token immediately — it is shown once.

### A.2 Check the version matches

Cloud admin → **Settings → Application** → note the Strapi version.

DTS refuses to run when source and destination versions differ. Local is
**5.35.0**. If Cloud reports something else, match it first:

```powershell
cd strapi
npm install @strapi/strapi@<cloud-version> @strapi/plugin-users-permissions@<cloud-version>
npm run build
```

> The `migration/off-strapi-cloud` branch already removed `@strapi/plugin-cloud`
> from `strapi/package.json`. Leave it removed — DTS does not need it.

### A.3 Protect the local database first

The pull **wipes** the local destination. There is a working SQLite DB at
`strapi/.tmp/data.db` from 2 April plus 33 files in `strapi/public/uploads`.

```powershell
mkdir backups\pre-pull-local
copy strapi\.tmp\data.db backups\pre-pull-local\data.db
xcopy strapi\public\uploads backups\pre-pull-local\uploads\ /E /I
```

### A.4 Pull

Local Strapi must **not** be running — the CLI starts its own instance.

```powershell
cd strapi
npx strapi transfer --from https://playful-frog-24c9517ccc.strapiapp.com/admin --from-token <token>
```

- The `/admin` suffix is required; DTS listens on the admin path, not `/api`.
- Answer `yes` to the destructive-overwrite prompt (that is A.3's local DB going away).
- Watch the summary table at the end — it lists a row count per type and an
  `assets` row. **`assets` must not be 0.**

Data lands in `strapi/.tmp/data.db`, images in `strapi/public/uploads/`.

### A.5 Turn it into an archive

```powershell
cd strapi
npx strapi export --no-encrypt --file ../backups/cloud-full-2026-08-18
```

Produces `backups/cloud-full-2026-08-18.tar.gz` — schemas, entities, links,
assets, config. This is the artifact worth keeping.

> `--no-encrypt` keeps it restorable without hunting for a key later. It contains
> customer contact messages, so treat the file as confidential and keep it out of
> git (`backups/` is already gitignored).

---

## Track B — REST + media pull (the escape hatch)

Independent of Strapi versions, transfer tokens, and DTS entirely. Run it even
if Track A worked — it is the copy you can still read in two years with `jq`.

### B.1 API token

The token in `.env.production` may be scoped. Make a clean one:

Cloud admin → **Settings → API Tokens → Create new API Token**
→ name `phase-0-read`, duration 7 days, type **Full access**.

Full access matters for two reasons: `contact-messages` and
`calculator-requests` are not publicly readable, and `/api/upload/files` needs
the Upload plugin's `find` permission to enumerate the whole media library.

### B.2 Run

```powershell
$env:STRAPI_API_TOKEN = "<token>"
node scripts/pull-strapi-cloud.mjs
```

Without the env var it falls back to `STRAPI_URL`/`STRAPI_API_TOKEN` from
`.env.production`.

Output — `backups/strapi-cloud-<timestamp>/`:

```
content/locations.json      per type, { published: [...], draft: [...] }
content/settings.json       ...one file per collection type
uploads/<hash>.<ext>        originals + every thumbnail/small/medium/large
media.json                  upload-library metadata (url, hash, mime, alt text)
manifest.json               counts, sha256 per file, byte total, failures
```

Re-running is safe and resumable — existing files are skipped, so a dropped
connection just means running it again.

### B.3 About the images specifically

This is the part that silently goes wrong, so:

- On Cloud, media is **not** in `strapi/public/uploads`. It lives on Cloud's own
  storage behind a CDN host, and each entry's `url` is an **absolute**
  `https://…` URL. Copying the repo gets you no images at all.
- Every upload has up to five physical files: the original plus the
  `thumbnail` / `small` / `medium` / `large` entries under `formats`. The script
  downloads all of them; grabbing only `url` loses the responsive variants and
  the frontend falls back to full-size originals.
- Files are saved under their hashed basename — exactly the flat layout Strapi's
  local upload provider expects in `public/uploads/`. So the folder drops
  straight into the Oracle box later.
- `media.json` preserves `alternativeText` and `caption`. Those live in the
  database, not in the image files, and are easy to lose.
- If `/api/upload/files` returns 403, the script scrapes media out of the entry
  payloads instead and says so. That recovers everything *referenced by content*
  but not unreferenced files sitting in the library — fix the token permission
  and re-run rather than accepting the fallback.

---

## Verification — the step that makes Phase 0 actually done

An untested backup is not a backup.

1. **Counts line up.** Compare `manifest.json` (Track B) against the transfer
   summary (Track A) and against what the Cloud admin panel shows per type.
2. **Restore into a scratch instance.**

   ```powershell
   git clone . ..\restore-test
   cd ..\restore-test\strapi
   npm install
   copy ..\..\tehnicki_pregled\strapi\.env .env
   npx strapi import --file ..\..\tehnicki_pregled\backups\cloud-full-2026-08-18.tar.gz
   npm run develop
   ```

   Log into `localhost:1337/admin` and confirm entries and images render in the
   media library.
3. **Point the frontend at it.** `STRAPI_URL=http://localhost:1337` in the root
   `.env`, then `npm run build`. A clean build off the restored data proves the
   copy is complete in the only way that counts.
4. **Store a second copy off this machine** — external drive or private cloud
   storage. It contains personal data, so not a public repo or a shared link.

Once step 3 passes, Cloud can expire.

---

## Also grab (not covered by either track)

- **Env vars from the Cloud project settings** — Cloud admin → project →
  Variables. `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`,
  `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`. Reusing the same values on Oracle
  keeps existing admin sessions and API tokens valid; new values invalidate
  them. Either is fine, but decide deliberately.
- **Webhooks** — Cloud admin → Settings → Webhooks. The Vercel deploy hook URL
  is configured there and DTS config transfer covers it, but note it down
  separately anyway.
- **A screenshot of the admin panel's entry counts per type**, for comparison
  after the Oracle restore.

## Cleanup

Revoke the `phase-0-pull` transfer token and the `phase-0-read` API token once
verification passes.
