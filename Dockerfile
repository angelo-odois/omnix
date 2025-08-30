# Dockerfile para deploy do OmniX Backend via Coolify
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências incluindo dev para build
RUN npm ci && npm cache clean --force

# Copiar código fonte do backend
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build do projeto TypeScript
RUN npm run build

# Limpar dependências dev após build
RUN npm ci --only=production && npm cache clean --force

# Expor porta
EXPOSE 8301

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=8301

# Comando para iniciar
CMD ["npm", "start"]