import prisma from '../../lib/database';
import { moduleService } from '../../services/moduleService';
import { SYSTEM_MODULES } from '../../types/modules';

export interface ConversationData {
  id: string;
  tenantId: string;
  contactPhone: string;
  contactName?: string;
  lastMessageAt: Date;
  unreadCount: number;
  isArchived: boolean;
  tags: string[];
  whatsappInstanceId?: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  from: string;
  to: string;
  type: string;
  content: string;
  mediaUrl?: string;
  status: string;
  isInbound: boolean;
  timestamp: Date;
}

class MessageService {
  
  async getConversations(tenantId: string, filters?: {
    search?: string;
    archived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ConversationData[]> {
    // Check module access
    const tenantModules = await moduleService.getTenantModules(tenantId);
    const messagesModule = tenantModules.find(m => m.moduleId === SYSTEM_MODULES.MESSAGES && m.isActive);
    if (!messagesModule) {
      throw new Error('Módulo Messages não está ativo para este tenant');
    }

    const where: any = { tenantId };
    
    if (filters?.archived !== undefined) {
      where.isArchived = filters.archived;
    }

    if (filters?.search) {
      where.OR = [
        { contactPhone: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0
    });

    return conversations.map(conv => ({
      id: conv.id,
      tenantId: conv.tenantId,
      contactPhone: conv.contactPhone,
      contactName: conv.contactName || undefined,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      isArchived: conv.isArchived,
      tags: conv.tags,
      whatsappInstanceId: conv.whatsappInstanceId || undefined
    }));
  }

  async getMessages(conversationId: string, pagination?: {
    limit?: number;
    offset?: number;
  }): Promise<MessageData[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: pagination?.limit || 50,
      skip: pagination?.offset || 0
    });

    return messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      from: msg.from,
      to: msg.to,
      type: msg.type,
      content: msg.content,
      mediaUrl: msg.mediaUrl || undefined,
      status: msg.status,
      isInbound: msg.isInbound,
      timestamp: msg.timestamp
    }));
  }

  async markAsRead(conversationId: string): Promise<boolean> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 }
    });

    return true;
  }

  async searchMessages(tenantId: string, query: string): Promise<MessageData[]> {
    const messages = await prisma.message.findMany({
      where: {
        tenantId,
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      from: msg.from,
      to: msg.to,
      type: msg.type,
      content: msg.content,
      mediaUrl: msg.mediaUrl || undefined,
      status: msg.status,
      isInbound: msg.isInbound,
      timestamp: msg.timestamp
    }));
  }

  async createMessage(data: {
    conversationId: string;
    tenantId: string;
    from: string;
    to: string;
    type: string;
    content: string;
    mediaUrl?: string;
    isInbound: boolean;
  }): Promise<MessageData> {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        tenantId: data.tenantId,
        from: data.from,
        to: data.to,
        type: data.type,
        content: data.content,
        mediaUrl: data.mediaUrl,
        status: 'sent',
        isInbound: data.isInbound,
        timestamp: new Date()
      }
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { 
        lastMessageAt: new Date(),
        unreadCount: data.isInbound ? { increment: 1 } : undefined
      }
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      from: message.from,
      to: message.to,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl || undefined,
      status: message.status,
      isInbound: message.isInbound,
      timestamp: message.timestamp
    };
  }
}

export const messageService = new MessageService();
export default messageService;