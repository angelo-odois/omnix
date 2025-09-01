import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Phone, 
  Clock,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Plus,
  MoreVertical,
  Send,
  MessageCircle,
  UserCheck,
  BarChart3,
  X
} from 'lucide-react';
import { api } from '../lib/api';

interface DashboardMetrics {
  totalMessages: number;
  totalConversations: number;
  activeInstances: number;
  responseTime: number;
  messagesGrowth: number;
  conversationsGrowth: number;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSeen?: string;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'conversation' | 'connection';
  title: string;
  description: string;
  time: string;
  status?: 'success' | 'warning' | 'error';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMessages: 0,
    totalConversations: 0,
    activeInstances: 0,
    responseTime: 0,
    messagesGrowth: 0,
    conversationsGrowth: 0
  });
  
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const [metricsRes, instancesRes, conversationsRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/whatsapp/instances'),
        api.get('/messages/conversations?limit=5')
      ]);

      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.data);
      }

      if (instancesRes.data.success) {
        setInstances(instancesRes.data.data || []);
      }

      // Generate recent activity from conversations
      if (conversationsRes.data.success) {
        const conversations = conversationsRes.data.data || [];
        const activities: RecentActivity[] = conversations.map((conv: any, index: number) => ({
          id: conv.id,
          type: 'conversation' as const,
          title: conv.contactName || conv.contactPhone,
          description: conv.lastMessage || 'Nova conversa',
          time: formatRelativeTime(conv.lastMessageAt || conv.createdAt),
          status: index < 2 ? 'success' : undefined
        }));
        
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  // Quick Actions Functions
  const handleNewInstance = () => {
    setShowNewInstanceModal(true);
  };

  const handleMessages = () => {
    navigate('/chat');
  };

  const handleContacts = () => {
    navigate('/contacts');
  };

  const handleReports = () => {
    // Create a simple reports page navigation
    navigate('/reports');
  };

  const createNewInstance = async (instanceName: string) => {
    try {
      const response = await api.post('/whatsapp/instances', {
        name: instanceName
      });
      
      if (response.data.success) {
        setShowNewInstanceModal(false);
        loadDashboardData(); // Refresh data
        console.log('✅ New instance created:', instanceName);
      }
    } catch (error) {
      console.error('❌ Error creating instance:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          
          <button 
            onClick={handleNewInstance}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-gradient text-white rounded-lg hover:shadow-primary-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Messages */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Mensagens</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">{formatNumber(metrics.totalMessages)}</p>
              {metrics.messagesGrowth !== 0 && (
                <p className={`text-sm mt-2 flex items-center ${metrics.messagesGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {metrics.messagesGrowth > 0 ? '+' : ''}{metrics.messagesGrowth.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Total Conversations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversas</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">{formatNumber(metrics.totalConversations)}</p>
              {metrics.conversationsGrowth !== 0 && (
                <p className={`text-sm mt-2 flex items-center ${metrics.conversationsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {metrics.conversationsGrowth > 0 ? '+' : ''}{metrics.conversationsGrowth.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </div>

        {/* Active Instances */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Instâncias Ativas</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">{metrics.activeInstances}</p>
              <p className="text-sm mt-2 text-gray-500">de {instances.length} total</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">{metrics.responseTime}s</p>
              <p className="text-sm mt-2 text-green-600 flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Excelente
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WhatsApp Instances */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark-900">Instâncias WhatsApp</h2>
            <button className="text-primary-600 hover:text-primary-700 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {instances.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma instância conectada</p>
                <button className="mt-4 px-4 py-2 bg-primary-gradient text-white rounded-lg text-sm">
                  Conectar WhatsApp
                </button>
              </div>
            ) : (
              instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${getStatusColor(instance.status)}`}>
                      {getStatusIcon(instance.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-dark-900">{instance.name}</h3>
                      <p className="text-sm text-gray-500">
                        {instance.phoneNumber || 'Sem número'}
                        {instance.lastSeen && ` • ${formatRelativeTime(instance.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {instance.status === 'connected' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(instance.status)}`}>
                      {instance.status === 'connected' ? 'Conectado' :
                       instance.status === 'connecting' ? 'Conectando' :
                       instance.status === 'error' ? 'Erro' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-dark-900">Atividade Recente</h2>
            <button className="text-primary-600 hover:text-primary-700 transition-colors text-sm">
              Ver todas
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma atividade</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1.5 rounded-full mt-1 ${
                    activity.type === 'message' ? 'bg-primary-100' :
                    activity.type === 'conversation' ? 'bg-secondary-100' : 'bg-gray-100'
                  }`}>
                    {activity.type === 'message' && <Send className="w-3 h-3 text-primary-600" />}
                    {activity.type === 'conversation' && <MessageCircle className="w-3 h-3 text-secondary-600" />}
                    {activity.type === 'connection' && <UserCheck className="w-3 h-3 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-dark-900 mb-6">Ações Rápidas</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleNewInstance}
            className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-primary-100 p-3 rounded-full">
              <Plus className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-dark-900">Nova Instância</span>
          </button>
          
          <button 
            onClick={handleMessages}
            className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-secondary-100 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-secondary-600" />
            </div>
            <span className="text-sm font-medium text-dark-900">Mensagens</span>
          </button>
          
          <button 
            onClick={handleContacts}
            className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-yellow-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-dark-900">Contatos</span>
          </button>
          
          <button 
            onClick={handleReports}
            className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-dark-900">Relatórios</span>
          </button>
        </div>
      </div>

      {/* New Instance Modal */}
      {showNewInstanceModal && (
        <NewInstanceModal 
          onClose={() => setShowNewInstanceModal(false)}
          onSuccess={() => loadDashboardData()}
        />
      )}
    </div>
  );
};

// New Instance Modal Component
const NewInstanceModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [instanceName, setInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanceName.trim()) return;

    setIsCreating(true);
    try {
      const response = await api.post('/whatsapp/instances', {
        name: instanceName.trim()
      });
      
      if (response.data.success) {
        console.log('✅ Instance created:', instanceName);
        onClose();
        onSuccess();
      }
    } catch (error: any) {
      console.error('❌ Error creating instance:', error);
      alert(error.response?.data?.message || 'Erro ao criar instância');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Nova Instância WhatsApp</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4">
          <div className="mb-4">
            <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Instância
            </label>
            <input
              type="text"
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Atendimento Comercial"
              required
              disabled={isCreating}
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-gradient text-white rounded-lg hover:shadow-primary-lg transition-all disabled:opacity-50"
              disabled={isCreating || !instanceName.trim()}
            >
              {isCreating ? 'Criando...' : 'Criar Instância'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;