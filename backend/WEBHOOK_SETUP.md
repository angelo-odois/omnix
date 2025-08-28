# Configuração de Webhook OmniX ↔ WAHA

## Como Funciona

O OmniX fornece um webhook único para cada instância WhatsApp criada. O WAHA usa esse webhook para enviar todas as mensagens e eventos para o OmniX.

```
WAHA (Cloud) → Internet → OmniX Webhook → Processamento de Mensagens
```

## Configuração

### 1. Desenvolvimento Local

Para desenvolvimento local com WAHA cloud, você precisa expor seu servidor local para a internet:

#### Opção A: Usando ngrok (Recomendado)
```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000 do backend
ngrok http 3000

# Você receberá uma URL pública como:
# https://abc123.ngrok.io
```

#### Opção B: Usando localtunnel
```bash
# Instalar localtunnel
npm install -g localtunnel

# Expor porta 3000
lt --port 3000

# Você receberá uma URL como:
# https://gentle-panda-42.loca.lt
```

### 2. Configurar .env

Atualize o arquivo `.env` com a URL pública:

```env
# Para desenvolvimento com ngrok
BACKEND_PUBLIC_URL=https://abc123.ngrok.io

# Para produção
BACKEND_PUBLIC_URL=https://api.omnix.com.br
```

### 3. Fluxo de Webhook

1. **Criação de Instância**: Quando uma nova sessão é criada:
   - OmniX gera um token único
   - Cria URL: `https://api.omnix.com.br/api/waha/webhook/{token}`
   - Registra essa URL no WAHA

2. **Recebimento de Mensagens**:
   - WAHA envia POST para: `https://api.omnix.com.br/api/waha/webhook/{token}`
   - OmniX valida o token
   - Identifica tenant e sessão
   - Processa e armazena mensagem

## URLs de Webhook Geradas

Cada instância recebe uma URL única:

```
Desenvolvimento: https://abc123.ngrok.io/api/waha/webhook/b967803bcc32ea43...
Produção: https://api.omnix.com.br/api/waha/webhook/b967803bcc32ea43...
```

## Eventos Recebidos

O webhook recebe os seguintes eventos do WAHA:

- `message` - Mensagem recebida
- `message.any` - Qualquer tipo de mensagem
- `message.ack` - Confirmação de leitura
- `session.status` - Mudança de status da sessão
- `state.change` - Mudança de estado

## Segurança

- **Token Único**: 256 bits de entropia
- **HMAC Signature**: Validação de autenticidade
- **Isolamento**: Cada instância tem seu webhook
- **Tenant Segregation**: Total isolamento entre tenants

## Teste de Webhook

Para testar se o webhook está acessível:

```bash
# Teste local (deve retornar 404 sem token válido)
curl http://localhost:3000/api/waha/webhook/test

# Teste com ngrok
curl https://abc123.ngrok.io/api/waha/webhook/test
```

## Troubleshooting

### Webhook não recebe mensagens

1. Verificar se a URL pública está acessível
2. Confirmar que BACKEND_PUBLIC_URL está configurado
3. Verificar logs do WAHA para erros de webhook
4. Testar conectividade com curl

### Erro de HMAC

1. Verificar se o secret está sendo enviado corretamente
2. Confirmar encoding do payload (deve ser JSON)
3. Verificar header `x-waha-signature`

### Mensagens não aparecem

1. Verificar logs do backend para erros
2. Confirmar que o token do webhook é válido
3. Verificar se a sessão está ativa
4. Confirmar tenant ID correto

## Logs Úteis

```bash
# Ver webhooks criados
grep "Creating WAHA session with OmniX webhook" logs.txt

# Ver mensagens recebidas
grep "WAHA Webhook received for instance" logs.txt

# Ver erros de webhook
grep "Invalid webhook token" logs.txt
```