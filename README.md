# 🚀 OmniX - Sistema de Atendimento Inteligente

Sistema completo de atendimento ao cliente com **WhatsApp Business API**, **IA OpenAI** integrada e **interface moderna**.

## ✨ Funcionalidades Principais

### 💬 **Chat Inteligente**
- Interface moderna estilo WhatsApp
- Multi-instância WhatsApp Business
- IA OpenAI com análise de sentimento
- Prompts personalizáveis por administradores
- Sidebar colapsável e painéis organizados

### 🤖 **Inteligência Artificial**
- **Análise de sentimento** em tempo real
- **Sugestões de resposta** contextualizadas
- **Prompts customizáveis** para diferentes cenários
- **Fallback automático** quando IA indisponível
- **15 mensagens** de contexto para análise rica

### 📱 **WhatsApp Business**
- Conexão via WAHA (WhatsApp HTTP API)
- QR Code para autenticação
- Webhook para mensagens em tempo real
- Status de conexão em tempo real
- Suporte a múltiplas instâncias

### 📊 **Dashboard & Analytics**
- Métricas de atendimento
- Status das instâncias
- Gestão de módulos por tenant
- Exportação de dados

## 🛠️ Tecnologias

### **Backend**
- **Node.js** + **TypeScript**
- **Express.js** para APIs REST
- **Prisma ORM** + **PostgreSQL**
- **OpenAI GPT-4o-mini** para IA
- **WAHA** para WhatsApp Business

### **Frontend**
- **React 18** + **TypeScript**
- **Tailwind CSS** para styling
- **Zustand** para gerenciamento de estado
- **React Router** para navegação
- **Lucide React** para ícones

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 12+
- Conta OpenAI (opcional, funciona com mock)
- Acesso ao WAHA ou WhatsApp Business API

### **1. Clone e Instale Dependências**

```bash
# Clone o repositório
git clone <repository-url>
cd omnix

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### **2. Configuração do Banco de Dados**

```bash
# Criar banco PostgreSQL
createdb omnix

# Executar migrações
cd backend
npx prisma migrate dev
```

### **3. Configuração das Variáveis de Ambiente**

**Backend** (`.env`):
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/omnix"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# OpenAI (opcional)
OPENAI_API_KEY="sk-proj-your-openai-key"

# WAHA WhatsApp API
WAHA_BASE_URL="https://waha.nexuso2.com"
WAHA_API_KEY="your-waha-api-key"

# Backend URLs
BACKEND_PUBLIC_URL="http://localhost:8300"
PORT=8300
```

**Frontend** (`.env`):
```env
VITE_API_URL="http://localhost:8300"
```

### **4. Executar o Sistema**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### **5. Primeiro Acesso**

1. **Frontend**: http://localhost:8500
2. **Backend**: http://localhost:8300
3. **Login**: admin@omnix.dev / senha disponível no sistema

## 📁 Estrutura do Projeto

### **Backend** (`/backend`)
```
src/
├── modules/           # Módulos funcionais
│   ├── whatsapp/     # WhatsApp Business integration
│   ├── messages/     # Sistema de mensagens e conversas
│   └── contacts/     # Gerenciamento de contatos
├── services/         # Serviços principais
│   ├── aiService.ts  # Integração OpenAI
│   ├── aiPromptService.ts # Gerenciamento de prompts
│   └── authServiceV2.ts   # Autenticação
├── routes/           # APIs REST
│   ├── aiRoutes.ts   # Endpoints de IA
│   ├── authV2.ts     # Autenticação v2
│   └── ...
├── middlewares/      # Middlewares Express
├── lib/              # Utilitários e database
└── types/            # Tipos TypeScript
```

### **Frontend** (`/frontend`)
```
src/
├── pages/            # Páginas principais
│   ├── ChatV4.tsx    # Chat principal com IA
│   ├── Dashboard.tsx # Dashboard administrativo
│   ├── AIPromptManager.tsx # Gerenciador de prompts IA
│   └── ...
├── components/       # Componentes reutilizáveis
│   ├── layout/       # Layout principal (Sidebar, Header)
│   └── dashboard/    # Widgets do dashboard
├── services/         # Clientes de API
├── store/            # Gerenciamento de estado (Zustand)
├── hooks/            # React hooks customizados
└── utils/            # Utilitários e helpers
```

## 🎯 Principais Funcionalidades

### **💬 Sistema de Chat** (`/conversations`)

#### **Interface Principal:**
- Lista de conversas em sidebar
- Área de chat central com mensagens
- Painel de IA opcional (análise + sugestões)
- Painel de informações do contato

#### **Funcionalidades:**
- ✅ Envio/recebimento de mensagens
- ✅ Auto-scroll para última mensagem
- ✅ Sidebar colapsável
- ✅ Detalhes e ações do contato
- ✅ Exclusão de conversas
- ✅ Auto-refresh (3 segundos)

### **🤖 Sistema de IA** 

#### **Análise Automática:**
- **Sentimento**: Positivo/Negativo/Neutro + emoção
- **Confiança**: Percentual de certeza da análise
- **Palavras-chave**: Principais termos da conversa
- **Urgência**: Baixa/Média/Alta baseada no contexto

