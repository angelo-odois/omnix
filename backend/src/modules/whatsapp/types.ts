export interface WhatsAppInstanceData {
  id: string;
  tenantId: string;
  name: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  lastSeen?: Date;
  webhookUrl?: string;
  settings: {
    autoReply: boolean;
    businessHours: boolean;
    maxContacts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInstanceRequest {
  name: string;
  settings?: {
    autoReply?: boolean;
    businessHours?: boolean;
    maxContacts?: number;
  };
}

export interface SendMessageRequest {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

export interface WhatsAppWebhookEvent {
  instanceId: string;
  event: string;
  data: any;
  timestamp: Date;
}