export interface OTPStore {
  email: string;
  otp: string;
  createdAt: Date;
  attempts: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gestor' | 'operador';
  tenantId: string;
}

export interface AuthRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}