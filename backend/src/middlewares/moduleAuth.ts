import { Response, NextFunction } from 'express';
import { AuthRequest } from './authV2';
import { moduleService } from '../services/moduleService';
import { adminService } from '../services/adminService';

/**
 * Middleware para verificar se um módulo está ativo para o tenant
 */
export const requireModule = (moduleId: string, action?: 'read' | 'write' | 'admin') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      // Super admin sempre tem acesso
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Verificar se o módulo existe
      const module = await moduleService.getModuleById(moduleId);
      if (!module) {
        return res.status(404).json({
          success: false,
          message: `Módulo ${moduleId} não encontrado`,
        });
      }

      // Módulos core sempre têm acesso (WhatsApp, Messages, Contacts)
      if (module.isCore) {
        console.log(`Core module ${moduleId} access granted for user ${req.user.email}`);
        return next();
      }

      // Para usuários do sistema (sem tenant), apenas módulos core
      if (!req.user.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Módulo não disponível para usuários do sistema',
        });
      }

      // Para módulos não-core, verificar se está ativo para o tenant
      const tenantModule = await moduleService.getTenantModule(req.user.tenantId, moduleId);
      
      if (!tenantModule || !tenantModule.isEnabled || !tenantModule.isActive) {
        return res.status(403).json({
          success: false,
          message: `Módulo ${module.displayName} não está ativo para seu tenant`,
          code: 'MODULE_NOT_ACTIVE'
        });
      }

      // Verificar permissões do usuário para o módulo
      if (action) {
        const hasPermission = await checkModulePermission(req.user.role, module, action);
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: `Sem permissão para ${action} no módulo ${module.displayName}`,
          });
        }
      }

      // Verificar limites do módulo (se aplicável)
      const limitCheck = await checkModuleLimits(tenantModule, req);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: limitCheck.message,
          code: 'MODULE_LIMIT_EXCEEDED'
        });
      }

      // Adicionar informações do módulo ao request
      req.module = {
        id: module.id,
        name: module.name,
        config: tenantModule.config,
        usage: tenantModule.usage
      };

      next();
    } catch (error: any) {
      console.error('Module auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };
};

/**
 * Middleware para verificar múltiplos módulos (qualquer um ativo)
 */
export const requireAnyModule = (moduleIds: string[], action?: 'read' | 'write' | 'admin') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      // Super admin sempre tem acesso
      if (req.user.role === 'super_admin') {
        return next();
      }

      let hasAnyModule = false;
      let activeModule = null;

      for (const moduleId of moduleIds) {
        const module = await moduleService.getModuleById(moduleId);
        if (!module) continue;

        // Para usuários sem tenant, verificar módulos core
        if (!req.user.tenantId) {
          if (module.isCore) {
            hasAnyModule = true;
            activeModule = module;
            break;
          }
          continue;
        }

        // Verificar se o módulo está ativo para o tenant
        const tenantModule = await moduleService.getTenantModule(req.user.tenantId, moduleId);
        if (tenantModule && tenantModule.isEnabled && tenantModule.isActive) {
          // Verificar permissões
          if (action) {
            const hasPermission = await checkModulePermission(req.user.role, module, action);
            if (hasPermission) {
              hasAnyModule = true;
              activeModule = { module, tenantModule };
              break;
            }
          } else {
            hasAnyModule = true;
            activeModule = { module, tenantModule };
            break;
          }
        }
      }

      if (!hasAnyModule) {
        return res.status(403).json({
          success: false,
          message: 'Nenhum dos módulos necessários está ativo',
          requiredModules: moduleIds,
          code: 'NO_REQUIRED_MODULES'
        });
      }

      // Adicionar informações do módulo ativo ao request
      if (activeModule && typeof activeModule === 'object' && 'module' in activeModule) {
        req.module = {
          id: activeModule.module.id,
          name: activeModule.module.name,
          config: activeModule.tenantModule.config,
          usage: activeModule.tenantModule.usage
        };
      }

      next();
    } catch (error: any) {
      console.error('Multiple module auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };
};

/**
 * Middleware para verificar se todos os módulos estão ativos
 */
export const requireAllModules = (moduleIds: string[], action?: 'read' | 'write' | 'admin') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
      }

      // Super admin sempre tem acesso
      if (req.user.role === 'super_admin') {
        return next();
      }

      const missingModules: string[] = [];

      for (const moduleId of moduleIds) {
        const module = await moduleService.getModuleById(moduleId);
        if (!module) {
          missingModules.push(moduleId);
          continue;
        }

        // Para usuários sem tenant, verificar módulos core
        if (!req.user.tenantId) {
          if (!module.isCore) {
            missingModules.push(moduleId);
          }
          continue;
        }

        // Verificar se o módulo está ativo para o tenant
        const tenantModule = await moduleService.getTenantModule(req.user.tenantId, moduleId);
        if (!tenantModule || !tenantModule.isEnabled || !tenantModule.isActive) {
          missingModules.push(moduleId);
          continue;
        }

        // Verificar permissões
        if (action) {
          const hasPermission = await checkModulePermission(req.user.role, module, action);
          if (!hasPermission) {
            missingModules.push(moduleId);
          }
        }
      }

      if (missingModules.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Módulos necessários não estão ativos ou sem permissão',
          missingModules,
          code: 'MISSING_REQUIRED_MODULES'
        });
      }

      next();
    } catch (error: any) {
      console.error('All modules auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  };
};

/**
 * Verificar permissões do usuário para um módulo específico
 */
async function checkModulePermission(userRole: string, module: any, action: string): Promise<boolean> {
  // Verificar se a role é permitida para o módulo
  if (!module.requiredRoles.includes(userRole)) {
    // Verificar hierarquia de roles
    const roleHierarchy = ['tenant_operator', 'tenant_manager', 'tenant_admin', 'super_admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const minRequiredIndex = Math.min(...module.requiredRoles.map((role: string) => roleHierarchy.indexOf(role)));
    
    if (userRoleIndex < minRequiredIndex) {
      return false;
    }
  }

  // Verificar permissões específicas do módulo
  const requiredPermission = module.permissions.find((perm: any) => perm.scope === action);
  if (requiredPermission) {
    // Aqui poderia implementar verificação mais granular de permissões
    // Por enquanto, se chegou até aqui, tem permissão
    return true;
  }

  return true;
}

/**
 * Verificar limites do módulo
 */
async function checkModuleLimits(tenantModule: any, req: AuthRequest): Promise<{ allowed: boolean; message?: string }> {
  const config = tenantModule.config;
  const usage = tenantModule.usage;

  // Verificar limite de requests
  if (config.maxRequests && config.maxRequests > 0) {
    if (usage.requests >= config.maxRequests) {
      return {
        allowed: false,
        message: 'Limite de requests do módulo excedido'
      };
    }
  }

  // Verificar limite de usuários
  if (config.maxUsers && config.maxUsers > 0) {
    if (usage.users >= config.maxUsers) {
      return {
        allowed: false,
        message: 'Limite de usuários do módulo excedido'
      };
    }
  }

  // Verificar limite de instâncias
  if (config.maxInstances && config.maxInstances > 0) {
    if (usage.instances >= config.maxInstances) {
      return {
        allowed: false,
        message: 'Limite de instâncias do módulo excedido'
      };
    }
  }

  // Verificar limites customizados
  if (config.customLimits) {
    for (const [limitKey, limitValue] of Object.entries(config.customLimits)) {
      if (typeof limitValue === 'number' && limitValue > 0) {
        // Aqui você implementaria verificações específicas baseadas no tipo de limite
        // Por exemplo, maxWorkflows, maxContacts, etc.
      }
    }
  }

  return { allowed: true };
}

// Estender o tipo AuthRequest para incluir informações do módulo
declare global {
  namespace Express {
    interface Request {
      module?: {
        id: string;
        name: string;
        config: any;
        usage: any;
      };
    }
  }
}