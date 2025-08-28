import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Plus, Settings, RefreshCw, Trash2, CheckCircle, XCircle, AlertCircle, ShoppingCart, ArrowRightLeft, Smartphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instanceService } from '../services/instanceService';
import { stripeService, type PendingRequest } from '../services/stripeService';
import type { SalvyNumber, WAHAInstance } from '../types/instance';
import Button from '../components/ui/Button';
import PurchaseNumberModal from '../components/instances/PurchaseNumberModal';
import PortabilityModal from '../components/instances/PortabilityModal';
import InstanceConfigModal from '../components/instances/InstanceConfigModal';
import InstanceSetupModal from '../components/instances/InstanceSetupModal';
import PendingRequestCard from '../components/instances/PendingRequestCard';
import OwnNumberModal from '../components/instances/OwnNumberModal';

export default function Instances() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  // Debug: verificar se há token
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Instances page - Token exists:', !!token);
  }, []);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPortabilityModal, setShowPortabilityModal] = useState(false);
  const [showOwnNumberModal, setShowOwnNumberModal] = useState(false);
  const [showInstanceSetupModal, setShowInstanceSetupModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WAHAInstance | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);

  // Check for Stripe redirect parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      setPaymentStatus('success');
      // Refresh owned numbers after successful payment
      queryClient.invalidateQueries({ queryKey: ['owned-numbers'] });
      
      // Clean URL
      window.history.replaceState({}, '', '/instances');
      
      // Show success message
      setTimeout(() => {
        setPaymentStatus(null);
      }, 5000);
    } else if (canceled === 'true') {
      setPaymentStatus('canceled');
      
      // Clean URL
      window.history.replaceState({}, '', '/instances');
      
      // Show canceled message
      setTimeout(() => {
        setPaymentStatus(null);
      }, 5000);
    }
  }, [searchParams, queryClient]);

  // Fetch owned numbers
  const { data: ownedNumbers = [], isLoading: loadingNumbers, error: numbersError } = useQuery({
    queryKey: ['owned-numbers'],
    queryFn: instanceService.getOwnedNumbers,
    retry: false,
  });

  // Fetch WAHA instances
  const { data: instances = [], isLoading: loadingInstances, error: instancesError } = useQuery({
    queryKey: ['waha-instances'],
    queryFn: instanceService.getInstances,
    retry: false,
  });
  
  // Debug errors
  useEffect(() => {
    if (numbersError) {
      console.error('Numbers error:', numbersError);
    }
    if (instancesError) {
      console.error('Instances error:', instancesError);
    }
  }, [numbersError, instancesError]);

  // Fetch pending requests
  const { data: pendingRequestsData, isLoading: loadingPendingRequests } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const result = await stripeService.getPendingRequests();
      return result.requests || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Cancel number mutation
  const cancelNumberMutation = useMutation({
    mutationFn: instanceService.cancelNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-numbers'] });
    },
  });

  // Cancel pending request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: stripeService.cancelPendingRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
  });

  // Restart instance mutation
  const restartInstanceMutation = useMutation({
    mutationFn: instanceService.restartInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waha-instances'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connecting: 'Conectando',
      active: 'Ativo',
      inactive: 'Inativo',
      qr_code: 'Aguardando QR',
      error: 'Erro',
      WORKING: 'Conectado',
      SCAN_QR_CODE: 'Aguardando QR',
      STARTING: 'Iniciando',
      STOPPED: 'Parado',
      FAILED: 'Falhou'
    };
    return statusMap[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Handle resume payment
  const handleResumePayment = async (request: PendingRequest) => {
    // Create new checkout session with existing request data
    const result = await stripeService.createCheckoutSession({
      areaCode: request.areaCode,
      redirectNumber: request.redirectNumber,
      displayName: request.displayName,
      requestId: request.id,
      mode: 'payment'
    });
    
    if (!result.success) {
      alert(result.message || 'Erro ao retomar pagamento');
    }
  };

  if (loadingNumbers || loadingInstances || loadingPendingRequests) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingRequests = pendingRequestsData || [];

  return (
    <div className="space-y-6">
      {/* Payment Status Notification */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-green-900">Pagamento confirmado!</h3>
              <p className="text-sm text-green-700">Seu número virtual está sendo criado e estará disponível em breve.</p>
            </div>
          </div>
        </div>
      )}
      
      {paymentStatus === 'canceled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900">Pagamento cancelado</h3>
              <p className="text-sm text-yellow-700">O processo de aquisição foi cancelado. Você pode tentar novamente quando desejar.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payment Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <PendingRequestCard
              key={request.id}
              request={request}
              onResume={handleResumePayment}
              onCancel={(requestId) => {
                if (confirm('Deseja cancelar esta solicitação?')) {
                  cancelRequestMutation.mutate(requestId);
                }
              }}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Números e Instâncias</h1>
          <p className="text-gray-600 mt-1">Gerencie seus números WhatsApp e instâncias WAHA</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowInstanceSetupModal(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Nova Instância WAHA
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowOwnNumberModal(true)}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Número Próprio
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowPortabilityModal(true)}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Portabilidade
          </Button>
          <Button onClick={() => setShowPurchaseModal(true)}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adquirir Número
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{ownedNumbers.length}</p>
          <p className="text-sm text-gray-600 mt-1">Números Ativos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {instances.filter(i => i.status === 'connected').length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Instâncias Conectadas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{instances.length}</p>
          <p className="text-sm text-gray-600 mt-1">Total de Instâncias</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(ownedNumbers.reduce((acc, n) => acc + (n.monthlyPrice || 0), 0))}
          </p>
          <p className="text-sm text-gray-600 mt-1">Custo Mensal</p>
        </div>
      </div>

      {/* Numbers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Números Contratados</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {ownedNumbers.length === 0 ? (
            <div className="p-8 text-center">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum número contratado ainda</p>
              <Button
                className="mt-4"
                onClick={() => setShowPurchaseModal(true)}
              >
                Adquirir Primeiro Número
              </Button>
            </div>
          ) : (
            ownedNumbers.map((number) => (
              <div key={number.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(number.status || 'active')}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {number.phoneNumber === 'Aguardando conexão' ? 'Aguardando conexão...' : 
                           number.phoneNumber ? `+${number.phoneNumber}` : number.number}
                        </p>
                        {number.displayName && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {number.displayName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {number.metadata?.type === 'own_number' ? (
                          <>
                            <span className="text-sm text-blue-600 font-medium">
                              📱 Número Próprio
                            </span>
                            <span className="text-sm text-green-600 font-medium">
                              Sem custo
                            </span>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">
                              {number.city}, {number.state}
                            </p>
                            <span className="text-sm text-gray-500">
                              {formatPrice(number.monthlyPrice || 29.90)}/mês
                            </span>
                          </>
                        )}
                        {number.metadata?.wahaSessionName && (
                          <span className="text-sm text-purple-600">
                            🔗 WAHA: {number.metadata.wahaSessionName}
                          </span>
                        )}
                        {number.metadata?.status === 'connected' && (
                          <span className="text-sm text-green-600">
                            ✓ Conectado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!number.connectedInstance && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Criar instância para este número
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Criar Instância
                      </Button>
                    )}
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        if (confirm('Deseja realmente cancelar este número?')) {
                          cancelNumberMutation.mutate(number.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WAHA Instances */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Instâncias WhatsApp (WAHA)</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {instances.length === 0 ? (
            <div className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma instância configurada</p>
              <p className="text-sm text-gray-400 mt-2">
                Adquira um número primeiro para criar uma instância
              </p>
            </div>
          ) : (
            instances.map((instance) => (
              <div key={instance.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(instance.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{instance.name}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          instance.status === 'connected' 
                            ? 'bg-green-100 text-green-700'
                            : instance.status === 'qr_code'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {getStatusText(instance.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {instance.number && (
                          <p className="text-sm text-gray-600">
                            📱 {instance.number.startsWith('+') ? instance.number : `+${instance.number}`}
                          </p>
                        )}
                        {instance.metadata?.displayName && (
                          <span className="text-sm text-gray-500">
                            {instance.metadata.displayName}
                          </span>
                        )}
                        {instance.metadata?.type === 'own_number' && (
                          <span className="text-sm text-blue-600 font-medium">
                            Número Próprio
                          </span>
                        )}
                        {instance.messagesCount !== undefined && instance.messagesCount > 0 && (
                          <span className="text-sm text-gray-500">
                            {instance.messagesCount} mensagens
                          </span>
                        )}
                        {instance.lastSeen && (
                          <span className="text-sm text-gray-400">
                            Última atividade: {new Date(instance.lastSeen).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => setSelectedInstance(instance)}
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => restartInstanceMutation.mutate(instance.id)}
                    >
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {showInstanceSetupModal && (
        <InstanceSetupModal
          isOpen={showInstanceSetupModal}
          onClose={() => setShowInstanceSetupModal(false)}
        />
      )}

      {showPurchaseModal && (
        <PurchaseNumberModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false);
            queryClient.invalidateQueries({ queryKey: ['owned-numbers'] });
          }}
        />
      )}

      {showPortabilityModal && (
        <PortabilityModal
          isOpen={showPortabilityModal}
          onClose={() => setShowPortabilityModal(false)}
        />
      )}

      {selectedInstance && (
        <InstanceConfigModal
          instance={selectedInstance}
          isOpen={!!selectedInstance}
          onClose={() => setSelectedInstance(null)}
        />
      )}

      {showOwnNumberModal && (
        <OwnNumberModal
          isOpen={showOwnNumberModal}
          onClose={() => setShowOwnNumberModal(false)}
          onSuccess={() => {
            setShowOwnNumberModal(false);
            queryClient.invalidateQueries({ queryKey: ['owned-numbers'] });
            queryClient.invalidateQueries({ queryKey: ['waha-instances'] });
          }}
        />
      )}
    </div>
  );
}