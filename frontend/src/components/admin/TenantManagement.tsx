import { useState, useEffect } from 'react';
import { adminService, TenantAdmin, Package } from '../../services/adminService';
import TenantPlanManager from './TenantPlanManager';

export default function TenantManagement() {
  const [tenants, setTenants] = useState<TenantAdmin[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<TenantAdmin | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, packagesData] = await Promise.all([
        adminService.getTenants(),
        adminService.getPackages()
      ]);
      setTenants(tenantsData);
      setPackages(packagesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    if (!confirm('Tem certeza que deseja suspender este tenant?')) return;
    
    try {
      await adminService.suspendTenant(tenantId);
      await loadData(); // Recarregar dados
    } catch (err: any) {
      alert('Erro ao suspender tenant: ' + err.message);
    }
  };

  const handleActivate = async (tenantId: string) => {
    try {
      await adminService.activateTenant(tenantId);
      await loadData(); // Recarregar dados
    } catch (err: any) {
      alert('Erro ao ativar tenant: ' + err.message);
    }
  };

  const handlePlanChanged = (updatedTenant: TenantAdmin, modulesChanged: any) => {
    // Atualizar a lista de tenants
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    
    // Mostrar notificação de sucesso
    alert(`Plano alterado com sucesso!\n\n📦 Módulos ativados: ${modulesChanged.activated.length}\n🔄 Módulos atualizados: ${modulesChanged.updated.length}\n❌ Módulos desativados: ${modulesChanged.deactivated.length}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando tenants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏢 Gerenciamento de Tenants</h2>
          <p className="text-gray-600">Configure e monitore todas as empresas do sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          ➕ Novo Tenant
        </button>
      </div>

      {/* Tenants List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Tenants Cadastrados ({tenants.length})
          </h3>
        </div>

        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum tenant cadastrado ainda.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Criar Primeiro Tenant
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{tenant.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBillingStatusColor(tenant.billingStatus)}`}>
                        {tenant.billingStatus}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Email:</strong> {tenant.email}</p>
                        <p><strong>Slug:</strong> {tenant.slug}</p>
                        {tenant.domain && <p><strong>Domínio:</strong> {tenant.domain}</p>}
                      </div>
                      
                      <div>
                        <p><strong>Pacote:</strong> {tenant.package?.name || 'N/A'}</p>
                        <p><strong>Preço:</strong> {tenant.package ? `R$ ${tenant.package.price}/mês` : 'N/A'}</p>
                        <p><strong>Criado:</strong> {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <div>
                        <p><strong>Usuários:</strong> {tenant.usage.currentUsers}/{tenant.package?.limits.maxUsers === -1 ? '∞' : tenant.package?.limits.maxUsers}</p>
                        <p><strong>Instâncias:</strong> {tenant.usage.currentInstances}/{tenant.package?.limits.maxInstances === -1 ? '∞' : tenant.package?.limits.maxInstances}</p>
                        <p><strong>Mensagens/mês:</strong> {tenant.usage.messagesThisMonth.toLocaleString()}</p>
                      </div>
                    </div>

                    {tenant.billingStatus === 'trial' && tenant.trialEndsAt && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <span className="text-blue-600">🎯 Trial expira em: </span>
                        <span className="font-medium">
                          {new Date(tenant.trialEndsAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {tenant.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(tenant.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100"
                      >
                        🚫 Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(tenant.id)}
                        className="px-3 py-1 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100"
                      >
                        ✅ Ativar
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTenantForPlan(tenant)}
                      className="px-3 py-1 bg-purple-50 text-purple-600 rounded text-sm font-medium hover:bg-purple-100"
                    >
                      🔄 Alterar Plano
                    </button>
                    <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100">
                      ✏️ Editar
                    </button>
                    <button className="px-3 py-1 bg-gray-50 text-gray-600 rounded text-sm font-medium hover:bg-gray-100">
                      👁️ Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de criação - placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Novo Tenant</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Funcionalidade de criação de tenants será implementada em breve.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Manager Modal */}
      {selectedTenantForPlan && (
        <TenantPlanManager
          tenant={selectedTenantForPlan}
          onPlanChanged={handlePlanChanged}
          onClose={() => setSelectedTenantForPlan(null)}
        />
      )}
    </div>
  );
}