#### **Sugestões Inteligentes:**
- **3 sugestões** por análise
- **Tom adaptativo**: Profissional/Amigável/Empático
- **Contexto completo**: 15 mensagens analisadas
- **Clique para usar**: Sugestão preenche input

### **⚙️ Gerenciador de Prompts** (`/ai-prompts`)

#### **Criação de Prompts:**
- **System Prompt**: Instruções para a IA
- **User Template**: Formato da consulta
- **Variáveis**: `{customerName}`, `{messageHistory}`, etc.
- **Configurações**: Temperature, Max Tokens, Modelo

#### **Categorias:**
- **Sentimento**: Para análise emocional
- **Sugestões**: Para geração de respostas
- **Geral**: Uso amplo
- **Custom**: Personalizados

#### **Testes:**
- Teste com dados simulados
- Preview das respostas
- Comparação de prompts

### **📱 WhatsApp Business** (`/whatsapp`)

#### **Gerenciamento de Instâncias:**
- Criar novas instâncias
- Conectar via QR Code
- Monitorar status de conexão
- Desconectar/reconectar

#### **Integração WAHA:**
- Webhook automático configurado
- Mensagens em tempo real
- Status de sessão sincronizado
- QR Code dinâmico

## 🔌 APIs Principais

### **Mensagens** (`/api/messages/`)
- `GET /conversations` - Lista conversas
- `GET /conversations/:id/messages` - Mensagens de uma conversa
- `POST /conversations/:id/read` - Marcar como lida
- `DELETE /conversations/:id` - Excluir conversa

### **IA** (`/api/ai/`)
- `POST /analyze-sentiment` - Análise de sentimento
- `POST /suggest-responses` - Sugestões de resposta
- `GET /prompts` - Listar prompts
- `POST /prompts` - Criar prompt
- `PUT /prompts/:id` - Editar prompt
- `POST /prompts/:id/test` - Testar prompt

### **WhatsApp** (`/api/whatsapp/`)
- `GET /instances` - Listar instâncias
- `POST /instances` - Criar instância
- `POST /instances/:id/connect` - Conectar (QR)
- `POST /instances/:id/send` - Enviar mensagem
- `DELETE /instances/:id` - Excluir instância

### **Autenticação** (`/api/v2/`)
- `POST /auth/magic-link` - Login por email
- `POST /auth/verify-otp` - Verificar código
- `GET /auth/session` - Dados da sessão
- `POST /auth/logout` - Logout

## 👥 Usuários e Permissões

### **Roles Disponíveis:**
- **super_admin**: Acesso total ao sistema
- **tenant_admin**: Administrador do tenant
- **tenant_manager**: Gerente operacional
- **tenant_operator**: Operador de atendimento

### **Usuários de Teste:**
```
admin@omnix.dev (super_admin)
ahspimentel@gmail.com (tenant_admin)  
gestor@empresa-demo.com (tenant_manager)
operador@empresa-demo.com (tenant_operator)
```

## 🔐 Segurança

### **Autenticação:**
- JWT com expiração configurável
- Magic link por email
- OTP para verificação
- Middleware de autenticação em todas rotas

### **Autorização:**
- Controle por roles
- Módulos por tenant
- Validação de permissões
- Isolamento de dados por tenant

## 🚀 Deploy e Produção

### **Variáveis Essenciais:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-proj-...
WAHA_BASE_URL=https://your-waha-instance
BACKEND_PUBLIC_URL=https://your-backend-url
```

### **Comandos de Build:**
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend  
npm run build
```

### **Docker (Opcional):**
```bash
docker-compose up -d
```

## 📖 Guia de Uso

### **👨‍💼 Para Administradores:**

1. **Configurar WhatsApp:**
   - Acesse `/whatsapp`
   - Crie nova instância
   - Escaneie QR Code
   - Aguarde conexão

2. **Configurar IA:**
   - Acesse `/ai-prompts`
   - Crie prompts personalizados
   - Configure parâmetros OpenAI
   - Teste antes de ativar

3. **Gerenciar Usuários:**
   - Acesse `/settings`
   - Configure módulos por tenant
   - Gerencie permissões

### **👩‍💻 Para Atendentes:**

1. **Iniciar Atendimento:**
   - Acesse `/conversations`
   - Selecione conversa
   - Digite mensagens

2. **Usar IA:**
   - Clique botão 🤖 (roxo)
   - Aguarde análise
   - Clique em sugestões para usar
   - Troque prompts conforme necessário

3. **Gerenciar Contatos:**
   - Clique botão 👥 (usuários)
   - Veja informações do contato
   - Use ações rápidas (ligar, excluir)

## 🎯 Próximos Passos

### **Possíveis Melhorias:**
- [ ] Sistema de templates de mensagem
- [ ] Relatórios avançados
- [ ] Integração com CRM
- [ ] Chatbots automatizados
- [ ] API pública para integrações

### **Otimizações:**
- [ ] Cache Redis para performance
- [ ] WebSockets para tempo real
- [ ] Upload de arquivos
- [ ] Backup automático

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@omnix.dev
- 📱 WhatsApp: +55 11 99999-9999
- 🌐 Documentação: [docs.omnix.dev](docs.omnix.dev)

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**🎉 OmniX - Transformando o atendimento ao cliente com IA! 🤖**