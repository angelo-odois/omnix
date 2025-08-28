import { Router, Request, Response } from 'express';
import wahaService from '../services/wahaService';
import tenantNumbersService from '../services/tenantNumbersService';
import messageService from '../services/messageService';
import webhookService from '../services/webhookService';
import { sessionPersistenceService } from '../services/sessionPersistenceService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Função para recuperar sessões existentes do WAHA
async function syncExistingSessions(tenantId: string) {
  try {
    console.log('Syncing existing WAHA sessions for tenant:', tenantId);
    
    // Buscar todas as sessões do WAHA
    const allSessions = await wahaService.getAllSessions();
    
    // Filtrar sessões do tenant
    const tenantSessions = allSessions.filter((session: any) => 
      session.name?.startsWith(`${tenantId}_`)
    );
    
    console.log(`Found ${tenantSessions.length} sessions for tenant ${tenantId}`);
    
    // Sincronizar cada sessão encontrada
    for (const session of tenantSessions) {
      const existingSession = sessionPersistenceService.getSession(session.name);
      
      if (!existingSession) {
        console.log('Recovering lost session:', session.name);
        
        // Recuperar webhook se existir
        const webhook = webhookService.getWebhookBySessionName(session.name);
        
        // Salvar sessão recuperada
        sessionPersistenceService.saveSession({
          sessionName: session.name,
          tenantId,
          displayName: session.me?.pushName || 'Sessão Recuperada',
          phoneNumber: session.me?.id,
          status: session.status === 'WORKING' ? 'connected' : 
                  session.status === 'SCAN_QR_CODE' ? 'pending_qr' : 
                  'disconnected',
          type: 'own_number',
          webhookUrl: webhook?.webhookUrl,
          webhookToken: webhook?.webhookToken
        });
      }
    }
    
    return tenantSessions.length;
  } catch (error) {
    console.error('Error syncing sessions:', error);
    return 0;
  }
}

// Listar sessões/instâncias do tenant
router.get('/waha/instances', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Sincronizar sessões existentes do WAHA primeiro
    await syncExistingSessions(tenantId);
    
    // Buscar sessões persistidas do tenant
    const persistedSessions = sessionPersistenceService.getTenantSessions(tenantId);
    
    // Para cada sessão, buscar status atualizado no WAHA
    const instances = [];
    
    for (const session of persistedSessions) {
      const wahaStatus = await wahaService.getSession(session.sessionName);
      
      // Atualizar status e número se mudou
      if (wahaStatus) {
        const newStatus = wahaStatus.status === 'WORKING' ? 'connected' : 
                         wahaStatus.status === 'SCAN_QR_CODE' ? 'pending_qr' : 
                         'disconnected';
        
        sessionPersistenceService.updateSessionStatus(
          session.sessionName, 
          newStatus,
          wahaStatus.me?.id
        );
        
        instances.push({
          id: session.sessionName,
          sessionName: session.sessionName,
          displayName: session.displayName,
          number: wahaStatus.me?.id || session.phoneNumber || 'Aguardando conexão',
          status: newStatus === 'pending_qr' ? 'qr_code' : newStatus,
          type: session.type,
          messagesCount: 0,
          lastSeen: null,
          createdAt: session.createdAt,
          webhookUrl: session.webhookUrl,
          apiKey: null
        });
      } else {
        // Se não encontrou no WAHA, usar dados persistidos
        instances.push({
          id: session.sessionName,
          sessionName: session.sessionName,
          displayName: session.displayName,
          number: session.phoneNumber || 'Aguardando conexão',
          status: session.status === 'pending_qr' ? 'qr_code' : session.status,
          type: session.type,
          messagesCount: 0,
          lastSeen: null,
          createdAt: session.createdAt,
          webhookUrl: session.webhookUrl,
          apiKey: null
        });
      }
    }
    
    return res.json({
      success: true,
      instances
    });
  } catch (error: any) {
    console.error('Error fetching instances:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar instâncias'
    });
  }
});

