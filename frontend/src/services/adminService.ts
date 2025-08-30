import { api } from '../lib/api';

export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'BRL' | 'USD';
  billingInterval: 'monthly' | 'yearly';
  features: PackageFeature[];
  limits: PackageLimits;
  isActive: boolean;
  isPopular: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PackageFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PackageLimits {
  maxUsers: number;
  maxInstances: number;
  maxMessagesPerMonth: number;
  maxContacts: number;
  maxWorkflows: number;
  maxIntegrations: number;
  storageGB: number;
}

export interface TenantAdmin {
  id: string;
  name: string;
  slug: string;
  email: string;
  domain?: string;
  packageId: string;
  package?: Package;
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  billingStatus: 'current' | 'past_due' | 'cancelled' | 'trial';
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  usage: TenantUsage;
  settings: TenantSettings;
  billing?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    paymentMethodId?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TenantUsage {
  currentUsers: number;
  currentInstances: number;
  messagesThisMonth: number;
  currentContacts: number;
  currentWorkflows: number;
  currentIntegrations: number;
  storageUsedGB: number;
  lastCalculatedAt: string;
}

export interface TenantSettings {
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  enableWhatsAppIntegration: boolean;
  enableWorkflows: boolean;
  enableAPI: boolean;
  customBranding: {
    enabled: boolean;
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  webhooks: {
    enabled: boolean;
    url?: string;
    secret?: string;
  };
}

export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsers: number;
  activeUsers: number;
  packagesDistribution: {
    packageId: string;
    packageName: string;
    count: number;
    revenue: number;
  }[];
  recentSignups: TenantAdmin[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  tenant?: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

class AdminService {
  // Dashboard & Stats
  async getDashboardStats(): Promise<AdminStats> {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  }

  // Package Management
  async getPackages(): Promise<Package[]> {
    const response = await api.get('/admin/packages');
    return response.data.data;
  }

  async getPackage(id: string): Promise<Package> {
    const response = await api.get(`/admin/packages/${id}`);
    return response.data.data;
  }

  async createPackage(packageData: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Package> {
    const response = await api.post('/admin/packages', packageData);
    return response.data.data;
  }

  async updatePackage(id: string, updates: Partial<Package>): Promise<Package> {
    const response = await api.put(`/admin/packages/${id}`, updates);
    return response.data.data;
  }

  async deletePackage(id: string): Promise<void> {
    await api.delete(`/admin/packages/${id}`);
  }

  // Tenant Management
  async getTenants(): Promise<TenantAdmin[]> {
    const response = await api.get('/admin/tenants');
    return response.data.data;
  }

  async getTenant(id: string): Promise<TenantAdmin> {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data.data;
  }

  async createTenant(tenantData: {
    name: string;
    email: string;
    packageId: string;
    domain?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }): Promise<TenantAdmin> {
    const response = await api.post('/admin/tenants', tenantData);
    return response.data.data;
  }

  async updateTenant(id: string, updates: Partial<TenantAdmin>): Promise<TenantAdmin> {
    const response = await api.put(`/admin/tenants/${id}`, updates);
    return response.data.data;
  }

  async suspendTenant(id: string): Promise<void> {
    await api.post(`/admin/tenants/${id}/suspend`);
  }

  async activateTenant(id: string): Promise<void> {
    await api.post(`/admin/tenants/${id}/activate`);
  }

  async changeTenantPlan(id: string, packageId: string): Promise<any> {
    const response = await api.post(`/admin/tenants/${id}/change-plan`, { packageId });
    return response.data.data;
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const response = await api.get('/admin/users');
    return response.data.data;
  }

  // Permissions
  async getPermissions(): Promise<any[]> {
    const response = await api.get('/admin/permissions');
    return response.data.data;
  }

  async getRoles(): Promise<any[]> {
    const response = await api.get('/admin/roles');
    return response.data.data;
  }

  // Module Management
  async getModules(): Promise<any[]> {
    const response = await api.get('/admin/modules');
    return response.data.data;
  }

  async getModule(id: string): Promise<any> {
    const response = await api.get(`/admin/modules/${id}`);
    return response.data.data;
  }

  async getModulesByCategory(category: string): Promise<any[]> {
    const response = await api.get(`/admin/modules/category/${category}`);
    return response.data.data;
  }

  async getModuleStats(): Promise<any> {
    const response = await api.get('/admin/modules/stats');
    return response.data.data;
  }

  // Tenant Module Management
  async getTenantModules(tenantId: string): Promise<any[]> {
    const response = await api.get(`/admin/tenants/${tenantId}/modules`);
    return response.data.data;
  }

  async enableModuleForTenant(tenantId: string, moduleId: string, config?: any): Promise<any> {
    const response = await api.post(`/admin/tenants/${tenantId}/modules/${moduleId}/enable`, { config });
    return response.data.data;
  }

  async disableModuleForTenant(tenantId: string, moduleId: string): Promise<void> {
    await api.post(`/admin/tenants/${tenantId}/modules/${moduleId}/disable`);
  }

  async validateModuleDependencies(tenantId: string, moduleId: string): Promise<any> {
    const response = await api.get(`/admin/tenants/${tenantId}/modules/${moduleId}/validate`);
    return response.data.data;
  }
}

export const adminService = new AdminService();