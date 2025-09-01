import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckSquare, Settings } from 'lucide-react';

interface WhatsAppListNodeProps {
  data: {
    label: string;
    title: string;
    description: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
  isConnectable: boolean;
}

const WhatsAppListNode: React.FC<WhatsAppListNodeProps> = ({ data, isConnectable }) => {
  return (
    <div className="bg-white border-2 border-primary-200 rounded-xl shadow-lg min-w-[300px] overflow-hidden">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-primary-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="bg-primary-gradient text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckSquare className="w-4 h-4" />
          <span className="font-medium text-sm">Lista Interativa</span>
        </div>
        <Settings className="w-4 h-4 opacity-75" />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Header Preview */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <div className="font-medium text-sm text-gray-900 mb-1">
            {data.title || 'Título da Lista'}
          </div>
          <div className="text-xs text-gray-600">
            {data.description || 'Descrição da lista...'}
          </div>
        </div>
        
        {/* Button Preview */}
        <div className="border border-primary-200 rounded-lg p-2 text-center bg-primary-50 mb-3">
          <span className="text-sm text-primary-700 font-medium">
            {data.buttonText || 'Ver Opções'}
          </span>
        </div>
        
        {/* Sections Preview */}
        <div className="space-y-2">
          {data.sections?.slice(0, 2).map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-2">
              <div className="text-xs font-medium text-gray-700 mb-1">
                {section.title || `Seção ${index + 1}`}
              </div>
              <div className="space-y-1">
                {section.rows?.slice(0, 2).map((row, rowIndex) => (
                  <div key={rowIndex} className="text-xs text-gray-600 bg-gray-50 rounded p-1">
                    {row.title || `Item ${rowIndex + 1}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {(!data.sections || data.sections.length === 0) && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
              <span className="text-xs text-gray-500">Configure as seções</span>
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

export default WhatsAppListNode;