#!/bin/bash
# =============================================
# Deploy/Update Strapi on VPS
# Run as strapi user: ./deploy-strapi.sh
# =============================================

set -euo pipefail

STRAPI_DIR="/home/strapi/tehnicki_pregled/strapi"
REPO_BRANCH="${REPO_BRANCH:-main}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "[$DATE] Starting Strapi deployment..."

cd "$STRAPI_DIR/.."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin "$REPO_BRANCH"

cd "$STRAPI_DIR"

# Install dependencies.
# NOT `npm install --production`: that omits devDependencies, and Strapi 5
# needs `typescript` (a devDependency) to build a TypeScript project.
echo "Installing dependencies..."
npm ci

# Build Strapi
echo "Building Strapi..."
NODE_ENV=production npm run build

# Restart via PM2
echo "Restarting Strapi..."
pm2 restart strapi

echo "[$DATE] Deployment complete!"
echo "Checking status..."
sleep 3
pm2 status
