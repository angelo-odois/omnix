# 🚀 OmniX - Guia de Deploy com Docker e Coolify

## 📋 Visão Geral

O OmniX está configurado para deploy com Docker em produção usando Coolify. O sistema utiliza 3 domínios:

- **Frontend**: https://omnix.odois.com.br
- **Backend API**: https://api-omnix.odois.com.br  
- **Webhooks**: https://hook-omnix.odois.com.br

## 🏗️ Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend       │────▶│  Backend API    │────▶│  WAHA API       │
│  (React+Vite)   │     │  (Node+Express) │     │  (WhatsApp)     │
│  Port: 8080     │     │  Port: 3001     │     │                 │
│                 │     │                 │     └─────────────────┘
└─────────────────┘     └─────────────────┘              │
                               │                          │
                               ▼                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  Salvy API      │     │  Webhook        │
                        │  (Phone Nums)   │     │  Endpoint       │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
```

## 🔧 Configuração Local

### 1. Preparar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env.production

# Editar com suas configurações
nano .env.production
```

### 2. Build Local das Imagens

```bash
# Dar permissão de execução aos scripts
chmod +x build.sh deploy.sh

# Construir imagens Docker
./build.sh

# Ou manualmente:
docker-compose build
```

### 3. Testar Localmente

```bash
# Subir containers
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Testar endpoints
curl http://localhost:3001/health
curl http://localhost:8080/health
```

## 🚀 Deploy no Coolify

### Método 1: Via GitHub Actions (Recomendado)

1. **Configure os secrets no GitHub**:
   - `COOLIFY_WEBHOOK_URL`: URL do webhook do Coolify
   - Secrets automáticos: `GITHUB_TOKEN` (já configurado)

2. **Push para main branch**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

### Método 2: Deploy Manual

1. **Prepare o pacote de deploy**:
   ```bash
   ./deploy.sh production ghcr.io/seu-usuario
   ```

2. **No Coolify Dashboard**:

   a. **Criar Nova Aplicação**:
   - Click "New Application"
   - Selecione "Docker Compose"
   - Nome: "OmniX"

   b. **Configurar Docker Compose**:
   ```yaml
   version: '3.8'
   
   services:
     backend:
       image: ghcr.io/seu-usuario/omnix-backend:latest
       environment:
         # Copiar do arquivo docker-compose.yml
       labels:
         - "coolify.domain=api-omnix.odois.com.br,hook-omnix.odois.com.br"
         - "coolify.port=3001"
   
     frontend:
       image: ghcr.io/seu-usuario/omnix-frontend:latest
       labels:
         - "coolify.domain=omnix.odois.com.br"
         - "coolify.port=8080"
   ```

   c. **Configurar Variáveis de Ambiente**:
   - Copie todas as variáveis do `.env.production`
   - Configure no painel do Coolify

   d. **Deploy**:
   - Click "Deploy"
   - Acompanhe os logs

## 🔍 Configuração de DNS

Configure os seguintes registros DNS no seu provedor:

```
omnix.odois.com.br        A    → IP_DO_SERVIDOR
api-omnix.odois.com.br    A    → IP_DO_SERVIDOR  
hook-omnix.odois.com.br   A    → IP_DO_SERVIDOR
```

Ou usando CNAME se estiver atrás de um proxy:

```
omnix.odois.com.br        CNAME → seu-servidor.com
api-omnix.odois.com.br    CNAME → seu-servidor.com
hook-omnix.odois.com.br   CNAME → seu-servidor.com
```

## 📊 Monitoramento

### Health Checks

- Frontend: https://omnix.odois.com.br/health
- Backend: https://api-omnix.odois.com.br/health

### Logs

```bash
# Via Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Via Coolify
# Acesse o painel e veja os logs em tempo real
```

## 🔐 Segurança

### SSL/TLS
- Coolify configura automaticamente Let's Encrypt
- Renovação automática a cada 90 dias

### Variáveis Sensíveis
- **NUNCA** commitar `.env.production` no Git
- Use secrets do Coolify/GitHub para variáveis sensíveis
- Rotacione JWT_SECRET regularmente
- Use senhas fortes para SMTP e APIs

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker logs omnix-backend
docker logs omnix-frontend

# Verificar variáveis de ambiente
docker exec omnix-backend env
```

### Erro 502 Bad Gateway

1. Verifique se os containers estão rodando
2. Verifique as portas configuradas
3. Verifique os labels do Traefik/Coolify

### Webhook não funciona

1. Verifique a URL: https://hook-omnix.odois.com.br
2. Teste manualmente:
   ```bash
   curl -X POST https://hook-omnix.odois.com.br/test \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Problemas de CORS

1. Verifique FRONTEND_URL no backend
2. Verifique as configurações de CORS em `corsMiddleware.ts`

## 📦 Estrutura de Portas

| Serviço | Porta Local | Porta Docker | URL Produção |
|---------|-------------|--------------|--------------|
| Frontend | 5175 | 8080 | https://omnix.odois.com.br |
| Backend | 3000 | 3001 | https://api-omnix.odois.com.br |
| Webhook | 3000 | 3001 | https://hook-omnix.odois.com.br |

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
# Via GitHub Actions
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Ou manualmente
./build.sh ghcr.io/seu-usuario
docker push ghcr.io/seu-usuario/omnix-backend:latest
docker push ghcr.io/seu-usuario/omnix-frontend:latest
# No Coolify: Click "Redeploy"
```

### Rollback

```bash
# No Coolify
# Selecione versão anterior e click "Deploy"

# Ou manualmente
docker-compose down
docker pull ghcr.io/seu-usuario/omnix-backend:previous-tag
docker pull ghcr.io/seu-usuario/omnix-frontend:previous-tag
docker-compose up -d
```

## 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] DNS configurado e propagado
- [ ] Imagens Docker construídas
- [ ] Teste local passou
- [ ] Coolify configurado
- [ ] SSL certificados ativos
- [ ] Health checks respondendo
- [ ] Webhooks testados
- [ ] Login funcionando
- [ ] WAHA conectado

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs
2. Consulte a documentação do Coolify
3. Verifique as issues no GitHub
4. Entre em contato com o time de desenvolvimento

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0.0