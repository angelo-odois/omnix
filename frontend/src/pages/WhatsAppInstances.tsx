import { useState, useEffect } from 'react';
import { Plus, Smartphone, Wifi, WifiOff, AlertCircle, QrCode, Send } from 'lucide-react';
import { api } from '../lib/api';

interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  lastSeen?: string;
  settings: {
    autoReply: boolean;
    businessHours: boolean;
    maxContacts: number;
    wahaSession?: string;
  };
  createdAt: string;
}

export default function WhatsAppInstances() {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<WhatsAppInstance | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/whatsapp/instances');
      setInstances(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      setError('Nome da instância é obrigatório');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const response = await api.post('/whatsapp/instances', {
        name: newInstanceName,
        settings: {
          autoReply: false,
          businessHours: false,
          maxContacts: 1000
        }
      });

      setInstances(prev => [...prev, response.data.data]);
      setShowCreateModal(false);
      setNewInstanceName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  const connectInstance = async (instanceId: string) => {
    try {
      setConnecting(instanceId);
      setError('');

      const response = await api.post(`/whatsapp/instances/${instanceId}/connect`);
      
      // Update instance status
      setInstances(prev => prev.map(inst => 
        inst.id === instanceId 
          ? { ...inst, status: 'connecting', qrCode: response.data.data.qrCode }
          : inst
      ));

      // Show QR code modal
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        setShowQRModal({ 
          ...instance, 
          qrCode: response.data.data.qrCode,
          status: 'connecting'
        });
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar instância');
    } finally {
      setConnecting(null);
    }
  };

  const disconnectInstance = async (instanceId: string) => {
    try {
      await api.post(`/whatsapp/instances/${instanceId}/disconnect`);
      
      setInstances(prev => prev.map(inst => 
        inst.id === instanceId 
          ? { ...inst, status: 'disconnected', qrCode: undefined }
          : inst
      ));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao desconectar instância');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': return <div className="w-4 h-4 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando instâncias...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📱 Instâncias WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp Business</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Instância
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma Instância Criada
          </h2>
          <p className="text-gray-600 mb-6">
            Crie sua primeira instância WhatsApp para começar a enviar mensagens
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Primeira Instância
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map(instance => (
            <div key={instance.id} className="bg-white rounded-lg shadow-md p-6 border">
              {/* Instance Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Smartphone className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{instance.name}</h3>
                    {instance.phoneNumber && (
                      <p className="text-sm text-gray-600">{instance.phoneNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(instance.status)}`}>
                  {getStatusIcon(instance.status)}
                  <span className="ml-2">{getStatusText(instance.status)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {instance.status === 'disconnected' && (
                  <button
                    onClick={() => connectInstance(instance.id)}
                    disabled={connecting === instance.id}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    {connecting === instance.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Conectar WhatsApp
                      </>
                    )}
                  </button>
                )}

                {instance.status === 'connecting' && instance.qrCode && (
                  <button
                    onClick={() => setShowQRModal(instance)}
                    className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Ver QR Code
                  </button>
                )}

                {instance.status === 'connected' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => {/* TODO: Open chat */}}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Abrir Chat
                    </button>
                    <button
                      onClick={() => disconnectInstance(instance.id)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Desconectar
                    </button>
                  </div>
                )}

                {instance.status === 'error' && (
                  <button
                    onClick={() => connectInstance(instance.id)}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </button>
                )}
              </div>

              {/* Settings Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>📝 Auto-resposta: {instance.settings.autoReply ? 'Ativa' : 'Inativa'}</div>
                  <div>🕒 Horário comercial: {instance.settings.businessHours ? 'Ativo' : 'Inativo'}</div>
                  <div>👥 Máx. contatos: {instance.settings.maxContacts}</div>
                  {instance.lastSeen && (
                    <div>🕒 Último acesso: {new Date(instance.lastSeen).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">📱 Nova Instância WhatsApp</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="Ex: Atendimento Principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createInstance}
                disabled={creating || !newInstanceName.trim()}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">📱 Conectar WhatsApp</h2>
            <p className="text-gray-600 mb-6">
              Escaneie o QR Code com seu WhatsApp para conectar a instância <strong>{showQRModal.name}</strong>
            </p>
            
            {showQRModal.qrCode ? (
              <div className="mb-6">
                <img 
                  src={showQRModal.qrCode} 
                  alt="QR Code"
                  className="w-64 h-64 mx-auto border border-gray-200 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  QR Code válido por 20 segundos
                </p>
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto border border-gray-200 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">📱 Como conectar:</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em "Mais opções" → "WhatsApp Web"</li>
                  <li>Escaneie este QR Code</li>
                  <li>Aguarde a confirmação de conexão</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowQRModal(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => connectInstance(showQRModal.id)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Gerar Novo QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}