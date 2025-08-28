import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SALVY_API_URL = process.env.SALVY_API_URL || 'https://api.salvy.com.br/api/v1';
const SALVY_API_KEY = process.env.SALVY_API_KEY || '';

interface SalvyPhoneAccount {
  id: string;
  phoneNumber: string;
  displayName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  provider?: string;
  createdAt?: string;
  metadata?: any;
}

interface SalvyNumber {
  id: string;
  number: string;
  country: string;
  city: string;
  state: string;
  areaCode: string;
  type: 'mobile' | 'landline' | 'toll-free';
  capabilities: string[];
  monthlyPrice: number;
  setupPrice: number;
  available: boolean;
  displayName?: string;
  status?: string;
}

interface PurchaseNumberRequest {
  numberId: string;
  tenantId: string;
  alias?: string;
}

interface PortabilityRequest {
  currentNumber: string;
  currentCarrier: string;
  ownerDocument: string;
  tenantId: string;
}

class SalvyService {
  private api = axios.create({
    baseURL: SALVY_API_URL,
    headers: {
      'Authorization': `Bearer ${SALVY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  // Listar números virtuais da conta (endpoint real)
  async listVirtualPhoneAccounts(): Promise<SalvyPhoneAccount[]> {
    try {
      const response = await this.api.get('/virtual-phone-accounts');
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Error listing virtual phone accounts:', error.response?.data || error.message);
      // Retornar array vazio em caso de erro
      return [];
    }
  }

  // Buscar números disponíveis para compra
  async searchAvailableNumbers(params: {
    country?: string;
    areaCode?: string;
    contains?: string;
    type?: 'mobile' | 'landline' | 'toll-free';
    limit?: number;
  }): Promise<SalvyNumber[]> {
    try {
      // Endpoint pode variar - ajustar conforme documentação Salvy
      const response = await this.api.get('/available-numbers', { params });
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Error searching Salvy numbers:', error.response?.data || error.message);
      // Retornar array vazio em caso de erro
      return [];
    }
  }

  // Comprar um número
  async purchaseNumber(request: PurchaseNumberRequest): Promise<{
    success: boolean;
    number?: SalvyNumber;
    message?: string;
  }> {
    try {
      const response = await this.api.post('/virtual-phone-accounts', {
        phoneNumber: request.numberId, // Ajustar conforme API
        displayName: request.alias,
        metadata: {
          tenantId: request.tenantId
        }
      });

      return {
        success: true,
        number: this.mapPhoneAccountToNumber(response.data),
        message: 'Número adquirido com sucesso'
      };
    } catch (error: any) {
      console.error('Error purchasing number:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Falha ao adquirir número'
      };
    }
  }

  // Listar números do tenant
  async listTenantNumbers(tenantId: string): Promise<SalvyNumber[]> {
    try {
      const accounts = await this.listVirtualPhoneAccounts();
      // Filtrar por tenant se houver metadata
      const tenantAccounts = accounts.filter(acc => 
        acc.metadata?.tenantId === tenantId || !acc.metadata?.tenantId
      );
      return tenantAccounts.map(acc => this.mapPhoneAccountToNumber(acc));
    } catch (error: any) {
      console.error('Error listing tenant numbers:', error.response?.data || error.message);
      return [];
    }
  }

  // Obter detalhes de um número específico
  async getPhoneAccountDetails(accountId: string): Promise<SalvyPhoneAccount | null> {
    try {
      const response = await this.api.get(`/virtual-phone-accounts/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting phone account details:', error.response?.data || error.message);
      return null;
    }
  }

  // Atualizar número virtual
  async updatePhoneAccount(accountId: string, data: {
    displayName?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.api.put(`/virtual-phone-accounts/${accountId}`, data);
      return {
        success: true,
        message: 'Número atualizado com sucesso'
      };
    } catch (error: any) {
      console.error('Error updating phone account:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Falha ao atualizar número'
      };
    }
  }

  // Deletar número virtual
  async deletePhoneAccount(accountId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.api.delete(`/virtual-phone-accounts/${accountId}`);
      return {
        success: true,
        message: 'Número removido com sucesso'
      };
    } catch (error: any) {
      console.error('Error deleting phone account:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Falha ao remover número'
      };
    }
  }

