import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authV2';
import { moduleService } from '../services/moduleService';
import { adminService } from '../services/adminService';

const router = Router();

// Aplicar autenticação a todas as rotas
router.use(authenticate);

// ============= TENANT SELF-SERVICE MODULE MANAGEMENT =============

// Buscar módulos disponíveis para o tenant atual
router.get('/my-modules', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const modulesWithStatus = await moduleService.getModulesWithTenantStatus(req.user.tenantId);
    
    res.json({
      success: true,
      data: modulesWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching tenant modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos'
    });
  }
});

// Buscar apenas módulos ativos do tenant
router.get('/my-modules/active', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    console.log(`Loading modules for tenant: ${req.user.tenantId} (${req.user.email})`);
    
    const tenantModules = await moduleService.getTenantModules(req.user.tenantId);
    console.log('Found tenant modules:', tenantModules.length);
    
    const activeModules = tenantModules.filter(tm => tm.isEnabled && tm.isActive);
    console.log('Active modules:', activeModules.map(tm => tm.moduleId));
    
    res.json({
      success: true,
      data: activeModules
    });
  } catch (error: any) {
    console.error('Error fetching active tenant modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos ativos'
    });
  }
});

// Solicitar ativação de módulo (apenas tenant_admin pode ativar)
router.post('/my-modules/:moduleId/request-activation', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    // Verificar se é tenant_admin
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem ativar módulos'
      });
    }

    const { moduleId } = req.params;
    const { config } = req.body;

    // Verificar se o módulo existe
    const module = await moduleService.getModuleById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Módulo não encontrado'
      });
    }

    // Verificar se o tenant tem direito a esse módulo baseado no plano
    const tenant = await adminService.getTenantById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    const packageInfo = await adminService.getPackageById(tenant.packageId);
    if (!packageInfo) {
      return res.status(404).json({
        success: false,
        message: 'Pacote do tenant não encontrado'
      });
    }

    // Verificar se o módulo está incluído no pacote
    const packageModule = packageInfo.modules.find(m => m.moduleId === moduleId);
    if (!packageModule || !packageModule.included) {
      return res.status(403).json({
        success: false,
        message: `Módulo ${module.displayName} não está incluído no seu plano ${packageInfo.name}`,
        upgrade: {
          module: moduleId,
          moduleName: module.displayName,
          currentPlan: packageInfo.name,
          availableIn: ['Professional', 'Enterprise'] // Placeholder
        }
      });
    }

    // Ativar o módulo
    const result = await moduleService.enableModuleForTenant(
      req.user.tenantId,
      moduleId,
      config || packageModule.limits || {},
      req.user.id
    );

    res.json({
      success: true,
      data: result,
      message: `Módulo ${module.displayName} ativado com sucesso`
    });

  } catch (error: any) {
    console.error('Error requesting module activation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao ativar módulo'
    });
  }
});

// Desativar módulo (apenas tenant_admin)
router.post('/my-modules/:moduleId/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    // Verificar se é tenant_admin
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem desativar módulos'
      });
    }

    const { moduleId } = req.params;

    // Verificar se o módulo não é core
    const module = await moduleService.getModuleById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Módulo não encontrado'
      });
    }

    if (module.isCore) {
      return res.status(400).json({
        success: false,
        message: 'Módulos core não podem ser desativados'
      });
    }

    const success = await moduleService.disableModuleForTenant(
      req.user.tenantId,
      moduleId,
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Módulo não encontrado ou já inativo'
      });
    }

    res.json({
      success: true,
      message: `Módulo ${module.displayName} desativado com sucesso`
    });

  } catch (error: any) {
    console.error('Error deactivating module:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao desativar módulo'
    });
  }
});

// Buscar informações do plano atual e módulos disponíveis
router.get('/my-plan', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const tenant = await adminService.getTenantById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    const packageInfo = await adminService.getPackageById(tenant.packageId);
    const tenantModules = await moduleService.getTenantModules(req.user.tenantId);

    res.json({
      success: true,
      data: {
        tenant,
        package: packageInfo,
        activeModules: tenantModules.filter(tm => tm.isEnabled && tm.isActive),
        availableModules: packageInfo?.modules.filter(m => m.included) || []
      }
    });

  } catch (error: any) {
    console.error('Error fetching tenant plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar informações do plano'
    });
  }
});

export default router;