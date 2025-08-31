import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authV2';
import { requireSuperAdmin, requireAdminAccess } from '../middlewares/adminAuth';
import { adminService } from '../services/adminService';
import { moduleService } from '../services/moduleService';
import authServiceV2 from '../services/authServiceV2';

const router = Router();

// Aplicar autenticação e verificação de super admin para todas as rotas
router.use(authenticate);
router.use(requireSuperAdmin);

// ============= DASHBOARD & STATS =============

router.get('/dashboard/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await adminService.getAdminStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

// ============= PACKAGE MANAGEMENT =============

// Listar todos os pacotes
router.get('/packages', async (req: AuthRequest, res: Response) => {
  try {
    const packages = await adminService.getAllPackages();
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pacotes'
    });
  }
});

// Criar novo pacote
router.post('/packages', async (req: AuthRequest, res: Response) => {
  try {
    const packageData = req.body;
    
    // Validações básicas
    if (!packageData.name || !packageData.price || !packageData.limits) {
      return res.status(400).json({
        success: false,
        message: 'Nome, preço e limites são obrigatórios'
      });
    }

    const newPackage = await adminService.createPackage(packageData, req.user!.id);
    
    res.status(201).json({
      success: true,
      data: newPackage,
      message: 'Pacote criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar pacote'
    });
  }
});

// Buscar pacote específico
router.get('/packages/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const packageData = await adminService.getPackageById(id);
    
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Pacote não encontrado'
      });
    }

    res.json({
      success: true,
      data: packageData
    });
  } catch (error: any) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pacote'
    });
  }
});

// Atualizar pacote
router.put('/packages/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedPackage = await adminService.updatePackage(id, updates);
    
    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        message: 'Pacote não encontrado'
      });
    }

    res.json({
      success: true,
      data: updatedPackage,
      message: 'Pacote atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pacote'
    });
  }
});