// Listar sessões do tenant
router.get('/waha/sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    const sessions = await wahaService.getTenantSessions(tenantId);
    
    return res.json({
      success: true,
      sessions
    });
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar sessões'
    });
  }
});

// Obter detalhes de uma sessão
router.get('/waha/sessions/:sessionName', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const session = await wahaService.getSession(sessionName);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    return res.json({
      success: true,
      session
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter sessão'
    });
  }
});

// Obter número conectado da sessão
router.get('/waha/sessions/:sessionName/connected-number', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await wahaService.getConnectedNumber(sessionName);
    
    // Se obteve o número com sucesso, atualizar no serviço de persistência
    if (result.success && result.phoneNumber) {
      sessionPersistenceService.updateSessionNumber(sessionName, result.phoneNumber);
      
      // Também atualizar no serviço de tenant
      const tenantNumbers = tenantNumbersService.getTenantNumbers(tenantId);
      const associatedNumber = tenantNumbers.find(n => 
        n.metadata?.wahaSessionName === sessionName
      );
      
      if (associatedNumber && associatedNumber.phoneNumber === 'Aguardando conexão') {
        tenantNumbersService.updateNumber(associatedNumber.id, {
          phoneNumber: result.phoneNumber,
          displayName: result.displayName || associatedNumber.displayName,
          metadata: {
            ...associatedNumber.metadata,
            status: 'connected',
            connectedAt: new Date().toISOString()
          }
        });
      }
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error getting connected number:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter número conectado'
    });
  }
});

// Obter QR Code da sessão
router.get('/waha/sessions/:sessionName/qr', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await wahaService.getQRCode(sessionName);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter QR Code'
    });
  }
});

