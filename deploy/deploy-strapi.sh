#!/bin/bash
# =============================================
# Deploy/Update Strapi on VPS
# Run as strapi user: ./deploy-strapi.sh
# =============================================

set -euo pipefail

STRAPI_DIR="/home/strapi/tehnicki_pregled/strapi"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "[$DATE] Starting Strapi deployment..."

cd "$STRAPI_DIR/.."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

cd "$STRAPI_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Build Strapi
echo "Building Strapi..."
npm run build

# Restart via PM2
echo "Restarting Strapi..."
pm2 restart strapi

echo "[$DATE] Deployment complete!"
echo "Checking status..."
sleep 3
pm2 status
