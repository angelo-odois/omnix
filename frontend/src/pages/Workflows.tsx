import { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  TrendingUp,
  Workflow as WorkflowIcon,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Edit,
  Bot,
  MessageSquare,
  Star,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '../services/workflowService';
import type { Workflow, WorkflowTemplate, WorkflowCategory } from '../types/workflow';
import Button from '../components/ui/Button';
import { WorkflowEditorProvider } from '../components/workflow/WorkflowEditor';
import CreateWorkflowModal from '../components/workflow/CreateWorkflowModal';
import { whatsappTemplates } from '../components/workflow/templates/WhatsAppTemplates';

export default function Workflows() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'workflows' | 'templates'>('workflows');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Fetch workflows
  const { data: workflows = [], isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowService.getWorkflows,
  });

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => workflowService.getTemplates(),
  });

  // Toggle workflow mutation
  const toggleMutation = useMutation({
    mutationFn: ({ workflowId, isActive }: { workflowId: string; isActive: boolean }) =>
      workflowService.toggleWorkflow(workflowId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Delete workflow mutation
  const deleteMutation = useMutation({
    mutationFn: workflowService.deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Create from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) =>
      workflowService.createFromTemplate(templateId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: workflowService.createWorkflow,
    onSuccess: (result) => {
      if (result.success && result.workflow) {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        setEditingWorkflow(result.workflow);
        setShowEditor(true);
        setShowCreateModal(false);
      }
    },
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, data }: { workflowId: string; data: any }) =>
      workflowService.updateWorkflow(workflowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowEditor(false);
      setEditingWorkflow(null);
    },
  });

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> :
      <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Ativo' : 'Inativo';
  };

  const getCategoryIcon = (category: WorkflowCategory) => {
    switch (category) {
      case 'customer_service':
        return '🎧';
      case 'sales':
        return '💰';
      case 'marketing':
        return '📢';
      case 'automation':
        return '🤖';
      default:
        return '⚙️';
    }
  };

  const getCategoryName = (category: WorkflowCategory) => {
    const names = {
      customer_service: 'Atendimento',
      sales: 'Vendas',
      marketing: 'Marketing',
      automation: 'Automação',
      custom: 'Personalizado'
    };
    return names[category] || 'Personalizado';
  };

  const handleCreateWorkflow = (data: { name: string; description?: string }) => {
    createWorkflowMutation.mutate(data);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const handleSaveWorkflow = (workflowData: any) => {
    if (workflowData.id) {
      // Atualizar workflow existente
      updateWorkflowMutation.mutate({
        workflowId: workflowData.id,
        data: workflowData
      });
    } else {
      // Criar novo workflow
      createWorkflowMutation.mutate(workflowData);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    // Para demo, vamos usar dados fictícios
    try {
      const result = await workflowService.executeWorkflow(
        workflowId,
        'demo-contact-123',
        'demo-conversation-456',
        { source: 'manual' }
      );
      
      if (result.success) {
        alert('Workflow executado com sucesso! ID: ' + result.executionId);
      } else {
        alert('Erro ao executar workflow: ' + result.message);
      }
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  // Se estiver no editor, mostrar apenas o editor
  if (showEditor) {
    return (
      <WorkflowEditorProvider
        initialWorkflow={editingWorkflow || undefined}
        onSave={handleSaveWorkflow}
        onExecute={handleExecuteWorkflow}
        onClose={() => {
          setShowEditor(false);
          setEditingWorkflow(null);
        }}
      />
    );
  }

  if (loadingWorkflows || loadingTemplates) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">Automatize suas conversas e processos</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setSelectedTab('templates')}
          >
            <Copy className="w-4 h-4 mr-2" />
            Ver Templates
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('workflows')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'workflows'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meus Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setSelectedTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates ({templates.length})
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      {selectedTab === 'workflows' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <WorkflowIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total de Workflows</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {workflows.filter(w => w.isActive).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Workflows Ativos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total de Execuções</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {workflows.filter(w => w.lastExecutedAt && 
                new Date(w.lastExecutedAt).toDateString() === new Date().toDateString()).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Executados Hoje</p>
          </div>
        </div>
      )}

      {/* Content */}
      {selectedTab === 'workflows' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Meus Workflows</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {workflows.length === 0 ? (
              <div className="p-8 text-center">
                <WorkflowIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum workflow criado ainda</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  Criar Primeiro Workflow
                </Button>
              </div>
            ) : (
              workflows.map((workflow) => (
                <div key={workflow.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(workflow.isActive)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            workflow.isActive 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getStatusText(workflow.isActive)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {workflow.description || 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>📊 {workflow.executionCount} execuções</span>
                          <span>🗓️ {workflow.nodes.length} nós</span>
                          {workflow.lastExecutedAt && (
                            <span>🕒 Última execução: {new Date(workflow.lastExecutedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMutation.mutate({
                          workflowId: workflow.id,
                          isActive: !workflow.isActive
                        })}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title={workflow.isActive ? 'Pausar' : 'Ativar'}
                      >
                        {workflow.isActive ? (
                          <Pause className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Play className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente excluir este workflow?')) {
                            deleteMutation.mutate(workflow.id);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{getCategoryIcon(template.category)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{getCategoryName(template.category)}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {template.nodes.length} nós
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createFromTemplateMutation.mutate({
                      templateId: template.id,
                      name: `${template.name} (Copy)`
                    })}
                    disabled={createFromTemplateMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Usar Template
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkflow}
          isLoading={createWorkflowMutation.isPending}
        />
      )}
    </div>
  );
}