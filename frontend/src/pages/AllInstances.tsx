import { useState, useEffect } from 'react';
import { 
  Trash2, 
  Power, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Building,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { instanceService } from '../services/instanceService';
import { useNotificationStore } from '../store/notificationStore';
import { api } from '../lib/api';

interface InstanceWithTenant {
  id: string;
  tenantId: string;
  tenantName?: string;
  tenantEmail?: string;
  name: string;
  phoneNumber?: string;
  status: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AllInstances() {
  const [instances, setInstances] = useState<InstanceWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{id: string; name: string; tenant: string} | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  const loadInstances = async () => {
    try {
      setLoading(true);
      
      // Usar o service de API configurado
      const response = await api.get('/whatsapp/instances');
      setInstances(response.data.data || []);
    } catch (error) {
      console.error('Error loading instances:', error);
      addNotification({
        type: 'warning',
        title: 'Erro ao carregar instâncias',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        priority: 'normal'
      });
      // Usar dados mock como fallback
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'connecting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'connecting':
        return 'Conectando';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const handleDeleteInstance = async () => {
    if (!confirmDelete) return;
    
    try {
      setDeleting(confirmDelete.id);
      
      const result = await instanceService.deleteInstance(confirmDelete.id);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Instância Removida',
          message: `Instância ${confirmDelete.name} foi removida permanentemente`,
          priority: 'normal'
        });
        
        // Reload instances
        await loadInstances();
      } else {
        throw new Error(result.message || 'Falha ao remover instância');
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
      addNotification({
        type: 'warning',
        title: 'Erro ao Remover Instância',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        priority: 'high'
      });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const handleDisconnectInstance = async (instanceId: string, instanceName: string) => {
    try {
      const result = await instanceService.disconnectInstance(instanceId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Instância Desconectada',
          message: `Instância ${instanceName} foi desconectada`,
          priority: 'normal'
        });
        
        await loadInstances();
      } else {
        throw new Error(result.message || 'Falha ao desconectar instância');
      }
    } catch (error) {
      addNotification({
        type: 'warning',
        title: 'Erro ao Desconectar',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        priority: 'normal'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando instâncias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todas as Instâncias</h1>
          <p className="text-gray-600 mt-1">Gerenciar instâncias WhatsApp de todos os tenants</p>
        </div>
        
        <button
          onClick={loadInstances}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Instâncias WhatsApp ({instances.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="p-4 text-sm font-medium text-gray-600">Instância</th>
                <th className="p-4 text-sm font-medium text-gray-600">Tenant</th>
                <th className="p-4 text-sm font-medium text-gray-600">Número</th>
                <th className="p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="p-4 text-sm font-medium text-gray-600">Criado em</th>
                <th className="p-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instances.length ? instances.map((instance) => (
                <tr key={instance.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{instance.name}</p>
                        <p className="text-sm text-gray-500">ID: {instance.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{instance.tenantName}</p>
                        <p className="text-xs text-gray-500">{instance.tenantEmail}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <p className="text-sm text-gray-900">
                      {instance.phoneNumber || 'Não configurado'}
                    </p>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instance.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(instance.status)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(instance.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex gap-2">
                      {instance.status === 'connected' && (
                        <button
                          onClick={() => handleDisconnectInstance(instance.id, instance.name)}
                          className="flex items-center px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                          title="Desconectar instância"
                        >
                          <Power className="w-3 h-3 mr-1" />
                          Desconectar
                        </button>
                      )}
                      
                      <button
                        onClick={() => setConfirmDelete({
                          id: instance.id, 
                          name: instance.name,
                          tenant: instance.tenantName || instance.tenantEmail || 'Desconhecido'
                        })}
                        disabled={deleting === instance.id}
                        className="flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remover instância permanentemente"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {deleting === instance.id ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <p className="text-gray-500">Nenhuma instância encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Remover Instância</h3>
                <p className="text-sm text-gray-600">Esta ação é permanente</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Você está prestes a remover permanentemente:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <p className="font-medium text-gray-900">{confirmDelete.name}</p>
                <p className="text-sm text-gray-600">Tenant: {confirmDelete.tenant}</p>
              </div>
              
              <div className="mt-4 text-sm text-red-600 space-y-1">
                <p className="font-medium">⚠️ Consequências:</p>
                <p>• Instância será desconectada do WhatsApp</p>
                <p>• Todas as conversas serão apagadas</p>
                <p>• Histórico de mensagens será perdido</p>
                <p>• Esta ação NÃO pode ser desfeita</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={!!deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteInstance}
                disabled={!!deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Removendo...
                  </span>
                ) : (
                  'Sim, Remover Permanentemente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}