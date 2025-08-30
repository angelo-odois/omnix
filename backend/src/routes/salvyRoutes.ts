import { Router, Request, Response } from 'express';
import salvyService from '../services/salvyService';
import { authenticate, AuthRequest } from '../middlewares/authV2';

const router = Router();

// Buscar números disponíveis
router.get('/salvy/numbers/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { country, areaCode, contains, type, limit } = req.query;

    const numbers = await salvyService.searchAvailableNumbers({
      country: country as string,
      areaCode: areaCode as string,
      contains: contains as string,
      type: type as 'mobile' | 'landline' | 'toll-free',
      limit: limit ? parseInt(limit as string) : 20
    });

    return res.json({ 
      success: true,
      numbers 
    });
  } catch (error: any) {
    console.error('Error searching numbers:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao buscar números' 
    });
  }
});

// Comprar número
router.post('/salvy/numbers/purchase', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { numberId, alias } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';

    if (!numberId) {
      return res.status(400).json({ 
        success: false,
        message: 'ID do número é obrigatório' 
      });
    }

    const result = await salvyService.purchaseNumber({
      numberId,
      tenantId,
      alias
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error purchasing number:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao comprar número' 
    });
  }
});

// Listar números do tenant
router.get('/salvy/numbers/owned', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Importar o serviço de números do tenant
    const tenantNumbersService = require('../services/tenantNumbersService').default;
    
    // Buscar números salvos do tenant
    const tenantNumbers = tenantNumbersService.getTenantNumbers(tenantId);
    
    // Formatar números para o formato esperado pelo frontend
    const formattedNumbers = tenantNumbers.map(num => ({
      id: num.salvyAccountId,
      number: num.phoneNumber,
      country: 'BR',
      city: num.metadata?.city || 'São Paulo',
      state: num.metadata?.state || 'SP',
      areaCode: num.areaCode,
      type: num.metadata?.type || 'mobile',
      capabilities: num.metadata?.capabilities || ['sms', 'voice', 'whatsapp'],
      monthlyPrice: num.monthlyPrice,
      setupPrice: 0,
      available: false,
      displayName: num.displayName,
      status: num.status,
      connectedInstance: num.metadata?.connectedInstance,
      alias: num.displayName // Para compatibilidade
    }));
    
    return res.json({ 
      success: true,
      numbers: formattedNumbers 
    });
  } catch (error: any) {
    console.error('Error listing owned numbers:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao listar números' 
    });
  }
});

// Solicitar portabilidade
router.post('/salvy/portability/request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentNumber, currentCarrier, ownerDocument } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';

    if (!currentNumber || !currentCarrier || !ownerDocument) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const result = await salvyService.requestPortability({
      currentNumber,
      currentCarrier,
      ownerDocument,
      tenantId
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error requesting portability:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao solicitar portabilidade' 
    });
  }
});

// Status da portabilidade
router.get('/salvy/portability/status/:requestId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const status = await salvyService.checkPortabilityStatus(requestId);
    return res.json({ 
      success: true,
      ...status 
    });
  } catch (error: any) {
    console.error('Error checking portability status:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao verificar status' 
    });
  }
});

// Cancelar número
router.delete('/salvy/numbers/:numberId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { numberId } = req.params;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    // Importar o serviço de números do tenant
    const tenantNumbersService = require('../services/tenantNumbersService').default;
    
    // Verificar se o número pertence ao tenant
    const tenantNumber = tenantNumbersService.getNumberBySalvyId(numberId);
    if (!tenantNumber || tenantNumber.tenantId !== tenantId) {
      return res.status(404).json({ 
        success: false,
        message: 'Número não encontrado' 
      });
    }
    
    // Cancelar na Salvy
    const result = await salvyService.cancelNumber(numberId);
    
    if (result.success) {
      // Atualizar status no serviço de tenant
      tenantNumbersService.updateNumberStatus(tenantNumber.id, 'suspended');
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error canceling number:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao cancelar número' 
    });
  }
});

// Criar número virtual após confirmação de pagamento
router.post('/salvy/numbers/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { areaCode, redirectNumber, displayName } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';

    // Validar campos obrigatórios
    if (!areaCode || !redirectNumber || !displayName) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos os campos são obrigatórios (areaCode, redirectNumber, displayName)' 
      });
    }

    // Validar formato do número de redirecionamento
    const cleanRedirect = redirectNumber.replace(/\D/g, '');
    if (cleanRedirect.length < 10 || cleanRedirect.length > 11) {
      return res.status(400).json({ 
        success: false,
        message: 'Número de redirecionamento inválido' 
      });
    }

    // Criar número virtual na Salvy
    const result = await salvyService.createVirtualNumber({
      areaCode,
      redirectNumber,
      displayName,
      tenantId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Retornar sucesso com o número criado
    return res.json({
      success: true,
      phoneNumber: result.phoneNumber,
      accountId: result.accountId,
      message: result.message || 'Número virtual criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating virtual number:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao criar número virtual' 
    });
  }
});

export default router;