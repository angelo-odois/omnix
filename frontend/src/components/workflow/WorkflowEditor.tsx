import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider
} from '@xyflow/react';
import type {
  Node,
  Edge,
  ReactFlowInstance,
  OnConnect,
  NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import WorkflowSidebar from './WorkflowSidebar';
import NodeConfigModal from './NodeConfigModal';
import { WorkflowNodeType } from '../../types/workflow';
import type { NodeTemplate } from './WorkflowSidebar';
import type { WorkflowNode } from '../../types/workflow';
import { validateWorkflow } from '../../utils/workflowValidation';
import { Save, Play, Eye, Settings, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

interface WorkflowEditorProps {
  initialWorkflow?: {
    id?: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    isActive?: boolean;
  };
  onSave?: (workflowData: any) => void;
  onExecute?: (workflowId: string) => void;
  onClose?: () => void;
}

let nodeId = 0;
const getId = () => `node_${++nodeId}`;

export default function WorkflowEditor({ 
  initialWorkflow, 
  onSave, 
  onExecute, 
  onClose 
}: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'Novo Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);

  // Converter WorkflowNodes para ReactFlow Nodes
  const convertToReactFlowNodes = (workflowNodes: WorkflowNode[]): Node[] => {
    return workflowNodes.map(wfNode => ({
      id: wfNode.id,
      type: wfNode.type,
      position: wfNode.position,
      data: {
        label: wfNode.data.label,
        description: wfNode.data.description,
        triggerType: wfNode.data.trigger?.type,
        actionType: wfNode.data.action?.type,
        conditionType: wfNode.data.condition?.type,
        delay: wfNode.data.delay,
        config: wfNode.data.trigger?.config || wfNode.data.action?.config || wfNode.data.condition?.config
      }
    }));
  };

  // Converter connections para ReactFlow Edges
  const convertToReactFlowEdges = (workflowNodes: WorkflowNode[]): Edge[] => {
    const edges: Edge[] = [];
    workflowNodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(targetId => {
          edges.push({
            id: `${node.id}-${targetId}`,
            source: node.id,
            target: targetId,
            type: 'smoothstep',
            animated: true
          });
        });
      }
    });
    return edges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow ? convertToReactFlowNodes(initialWorkflow.nodes) : []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow ? convertToReactFlowEdges(initialWorkflow.nodes) : []
  );

  const onConnect = useCallback<OnConnect>(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow-type');
      const templateData = event.dataTransfer.getData('application/reactflow-template');

      if (!type || !templateData || !reactFlowInstance || !reactFlowBounds) {
        return;
      }

      const template: NodeTemplate = JSON.parse(templateData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: {
          label: template.label,
          triggerType: template.subtype,
          actionType: template.subtype,
          conditionType: template.subtype,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  }, []);

  const onNodeDragStop: NodeDragHandler = useCallback((event, node) => {
    console.log('Node moved:', node);
  }, []);

  const handleSave = () => {
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type as WorkflowNodeType,
      position: node.position,
      data: {
        label: node.data.label,
        description: node.data.description,
        trigger: node.data.triggerType ? {
          type: node.data.triggerType,
          config: node.data.config || {}
        } : undefined,
        action: node.data.actionType ? {
          type: node.data.actionType,
          config: node.data.config || {}
        } : undefined,
        condition: node.data.conditionType ? {
          type: node.data.conditionType,
          config: node.data.config || {}
        } : undefined,
        delay: node.data.delay
      },
      connections: edges
        .filter(edge => edge.source === node.id)
        .map(edge => edge.target)
    }));

    // Validar antes de salvar
    const validation = validateWorkflow(workflowNodes);
    if (!validation.isValid) {
      alert('Erros encontrados:\n' + validation.errors.join('\n'));
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = confirm(
        'Avisos encontrados:\n' + validation.warnings.join('\n') + 
        '\n\nDeseja continuar mesmo assim?'
      );
      if (!proceed) return;
    }

    const workflowData = {
      id: initialWorkflow?.id,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes
    };

    onSave?.(workflowData);
  };

  const handleNodeConfigSave = (updatedNode: any) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      )
    );
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes(nodes => nodes.filter(node => node.id !== selectedNode.id));
      setEdges(edges => edges.filter(edge => 
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
      setShowNodeConfig(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <WorkflowSidebar onDragStart={onDragStart} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-xl font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 p-0 w-full"
                placeholder="Nome do Workflow"
              />
              <input
                type="text"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="text-sm text-gray-600 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 w-full mt-1"
                placeholder="Descrição (opcional)"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              {initialWorkflow?.id && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => onExecute?.(initialWorkflow.id!)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Executar
                </Button>
              )}
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <div ref={reactFlowWrapper} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls />
            </ReactFlow>
          </div>

          {/* Floating Action Panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Nó Selecionado</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-2 font-medium capitalize">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Label:</span>
                  <span className="ml-2">{selectedNode.data.label}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowNodeConfig(true)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Config
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={deleteSelectedNode}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Configuration Modal */}
      {selectedNode && (
        <NodeConfigModal
          node={selectedNode}
          isOpen={showNodeConfig}
          onClose={() => setShowNodeConfig(false)}
          onSave={handleNodeConfigSave}
        />
      )}
    </div>
  );
}

export function WorkflowEditorProvider(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditor {...props} />
    </ReactFlowProvider>
  );
}