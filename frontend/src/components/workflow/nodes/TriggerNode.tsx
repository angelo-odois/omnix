import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, MessageCircle, Calendar, Webhook, Play } from 'lucide-react';
import { WorkflowTriggerType } from '../../../types/workflow';

interface TriggerNodeData {
  label: string;
  triggerType?: WorkflowTriggerType;
  config?: any;
}

export default function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const getTriggerIcon = (type?: WorkflowTriggerType) => {
    switch (type) {
      case WorkflowTriggerType.MESSAGE_RECEIVED:
        return <MessageCircle className="w-4 h-4" />;
      case WorkflowTriggerType.KEYWORD:
        return <MessageCircle className="w-4 h-4" />;
      case WorkflowTriggerType.SCHEDULE:
        return <Calendar className="w-4 h-4" />;
      case WorkflowTriggerType.WEBHOOK:
        return <Webhook className="w-4 h-4" />;
      case WorkflowTriggerType.MANUAL:
        return <Play className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTriggerColor = (type?: WorkflowTriggerType) => {
    switch (type) {
      case WorkflowTriggerType.MESSAGE_RECEIVED:
        return 'from-blue-400 to-blue-600';
      case WorkflowTriggerType.KEYWORD:
        return 'from-purple-400 to-purple-600';
      case WorkflowTriggerType.SCHEDULE:
        return 'from-green-400 to-green-600';
      case WorkflowTriggerType.WEBHOOK:
        return 'from-orange-400 to-orange-600';
      case WorkflowTriggerType.MANUAL:
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-blue-400 to-blue-600';
    }
  };

  return (
    <div className={`
      relative min-w-[180px] rounded-lg shadow-lg border-2 transition-all
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      bg-gradient-to-br ${getTriggerColor(data.triggerType)} text-white
    `}>
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          {getTriggerIcon(data.triggerType)}
          <span className="text-sm font-semibold">TRIGGER</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="text-sm font-medium mb-1">{data.label}</div>
        {data.config && (
          <div className="text-xs opacity-80">
            {data.triggerType === WorkflowTriggerType.KEYWORD && 
              `Palavras: ${data.config.keywords?.join(', ')}`}
            {data.triggerType === WorkflowTriggerType.MESSAGE_RECEIVED && 
              `Tipo: ${data.config.messageType || 'any'}`}
            {data.triggerType === WorkflowTriggerType.SCHEDULE && 
              `Horário: ${data.config.time}`}
          </div>
        )}
      </div>

      {/* Handle de saída */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#fff',
          border: '2px solid #3b82f6',
        }}
      />
    </div>
  );
}