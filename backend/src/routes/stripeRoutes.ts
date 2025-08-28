import { Router, Request, Response } from 'express';
import stripeService from '../services/stripeService';
import salvyService from '../services/salvyService';
import pendingRequestsService from '../services/pendingRequestsService';
import tenantNumbersService from '../services/tenantNumbersService';
import wahaService from '../services/wahaService';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Criar sessão de checkout
router.post('/stripe/create-checkout-session', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { areaCode, redirectNumber, displayName, mode = 'payment', requestId } = req.body;
    const userId = req.user?.id || '';
    const userEmail = req.user?.email || '';
    const tenantId = req.user?.tenantId || 'tenant-1';

    // Validar campos obrigatórios
    if (!areaCode || !redirectNumber || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    let pendingRequest;
    
    // Se tem requestId, está retomando uma solicitação existente
    if (requestId) {
      pendingRequest = pendingRequestsService.getRequestById(requestId);
      if (!pendingRequest) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada ou expirada'
        });
      }
    } else {
      // Criar nova solicitação pendente
      pendingRequest = pendingRequestsService.createPendingRequest({
        userId,
        tenantId,
        areaCode,
        redirectNumber,
        displayName
      });
    }

    // Criar sessão baseada no modo
    const result = mode === 'subscription' 
      ? await stripeService.createSubscription({
          areaCode,
          redirectNumber,
          displayName,
          userEmail,
          userId,
          tenantId
        })
      : await stripeService.createCheckoutSession({
          areaCode,
          redirectNumber,
          displayName,
          userEmail,
          userId,
          tenantId
        });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Atualizar solicitação com informações do Stripe
    if (result.sessionId && result.url) {
      pendingRequestsService.updateRequestWithStripeSession(
        pendingRequest.id,
        result.sessionId,
        result.url
      );
    }

    return res.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
      requestId: pendingRequest.id
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar sessão de pagamento'
    });
  }
});

// Verificar status da sessão
router.get('/stripe/session/:sessionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await stripeService.retrieveSession(sessionId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao recuperar sessão'
    });
  }
});

// Webhook do Stripe
router.post('/stripe/webhook', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const result = await stripeService.handleWebhook(req.body, sig);
    
    // Se o webhook indica que devemos criar o número virtual
    if (result.action === 'create_virtual_number' && result.metadata) {
      const { areaCode, redirectNumber, displayName, tenantId } = result.metadata;
      
      // Verificar se o número já existe para este tenant
      const existingNumber = tenantNumbersService.numberExistsForTenant(
        `+55 ${areaCode} 9XXXX-XXXX`, // Placeholder, será substituído pelo número real
        tenantId
      );
      
      if (!existingNumber) {
        // Criar número na Salvy
        const salvyResult = await salvyService.createVirtualNumber({
          areaCode,
          redirectNumber,
          displayName,
          tenantId
        });
        
        if (salvyResult.success && salvyResult.phoneNumber) {
          console.log('Virtual number created successfully:', salvyResult.phoneNumber);
          
          // Importar mapeamento de DDD
          const { getDDDInfo } = require('../utils/dddMapping');
          const dddInfo = getDDDInfo(areaCode);
          
          // Salvar número no serviço de tenant
          const savedNumber = tenantNumbersService.createNumber({
            tenantId,
            salvyAccountId: salvyResult.accountId || `salvy_${Date.now()}`,
            phoneNumber: salvyResult.phoneNumber,
            displayName,
            areaCode,
            redirectNumber,
            stripeSubscriptionId: result.subscriptionId,
            metadata: {
              city: dddInfo.city,
              state: dddInfo.stateCode,
              type: 'mobile',
              capabilities: ['sms', 'voice', 'whatsapp']
            }
          });
          
          console.log('Number saved for tenant:', savedNumber);
          
          // Criar sessão WAHA automaticamente para o número
          const wahaResult = await wahaService.createSession({
            sessionName: `${tenantId}_${salvyResult.phoneNumber.replace(/\D/g, '')}`,
            tenantId,
            phoneNumber: salvyResult.phoneNumber,
            displayName,
            metadata: {
              salvyAccountId: salvyResult.accountId,
              numberType: 'salvy',
              areaCode,
              redirectNumber
            }
          });
          
          if (wahaResult.success) {
            console.log('WAHA session created for number:', wahaResult.session?.name);
            
            // Atualizar número com informação da sessão WAHA
            tenantNumbersService.updateNumber(savedNumber.id, {
              metadata: {
                ...savedNumber.metadata,
                wahaSessionName: wahaResult.session?.name
              }
            });
          } else {
            console.error('Failed to create WAHA session:', wahaResult.message);
          }
          
          // Marcar solicitação como concluída se tiver sessionId
          if (result.sessionId) {
            const request = pendingRequestsService.getRequestByStripeSessionId(result.sessionId);
            if (request) {
              pendingRequestsService.markAsCompleted(request.id);
            }
          }
        } else {
          console.error('Failed to create virtual number:', salvyResult.message);
        }
      } else {
        console.log('Number already exists for this tenant');
      }
    }
    
    return res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Webhook error'
    });
  }
});

// Cancelar assinatura
router.post('/stripe/cancel-subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'ID da assinatura é obrigatório'
      });
    }

    const result = await stripeService.cancelSubscription(subscriptionId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar assinatura'
    });
  }
});

// Listar solicitações pendentes do usuário
router.get('/stripe/pending-requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const requests = pendingRequestsService.getUserPendingRequests(userId);
    
    return res.json({
      success: true,
      requests
    });
  } catch (error: any) {
    console.error('Error getting pending requests:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar solicitações pendentes'
    });
  }
});

// Cancelar solicitação pendente
router.delete('/stripe/pending-requests/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id || '';
    
    // Verificar se a solicitação pertence ao usuário
    const request = pendingRequestsService.getRequestById(requestId);
    if (!request || request.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    const success = pendingRequestsService.cancelRequest(requestId);
    
    return res.json({
      success,
      message: success ? 'Solicitação cancelada' : 'Erro ao cancelar solicitação'
    });
  } catch (error: any) {
    console.error('Error canceling request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar solicitação'
    });
  }
});

export default router;