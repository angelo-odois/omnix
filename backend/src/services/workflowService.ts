import { v4 as uuidv4 } from 'uuid';
import {
  Workflow,
  WorkflowExecution,
  WorkflowTemplate,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowTriggerType,
  WorkflowActionType,
  WorkflowExecutionStatus,
  WorkflowCategory
} from '../types/workflow';

class WorkflowService {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeDemoWorkflows();
  }

  // ============= WORKFLOW MANAGEMENT =============

  async createWorkflow(data: {
    name: string;
    description?: string;
    tenantId: string;
    createdBy: string;
    nodes?: WorkflowNode[];
  }): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    try {
      const workflow: Workflow = {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        tenantId: data.tenantId,
        isActive: false,
        nodes: data.nodes || [],
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0,
        tags: []
      };

      this.workflows.set(workflow.id, workflow);

      return { success: true, workflow };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async updateWorkflow(
    workflowId: string,
    data: Partial<Workflow>
  ): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        return { success: false, message: 'Workflow não encontrado' };
      }

      const updatedWorkflow = {
        ...workflow,
        ...data,
        id: workflowId, // Não permitir alterar o ID
        updatedAt: new Date()
      };

      this.workflows.set(workflowId, updatedWorkflow);

      return { success: true, workflow: updatedWorkflow };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async deleteWorkflow(workflowId: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (!this.workflows.has(workflowId)) {
        return { success: false, message: 'Workflow não encontrado' };
      }

      this.workflows.delete(workflowId);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  getTenantWorkflows(tenantId: string): Workflow[] {
    return Array.from(this.workflows.values()).filter(w => w.tenantId === tenantId);
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // ============= WORKFLOW EXECUTION =============

  async executeWorkflow(
    workflowId: string,
    contactId: string,
    conversationId: string,
    triggerData: any = {}
  ): Promise<{ success: boolean; executionId?: string; message?: string }> {
    try {
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        return { success: false, message: 'Workflow não encontrado' };
      }

      if (!workflow.isActive) {
        return { success: false, message: 'Workflow não está ativo' };
      }

      const execution: WorkflowExecution = {
        id: uuidv4(),
        workflowId,
        contactId,
        conversationId,
        status: WorkflowExecutionStatus.RUNNING,
        startedAt: new Date(),
        executionData: { trigger: triggerData }
      };

      this.executions.set(execution.id, execution);

      // Iniciar execução assíncrona
      this.processWorkflowExecution(execution.id);

      // Incrementar contador de execuções
      workflow.executionCount++;
      workflow.lastExecutedAt = new Date();

      return { success: true, executionId: execution.id };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async processWorkflowExecution(executionId: string) {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    try {
      // Encontrar nó de trigger
      const triggerNode = workflow.nodes.find(n => n.type === WorkflowNodeType.TRIGGER);
      if (!triggerNode) {
        throw new Error('Nenhum nó de trigger encontrado');
      }

      // Processar nós sequencialmente
      await this.processNode(execution, workflow, triggerNode);

      execution.status = WorkflowExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
    } catch (error: any) {
      execution.status = WorkflowExecutionStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
    }
  }

  private async processNode(
    execution: WorkflowExecution,
    workflow: Workflow,
    node: WorkflowNode
  ) {
    execution.currentNodeId = node.id;

    switch (node.type) {
      case WorkflowNodeType.ACTION:
        await this.executeAction(execution, node);
        break;
      case WorkflowNodeType.CONDITION:
        const conditionResult = await this.evaluateCondition(execution, node);
        // Navegar baseado no resultado da condição
        break;
      case WorkflowNodeType.DELAY:
        await this.executeDelay(execution, node);
        break;
    }

    // Processar próximo nó
    if (node.connections && node.connections.length > 0) {
      const nextNodeId = node.connections[0];
      const nextNode = workflow.nodes.find(n => n.id === nextNodeId);
      if (nextNode) {
        await this.processNode(execution, workflow, nextNode);
      }
    }
  }

  private async executeAction(execution: WorkflowExecution, node: WorkflowNode) {
    if (!node.data.action) return;

    const action = node.data.action;

    switch (action.type) {
      case WorkflowActionType.SEND_MESSAGE:
        // Implementar envio de mensagem via WAHA
        console.log(`Enviando mensagem: ${action.config.message}`);
        break;
      case WorkflowActionType.ADD_TAG:
        // Implementar adição de tag
        console.log(`Adicionando tag: ${action.config.tag}`);
        break;
      case WorkflowActionType.WEBHOOK:
        // Implementar chamada de webhook
        console.log(`Chamando webhook: ${action.config.webhookUrl}`);
        break;
    }
  }

  private async evaluateCondition(
    execution: WorkflowExecution,
    node: WorkflowNode
  ): Promise<boolean> {
    if (!node.data.condition) return false;

    // Implementar avaliação de condições
    return true;
  }

  private async executeDelay(execution: WorkflowExecution, node: WorkflowNode) {
    if (node.data.delay) {
      await new Promise(resolve => setTimeout(resolve, node.data.delay! * 1000));
    }
  }

  // ============= WORKFLOW TEMPLATES =============

  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: WorkflowCategory): WorkflowTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  async createWorkflowFromTemplate(
    templateId: string,
    tenantId: string,
    createdBy: string,
    name?: string
  ): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    const template = this.templates.get(templateId);
    if (!template) {
      return { success: false, message: 'Template não encontrado' };
    }

    return this.createWorkflow({
      name: name || `${template.name} (Copy)`,
      description: template.description,
      tenantId,
      createdBy,
      nodes: template.nodes
    });
  }

  // ============= STATISTICS =============

  getWorkflowStats(workflowId: string) {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED).length,
      failedExecutions: executions.filter(e => e.status === WorkflowExecutionStatus.FAILED).length,
      executionsToday: executions.filter(e => e.startedAt >= today).length,
      executionsThisWeek: executions.filter(e => e.startedAt >= thisWeek).length,
      executionsThisMonth: executions.filter(e => e.startedAt >= thisMonth).length,
      averageExecutionTime: this.calculateAverageExecutionTime(executions)
    };
  }

  private calculateAverageExecutionTime(executions: WorkflowExecution[]): number {
    const completedExecutions = executions.filter(e => 
      e.status === WorkflowExecutionStatus.COMPLETED && e.completedAt
    );

    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, exec) => {
      return sum + (exec.completedAt!.getTime() - exec.startedAt.getTime());
    }, 0);

    return Math.round(totalTime / completedExecutions.length / 1000); // em segundos
  }

  // ============= INITIALIZATION =============

  private initializeTemplates() {
    const templates: WorkflowTemplate[] = [
      {
        id: 'welcome-template',
        name: 'Boas-vindas Automático',
        description: 'Envia uma mensagem de boas-vindas para novos contatos',
        category: WorkflowCategory.CUSTOMER_SERVICE,
        isPublic: true,
        nodes: [
          {
            id: 'trigger-1',
            type: WorkflowNodeType.TRIGGER,
            position: { x: 100, y: 100 },
            data: {
              label: 'Nova Mensagem',
              trigger: {
                type: WorkflowTriggerType.MESSAGE_RECEIVED,
                config: { messageType: 'any' }
              }
            },
            connections: ['action-1']
          },
          {
            id: 'action-1',
            type: WorkflowNodeType.ACTION,
            position: { x: 300, y: 100 },
            data: {
              label: 'Enviar Boas-vindas',
              action: {
                type: WorkflowActionType.SEND_MESSAGE,
                config: {
                  message: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?'
                }
              }
            }
          }
        ]
      },
      {
        id: 'keyword-template',
        name: 'Resposta por Palavra-chave',
        description: 'Responde automaticamente baseado em palavras-chave',
        category: WorkflowCategory.AUTOMATION,
        isPublic: true,
        nodes: [
          {
            id: 'trigger-1',
            type: WorkflowNodeType.TRIGGER,
            position: { x: 100, y: 100 },
            data: {
              label: 'Palavra-chave: preço',
              trigger: {
                type: WorkflowTriggerType.KEYWORD,
                config: {
                  keywords: ['preço', 'valor', 'quanto custa'],
                  caseSensitive: false
                }
              }
            },
            connections: ['action-1']
          },
          {
            id: 'action-1',
            type: WorkflowNodeType.ACTION,
            position: { x: 300, y: 100 },
            data: {
              label: 'Enviar Tabela de Preços',
              action: {
                type: WorkflowActionType.SEND_MESSAGE,
                config: {
                  message: 'Aqui estão nossos preços:\n\n📋 Plano Basic: R$ 29,90\n💼 Plano Pro: R$ 59,90\n🚀 Plano Enterprise: R$ 99,90'
                }
              }
            }
          }
        ]
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log('WorkflowService: Templates initialized');
  }

  private initializeDemoWorkflows() {
    // Criar workflow demo para tenant-1
    this.createWorkflow({
      name: 'Atendimento Automático',
      description: 'Workflow de demonstração para atendimento automático',
      tenantId: 'tenant-1',
      createdBy: 'admin-1',
      nodes: [
        {
          id: 'trigger-demo',
          type: WorkflowNodeType.TRIGGER,
          position: { x: 100, y: 100 },
          data: {
            label: 'Nova Mensagem',
            trigger: {
              type: WorkflowTriggerType.MESSAGE_RECEIVED,
              config: { messageType: 'text' }
            }
          },
          connections: ['condition-demo']
        },
        {
          id: 'condition-demo',
          type: WorkflowNodeType.CONDITION,
          position: { x: 300, y: 100 },
          data: {
            label: 'Contém "ajuda"?',
            condition: {
              type: 'text_contains' as any,
              config: { text: 'ajuda', caseSensitive: false }
            }
          },
          connections: ['action-demo']
        },
        {
          id: 'action-demo',
          type: WorkflowNodeType.ACTION,
          position: { x: 500, y: 100 },
          data: {
            label: 'Enviar Menu de Ajuda',
            action: {
              type: WorkflowActionType.SEND_MESSAGE,
              config: {
                message: '🤖 Como posso ajudá-lo?\n\n1️⃣ Falar com vendedor\n2️⃣ Suporte técnico\n3️⃣ Informações da empresa'
              }
            }
          }
        }
      ]
    });

    console.log('WorkflowService: Demo workflows initialized');
  }
}

export const workflowService = new WorkflowService();