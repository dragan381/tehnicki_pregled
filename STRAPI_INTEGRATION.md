# Strapi Integration Migration Guide

## Overview

This guide explains how to migrate your existing Astro components to use Strapi CMS data fetched at build time.

## Key Principles

- **Build-time fetching**: All Strapi data is fetched during `npm run build`
- **Static output**: Results in fully static HTML files
- **SEO-friendly**: Content is pre-rendered in HTML, perfect for search engines
- **Performance**: No runtime API calls = maximum speed

## Setup Steps

### 1. Set Up Strapi Locally

```bash
# In project root
npx create-strapi-app@latest strapi --quickstart
cd strapi
npm run develop
```

Open http://localhost:1337/admin and create admin account.

### 2. Create Content Types

Go to Settings → Content-Type Builder and create these collection types:

**Location**

- name (Text, Required)
- slug (Text, Required, Unique)
- address (Text)
- phone (Text)
- email (Email)
- description (Rich Text)
- image (Media - Single)
- openingHours (JSON)

**Service**

- title (Text, Required)
- slug (Text, Required, Unique)
- description (Rich Text)
- icon (Text)
- price (Number)
- features (JSON)
- image (Media - Single)

**Testimonial**

- author (Text, Required)
- role (Text)
- content (Rich Text, Required)
- rating (Number)
- image (Media - Single)

**FAQ**

- question (Text, Required)
- answer (Rich Text, Required)
- category (Text)

**BlogPost**

- title (Text, Required)
- slug (Text, Required, Unique)
- content (Rich Text, Required)
- excerpt (Text)
- featured_image (Media - Single)
- author (Text)
- publishedAt (DateTime)
- category (Text)

**Settings** (Single Type)

- siteName (Text)
- siteDescription (Text)
- phone (Text)
- email (Email)
- address (Text)
- hero (JSON)
- aboutText (Rich Text)

### 3. Enable Public API Access

Settings → Roles → Public → Check read access for all content types

### 4. Create API Token

Settings → API Tokens → Create new token

- Name: "Astro Build"
- Token type: "Read-only"
- Select all content types
- Copy token to `.env`

### 5. Set Environment Variables

```bash
# .env
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token_here
```

### 6. Populate Content

Add sample content through Strapi admin panel for each content type.

## Using Strapi Data in Astro

### Example: Homepage

```astro
---
import { getServices, getLocations, getTestimonials, getSettings } from '../utils/strapi';

const settings = await getSettings();
const services = await getServices();
const locations = await getLocations();
const testimonials = await getTestimonials();
---

<Layout title={settings?.siteName}>
  <Hero
    title={settings?.hero?.title}
    description={settings?.hero?.description}
    image={settings?.hero?.image}
  />

  <Services services={services} />
  <Locations locations={locations} />
  <Testimonials testimonials={testimonials} />
</Layout>
```

### Example: Services Component

```astro
---
interface Props {
  services: any[];
}

const { services } = Astro.props;
import { getStrapiImageUrl } from '../utils/strapi';
---

<section>
  {services.map(service => (
    <div>
      <img src={getStrapiImageUrl(service.image)} alt={service.title} />
      <h3>{service.title}</h3>
      <p>{service.description}</p>
      {service.price && <span>${service.price}</span>}
    </div>
  ))}
</section>
```

### Example: Dynamic Location Pages

**astro.config.mjs** (with getStaticPaths):

```astro
---
import { getLocations, getLocationBySlug } from '../utils/strapi';

export async function getStaticPaths() {
  const locations = await getLocations();

  return locations.map(location => ({
    params: { slug: location.slug },
    props: { location },
  }));
}

const { slug } = Astro.params;
const { location } = Astro.props;
---

<Layout title={location.name}>
  <h1>{location.name}</h1>
  <p>{location.address}</p>
  <p>{location.description}</p>
</Layout>
```

## Data Types

### Location

```typescript
interface Location {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  description: string;
  image: {
    url: string;
    name: string;
    alternativeText: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Service

```typescript
interface Service {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  price: number;
  features: string[];
  image: {
    url: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Build Process

```bash
# Development - Strapi runs separately
cd strapi && npm run develop  # Terminal 1
npm run dev                    # Terminal 2

# Production Build
STRAPI_URL=https://your-vps-domain.com STRAPI_API_TOKEN=your_token npm run build

# The build process:
# 1. npm run build triggers Astro build
# 2. Astro calls getStaticPaths and data-fetching functions
# 3. All Strapi API calls happen at build time
# 4. Static HTML generated with all content embedded
# 5. Output to dist/ folder
# 6. Deploy dist/ to GitHub Pages
```

## VPS Deployment

### Strapi on VPS

1. **Set up PostgreSQL**

```bash
sudo apt-get install postgresql postgresql-contrib
```

2. **Clone and setup Strapi**

```bash
git clone your-repo-with-strapi
cd strapi
npm install
```

3. **Configure environment** (`strapi/.env`):

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=secure_password
NODE_ENV=production
```

4. **Build and run**

```bash
npm run build
npm run start
```

5. **Use PM2 or systemd to manage process**

### Astro on GitHub Pages

1. GitHub Actions automatically builds when you push to main
2. Astro fetches from Strapi during build (via environment secrets)
3. Static HTML deployed to GitHub Pages

## Environment Variables on GitHub Actions

Set in GitHub repo Settings → Secrets → Actions:

- `STRAPI_URL`: Your VPS domain
- `STRAPI_API_TOKEN`: Your Strapi API token

Update `.github/workflows/deploy.yml`:

```yaml
- name: Build
  env:
    STRAPI_URL: ${{ secrets.STRAPI_URL }}
    STRAPI_API_TOKEN: ${{ secrets.STRAPI_API_TOKEN }}
  run: npm run build
```

## Incremental Static Regeneration (Optional)

If you want to update content without rebuilding:

1. Change astro.config to `output: 'hybrid'`
2. Mark pages with `export const prerender = false`
3. Use on-demand revalidation or scheduled builds

## SEO Benefits

✅ **Best practices implemented:**

- Content in HTML source = crawlable by all search engines
- Pre-rendered pages = fastest load times = better Core Web Vitals
- No JavaScript dependency = reliable indexing
- Structured data can be added easily
- Meta tags from Strapi content

## Content Update Workflow

1. Team member updates content in Strapi admin
2. Trigger manual rebuild on GitHub Actions (or set schedule)
3. New content deployed to GitHub Pages
4. No downtime, no cache issues

## Troubleshooting

### API token not working

- Check token is in `.env`
- Verify token has read access to all content types
- Check STRAPI_URL is correct

### Missing images

- Ensure `populate: '*'` is in Strapi queries
- Check media upload permissions in Strapi

### Build fails

- Run `npm run build` locally to see full error
- Check Strapi is running and accessible
- Verify all required fields are filled in Strapi

## Next Steps

1. Create Strapi project locally
2. Set up content types
3. Add API token to `.env`
4. Populate with sample content
5. Gradually migrate components from hardcoded to Strapi data
6. Test locally with `npm run build`
7. Deploy Strapi to VPS
8. Update GitHub Actions secrets
9. Commit and push to deploy
