# 🚀 Configuração Coolify - OmniX

## ✅ **Problema Resolvido**

Erros de deploy corrigidos com Dockerfile na raiz e configurações adequadas.

## 🔧 **Configuração no Coolify**

### **1. Configurar Source**
- **Repository**: `https://github.com/angelo-odois/omnix.git`
- **Branch**: `main`
- **Build Pack**: `Docker`

### **2. Configurar Build**
- **Dockerfile Location**: `/Dockerfile` (raiz do projeto)
- **Docker Context**: `/` (raiz)
- **Port**: `8301`

### **3. Variáveis de Ambiente**
Configure no Coolify > Environment Variables:

```env
NODE_ENV=production
PORT=8301
JWT_SECRET=seu-jwt-secret-forte
FRONTEND_URL=https://omnix.odois.dev
BACKEND_URL=https://api-omnix.odois.dev
WEBHOOK_URL=https://hook-omnix.odois.dev

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
EMAIL_FROM="OmniX <noreply@omnix.odois.dev>"

# Salvy API
SALVY_API_URL=https://api.salvy.app
SALVY_API_KEY=sua-chave-salvy
SALVY_TENANT_ID=seu-tenant-id

# WAHA API
WAHA_API_URL=https://waha.nexuso2.com
WAHA_API_KEY=sua-chave-waha

# Stripe
STRIPE_SECRET_KEY=sua-chave-stripe
STRIPE_WEBHOOK_SECRET=seu-webhook-secret
```

### **4. Domain Configuration**
- **Domain**: `api-omnix.odois.dev`
- **Port**: `8301`
- **Protocol**: `HTTPS`

## 📋 **Deploy Separado (Recomendado)**

Para melhor controle, configure 2 aplicações no Coolify:

### **App 1: Backend API**
- **Name**: `omnix-backend`
- **Domain**: `api-omnix.odois.dev`
- **Port**: `8301`
- **Dockerfile**: `/Dockerfile` (já criado)

### **App 2: Frontend**
- **Name**: `omnix-frontend`
- **Domain**: `omnix.odois.dev`
- **Port**: `8580`
- **Build Pack**: `Node.js` ou `Static`
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s dist -p 8580`
- **Working Directory**: `/frontend`

## 🔄 **Deploy Alternativo via Docker Compose**

Se preferir deploy único, use:

1. **Coolify**: Selecione "Docker Compose"
2. **File**: `docker-compose.prod.yml`
3. **Services**: backend + frontend juntos

## 🛠️ **Dockerfile na Raiz (Criado)**

```dockerfile
# Build backend Node.js + TypeScript
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci && npm cache clean --force
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npm run build
RUN npm ci --only=production
EXPOSE 8301
CMD ["npm", "start"]
```

## ✅ **Próximos Passos**

1. **Commit** as mudanças para o GitHub
2. **Configurar** variáveis no Coolify
3. **Deploy** novamente
4. **Testar** endpoints

## 🎯 **URLs Finais**
- **Backend**: https://api-omnix.odois.dev
- **Frontend**: https://omnix.odois.dev
- **Health**: https://api-omnix.odois.dev/health

**Configuração pronta para deploy via Coolify! 🚀**