// Gerar webhook para uma nova instância (antes de criar no WAHA)
router.post('/waha/sessions/generate-webhook', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Gerar nome único para a sessão
    const sessionName = `${tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar webhook para esta futura instância
    const webhook = webhookService.createInstanceWebhook({
      instanceId: sessionName,
      sessionName,
      tenantId,
      baseUrl: process.env.BACKEND_PUBLIC_URL
    });
    
    // Persistir sessão em estado pendente
    sessionPersistenceService.saveSession({
      sessionName,
      tenantId,
      displayName: displayName || 'Nova Instância',
      status: 'pending_qr',
      type: 'own_number',
      webhookUrl: webhook.webhookUrl,
      webhookToken: webhook.webhookToken
    });
    
    return res.json({
      success: true,
      sessionName,
      webhookUrl: webhook.webhookUrl,
      webhookToken: webhook.webhookToken,
      displayName: displayName || 'Nova Instância'
    });
  } catch (error: any) {
    console.error('Error generating webhook:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar webhook'
    });
  }
});

// Criar sessão para número próprio
router.post('/waha/sessions/own-number', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    console.log('Creating own number session:', { displayName, tenantId });
    
    // Verificar limite de números do tenant (opcional)
    const currentNumbers = tenantNumbersService.countActiveTenantNumbers(tenantId);
    const maxNumbers = 10; // Limite configurável
    
    if (currentNumbers >= maxNumbers) {
      return res.status(400).json({
        success: false,
        message: `Limite de ${maxNumbers} números atingido`
      });
    }
    
    // Criar sessão WAHA para número próprio
    const result = await wahaService.createOwnNumberSession(tenantId, displayName);
    console.log('WAHA session creation result:', result);
    
    if (result.success && result.sessionName) {
      // Criar webhook para esta instância
      const webhook = webhookService.createInstanceWebhook({
        instanceId: result.sessionName,
        sessionName: result.sessionName,
        tenantId,
        baseUrl: process.env.BACKEND_PUBLIC_URL
      });
      
      // Salvar número próprio no serviço de tenant
      const savedNumber = tenantNumbersService.createNumber({
        tenantId,
        salvyAccountId: `own_${result.sessionName}`,
        phoneNumber: 'Aguardando conexão',
        displayName: displayName || 'Número Próprio',
        areaCode: '00',
        redirectNumber: 'N/A',
        metadata: {
          type: 'own_number',
          wahaSessionName: result.sessionName,
          status: 'pending_qr',
          webhookUrl: webhook.webhookUrl,
          webhookToken: webhook.webhookToken
        }
      });
      
      // Persistir sessão
      sessionPersistenceService.saveSession({
        sessionName: result.sessionName,
        tenantId,
        displayName: displayName || 'Número Próprio',
        status: 'pending_qr',
        type: 'own_number',
        webhookUrl: webhook.webhookUrl,
        webhookToken: webhook.webhookToken,
        metadata: {
          numberId: savedNumber.id
        }
      });
      
      return res.json({
        success: true,
        sessionName: result.sessionName,
        numberId: savedNumber.id,
        message: 'Sessão criada. Escaneie o QR Code para conectar.'
      });
    }
    
    return res.status(400).json(result);
  } catch (error: any) {
    console.error('Error creating own number session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar sessão'
    });
  }
});

// Reiniciar sessão
router.post('/waha/sessions/:sessionName/restart', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await wahaService.restartSession(sessionName);
    
    // Atualizar status na persistência
    if (result.success) {
      sessionPersistenceService.updateSessionStatus(sessionName, 'pending_qr');
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error restarting session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao reiniciar sessão'
    });
  }
});

// Parar sessão
router.post('/waha/sessions/:sessionName/stop', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await wahaService.stopSession(sessionName);
    
    // Atualizar status na persistência
    if (result.success) {
      sessionPersistenceService.updateSessionStatus(sessionName, 'disconnected');
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error stopping session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao parar sessão'
    });
  }
});

// Deletar sessão
router.delete('/waha/sessions/:sessionName', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const result = await wahaService.deleteSession(sessionName);
    
    // Se deletou com sucesso, remover da persistência
    if (result.success) {
      sessionPersistenceService.deleteSession(sessionName);
      
      // Atualizar número no serviço de tenant
      const tenantNumbers = tenantNumbersService.getTenantNumbers(tenantId);
      const associatedNumber = tenantNumbers.find(n => 
        n.metadata?.wahaSessionName === sessionName
      );
      
      if (associatedNumber) {
        tenantNumbersService.updateNumberStatus(associatedNumber.id, 'inactive');
      }
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error deleting session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao deletar sessão'
    });
  }
});

// Webhook do WAHA - endpoint legado sem token (para sessões antigas)
router.post('/waha/webhook', async (req: Request, res: Response) => {
  try {
    const { event, session, data } = req.body;
    
    // Para sessões antigas sem token, usar o nome da sessão
    const sessionName = session?.name || data?.session;
    
    if (!sessionName) {
      console.error('No session name in webhook request');
      return res.status(400).json({ error: 'No session name' });
    }
    
    console.log('Legacy webhook received for session:', sessionName);
    
    // Buscar tenant pela sessão
    let tenantId = 'tenant-1'; // default
    if (sessionName.startsWith('tenant-1_')) {
      tenantId = 'tenant-1';
    }
    
    // Se é a sessão específica que sabemos que existe
    if (sessionName === 'tenant-1_own_1756353500704') {
      // Garantir que esta sessão está persistida
      const existingSession = sessionPersistenceService.getSession(sessionName);
      if (!existingSession) {
        sessionPersistenceService.saveSession({
          sessionName,
          tenantId: 'tenant-1',
          displayName: 'Angelo',
          phoneNumber: '5561936182610@c.us',
          status: 'connected',
          type: 'own_number'
        });
      }
    }
    
    console.log('Processing legacy webhook:', {
      sessionName,
      tenantId,
      event,
      messageFrom: data?.from
    });
    
    // Processar diferentes eventos
    switch (event) {
      case 'session.status':
        if (data?.status === 'WORKING' && data?.me?.id) {
          sessionPersistenceService.updateSessionStatus(sessionName, 'connected', data.me.id);
        } else if (data?.status === 'SCAN_QR_CODE') {
          sessionPersistenceService.updateSessionStatus(sessionName, 'pending_qr');
        } else if (data?.status === 'FAILED') {
          sessionPersistenceService.updateSessionStatus(sessionName, 'failed');
        }
        break;
        
      case 'message':
      case 'message.any':
        if (data) {
          const processedMessage = messageService.processIncomingMessage({
            sessionName,
            tenantId,
            message: data
          });
          
          console.log('Message processed (legacy):', {
            id: processedMessage.id,
            from: processedMessage.from,
            content: processedMessage.content?.substring(0, 50)
          });
        }
        break;
        
      case 'message.ack':
        if (data?.ack) {
          console.log('Message acknowledgment (legacy):', {
            messageId: data.id,
            ack: data.ack
          });
        }
        break;
        
      default:
        console.log('Unhandled webhook event (legacy):', event);
    }
    
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing legacy webhook:', error);
    return res.json({ success: false, error: error.message });
  }
});

// Webhook do WAHA com token específico da instância
router.post('/waha/webhook/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { event, session, data } = req.body;
    
    // Validar webhook token
    const webhook = webhookService.getWebhookByToken(token);
    if (!webhook) {
      console.error('Invalid webhook token:', token);
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const { sessionName, tenantId } = webhook;
    
    console.log('WAHA Webhook received for instance:', {
      sessionName,
      tenantId,
      event,
      session: session?.name
    });
    
    // Processar diferentes eventos
    switch (event) {
      case 'session.status':
        // Atualizar status da sessão
        if (data?.status === 'WORKING' && data?.me?.id) {
          sessionPersistenceService.updateSessionStatus(sessionName, 'connected', data.me.id);
        } else if (data?.status === 'SCAN_QR_CODE') {
          sessionPersistenceService.updateSessionStatus(sessionName, 'pending_qr');
        } else if (data?.status === 'FAILED') {
          sessionPersistenceService.updateSessionStatus(sessionName, 'failed');
        }
        break;
        
      case 'message':
      case 'message.any':
        // Processar mensagem recebida
        if (data) {
          const processedMessage = messageService.processIncomingMessage({
            sessionName,
            tenantId,
            message: data
          });
          
          console.log('Message processed:', {
            id: processedMessage.id,
            from: processedMessage.from,
            content: processedMessage.content?.substring(0, 50)
          });
        }
        break;
        
      case 'message.ack':
        // Atualizar status de entrega da mensagem
        if (data?.ack) {
          console.log('Message acknowledgment:', {
            messageId: data.id,
            ack: data.ack
          });
        }
        break;
        
      default:
        console.log('Unhandled webhook event:', event);
    }
    
    // Sempre retornar 200 para o WAHA
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    // Retornar 200 mesmo em erro para evitar retry do WAHA
    return res.json({ success: false, error: error.message });
  }
});

// DEBUG: Listar todas as sessões (para desenvolvimento)
router.get('/waha/debug/all-sessions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Buscar todas as sessões do WAHA
    const wahaSessions = await wahaService.getAllSessions();
    
    // Buscar sessões persistidas
    const persistedSessions = sessionPersistenceService.getAllSessions();
    
    // Buscar webhooks
    const allWebhooks = webhookService.getTenantWebhooks(tenantId);
    
    return res.json({
      success: true,
      debug: {
        tenantId,
        wahaSessions: wahaSessions.map((s: any) => ({
          name: s.name,
          status: s.status,
          me: s.me,
          config: s.config
        })),
        persistedSessions: persistedSessions,
        webhooks: allWebhooks,
        tenantSessionsCount: wahaSessions.filter((s: any) => s.name?.startsWith(`${tenantId}_`)).length
      }
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;