# 📁 Estrutura do Projeto OmniX

## 🎯 Visão Geral

Sistema de atendimento inteligente organizado em **monorepo** com backend Node.js e frontend React.

```
omnix/
├── backend/           # Servidor Node.js + APIs
├── frontend/          # Interface React
├── README.md          # Documentação principal
├── API_DOCUMENTATION.md # Documentação das APIs
└── PROJECT_STRUCTURE.md # Este arquivo
```

---

## 🖥️ Backend (`/backend`)

### **📋 Estrutura Completa:**

```
backend/src/
├── 📁 modules/                    # Módulos funcionais principais
│   ├── whatsapp/                 # 📱 WhatsApp Business
│   │   ├── routes.ts            # Rotas: /api/whatsapp/*
│   │   ├── service.ts           # Lógica de negócio
│   │   ├── wahaClient.ts        # Cliente WAHA API
│   │   ├── webhookHandler.ts    # Webhook de mensagens
│   │   └── types.ts             # Tipos TypeScript
│   ├── messages/                # 💬 Sistema de mensagens
│   │   ├── routes.ts            # Rotas: /api/messages/*
│   │   └── service.ts           # CRUD conversas/mensagens
│   └── contacts/                # 👥 Gerenciamento contatos
│       ├── routes.ts            # Rotas: /api/contacts/*
│       └── service.ts           # CRUD contatos
├── 📁 services/                  # Serviços principais
│   ├── aiService.ts             # 🤖 Integração OpenAI
│   ├── aiPromptService.ts       # ⚙️ Gerenciamento prompts
│   ├── authServiceV2.ts         # 🔐 Autenticação v2
│   ├── moduleService.ts         # 🧩 Sistema módulos
│   ├── adminService.ts          # 👨‍💼 Funcionalidades admin
│   └── emailService.ts          # 📧 Envio de emails
├── 📁 routes/                    # APIs REST
│   ├── aiRoutes.ts              # 🤖 /api/ai/*
│   ├── authV2.ts                # 🔐 /api/v2/auth/*
│   ├── dashboardRoutes.ts       # 📊 /api/dashboard/*
│   ├── moduleRoutes.ts          # 🧩 /api/modules/*
│   └── adminRoutes.ts           # 👨‍💼 /api/admin/*
├── 📁 middlewares/               # Middlewares Express
│   ├── authV2.ts                # Validação JWT
│   ├── cors.ts                  # CORS configurado
│   └── moduleAuth.ts            # Autorização módulos
├── 📁 lib/                       # Utilitários
│   └── database.ts              # Cliente Prisma
├── 📁 types/                     # Tipos globais
│   ├── modules.ts               # Sistema módulos
│   └── admin.ts                 # Tipos admin
├── 📄 index.ts                   # Servidor principal
└── 📁 prisma/                    # Database schema
    └── schema.prisma            # Modelo dados
```

### **🎯 Responsabilidades por Módulo:**

#### **📱 WhatsApp** (`/modules/whatsapp/`)
- **Conexão** com WAHA API
- **QR Code** para autenticação
- **Webhook** para mensagens em tempo real
- **Multi-instância** por tenant
- **Status** de conexão em tempo real

#### **💬 Messages** (`/modules/messages/`)
- **CRUD** conversas e mensagens
- **Busca** e filtros
- **Marcação** como lida
- **Histórico** completo

#### **👥 Contacts** (`/modules/contacts/`)
- **Gestão** de contatos
- **Tags** e campos customizados
- **Busca** por telefone/nome
- **Integração** com WhatsApp

#### **🤖 AI Services** (`/services/`)
- **OpenAI** GPT-4o-mini integration
- **Análise** sentimento + sugestões
- **Prompts** personalizáveis
- **Fallback** para mock quando necessário

---

## 🌐 Frontend (`/frontend`)

### **📋 Estrutura Completa:**

```
frontend/src/
├── 📁 pages/                     # Páginas principais
│   ├── Dashboard.tsx            # 📊 Dashboard geral
│   ├── ChatV4.tsx               # 💬 Chat principal com IA
│   ├── Settings.tsx             # ⚙️ Configurações centralizadas
│   ├── AIPromptManager.tsx      # 🤖 Gerenciador prompts IA
│   ├── AllInstances.tsx         # 📱 Todas instâncias (super_admin)
│   ├── WhatsAppInstances.tsx    # 📱 Instâncias do tenant
│   ├── Contacts.tsx             # 👥 Gestão contatos
│   ├── Workflows.tsx            # ⚡ Automações
│   └── ModuleMarketplace.tsx    # 🧩 Marketplace módulos
├── 📁 components/                # Componentes reutilizáveis
│   ├── layout/                  # Layout principal
│   │   ├── Layout.tsx           # Container geral
│   │   ├── Sidebar.tsx          # Menu lateral
│   │   └── Header.tsx           # Cabeçalho
│   ├── dashboard/               # Widgets dashboard
│   │   └── ModuleStatusWidget.tsx
│   └── ui/                      # Componentes base
│       └── Button.tsx           # Botão padrão
├── 📁 services/                  # Clientes API
│   ├── dashboardService.ts      # APIs dashboard
│   └── instanceService.ts       # APIs instâncias
├── 📁 store/                     # Estado global
│   └── authStore.ts             # Autenticação (Zustand)
├── 📁 hooks/                     # React hooks
│   ├── useDashboard.ts          # Hook dashboard
│   └── useModules.ts            # Hook módulos
├── 📁 utils/                     # Utilitários
│   ├── componentId.ts           # IDs para debug
│   └── cn.ts                    # Classe utility
└── 📁 lib/                       # Configurações
    └── api.ts                   # Cliente Axios
```

