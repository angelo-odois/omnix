import { api } from '../lib/api';
import type { LoginRequest, VerifyOTPRequest, AuthResponse, User, Tenant } from '../types/auth';

export interface LoginV2Request {
  email: string;
  password: string;
}

export interface AuthV2Response {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  tenant?: Tenant;
  message?: string;
}

export interface SessionResponse {
  success: boolean;
  user?: User;
  tenant?: Tenant;
  message?: string;
}

export const authServiceV2 = {
  async loginWithPassword(data: LoginV2Request): Promise<AuthV2Response> {
    const response = await api.post('/v2/auth/login', data);
    return response.data;
  },

  async requestMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/v2/auth/magic-link', { email });
    return response.data;
  },

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthV2Response> {
    const response = await api.post('/v2/auth/verify-otp', data);
    return response.data;
  },

  async validateSession(): Promise<SessionResponse> {
    try {
      const response = await api.get('/v2/auth/session');
      return response.data;
    } catch (error: any) {
      console.error('Session validation error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao validar sessão',
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/v2/auth/logout');
    } catch (error) {
      // Ignore errors on logout
      console.warn('Logout error:', error);
    }
  },

  async getRoles(): Promise<{
    success: boolean;
    roles?: string[];
    currentRole?: string;
  }> {
    const response = await api.get('/v2/auth/roles');
    return response.data;
  },

  async getPlans(): Promise<{
    success: boolean;
    plans?: any[];
  }> {
    const response = await api.get('/v2/auth/plans');
    return response.data;
  },
};