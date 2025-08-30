import { 
  Zap, 
  MessageSquare, 
  GitBranch, 
  Clock, 
  Square,
  MessageCircle,
  Calendar,
  Webhook,
  Play,
  Image,
  Tag,
  UserPlus,
  Database,
  FileText
} from 'lucide-react';
import { WorkflowNodeType, WorkflowTriggerType, WorkflowActionType } from '../../types/workflow';

interface NodeTemplate {
  id: string;
  type: WorkflowNodeType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  subtype?: string;
}

const nodeTemplates: NodeTemplate[] = [
  // TRIGGERS
  {
    id: 'trigger-message',
    type: WorkflowNodeType.TRIGGER,
    label: 'Nova Mensagem',
    icon: MessageCircle,
    color: 'bg-blue-500',
    description: 'Inicia quando uma nova mensagem é recebida',
    subtype: WorkflowTriggerType.MESSAGE_RECEIVED
  },
  {
    id: 'trigger-keyword',
    type: WorkflowNodeType.TRIGGER,
    label: 'Palavra-chave',
    icon: MessageSquare,
    color: 'bg-purple-500',
    description: 'Inicia quando uma palavra-chave específica é detectada',
    subtype: WorkflowTriggerType.KEYWORD
  },
  {
    id: 'trigger-schedule',
    type: WorkflowNodeType.TRIGGER,
    label: 'Agendado',
    icon: Calendar,
    color: 'bg-green-500',
    description: 'Inicia em horário agendado',
    subtype: WorkflowTriggerType.SCHEDULE
  },
  {
    id: 'trigger-webhook',
    type: WorkflowNodeType.TRIGGER,
    label: 'Webhook',
    icon: Webhook,
    color: 'bg-orange-500',
    description: 'Inicia via chamada HTTP externa',
    subtype: WorkflowTriggerType.WEBHOOK
  },
  {
    id: 'trigger-manual',
    type: WorkflowNodeType.TRIGGER,
    label: 'Manual',
    icon: Play,
    color: 'bg-gray-500',
    description: 'Inicia manualmente pelo operador',
    subtype: WorkflowTriggerType.MANUAL
  },
  
  // CONDITIONS
  {
    id: 'condition-text',
    type: WorkflowNodeType.CONDITION,
    label: 'Contém Texto',
    icon: FileText,
    color: 'bg-amber-500',
    description: 'Verifica se o texto contém uma palavra específica'
  },
  {
    id: 'condition-tag',
    type: WorkflowNodeType.CONDITION,
    label: 'Tem Tag',
    icon: Tag,
    color: 'bg-amber-500',
    description: 'Verifica se o contato possui uma tag específica'
  },
  {
    id: 'condition-time',
    type: WorkflowNodeType.CONDITION,
    label: 'Horário',
    icon: Clock,
    color: 'bg-amber-500',
    description: 'Verifica se está dentro de um horário específico'
  },
  
  // ACTIONS
  {
    id: 'action-message',
    type: WorkflowNodeType.ACTION,
    label: 'Enviar Mensagem',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Envia uma mensagem de texto',
    subtype: WorkflowActionType.SEND_MESSAGE
  },
  {
    id: 'action-media',
    type: WorkflowNodeType.ACTION,
    label: 'Enviar Mídia',
    icon: Image,
    color: 'bg-purple-500',
    description: 'Envia imagem, áudio ou vídeo',
    subtype: WorkflowActionType.SEND_MEDIA
  },
  {
    id: 'action-add-tag',
    type: WorkflowNodeType.ACTION,
    label: 'Adicionar Tag',
    icon: Tag,
    color: 'bg-blue-500',
    description: 'Adiciona uma tag ao contato',
    subtype: WorkflowActionType.ADD_TAG
  },
  {
    id: 'action-assign',
    type: WorkflowNodeType.ACTION,
    label: 'Atribuir Agente',
    icon: UserPlus,
    color: 'bg-indigo-500',
    description: 'Atribui a conversa para um agente específico',
    subtype: WorkflowActionType.ASSIGN_AGENT
  },
  {
    id: 'action-webhook',
    type: WorkflowNodeType.ACTION,
    label: 'Chamar Webhook',
    icon: Webhook,
    color: 'bg-orange-500',
    description: 'Faz uma chamada HTTP para API externa',
    subtype: WorkflowActionType.WEBHOOK
  },
  {
    id: 'action-save-data',
    type: WorkflowNodeType.ACTION,
    label: 'Salvar Dados',
    icon: Database,
    color: 'bg-gray-500',
    description: 'Salva informações personalizadas',
    subtype: WorkflowActionType.SAVE_DATA
  },
  
  // OTHERS
  {
    id: 'delay',
    type: WorkflowNodeType.DELAY,
    label: 'Aguardar',
    icon: Clock,
    color: 'bg-indigo-500',
    description: 'Aguarda um tempo antes de continuar'
  },
  {
    id: 'end',
    type: WorkflowNodeType.END,
    label: 'Fim',
    icon: Square,
    color: 'bg-gray-500',
    description: 'Termina a execução do workflow'
  }
];

interface WorkflowSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string, template: NodeTemplate) => void;
}

export default function WorkflowSidebar({ onDragStart }: WorkflowSidebarProps) {
  const groupedNodes = {
    triggers: nodeTemplates.filter(n => n.type === WorkflowNodeType.TRIGGER),
    conditions: nodeTemplates.filter(n => n.type === WorkflowNodeType.CONDITION),
    actions: nodeTemplates.filter(n => n.type === WorkflowNodeType.ACTION),
    others: nodeTemplates.filter(n => 
      n.type === WorkflowNodeType.DELAY || n.type === WorkflowNodeType.END
    )
  };

  const renderNodeGroup = (title: string, nodes: NodeTemplate[]) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-2">
        {nodes.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
            draggable
            onDragStart={(e) => onDragStart(e, template.type, template)}
          >
            <div className={`p-2 rounded-lg ${template.color} text-white flex-shrink-0`}>
              <template.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 truncate">
                {template.label}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {template.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Componentes</h2>
        <p className="text-sm text-gray-600 mt-1">
          Arraste os componentes para o canvas
        </p>
      </div>
      
      <div className="p-4">
        {renderNodeGroup('Gatilhos', groupedNodes.triggers)}
        {renderNodeGroup('Condições', groupedNodes.conditions)}
        {renderNodeGroup('Ações', groupedNodes.actions)}
        {renderNodeGroup('Outros', groupedNodes.others)}
      </div>
    </div>
  );
}

export { nodeTemplates };
export type { NodeTemplate };