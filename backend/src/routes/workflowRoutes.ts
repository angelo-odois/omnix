import { Router, Request, Response } from 'express';
import { workflowService } from '../services/workflowService';
import { authenticate, authorize, AuthRequest, requireTenantAdmin } from '../middlewares/authV2';
import { UserRole } from '../services/authServiceV2';

const router = Router();

// ============= WORKFLOW MANAGEMENT =============

// Listar workflows do tenant
router.get('/workflows', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const workflows = workflowService.getTenantWorkflows(tenantId);

    return res.json({
      success: true,
      workflows
    });
  } catch (error: any) {
    console.error('List workflows error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar workflows'
    });
  }
});

// Obter workflow específico
router.get('/workflows/:workflowId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = workflowService.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow não encontrado'
      });
    }

    // Verificar se pertence ao tenant do usuário
    if (workflow.tenantId !== req.user!.tenantId && req.user!.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    return res.json({
      success: true,
      workflow
    });
  } catch (error: any) {
    console.error('Get workflow error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter workflow'
    });
  }
});

// Criar novo workflow
router.post('/workflows', 
  authenticate, 
  authorize(UserRole.TENANT_ADMIN, UserRole.TENANT_MANAGER),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, nodes } = req.body;
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Nome do workflow é obrigatório'
        });
      }

      const result = await workflowService.createWorkflow({
        name,
        description,
        tenantId: tenantId!,
        createdBy,
        nodes
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Create workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar workflow'
      });
    }
  }
);

// Atualizar workflow
router.put('/workflows/:workflowId',
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.TENANT_MANAGER),
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId } = req.params;
      const updateData = req.body;

      // Verificar se o workflow existe e pertence ao tenant
      const existingWorkflow = workflowService.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow não encontrado'
        });
      }

      if (existingWorkflow.tenantId !== req.user!.tenantId && req.user!.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const result = await workflowService.updateWorkflow(workflowId, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Update workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar workflow'
      });
    }
  }
);

// Deletar workflow
router.delete('/workflows/:workflowId',
  authenticate,
  requireTenantAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId } = req.params;

      // Verificar se o workflow existe e pertence ao tenant
      const existingWorkflow = workflowService.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow não encontrado'
        });
      }

      if (existingWorkflow.tenantId !== req.user!.tenantId && req.user!.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const result = await workflowService.deleteWorkflow(workflowId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Delete workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao deletar workflow'
      });
    }
  }
);

// ============= WORKFLOW EXECUTION =============

// Executar workflow manualmente
router.post('/workflows/:workflowId/execute',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId } = req.params;
      const { contactId, conversationId, triggerData } = req.body;

      if (!contactId || !conversationId) {
        return res.status(400).json({
          success: false,
          message: 'contactId e conversationId são obrigatórios'
        });
      }

      // Verificar se o workflow existe e pertence ao tenant
      const workflow = workflowService.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow não encontrado'
        });
      }

      if (workflow.tenantId !== req.user!.tenantId && req.user!.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const result = await workflowService.executeWorkflow(
        workflowId,
        contactId,
        conversationId,
        triggerData
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Execute workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao executar workflow'
      });
    }
  }
);

// Ativar/Desativar workflow
router.patch('/workflows/:workflowId/toggle',
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.TENANT_MANAGER),
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive deve ser um valor booleano'
        });
      }

      const result = await workflowService.updateWorkflow(workflowId, { isActive });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('Toggle workflow error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao ativar/desativar workflow'
      });
    }
  }
);

// ============= WORKFLOW TEMPLATES =============

// Listar templates públicos
router.get('/workflow-templates', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    
    let templates;
    if (category) {
      templates = workflowService.getTemplatesByCategory(category as any);
    } else {
      templates = workflowService.getTemplates();
    }

    return res.json({
      success: true,
      templates
    });
  } catch (error: any) {
    console.error('List templates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar templates'
    });
  }
});

// Criar workflow a partir de template
router.post('/workflow-templates/:templateId/create',
  authenticate,
  authorize(UserRole.TENANT_ADMIN, UserRole.TENANT_MANAGER),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params;
      const { name } = req.body;
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.id;

      const result = await workflowService.createWorkflowFromTemplate(
        templateId,
        tenantId!,
        createdBy,
        name
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Create from template error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar workflow do template'
      });
    }
  }
);

// ============= WORKFLOW STATISTICS =============

// Obter estatísticas do workflow
router.get('/workflows/:workflowId/stats',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { workflowId } = req.params;

      // Verificar se o workflow existe e pertence ao tenant
      const workflow = workflowService.getWorkflow(workflowId);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Workflow não encontrado'
        });
      }

      if (workflow.tenantId !== req.user!.tenantId && req.user!.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const stats = workflowService.getWorkflowStats(workflowId);

      return res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      console.error('Get workflow stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas'
      });
    }
  }
);

export default router;