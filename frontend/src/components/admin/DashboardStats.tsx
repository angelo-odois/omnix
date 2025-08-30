import { useState, useEffect } from 'react';
import { adminService, AdminStats } from '../../services/adminService';

export default function DashboardStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando estatísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🏢</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Tenants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalTenants}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">{stats.activeTenants}</span>
              <span className="text-gray-500"> ativos</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-blue-600">{formatCurrency(stats.monthlyRevenue)}</span>
              <span className="text-gray-500"> mensal</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">{stats.activeUsers}</span>
              <span className="text-gray-500"> ativos</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sistema</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stats.systemHealth.status)}`}>
                      {stats.systemHealth.status === 'healthy' ? '✅ Saudável' : '⚠️ Atenção'}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="font-medium text-blue-600">{stats.systemHealth.uptime}%</span>
              <span className="text-gray-500"> uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Pacotes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📦 Distribuição de Pacotes</h3>
          <div className="space-y-4">
            {stats.packagesDistribution.map((pkg) => (
              <div key={pkg.packageId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{pkg.packageName}</p>
                  <p className="text-sm text-gray-500">{pkg.count} tenants</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(pkg.revenue)}</p>
                  <p className="text-sm text-gray-500">receita</p>
                </div>
              </div>
            ))}
            {stats.packagesDistribution.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum tenant cadastrado ainda</p>
            )}
          </div>
        </div>

        {/* Cadastros Recentes */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🆕 Cadastros Recentes</h3>
          <div className="space-y-4">
            {stats.recentSignups.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-500">{tenant.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tenant.billingStatus === 'trial' ? '🆓 Trial' : '💰 Pagante'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentSignups.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum cadastro recente</p>
            )}
          </div>
        </div>
      </div>

      {/* Saúde do Sistema */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Saúde do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.systemHealth.uptime}%</p>
            <p className="text-sm text-gray-500">Uptime</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.systemHealth.responseTime}ms</p>
            <p className="text-sm text-gray-500">Tempo de Resposta</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.systemHealth.errorRate}%</p>
            <p className="text-sm text-gray-500">Taxa de Erro</p>
          </div>
        </div>
      </div>
    </div>
  );
}