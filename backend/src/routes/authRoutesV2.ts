// Rotas de autenticação v2 com suporte multi-tenant
import { Router, Request, Response } from 'express';
import { authServiceV2, UserRole } from '../services/authServiceV2';
import { 
  authenticate, 
  authorize, 
  requireTenantAdmin,
  requireSuperAdmin,
  requireSameTenant,
  checkPlanLimit,
  checkPermission,
  AuthRequest 
} from '../middlewares/authV2';

const router = Router();

// ============= AUTENTICAÇÃO =============

// Login com email e senha
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    }

    const result = await authServiceV2.loginWithPassword(email, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      tenant: result.tenant,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
    });
  }
});

// Enviar magic link/OTP
router.post('/auth/magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório',
      });
    }

    const result = await authServiceV2.sendMagicLink(email);
    return res.json(result);
  } catch (error: any) {
    console.error('Magic link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar código',
    });
  }
});

// Verificar OTP
router.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email e código são obrigatórios',
      });
    }

    const result = await authServiceV2.verifyOTP(email, otp);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      tenant: result.tenant,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar código',
    });
  }
});

// Obter sessão atual
router.get('/auth/session', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = authServiceV2.getUser(req.user!.id);
    const tenant = req.user!.tenantId ? authServiceV2.getTenant(req.user!.tenantId) : null;

    return res.json({
      success: true,
      user,
      tenant,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter sessão',
    });
  }
});

// Logout
router.post('/auth/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Invalidar token/sessão
    return res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao fazer logout',
    });
  }
});

// ============= GERENCIAMENTO DE USUÁRIOS =============

// Listar usuários do tenant
router.get('/users', authenticate, checkPermission('users', 'view'), async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId && req.user!.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado',
      });
    }

    const users = tenantId 
      ? authServiceV2.getTenantUsers(tenantId)
      : authServiceV2.getAllUsers();

    return res.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('List users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
    });
  }
});

// Criar usuário
router.post('/users', 
  authenticate, 
  checkPermission('users', 'create'),
  checkPlanLimit('users'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, name, password, role } = req.body;
      const tenantId = req.user!.tenantId;

      if (!email || !name || !password || !role) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios',
        });
      }

      // Validar role
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role inválido',
        });
      }

      // Não permitir criar super admin
      if (role === UserRole.SUPER_ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para criar super admin',
        });
      }

      // Não permitir operador criar admin
      if (req.user!.role === UserRole.TENANT_OPERATOR) {
        return res.status(403).json({
          success: false,
          message: 'Operadores não podem criar usuários',
        });
      }

      const result = await authServiceV2.createUser({
        email,
        name,
        password,
        role,
        tenantId,
        invitedBy: req.user!.id,
      });

      return res.json(result);
    } catch (error: any) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário',
      });
    }
  }
);

// Convidar usuário
router.post('/users/invite',
  authenticate,
  checkPermission('users', 'invite'),
  checkPlanLimit('users'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, role } = req.body;
      const tenantId = req.user!.tenantId;

      if (!email || !role) {
        return res.status(400).json({
          success: false,
          message: 'Email e role são obrigatórios',
        });
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant não encontrado',
        });
      }

      const invitedBy = authServiceV2.getUser(req.user!.id);
      if (!invitedBy) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const result = await authServiceV2.inviteUser(tenantId, email, role, invitedBy);
      return res.json(result);
    } catch (error: any) {
      console.error('Invite user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao convidar usuário',
      });
    }
  }
);

// Aceitar convite
router.post('/users/accept-invite', async (req: Request, res: Response) => {
  try {
    const { token, name, password } = req.body;

    if (!token || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios',
      });
    }

    const result = await authServiceV2.acceptInvitation(token, name, password);
    return res.json(result);
  } catch (error: any) {
    console.error('Accept invite error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao aceitar convite',
    });
  }
});

// ============= GERENCIAMENTO DE TENANTS (Super Admin) =============

// Listar todos os tenants
router.get('/tenants', authenticate, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tenants = authServiceV2.getAllTenants();
    return res.json({
      success: true,
      tenants,
    });
  } catch (error: any) {
    console.error('List tenants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar tenants',
    });
  }
});

// Criar novo tenant
router.post('/tenants', authenticate, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, plan, adminEmail, adminName, adminPassword } = req.body;

    if (!name || !email || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios',
      });
    }

    const result = await authServiceV2.createTenant({
      name,
      email,
      plan,
      adminEmail,
      adminName,
      adminPassword,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Create tenant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar tenant',
    });
  }
});

// Obter detalhes do tenant
router.get('/tenants/:tenantId', 
  authenticate, 
  requireSameTenant('tenantId'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId } = req.params;
      const tenant = authServiceV2.getTenant(tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant não encontrado',
        });
      }

      const users = authServiceV2.getTenantUsers(tenantId);

      return res.json({
        success: true,
        tenant,
        users,
      });
    } catch (error: any) {
      console.error('Get tenant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter tenant',
      });
    }
  }
);

// ============= INFORMAÇÕES DO SISTEMA =============

// Obter informações de roles e permissões
router.get('/auth/roles', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const roles = Object.values(UserRole);
    const currentUserRole = req.user!.role;
    
    // Filtrar roles baseado no usuário atual
    let availableRoles = roles;
    if (currentUserRole === UserRole.TENANT_ADMIN) {
      availableRoles = roles.filter(r => r !== UserRole.SUPER_ADMIN);
    } else if (currentUserRole === UserRole.TENANT_MANAGER) {
      availableRoles = [UserRole.TENANT_MANAGER, UserRole.TENANT_OPERATOR];
    } else if (currentUserRole === UserRole.TENANT_OPERATOR) {
      availableRoles = [UserRole.TENANT_OPERATOR];
    }

    return res.json({
      success: true,
      roles: availableRoles,
      currentRole: currentUserRole,
    });
  } catch (error: any) {
    console.error('Get roles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter roles',
    });
  }
});

// Obter planos disponíveis
router.get('/auth/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'trial',
        name: 'Trial',
        price: 0,
        limits: { maxUsers: 2, maxInstances: 1, maxMessagesPerMonth: 500, maxContacts: 100 },
        features: {
          multipleInstances: false,
          apiAccess: false,
          webhooks: false,
          customBranding: false,
          analytics: false,
          automations: false,
        },
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 97,
        limits: { maxUsers: 5, maxInstances: 2, maxMessagesPerMonth: 5000, maxContacts: 500 },
        features: {
          multipleInstances: true,
          apiAccess: false,
          webhooks: true,
          customBranding: false,
          analytics: true,
          automations: false,
        },
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 197,
        limits: { maxUsers: 10, maxInstances: 5, maxMessagesPerMonth: 10000, maxContacts: 1000 },
        features: {
          multipleInstances: true,
          apiAccess: true,
          webhooks: true,
          customBranding: false,
          analytics: true,
          automations: true,
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        limits: { maxUsers: 100, maxInstances: 50, maxMessagesPerMonth: 100000, maxContacts: 10000 },
        features: {
          multipleInstances: true,
          apiAccess: true,
          webhooks: true,
          customBranding: true,
          analytics: true,
          automations: true,
        },
      },
    ];

    return res.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    console.error('Get plans error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter planos',
    });
  }
});

export default router;