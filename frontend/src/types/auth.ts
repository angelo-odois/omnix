export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_manager' | 'tenant_operator';

export interface User {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
  defaults?: {
    instanceId?: string;
    queue?: string;
  };
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  theme?: {
    primaryColor: string;
    logo?: string;
  };
  plan: string;
  status: 'active' | 'suspended' | 'trial';
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant;
}