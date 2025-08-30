export interface WhatsAppMessage {
  id: string;
  sessionName: string;
  tenantId: string;
  chatId: string;
  from: string;
  to: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: Date;
  isFromMe: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: any;
}

export interface Chat {
  id: string;
  sessionName: string;
  tenantId: string;
  name: string;
  phoneNumber: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isGroup: boolean;
  metadata?: any;
}

class MessageService {
  // Armazenamento em memória (em produção, usar banco de dados)
  private messages: Map<string, WhatsAppMessage> = new Map();
  private chats: Map<string, Chat> = new Map();
  
  // Índices para busca rápida
  private sessionMessagesIndex: Map<string, Set<string>> = new Map();
  private chatMessagesIndex: Map<string, Set<string>> = new Map();
  private tenantChatsIndex: Map<string, Set<string>> = new Map();

  constructor() {
    console.log('MessageService initialized');
  }

  // Processar mensagem recebida do webhook
  processIncomingMessage(data: {
    sessionName: string;
    tenantId: string;
    message: any;
  }): WhatsAppMessage {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extrair informações da mensagem WAHA
    const chatId = data.message.from || data.message.chatId;
    const from = data.message.from;
    const to = data.message.to || data.sessionName;
    
    const message: WhatsAppMessage = {
      id: messageId,
      sessionName: data.sessionName,
      tenantId: data.tenantId,
      chatId,
      from,
      to,
      body: data.message.body || data.message.text,
      timestamp: new Date(data.message.timestamp * 1000 || Date.now()),
      isFromMe: data.message.fromMe || false,
      status: 'delivered',
      metadata: data.message
    };

    // Se tiver mídia
    if (data.message.hasMedia || data.message.media) {
      message.mediaUrl = data.message.media?.url;
      message.mediaType = data.message.media?.mimetype;
    }

    // Salvar mensagem
    this.messages.set(messageId, message);
    
    // Atualizar índices
    if (!this.sessionMessagesIndex.has(data.sessionName)) {
      this.sessionMessagesIndex.set(data.sessionName, new Set());
    }
    this.sessionMessagesIndex.get(data.sessionName)!.add(messageId);
    
    if (!this.chatMessagesIndex.has(chatId)) {
      this.chatMessagesIndex.set(chatId, new Set());
    }
    this.chatMessagesIndex.get(chatId)!.add(messageId);
    
    // Atualizar ou criar chat
    this.updateOrCreateChat({
      sessionName: data.sessionName,
      tenantId: data.tenantId,
      chatId,
      message
    });
    
    console.log(`Message processed: ${messageId} from ${from} to ${to}`);
    
    return message;
  }

  // Atualizar ou criar chat
  private updateOrCreateChat(data: {
    sessionName: string;
    tenantId: string;
    chatId: string;
    message: WhatsAppMessage;
  }) {
    let chat = this.chats.get(data.chatId);
    
    if (!chat) {
      // Criar novo chat
      chat = {
        id: data.chatId,
        sessionName: data.sessionName,
        tenantId: data.tenantId,
        name: data.message.from,
        phoneNumber: data.chatId.replace('@c.us', '').replace('@g.us', ''),
        lastMessage: data.message.body,
        lastMessageTime: data.message.timestamp,
        unreadCount: data.message.isFromMe ? 0 : 1,
        isGroup: data.chatId.includes('@g.us'),
        metadata: {}
      };
      
      this.chats.set(data.chatId, chat);
      
      // Atualizar índice do tenant
      if (!this.tenantChatsIndex.has(data.tenantId)) {
        this.tenantChatsIndex.set(data.tenantId, new Set());
      }
      this.tenantChatsIndex.get(data.tenantId)!.add(data.chatId);
    } else {
      // Atualizar chat existente
      chat.lastMessage = data.message.body;
      chat.lastMessageTime = data.message.timestamp;
      if (!data.message.isFromMe) {
        chat.unreadCount++;
      }
    }
  }

