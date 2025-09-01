# 📚 OmniX API Documentation

Base URL: `http://localhost:8300/api`

## 🔐 Autenticação

Todas as rotas (exceto webhook) requerem autenticação via JWT Bearer token.

```http
Authorization: Bearer <jwt_token>
```

### **🔑 Auth Endpoints**

#### **Login por Magic Link**
```http
POST /v2/auth/magic-link
Content-Type: application/json

{
  "email": "admin@omnix.dev"
}
```

#### **Verificar OTP**
```http
POST /v2/auth/verify-otp
Content-Type: application/json

{
  "email": "admin@omnix.dev",
  "otp": "123456"
}
```

#### **Dados da Sessão**
```http
GET /v2/auth/session
Authorization: Bearer <token>
```

#### **Logout**
```http
POST /v2/auth/logout
Authorization: Bearer <token>
```

---

## 💬 Mensagens e Conversas

### **📋 Listar Conversas**
```http
GET /messages/conversations
Authorization: Bearer <token>

Query Parameters:
- search: string (opcional) - Buscar por nome ou telefone
- archived: boolean (opcional) - Conversas arquivadas
- limit: number (opcional, padrão: 50)
- offset: number (opcional, padrão: 0)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-123",
      "contactPhone": "5511999999999",
      "contactName": "João Silva",
      "lastMessageAt": "2024-01-01T10:00:00Z",
      "unreadCount": 3,
      "isArchived": false,
      "tags": ["cliente", "vip"]
    }
  ]
}
```

### **💬 Mensagens de uma Conversa**
```http
GET /messages/conversations/:id/messages
Authorization: Bearer <token>

Query Parameters:
- limit: number (opcional, padrão: 50)
- offset: number (opcional, padrão: 0)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-123",
      "from": "5511999999999",
      "to": "sistema",
      "content": "Olá, preciso de ajuda",
      "isInbound": true,
      "timestamp": "2024-01-01T10:00:00Z",
      "status": "read"
    }
  ]
}
```

### **✅ Marcar como Lida**
```http
POST /messages/conversations/:id/read
Authorization: Bearer <token>
```

### **🗑️ Excluir Conversa**
```http
DELETE /messages/conversations/:id
Authorization: Bearer <token>
```

### **📥 Mensagens Recentes**
```http
GET /messages/recent
Authorization: Bearer <token>

Query Parameters:
- since: string (ISO date) - Mensagens desde esta data
```

---

## 📱 WhatsApp Business

