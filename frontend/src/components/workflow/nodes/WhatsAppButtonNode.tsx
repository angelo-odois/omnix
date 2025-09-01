import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Square, Settings } from 'lucide-react';

interface WhatsAppButtonNodeProps {
  data: {
    label: string;
    buttons: Array<{
      id: string;
      text: string;
      type: 'reply' | 'url' | 'phone';
      value?: string;
    }>;
    message: string;
  };
  isConnectable: boolean;
}

const WhatsAppButtonNode: React.FC<WhatsAppButtonNodeProps> = ({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-primary-200 rounded-xl shadow-lg min-w-[280px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-primary-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-primary-gradient text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Square className="w-4 h-4" />
          <span className="font-medium text-sm">Botões WhatsApp</span>
        </div>
        <Settings className="w-4 h-4 opacity-75" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Message Preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="text-sm text-gray-700">
            {data.message || 'Digite sua mensagem...'}
          </div>
        </div>
        
        {/* Buttons Preview */}
        <div className="space-y-2">
          {data.buttons?.slice(0, 3).map((button, index) => (
            <div
              key={button.id || index}
              className="border border-primary-200 rounded-lg p-2 text-center bg-primary-50"
            >
              <span className="text-sm text-primary-700 font-medium">
                {button.text || `Botão ${index + 1}`}
              </span>
            </div>
          ))}
          
          {(!data.buttons || data.buttons.length === 0) && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
              <span className="text-xs text-gray-500">Configure os botões</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-primary-500 border-2 border-white"
      />
    </div>
  );
};

export default WhatsAppButtonNode;