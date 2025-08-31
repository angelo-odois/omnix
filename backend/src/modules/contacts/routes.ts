import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authV2';
import { requireModule } from '../../middlewares/moduleAuth';
import { SYSTEM_MODULES } from '../../types/modules';
import contactService from './service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============= CONTACT MANAGEMENT =============

// Get all contacts
router.get('/', requireModule(SYSTEM_MODULES.CONTACTS, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { search, tags, groups, limit, offset } = req.query;
    
    const contacts = await contactService.getContacts(req.user.tenantId, {
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
      groups: groups ? (groups as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json({
      success: true,
      data: contacts
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar contatos'
    });
  }
});

// Get contact by phone
router.get('/phone/:phone', requireModule(SYSTEM_MODULES.CONTACTS, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { phone } = req.params;
    const contact = await contactService.getContactByPhone(req.user.tenantId, phone);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contato não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error: any) {
    console.error('Error fetching contact by phone:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar contato'
    });
  }
});

// Create new contact
router.post('/', requireModule(SYSTEM_MODULES.CONTACTS, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { name, phone, email, tags, customFields, groups } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios'
      });
    }

    const contact = await contactService.createContact(req.user.tenantId, {
      name,
      phone,
      email,
      tags,
      customFields,
      groups
    });
    
    res.json({
      success: true,
      data: contact,
      message: 'Contato criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar contato'
    });
  }
});

// Update contact
router.put('/:id', requireModule(SYSTEM_MODULES.CONTACTS, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contact = await contactService.updateContact(id, updates);
    
    res.json({
      success: true,
      data: contact,
      message: 'Contato atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao atualizar contato'
    });
  }
});

// Find or create contact (used by message system)
router.post('/find-or-create', requireModule(SYSTEM_MODULES.CONTACTS, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefone é obrigatório'
      });
    }

    const contact = await contactService.findOrCreateContact(req.user.tenantId, phone, name);
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error: any) {
    console.error('Error finding/creating contact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar/criar contato'
    });
  }
});

export default router;