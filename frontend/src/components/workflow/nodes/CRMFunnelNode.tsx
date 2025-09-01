import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BarChart3, Settings, ArrowRight } from 'lucide-react';

interface CRMFunnelNodeProps {
  data: {
    label: string;
    fromStage: string;
    toStage: string;
    condition?: string;
    stages: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  };
  isConnectable: boolean;
}

const CRMFunnelNode: React.FC<CRMFunnelNodeProps> = ({ data, isConnectable }) => {
  const getStageInfo = (stageId: string) => {
    return data.stages?.find(s => s.id === stageId) || { name: stageId, color: 'bg-gray-500' };
  };

  const fromStage = getStageInfo(data.fromStage);
  const toStage = getStageInfo(data.toStage);

  return (
    <div className="bg-white border-2 border-yellow-200 rounded-xl shadow-lg min-w-[300px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4" />
          <span className="font-medium text-sm">Mover no Funil</span>
        </div>
        <Settings className="w-4 h-4 opacity-75" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Stage Movement Visualization */}
        <div className="bg-yellow-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            {/* From Stage */}
            <div className="text-center flex-1">
              <div className={`w-8 h-8 ${fromStage.color || 'bg-gray-400'} rounded-full mx-auto mb-1 flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {(fromStage.name || 'Origem').charAt(0)}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">
                {fromStage.name || 'Etapa Origem'}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="px-2">
              <ArrowRight className="w-4 h-4 text-yellow-600" />
            </div>
            
            {/* To Stage */}
            <div className="text-center flex-1">
              <div className={`w-8 h-8 ${toStage.color || 'bg-gray-400'} rounded-full mx-auto mb-1 flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {(toStage.name || 'Destino').charAt(0)}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">
                {toStage.name || 'Etapa Destino'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Condition */}
        {data.condition && (
          <div className="bg-gray-50 rounded-lg p-2 mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Condição:</div>
            <div className="text-xs text-gray-600">
              {data.condition}
            </div>
          </div>
        )}

        {(!data.fromStage || !data.toStage) && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
            <span className="text-xs text-gray-500">Configure as etapas do funil</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
      />
    </div>
  );
};

export default CRMFunnelNode;