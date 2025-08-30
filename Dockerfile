FROM node:18-alpine

WORKDIR /app

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código fonte do backend
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build do projeto
RUN npm run build

# Expor porta
EXPOSE 8301

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8301

# Comando para iniciar
CMD ["node", "dist/index.js"]