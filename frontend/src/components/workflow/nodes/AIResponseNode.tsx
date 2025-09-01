import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Settings, Zap } from 'lucide-react';

interface AIResponseNodeProps {
  data: {
    label: string;
    prompt: string;
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    maxLength: number;
    useContext: boolean;
  };
  isConnectable: boolean;
}

const AIResponseNode: React.FC<AIResponseNodeProps> = ({ data, isConnectable }) => {
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'text-blue-600 bg-blue-50';
      case 'friendly': return 'text-green-600 bg-green-50';
      case 'casual': return 'text-purple-600 bg-purple-50';
      case 'formal': return 'text-gray-600 bg-gray-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case 'professional': return 'Profissional';
      case 'friendly': return 'Amigável';
      case 'casual': return 'Casual';
      case 'formal': return 'Formal';
      default: return 'Padrão';
    }
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg min-w-[280px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4" />
          <span className="font-medium text-sm">Resposta IA</span>
        </div>
        <Settings className="w-4 h-4 opacity-75" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* AI Indicator */}
        <div className="bg-purple-50 rounded-lg p-3 mb-3 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-700 font-medium">
            IA Gerará Resposta Automaticamente
          </span>
        </div>
        
        {/* Prompt Preview */}
        {data.prompt && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Prompt:</div>
            <div className="text-xs text-gray-600 line-clamp-2">
              {data.prompt}
            </div>
          </div>
        )}
        
        {/* Settings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Tom:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getToneColor(data.tone || 'professional')}`}>
              {getToneLabel(data.tone || 'professional')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Máx. caracteres:</span>
            <span className="text-xs font-medium text-gray-700">
              {data.maxLength || 500}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Usar contexto:</span>
            <div className={`w-4 h-4 rounded-full ${
              data.useContext ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
          </div>
        </div>

        {!data.prompt && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center mt-3">
            <span className="text-xs text-gray-500">Configure o prompt da IA</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />
    </div>
  );
};

export default AIResponseNode;