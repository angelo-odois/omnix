import { Handle, Position, NodeProps } from '@xyflow/react';
import { Square, CheckCircle } from 'lucide-react';

interface EndNodeData {
  label: string;
}

export default function EndNode({ data, selected }: NodeProps<EndNodeData>) {
  return (
    <div className={`
      relative min-w-[140px] rounded-lg shadow-lg border-2 transition-all
      ${selected ? 'border-blue-500 shadow-blue-200' : 'border-gray-300'}
      bg-gradient-to-br from-gray-500 to-gray-700 text-white
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
          <Square className="w-4 h-4" />
          <span className="text-sm font-semibold">END</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 text-center">
        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
        <div className="text-sm font-medium">{data.label}</div>
      </div>
    </div>
  );
}