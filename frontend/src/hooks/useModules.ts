import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export interface TenantModule {
  moduleId: string;
  isEnabled: boolean;
  isActive: boolean;
  config: {
    maxInstances?: number;
    maxUsers?: number;
    maxRequests?: number;
    customLimits?: Record<string, any>;
  };
  usage: {
    requests: number;
    storage: number;
    instances: number;
    users: number;
    lastUsed?: string;
  };
}

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  isActive: boolean;
  isCore: boolean;
  icon: string;
  color: string;
  tags: string[];
}

export function useModules() {
  const { user } = useAuthStore();
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tenantId && user.role !== 'super_admin') {
      loadTenantModules();
      loadTenantAvailableModules(); // Use tenant API instead of admin API
    } else {
      // Para super admin ou usuários sem tenant, carregar todos os módulos
      loadAllModules();
    }
  }, [user?.tenantId, user?.role]);

  const loadTenantModules = async () => {
    if (!user?.tenantId) return;

    try {
      console.log('Loading tenant modules for:', user.tenantId, user.email);
      // Use tenant API for self-service
      const response = await api.get('/tenant/my-modules/active');
      console.log('Tenant modules response:', response.data);
      setTenantModules(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to load tenant modules:', err);
      setError(err.message || 'Erro ao carregar módulos do tenant');
      // Fallback: tentar carregar via admin API se tenant API falhar
      try {
        if (user.tenantId) {
          const adminResponse = await api.get(`/admin/tenants/${user.tenantId}/modules`);
          setTenantModules(adminResponse.data.data || []);
          console.log('Loaded via admin API fallback');
        }
      } catch (adminErr) {
        console.error('Admin API fallback also failed:', adminErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllModules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/modules');
      setAllModules(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar módulos');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantAvailableModules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/my-modules');
      // The API already returns formatted modules
      const modules = response.data.data || [];
      setAllModules(modules);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar módulos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se um módulo específico está ativo
  const hasModule = (moduleId: string): boolean => {
    // Super admin sempre tem acesso
    if (user?.role === 'super_admin') return true;

    // Para tenant users, verificar tanto tenantModules quanto allModules
    // First check tenantModules (active modules)
    const tenantModule = tenantModules.find(tm => tm.moduleId === moduleId);
    if (tenantModule && tenantModule.isEnabled && tenantModule.isActive) {
      return true;
    }

    // Then check allModules with tenantStatus
    const moduleWithStatus = allModules.find(m => m.id === moduleId);
    if (moduleWithStatus && (moduleWithStatus as any).tenantStatus) {
      const status = (moduleWithStatus as any).tenantStatus;
      return status.isEnabled && status.isActive;
    }

    // Core modules are always available
    const coreModules = ['messages', 'contacts', 'whatsapp'];
    return coreModules.includes(moduleId);
  };

  // Verificar se qualquer um dos módulos está ativo
  const hasAnyModule = (moduleIds: string[]): boolean => {
    return moduleIds.some(id => hasModule(id));
  };

  // Verificar se todos os módulos estão ativos
  const hasAllModules = (moduleIds: string[]): boolean => {
    return moduleIds.every(id => hasModule(id));
  };

  // Obter configuração de um módulo específico
  const getModuleConfig = (moduleId: string): TenantModule | null => {
    return tenantModules.find(tm => tm.moduleId === moduleId) || null;
  };

  // Obter módulos por categoria
  const getModulesByCategory = (category: string): TenantModule[] => {
    return tenantModules.filter(tm => {
      const module = allModules.find(m => m.id === tm.moduleId);
      return module?.category === category;
    });
  };

  // Verificar se está próximo do limite
  const isNearLimit = (moduleId: string, threshold = 0.8): boolean => {
    const tenantModule = getModuleConfig(moduleId);
    if (!tenantModule) return false;

    const { config, usage } = tenantModule;
    
    // Verificar limite de requests
    if (config.maxRequests && config.maxRequests > 0) {
      return usage.requests / config.maxRequests >= threshold;
    }

    // Verificar limites customizados (ex: maxWorkflows)
    if (config.customLimits) {
      for (const [limitKey, limitValue] of Object.entries(config.customLimits)) {
        if (typeof limitValue === 'number' && limitValue > 0) {
          // Para workflows, verificar contra o workflowService ou outro serviço
          // Por enquanto, assumir que não está no limite
        }
      }
    }

    return false;
  };

  // Obter informações de upgrade
  const getUpgradeInfo = (moduleId: string) => {
    if (hasModule(moduleId)) return null;

    // Verificar em quais planos o módulo está disponível
    return {
      module: moduleId,
      availableIn: ['Professional', 'Enterprise'], // Placeholder
      message: `${moduleId} não está incluído no seu plano`,
      action: 'upgrade'
    };
  };

  return {
    // Estado
    tenantModules,
    allModules,
    loading,
    error,
    
    // Verificações
    hasModule,
    hasAnyModule,
    hasAllModules,
    
    // Dados
    getModuleConfig,
    getModulesByCategory,
    
    // Limites
    isNearLimit,
    getUpgradeInfo,
    
    // Ações
    refresh: user?.tenantId ? loadTenantModules : loadAllModules
  };
}

export default useModules;