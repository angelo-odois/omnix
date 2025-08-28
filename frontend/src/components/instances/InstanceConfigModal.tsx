import { useState } from 'react';
import { X, Settings, QrCode, Key, Globe, RefreshCw, Save, Trash2, CheckCircle } from 'lucide-react';
import type { WAHAInstance } from '../../types/instance';
import Button from '../ui/Button';

interface InstanceConfigModalProps {
  instance: WAHAInstance;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstanceConfigModal({
  instance,
  isOpen,
  onClose,
}: InstanceConfigModalProps) {
  const [config, setConfig] = useState({
    name: instance.name,
    webhookUrl: instance.webhookUrl || '',
    apiKey: instance.apiKey || '',
  });
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Implementar salvamento
    alert('Configurações salvas com sucesso!');
    onClose();
  };

  const handleRestart = () => {
    if (confirm('Deseja reiniciar esta instância?')) {
      // Implementar restart
      alert('Instância reiniciada!');
    }
  };

  const handleDelete = () => {
    if (confirm('Deseja realmente remover esta instância? Esta ação não pode ser desfeita.')) {
      // Implementar delete
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Configurar Instância
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {instance.name} - {instance.number}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Status da Conexão</p>
                <div className="flex items-center gap-2 mt-1">
                  {instance.status === 'connected' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">Conectado</span>
                    </>
                  ) : instance.status === 'qr_code' ? (
                    <>
                      <QrCode className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-700 font-medium">Aguardando QR Code</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-red-700 font-medium">Desconectado</span>
                    </>
                  )}
                </div>
              </div>
              {instance.status === 'qr_code' && (
                <Button
                  size="sm"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver QR Code
                </Button>
              )}
            </div>
          </div>

          {/* QR Code */}
          {showQR && instance.status === 'qr_code' && (
            <div className="mb-6 p-6 bg-gray-100 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-4">Escaneie o QR Code</h3>
              <div className="bg-white p-4 rounded-lg inline-block">
                <img
                  src={instance.qrCode || 'https://via.placeholder.com/256'}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Abra o WhatsApp no seu celular e escaneie o código para conectar
              </p>
            </div>
          )}

          {/* Configurações */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Instância
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Globe className="w-4 h-4" />
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://seu-dominio.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                URL que receberá eventos de mensagens e status
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Key className="w-4 h-4" />
                API Key
              </label>
              <input
                type="text"
                placeholder="Chave de API para autenticação"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Use esta chave para autenticar requisições à API WAHA
              </p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Mensagens enviadas</p>
                <p className="text-2xl font-bold text-blue-900">
                  {instance.messagesCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Última atividade</p>
                <p className="text-sm font-medium text-blue-900">
                  {instance.lastSeen
                    ? new Date(instance.lastSeen).toLocaleString('pt-BR')
                    : 'Nunca'}
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleRestart}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}