// Deletar pacote
router.delete('/packages/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar se há tenants usando este pacote
    const tenants = await adminService.getAllTenants();
    const tenantsUsingPackage = tenants.filter(t => t.packageId === id);
    
    if (tenantsUsingPackage.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível deletar este pacote. ${tenantsUsingPackage.length} tenant(s) estão usando-o.`
      });
    }

    const deleted = await adminService.deletePackage(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Pacote não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pacote deletado com sucesso'
    });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar pacote'
    });
  }
});

// ============= TENANT MANAGEMENT =============

// Listar todos os tenants
router.get('/tenants', async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await adminService.getAllTenants();
    
    // Enriquecer com dados do pacote
    const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
      const packageData = await adminService.getPackageById(tenant.packageId);
      return {
        ...tenant,
        package: packageData
      };
    }));
    
    res.json({
      success: true,
      data: enrichedTenants
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tenants'
    });
  }
});

// Criar novo tenant
router.post('/tenants', async (req: AuthRequest, res: Response) => {
  try {
    const tenantData = req.body;
    
    // Validações
    if (!tenantData.name || !tenantData.email || !tenantData.packageId || 
        !tenantData.adminName || !tenantData.adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    // Verificar se o pacote existe
    const packageExists = await adminService.getPackageById(tenantData.packageId);
    if (!packageExists) {
      return res.status(400).json({
        success: false,
        message: 'Pacote selecionado não existe'
      });
    }

    // Criar tenant no adminService
    const newTenant = await adminService.createTenant(tenantData, req.user!.id);
    
    // Criar tenant no authServiceV2 também
    const tenantResult = await authServiceV2.createTenant({
      name: tenantData.name,
      email: tenantData.email,
      adminEmail: tenantData.adminEmail,
      adminName: tenantData.adminName,
      adminPassword: tenantData.adminPassword || 'temp123456', // Temporary password
    });

    if (!tenantResult.success) {
      return res.status(400).json({
        success: false,
        message: tenantResult.message || 'Erro ao criar tenant'
      });
    }
    
    res.status(201).json({
      success: true,
      data: newTenant,
      message: 'Tenant criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar tenant'
    });
  }
});

// Buscar tenant específico
router.get('/tenants/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await adminService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    // Enriquecer com dados do pacote
    const packageData = await adminService.getPackageById(tenant.packageId);
    const enrichedTenant = {
      ...tenant,
      package: packageData
    };

    res.json({
      success: true,
      data: enrichedTenant
    });
  } catch (error: any) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar tenant'
    });
  }
});

// Atualizar tenant
router.put('/tenants/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedTenant = await adminService.updateTenant(id, updates);
    
    if (!updatedTenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    res.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tenant'
    });
  }
});

// Suspender tenant
router.post('/tenants/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const suspended = await adminService.suspendTenant(id);
    
    if (!suspended) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Tenant suspenso com sucesso'
    });
  } catch (error: any) {
    console.error('Error suspending tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao suspender tenant'
    });
  }
});

// Ativar tenant
router.post('/tenants/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const activated = await adminService.activateTenant(id);
    
    if (!activated) {
      return res.status(404).json({
        success: false,
        message: 'Tenant não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Tenant ativado com sucesso'
    });
  } catch (error: any) {
    console.error('Error activating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ativar tenant'
    });
  }
});

// Alterar plano do tenant
router.post('/tenants/:id/change-plan', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { packageId } = req.body;
    
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'packageId é obrigatório'
      });
    }
    
    const result = await adminService.changeTenantPlan(id, packageId, req.user!.id);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: {
        tenant: result.tenant,
        modulesChanged: result.modulesChanged
      },
      message: 'Plano alterado com sucesso'
    });
  } catch (error: any) {
    console.error('Error changing tenant plan:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar plano do tenant'
    });
  }
});

// ============= USER MANAGEMENT =============

// Listar todos os usuários do sistema
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = authServiceV2.getAllUsers();
    const tenants = authServiceV2.getAllTenants();
    
    // Enriquecer usuários com dados do tenant
    const enrichedUsers = users.map(user => {
      const tenant = user.tenantId ? tenants.find(t => t.id === user.tenantId) : null;
      return {
        ...user,
        tenant: tenant ? { id: tenant.id, name: tenant.name } : null
      };
    });
    
    res.json({
      success: true,
      data: enrichedUsers
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários'
    });
  }
});

// ============= PERMISSIONS & ROLES =============

// Listar permissões
router.get('/permissions', async (req: AuthRequest, res: Response) => {
  try {
    const permissions = adminService.getAllPermissions();
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar permissões'
    });
  }
});

// Listar roles
router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const roles = adminService.getAllRoles();
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar roles'
    });
  }
});

// ============= MODULE MANAGEMENT =============

// Listar todos os módulos do sistema
router.get('/modules', async (req: AuthRequest, res: Response) => {
  try {
    const modules = await moduleService.getAllModules();
    
    res.json({
      success: true,
      data: modules
    });
  } catch (error: any) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos'
    });
  }
});

// Estatísticas de módulos (deve vir antes de /modules/:id)
router.get('/modules/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await moduleService.getModuleStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching module stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas de módulos'
    });
  }
});

// Listar módulos por categoria
router.get('/modules/category/:category', async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.params;
    const modules = await moduleService.getModulesByCategory(category);
    
    res.json({
      success: true,
      data: modules
    });
  } catch (error: any) {
    console.error('Error fetching modules by category:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos por categoria'
    });
  }
});

// Buscar módulo específico (deve vir por último)
router.get('/modules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const module = await moduleService.getModuleById(id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Módulo não encontrado'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error: any) {
    console.error('Error fetching module:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulo'
    });
  }
});

// ============= TENANT MODULE MANAGEMENT =============

// Listar módulos de um tenant
router.get('/tenants/:tenantId/modules', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tenantModules = await moduleService.getTenantModules(tenantId);
    
    res.json({
      success: true,
      data: tenantModules
    });
  } catch (error: any) {
    console.error('Error fetching tenant modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos do tenant'
    });
  }
});

// Ativar módulo para um tenant
router.post('/tenants/:tenantId/modules/:moduleId/enable', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    const { config } = req.body;
    
    const tenantModule = await moduleService.enableModuleForTenant(
      tenantId, 
      moduleId, 
      config, 
      req.user!.id
    );
    
    res.json({
      success: true,
      data: tenantModule,
      message: 'Módulo ativado com sucesso'
    });
  } catch (error: any) {
    console.error('Error enabling module for tenant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao ativar módulo'
    });
  }
});

// Desativar módulo para um tenant
router.post('/tenants/:tenantId/modules/:moduleId/disable', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    
    const success = await moduleService.disableModuleForTenant(
      tenantId, 
      moduleId, 
      req.user!.id
    );
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Módulo ou configuração não encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Módulo desativado com sucesso'
    });
  } catch (error: any) {
    console.error('Error disabling module for tenant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao desativar módulo'
    });
  }
});

// Validar dependências de módulo
router.get('/tenants/:tenantId/modules/:moduleId/validate', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    
    const validation = await moduleService.validateModuleDependencies(moduleId, tenantId);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    console.error('Error validating module dependencies:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar dependências do módulo'
    });
  }
});

// ============= MODULE ACTIVATION SYSTEM =============

// Setup de módulos baseado no pacote do tenant
router.post('/tenants/:tenantId/modules/setup-from-package', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { packageId } = req.body;
    
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'packageId é obrigatório'
      });
    }
    
    await moduleService.setupTenantModulesFromPackage(tenantId, packageId, req.user!.id);
    
    res.json({
      success: true,
      message: 'Módulos do pacote configurados com sucesso'
    });
  } catch (error: any) {
    console.error('Error setting up tenant modules from package:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao configurar módulos do pacote'
    });
  }
});

// Buscar módulos disponíveis para o tenant
router.get('/tenants/:tenantId/modules/available', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    const availableModules = await moduleService.getAvailableModulesForTenant(tenantId);
    
    res.json({
      success: true,
      data: availableModules
    });
  } catch (error: any) {
    console.error('Error fetching available modules for tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos disponíveis'
    });
  }
});

// Ativação em massa de módulos
router.post('/tenants/:tenantId/modules/bulk-enable', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { moduleIds } = req.body;
    
    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'moduleIds deve ser um array não vazio'
      });
    }
    
    const results = await moduleService.bulkEnableModules(tenantId, moduleIds, req.user!.id);
    
    res.json({
      success: true,
      data: results,
      message: `${results.success.length} módulos ativados, ${results.failed.length} falharam`
    });
  } catch (error: any) {
    console.error('Error bulk enabling modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao ativar módulos em massa'
    });
  }
});

// Desativação em massa de módulos  
router.post('/tenants/:tenantId/modules/bulk-disable', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { moduleIds } = req.body;
    
    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'moduleIds deve ser um array não vazio'
      });
    }
    
    const results = await moduleService.bulkDisableModules(tenantId, moduleIds, req.user!.id);
    
    res.json({
      success: true,
      data: results,
      message: `${results.success.length} módulos desativados, ${results.failed.length} falharam`
    });
  } catch (error: any) {
    console.error('Error bulk disabling modules:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar módulos em massa'
    });
  }
});

// Buscar módulos com status do tenant
router.get('/tenants/:tenantId/modules/with-status', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    const modulesWithStatus = await moduleService.getModulesWithTenantStatus(tenantId);
    
    res.json({
      success: true,
      data: modulesWithStatus
    });
  } catch (error: any) {
    console.error('Error fetching modules with tenant status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar módulos com status'
    });
  }
});

// ============= MODULE USAGE TRACKING =============

// Rastrear uso de módulo
router.post('/tenants/:tenantId/modules/:moduleId/track-usage', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    const { usageType, amount = 1 } = req.body;
    
    if (!['request', 'instance', 'user'].includes(usageType)) {
      return res.status(400).json({
        success: false,
        message: 'usageType deve ser request, instance ou user'
      });
    }
    
    await moduleService.trackModuleUsage(tenantId, moduleId, usageType, amount);
    
    res.json({
      success: true,
      message: 'Uso rastreado com sucesso'
    });
  } catch (error: any) {
    console.error('Error tracking module usage:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rastrear uso do módulo'
    });
  }
});

// Reset de uso de módulo
router.post('/tenants/:tenantId/modules/:moduleId/reset-usage', async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId, moduleId } = req.params;
    const { usageType } = req.body;
    
    if (usageType && !['request', 'instance', 'user'].includes(usageType)) {
      return res.status(400).json({
        success: false,
        message: 'usageType deve ser request, instance, user ou undefined para resetar tudo'
      });
    }
    
    await moduleService.resetModuleUsage(tenantId, moduleId, usageType);
    
    res.json({
      success: true,
      message: 'Uso resetado com sucesso'
    });
  } catch (error: any) {
    console.error('Error resetting module usage:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar uso do módulo'
    });
  }
});

export default router;