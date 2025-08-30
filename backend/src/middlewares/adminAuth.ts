import { Response, NextFunction } from 'express';
import { AuthRequest } from './authV2';
import { adminService } from '../services/adminService';

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
      message: 'Acesso restrito a Super Admins',
    });
  }

  next();
};

// Middleware para verificar permissões específicas do admin
export const requireAdminPermission = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    const hasPermission = adminService.hasPermission(req.user.role, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Sem permissão para ${action} ${resource}`,
      });
    }

    next();
  };
};

// Middleware para verificar se tem acesso ao painel admin
export const requireAdminAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Não autenticado',
    });
  }

  // Apenas super_admin tem acesso ao painel admin
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito ao painel administrativo',
    });
  }

  next();
};