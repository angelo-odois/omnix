import { v4 as uuidv4 } from 'uuid';
import prisma from '../../lib/database';
import { moduleService } from '../../services/moduleService';
import { SYSTEM_MODULES } from '../../types/modules';
import { WhatsAppInstanceData, CreateInstanceRequest, SendMessageRequest } from './types';
import wahaClient from './wahaClient';
import contactService from '../contacts/service';

class WhatsAppService {
  private instances: Map<string, WhatsAppInstanceData> = new Map();

  async getInstances(tenantId: string): Promise<WhatsAppInstanceData[]> {
    // Check if tenant has WhatsApp module active
    const tenantModules = await moduleService.getTenantModules(tenantId);
    const whatsappModule = tenantModules.find(m => m.moduleId === SYSTEM_MODULES.WHATSAPP && m.isActive);
    if (!whatsappModule) {
      throw new Error('Módulo WhatsApp não está ativo para este tenant');
    }

    const instances = await prisma.whatsAppInstance.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    return instances.map(instance => ({
      id: instance.id,
      tenantId: instance.tenantId,
      name: instance.name,
      phoneNumber: instance.phoneNumber || undefined,
      status: instance.status as any,
      qrCode: instance.qrCode || undefined,
      lastSeen: instance.lastSeen || undefined,
      webhookUrl: instance.webhookUrl || undefined,
      settings: (instance.settings as any) || {
        autoReply: false,
        businessHours: false,
        maxContacts: 1000
      },
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    }));
  }

  async createInstance(tenantId: string, data: CreateInstanceRequest): Promise<WhatsAppInstanceData> {
    // Check module access
    const tenantModules = await moduleService.getTenantModules(tenantId);
    const whatsappModule = tenantModules.find(m => m.moduleId === SYSTEM_MODULES.WHATSAPP && m.isActive);
    if (!whatsappModule) {
      throw new Error('Módulo WhatsApp não está ativo para este tenant');
    }

    // Check instance limits
    const currentInstances = await prisma.whatsAppInstance.count({
      where: { tenantId }
    });

    const maxInstances = whatsappModule?.config?.maxInstances || 2;

    if (currentInstances >= maxInstances) {
      throw new Error(`Limite de ${maxInstances} instâncias atingido`);
    }

    // Create instance
    const instance = await prisma.whatsAppInstance.create({
      data: {
        id: uuidv4(),
        tenantId,
        name: data.name,
        status: 'disconnected',
        settings: data.settings || {
          autoReply: false,
          businessHours: false,
          maxContacts: 1000
        }
      }
    });

    // Track usage
    await moduleService.trackModuleUsage(tenantId, SYSTEM_MODULES.WHATSAPP, 'instance');

    return {
      id: instance.id,
      tenantId: instance.tenantId,
      name: instance.name,
      phoneNumber: instance.phoneNumber || undefined,
      status: instance.status as any,
      qrCode: instance.qrCode || undefined,
      lastSeen: instance.lastSeen || undefined,
      webhookUrl: instance.webhookUrl || undefined,
      settings: (instance.settings as any) || {
        autoReply: false,
        businessHours: false,
        maxContacts: 1000
      },
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  async connectInstance(instanceId: string): Promise<{ qrCode: string }> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    try {
      // Update status to connecting
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: 'connecting' }
      });

      // Use instance ID as WAHA session name
      const sessionName = `omnix_${instanceId.replace(/-/g, '_')}`;