### **📋 Listar Instâncias**
```http
GET /whatsapp/instances
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inst-123",
      "name": "Atendimento Principal",
      "phoneNumber": "5511999999999",
      "status": "connected",
      "qrCode": "data:image/png;base64,...",
      "lastSeen": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### **➕ Criar Instância**
```http
POST /whatsapp/instances
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nova Instância",
  "settings": {
    "autoReply": false,
    "businessHours": true
  }
}
```

### **🔗 Conectar Instância (QR Code)**
```http
POST /whatsapp/instances/:id/connect
Authorization: Bearer <token>
```

### **📤 Enviar Mensagem**
```http
POST /whatsapp/instances/:id/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "type": "text"
}
```

### **🔌 Desconectar Instância**
```http
POST /whatsapp/instances/:id/disconnect
Authorization: Bearer <token>
```

### **🗑️ Excluir Instância**
```http
DELETE /whatsapp/instances/:id
Authorization: Bearer <token>
```

---

## 🤖 Inteligência Artificial

### **🧠 Análise de Sentimento**
```http
POST /ai/analyze-sentiment
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "conv-123",
  "contactName": "João Silva"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sentiment": "positive",
    "confidence": 0.85,
    "emotion": "happy",
    "urgency": "medium",
    "keywords": ["produto", "preço", "entrega"],
    "score": 0.7
  }
}
```

### **💡 Sugestões de Resposta**
```http
POST /ai/suggest-responses
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "conv-123",
  "contactName": "João Silva",
  "businessContext": "E-commerce de eletrônicos",
  "customPromptId": "prompt-456" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sentiment": { /* análise de sentimento */ },
    "suggestions": [
      {
        "content": "Olá João! Fico feliz em ajudar com seu pedido.",
        "tone": "friendly",
        "confidence": 0.92,
        "context": "Resposta baseada no sentimento positivo detectado"
      }
    ]
  }
}
```

---

## ⚙️ Gerenciamento de Prompts

### **📋 Listar Prompts**
```http
GET /ai/prompts
Authorization: Bearer <token>
```

### **➕ Criar Prompt**
```http
POST /ai/prompts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "E-commerce Vendas",
  "description": "Prompt otimizado para vendas online",
  "category": "suggestions",
  "systemPrompt": "Você é um consultor de vendas expert...",
  "userPromptTemplate": "Cliente {customerName}: {messageHistory}",
  "settings": {
    "temperature": 0.7,
    "maxTokens": 500,
    "model": "gpt-4o-mini"
  }
}
```

### **✏️ Editar Prompt**
```http
PUT /ai/prompts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "systemPrompt": "Novo prompt atualizado...",
  "settings": {
    "temperature": 0.8
  }
}
```

### **🧪 Testar Prompt**
```http
POST /ai/prompts/:id/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "testMessages": [
    "Cliente: Olá, gostaria de informações",
    "Atendente: Claro! Como posso ajudar?"
  ],
  "customerName": "João Teste"
}
```

---

## 📊 Dashboard e Métricas

### **📈 Dados do Dashboard**
```http
GET /dashboard/data
Authorization: Bearer <token>

Query Parameters:
- period: 'today' | 'week' | 'month' | 'year'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "conversations": { "active": 45, "total": 120 },
      "contacts": { "total": 230, "new": 12 },
      "instances": { "connected": 3, "total": 5 },
      "messages": { "today": 89, "avgResponseTime": 120 }
    },
    "instances": [ /* instâncias ativas */ ]
  }
}
```

---

## 🚨 Códigos de Erro

### **HTTP Status Codes:**
- `200` - Sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

### **Formato de Erro:**
```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "CODIGO_ERRO" // opcional
}
```

---

## 🔗 Webhooks

### **WhatsApp Webhook**
```http
POST /whatsapp/webhook/:sessionName
Content-Type: application/json

{
  "event": "message",
  "session": "omnix_session_123",
  "payload": {
    "id": "msg-123",
    "from": "5511999999999@c.us",
    "body": "Mensagem do cliente",
    "timestamp": 1640995200,
    "fromMe": false
  }
}
```

---

## 🛠️ Desenvolvimento

### **Logs Úteis:**
```javascript
// IA Analysis
console.log('🤖 Analyzing conversation with AI...');
console.log('✅ AI analysis completed');

// Messages  
console.log('📥 New message from client:', content);
console.log('📤 Message sent to:', contactName);

// WhatsApp
console.log('📱 Session status update:', status);
console.log('🔗 Instance connected:', instanceName);
```

### **Debug Headers:**
```http
X-Debug: true          # Ativa logs detalhados
X-Tenant-Override: id  # Override tenant (admin only)
```

---

## 🎯 Exemplos de Uso

### **Fluxo Completo de Atendimento:**

1. **Cliente envia mensagem** via WhatsApp
2. **Webhook** recebe e salva no banco
3. **Atendente** vê conversa na interface
4. **IA analisa** sentimento automaticamente
5. **IA sugere** 3 respostas contextuais
6. **Atendente** escolhe e envia resposta
7. **Mensagem** vai para WhatsApp do cliente

### **Customização de IA:**

1. **Admin** cria prompt específico para vendas
2. **Prompt** configurado com foco em conversão
3. **Atendente** seleciona prompt no chat
4. **IA** usa prompt personalizado
5. **Sugestões** focadas em vendas

---

**🚀 Sistema completo e documentado para produção!**