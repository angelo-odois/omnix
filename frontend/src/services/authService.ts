import { api } from '../lib/api';
import type { LoginRequest, VerifyOTPRequest, AuthResponse } from '../types/auth';

export const authService = {
  async requestMagicLink(data: LoginRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/magic-link', data);
    return response.data;
  },

  async verifyOTP(data: VerifyOTPRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async validateSession(): Promise<AuthResponse> {
    const response = await api.get('/auth/session');
    return response.data;
  },
};