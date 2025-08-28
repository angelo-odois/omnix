import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import webhookService from './webhookService';

dotenv.config();

const WAHA_BASE_URL = process.env.WAHA_BASE_URL || 'https://waha.nexuso2.com';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';

interface WAHASession {
  name: string;
  status: 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED' | 'STOPPED';
  me?: {
    id: string;
    pushName: string;
    number?: string;
  };
  qr?: {
    value: string;
    image: string;
  };
  config?: any;
  events?: any;
  lastSeen?: string;
  messageCount?: number;
}

interface CreateSessionParams {
  sessionName: string;
  tenantId: string;
  phoneNumber?: string;
  displayName?: string;
  metadata?: any;
}

interface SendMessageParams {
  sessionName: string;
  chatId: string;
  text?: string;
  media?: {
    url: string;
    caption?: string;
  };
}

class WAHAService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: WAHA_BASE_URL,
      headers: {
        'X-Api-Key': WAHA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Log de configuração
    console.log('WAHA Service initialized:', {
      baseURL: WAHA_BASE_URL,
      hasApiKey: !!WAHA_API_KEY
    });
  }

  // Criar nome único da sessão baseado no tenant e número
  private createSessionName(tenantId: string, phoneNumber?: string): string {
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : 'default';
    return `${tenantId}_${cleanPhone}`;
  }

  // Buscar todas as sessões do WAHA
  async getAllSessions(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/sessions');
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting all sessions:', error.response?.data || error.message);
      return [];
    }
  }

  // Criar nova sessão WAHA
  async createSession(params: CreateSessionParams): Promise<{
    success: boolean;
    session?: WAHASession;
    message?: string;
  }> {
    try {
      const sessionName = params.sessionName || this.createSessionName(params.tenantId, params.phoneNumber);
      
      // Verificar se sessão já existe
      const existingSession = await this.getSession(sessionName);
      if (existingSession) {
        // Se já existe mas não está funcionando, reiniciar
        if (existingSession.status === 'FAILED' || existingSession.status === 'STOPPED') {
          await this.restartSession(sessionName);
        }
        return {
          success: true,
          session: existingSession,
          message: 'Sessão já existe'
        };
      }

      // Criar webhook único para esta instância
      const webhook = webhookService.createInstanceWebhook({
        instanceId: sessionName,
        sessionName: sessionName,
        tenantId: params.tenantId,
        baseUrl: process.env.BACKEND_PUBLIC_URL // Usar URL pública para o WAHA conseguir acessar
      });
      
      console.log(`Creating WAHA session with OmniX webhook: ${webhook.webhookUrl}`);
      
      // Primeiro criar a sessão com webhook específico
      const createResponse = await this.api.post('/api/sessions', {
        name: sessionName,
        config: {
          webhooks: [
            {
              url: webhook.webhookUrl,
              events: ['message', 'message.any', 'session.status', 'state.change', 'message.ack'],
              hmac: {
                key: webhook.secret
              }
            }
          ],
          metadata: {
            tenantId: params.tenantId,
            phoneNumber: params.phoneNumber,
            displayName: params.displayName,
            webhookId: webhook.id,
            ...params.metadata
          }
        }
      });

      // Depois iniciar a sessão
      const response = await this.api.post(`/api/sessions/${sessionName}/start`);

      // Buscar informações atualizadas da sessão
      const sessionInfo = await this.getSession(sessionName);
      
      return {
        success: true,
        session: sessionInfo || response.data,
        message: 'Sessão criada com sucesso'
      };
    } catch (error: any) {
      console.error('Error creating WAHA session:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Se o erro for que a sessão já existe, tentar buscar ela
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
        const existingSession = await this.getSession(params.sessionName || this.createSessionName(params.tenantId, params.phoneNumber));
        if (existingSession) {
          return {
            success: true,
            session: existingSession,
            message: 'Sessão já existe'
          };
        }
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao criar sessão WAHA'
      };
    }
  }

  // Buscar informações da sessão
  async getSession(sessionName: string): Promise<WAHASession | null> {
    try {
      const response = await this.api.get(`/api/sessions/${sessionName}`);
      const session = response.data;
      
      // Se a sessão está WORKING, garantir que temos as informações do número
      if (session && session.status === 'WORKING' && session.me) {
        // O número está disponível em session.me
        console.log('Session connected with number:', session.me.id);
      }
      
      // Se a sessão está em SCAN_QR_CODE ou STARTING, tentar buscar o QR
      if (session && (session.status === 'SCAN_QR_CODE' || session.status === 'STARTING')) {
        try {
          // Tentar buscar QR code - endpoint correto sem /sessions
          const qrResponse = await this.api.get(`/api/${sessionName}/auth/qr`, {
            responseType: 'arraybuffer'
          });
          
          if (qrResponse.data) {
            // Converter para base64
            const base64 = Buffer.from(qrResponse.data).toString('base64');
            const isPNG = Buffer.from(qrResponse.data).toString('hex').startsWith('89504e47');
            
            if (isPNG) {
              session.qr = {
                value: 'QR',
                image: base64
              };
            }
          }
        } catch (qrError) {
          console.log('QR not available for session:', sessionName);
        }
      }
      
      return session;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting WAHA session:', error.response?.data || error.message);
      return null;
    }
  }

  // Listar todas as sessões
  async listSessions(): Promise<WAHASession[]> {
    try {
      const response = await this.api.get('/api/sessions');
      return response.data || [];
    } catch (error: any) {
      console.error('Error listing WAHA sessions:', error.response?.data || error.message);
      return [];
    }
  }

  // Listar sessões de um tenant
  async getTenantSessions(tenantId: string): Promise<WAHASession[]> {
    try {
      const sessions = await this.listSessions();
      // Filtrar sessões que pertencem ao tenant
      return sessions.filter(session => 
        session.name.startsWith(`${tenantId}_`) ||
        session.config?.metadata?.tenantId === tenantId
      );
    } catch (error: any) {
      console.error('Error getting tenant sessions:', error.response?.data || error.message);
      return [];
    }
  }

  // Obter QR Code da sessão
  async getQRCode(sessionName: string): Promise<{
    success: boolean;
    qr?: string;
    image?: string;
    message?: string;
  }> {
    try {
      // Primeiro verificar o status da sessão
      const session = await this.getSession(sessionName);
      
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada'
        };
      }

      // Se a sessão está WORKING, não precisa de QR
      if (session.status === 'WORKING') {
        return {
          success: false,
          message: 'Sessão já está conectada'
        };
      }

      // Tentar buscar QR code na sessão
      if (session.qr) {
        return {
          success: true,
          qr: session.qr.value,
          image: session.qr.image ? `data:image/png;base64,${session.qr.image}` : undefined,
          message: 'QR Code disponível'
        };
      }

      // Se não tem QR na sessão, tentar buscar diretamente
      try {
        const response = await this.api.get(`/api/${sessionName}/auth/qr`, {
          responseType: 'arraybuffer' // Receber como binary
        });
        
        if (response.data) {
          // Converter para base64 se for binário
          const base64 = Buffer.from(response.data).toString('base64');
          
          // Verificar se é uma imagem PNG válida
          const isPNG = Buffer.from(response.data).toString('hex').startsWith('89504e47');
          
          if (isPNG) {
            return {
              success: true,
              qr: 'QR Code disponível',
              image: `data:image/png;base64,${base64}`,
              message: 'QR Code disponível'
            };
          }
        }
      } catch (altError: any) {
        // Se falhar, pode ser que ainda não está pronto
        console.log('QR fetch error:', altError.response?.status || altError.message);
      }

      return {
        success: false,
        message: session.status === 'STARTING' ? 'Aguardando QR Code...' : 'QR Code não disponível'
      };
    } catch (error: any) {
      console.error('Error getting QR code:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao obter QR Code'
      };
    }
  }

  // Parar sessão
  async stopSession(sessionName: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.api.post(`/api/sessions/${sessionName}/stop`);
      return {
        success: true,
        message: 'Sessão parada com sucesso'
      };
    } catch (error: any) {
      console.error('Error stopping session:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao parar sessão'
      };
    }
  }

  // Reiniciar sessão
  async restartSession(sessionName: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.api.post(`/api/sessions/${sessionName}/restart`);
      return {
        success: true,
        message: 'Sessão reiniciada com sucesso'
      };
    } catch (error: any) {
      console.error('Error restarting session:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao reiniciar sessão'
      };
    }
  }

  // Deletar sessão
  async deleteSession(sessionName: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Primeiro parar a sessão
      await this.stopSession(sessionName);
      
      // Depois deletar
      await this.api.delete(`/api/sessions/${sessionName}`);
      
      return {
        success: true,
        message: 'Sessão deletada com sucesso'
      };
    } catch (error: any) {
      console.error('Error deleting session:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar sessão'
      };
    }
  }

  // Enviar mensagem
  async sendMessage(params: SendMessageParams): Promise<{
    success: boolean;
    messageId?: string;
    message?: string;
  }> {
    try {
      const payload: any = {
        chatId: params.chatId
      };

      if (params.text) {
        payload.text = params.text;
      }

      if (params.media) {
        payload.media = params.media;
      }

      const response = await this.api.post(
        `/api/sessions/${params.sessionName}/messages/send`,
        payload
      );

      return {
        success: true,
        messageId: response.data.id,
        message: 'Mensagem enviada'
      };
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar mensagem'
      };
    }
  }

  // Obter chats/conversas
  async getChats(sessionName: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/api/sessions/${sessionName}/chats`);
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting chats:', error.response?.data || error.message);
      return [];
    }
  }

  // Obter mensagens de um chat
  async getChatMessages(sessionName: string, chatId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.api.get(
        `/api/sessions/${sessionName}/chats/${chatId}/messages`,
        { params: { limit } }
      );
      return response.data || [];
    } catch (error: any) {
      console.error('Error getting messages:', error.response?.data || error.message);
      return [];
    }
  }

  // Marcar mensagens como lidas
  async markAsRead(sessionName: string, chatId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.api.post(
        `/api/sessions/${sessionName}/chats/${chatId}/messages/read`
      );
      
      return {
        success: true,
        message: 'Mensagens marcadas como lidas'
      };
    } catch (error: any) {
      console.error('Error marking as read:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao marcar como lida'
      };
    }
  }

  // Obter número conectado da sessão
  async getConnectedNumber(sessionName: string): Promise<{
    success: boolean;
    phoneNumber?: string;
    displayName?: string;
    status?: string;
    message?: string;
  }> {
    try {
      const session = await this.getSession(sessionName);
      
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada'
        };
      }

      if (session.status === 'WORKING' && session.me) {
        // Formatar o número removendo @c.us ou @s.whatsapp.net
        const phoneNumber = session.me.id.replace(/@.*$/, '');
        
        return {
          success: true,
          phoneNumber,
          displayName: session.me.pushName || 'WhatsApp User',
          status: session.status,
          message: 'Número conectado com sucesso'
        };
      }

      return {
        success: false,
        status: session.status,
        message: session.status === 'SCAN_QR_CODE' ? 'Aguardando escaneamento do QR Code' : 'Sessão não conectada'
      };
    } catch (error: any) {
      console.error('Error getting connected number:', error.message);
      return {
        success: false,
        message: 'Erro ao obter número conectado'
      };
    }
  }

  // Verificar saúde do serviço WAHA
  async checkHealth(): Promise<{
    success: boolean;
    version?: string;
    sessionsCount?: number;
  }> {
    try {
      // WAHA pode não ter endpoint de health, então vamos verificar listando sessões
      const sessions = await this.listSessions();
      
      return {
        success: true,
        version: 'WAHA Plus',
        sessionsCount: sessions.length
      };
    } catch (error: any) {
      console.error('WAHA health check failed:', error.message);
      return {
        success: false
      };
    }
  }

  // Criar sessão para número próprio (sem número Salvy)
  async createOwnNumberSession(tenantId: string, displayName: string): Promise<{
    success: boolean;
    sessionName?: string;
    session?: WAHASession;
    message?: string;
  }> {
    const sessionName = `${tenantId}_own_${Date.now()}`;
    
    const result = await this.createSession({
      sessionName,
      tenantId,
      displayName: displayName || 'Número Próprio',
      metadata: {
        type: 'own_number',
        createdAt: new Date().toISOString()
      }
    });

    if (result.success) {
      return {
        ...result,
        sessionName
      };
    }

    return result;
  }
}

// Singleton
export default new WAHAService();