# 🧩 OmniX - Arquitetura Orientada a Módulos

## Visão Geral

A partir de agora, **TUDO** no sistema OmniX deve ser construído como **módulos**. Esta arquitetura permite controle granular sobre funcionalidades por plano e tenant.

## Filosofia de Desenvolvimento

### ✅ SEMPRE módulo:
- Nova funcionalidade → Novo módulo
- Integração externa → Módulo de integração  
- Feature opcional → Módulo ativável
- Funcionalidade premium → Módulo restrito por plano

### ❌ NUNCA hardcoded:
- Features fixas no core
- Funcionalidades sem controle de acesso
- Integrações sem modularização

## Estrutura de Módulo

### 1. Definição Básica
```typescript
const MODULE_EXAMPLE = {
  id: 'example_feature',
  name: 'example-feature',
  displayName: 'Feature Exemplo',
  description: 'Funcionalidade de exemplo',
  category: 'integration', // communication | automation | integration | analytics | core
  
  // Controle de ativação
  isCore: false,
  requiresActivation: true,
  
  // Dependências
  dependencies: [
    { moduleId: 'messages', required: true }
  ],
  
  // Configuração e limites
  defaultConfig: {
    maxRequests: 1000,
    customLimits: { maxFeatures: 10 }
  }
}
```

### 2. Estrutura de Arquivos
```
/backend/src/modules/example-feature/
├── index.ts              # Exportações do módulo
├── types.ts              # Interfaces específicas
├── service.ts            # Lógica de negócio
├── routes.ts             # Endpoints da API
├── middleware.ts         # Middlewares específicos
├── config.ts             # Configurações padrão
└── README.md             # Documentação
```

## Categorias de Módulos

### 🔧 **Core** - Essenciais ao sistema
- `messages` - Sistema de mensagens
- `contacts` - Gerenciamento de contatos  
- `auth` - Autenticação e autorização
- `admin` - Painel administrativo

### 💬 **Communication** - Comunicação
- `whatsapp` - Integração WhatsApp
- `telegram` - Integração Telegram
- `instagram` - Integração Instagram
- `email` - Email marketing

### ⚡ **Automation** - Automação
- `workflows` - Fluxos de automação
- `chatbot` - Bot de conversação
- `auto-response` - Respostas automáticas
- `scheduling` - Agendamento

### 🔗 **Integration** - Integrações
- `salvy` - AI Assistant
- `stripe` - Pagamentos
- `webhooks` - Integrações via webhook
- `zapier` - Integrações Zapier
- `api` - Acesso completo à API

### 📊 **Analytics** - Analytics
- `analytics` - Relatórios básicos
- `advanced-reports` - Relatórios avançados
- `real-time-dashboard` - Dashboard em tempo real
- `exports` - Exportação de dados

## Níveis de Acesso

### 🎯 **Por Plano**
```typescript
// Starter: Básico
modules: [
  { moduleId: 'whatsapp', limits: { maxInstances: 2 } },
  { moduleId: 'workflows', limits: { maxWorkflows: 5 } }
]

// Professional: Completo
modules: [
  { moduleId: 'whatsapp', limits: { maxInstances: 5 } },
  { moduleId: 'workflows', limits: { maxWorkflows: 20 } },
  { moduleId: 'api', included: true },
  { moduleId: 'analytics', included: true }
]

// Enterprise: Ilimitado
modules: [
  { moduleId: 'whatsapp', limits: { maxInstances: -1 } },
  { moduleId: 'salvy', included: true },
  { moduleId: 'advanced-reports', included: true }
]
```

### 👥 **Por Role**
- `super_admin`: Acesso total aos módulos
- `tenant_admin`: Módulos do plano + gerenciamento
- `tenant_manager`: Módulos operacionais + workflows  
- `tenant_operator`: Módulos básicos de operação

## Fluxo de Desenvolvimento

### 1. **Planejamento**
```markdown
# Nova Feature: Sistema de Tickets

## Análise:
- É uma funcionalidade adicional? ✅ SIM → MÓDULO
- Tem dependências? messages, contacts
- É premium? Apenas Pro/Enterprise
- Categoria: communication
```

### 2. **Criação do Módulo**
```typescript
// 1. Definir no moduleService
const TICKETS_MODULE = {
  id: 'tickets',
  displayName: 'Sistema de Tickets',
  category: 'communication',
  dependencies: [
    { moduleId: 'messages', required: true },
    { moduleId: 'contacts', required: true }
  ],
  requiredRoles: ['tenant_manager']
}

// 2. Criar estrutura de arquivos
// 3. Implementar service + routes
// 4. Adicionar aos pacotes
// 5. Testar ativação/desativação
```

### 3. **Integração aos Pacotes**
```typescript
// adminService.ts - Adicionar aos pacotes
modules: [
  { moduleId: 'tickets', included: false }, // Starter
  { moduleId: 'tickets', included: true },  // Professional
  { moduleId: 'tickets', included: true }   // Enterprise
]
```

## Benefícios da Arquitetura

### 🎯 **Controle Granular**
- Ative/desative features por tenant
- Limite recursos por plano
- Teste A/B de funcionalidades

### 💰 **Monetização**
- Features premium como módulos pagos
- Upsell baseado em necessidades
- Planos flexíveis

### 🔧 **Manutenção**
- Código organizado e isolado
- Deploy independente de módulos
- Testes unitários por módulo

### 📈 **Escalabilidade**
- Adicione features sem quebrar o core
- Marketplace de módulos terceiros
- Customização por cliente

## Regras de Ouro

### ✅ DO (Faça):
- Sempre crie um módulo para novas features
- Defina dependências claras
- Configure limites apropriados
- Documente o módulo
- Teste ativação/desativação

### ❌ DON'T (Não Faça):
- Hardcode features no core
- Crie funcionalidades sem controle
- Ignere dependências
- Pule validações de plano
- Esqueça da documentação

## Próximos Passos

1. **Middleware de Módulos**: Proteção automática de rotas
2. **Sistema de Ativação**: Interface para ativar módulos por tenant
3. **Marketplace**: Loja de módulos terceiros
4. **SDK**: Kit para desenvolvimento de módulos
5. **Analytics**: Métricas de uso por módulo

---

> **🎯 Lembre-se**: Se é uma feature, é um módulo. Se é um módulo, tem controle total sobre quando e como usar.