#!/bin/bash

# Script de deploy para OmniX no Coolify
# Este script prepara e faz deploy da aplicação

set -e  # Exit on error

echo "🚀 Deploying OmniX to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
REGISTRY=${2:-ghcr.io/your-username}  # GitHub Container Registry or DockerHub

echo -e "${BLUE}📋 Deploy Configuration:${NC}"
echo "  Environment: $DEPLOY_ENV"
echo "  Registry: $REGISTRY"
echo ""

# Check requirements
echo -e "${YELLOW}🔍 Checking requirements...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All requirements met${NC}"

# Build images
echo -e "${YELLOW}🔨 Building images...${NC}"
./build.sh $REGISTRY

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
mkdir -p deploy
cp docker-compose.yml deploy/
cp .env.production deploy/.env
cp -r nginx deploy/

# Create Coolify-specific docker-compose
cat > deploy/docker-compose.coolify.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: ${REGISTRY}/omnix-backend:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://omnix.odois.dev
      - BACKEND_URL=https://api-omnix.odois.dev
      - WEBHOOK_URL=https://hook-omnix.odois.dev
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - EMAIL_FROM=${EMAIL_FROM}
      - SALVY_API_URL=${SALVY_API_URL}
      - SALVY_API_KEY=${SALVY_API_KEY}
      - SALVY_TENANT_ID=${SALVY_TENANT_ID}
      - WAHA_API_URL=${WAHA_API_URL}
      - WAHA_API_KEY=${WAHA_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - STRIPE_PRICE_ID_MONTHLY=${STRIPE_PRICE_ID_MONTHLY}
    networks:
      - coolify
    labels:
      - "coolify.managed=true"
      - "coolify.type=application"
      - "coolify.name=omnix-backend"
      - "coolify.domain=api-omnix.odois.dev,hook-omnix.odois.dev"
      - "coolify.port=3001"

  frontend:
    image: ${REGISTRY}/omnix-frontend:latest
    restart: unless-stopped
    networks:
      - coolify
    labels:
      - "coolify.managed=true"
      - "coolify.type=application"
      - "coolify.name=omnix-frontend"
      - "coolify.domain=omnix.odois.dev"
      - "coolify.port=8080"
    depends_on:
      - backend

networks:
  coolify:
    external: true
EOF

echo -e "${GREEN}✅ Deployment package created${NC}"

# Create deployment instructions
cat > deploy/README.md << 'EOF'
# OmniX Deployment Instructions for Coolify

## Prerequisites
1. Coolify installed and configured
2. Docker registry credentials configured in Coolify
3. DNS records configured:
   - omnix.odois.dev → Your server IP
   - api-omnix.odois.dev → Your server IP
   - hook-omnix.odois.dev → Your server IP

## Deployment Steps

### 1. Create New Application in Coolify
1. Go to Coolify dashboard
2. Click "New Application"
3. Select "Docker Compose"
4. Name it "OmniX"

### 2. Configure Environment Variables
Copy all variables from `.env` file to Coolify's environment variables section.

### 3. Configure Docker Compose
1. Paste the content of `docker-compose.coolify.yml` into Coolify
2. Set the registry path in environment variables

### 4. Configure Domains
1. Set `omnix.odois.dev` for frontend
2. Set `api-omnix.odois.dev` for backend API
3. Set `hook-omnix.odois.dev` for webhooks

### 5. Deploy
1. Click "Deploy"
2. Monitor logs for any issues
3. Wait for health checks to pass

### 6. Post-Deployment
1. Test frontend at https://omnix.odois.dev
2. Test API at https://api-omnix.odois.dev/health
3. Configure WAHA webhooks to use https://hook-omnix.odois.dev

## SSL Certificates
Coolify will automatically provision Let's Encrypt SSL certificates for all domains.

## Monitoring
- Frontend health: https://omnix.odois.dev/health
- Backend health: https://api-omnix.odois.dev/health

## Troubleshooting
1. Check Coolify logs
2. Verify environment variables
3. Check DNS propagation
4. Verify Docker registry access
EOF

echo -e "${GREEN}✅ Deployment instructions created${NC}"

# Zip deployment package
echo -e "${YELLOW}📦 Creating deployment archive...${NC}"
cd deploy
tar -czf omnix-deploy-$(date +%Y%m%d-%H%M%S).tar.gz *
cd ..

echo -e "${GREEN}🎉 Deployment package ready!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Upload deploy/omnix-deploy-*.tar.gz to your server"
echo "2. Extract and follow instructions in README.md"
echo "3. Configure in Coolify dashboard"
echo ""
echo -e "${GREEN}✨ Deployment preparation complete!${NC}"