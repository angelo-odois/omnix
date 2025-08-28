import { loadStripe, Stripe } from '@stripe/stripe-js';
import { api } from '../lib/api';

// Inicializar Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface CheckoutSessionParams {
  areaCode: string;
  redirectNumber: string;
  displayName: string;
  mode?: 'payment' | 'subscription';
  requestId?: string;
}

export interface PendingRequest {
  id: string;
  userId: string;
  tenantId: string;
  areaCode: string;
  redirectNumber: string;
  displayName: string;
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'canceled';
  createdAt: string;
  expiresAt: string;
}

export const stripeService = {
  // Criar sessão de checkout
  async createCheckoutSession(params: CheckoutSessionParams): Promise<{
    success: boolean;
    sessionId?: string;
    url?: string;
    message?: string;
  }> {
    try {
      const response = await api.post('/stripe/create-checkout-session', {
        ...params,
        mode: params.mode || 'payment'
      });

      if (response.data.success && response.data.url) {
        // Redirecionar para o Stripe Checkout
        window.location.href = response.data.url;
      }

      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar sessão de pagamento'
      };
    }
  },

  // Verificar status de uma sessão
  async retrieveSession(sessionId: string): Promise<{
    success: boolean;
    session?: any;
    message?: string;
  }> {
    try {
      const response = await api.get(`/stripe/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving session:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao recuperar sessão'
      };
    }
  },

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await api.post('/stripe/cancel-subscription', {
        subscriptionId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao cancelar assinatura'
      };
    }
  },

  // Obter instância do Stripe
  async getStripe(): Promise<Stripe | null> {
    return await stripePromise;
  },

  // Buscar solicitações pendentes
  async getPendingRequests(): Promise<{
    success: boolean;
    requests?: PendingRequest[];
    message?: string;
  }> {
    try {
      const response = await api.get('/stripe/pending-requests');
      return response.data;
    } catch (error: any) {
      console.error('Error getting pending requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar solicitações pendentes'
      };
    }
  },

  // Cancelar solicitação pendente
  async cancelPendingRequest(requestId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await api.delete(`/stripe/pending-requests/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error canceling request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao cancelar solicitação'
      };
    }
  }
};