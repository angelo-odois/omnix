import { api } from '../lib/api';
import type { SalvyNumber, WAHAInstance, PortabilityRequest } from '../types/instance';

export const instanceService = {
  // Salvy - Números
  async searchAvailableNumbers(params?: {
    areaCode?: string;
    contains?: string;
    type?: string;
  }): Promise<SalvyNumber[]> {
    const response = await api.get('/salvy/numbers/search', { params });
    return response.data.numbers || [];
  },

  async purchaseNumber(numberId: string, alias?: string): Promise<{
    success: boolean;
    number?: SalvyNumber;
    message?: string;
  }> {
    const response = await api.post('/salvy/numbers/purchase', {
      numberId,
      alias
    });
    return response.data;
  },

  async getOwnedNumbers(): Promise<SalvyNumber[]> {
    const response = await api.get('/salvy/numbers/owned');
    return response.data.numbers || [];
  },

  async requestPortability(data: {
    currentNumber: string;
    currentCarrier: string;
    ownerDocument: string;
  }): Promise<{ success: boolean; requestId?: string; message?: string }> {
    const response = await api.post('/salvy/portability/request', data);
    return response.data;
  },

  async getPortabilityStatus(requestId: string): Promise<{
    status: string;
    message?: string;
  }> {
    const response = await api.get(`/salvy/portability/status/${requestId}`);
    return response.data;
  },

  async cancelNumber(numberId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const response = await api.delete(`/salvy/numbers/${numberId}`);
    return response.data;
  },

  // WhatsApp - Instâncias
  async getInstances(): Promise<any[]> {
    const response = await api.get('/whatsapp/instances');
    return response.data.data || [];
  },

  async createInstance(numberId: string, name: string): Promise<{
    success: boolean;
    instance?: WAHAInstance;
    message?: string;
  }> {
    // Será implementado com WAHA
    return {
      success: true,
      message: 'Instância criada com sucesso'
    };
  },

  async getInstanceQRCode(instanceId: string): Promise<string> {
    // Será implementado com WAHA
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
  },

  async restartInstance(instanceId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    // Será implementado com WAHA
    return {
      success: true,
      message: 'Instância reiniciada'
    };
  },

  async deleteInstance(instanceId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const response = await api.delete(`/whatsapp/instances/${instanceId}`);
    return response.data;
  },

  async disconnectInstance(instanceId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const response = await api.post(`/whatsapp/instances/${instanceId}/disconnect`);
    return response.data;
  },

  // Criar número virtual na Salvy após pagamento
  async createVirtualNumber(data: {
    areaCode: string;
    redirectNumber: string;
    displayName: string;
  }): Promise<{
    success: boolean;
    phoneNumber?: string;
    message?: string;
  }> {
    const response = await api.post('/salvy/numbers/create', data);
    return response.data;
  }
};