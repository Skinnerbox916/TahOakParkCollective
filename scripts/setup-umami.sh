#!/bin/bash

# Umami Setup Script for TahOak Park Collective
# This script helps automate the Umami analytics setup process

set -e

echo "🚀 Setting up Umami Analytics for TahOak Park Collective"
echo ""

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Start Umami services
echo "📦 Starting Umami services..."
docker compose up -d umami umami-db

echo ""
echo "⏳ Waiting for Umami to be ready (this may take a minute)..."
sleep 10

# Check if Umami is running
if docker compose ps umami | grep -q "Up"; then
    echo "✅ Umami services are running!"
else
    echo "❌ Umami services failed to start. Check logs with: docker compose logs umami"
    exit 1
fi

UMAMI_URL="${UMAMI_URL:-http://localhost:3001}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Umami Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Access the dashboard at: $UMAMI_URL"
echo ""
echo "🔑 Default credentials:"
echo "   Username: admin"
echo "   Password: umami"
echo ""
echo "📝 Next steps:"
echo "   1. Log in to the Umami dashboard"
echo "   2. Create a new website"
echo "   3. Copy the Website ID"
echo "   4. Add to your .env file:"
echo "      NEXT_PUBLIC_UMAMI_WEBSITE_ID=<your-website-id>"
echo "      NEXT_PUBLIC_UMAMI_DASHBOARD_URL=$UMAMI_URL"
echo ""
echo "   5. Restart the web container:"
echo "      docker compose restart tahoak-web"
echo ""
echo "✨ Once configured, analytics will be available in the admin panel!"
echo ""

