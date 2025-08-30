import { v4 as uuidv4 } from 'uuid';
import { Module, TenantModuleConfig, ModuleStats, ModuleConfig, SYSTEM_MODULES, MODULE_CATEGORIES } from '../types/modules';

class ModuleService {
  private modules: Map<string, Module> = new Map();
  private tenantModules: Map<string, TenantModuleConfig> = new Map(); // key: tenantId-moduleId

  constructor() {
    this.initializeSystemModules();
  }

  private initializeSystemModules() {
    const systemModules: Module[] = [
      {
        id: SYSTEM_MODULES.WHATSAPP,
        name: 'whatsapp',
        displayName: 'WhatsApp Integration',
        description: 'Conecte e gerencie números do WhatsApp Business API',
        version: '1.0.0',
        category: MODULE_CATEGORIES.COMMUNICATION,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [
          { moduleId: SYSTEM_MODULES.MESSAGES, required: true },
          { moduleId: SYSTEM_MODULES.WEBHOOKS, required: true }
        ],
        permissions: [
          { id: 'whatsapp:read', name: 'View WhatsApp', description: 'View WhatsApp instances', scope: 'read' },
          { id: 'whatsapp:write', name: 'Manage WhatsApp', description: 'Create and manage instances', scope: 'write' },
          { id: 'whatsapp:admin', name: 'WhatsApp Admin', description: 'Full WhatsApp management', scope: 'admin' }
        ],
        requiredRoles: ['tenant_operator'],
        defaultConfig: {
          maxInstances: 5,
          maxUsers: 10,
          maxRequests: 10000,
          customLimits: { maxGroups: 100, maxContacts: 5000 }
        },
        icon: '📱',
        color: '#25D366',
        tags: ['messaging', 'whatsapp', 'business'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.WORKFLOWS,
        name: 'workflows',
        displayName: 'Automation Workflows',
        description: 'Crie e gerencie automações e workflows inteligentes',
        version: '1.0.0',
        category: MODULE_CATEGORIES.AUTOMATION,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [
          { moduleId: SYSTEM_MODULES.MESSAGES, required: true }
        ],
        permissions: [
          { id: 'workflows:read', name: 'View Workflows', description: 'View automation workflows', scope: 'read' },
          { id: 'workflows:write', name: 'Manage Workflows', description: 'Create and edit workflows', scope: 'write' },
          { id: 'workflows:admin', name: 'Workflows Admin', description: 'Full workflow management', scope: 'admin' }
        ],
        requiredRoles: ['tenant_manager'],
        defaultConfig: {
          maxRequests: 50000,
          customLimits: { maxWorkflows: 20, maxActions: 100, maxTriggers: 50 }
        },
        icon: '⚡',
        color: '#6366F1',
        tags: ['automation', 'workflow', 'triggers'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.MESSAGES,
        name: 'messages',
        displayName: 'Message Management',
        description: 'Sistema central de mensagens e comunicação',
        version: '1.0.0',
        category: MODULE_CATEGORIES.CORE,
        isActive: true,
        isCore: true,
        requiresActivation: false,
        dependencies: [],
        permissions: [
          { id: 'messages:read', name: 'View Messages', description: 'View message history', scope: 'read' },
          { id: 'messages:write', name: 'Send Messages', description: 'Send and reply messages', scope: 'write' }
        ],
        requiredRoles: ['tenant_operator'],
        defaultConfig: {
          maxRequests: 100000,
          storageGB: 5,
          customLimits: { maxMessageHistory: 100000, retentionDays: 365 }
        },
        icon: '💬',
        color: '#10B981',
        tags: ['core', 'messages', 'communication'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.CONTACTS,
        name: 'contacts',
        displayName: 'Contact Management',
        description: 'Gerencie contatos, grupos e relacionamentos',
        version: '1.0.0',
        category: MODULE_CATEGORIES.CORE,
        isActive: true,
        isCore: true,
        requiresActivation: false,
        dependencies: [],
        permissions: [
          { id: 'contacts:read', name: 'View Contacts', description: 'View contact information', scope: 'read' },
          { id: 'contacts:write', name: 'Manage Contacts', description: 'Create and edit contacts', scope: 'write' }
        ],
        requiredRoles: ['tenant_operator'],
        defaultConfig: {
          customLimits: { maxContacts: 10000, maxGroups: 500, maxTags: 100 }
        },
        icon: '👥',
        color: '#F59E0B',
        tags: ['core', 'contacts', 'crm'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.SALVY,
        name: 'salvy',
        displayName: 'Salvy AI Assistant',
        description: 'Assistente AI inteligente para atendimento automatizado',
        version: '1.0.0',
        category: MODULE_CATEGORIES.INTEGRATION,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [
          { moduleId: SYSTEM_MODULES.MESSAGES, required: true },
          { moduleId: SYSTEM_MODULES.CONTACTS, required: true }
        ],
        permissions: [
          { id: 'salvy:read', name: 'View Salvy', description: 'View AI assistant logs', scope: 'read' },
          { id: 'salvy:write', name: 'Use Salvy', description: 'Use AI assistant features', scope: 'write' },
          { id: 'salvy:admin', name: 'Salvy Admin', description: 'Configure AI assistant', scope: 'admin' }
        ],
        requiredRoles: ['tenant_manager'],
        defaultConfig: {
          maxRequests: 5000,
          customLimits: { maxTokens: 1000000, maxConversations: 1000 }
        },
        icon: '🤖',
        color: '#8B5CF6',
        tags: ['ai', 'assistant', 'automation'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.WEBHOOKS,
        name: 'webhooks',
        displayName: 'Webhook Integration',
        description: 'Integre com sistemas externos via webhooks',
        version: '1.0.0',
        category: MODULE_CATEGORIES.INTEGRATION,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [],
        permissions: [
          { id: 'webhooks:read', name: 'View Webhooks', description: 'View webhook configurations', scope: 'read' },
          { id: 'webhooks:write', name: 'Manage Webhooks', description: 'Create and edit webhooks', scope: 'write' }
        ],
        requiredRoles: ['tenant_admin'],
        defaultConfig: {
          maxRequests: 25000,
          customLimits: { maxWebhooks: 20, maxRetries: 3, timeoutSeconds: 30 }
        },
        icon: '🔗',
        color: '#EF4444',
        tags: ['integration', 'webhooks', 'api'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.STRIPE,
        name: 'stripe',
        displayName: 'Payment Integration',
        description: 'Processamento de pagamentos via Stripe',
        version: '1.0.0',
        category: MODULE_CATEGORIES.INTEGRATION,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [
          { moduleId: SYSTEM_MODULES.WEBHOOKS, required: true }
        ],
        permissions: [
          { id: 'stripe:read', name: 'View Payments', description: 'View payment information', scope: 'read' },
          { id: 'stripe:admin', name: 'Payment Admin', description: 'Manage payment settings', scope: 'admin' }
        ],
        requiredRoles: ['tenant_admin'],
        defaultConfig: {
          maxRequests: 10000,
          customLimits: { maxTransactions: 1000, maxAmount: 100000 }
        },
        icon: '💳',
        color: '#6772E5',
        tags: ['payments', 'stripe', 'billing'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.API,
        name: 'api',
        displayName: 'API Access',
        description: 'Acesso completo à API REST e webhooks',
        version: '1.0.0',
        category: MODULE_CATEGORIES.CORE,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [],
        permissions: [
          { id: 'api:read', name: 'API Read', description: 'Read access to API endpoints', scope: 'read' },
          { id: 'api:write', name: 'API Write', description: 'Write access to API endpoints', scope: 'write' },
          { id: 'api:admin', name: 'API Admin', description: 'Full API access and key management', scope: 'admin' }
        ],
        requiredRoles: ['tenant_admin'],
        defaultConfig: {
          maxRequests: 100000,
          customLimits: { maxApiKeys: 10, rateLimitPerHour: 10000 }
        },
        icon: '🔌',
        color: '#059669',
        tags: ['api', 'integration', 'developer'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: SYSTEM_MODULES.ANALYTICS,
        name: 'analytics',
        displayName: 'Analytics & Reports',
        description: 'Relatórios detalhados e analytics em tempo real',
        version: '1.0.0',
        category: MODULE_CATEGORIES.ANALYTICS,
        isActive: true,
        isCore: false,
        requiresActivation: true,
        dependencies: [
          { moduleId: SYSTEM_MODULES.MESSAGES, required: true }
        ],
        permissions: [
          { id: 'analytics:read', name: 'View Analytics', description: 'View reports and analytics', scope: 'read' },
          { id: 'analytics:admin', name: 'Analytics Admin', description: 'Configure analytics and exports', scope: 'admin' }
        ],
        requiredRoles: ['tenant_manager'],
        defaultConfig: {
          storageGB: 10,
          customLimits: { maxReports: 50, retentionDays: 365, maxExports: 20 }
        },
        icon: '📊',
        color: '#DC2626',
        tags: ['analytics', 'reports', 'insights'],
        author: 'OmniX Team',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    systemModules.forEach(module => this.modules.set(module.id, module));
    console.log(`ModuleService: Initialized with ${systemModules.length} system modules`);
  }

  // Module Management
  async getAllModules(): Promise<Module[]> {
    return Array.from(this.modules.values()).sort((a, b) => {
      if (a.isCore && !b.isCore) return -1;
      if (!a.isCore && b.isCore) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  }

  async getActiveModules(): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.isActive)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async getModuleById(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async getModulesByCategory(category: string): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.category === category)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  // Tenant Module Configuration
  async getTenantModules(tenantId: string): Promise<TenantModuleConfig[]> {
    return Array.from(this.tenantModules.values())
      .filter(config => config.tenantId === tenantId);
  }

  async getTenantModule(tenantId: string, moduleId: string): Promise<TenantModuleConfig | undefined> {
    return this.tenantModules.get(`${tenantId}-${moduleId}`);
  }

  async enableModuleForTenant(tenantId: string, moduleId: string, config: Partial<ModuleConfig> = {}, activatedBy: string): Promise<TenantModuleConfig> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const key = `${tenantId}-${moduleId}`;
    const existingConfig = this.tenantModules.get(key);

    if (existingConfig) {
      // Update existing configuration
      const updatedConfig: TenantModuleConfig = {
        ...existingConfig,
        isEnabled: true,
        isActive: module.requiresActivation ? false : true,
        config: { ...module.defaultConfig, ...config },
        activatedBy,
        updatedAt: new Date()
      };

      if (module.requiresActivation && !existingConfig.isActive) {
        updatedConfig.activatedAt = new Date();
        updatedConfig.isActive = true;
      }

      this.tenantModules.set(key, updatedConfig);
      return updatedConfig;
    }

    // Create new configuration
    const newConfig: TenantModuleConfig = {
      tenantId,
      moduleId,
      isEnabled: true,
      isActive: module.requiresActivation ? true : true,
      config: { ...module.defaultConfig, ...config },
      usage: {
        requests: 0,
        storage: 0,
        instances: 0,
        users: 0
      },
      activatedAt: new Date(),
      activatedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tenantModules.set(key, newConfig);
    return newConfig;
  }

  async disableModuleForTenant(tenantId: string, moduleId: string, deactivatedBy: string): Promise<boolean> {
    const module = this.modules.get(moduleId);
    if (!module) return false;

    if (module.isCore) {
      throw new Error('Core modules cannot be disabled');
    }

    const key = `${tenantId}-${moduleId}`;
    const config = this.tenantModules.get(key);

    if (config) {
      config.isEnabled = false;
      config.isActive = false;
      config.deactivatedAt = new Date();
      config.deactivatedBy = deactivatedBy;
      config.updatedAt = new Date();
      return true;
    }

    return false;
  }

  async updateTenantModuleConfig(tenantId: string, moduleId: string, updates: Partial<ModuleConfig>): Promise<TenantModuleConfig | null> {
    const key = `${tenantId}-${moduleId}`;
    const config = this.tenantModules.get(key);

    if (!config) return null;

    config.config = { ...config.config, ...updates };
    config.updatedAt = new Date();

    return config;
  }

  // Statistics and Analytics
  async getModuleStats(): Promise<ModuleStats> {
    const modules = Array.from(this.modules.values());
    const tenantConfigs = Array.from(this.tenantModules.values());

    const categoryDistribution = Object.values(MODULE_CATEGORIES).map(category => ({
      category,
      count: modules.filter(m => m.category === category).length
    }));

    // Calculate most used modules
    const moduleUsage = new Map<string, { requests: number, tenants: Set<string> }>();
    tenantConfigs.forEach(config => {
      if (!moduleUsage.has(config.moduleId)) {
        moduleUsage.set(config.moduleId, { requests: 0, tenants: new Set() });
      }
      const usage = moduleUsage.get(config.moduleId)!;
      usage.requests += config.usage.requests;
      usage.tenants.add(config.tenantId);
    });

    const mostUsedModules = Array.from(moduleUsage.entries())
      .map(([moduleId, usage]) => {
        const module = this.modules.get(moduleId);
        return {
          moduleId,
          moduleName: module?.displayName || moduleId,
          tenantCount: usage.tenants.size,
          totalRequests: usage.requests
        };
      })
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10);

    // Calculate tenant stats
    const tenantStats = new Map<string, { enabledModules: number, totalRequests: number }>();
    tenantConfigs.forEach(config => {
      if (!tenantStats.has(config.tenantId)) {
        tenantStats.set(config.tenantId, { enabledModules: 0, totalRequests: 0 });
      }
      const stats = tenantStats.get(config.tenantId)!;
      if (config.isEnabled) stats.enabledModules++;
      stats.totalRequests += config.usage.requests;
    });

    const tenantModuleStats = Array.from(tenantStats.entries()).map(([tenantId, stats]) => ({
      tenantId,
      tenantName: `Tenant ${tenantId}`, // TODO: Get actual tenant name
      ...stats
    }));

    return {
      totalModules: modules.length,
      activeModules: modules.filter(m => m.isActive).length,
      coreModules: modules.filter(m => m.isCore).length,
      categoryDistribution,
      mostUsedModules,
      tenantModuleStats
    };
  }

  // Validation and Dependencies
  async validateModuleDependencies(moduleId: string, tenantId: string): Promise<{ valid: boolean; missingDependencies: string[] }> {
    const module = this.modules.get(moduleId);
    if (!module) {
      return { valid: false, missingDependencies: [] };
    }

    const missingDependencies: string[] = [];

    for (const dep of module.dependencies) {
      if (dep.required) {
        const tenantModule = await this.getTenantModule(tenantId, dep.moduleId);
        if (!tenantModule || !tenantModule.isEnabled || !tenantModule.isActive) {
          missingDependencies.push(dep.moduleId);
        }
      }
    }

    return {
      valid: missingDependencies.length === 0,
      missingDependencies
    };
  }

  // Tenant Module Activation System
  async setupTenantModulesFromPackage(tenantId: string, packageId: string, activatedBy: string): Promise<void> {
    const packageInfo = await import('../services/adminService');
    const adminService = packageInfo.adminService;
    const packageData = await adminService.getPackageById(packageId);
    
    if (!packageData) {
      throw new Error(`Package ${packageId} not found`);
    }

    // Ativar módulos incluídos no pacote
    for (const packageModule of packageData.modules) {
      if (packageModule.included) {
        try {
          await this.enableModuleForTenant(
            tenantId, 
            packageModule.moduleId, 
            packageModule.limits || {}, 
            activatedBy
          );
          console.log(`Module ${packageModule.moduleId} activated for tenant ${tenantId}`);
        } catch (error) {
          console.error(`Failed to activate module ${packageModule.moduleId} for tenant ${tenantId}:`, error);
        }
      }
    }
  }

  async getAvailableModulesForTenant(tenantId: string): Promise<{
    active: TenantModuleConfig[];
    available: Module[];
    restricted: Module[];
  }> {
    // Buscar configurações ativas do tenant
    const activeTenantModules = await this.getTenantModules(tenantId);
    
    // Buscar o pacote do tenant para saber quais módulos estão disponíveis
    // Por enquanto, vamos considerar todos os módulos como disponíveis
    // TODO: Integrar com o sistema de pacotes
    
    const allModules = Array.from(this.modules.values());
    const activeModuleIds = new Set(activeTenantModules.map(tm => tm.moduleId));
    
    const available = allModules.filter(module => 
      !activeModuleIds.has(module.id) && !module.isCore
    );
    
    const restricted = allModules.filter(module => 
      !activeModuleIds.has(module.id) && module.isCore
    );

    return {
      active: activeTenantModules,
      available,
      restricted
    };
  }

  async bulkEnableModules(tenantId: string, moduleIds: string[], activatedBy: string): Promise<{
    success: string[];
    failed: { moduleId: string; error: string }[];
  }> {
    const results = { success: [], failed: [] };

    for (const moduleId of moduleIds) {
      try {
        // Validar dependências primeiro
        const validation = await this.validateModuleDependencies(moduleId, tenantId);
        if (!validation.valid) {
          // Tentar ativar dependências automaticamente
          for (const depId of validation.missingDependencies) {
            try {
              await this.enableModuleForTenant(tenantId, depId, {}, activatedBy);
              console.log(`Auto-activated dependency ${depId} for module ${moduleId}`);
            } catch (depError) {
              console.error(`Failed to auto-activate dependency ${depId}:`, depError);
            }
          }
        }

        await this.enableModuleForTenant(tenantId, moduleId, {}, activatedBy);
        results.success.push(moduleId);
      } catch (error: any) {
        results.failed.push({
          moduleId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  async bulkDisableModules(tenantId: string, moduleIds: string[], deactivatedBy: string): Promise<{
    success: string[];
    failed: { moduleId: string; error: string }[];
  }> {
    const results = { success: [], failed: [] };

    for (const moduleId of moduleIds) {
      try {
        await this.disableModuleForTenant(tenantId, moduleId, deactivatedBy);
        results.success.push(moduleId);
      } catch (error: any) {
        results.failed.push({
          moduleId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  // Module Usage Tracking
  async trackModuleUsage(tenantId: string, moduleId: string, usageType: 'request' | 'instance' | 'user', amount = 1): Promise<void> {
    const key = `${tenantId}-${moduleId}`;
    const config = this.tenantModules.get(key);
    
    if (!config) return;

    switch (usageType) {
      case 'request':
        config.usage.requests += amount;
        break;
      case 'instance':
        config.usage.instances += amount;
        break;
      case 'user':
        config.usage.users += amount;
        break;
    }

    config.usage.lastUsed = new Date();
    config.updatedAt = new Date();
  }

  async resetModuleUsage(tenantId: string, moduleId: string, usageType?: 'request' | 'instance' | 'user'): Promise<void> {
    const key = `${tenantId}-${moduleId}`;
    const config = this.tenantModules.get(key);
    
    if (!config) return;

    if (usageType) {
      switch (usageType) {
        case 'request':
          config.usage.requests = 0;
          break;
        case 'instance':
          config.usage.instances = 0;
          break;
        case 'user':
          config.usage.users = 0;
          break;
      }
    } else {
      // Reset all usage
      config.usage = {
        requests: 0,
        storage: 0,
        instances: 0,
        users: 0,
        lastUsed: config.usage.lastUsed
      };
    }

    config.updatedAt = new Date();
  }

  // Get modules with their tenant status
  async getModulesWithTenantStatus(tenantId: string): Promise<Array<Module & { tenantStatus?: TenantModuleConfig }>> {
    const modules = await this.getAllModules();
    const tenantModules = await this.getTenantModules(tenantId);
    
    const tenantModuleMap = new Map(
      tenantModules.map(tm => [tm.moduleId, tm])
    );

    return modules.map(module => ({
      ...module,
      tenantStatus: tenantModuleMap.get(module.id)
    }));
  }
}

export const moduleService = new ModuleService();