### **🎯 Responsabilidades por Página:**

#### **💬 Chat** (`ChatV4.tsx`)
- **Interface** principal de atendimento
- **IA integrada** com OpenAI
- **Sidebar** colapsável
- **Painéis** de contato e IA
- **Auto-refresh** mensagens

#### **⚙️ Settings** (`Settings.tsx`) - **CENTRALIZADA**
- **👤 Perfil**: Dados do usuário
- **🏢 Empresa**: Configurações tenant
- **🤖 IA**: Gerenciador de prompts
- **📱 Instâncias**: Todas instâncias (super_admin)
- **🧩 Módulos**: Marketplace
- **👥 Usuários**: Gestão de usuários
- **🔗 Integrações**: APIs externas

#### **📊 Dashboard** (`Dashboard.tsx`)
- **Métricas** gerais do sistema
- **Status** das instâncias
- **Widgets** informativos
- **Exportação** de dados

---

## 🔄 Fluxo de Dados

### **📱 Mensagem Recebida:**
```
WhatsApp → WAHA → Webhook → Backend → Database → Frontend (auto-refresh)
```

### **🤖 Análise IA:**
```
Frontend → Backend API → OpenAI → Análise → Cache → Frontend
```

### **⚙️ Configuração Prompt:**
```
Admin → Settings → AI Tab → Criar/Editar → Storage → Chat IA
```

---

## 🎭 Roles e Permissões

### **🔐 Controle de Acesso:**

#### **super_admin:**
- ✅ **Tudo** (acesso total)
- ✅ **Todas instâncias** de todos tenants
- ✅ **Configurações** sistema
- ✅ **Usuários** todos tenants

#### **tenant_admin:**
- ✅ **Configurações** do seu tenant
- ✅ **IA & Prompts** personalizados
- ✅ **Usuários** do tenant
- ✅ **Instâncias** do tenant
- ✅ **Perfil** próprio

#### **tenant_manager:**
- ✅ **Atendimento** (chat)
- ✅ **Workflows** e automações
- ✅ **Relatórios** do tenant
- ❌ **Configurações** sistema

#### **tenant_operator:**
- ✅ **Atendimento** (chat)
- ❌ **Configurações** avançadas
- ❌ **IA** configuração

---

## 📊 Base de Dados (Prisma)

### **🗄️ Principais Tabelas:**

#### **Tenants & Users:**
```sql
tenants          # Empresas/organizações
users           # Usuários do sistema
user_sessions   # Sessões ativas
```

#### **WhatsApp:**
```sql
whatsapp_instances    # Instâncias WhatsApp
conversations        # Conversas com clientes
messages            # Mensagens individuais
```

#### **Contacts & CRM:**
```sql
contacts       # Base de contatos
tags          # Sistema de tags
custom_fields # Campos personalizados
```

#### **Sistema:**
```sql
modules           # Módulos disponíveis
tenant_modules   # Módulos por tenant
activities      # Log de atividades
```

---

## 🛠️ Utilitários de Desenvolvimento

### **🔍 Debug Classes:**
Todos componentes têm classes de identificação:
```html
<!-- Páginas -->
<div class="omnix-page-chat-v4" data-page="ChatV4">

<!-- Componentes -->
<div class="omnix-conversation-sidebar" data-component="ConversationSidebar">

<!-- Elementos -->
<div class="omnix-message-input-form" data-element="form">
```

### **📝 Console Logs:**
```javascript
// Sistema
💬 ChatV4 initialized for user: admin@omnix.dev

// Mensagens
📥 New message from client: Olá, como vai...
📤 Message sent to: João Silva

// IA
🤖 Analyzing conversation with AI...
✅ AI analysis completed
🔄 Using mock suggestions as fallback

// WhatsApp
📱 Session status update: SCAN_QR_CODE
🔗 Instance connected: Atendimento Principal
```

### **🎨 Convenções CSS:**
- **Tailwind CSS** para estilização
- **Responsive design** mobile-first
- **Gradientes** para elementos destacados
- **Animações** suaves (duration-300)

---

## 🚀 Deploy e Produção

### **🔧 Build Commands:**
```bash
# Backend
cd backend && npm run build

# Frontend  
cd frontend && npm run build
```

### **🌐 Environment Variables:**

#### **Backend (.env):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-proj-...
WAHA_BASE_URL=https://...
BACKEND_PUBLIC_URL=https://...
PORT=8300
```

#### **Frontend (.env):**
```env
VITE_API_URL=https://your-backend-url
```

### **📦 Docker Deployment:**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📈 Métricas e Monitoramento

### **📊 KPIs Principais:**
- **Conversas ativas** por período
- **Tempo médio** de resposta
- **Taxa de satisfação** dos clientes
- **Uso de IA** (análises realizadas)
- **Instâncias** conectadas/total

### **🎯 Health Checks:**
```http
GET /health              # Status geral backend
GET /api/whatsapp/sync   # Status WhatsApp instances
```

---

## 🔮 Roadmap Futuro

### **📅 Próximas Versões:**

#### **v2.0 - Automação Avançada:**
- Chatbots inteligentes
- Workflows visuais
- Integração CRM

#### **v2.1 - Analytics Pro:**
- Relatórios avançados
- Dashboards customizáveis
- Exportação automática

#### **v2.2 - Integrações:**
- API pública
- Webhooks personalizados
- Marketplace de plugins

---

**🎉 Projeto completamente organizado e documentado para escala! 🚀**