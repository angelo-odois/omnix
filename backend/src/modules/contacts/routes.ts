import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authV2';
import { requireModule } from '../../middlewares/moduleAuth';
import { SYSTEM_MODULES } from '../../types/modules';
import contactService from './service';
import prisma from '../../lib/database';

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

    // Update any existing conversation with this contact's name
    try {
      // First, let's see what conversations exist for this tenant
      const existingConversations = await prisma.conversation.findMany({
        where: { tenantId: req.user.tenantId },
        select: { id: true, contactPhone: true, contactName: true }
      });
      
      console.log(`📋 Existing conversations:`, existingConversations);
      console.log(`🔍 Looking for conversations with phone: ${contact.phone}`);
      
      // Try to find conversations with this phone number (with different format variations)
      const phoneVariations = [
        contact.phone,
        contact.phone.replace(/\D/g, ''), // Only numbers
        contact.phone + '@c.us', // WhatsApp format
        contact.phone.replace('@c.us', '') // Remove WhatsApp format
      ];
      
      console.log(`📞 Phone variations to search:`, phoneVariations);

      const updatedConversations = await prisma.conversation.updateMany({
        where: {
          tenantId: req.user.tenantId,
          contactPhone: { in: phoneVariations },
          contactName: null // Only update if no name is set
        },
        data: {
          contactName: contact.name
        }
      });
      
      console.log(`✅ Updated ${updatedConversations.count} conversations for ${contact.phone} to ${contact.name}`);
      
      // If no conversations were updated, try without the contactName filter
      if (updatedConversations.count === 0) {
        console.log(`🔄 No conversations updated, trying without contactName filter...`);
        const fallbackUpdate = await prisma.conversation.updateMany({
          where: {
            tenantId: req.user.tenantId,
            contactPhone: { in: phoneVariations }
          },
          data: {
            contactName: contact.name
          }
        });
        console.log(`🔄 Fallback updated ${fallbackUpdate.count} conversations`);
      }
    } catch (updateError) {
      // Don't fail the contact creation if conversation update fails
      console.warn('Failed to update conversation name:', updateError);
    }
    
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

// Find contact (no automatic creation)
router.get('/find/:phone', requireModule(SYSTEM_MODULES.CONTACTS, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Telefone é obrigatório'
      });
    }

    const contact = await contactService.findContact(req.user.tenantId, phone);
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error: any) {
    console.error('Error finding contact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar contato'
    });
  }
});

// Legacy find-or-create endpoint - now only finds
router.post('/find-or-create', requireModule(SYSTEM_MODULES.CONTACTS, 'read'), async (req: AuthRequest, res: Response) => {
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
    console.error('Error finding contact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar contato'
    });
  }
});

// Delete contact (admin only)
router.delete('/:id', requireModule(SYSTEM_MODULES.CONTACTS, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Check if user has permission to delete contacts
    if (!userRole || !['super_admin', 'tenant_admin', 'tenant_manager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissão insuficiente para excluir contatos'
      });
    }

    // Check if contact exists and belongs to this tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contato não encontrado'
      });
    }

    // Delete the contact
    await prisma.contact.delete({
      where: { id }
    });

    console.log(`🗑️ Contact deleted: ${contact.name} (${contact.phone}) by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Contato excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao excluir contato'
    });
  }
});

export default router;