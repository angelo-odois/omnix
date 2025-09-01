import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Star, Settings, TrendingUp } from 'lucide-react';

interface CRMLeadScoreNodeProps {
  data: {
    label: string;
    scoreRules: Array<{
      condition: string;
      points: number;
      description: string;
    }>;
    threshold: number;
    actionOnThreshold: string;
  };
  isConnectable: boolean;
}

const CRMLeadScoreNode: React.FC<CRMLeadScoreNodeProps> = ({ data, isConnectable }) => {
  const totalPossibleScore = data.scoreRules?.reduce((sum, rule) => sum + rule.points, 0) || 0;

  return (
    <div className="bg-white border-2 border-yellow-200 rounded-xl shadow-lg min-w-[280px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-yellow-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4" />
          <span className="font-medium text-sm">Score do Lead</span>
        </div>
        <Settings className="w-4 h-4 opacity-75" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Score Display */}
        <div className="bg-yellow-50 rounded-lg p-3 mb-3 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Pontuação Máxima</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">
            {totalPossibleScore} pts
          </div>
        </div>
        
        {/* Rules Preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Regras de Pontuação:</div>
          {data.scoreRules?.slice(0, 3).map((rule, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
              <div className="text-xs text-gray-600 flex-1 truncate">
                {rule.description || rule.condition}
              </div>
              <div className="text-xs font-bold text-yellow-600 ml-2">
                +{rule.points}
              </div>
            </div>
          ))}
          
          {(!data.scoreRules || data.scoreRules.length === 0) && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
              <span className="text-xs text-gray-500">Configure as regras</span>
            </div>
          )}
        </div>

        {/* Threshold */}
        {data.threshold && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-xs font-medium text-yellow-800">
              Ação ao atingir {data.threshold} pontos
            </div>
            <div className="text-xs text-yellow-600">
              {data.actionOnThreshold || 'Não configurado'}
            </div>
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

export default CRMLeadScoreNode;