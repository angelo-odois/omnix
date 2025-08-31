import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authV2';
import { requireModule } from '../../middlewares/moduleAuth';
import { SYSTEM_MODULES } from '../../types/modules';
import messageService from './service';
import prisma from '../../lib/database';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============= CONVERSATION MANAGEMENT =============

// Get conversations
router.get('/conversations', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { search, archived, limit, offset } = req.query;
    
    const conversations = await messageService.getConversations(req.user.tenantId, {
      search: search as string,
      archived: archived === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar conversas'
    });
  }
});

// Get messages from a conversation
router.get('/conversations/:id/messages', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;
    
    const messages = await messageService.getMessages(id, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar mensagens'
    });
  }
});

// Mark conversation as read
router.post('/conversations/:id/read', requireModule(SYSTEM_MODULES.MESSAGES, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const success = await messageService.markAsRead(id);
    
    res.json({
      success,
      message: 'Conversa marcada como lida'
    });
  } catch (error: any) {
    console.error('Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao marcar como lida'
    });
  }
});

// Search messages
router.get('/search', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query de busca é obrigatória'
      });
    }

    const messages = await messageService.searchMessages(req.user.tenantId, q as string);
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar mensagens'
    });
  }
});

// ============= TESTING & SIMULATION =============

// Simulate new message (for testing notifications)
router.post('/simulate-message', requireModule(SYSTEM_MODULES.MESSAGES, 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { from, content, contactName } = req.body;

    if (!from || !content) {
      return res.status(400).json({
        success: false,
        message: 'From e content são obrigatórios'
      });
    }

    // Create or find conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        tenantId: req.user.tenantId,
        contactPhone: from
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId: req.user.tenantId,
          contactPhone: from,
          contactName: contactName || from,
          lastMessageAt: new Date(),
          unreadCount: 1
        }
      });
    } else {
      // Update unread count
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { 
          unreadCount: { increment: 1 },
          lastMessageAt: new Date()
        }
      });
    }

    // Create message
    const message = await messageService.createMessage({
      conversationId: conversation.id,
      tenantId: req.user.tenantId,
      from,
      to: req.user.tenantId, // System user
      type: 'text',
      content,
      isInbound: true
    });

    res.json({
      success: true,
      data: {
        message,
        conversation
      },
      message: 'Mensagem simulada criada com sucesso'
    });
  } catch (error: any) {
    console.error('Error simulating message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao simular mensagem'
    });
  }
});

// Delete conversation (admin only)
router.delete('/conversations/:id', requireModule(SYSTEM_MODULES.MESSAGES, 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    // Only tenant_admin can delete conversations
    if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem excluir conversas'
      });
    }

    const { id } = req.params;
    
    // Check if conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Delete all messages first (cascade should handle this, but being explicit)
    await prisma.message.deleteMany({
      where: { conversationId: id }
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Conversa excluída com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao excluir conversa'
    });
  }
});

// Get enhanced conversation with contact info
router.get('/conversations/:id/details', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const { id } = req.params;
    
    // Get conversation with contact info
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: req.user.tenantId
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Try to get contact info
    let contact = null;
    try {
      contact = await prisma.contact.findFirst({
        where: {
          tenantId: req.user.tenantId,
          phone: conversation.contactPhone
        }
      });
    } catch (error) {
      console.log('Contact not found for conversation');
    }

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          contactPhone: conversation.contactPhone,
          contactName: conversation.contactName,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount,
          isArchived: conversation.isArchived,
          tags: conversation.tags
        },
        contact: contact ? {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          avatar: contact.avatar,
          tags: contact.tags,
          customFields: contact.customFields,
          lastContact: contact.lastContact,
          createdAt: contact.createdAt
        } : null
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar detalhes da conversa'
    });
  }
});

export default router;