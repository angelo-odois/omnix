import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authV2';
import { requireModule } from '../../middlewares/moduleAuth';
import { SYSTEM_MODULES } from '../../types/modules';
import whatsappService from './service';
import webhookHandler from './webhookHandler';
import prisma from '../../lib/database';
import wahaClient from './wahaClient';

const router = Router();

// ============= WEBHOOK HANDLER (NO AUTH) =============

// WAHA webhook endpoint - no authentication required
router.post('/webhook/:sessionName', async (req: Request, res: Response) => {
  await webhookHandler.handleWebhook(req, res);
});

// Sync all instances with WAHA (admin only)
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas super admin pode executar sync'
      });
    }

    await webhookHandler.syncAllInstances();
    
    res.json({
      success: true,
      message: 'Sync executado com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============= WHATSAPP INSTANCE MANAGEMENT (AUTH REQUIRED) =============

// Get all instances for tenant (or all for super admin)
router.get('/instances', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let instances;
    
    if (req.user?.role === 'super_admin') {
      // Super admin can see all instances from all tenants
      instances = await prisma.whatsAppInstance.findMany({
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Format for super admin view
      instances = instances.map(instance => ({
        id: instance.id,
        tenantId: instance.tenantId,
        tenantName: instance.tenant?.name,
        tenantEmail: instance.tenant?.email,
        name: instance.name,
        phoneNumber: instance.phoneNumber || undefined,
        status: instance.status,
        qrCode: instance.qrCode || undefined,
        lastSeen: instance.lastSeen || undefined,
        webhookUrl: instance.webhookUrl || undefined,
        settings: instance.settings || {},
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      }));
    } else {
      // Regular users see only their tenant's instances
      if (!req.user?.tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant não identificado'
        });
      }
      
      instances = await whatsappService.getInstances(req.user.tenantId);
    }
    
    res.json({
      success: true,
      data: instances
    });
  } catch (error: any) {
    console.error('Error fetching WhatsApp instances:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar instâncias'
    });
  }
});

// Create new instance
router.post('/instances', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { name, settings } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da instância é obrigatório'
      });
    }

    const instance = await whatsappService.createInstance(req.user.tenantId, { name, settings });
    
    res.json({
      success: true,
      data: instance,
      message: 'Instância criada com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating WhatsApp instance:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar instância'
    });
  }
});

// Connect instance (generate QR code)
router.post('/instances/:id/connect', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await whatsappService.connectInstance(id);
    
    res.json({
      success: true,
      data: result,
      message: 'QR Code gerado. Use o WhatsApp para escanear.'
    });
  } catch (error: any) {
    console.error('Error connecting WhatsApp instance:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao conectar instância'
    });
  }
});

// Disconnect instance
router.post('/instances/:id/disconnect', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const success = await whatsappService.disconnectInstance(id);
    
    res.json({
      success,
      message: success ? 'Instância desconectada' : 'Falha ao desconectar'
    });
  } catch (error: any) {
    console.error('Error disconnecting WhatsApp instance:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao desconectar instância'
    });
  }
});

// Get instance status
router.get('/instances/:id/status', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const status = await whatsappService.getInstanceStatus(id);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error getting instance status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao obter status'
    });
  }
});

// Delete (terminate) instance permanently
router.delete('/instances/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find instance (no tenant restriction for super admin)
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada'
      });
    }

    // Check permissions: super admin can delete any instance, others only their tenant's
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== instance.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para encerrar esta instância'
      });
    }

    const success = await whatsappService.terminateInstance(id);
    
    res.json({
      success,
      message: success ? 'Instância encerrada permanentemente' : 'Falha ao encerrar instância'
    });
  } catch (error: any) {
    console.error('Error terminating WhatsApp instance:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao encerrar instância'
    });
  }
});

// Get QR Code for instance
router.get('/instances/:id/qr', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Instância não encontrada'
      });
    }

    const settings = instance.settings as any;
    const sessionName = settings?.wahaSession;
    
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: 'Sessão WAHA não configurada'
      });
    }

    // Try to get fresh QR code from WAHA
    const qrCode = await wahaClient.getQRCode(sessionName);
    
    // Update database if QR code is available
    if (qrCode && qrCode !== instance.qrCode) {
      await prisma.whatsAppInstance.update({
        where: { id },
        data: { qrCode }
      });
    }
    
    res.json({
      success: true,
      data: {
        qrCode: qrCode || instance.qrCode,
        status: instance.status,
        hasQR: !!qrCode
      }
    });
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter QR Code'
    });
  }
});

// Send message
router.post('/instances/:id/send', authenticate, requireModule(SYSTEM_MODULES.WHATSAPP, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { to, message, type, mediaUrl } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Destinatário e mensagem são obrigatórios'
      });
    }

    const result = await whatsappService.sendMessage(id, { to, message, type, mediaUrl });
    
    res.json({
      success: true,
      data: result,
      message: 'Mensagem enviada com sucesso'
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem'
    });
  }
});

export default router;