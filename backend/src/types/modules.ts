export interface ModuleConfig {
  maxInstances?: number;
  maxUsers?: number;
  maxRequests?: number;
  storageGB?: number;
  customLimits?: Record<string, any>;
}

export interface ModuleDependency {
  moduleId: string;
  version?: string;
  required: boolean;
}

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
  scope: 'read' | 'write' | 'admin';
}

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: 'communication' | 'automation' | 'integration' | 'analytics' | 'core';
  
  // Module status and configuration
  isActive: boolean;
  isCore: boolean; // Core modules cannot be disabled
  requiresActivation: boolean; // Needs manual activation per tenant
  
  // Dependencies
  dependencies: ModuleDependency[];
  conflicts?: string[]; // Module IDs that conflict with this one
  
  // Permissions and roles
  permissions: ModulePermission[];
  requiredRoles: string[];
  
  // Configuration and limits
  defaultConfig: ModuleConfig;
  configSchema?: any; // JSON Schema for validation
  
  // UI and display
  icon: string;
  color: string;
  tags: string[];
  
  // Metadata
  author: string;
  homepage?: string;
  documentation?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantModuleConfig {
  tenantId: string;
  moduleId: string;
  isEnabled: boolean;
  isActive: boolean;
  config: ModuleConfig;
  
  // Usage tracking
  usage: {
    requests: number;
    storage: number;
    instances: number;
    users: number;
    lastUsed?: Date;
  };
  
  // Activation info
  activatedAt?: Date;
  activatedBy?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleStats {
  totalModules: number;
  activeModules: number;
  coreModules: number;
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  mostUsedModules: {
    moduleId: string;
    moduleName: string;
    tenantCount: number;
    totalRequests: number;
  }[];
  tenantModuleStats: {
    tenantId: string;
    tenantName: string;
    enabledModules: number;
    totalRequests: number;
  }[];
}

// Pre-defined module categories
export const MODULE_CATEGORIES = {
  COMMUNICATION: 'communication',
  AUTOMATION: 'automation', 
  INTEGRATION: 'integration',
  ANALYTICS: 'analytics',
  CORE: 'core'
} as const;

// Pre-defined module IDs for system modules
export const SYSTEM_MODULES = {
  WHATSAPP: 'whatsapp',
  WORKFLOWS: 'workflows',
  MESSAGES: 'messages',
  CONTACTS: 'contacts',
  WEBHOOKS: 'webhooks',
  SALVY: 'salvy',
  STRIPE: 'stripe',
  EMAIL: 'email',
  AUTH: 'auth',
  ADMIN: 'admin',
  API: 'api',
  ANALYTICS: 'analytics'
} as const;