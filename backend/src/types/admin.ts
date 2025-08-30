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
  createdAt: Date;
  updatedAt: Date;
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
  trialEndsAt?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  usage: TenantUsage;
  settings: TenantSettings;
  billing?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    paymentMethodId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
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
  lastCalculatedAt: Date;
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

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // 1=super_admin, 2=tenant_admin, 3=tenant_manager, 4=tenant_operator
  permissions: string[]; // Permission IDs
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
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