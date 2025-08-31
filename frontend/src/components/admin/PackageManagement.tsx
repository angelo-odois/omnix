import { useState, useEffect } from 'react';
import { adminService, Package } from '../../services/adminService';
import PackageEditor from './PackageEditor';

export default function PackageManagement() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPackages();
      setPackages(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pacotes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setShowEditor(true);
  };

  const handlePackageSaved = (savedPackage: Package) => {
    if (editingPackage) {
      // Atualizar pacote existente
      setPackages(prev => prev.map(p => p.id === savedPackage.id ? savedPackage : p));
    } else {
      // Adicionar novo pacote
      setPackages(prev => [savedPackage, ...prev]);
    }
    setShowEditor(false);
    setEditingPackage(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando pacotes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={loadPackages}
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
          <h2 className="text-2xl font-bold text-gray-900">📦 Gerenciamento de Pacotes</h2>
          <p className="text-gray-600">Configure os planos e preços do sistema</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          ➕ Novo Pacote
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-lg border border-gray-200 relative">
            {pkg.isPopular && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                ⭐ Popular
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {pkg.isActive ? '✅ Ativo' : '❌ Inativo'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  {formatCurrency(pkg.price)}
                </span>
                <span className="text-gray-500">/{pkg.billingInterval === 'monthly' ? 'mês' : 'ano'}</span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Recursos:</h4>
                <div className="space-y-1">
                  {pkg.features.slice(0, 3).map((feature) => (
                    <div key={feature.id} className="flex items-center text-sm">
                      <span className={feature.included ? '✅' : '❌'}></span>
                      <span className="ml-2 text-gray-600">
                        {feature.name}
                        {feature.limit && ` (${feature.limit})`}
                      </span>
                    </div>
                  ))}
                  {pkg.features.length > 3 && (
                    <p className="text-sm text-gray-500">+ {pkg.features.length - 3} recursos adicionais</p>
                  )}
                </div>
              </div>

              {/* Limits */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Limites:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>👥 {pkg.limits.maxUsers === -1 ? '∞' : pkg.limits.maxUsers} usuários</div>
                  <div>📱 {pkg.limits.maxInstances === -1 ? '∞' : pkg.limits.maxInstances} instâncias</div>
                  <div>💬 {pkg.limits.maxMessagesPerMonth === -1 ? '∞' : pkg.limits.maxMessagesPerMonth.toLocaleString()} msgs/mês</div>
                  <div>💾 {pkg.limits.storageGB}GB storage</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded font-medium hover:bg-blue-100"
                >
                  ✏️ Editar
                </button>
                <button
                  className="px-3 py-2 text-gray-400 hover:text-red-600"
                  title="Excluir pacote"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum pacote configurado ainda.</p>
          <button
            onClick={handleCreate}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Criar Primeiro Pacote
          </button>
        </div>
      )}

      {/* Package Editor Modal */}
      {showEditor && (
        <PackageEditor
          package={editingPackage}
          onSave={handlePackageSaved}
          onClose={() => {
            setShowEditor(false);
            setEditingPackage(null);
          }}
        />
      )}
    </div>
  );
}