# 🎯 Guia de Implementação - Próximos Passos

## 🚀 **PRIORIDADE MÁXIMA: WhatsApp Integration**

### **Por que começar com WhatsApp?**
- ✅ **Core do Negócio**: Principal funcionalidade da aplicação
- ✅ **Valor Imediato**: Clientes veem resultado instantâneo
- ✅ **Base Sólida**: Outros módulos dependem de mensagens
- ✅ **Competitive Edge**: Diferencial no mercado

---

## 📋 **PASSO-A-PASSO: WhatsApp Module**

### **STEP 1: Backend WhatsApp Service** *(3-5 dias)*

#### **1.1 Estrutura de Arquivos**
```
/backend/src/modules/whatsapp/
├── index.ts              # Exportações
├── types.ts              # Interfaces WhatsApp
├── service.ts            # WhatsApp business logic
├── routes.ts             # API endpoints
├── middleware.ts         # WhatsApp-specific middleware
├── webhooks.ts           # Webhook handlers
└── README.md             # Documentation
```

#### **1.2 Types & Interfaces**
```typescript
// types.ts
export interface WhatsAppInstance {
  id: string;
  tenantId: string;
  name: string;
  phoneNumber: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  lastSeen?: Date;
  webhookUrl?: string;
  settings: {
    autoReply: boolean;
    businessHours: boolean;
    maxContacts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WhatsAppMessage {
  id: string;
  instanceId: string;
  tenantId: string;
  conversationId: string;
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'audio';
  content: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
}
```

#### **1.3 Service Implementation**
```typescript
// service.ts
class WhatsAppService {
  async createInstance(tenantId: string, data: CreateInstanceData): Promise<WhatsAppInstance>
  async connectInstance(instanceId: string): Promise<{ qrCode: string }>
  async disconnectInstance(instanceId: string): Promise<boolean>
  async sendMessage(instanceId: string, to: string, message: string): Promise<WhatsAppMessage>
  async getInstanceStatus(instanceId: string): Promise<InstanceStatus>
  async handleWebhook(instanceId: string, event: WebhookEvent): Promise<void>
}
```

#### **1.4 API Routes**
```typescript
// routes.ts - Com proteção de módulo
router.get('/instances', authenticate, requireModule('whatsapp', 'read'))
router.post('/instances', authenticate, requireModule('whatsapp', 'write'))
router.post('/instances/:id/connect', authenticate, requireModule('whatsapp', 'write'))
router.post('/instances/:id/send', authenticate, requireModule('whatsapp', 'write'))
router.post('/webhook/:instanceId', webhookAuth, handleWhatsAppWebhook)
```

### **STEP 2: Frontend WhatsApp Interface** *(3-4 dias)*

#### **2.1 Components Structure**
```
/frontend/src/components/whatsapp/
├── InstanceList.tsx      # Lista de instâncias
├── InstanceCard.tsx      # Card individual
├── CreateInstance.tsx    # Modal de criação
├── QRCodeModal.tsx       # Display QR Code
├── InstanceSettings.tsx  # Configurações
└── InstanceStats.tsx     # Estatísticas
```

#### **2.2 Pages**
```typescript
// /frontend/src/pages/Instances.tsx
export default function Instances() {
  const { instances, loading, createInstance, connectInstance } = useInstances();
  
  return (
    <ModuleProtectedRoute requiredModules={['whatsapp']}>
      <div className="space-y-6">
        <InstanceList instances={instances} />
        <CreateInstance onCreated={createInstance} />
      </div>
    </ModuleProtectedRoute>
  );
}
```

#### **2.3 Hooks**
```typescript
// /frontend/src/hooks/useInstances.ts
export function useInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  
  const createInstance = async (data: CreateInstanceData) => { /* ... */ };
  const connectInstance = async (instanceId: string) => { /* ... */ };
  const sendMessage = async (instanceId: string, to: string, message: string) => { /* ... */ };
  
  return { instances, createInstance, connectInstance, sendMessage };
}
```

### **STEP 3: Integration & Testing** *(2-3 dias)*

#### **3.1 WAHA Integration**
- [ ] Configure WAHA webhook endpoints
- [ ] Test QR Code generation
- [ ] Test message sending/receiving
- [ ] Handle connection events

#### **3.2 Real-time Updates**
- [ ] WebSocket for status updates
- [ ] QR Code refresh
- [ ] Message delivery status
- [ ] Connection monitoring

#### **3.3 Module Limits Enforcement**
- [ ] Check max instances before creation
- [ ] Track usage per tenant
- [ ] Block access when limit exceeded
- [ ] Show upgrade prompts

---

## 📋 **STEP 4: Messages System** *(4-5 dias)*

### **4.1 Backend Message Service**
```typescript
class MessageService {
  async getConversations(tenantId: string, filters?: ConversationFilters): Promise<Conversation[]>
  async getMessages(conversationId: string, pagination?: Pagination): Promise<Message[]>
  async sendMessage(conversationId: string, content: MessageContent): Promise<Message>
  async markAsRead(conversationId: string): Promise<boolean>
  async searchMessages(tenantId: string, query: string): Promise<Message[]>
}
```

