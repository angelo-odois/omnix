#!/bin/bash

# Script de build para OmniX
# Este script constrói as imagens Docker e as prepara para deploy

set -e  # Exit on error

echo "🚀 Building OmniX Docker images..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo "Please copy .env.production.example and configure your environment variables"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${YELLOW}📦 Building Backend...${NC}"
cd backend
docker build -t omnix-backend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend built successfully${NC}"
else
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
cd ..

echo -e "${YELLOW}📦 Building Frontend...${NC}"
cd frontend
docker build \
    --build-arg VITE_API_BASE_URL=https://api-omnix.odois.dev/api \
    --build-arg VITE_WEBHOOK_BASE_URL=https://hook-omnix.odois.dev \
    -t omnix-frontend:latest .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}🎉 All images built successfully!${NC}"

# Optional: Tag images for registry
if [ ! -z "$1" ]; then
    REGISTRY=$1
    echo -e "${YELLOW}🏷️  Tagging images for registry: $REGISTRY${NC}"
    
    docker tag omnix-backend:latest $REGISTRY/omnix-backend:latest
    docker tag omnix-frontend:latest $REGISTRY/omnix-frontend:latest
    
    echo -e "${GREEN}✅ Images tagged${NC}"
    
    # Optional: Push to registry
    read -p "Do you want to push images to registry? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📤 Pushing images...${NC}"
        docker push $REGISTRY/omnix-backend:latest
        docker push $REGISTRY/omnix-frontend:latest
        echo -e "${GREEN}✅ Images pushed to registry${NC}"
    fi
fi

echo -e "${GREEN}✨ Build complete!${NC}"
echo ""
echo "To run locally with docker-compose:"
echo "  docker-compose up -d"
echo ""
echo "To deploy to production:"
echo "  1. Push images to your registry"
echo "  2. Deploy using Coolify or your preferred platform"