      try {
        // Try to get existing session
        await wahaClient.getSession(sessionName);
        console.log(`📱 Sessão ${sessionName} já existe, reiniciando...`);
        
        // Stop and restart existing session
        try { await wahaClient.stopSession(sessionName); } catch {}
        await wahaClient.startSession(sessionName);
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          // Session doesn't exist, create it
          console.log(`📱 Criando nova sessão ${sessionName}...`);
          await wahaClient.createSession(sessionName);
          await wahaClient.startSession(sessionName);
        } else {
          throw error;
        }
      }

      console.log(`⚡ Sessão ${sessionName} iniciada. QR Code será gerado...`);

      // Update instance immediately with session info
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { 
          status: 'connecting',
          settings: {
            ...((instance.settings as any) || {}),
            wahaSession: sessionName
          }
        }
      });

      // Return success immediately - QR will be updated via webhook or polling
      return { 
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdlcmFuZG8gUVIgQ29kZS4uLjwvdGV4dD48L3N2Zz4=',
        message: 'Sessão iniciada. QR Code será gerado em alguns segundos.'
      };

    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      
      // Update status to error
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: { status: 'error' }
      });

      throw new Error(`Erro ao conectar: ${error.message}`);
    }
  }

  async sendMessage(instanceId: string, data: SendMessageRequest): Promise<{ success: boolean; messageId: string }> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (instance.status !== 'connected') {
      throw new Error('Instância não está conectada');
    }

    const settings = instance.settings as any;
    const sessionName = settings?.wahaSession;
    
    if (!sessionName) {
      throw new Error('Sessão WAHA não configurada para esta instância');
    }

    try {
      // Format phone number for WhatsApp
      const chatId = wahaClient.formatPhoneNumber(data.to);

      // Send via WAHA
      let wahaMessage;
      if (data.type === 'image' && data.mediaUrl) {
        wahaMessage = await wahaClient.sendMediaMessage(sessionName, chatId, data.mediaUrl, data.message);
      } else {
        wahaMessage = await wahaClient.sendTextMessage(sessionName, chatId, data.message);
      }

      // Find existing contact (don't create for outgoing messages)
      const contact = await contactService.findContact(
        instance.tenantId, 
        data.to
      );

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          tenantId: instance.tenantId,
          contactPhone: data.to
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            tenantId: instance.tenantId,
            whatsappInstanceId: instanceId,
            contactPhone: data.to,
            contactName: contact?.name, // Use contact name if available
            lastMessageAt: new Date(),
            unreadCount: 0
          }
        });
      }

      // Create message record
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          tenantId: instance.tenantId,
          from: instance.phoneNumber || 'system',
          to: data.to,
          type: data.type || 'text',
          content: data.message,
          mediaUrl: data.mediaUrl,
          status: 'sent',
          isInbound: false,
          timestamp: new Date(),
          metadata: {
            wahaMessageId: wahaMessage.id,
            wahaData: wahaMessage
          }
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });

      // Track usage
      await moduleService.trackModuleUsage(instance.tenantId, SYSTEM_MODULES.WHATSAPP, 'request');

      console.log(`✅ Mensagem enviada via WAHA: ${data.to} - ${data.message.substring(0, 50)}...`);

      return {
        success: true,
        messageId: message.id
      };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via WAHA:', error);
      throw new Error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }

  async getInstanceStatus(instanceId: string): Promise<{ status: string; qrCode?: string }> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    const settings = instance.settings as any;
    const sessionName = settings?.wahaSession;

    // If has WAHA session, sync status
    if (sessionName) {
      try {
        const wahaSession = await wahaClient.getSession(sessionName);
        let status = instance.status;
        let qrCode = instance.qrCode;

        // Update status based on WAHA
        switch (wahaSession.status) {
          case 'WORKING':
            status = 'connected';
            qrCode = null; // Clear QR when connected
            break;
          case 'SCAN_QR_CODE':
            status = 'connecting';
            // Try to get QR code
            const freshQR = await wahaClient.getQRCode(sessionName);
            if (freshQR) qrCode = freshQR;
            break;
          case 'STARTING':
            status = 'connecting';
            break;
          case 'STOPPED':
          case 'FAILED':
            status = 'error';
            break;
        }

        // Update database if status changed
        if (status !== instance.status || qrCode !== instance.qrCode) {
          await prisma.whatsAppInstance.update({
            where: { id: instanceId },
            data: { 
              status, 
              qrCode,
              lastSeen: new Date()
            }
          });
        }

        return { status, qrCode: qrCode || undefined };
      } catch (error) {
        console.error('Error syncing with WAHA:', error);
      }
    }

    return {
      status: instance.status,
      qrCode: instance.qrCode || undefined
    };
  }

  async disconnectInstance(instanceId: string): Promise<boolean> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: { 
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        lastSeen: null
      }
    });

    return true;
  }

  async terminateInstance(instanceId: string): Promise<boolean> {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: instanceId }
    });

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    const settings = instance.settings as any;
    const sessionName = settings?.wahaSession;

    try {
      // Try to delete session in WAHA first
      if (sessionName) {
        try {
          await wahaClient.deleteSession(sessionName);
          console.log(`WAHA session ${sessionName} deleted successfully`);
        } catch (wahaError) {
          console.warn('Failed to delete WAHA session, continuing with database cleanup:', wahaError);
        }
      }

      // Delete related conversations and messages
      await prisma.conversation.deleteMany({
        where: { whatsappInstanceId: instanceId }
      });

      // Delete the instance from database
      await prisma.whatsAppInstance.delete({
        where: { id: instanceId }
      });

      console.log(`WhatsApp instance ${instanceId} terminated successfully`);
      return true;
    } catch (error) {
      console.error('Error terminating WhatsApp instance:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;