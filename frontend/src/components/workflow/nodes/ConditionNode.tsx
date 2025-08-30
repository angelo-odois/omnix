import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, Clock, Tag as TagIcon, FileText } from 'lucide-react';
import { WorkflowConditionType } from '../../../types/workflow';

interface ConditionNodeData {
  label: string;
  conditionType?: WorkflowConditionType;
  config?: any;
}

export default function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  const getConditionIcon = (type?: WorkflowConditionType) => {
    switch (type) {
      case WorkflowConditionType.TEXT_CONTAINS:
      case WorkflowConditionType.TEXT_EQUALS:
        return <FileText className="w-4 h-4" />;
      case WorkflowConditionType.USER_TAG:
        return <TagIcon className="w-4 h-4" />;
      case WorkflowConditionType.TIME_RANGE:
        return <Clock className="w-4 h-4" />;
      default:
        return <GitBranch className="w-4 h-4" />;
    }
  };

  return (
    <div className={`
      relative min-w-[180px] rounded-lg shadow-lg border-2 transition-all
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      bg-gradient-to-br from-amber-400 to-amber-600 text-white
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
          {getConditionIcon(data.conditionType)}
          <span className="text-sm font-semibold">CONDITION</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <div className="text-sm font-medium mb-1">{data.label}</div>
        {data.config && (
          <div className="text-xs opacity-80">
            {(data.conditionType === WorkflowConditionType.TEXT_CONTAINS ||
              data.conditionType === WorkflowConditionType.TEXT_EQUALS) && 
              `Texto: "${data.config.text}"`}
            {data.conditionType === WorkflowConditionType.USER_TAG && 
              `Tag: ${data.config.tag}`}
            {data.conditionType === WorkflowConditionType.TIME_RANGE && 
              `${data.config.startTime} - ${data.config.endTime}`}
          </div>
        )}
      </div>

      {/* Handles de saída - Sim e Não */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#10b981',
          border: '2px solid #fff',
          top: '60%',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#ef4444',
          border: '2px solid #fff',
          top: '80%',
        }}
      />

      {/* Labels para Sim/Não */}
      <div className="absolute -right-8 top-[55%] text-xs text-green-600 font-semibold">
        SIM
      </div>
      <div className="absolute -right-8 top-[75%] text-xs text-red-600 font-semibold">
        NÃO
      </div>
    </div>
  );
}