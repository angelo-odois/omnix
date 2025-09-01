import { v4 as uuidv4 } from 'uuid';
import { Package, TenantAdmin, Permission, Role, AdminStats, PackageFeature, PackageLimits, TenantUsage, TenantSettings, PackageModule } from '../types/admin';
import { SYSTEM_MODULES } from '../types/modules';
import { authServiceV2 } from './authServiceV2';
import prisma from '../lib/database';

class AdminService {
  private packages: Map<string, Package> = new Map();
  private tenantsAdmin: Map<string, TenantAdmin> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Criar pacotes padrão
    const packages: Package[] = [
      {
        id: 'pkg-starter',
        name: 'Starter',
        description: 'Plano básico para pequenas empresas',
        price: 97.00,
        currency: 'BRL',
        billingInterval: 'monthly',
        features: [
          { id: 'f1', name: 'WhatsApp Integration', description: 'Conecte até 2 números do WhatsApp', included: true, limit: 2 },
          { id: 'f2', name: 'Basic Workflows', description: 'Automações básicas', included: true, limit: 5 },
          { id: 'f3', name: 'Contact Management', description: 'Gerenciamento de contatos', included: true },
          { id: 'f4', name: 'API Access', description: 'Acesso completo à API', included: false },
          { id: 'f5', name: 'Custom Branding', description: 'Marca própria na interface', included: false },
        ],
        limits: {
          maxUsers: 3,
          maxInstances: 2,
          maxMessagesPerMonth: 5000,
          maxContacts: 1000,
          maxWorkflows: 5,
          maxIntegrations: 2,
          storageGB: 1,
        },
        modules: [
          { moduleId: SYSTEM_MODULES.MESSAGES, included: true },
          { moduleId: SYSTEM_MODULES.CONTACTS, included: true },
          { moduleId: SYSTEM_MODULES.WHATSAPP, included: true, limits: { maxInstances: 2 } },
          { moduleId: SYSTEM_MODULES.WORKFLOWS, included: true, limits: { customLimits: { maxWorkflows: 5 } } },
          { moduleId: SYSTEM_MODULES.WEBHOOKS, included: false },
          { moduleId: SYSTEM_MODULES.API, included: false },
          { moduleId: SYSTEM_MODULES.ANALYTICS, included: false },
          { moduleId: SYSTEM_MODULES.SALVY, included: false },
          { moduleId: SYSTEM_MODULES.STRIPE, included: false },
        ],
        isActive: true,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'pkg-professional',
        name: 'Professional',
        description: 'Plano completo para empresas em crescimento',
        price: 197.00,
        currency: 'BRL',
        billingInterval: 'monthly',
        features: [
          { id: 'f1', name: 'WhatsApp Integration', description: 'Conecte até 5 números do WhatsApp', included: true, limit: 5 },
          { id: 'f2', name: 'Advanced Workflows', description: 'Automações avançadas', included: true, limit: 20 },
          { id: 'f3', name: 'Contact Management', description: 'Gerenciamento de contatos', included: true },
          { id: 'f4', name: 'API Access', description: 'Acesso completo à API', included: true },
          { id: 'f5', name: 'Custom Branding', description: 'Marca própria na interface', included: false },
          { id: 'f6', name: 'Analytics Dashboard', description: 'Relatórios e analytics', included: true },
        ],
        limits: {
          maxUsers: 10,
          maxInstances: 5,
          maxMessagesPerMonth: 15000,
          maxContacts: 5000,
          maxWorkflows: 20,
          maxIntegrations: 10,
          storageGB: 5,
        },
        modules: [
          { moduleId: SYSTEM_MODULES.MESSAGES, included: true },
          { moduleId: SYSTEM_MODULES.CONTACTS, included: true },
          { moduleId: SYSTEM_MODULES.WHATSAPP, included: true, limits: { maxInstances: 5 } },
          { moduleId: SYSTEM_MODULES.WORKFLOWS, included: true, limits: { customLimits: { maxWorkflows: 20 } } },
          { moduleId: SYSTEM_MODULES.WEBHOOKS, included: true, limits: { customLimits: { maxWebhooks: 10 } } },
          { moduleId: SYSTEM_MODULES.API, included: true, limits: { maxRequests: 50000 } },
          { moduleId: SYSTEM_MODULES.ANALYTICS, included: true },
          { moduleId: SYSTEM_MODULES.SALVY, included: false },
          { moduleId: SYSTEM_MODULES.STRIPE, included: false },
        ],
        isActive: true,
        isPopular: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
      {
        id: 'pkg-enterprise',
        name: 'Enterprise',
        description: 'Solução corporativa com recursos ilimitados',
        price: 497.00,
        currency: 'BRL',
        billingInterval: 'monthly',
        features: [
          { id: 'f1', name: 'WhatsApp Integration', description: 'Números ilimitados do WhatsApp', included: true },
          { id: 'f2', name: 'Unlimited Workflows', description: 'Automações ilimitadas', included: true },
          { id: 'f3', name: 'Contact Management', description: 'Gerenciamento de contatos', included: true },
          { id: 'f4', name: 'API Access', description: 'Acesso completo à API', included: true },
          { id: 'f5', name: 'Custom Branding', description: 'Marca própria na interface', included: true },
          { id: 'f6', name: 'Analytics Dashboard', description: 'Relatórios e analytics', included: true },
          { id: 'f7', name: 'Priority Support', description: 'Suporte prioritário', included: true },
          { id: 'f8', name: 'Custom Integrations', description: 'Integrações personalizadas', included: true },
        ],
        limits: {
          maxUsers: -1, // ilimitado
          maxInstances: -1,
          maxMessagesPerMonth: -1,
          maxContacts: -1,
          maxWorkflows: -1,
          maxIntegrations: -1,
          storageGB: 50,
        },
        modules: [
          { moduleId: SYSTEM_MODULES.MESSAGES, included: true },
          { moduleId: SYSTEM_MODULES.CONTACTS, included: true },
          { moduleId: SYSTEM_MODULES.WHATSAPP, included: true, limits: { maxInstances: -1 } },
          { moduleId: SYSTEM_MODULES.WORKFLOWS, included: true, limits: { customLimits: { maxWorkflows: -1 } } },
          { moduleId: SYSTEM_MODULES.WEBHOOKS, included: true, limits: { customLimits: { maxWebhooks: -1 } } },
          { moduleId: SYSTEM_MODULES.API, included: true, limits: { maxRequests: -1 } },
          { moduleId: SYSTEM_MODULES.ANALYTICS, included: true },
          { moduleId: SYSTEM_MODULES.SALVY, included: true, limits: { maxRequests: -1 } },
          { moduleId: SYSTEM_MODULES.STRIPE, included: true },
        ],
        isActive: true,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      },
    ];

    packages.forEach(pkg => this.packages.set(pkg.id, pkg));

    // Criar permissões padrão
    const permissions: Permission[] = [
      { id: 'admin:packages:create', name: 'Create Packages', description: 'Create new packages', resource: 'packages', action: 'create' },
      { id: 'admin:packages:read', name: 'View Packages', description: 'View packages', resource: 'packages', action: 'read' },
      { id: 'admin:packages:update', name: 'Update Packages', description: 'Update packages', resource: 'packages', action: 'update' },
      { id: 'admin:packages:delete', name: 'Delete Packages', description: 'Delete packages', resource: 'packages', action: 'delete' },
      { id: 'admin:tenants:create', name: 'Create Tenants', description: 'Create new tenants', resource: 'tenants', action: 'create' },
      { id: 'admin:tenants:read', name: 'View Tenants', description: 'View tenants', resource: 'tenants', action: 'read' },
      { id: 'admin:tenants:update', name: 'Update Tenants', description: 'Update tenants', resource: 'tenants', action: 'update' },
      { id: 'admin:tenants:delete', name: 'Delete Tenants', description: 'Delete tenants', resource: 'tenants', action: 'delete' },
      { id: 'admin:users:manage', name: 'Manage Users', description: 'Manage all users', resource: 'users', action: 'manage' },
      { id: 'admin:system:config', name: 'System Config', description: 'Configure system settings', resource: 'system', action: 'config' },
    ];

    permissions.forEach(perm => this.permissions.set(perm.id, perm));

    // Criar roles padrão
    const roles: Role[] = [
      {
        id: 'role-super-admin',
        name: 'Super Admin',
        description: 'Full system access',
        level: 1,
        permissions: permissions.map(p => p.id),
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    roles.forEach(role => this.roles.set(role.id, role));

    console.log('AdminService: Initialized with', packages.length, 'packages and', permissions.length, 'permissions');
  }

  // ============= PACKAGE MANAGEMENT =============

  async createPackage(packageData: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<Package> {
    const newPackage: Package = {
      id: uuidv4(),
      ...packageData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    this.packages.set(newPackage.id, newPackage);
    return newPackage;
  }

  async getAllPackages(): Promise<Package[]> {
    return Array.from(this.packages.values()).sort((a, b) => a.price - b.price);
  }

  async getActivePackages(): Promise<Package[]> {
    return Array.from(this.packages.values())
      .filter(pkg => pkg.isActive)
      .sort((a, b) => a.price - b.price);
  }

  async getPackageById(id: string): Promise<Package | undefined> {
    return this.packages.get(id);
  }

  async updatePackage(id: string, updates: Partial<Package>): Promise<Package | null> {
    const existingPackage = this.packages.get(id);
    if (!existingPackage) return null;

    const updatedPackage = {
      ...existingPackage,
      ...updates,
      updatedAt: new Date(),
    };

    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }

  async deletePackage(id: string): Promise<boolean> {
    return this.packages.delete(id);
  }

  // ============= TENANT MANAGEMENT =============

  async createTenant(tenantData: {
    name: string;
    email: string;
    packageId: string;
    domain?: string;
    adminName: string;
    adminEmail: string;
  }, createdBy: string): Promise<TenantAdmin> {
    const packageExists = this.packages.has(tenantData.packageId);
    if (!packageExists) {
      throw new Error('Package not found');
    }

    const slug = tenantData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    const newTenant: TenantAdmin = {
      id: uuidv4(),
      name: tenantData.name,
      slug,
      email: tenantData.email,
      domain: tenantData.domain,
      packageId: tenantData.packageId,
      status: 'active',
      billingStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      usage: {
        currentUsers: 1, // admin user
        currentInstances: 0,
        messagesThisMonth: 0,
        currentContacts: 0,
        currentWorkflows: 0,
        currentIntegrations: 0,
        storageUsedGB: 0,
        lastCalculatedAt: new Date(),
      },
      settings: {
        allowUserRegistration: true,
        requireEmailVerification: true,
        sessionTimeoutMinutes: 480,
        maxLoginAttempts: 5,
        enableWhatsAppIntegration: true,
        enableWorkflows: true,
        enableAPI: false,
        customBranding: { enabled: false },
        webhooks: { enabled: false },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    this.tenantsAdmin.set(newTenant.id, newTenant);

    // Setup automático dos módulos baseado no pacote
    try {
      const { moduleService } = await import('./moduleService');
      await moduleService.setupTenantModulesFromPackage(newTenant.id, tenantData.packageId, createdBy);
      console.log(`Modules auto-configured for tenant ${newTenant.id} with package ${tenantData.packageId}`);
    } catch (error) {
      console.error(`Failed to setup modules for tenant ${newTenant.id}:`, error);
      // Não falha a criação do tenant se os módulos falharem
    }

    return newTenant;
  }

  async getAllTenants(): Promise<TenantAdmin[]> {
    try {
      // Get tenants from database
      const dbTenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // Convert to TenantAdmin format with default usage
      const adminTenants: TenantAdmin[] = dbTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.domain || tenant.name.toLowerCase().replace(/\s+/g, '-'),
        domain: tenant.domain || '',
        email: tenant.email,
        packageId: tenant.packageId,
        isActive: tenant.isActive,
        plan: 'premium', // Default for now
        status: 'active' as const,
        billingStatus: 'current' as const,
        usage: {
          currentUsers: 0,
          currentInstances: 0,
          messagesThisMonth: 0,
          currentContacts: 0,
          currentWorkflows: 0,
          currentIntegrations: 0,
          storageUsedGB: 0,
          lastCalculatedAt: new Date()
        },
        settings: {
          allowUserRegistration: true,
          requireEmailVerification: true,
          sessionTimeoutMinutes: 480,
          maxLoginAttempts: 5,
          enableWhatsAppIntegration: true,
          enableWorkflows: true,
          enableAPI: false,
          customBranding: { enabled: false },
          webhooks: { enabled: false }
        },
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        createdBy: 'system',
        users: [],
        instances: []
      }));

      return adminTenants;
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  async getTenantById(id: string): Promise<TenantAdmin | undefined> {
    return this.tenantsAdmin.get(id);
  }

  async updateTenant(id: string, updates: Partial<TenantAdmin>): Promise<TenantAdmin | null> {
    const tenant = this.tenantsAdmin.get(id);
    if (!tenant) return null;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date(),
    };

    this.tenantsAdmin.set(id, updatedTenant);
    return updatedTenant;
  }

  async changeTenantPlan(tenantId: string, newPackageId: string, changedBy: string): Promise<{
    success: boolean;
    tenant?: TenantAdmin;
    modulesChanged?: {
      activated: string[];
      deactivated: string[];
      updated: string[];
    };
    message?: string;
  }> {
    try {
      const tenant = this.tenantsAdmin.get(tenantId);
      if (!tenant) {
        return { success: false, message: 'Tenant não encontrado' };
      }

      const oldPackage = this.packages.get(tenant.packageId);
      const newPackage = this.packages.get(newPackageId);
      
      if (!newPackage) {
        return { success: false, message: 'Novo pacote não encontrado' };
      }

      // Import moduleService dinamicamente para evitar dependência circular
      const { moduleService } = await import('./moduleService');

      // Comparar módulos dos pacotes
      const oldModuleIds = oldPackage ? new Set(oldPackage.modules.filter(m => m.included).map(m => m.moduleId)) : new Set();
      const newModuleIds = new Set(newPackage.modules.filter(m => m.included).map(m => m.moduleId));
      
      const toActivate: string[] = Array.from(newModuleIds).filter(id => !oldModuleIds.has(id as string)) as string[];
      const toDeactivate: string[] = Array.from(oldModuleIds).filter(id => !newModuleIds.has(id as string)) as string[];
      const toUpdate: string[] = Array.from(newModuleIds).filter(id => oldModuleIds.has(id as string)) as string[];

      // Ativar novos módulos
      const activatedModules: string[] = [];
      for (const moduleId of toActivate) {
        try {
          const moduleConfig = newPackage.modules.find(m => m.moduleId === moduleId);
          await moduleService.enableModuleForTenant(tenantId, moduleId, moduleConfig?.limits || {}, changedBy);
          activatedModules.push(moduleId);
        } catch (error) {
          console.error(`Failed to activate module ${moduleId}:`, error);
        }
      }

      // Desativar módulos removidos
      const deactivatedModules: string[] = [];
      for (const moduleId of toDeactivate) {
        try {
          // Verificar se não é um módulo core antes de desativar
          const module = await moduleService.getModuleById(moduleId);
          if (module && !module.isCore) {
            await moduleService.disableModuleForTenant(tenantId, moduleId, changedBy);
            deactivatedModules.push(moduleId);
          }
        } catch (error) {
          console.error(`Failed to deactivate module ${moduleId}:`, error);
        }
      }

      // Atualizar configurações dos módulos existentes
      const updatedModules: string[] = [];
      for (const moduleId of toUpdate) {
        try {
          const moduleConfig = newPackage.modules.find(m => m.moduleId === moduleId);
          if (moduleConfig?.limits) {
            await moduleService.updateTenantModuleConfig(tenantId, moduleId, moduleConfig.limits);
            updatedModules.push(moduleId);
          }
        } catch (error) {
          console.error(`Failed to update module ${moduleId}:`, error);
        }
      }

      // Atualizar tenant
      const updatedTenant = await this.updateTenant(tenantId, { 
        packageId: newPackageId,
        updatedAt: new Date()
      });

      console.log(`Tenant ${tenantId} plan changed from ${tenant.packageId} to ${newPackageId} by ${changedBy}`);

      return {
        success: true,
        tenant: updatedTenant!,
        modulesChanged: {
          activated: activatedModules,
          deactivated: deactivatedModules,
          updated: updatedModules
        }
      };

    } catch (error: any) {
      console.error('Error changing tenant plan:', error);
      return { 
        success: false, 
        message: error.message || 'Erro ao alterar plano do tenant' 
      };
    }
  }

  async suspendTenant(id: string): Promise<boolean> {
    const tenant = this.tenantsAdmin.get(id);
    if (!tenant) return false;

    tenant.status = 'suspended';
    tenant.updatedAt = new Date();
    return true;
  }

  async activateTenant(id: string): Promise<boolean> {
    const tenant = this.tenantsAdmin.get(id);
    if (!tenant) return false;

    tenant.status = 'active';
    tenant.updatedAt = new Date();
    return true;
  }

  // ============= STATS AND ANALYTICS =============

  async getAdminStats(): Promise<AdminStats> {
    const tenants = Array.from(this.tenantsAdmin.values());
    const packages = Array.from(this.packages.values());

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter(t => t.status === 'active').length;

    // Calculate revenue
    const totalRevenue = tenants.reduce((sum, tenant) => {
      const pkg = this.packages.get(tenant.packageId);
      return sum + (pkg ? pkg.price : 0);
    }, 0);

    // Package distribution
    const packagesDistribution = packages.map(pkg => {
      const tenantsWithPackage = tenants.filter(t => t.packageId === pkg.id);
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        count: tenantsWithPackage.length,
        revenue: tenantsWithPackage.length * pkg.price,
      };
    });

    return {
      totalTenants,
      activeTenants,
      totalRevenue,
      monthlyRevenue: totalRevenue, // Simplified - same as total for now
      totalUsers: tenants.reduce((sum, t) => sum + t.usage.currentUsers, 0),
      activeUsers: activeTenants * 2, // Simplified estimate
      packagesDistribution,
      recentSignups: tenants
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      systemHealth: {
        status: 'healthy',
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
      },
    };
  }

  // ============= PERMISSIONS =============

  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  hasPermission(userRole: string, resource: string, action: string): boolean {
    // Super admin always has permission
    if (userRole === 'super_admin') return true;

    const role = Array.from(this.roles.values()).find(r => 
      r.name.toLowerCase().replace(/\s+/g, '_') === userRole
    );

    if (!role) return false;

    const permissionId = `admin:${resource}:${action}`;
    return role.permissions.includes(permissionId);
  }
}

export const adminService = new AdminService();