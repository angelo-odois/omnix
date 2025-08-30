import { Handle, Position, NodeProps } from '@xyflow/react';
import { Clock, Timer } from 'lucide-react';

interface DelayNodeData {
  label: string;
  delay?: number; // em segundos
}

export default function DelayNode({ data, selected }: NodeProps<DelayNodeData>) {
  const formatDelay = (seconds?: number) => {
    if (!seconds) return '0s';
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className={`
      relative min-w-[180px] rounded-lg shadow-lg border-2 transition-all
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      bg-gradient-to-br from-indigo-400 to-indigo-600 text-white
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
          <Timer className="w-4 h-4" />
          <span className="text-sm font-semibold">DELAY</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 text-center">
        <div className="text-lg font-bold mb-1">
          <Clock className="w-6 h-6 mx-auto mb-1" />
          {formatDelay(data.delay)}
        </div>
        <div className="text-sm opacity-80">{data.label}</div>
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