  // Buscar mensagens de uma sessão
  getSessionMessages(sessionName: string, limit: number = 50): WhatsAppMessage[] {
    const messageIds = this.sessionMessagesIndex.get(sessionName);
    if (!messageIds) return [];
    
    const messages: WhatsAppMessage[] = [];
    for (const id of messageIds) {
      const message = this.messages.get(id);
      if (message) messages.push(message);
    }
    
    // Ordenar por timestamp (mais recente primeiro)
    messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return messages.slice(0, limit);
  }

  // Buscar mensagens de um chat
  getChatMessages(chatId: string, limit: number = 50): WhatsAppMessage[] {
    const messageIds = this.chatMessagesIndex.get(chatId);
    if (!messageIds) return [];
    
    const messages: WhatsAppMessage[] = [];
    for (const id of messageIds) {
      const message = this.messages.get(id);
      if (message) messages.push(message);
    }
    
    // Ordenar por timestamp (mais antiga primeiro para exibição no chat)
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return messages.slice(-limit); // Pegar últimas mensagens
  }

  // Buscar chats de um tenant
  getTenantChats(tenantId: string): Chat[] {
    const chatIds = this.tenantChatsIndex.get(tenantId);
    if (!chatIds) return [];
    
    const chats: Chat[] = [];
    for (const id of chatIds) {
      const chat = this.chats.get(id);
      if (chat) chats.push(chat);
    }
    
    // Ordenar por última mensagem (mais recente primeiro)
    chats.sort((a, b) => {
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      return timeB - timeA;
    });
    
    return chats;
  }

  // Buscar chats de uma sessão
  getSessionChats(sessionName: string): Chat[] {
    const chats: Chat[] = [];
    
    for (const chat of this.chats.values()) {
      if (chat.sessionName === sessionName) {
        chats.push(chat);
      }
    }
    
    // Ordenar por última mensagem
    chats.sort((a, b) => {
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      return timeB - timeA;
    });
    
    return chats;
  }

  // Buscar chats de uma sessão para um tenant específico
  getChatsForSession(sessionName: string, tenantId: string): Chat[] {
    const chats: Chat[] = [];
    
    for (const chat of this.chats.values()) {
      if (chat.sessionName === sessionName && chat.tenantId === tenantId) {
        chats.push(chat);
      }
    }
    
    // Ordenar por última mensagem
    chats.sort((a, b) => {
      const timeA = a.lastMessageTime?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || 0;
      return timeB - timeA;
    });
    
    return chats;
  }

  // Buscar mensagens de um chat específico para uma sessão e tenant
  getMessagesForChat(sessionName: string, tenantId: string, contactId: string): WhatsAppMessage[] {
    const chatId = contactId.includes('@') ? contactId : `${contactId}@c.us`;
    const messages: WhatsAppMessage[] = [];
    
    for (const message of this.messages.values()) {
      if (message.sessionName === sessionName && 
          message.tenantId === tenantId && 
          message.chatId === chatId) {
        messages.push(message);
      }
    }
    
    // Ordenar por timestamp (mais antiga primeiro para exibição no chat)
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return messages;
  }

  // Marcar mensagens como lidas
  markChatAsRead(chatId: string): void {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.unreadCount = 0;
    }
  }

  // Estatísticas
  getStats() {
    return {
      totalMessages: this.messages.size,
      totalChats: this.chats.size,
      totalSessions: this.sessionMessagesIndex.size,
      messagesPerSession: Array.from(this.sessionMessagesIndex.entries()).map(([session, messages]) => ({
        session,
        count: messages.size
      }))
    };
  }

  // Limpar mensagens antigas (manutenção)
  cleanOldMessages(daysToKeep: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    
    for (const [id, message] of this.messages.entries()) {
      if (message.timestamp < cutoffDate) {
        // Remover dos índices
        this.sessionMessagesIndex.get(message.sessionName)?.delete(id);
        this.chatMessagesIndex.get(message.chatId)?.delete(id);
        
        // Remover mensagem
        this.messages.delete(id);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned ${deletedCount} old messages`);
    return deletedCount;
  }
}

// Singleton
export default new MessageService();