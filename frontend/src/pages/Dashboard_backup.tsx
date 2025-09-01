import { 
  MessageSquare, 
  Users, 
  Phone, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useState } from 'react';
import ModuleStatusWidget from '../components/dashboard/ModuleStatusWidget';
import { useDashboard } from '../hooks/useDashboard';
import { instanceService } from '../services/instanceService';
import type { PeriodFilter } from '../services/dashboardService';
import { withPageId, withComponentId, withFeatureId } from '../utils/componentId';

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}min`;
};

const formatChange = (current: number, previous: number): string => {
  if (previous === 0) return '+100%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const periodOptions: { value: PeriodFilter['period']; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'year', label: 'Este ano' }
];

export default function Dashboard() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState<{instanceId: string; instanceName: string} | null>(null);
  const [terminating, setTerminating] = useState<string | null>(null);
  
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    filter, 
    updateFilter, 
    refresh, 
    exportData,
    isStale 
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });


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

  const handlePeriodChange = (period: PeriodFilter['period']) => {
    updateFilter({ period });
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    await exportData(format);
    setShowExportModal(false);
  };

  const handleTerminateInstance = async (instanceId: string) => {
    if (!confirmTerminate) return;
    
    try {
      setTerminating(instanceId);
      
      const result = await instanceService.deleteInstance(instanceId);
      
      if (result.success) {
        console.log('✅ Instance terminated:', confirmTerminate.instanceName);
        
        // Refresh dashboard data
        refresh();
      } else {
        throw new Error(result.message || 'Falha ao encerrar instância');
      }
    } catch (error) {
      console.error('❌ Error terminating instance:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTerminating(null);
      setConfirmTerminate(null);
    }
  };

  const handleDisconnectInstance = async (instanceId: string, instanceName: string) => {
    try {
      const result = await instanceService.disconnectInstance(instanceId);
      
      if (result.success) {
        console.log('✅ Instance disconnected:', instanceName);
        
        // Refresh dashboard data
        refresh();
      } else {
        throw new Error(result.message || 'Falha ao desconectar instância');
      }
    } catch (error) {
      console.error('❌ Error disconnecting instance:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar dashboard</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => refresh()}
              className="mt-2 bg-red-100 px-3 py-1 rounded text-sm text-red-800 hover:bg-red-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats: StatCard[] = (data && data.metrics) ? [
    {
      label: 'Conversas Ativas',
      value: data.metrics.conversations?.active || 0,
      change: data.metrics.conversations?.active ? formatChange(data.metrics.conversations.active, (data.metrics.conversations.total || 0) - data.metrics.conversations.active) : undefined,
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      label: 'Contatos',
      value: formatNumber(data.metrics.contacts?.total || 0),
      change: data.metrics.contacts?.total ? formatChange(data.metrics.contacts.total, data.metrics.contacts.total - (data.metrics.contacts.new || 0)) : undefined,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Números Ativos',
      value: data.metrics.instances?.connected || 0,
      icon: Phone,
      color: 'bg-purple-500',
    },
    {
      label: 'Tempo Médio',
      value: formatTime(data.metrics.messages?.avgResponseTime || 0),
      change: data.metrics.messages?.avgResponseTime ? formatChange(data.metrics.messages.avgResponseTime, data.metrics.messages.avgResponseTime * 1.1) : undefined,
      icon: Clock,
      color: 'bg-orange-500',
    },
  ] : [
    {
      label: 'Conversas Ativas',
      value: 0,
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      label: 'Contatos',
      value: 0,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Números Ativos',
      value: 0,
      icon: Phone,
      color: 'bg-purple-500',
    },
    {
      label: 'Tempo Médio',
      value: '0min',
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div {...withPageId('Dashboard')} className="space-y-6">
      <div {...withComponentId('DashboardHeader')} className="flex items-center justify-between">
        <div {...withComponentId('DashboardHeader', 'title')}>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do sistema
            {lastUpdated && (
              <span className="text-sm ml-2">
                • Atualizado {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Period Filter */}
          <select 
            value={filter.period}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodFilter['period'])}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            
            {showExportModal && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Excel (XLSX)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className={`flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              loading ? 'animate-pulse' : ''
            } ${isStale ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : isStale ? 'Desatualizado' : 'Atualizar'}
          </button>
          
        </div>
      </div>

      <div {...withComponentId('StatsGrid')} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div 
            {...withComponentId('StatCard', stat.label.toLowerCase().replace(/\s+/g, '-'))}
            key={stat.label} 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            data-stat-label={stat.label}
            data-stat-value={stat.value}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change && (
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Status Widget */}
        <div className="lg:col-span-1">
          <ModuleStatusWidget />
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Status das Instâncias</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/all-instances'}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas →
                </button>
                <button
                  onClick={refresh}
                  className="text-sm text-gray-600 hover:text-gray-700"
                  title="Atualizar instâncias"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.instances?.length ? data.instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instance.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(instance.status)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{instance.name}</p>
                      <p className="text-sm text-gray-600">
                        {instance.phoneNumber || 'Não configurado'}
                      </p>
                      {instance.tenantName && (
                        <p className="text-xs text-gray-500">
                          Tenant: {instance.tenantName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{instance.messagesToday}</p>
                      <p className="text-sm text-gray-600">mensagens hoje</p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {instance.status === 'connected' && (
                        <button
                          onClick={() => handleDisconnectInstance(instance.id, instance.name)}
                          className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                          title="Desconectar instância"
                        >
                          Desconectar
                        </button>
                      )}
                      
                      <button
                        onClick={() => setConfirmTerminate({instanceId: instance.id, instanceName: instance.name})}
                        disabled={terminating === instance.id}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Encerrar instância permanentemente"
                      >
                        {terminating === instance.id ? 'Encerrando...' : 'Encerrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma instância encontrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.recentActivity?.length ? data.recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'message' ? 'bg-blue-500' :
                    activity.type === 'conversation' ? 'bg-green-500' :
                    activity.type === 'instance' ? 'bg-purple-500' :
                    'bg-orange-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Performance da Equipe</h2>
            <div className="text-sm text-gray-500">
              Período: {periodOptions.find(p => p.value === filter.period)?.label}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 text-sm font-medium text-gray-600">Operador</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Atendimentos</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Tempo Médio</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Satisfação</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.teamPerformance?.length ? data.teamPerformance.map((member) => (
                  <tr key={member.userId}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                          <p className="text-xs text-gray-500">Operador</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">{member.conversationsToday}</td>
                    <td className="py-4 text-sm text-gray-900">{formatTime(member.avgResponseTime)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">{member.satisfaction}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'online' ? 'bg-green-100 text-green-800' :
                        member.status === 'away' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {member.status === 'online' ? 'Online' :
                         member.status === 'away' ? 'Ausente' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <p className="text-gray-500">Nenhum membro da equipe encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Debug Component - Temporary */}

      {/* Confirmation Modal */}
      {confirmTerminate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Encerrar Instância</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Tem certeza que deseja encerrar permanentemente a instância:
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-md">
                {confirmTerminate.instanceName}
              </p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>• A instância será desconectada do WhatsApp</p>
                <p>• Todas as conversas serão removidas</p>
                <p>• Esta ação é irreversível</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmTerminate(null)}
                disabled={!!terminating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleTerminateInstance(confirmTerminate.instanceId)}
                disabled={!!terminating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {terminating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Encerrando...
                  </span>
                ) : (
                  'Sim, Encerrar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}