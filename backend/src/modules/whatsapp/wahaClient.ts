import axios, { AxiosInstance } from 'axios';

export interface WAHASession {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  config?: {
    webhooks?: {
      url: string;
      events: string[];
    }[];
  };
}

export interface WAHAQRCode {
  qr: string;
}

export interface WAHAMessage {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  body: string;
  hasMedia: boolean;
  ack?: number;
}

export interface WAHASendMessageRequest {
  chatId: string;
  text: string;
  session?: string;
}

class WAHAClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.WAHA_BASE_URL || 'https://waha.nexuso2.com',
      headers: {
        'X-Api-Key': process.env.WAHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('WAHA Client initialized:', {
      baseURL: this.client.defaults.baseURL,
      hasApiKey: !!process.env.WAHA_API_KEY
    });
  }

  // ============= SESSION MANAGEMENT =============

  async getSessions(): Promise<WAHASession[]> {
    try {
      const response = await this.client.get('/api/sessions');
      return response.data;
    } catch (error: any) {
      console.error('WAHA getSessions error:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar sessões WAHA: ${error.response?.data?.message || error.message}`);
    }
  }

  async getSession(sessionName: string): Promise<WAHASession> {
    try {
      const response = await this.client.get(`/api/sessions/${sessionName}`);
      return response.data;
    } catch (error: any) {
      console.error('WAHA getSession error:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar sessão ${sessionName}: ${error.response?.data?.message || error.message}`);
    }
  }

  async createSession(sessionName: string, config?: any): Promise<WAHASession> {
    try {
      const sessionConfig = {
        name: sessionName,
        config: {
          webhooks: [{
            url: `${process.env.BACKEND_PUBLIC_URL}/api/whatsapp/webhook/${sessionName}`,
            events: [
              'message',
              'message.any', 
              'session.status'
            ]
          }],
          ...config
        }
      };

      const response = await this.client.post('/api/sessions', sessionConfig);
      return response.data;
    } catch (error: any) {
      console.error('WAHA createSession error:', error.response?.data || error.message);
      throw new Error(`Erro ao criar sessão ${sessionName}: ${error.response?.data?.message || error.message}`);
    }
  }

  async startSession(sessionName: string): Promise<boolean> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/start`);
      return true;
    } catch (error: any) {
      console.error('WAHA startSession error:', error.response?.data || error.message);
      throw new Error(`Erro ao iniciar sessão ${sessionName}: ${error.response?.data?.message || error.message}`);
    }
  }

  async stopSession(sessionName: string): Promise<boolean> {
    try {
      await this.client.post(`/api/sessions/${sessionName}/stop`);
      return true;
    } catch (error: any) {
      console.error('WAHA stopSession error:', error.response?.data || error.message);
      throw new Error(`Erro ao parar sessão ${sessionName}: ${error.response?.data?.message || error.message}`);
    }
  }

  async deleteSession(sessionName: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/sessions/${sessionName}`);
      return true;
    } catch (error: any) {
      console.error('WAHA deleteSession error:', error.response?.data || error.message);
      throw new Error(`Erro ao deletar sessão ${sessionName}: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============= QR CODE =============

  async getQRCode(sessionName: string): Promise<string | null> {
    try {
      // Try the session-specific endpoint which returns the PNG directly
      const response = await this.client.get(`/api/${sessionName}/auth/qr`, {
        responseType: 'arraybuffer'
      });
      
      if (response.data) {
        // Convert to base64 data URL
        const base64 = Buffer.from(response.data).toString('base64');
        return `data:image/png;base64,${base64}`;
      }
      
      return null;
    } catch (error: any) {
      console.error('WAHA getQRCode error:', error.response?.status || error.message);
      // QR code might not be available yet
      return null;
    }
  }

  // ============= MESSAGING =============

  async sendTextMessage(sessionName: string, chatId: string, text: string): Promise<WAHAMessage> {
    try {
      // Try different possible endpoints for sending text
      let response;
      try {
        // Modern WAHA API format
        response = await this.client.post('/api/sendText', {
          session: sessionName,
          chatId,
          text
        });
      } catch (err: any) {
        // Fallback to session-specific endpoint
        response = await this.client.post(`/api/${sessionName}/sendText`, {
          chatId,
          text
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('WAHA sendTextMessage error:', error.response?.data || error.message);
      throw new Error(`Erro ao enviar mensagem: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendMediaMessage(sessionName: string, chatId: string, mediaUrl: string, caption?: string): Promise<WAHAMessage> {
    try {
      // Try different possible endpoints for sending media
      let response;
      try {
        // Modern WAHA API format
        response = await this.client.post('/api/sendImage', {
          session: sessionName,
          chatId,
          url: mediaUrl,
          caption
        });
      } catch (err: any) {
        // Fallback to session-specific endpoint
        response = await this.client.post(`/api/${sessionName}/sendImage`, {
          chatId,
          url: mediaUrl,
          caption
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('WAHA sendMediaMessage error:', error.response?.data || error.message);
      throw new Error(`Erro ao enviar mídia: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============= CONTACTS =============

  async getContacts(sessionName: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/${sessionName}/contacts`);
      return response.data;
    } catch (error: any) {
      console.error('WAHA getContacts error:', error.response?.data || error.message);
      return [];
    }
  }

  async getContactInfo(sessionName: string, contactId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/${sessionName}/contacts/${contactId}`);
      return response.data;
    } catch (error: any) {
      console.error('WAHA getContactInfo error:', error.response?.data || error.message);
      return null;
    }
  }

  async getProfilePic(sessionName: string, contactId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/api/${sessionName}/contacts/${contactId}/profile-pic`);
      return response.data.url || null;
    } catch (error: any) {
      console.error('WAHA getProfilePic error:', error.response?.status || error.message);
      return null;
    }
  }

  async checkNumberExists(sessionName: string, phone: string): Promise<boolean> {
    try {
      const chatId = this.formatPhoneNumber(phone);
      const response = await this.client.post(`/api/${sessionName}/checkNumberStatus`, {
        phone: chatId
      });
      return response.data.exists || false;
    } catch (error: any) {
      console.error('WAHA checkNumberExists error:', error.response?.data || error.message);
      return false;
    }
  }

  // ============= WEBHOOKS =============

  async setWebhook(sessionName: string, webhookUrl: string, events: string[]): Promise<boolean> {
    try {
      await this.client.patch(`/api/sessions/${sessionName}`, {
        config: {
          webhooks: [{
            url: webhookUrl,
            events
          }]
        }
      });
      return true;
    } catch (error: any) {
      console.error('WAHA setWebhook error:', error.response?.data || error.message);
      throw new Error(`Erro ao configurar webhook: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============= UTILITIES =============

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (Brazil default)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}@c.us`;
    } else if (cleaned.length === 11) {
      return `55${cleaned}@c.us`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `${cleaned}@c.us`;
    }
    
    return `${cleaned}@c.us`;
  }

  isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const wahaClient = new WAHAClient();
export default wahaClient;