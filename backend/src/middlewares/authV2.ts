// Middleware de autenticação e autorização v2
import { Request, Response, NextFunction } from 'express';
import authServiceV2, { AuthUser } from '../services/authServiceV2';
import prisma from '../lib/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string | null;
  };
  tenant?: any;
}

// Middleware de autenticação básica
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
    }

    const user = await authServiceV2.verifyToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
      });
    }

    // Adicionar user ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Se tem tenant, adicionar também
    if (user.tenantId && user.tenant) {
      req.tenant = user.tenant;
      
      // Verificar se tenant está ativo
      if (!user.tenant.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Tenant inativo ou suspenso',
        });
      }
    }

    next();
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Erro de autenticação',
    });
  }
};

// Middleware para verificar roles específicos
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar este recurso',
      });
    }

    next();
  };
};

// Middleware para verificar permissões específicas
export const checkPermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Simple role-based check for now
    const allowedRoles = ['super_admin', 'tenant_admin', 'tenant_manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Sem permissão para ${action} em ${resource}`,
      });
    }

    next();
  };
};

// Middleware para verificar se é admin do tenant ou super admin
export const requireTenantAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado',
    });
  }

  if (req.user.role !== 'tenant_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas administradores podem acessar este recurso',
    });
  }

  next();
};

// Middleware para verificar se é super admin
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado',
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Apenas super administradores podem acessar este recurso',
    });
  }

  next();
};

// Middleware para verificar isolamento de tenant
export const requireSameTenant = (paramName: string = 'tenantId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Super admin pode acessar qualquer tenant
    if (req.user.role === 'super_admin') {
      return next();
    }

    const requestedTenantId = req.params[paramName] || req.body.tenantId || req.query.tenantId;
    
    if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a recursos de outro tenant',
      });
    }

    next();
  };
};

// Middleware para verificar limites do plano
export const checkPlanLimit = (limitType: 'users' | 'instances' | 'messages' | 'contacts') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenant) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Super admin não tem limites
    if (req.user.role === 'super_admin') {
      return next();
    }

    const limit = req.tenant.limits[`max${limitType.charAt(0).toUpperCase() + limitType.slice(1)}`];
    
    // Verificar uso atual baseado no tipo
    let currentUsage = 0;
    switch (limitType) {
      case 'users':
        const userCount = await prisma.user.count({
          where: { tenantId: req.user.tenantId! }
        });
        currentUsage = userCount;
        break;
      case 'instances':
        // TODO: Buscar contagem real de instâncias
        currentUsage = 0;
        break;
      case 'messages':
        // TODO: Buscar contagem real de mensagens do mês
        currentUsage = 0;
        break;
      case 'contacts':
        // TODO: Buscar contagem real de contatos
        currentUsage = 0;
        break;
    }

    if (currentUsage >= limit) {
      return res.status(403).json({
        success: false,
        message: `Limite do plano atingido: máximo de ${limit} ${limitType}`,
      });
    }

    next();
  };
};

// Middleware para verificar features do plano
export const requireFeature = (feature: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.tenant) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    // Super admin tem acesso a todas as features
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Simple feature check - assume all features are available for now
    // TODO: Implement proper feature checking based on package
    if (false) {
      return res.status(403).json({
        success: false,
        message: `Esta funcionalidade (${feature}) não está disponível no seu plano`,
      });
    }

    next();
  };
};

// Alias para compatibilidade
export const authMiddleware = authenticate;