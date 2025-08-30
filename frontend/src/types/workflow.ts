// Tipos para o sistema de workflows do OmniX

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  connections?: string[]; // IDs dos próximos nós
}

export enum WorkflowNodeType {
  TRIGGER = 'trigger',
  CONDITION = 'condition', 
  ACTION = 'action',
  DELAY = 'delay',
  END = 'end'
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config: WorkflowTriggerConfig;
}

export enum WorkflowTriggerType {
  MESSAGE_RECEIVED = 'message_received',
  KEYWORD = 'keyword',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  MANUAL = 'manual'
}

export interface WorkflowTriggerConfig {
  // Para MESSAGE_RECEIVED
  messageType?: 'any' | 'text' | 'image' | 'audio' | 'video' | 'document';
  
  // Para KEYWORD
  keywords?: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
  
  // Para SCHEDULE
  scheduleType?: 'once' | 'recurring';
  date?: string;
  time?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  
  // Para WEBHOOK
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface WorkflowCondition {
  type: WorkflowConditionType;
  config: WorkflowConditionConfig;
}

export enum WorkflowConditionType {
  TEXT_CONTAINS = 'text_contains',
  TEXT_EQUALS = 'text_equals',
  USER_TAG = 'user_tag',
  TIME_RANGE = 'time_range',
  CUSTOM = 'custom'
}

export interface WorkflowConditionConfig {
  // Para TEXT_CONTAINS/TEXT_EQUALS
  text?: string;
  caseSensitive?: boolean;
  
  // Para USER_TAG
  tag?: string;
  hasTag?: boolean;
  
  // Para TIME_RANGE
  startTime?: string;
  endTime?: string;
  
  // Para CUSTOM
  customScript?: string;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  config: WorkflowActionConfig;
}

export enum WorkflowActionType {
  SEND_MESSAGE = 'send_message',
  SEND_MEDIA = 'send_media',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  ASSIGN_AGENT = 'assign_agent',
  WEBHOOK = 'webhook',
  SAVE_DATA = 'save_data'
}

export interface WorkflowActionConfig {
  // Para SEND_MESSAGE
  message?: string;
  messageTemplate?: string;
  
  // Para SEND_MEDIA
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  caption?: string;
  
  // Para ADD_TAG/REMOVE_TAG
  tag?: string;
  
  // Para ASSIGN_AGENT
  agentId?: string;
  agentEmail?: string;
  
  // Para WEBHOOK
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST';
  webhookHeaders?: Record<string, string>;
  webhookBody?: string;
  
  // Para SAVE_DATA
  dataKey?: string;
  dataValue?: string;
}

export interface WorkflowNodeData {
  label: string;
  description?: string;
  trigger?: WorkflowTrigger;
  condition?: WorkflowCondition;
  action?: WorkflowAction;
  delay?: number; // em segundos
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  isActive: boolean;
  nodes: WorkflowNode[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  contactId: string;
  conversationId: string;
  status: WorkflowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  currentNodeId?: string;
  executionData: Record<string, any>;
  error?: string;
}

export enum WorkflowExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  nodes: WorkflowNode[];
  previewImage?: string;
  isPublic: boolean;
}

export enum WorkflowCategory {
  CUSTOMER_SERVICE = 'customer_service',
  SALES = 'sales',
  MARKETING = 'marketing',
  AUTOMATION = 'automation',
  CUSTOM = 'custom'
}

export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsToday: number;
  executionsThisWeek: number;
  executionsThisMonth: number;
}