  // Solicitar portabilidade
  async requestPortability(request: PortabilityRequest): Promise<{
    success: boolean;
    requestId?: string;
    message?: string;
  }> {
    try {
      const response = await this.api.post('/portability/request', request);
      return {
        success: true,
        requestId: response.data.requestId,
        message: 'Solicitação de portabilidade iniciada'
      };
    } catch (error: any) {
      console.error('Error requesting portability:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Falha ao solicitar portabilidade'
      };
    }
  }

  // Verificar status da portabilidade
  async checkPortabilityStatus(requestId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    message?: string;
  }> {
    try {
      const response = await this.api.get(`/portability/status/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking portability status:', error.response?.data || error.message);
      throw new Error('Falha ao verificar status da portabilidade');
    }
  }

  // Mapear phone account para formato de número
  private mapPhoneAccountToNumber(account: SalvyPhoneAccount): SalvyNumber {
    // Extrair DDD do número
    const phoneNumber = account.phoneNumber.replace(/\D/g, '');
    const areaCode = phoneNumber.substring(2, 4); // Assumindo formato brasileiro

    return {
      id: account.id,
      number: account.phoneNumber,
      country: 'BR',
      city: 'São Paulo', // Pode ser obtido via API de geolocalização
      state: 'SP',
      areaCode: areaCode,
      type: 'mobile',
      capabilities: ['sms', 'voice', 'whatsapp'],
      monthlyPrice: 29.90, // Valor padrão - ajustar conforme plano
      setupPrice: 0,
      available: account.status === 'ACTIVE',
      displayName: account.displayName,
      status: account.status
    };
  }


  // Método antigo mantido para compatibilidade
  async cancelNumber(numberId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.deletePhoneAccount(numberId);
  }

  // Método antigo mantido para compatibilidade
  async getNumberDetails(numberId: string): Promise<SalvyNumber | null> {
    const account = await this.getPhoneAccountDetails(numberId);
    return account ? this.mapPhoneAccountToNumber(account) : null;
  }

  // Criar número virtual após pagamento confirmado
  async createVirtualNumber(data: {
    areaCode: string;
    redirectNumber: string;
    displayName: string;
    tenantId?: string;
  }): Promise<{
    success: boolean;
    phoneNumber?: string;
    accountId?: string;
    message?: string;
  }> {
    try {
      // Primeiro buscar números disponíveis para o DDD
      const availableNumbers = await this.searchAvailableNumbers({
        areaCode: data.areaCode,
        type: 'mobile',
        limit: 10
      });

      if (availableNumbers.length === 0) {
        return {
          success: false,
          message: `Nenhum número disponível para o DDD ${data.areaCode}`
        };
      }

      // Selecionar o primeiro número disponível
      const selectedNumber = availableNumbers[0];

      // Criar o número virtual na Salvy com campos corretos da API
      const response = await this.api.post('/virtual-phone-accounts', {
        areaCode: parseInt(data.areaCode),
        redirectPhoneNumber: data.redirectNumber,
        displayName: data.displayName,
        metadata: {
          tenantId: data.tenantId,
          managerName: data.displayName
        }
      });

      return {
        success: true,
        phoneNumber: response.data.phoneNumber || selectedNumber.number,
        accountId: response.data.id,
        message: 'Número virtual criado com sucesso'
      };
    } catch (error: any) {
      console.error('Error creating virtual number:', error.response?.data || error.message);
      
      // Em caso de erro, retornar número mock para demonstração
      if (process.env.NODE_ENV === 'development') {
        const mockNumber = `+55 ${data.areaCode} 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          success: true,
          phoneNumber: mockNumber,
          accountId: `mock-${Date.now()}`,
          message: 'Número virtual criado (modo desenvolvimento)'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Falha ao criar número virtual'
      };
    }
  }
}

export default new SalvyService();