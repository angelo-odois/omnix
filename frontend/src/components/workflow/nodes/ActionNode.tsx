import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  MessageSquare, 
  Image, 
  Tag, 
  UserPlus, 
  Webhook,
  Database,
  Send
} from 'lucide-react';
import { WorkflowActionType } from '../../../types/workflow';

interface ActionNodeData {
  label: string;
  actionType?: WorkflowActionType;
  config?: any;
}

export default function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const getActionIcon = (type?: WorkflowActionType) => {
    switch (type) {
      case WorkflowActionType.SEND_MESSAGE:
        return <MessageSquare className="w-4 h-4" />;
      case WorkflowActionType.SEND_MEDIA:
        return <Image className="w-4 h-4" />;
      case WorkflowActionType.ADD_TAG:
      case WorkflowActionType.REMOVE_TAG:
        return <Tag className="w-4 h-4" />;
      case WorkflowActionType.ASSIGN_AGENT:
        return <UserPlus className="w-4 h-4" />;
      case WorkflowActionType.WEBHOOK:
        return <Webhook className="w-4 h-4" />;
      case WorkflowActionType.SAVE_DATA:
        return <Database className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getActionColor = (type?: WorkflowActionType) => {
    switch (type) {
      case WorkflowActionType.SEND_MESSAGE:
        return 'from-green-400 to-green-600';
      case WorkflowActionType.SEND_MEDIA:
        return 'from-purple-400 to-purple-600';
      case WorkflowActionType.ADD_TAG:
        return 'from-blue-400 to-blue-600';
      case WorkflowActionType.REMOVE_TAG:
        return 'from-red-400 to-red-600';
      case WorkflowActionType.ASSIGN_AGENT:
        return 'from-indigo-400 to-indigo-600';
      case WorkflowActionType.WEBHOOK:
        return 'from-orange-400 to-orange-600';
      case WorkflowActionType.SAVE_DATA:
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-green-400 to-green-600';
    }
  };

  return (
    <div className={`
      relative min-w-[180px] rounded-lg shadow-lg border-2 transition-all
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      bg-gradient-to-br ${getActionColor(data.actionType)} text-white
    `}>
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#fff',
          border: '2px solid #3b82f6',
        }}
      />

      {/* Header */}
      <div className="px-4 py-2 border-b border-white/20">
        <div className="flex items-center gap-2">
          {getActionIcon(data.actionType)}
          <span className="text-sm font-semibold">ACTION</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="text-sm font-medium mb-1">{data.label}</div>
        {data.config && (
          <div className="text-xs opacity-80 max-w-[160px] truncate">
            {data.actionType === WorkflowActionType.SEND_MESSAGE && 
              data.config.message && `"${data.config.message.substring(0, 30)}..."`}
            {data.actionType === WorkflowActionType.ADD_TAG && 
              `Tag: ${data.config.tag}`}
            {data.actionType === WorkflowActionType.REMOVE_TAG && 
              `Remove: ${data.config.tag}`}
            {data.actionType === WorkflowActionType.ASSIGN_AGENT && 
              `Para: ${data.config.agentEmail}`}
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