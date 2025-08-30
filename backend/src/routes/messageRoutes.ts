import { Router, Request, Response } from 'express';
import messageService from '../services/messageService';
import wahaService from '../services/wahaService';
import { authenticate, AuthRequest } from '../middlewares/authV2';

const router = Router();

// Buscar todos os chats de uma sessão
router.get('/messages/chats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName } = req.query;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: 'sessionName é obrigatório'
      });
    }
    
    // Verificar se a sessão pertence ao tenant
    if (!String(sessionName).startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const chats = messageService.getChatsForSession(String(sessionName), tenantId);
    
    return res.json({
      success: true,
      chats
    });
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar conversas'
    });
  }
});

// Buscar mensagens de um chat específico
router.get('/messages/chat/:contactId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { contactId } = req.params;
    const { sessionName } = req.query;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: 'sessionName é obrigatório'
      });
    }
    
    // Verificar se a sessão pertence ao tenant
    if (!String(sessionName).startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    const messages = messageService.getMessagesForChat(
      String(sessionName),
      tenantId,
      contactId
    );
    
    return res.json({
      success: true,
      messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar mensagens'
    });
  }
});

// Enviar mensagem
router.post('/messages/send', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName, chatId, text } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    if (!sessionName || !chatId || !text) {
      return res.status(400).json({
        success: false,
        message: 'sessionName, chatId e text são obrigatórios'
      });
    }
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // Enviar mensagem via WAHA
    const result = await wahaService.sendMessage({
      sessionName,
      chatId,
      text
    });
    
    if (result.success) {
      // Processar mensagem enviada para salvar no histórico
      const message = messageService.processIncomingMessage({
        sessionName,
        tenantId,
        message: {
          id: result.messageId,
          timestamp: Date.now(),
          from: sessionName.replace(`${tenantId}_`, ''), // número do remetente
          to: chatId,
          body: text,
          fromMe: true,
          type: 'chat',
          hasMedia: false,
          ack: 1, // enviada
          _data: {
            id: {
              id: result.messageId,
              fromMe: true,
              _serialized: result.messageId
            }
          }
        }
      });
      
      return res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: result.messageId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Erro ao enviar mensagem'
      });
    }
  } catch (error: any) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem'
    });
  }
});

// Marcar mensagens como lidas
router.post('/messages/mark-read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName, chatId } = req.body;
    const tenantId = req.user?.tenantId || 'tenant-1';
    
    if (!sessionName || !chatId) {
      return res.status(400).json({
        success: false,
        message: 'sessionName e chatId são obrigatórios'
      });
    }
    
    // Verificar se a sessão pertence ao tenant
    if (!sessionName.startsWith(`${tenantId}_`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }
    
    // Marcar como lido via WAHA
    const result = await wahaService.markAsRead(sessionName, chatId);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error marking as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao marcar como lida'
    });
  }
});

export default router;