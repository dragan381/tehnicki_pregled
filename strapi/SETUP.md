# Strapi CMS Setup Guide

## Installation

```bash
# Create new Strapi project
npx create-strapi-app@latest strapi --quickstart

cd strapi
npm run develop
```

This opens Strapi admin at `http://localhost:1337/admin`

## Content Types to Create

### 1. **Location** (Collection Type)

Fields:

- `name` (Text) - Required
- `slug` (Text) - Required, Unique
- `address` (Text)
- `phone` (Text)
- `email` (Email)
- `latitude` (Number)
- `longitude` (Number)
- `description` (Rich Text)
- `image` (Media)
- `openingHours` (JSON)

### 2. **Service** (Collection Type)

Fields:

- `title` (Text) - Required
- `slug` (Text) - Required, Unique
- `description` (Rich Text)
- `icon` (Text) - Icon name (e.g., "check_circle")
- `price` (Number) - Optional
- `features` (JSON) - Array of features
- `image` (Media)

### 3. **Testimonial** (Collection Type)

Fields:

- `author` (Text) - Required
- `role` (Text)
- `content` (Rich Text) - Required
- `rating` (Number) - 1-5
- `image` (Media)

### 4. **Settings** (Single Type)

Fields:

- `siteName` (Text)
- `siteDescription` (Text)
- `logo` (Media)
- `phone` (Text)
- `email` (Email)
- `address` (Text)
- `socialLinks` (JSON)
- `hero` (JSON) - Title, description, image, CTA
- `aboutText` (Rich Text)

### 5. **FAQ** (Collection Type)

Fields:

- `question` (Text) - Required
- `answer` (Rich Text) - Required
- `category` (Text)

### 6. **BlogPost** (Collection Type)

Fields:

- `title` (Text) - Required
- `slug` (Text) - Required, Unique
- `content` (Rich Text) - Required
- `excerpt` (Text)
- `featured_image` (Media)
- `author` (Text)
- `publishedAt` (DateTime)
- `category` (Text)

## Database Setup

For production VPS, use PostgreSQL:

```bash
npm install pg
```

Update `config/database.js`:

```javascript
module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST", "localhost"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME"),
      user: env("DATABASE_USERNAME"),
      password: env("DATABASE_PASSWORD"),
    },
  },
});
```

## API Access

### Make Collections Public

1. Go to Settings → Roles → Public
2. Enable read access for each collection type

### API URL

- Development: `http://localhost:1337/api`
- Production: `https://your-vps-domain.com/api`

## Environment Variables

Create `.env` in Strapi root:

```
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_keys_here
API_TOKEN_SALT=your_salt_here
ADMIN_JWT_SECRET=your_secret_here
TRANSFER_TOKEN_SALT=your_salt_here

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=your_password
```

## Deploy to VPS

1. Install Node.js and PostgreSQL on VPS
2. Clone repo, install dependencies
3. Set environment variables
4. Run: `npm run build`
5. Use PM2 or systemd to manage process
6. Set up Nginx reverse proxy on port 80/443
