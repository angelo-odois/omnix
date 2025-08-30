/**
 * EXEMPLOS DE USO - Middleware de Módulos
 * 
 * Este arquivo mostra como usar os middlewares de módulos nas rotas.
 * NÃO EXECUTAR - apenas para referência e exemplos.
 */

import { Router } from 'express';
import { requireModule, requireAnyModule, requireAllModules } from '../middlewares/moduleAuth';
import { authenticate } from '../middlewares/authV2';

const router = Router();

// ====== EXEMPLO 1: Rota que requer um módulo específico ======
// WhatsApp - só funciona se o módulo whatsapp estiver ativo
router.get('/whatsapp/instances', 
  authenticate,
  requireModule('whatsapp', 'read'),  // Requer módulo whatsapp com permissão de leitura
  async (req, res) => {
    // req.module contém as informações do módulo ativo
    const { config, usage } = req.module!;
    
    // Verificar se não excedeu o limite de instâncias
    if (config.maxInstances > 0 && usage.instances >= config.maxInstances) {
      return res.status(429).json({
        success: false,
        message: `Limite de ${config.maxInstances} instâncias atingido`
      });
    }
    
    res.json({ 
      success: true, 
      instances: [], // suas instâncias
      limits: {
        current: usage.instances,
        max: config.maxInstances
      }
    });
  }
);

// ====== EXEMPLO 2: Rota que aceita qualquer módulo de comunicação ======
// Pode usar WhatsApp OU Telegram OU Instagram
router.post('/messages/send',
  authenticate,
  requireAnyModule(['whatsapp', 'telegram', 'instagram'], 'write'), // Qualquer um destes
  async (req, res) => {
    const activeModule = req.module!;
    
    // Lógica baseada no módulo ativo
    switch (activeModule.id) {
      case 'whatsapp':
        // Enviar via WhatsApp
        break;
      case 'telegram':
        // Enviar via Telegram
        break;
      case 'instagram':
        // Enviar via Instagram
        break;
    }
    
    res.json({ success: true, via: activeModule.name });
  }
);

// ====== EXEMPLO 3: Rota que requer múltiplos módulos ======
// Workflow avançado que precisa de workflows + AI + analytics
router.post('/workflows/advanced',
  authenticate,
  requireAllModules(['workflows', 'salvy', 'analytics'], 'write'), // TODOS são obrigatórios
  async (req, res) => {
    // Só executa se TODOS os módulos estiverem ativos
    res.json({ success: true, message: 'Workflow avançado criado' });
  }
);

// ====== EXEMPLO 4: Middleware customizado por módulo ======
const requirePremiumFeature = requireModule('analytics', 'admin');

router.get('/reports/advanced',
  authenticate,
  requirePremiumFeature,  // Apenas quem tem o módulo analytics
  async (req, res) => {
    const { config } = req.module!;
    
    // Verificar se tem acesso a relatórios avançados
    if (!config.customLimits?.advancedReports) {
      return res.status(403).json({
        success: false,
        message: 'Relatórios avançados não incluídos no seu plano'
      });
    }
    
    res.json({ success: true, reports: [] });
  }
);

// ====== EXEMPLO 5: Middleware condicional ======
router.use('/api/workflows', authenticate);

// Rota básica - não precisa de módulo (todos podem ver)
router.get('/api/workflows/templates', async (req, res) => {
  res.json({ templates: [] });
});

// Rota que precisa do módulo - apenas quem tem pode usar
router.post('/api/workflows/create',
  requireModule('workflows', 'write'),
  async (req, res) => {
    const { config, usage } = req.module!;
    
    // Verificar limite de workflows
    const maxWorkflows = config.customLimits?.maxWorkflows || 0;
    if (maxWorkflows > 0 && usage.workflows >= maxWorkflows) {
      return res.status(429).json({
        success: false,
        message: `Limite de ${maxWorkflows} workflows atingido`,
        upgrade: 'Faça upgrade do seu plano para criar mais workflows'
      });
    }
    
    // Criar workflow...
    res.json({ success: true, workflowId: 'new-id' });
  }
);

// ====== EXEMPLO 6: Rota administrativa com validação de módulo ======
router.delete('/api/workflows/:id',
  authenticate,
  requireModule('workflows', 'admin'),  // Precisa de permissão administrativa
  async (req, res) => {
    // Apenas quem tem permissão de admin no módulo workflows pode deletar
    res.json({ success: true, message: 'Workflow deletado' });
  }
);

// ====== EXEMPLO 7: Middleware de upgrade ======
const suggestUpgrade = (requiredModule: string) => {
  return (req: any, res: any, next: any) => {
    // Se chegou aqui, é porque o módulo não está ativo
    // Sugerir upgrade
    res.status(403).json({
      success: false,
      message: `Funcionalidade requer o módulo ${requiredModule}`,
      upgrade: {
        module: requiredModule,
        availableIn: ['Professional', 'Enterprise'],
        contact: '/upgrade'
      }
    });
  };
};

// Usar em rotas que devem sugerir upgrade
router.use('/api/ai', authenticate, requireModule('salvy'), suggestUpgrade('salvy'));

// ====== EXEMPLO 8: Logging de uso de módulo ======
const trackModuleUsage = (req: any, res: any, next: any) => {
  if (req.module) {
    // Incrementar contador de uso
    console.log(`Módulo ${req.module.id} usado por tenant ${req.user.tenantId}`);
    // Aqui você poderia salvar métricas, analytics, etc.
  }
  next();
};

router.use(trackModuleUsage); // Aplicar em todas as rotas

// ====== EXEMPLO 9: Validação de dependências ======
router.post('/api/integrations/webhook',
  authenticate,
  requireAllModules(['webhooks', 'messages']), // Webhook precisa de messages
  async (req, res) => {
    res.json({ success: true });
  }
);

// ====== EXEMPLO 10: Middleware para features experimentais ======
const requireBetaFeature = (feature: string) => {
  return requireModule('beta-features', 'read'); // Módulo especial para betas
};

router.get('/api/beta/new-feature',
  authenticate,
  requireBetaFeature('new-feature'),
  async (req, res) => {
    res.json({ success: true, message: 'Feature em beta' });
  }
);

/**
 * RESUMO DOS MIDDLEWARES:
 * 
 * 1. requireModule(id, action?) - Um módulo específico
 * 2. requireAnyModule([ids], action?) - Qualquer um dos módulos
 * 3. requireAllModules([ids], action?) - TODOS os módulos
 * 
 * ACTIONS:
 * - 'read' - Permissão de leitura
 * - 'write' - Permissão de escrita  
 * - 'admin' - Permissão administrativa
 * 
 * RESPONSE CODES:
 * - 401: Não autenticado
 * - 403: Módulo não ativo ou sem permissão
 * - 429: Limite do módulo excedido
 * - 404: Módulo não encontrado
 * 
 * REQUEST OBJECT:
 * req.module = {
 *   id: string,
 *   name: string, 
 *   config: ModuleConfig,
 *   usage: ModuleUsage
 * }
 */

export default router;