import { Request, Response } from 'express';
import prisma from '../../lib/database';
import { messageService } from '../messages/service';
import contactService from '../contacts/service';
import wahaClient from './wahaClient';

export interface WAHAWebhookEvent {
  event: string;
  session: string;
  payload: any;
}

export interface WAHAMessageEvent {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  fromMe: boolean;
  body: string;
  hasMedia: boolean;
  mediaUrl?: string;
  mediaType?: string;
  ack?: number;
}

export interface WAHASessionEvent {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  qr?: string;
}

class WhatsAppWebhookHandler {
  
  async handleWebhook(req: Request, res: Response) {
    try {
      const { sessionName } = req.params;
      const event: WAHAWebhookEvent = req.body;

      console.log(`📨 WAHA Webhook received for ${sessionName}:`, {
        event: event.event,
        session: event.session
      });

      // Find instance by session name
      const instance = await prisma.whatsAppInstance.findFirst({
        where: {
          settings: {
            path: ['wahaSession'],
            equals: sessionName
          }
        }
      });

      if (!instance) {
        console.log(`⚠️ Instance not found for session: ${sessionName}`);
        return res.status(404).json({
          success: false,
          message: 'Instance not found'
        });
      }

      // Handle different event types
      switch (event.event) {
        case 'session.status':
          await this.handleSessionStatusEvent(instance.id, event.payload, sessionName);
          break;
          
        case 'session.qr':
          await this.handleQRCodeEvent(instance.id, event.payload);
          break;
          
        case 'message':
        case 'message.any':
          await this.handleMessageEvent(instance.id, instance.tenantId, event.payload);
          break;
          
        default:
          console.log(`🔄 Unhandled webhook event: ${event.event}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  private async handleSessionStatusEvent(instanceId: string, payload: WAHASessionEvent, sessionName: string) {
    console.log(`📱 Session status update for ${instanceId}:`, payload.status);

    let status = 'disconnected';
    let phoneNumber = null;
    let qrCode = undefined;

    switch (payload.status) {
      case 'STOPPED':
        status = 'disconnected';
        break;
      case 'STARTING':
        status = 'connecting';
        break;
      case 'SCAN_QR_CODE':
        status = 'connecting';
        // When status is SCAN_QR_CODE, fetch QR code from WAHA
        try {
          const freshQRCode = await wahaClient.getQRCode(sessionName);
          if (freshQRCode) {
            qrCode = freshQRCode;
            console.log(`📱 QR Code fetched for instance ${instanceId}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching QR code for instance ${instanceId}:`, error);
        }
        break;
      case 'WORKING':
        status = 'connected';
        // Extract phone number from session info if available
        phoneNumber = payload.name || null;
        // Clear QR code when connected
        qrCode = null;
        break;
      case 'FAILED':
        status = 'error';
        break;
    }

    await prisma.whatsAppInstance.update({
      where: { id: instanceId },
      data: {
        status,
        phoneNumber,
        lastSeen: new Date(),
        ...(qrCode !== undefined && { qrCode })
      }
    });

    console.log(`✅ Instance ${instanceId} status updated: ${status}${qrCode ? ' with QR code' : ''}`);
  }

  private async handleQRCodeEvent(instanceId: string, payload: any) {
    if (payload.qr) {
      console.log(`📱 QR Code updated for instance ${instanceId}`);
      
      await prisma.whatsAppInstance.update({
        where: { id: instanceId },
        data: {
          qrCode: payload.qr,
          status: 'connecting'
        }
      });
    }
  }

  private async handleMessageEvent(instanceId: string, tenantId: string, payload: WAHAMessageEvent) {
    try {
      console.log(`💬 Message received for instance ${instanceId}:`, {
        from: payload.from,
        to: payload.to,
        fromMe: payload.fromMe,
        body: payload.body?.substring(0, 50) + '...'
      });

      // Only process inbound messages (not sent by us)
      if (payload.fromMe) {
        console.log('📤 Outbound message, skipping...');
        return;
      }

      // Get instance to access settings
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: instanceId }
      });

      if (!instance) {
        console.error(`❌ Instance ${instanceId} not found for message handling`);
        return;
      }

      // Extract phone number from WhatsApp format
      const phoneNumber = payload.from.replace('@c.us', '');
      
      // Get WhatsApp profile info for better contact identification
      let contactName = (payload as any).pushName || (payload as any).notifyName || phoneNumber;
      let profilePicUrl = null;
      
      // Get session name from instance
      const instanceSettings = instance.settings as any;
      const sessionName = instanceSettings?.wahaSession;
      
      if (sessionName) {
        try {
          // Get contact info from WhatsApp
          const contactInfo = await wahaClient.getContactInfo(sessionName, payload.from);
          if (contactInfo) {
            contactName = contactInfo.pushname || contactInfo.name || contactName;
            console.log(`📱 WhatsApp profile detected: ${contactName} (${phoneNumber})`);
          }
          
          // Try to get profile picture
          const profilePic = await wahaClient.getProfilePic(sessionName, payload.from);
          if (profilePic) {
            profilePicUrl = profilePic;
            console.log(`🖼️ Profile pic found for ${contactName}`);
          }
        } catch (error: any) {
          console.log(`⚠️ Could not fetch WhatsApp profile for ${phoneNumber}:`, error.message);
        }
      }
      
      // Find or create contact with WhatsApp profile info
      const contact = await contactService.findOrCreateContact(
        tenantId, 
        phoneNumber, 
        contactName
      );
      
      // Update contact with profile pic if available
      if (profilePicUrl && !contact.avatar) {
        try {
          await contactService.updateContact(contact.id, { 
            customFields: { 
              ...contact.customFields, 
              whatsappProfilePic: profilePicUrl,
              lastProfileSync: new Date().toISOString()
            }
          });
          console.log(`✅ Profile pic updated for ${contactName}`);
        } catch (error: any) {
          console.log(`⚠️ Could not update profile pic:`, error.message);
        }
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          tenantId,
          contactPhone: phoneNumber
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            tenantId,
            whatsappInstanceId: instanceId,
            contactPhone: phoneNumber,
            contactName: contact.name, // Use contact name
            lastMessageAt: new Date(payload.timestamp * 1000),
            unreadCount: 1
          }
        });
      } else if (conversation.contactName !== contact.name) {
        // Update conversation with latest contact name
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { contactName: contact.name }
        });
        conversation.contactName = contact.name;
      }

      // Create message record
      await prisma.message.create({
        data: {
          id: payload.id,
          conversationId: conversation.id,
          tenantId,
          from: phoneNumber,
          to: payload.to.replace('@c.us', ''),
          type: payload.hasMedia ? (payload.mediaType || 'media') : 'text',
          content: payload.body || '[Mídia]',
          mediaUrl: payload.mediaUrl,
          status: 'delivered',
          isInbound: true,
          timestamp: new Date(payload.timestamp * 1000)
        }
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(payload.timestamp * 1000),
          unreadCount: { increment: 1 }
        }
      });

      console.log(`✅ Message stored: ${payload.from} -> ${payload.body?.substring(0, 30)}...`);

      // TODO: Emit WebSocket event for real-time updates
      // TODO: Trigger workflows if any
      
    } catch (error: any) {
      console.error('Error handling message event:', error);
    }
  }

  // Helper method to sync all instances with WAHA
  async syncAllInstances(): Promise<void> {
    try {
      console.log('🔄 Syncing all instances with WAHA...');
      
      const instances = await prisma.whatsAppInstance.findMany({
        where: {
          status: { in: ['connecting', 'connected'] }
        }
      });

      const wahaSessions = await wahaClient.getSessions();
      
      for (const instance of instances) {
        const settings = instance.settings as any;
        const sessionName = settings?.wahaSession;
        
        if (!sessionName) continue;

        const wahaSession = wahaSessions.find(s => s.name === sessionName);
        
        if (wahaSession) {
          // Update instance based on WAHA status
          let status = 'disconnected';
          switch (wahaSession.status) {
            case 'WORKING':
              status = 'connected';
              break;
            case 'SCAN_QR_CODE':
            case 'STARTING':
              status = 'connecting';
              break;
            case 'FAILED':
              status = 'error';
              break;
          }

          await prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: { 
              status,
              lastSeen: new Date()
            }
          });

          console.log(`✅ Synced ${instance.name}: ${status}`);
        }
      }
      
      console.log('✅ Instance sync completed');
    } catch (error) {
      console.error('Error syncing instances:', error);
    }
  }
}

export const webhookHandler = new WhatsAppWebhookHandler();
export default webhookHandler;