import { useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Save } from 'lucide-react';
import { 
  WorkflowNodeType, 
  WorkflowTriggerType, 
  WorkflowActionType,
  WorkflowConditionType 
} from '../../types/workflow';
import Button from '../ui/Button';

interface NodeConfigModalProps {
  node: Node;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNode: Node) => void;
}

export default function NodeConfigModal({ node, isOpen, onClose, onSave }: NodeConfigModalProps) {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [config, setConfig] = useState(node.data.config || {});

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        label,
        description,
        config
      }
    };
    onSave(updatedNode);
    onClose();
  };

  const renderTriggerConfig = () => {
    const triggerType = node.data.triggerType;

    switch (triggerType) {
      case WorkflowTriggerType.KEYWORD:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavras-chave (uma por linha)
              </label>
              <textarea
                value={(config.keywords || []).join('\n')}
                onChange={(e) => setConfig({
                  ...config,
                  keywords: e.target.value.split('\n').filter(k => k.trim())
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="preço&#10;valor&#10;quanto custa"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.caseSensitive || false}
                  onChange={(e) => setConfig({ ...config, caseSensitive: e.target.checked })}
                  className="rounded"
                />
                Case sensitive
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.exactMatch || false}
                  onChange={(e) => setConfig({ ...config, exactMatch: e.target.checked })}
                  className="rounded"
                />
                Correspondência exata
              </label>
            </div>
          </div>
        );

      case WorkflowTriggerType.SCHEDULE:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de agendamento
              </label>
              <select
                value={config.scheduleType || 'once'}
                onChange={(e) => setConfig({ ...config, scheduleType: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="once">Uma vez</option>
                <option value="recurring">Recorrente</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={config.date || ''}
                  onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={config.time || ''}
                  onChange={(e) => setConfig({ ...config, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case WorkflowTriggerType.MESSAGE_RECEIVED:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de mensagem
            </label>
            <select
              value={config.messageType || 'any'}
              onChange={(e) => setConfig({ ...config, messageType: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="any">Qualquer tipo</option>
              <option value="text">Apenas texto</option>
              <option value="image">Apenas imagens</option>
              <option value="audio">Apenas áudio</option>
              <option value="video">Apenas vídeo</option>
              <option value="document">Apenas documentos</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionConfig = () => {
    const actionType = node.data.actionType;

    switch (actionType) {
      case WorkflowActionType.SEND_MESSAGE:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <textarea
              value={config.message || ''}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Digite a mensagem que será enviada..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Você pode usar variáveis como {'{nome}'}, {'{telefone}'}, etc.
            </p>
          </div>
        );

      case WorkflowActionType.ADD_TAG:
      case WorkflowActionType.REMOVE_TAG:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <input
              type="text"
              value={config.tag || ''}
              onChange={(e) => setConfig({ ...config, tag: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="nome-da-tag"
            />
          </div>
        );

      case WorkflowActionType.ASSIGN_AGENT:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email do Agente
            </label>
            <input
              type="email"
              value={config.agentEmail || ''}
              onChange={(e) => setConfig({ ...config, agentEmail: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="agente@empresa.com"
            />
          </div>
        );

      case WorkflowActionType.WEBHOOK:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Webhook
              </label>
              <input
                type="url"
                value={config.webhookUrl || ''}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método HTTP
              </label>
              <select
                value={config.webhookMethod || 'POST'}
                onChange={(e) => setConfig({ ...config, webhookMethod: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderConditionConfig = () => {
    const conditionType = node.data.conditionType;

    switch (conditionType) {
      case WorkflowConditionType.TEXT_CONTAINS:
      case WorkflowConditionType.TEXT_EQUALS:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto para verificar
              </label>
              <input
                type="text"
                value={config.text || ''}
                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="texto a ser verificado"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.caseSensitive || false}
                onChange={(e) => setConfig({ ...config, caseSensitive: e.target.checked })}
                className="rounded"
              />
              Case sensitive
            </label>
          </div>
        );

      case WorkflowConditionType.USER_TAG:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag
              </label>
              <input
                type="text"
                value={config.tag || ''}
                onChange={(e) => setConfig({ ...config, tag: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="nome-da-tag"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.hasTag || true}
                onChange={(e) => setConfig({ ...config, hasTag: e.target.checked })}
                className="rounded"
              />
              Deve ter a tag
            </label>
          </div>
        );

      case WorkflowConditionType.TIME_RANGE:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Início
              </label>
              <input
                type="time"
                value={config.startTime || ''}
                onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fim
              </label>
              <input
                type="time"
                value={config.endTime || ''}
                onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDelayConfig = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tempo de espera (segundos)
        </label>
        <input
          type="number"
          value={config.delay || node.data.delay || 0}
          onChange={(e) => setConfig({ ...config, delay: parseInt(e.target.value) || 0 })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          min="0"
          placeholder="60"
        />
        <p className="text-xs text-gray-500 mt-1">
          Tempo em segundos (ex: 60 = 1 minuto, 3600 = 1 hora)
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Nó
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Nó
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nome descritivo do nó"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descrição do que este nó faz..."
            />
          </div>

          {/* Type-specific Configuration */}
          {node.type === WorkflowNodeType.TRIGGER && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuração do Gatilho</h3>
              {renderTriggerConfig()}
            </div>
          )}

          {node.type === WorkflowNodeType.ACTION && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuração da Ação</h3>
              {renderActionConfig()}
            </div>
          )}

          {node.type === WorkflowNodeType.CONDITION && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuração da Condição</h3>
              {renderConditionConfig()}
            </div>
          )}

          {node.type === WorkflowNodeType.DELAY && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuração do Atraso</h3>
              {renderDelayConfig()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}