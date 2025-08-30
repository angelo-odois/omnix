import { api } from '../lib/api';
import type { 
  Workflow, 
  WorkflowTemplate, 
  WorkflowStats,
  WorkflowCategory 
} from '../types/workflow';

export const workflowService = {
  // ============= WORKFLOW MANAGEMENT =============

  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows');
    return response.data.workflows || [];
  },

  async getWorkflow(workflowId: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${workflowId}`);
    return response.data.workflow;
  },

  async createWorkflow(data: {
    name: string;
    description?: string;
    nodes?: any[];
  }): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  async updateWorkflow(
    workflowId: string, 
    data: Partial<Workflow>
  ): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    const response = await api.put(`/workflows/${workflowId}`, data);
    return response.data;
  },

  async deleteWorkflow(workflowId: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.delete(`/workflows/${workflowId}`);
    return response.data;
  },

  async toggleWorkflow(
    workflowId: string, 
    isActive: boolean
  ): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    const response = await api.patch(`/workflows/${workflowId}/toggle`, { isActive });
    return response.data;
  },

  // ============= WORKFLOW EXECUTION =============

  async executeWorkflow(
    workflowId: string,
    contactId: string,
    conversationId: string,
    triggerData?: any
  ): Promise<{ success: boolean; executionId?: string; message?: string }> {
    const response = await api.post(`/workflows/${workflowId}/execute`, {
      contactId,
      conversationId,
      triggerData
    });
    return response.data;
  },

  // ============= WORKFLOW TEMPLATES =============

  async getTemplates(category?: WorkflowCategory): Promise<WorkflowTemplate[]> {
    const params = category ? { category } : {};
    const response = await api.get('/workflow-templates', { params });
    return response.data.templates || [];
  },

  async createFromTemplate(
    templateId: string,
    name?: string
  ): Promise<{ success: boolean; workflow?: Workflow; message?: string }> {
    const response = await api.post(`/workflow-templates/${templateId}/create`, { name });
    return response.data;
  },

  // ============= WORKFLOW STATISTICS =============

  async getWorkflowStats(workflowId: string): Promise<WorkflowStats> {
    const response = await api.get(`/workflows/${workflowId}/stats`);
    return response.data.stats;
  }
};