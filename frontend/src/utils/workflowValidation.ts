import { WorkflowNode, WorkflowNodeType } from '../types/workflow';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(nodes: WorkflowNode[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar se há pelo menos um nó
  if (nodes.length === 0) {
    errors.push('O workflow deve ter pelo menos um nó');
    return { isValid: false, errors, warnings };
  }

  // Verificar se há pelo menos um trigger
  const triggerNodes = nodes.filter(n => n.type === WorkflowNodeType.TRIGGER);
  if (triggerNodes.length === 0) {
    errors.push('O workflow deve ter pelo menos um nó de gatilho (trigger)');
  }

  // Verificar se há mais de um trigger
  if (triggerNodes.length > 1) {
    warnings.push('Múltiplos gatilhos podem causar comportamento inesperado');
  }

  // Verificar nós órfãos (sem conexões de entrada, exceto triggers)
  const nodesWithConnections = new Set<string>();
  nodes.forEach(node => {
    if (node.connections) {
      node.connections.forEach(targetId => {
        nodesWithConnections.add(targetId);
      });
    }
  });

  nodes.forEach(node => {
    if (node.type !== WorkflowNodeType.TRIGGER && !nodesWithConnections.has(node.id)) {
      warnings.push(`Nó "${node.data.label}" não possui conexões de entrada`);
    }
  });

  // Verificar nós sem saída (exceto END)
  nodes.forEach(node => {
    if (node.type !== WorkflowNodeType.END && (!node.connections || node.connections.length === 0)) {
      warnings.push(`Nó "${node.data.label}" não possui conexões de saída`);
    }
  });

  // Verificar configurações obrigatórias
  nodes.forEach(node => {
    validateNodeConfiguration(node, errors, warnings);
  });

  // Verificar ciclos infinitos (detecção básica)
  if (hasCircularDependency(nodes)) {
    errors.push('Detectado possível loop infinito no workflow');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function validateNodeConfiguration(node: WorkflowNode, errors: string[], warnings: string[]) {
  const nodeLabel = node.data.label || `Nó ${node.id}`;

  switch (node.type) {
    case WorkflowNodeType.TRIGGER:
      if (node.data.trigger) {
        const config = node.data.trigger.config;
        
        switch (node.data.trigger.type) {
          case 'keyword':
            if (!config.keywords || config.keywords.length === 0) {
              errors.push(`${nodeLabel}: Palavras-chave não configuradas`);
            }
            break;
          case 'schedule':
            if (!config.time) {
              errors.push(`${nodeLabel}: Horário não configurado`);
            }
            break;
          case 'webhook':
            if (!config.webhookUrl) {
              errors.push(`${nodeLabel}: URL do webhook não configurada`);
            }
            break;
        }
      } else {
        errors.push(`${nodeLabel}: Configuração de gatilho não definida`);
      }
      break;

    case WorkflowNodeType.ACTION:
      if (node.data.action) {
        const config = node.data.action.config;
        
        switch (node.data.action.type) {
          case 'send_message':
            if (!config.message?.trim()) {
              errors.push(`${nodeLabel}: Mensagem não configurada`);
            }
            break;
          case 'add_tag':
          case 'remove_tag':
            if (!config.tag?.trim()) {
              errors.push(`${nodeLabel}: Tag não configurada`);
            }
            break;
          case 'assign_agent':
            if (!config.agentEmail?.trim()) {
              errors.push(`${nodeLabel}: Email do agente não configurado`);
            }
            break;
          case 'webhook':
            if (!config.webhookUrl?.trim()) {
              errors.push(`${nodeLabel}: URL do webhook não configurada`);
            }
            break;
        }
      } else {
        errors.push(`${nodeLabel}: Configuração de ação não definida`);
      }
      break;

    case WorkflowNodeType.CONDITION:
      if (node.data.condition) {
        const config = node.data.condition.config;
        
        switch (node.data.condition.type) {
          case 'text_contains':
          case 'text_equals':
            if (!config.text?.trim()) {
              errors.push(`${nodeLabel}: Texto para verificação não configurado`);
            }
            break;
          case 'user_tag':
            if (!config.tag?.trim()) {
              errors.push(`${nodeLabel}: Tag para verificação não configurada`);
            }
            break;
          case 'time_range':
            if (!config.startTime || !config.endTime) {
              errors.push(`${nodeLabel}: Horários não configurados`);
            }
            break;
        }
      } else {
        errors.push(`${nodeLabel}: Configuração de condição não definida`);
      }
      break;

    case WorkflowNodeType.DELAY:
      if (!node.data.delay || node.data.delay <= 0) {
        warnings.push(`${nodeLabel}: Tempo de atraso não configurado ou inválido`);
      }
      break;
  }
}

function hasCircularDependency(nodes: WorkflowNode[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Ciclo detectado
    }

    if (visited.has(nodeId)) {
      return false; // Já visitado, sem ciclo neste caminho
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node && node.connections) {
      for (const connectionId of node.connections) {
        if (hasCycle(connectionId)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Verificar ciclos a partir de todos os nós
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return true;
      }
    }
  }

  return false;
}

export function getNodeTypeDisplayName(nodeType: WorkflowNodeType): string {
  const names = {
    [WorkflowNodeType.TRIGGER]: 'Gatilho',
    [WorkflowNodeType.CONDITION]: 'Condição',
    [WorkflowNodeType.ACTION]: 'Ação',
    [WorkflowNodeType.DELAY]: 'Atraso',
    [WorkflowNodeType.END]: 'Fim'
  };
  return names[nodeType] || nodeType;
}

export function generateWorkflowSummary(nodes: WorkflowNode[]): string {
  const triggerCount = nodes.filter(n => n.type === WorkflowNodeType.TRIGGER).length;
  const conditionCount = nodes.filter(n => n.type === WorkflowNodeType.CONDITION).length;
  const actionCount = nodes.filter(n => n.type === WorkflowNodeType.ACTION).length;
  const delayCount = nodes.filter(n => n.type === WorkflowNodeType.DELAY).length;

  return `${triggerCount} gatilho(s), ${conditionCount} condição(ões), ${actionCount} ação(ões), ${delayCount} atraso(s)`;
}