### **4.2 Frontend Chat Interface**
- [ ] Conversation list (sidebar)
- [ ] Chat window (main area)
- [ ] Message composer
- [ ] File upload
- [ ] Message status indicators
- [ ] Search functionality

### **4.3 Real-time Features**
- [ ] New message notifications
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message sync across devices

---

## 📋 **STEP 5: Contacts CRM** *(3-4 dias)*

### **5.1 Backend Contact Service**
```typescript
class ContactService {
  async createContact(tenantId: string, data: ContactData): Promise<Contact>
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact>
  async deleteContact(contactId: string): Promise<boolean>
  async importContacts(tenantId: string, csvData: string): Promise<ImportResult>
  async exportContacts(tenantId: string, format: 'csv' | 'vcard'): Promise<string>
  async addToGroup(contactId: string, groupId: string): Promise<boolean>
}
```

### **5.2 Frontend CRM Interface**
- [ ] Contact list with pagination
- [ ] Contact detail/edit form
- [ ] Group management
- [ ] Tag system
- [ ] Import/export functionality
- [ ] Search and filters

---

## 🎯 **TEMPLATES DE DESENVOLVIMENTO**

### **Template: Novo Módulo**
```typescript
// 1. Definir no moduleService
const NEW_MODULE = {
  id: 'new_feature',
  displayName: 'Nova Feature',
  category: 'integration',
  isCore: false,
  defaultConfig: { maxRequests: 1000 }
}

// 2. Criar estrutura
/backend/src/modules/new-feature/
/frontend/src/components/new-feature/
/frontend/src/pages/NewFeature.tsx

// 3. Proteger rotas
router.use('/api/new-feature', authenticate, requireModule('new_feature'))

// 4. Adicionar aos pacotes
// adminService.ts - packages
modules: [
  { moduleId: 'new_feature', included: false }, // Starter
  { moduleId: 'new_feature', included: true }   // Pro/Enterprise
]

// 5. Frontend com proteção
<ModuleProtectedRoute requiredModules={['new_feature']}>
  <NewFeature />
</ModuleProtectedRoute>
```

### **Template: Database Migration**
```sql
-- 1. Create tables
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'disconnected',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX idx_instances_tenant ON whatsapp_instances(tenant_id);
CREATE INDEX idx_instances_status ON whatsapp_instances(status);
```

---

## 🎯 **CHECKLIST DE QUALIDADE**

### **Para cada feature implementada**:
- [ ] ✅ **Funcional**: Feature funciona end-to-end
- [ ] ✅ **Testado**: Unit + integration tests
- [ ] ✅ **Documentado**: README + API docs
- [ ] ✅ **Modular**: Segue arquitetura de módulos
- [ ] ✅ **Seguro**: Authentication + authorization
- [ ] ✅ **Performático**: <2s response time
- [ ] ✅ **Responsivo**: Mobile-friendly
- [ ] ✅ **Acessível**: WCAG guidelines
- [ ] ✅ **Monitorado**: Logs + métricas
- [ ] ✅ **Escalável**: Suporta multi-tenant

---

## 🎯 **COMANDOS ÚTEIS PARA DESENVOLVIMENTO**

### **Backend**:
```bash
# Desenvolvimento
npm run dev

# Build e test
npm run build
npm run test

# Database
npx prisma migrate dev
npx prisma studio

# Scripts úteis
npx tsx src/scripts/activateModulesForExistingTenants.ts
```

### **Frontend**:
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Linting
npm run lint
npm run type-check
```

### **Deploy**:
```bash
# Docker build
docker build -t omnix-backend .
docker run -p 8300:8300 omnix-backend

# Coolify deploy
git push origin main  # Auto-deploy configured
```

---

## 🎯 **ESTRUTURA DE COMMITS**

```
feat(whatsapp): add instance creation and QR code generation

- Implement WhatsApp instance management
- Add QR code generation via WAHA API
- Include real-time status updates
- Add module limit enforcement

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📊 **TRACKING DE PROGRESSO**

### **Use issues no GitHub**:
```markdown
## WhatsApp Integration - Epic

### Tasks:
- [ ] Backend: Instance CRUD (#123)
- [ ] Backend: QR Code generation (#124)  
- [ ] Backend: Message sending (#125)
- [ ] Frontend: Instance list (#126)
- [ ] Frontend: QR Code modal (#127)
- [ ] Integration: WAHA webhook (#128)
- [ ] Testing: End-to-end (#129)

### Definition of Done:
- [ ] User can create WhatsApp instance
- [ ] User can connect via QR Code
- [ ] User can send/receive messages
- [ ] Admin can control limits per plan
- [ ] All tests passing
```

---

**🎯 FOCO TOTAL: Começar com WhatsApp + Messages. Esses dois módulos são o coração da aplicação. Uma vez funcionando perfeitamente, o resto é expansão natural do sistema de módulos já implementado!**