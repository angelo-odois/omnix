import { useState, useEffect } from 'react';
import { adminService, Package, TenantAdmin } from '../../services/adminService';

interface TenantPlanManagerProps {
  tenant: TenantAdmin;
  onPlanChanged: (updatedTenant: TenantAdmin, modulesChanged: any) => void;
  onClose: () => void;
}

export default function TenantPlanManager({ tenant, onPlanChanged, onClose }: TenantPlanManagerProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(tenant.packageId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await adminService.getPackages();
      setPackages(packagesData.filter(pkg => pkg.isActive));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pacotes');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async () => {
    if (selectedPackageId === tenant.packageId) {
      onClose();
      return;
    }

    try {
      setChanging(true);
      setError(null);
      
      const result = await adminService.changeTenantPlan(tenant.id, selectedPackageId);
      
      onPlanChanged(result.tenant, result.modulesChanged);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar plano');
    } finally {
      setChanging(false);
    }
  };

  const currentPackage = packages.find(p => p.id === tenant.packageId);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  const getPlanTypeColor = (packageId: string) => {
    if (packageId.includes('starter')) return 'text-blue-600';
    if (packageId.includes('professional')) return 'text-green-600';
    if (packageId.includes('enterprise')) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getPlanTypeBg = (packageId: string) => {
    if (packageId.includes('starter')) return 'bg-blue-50 border-blue-200';
    if (packageId.includes('professional')) return 'bg-green-50 border-green-200';
    if (packageId.includes('enterprise')) return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  };

  const isUpgrade = selectedPackage && currentPackage && selectedPackage.price > currentPackage.price;
  const isDowngrade = selectedPackage && currentPackage && selectedPackage.price < currentPackage.price;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando pacotes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔄 Alterar Plano</h2>
            <p className="text-gray-600">Tenant: {tenant.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Current Plan */}
        {currentPackage && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📋 Plano Atual</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xl font-bold ${getPlanTypeColor(currentPackage.id)}`}>
                  {currentPackage.name}
                </p>
                <p className="text-gray-600">{currentPackage.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {currentPackage.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">/{currentPackage.billingInterval}</p>
              </div>
            </div>
          </div>
        )}

        {/* Package Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">📦 Selecionar Novo Plano</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPackageId === pkg.id
                    ? getPlanTypeBg(pkg.id)
                    : 'border-gray-200 hover:border-gray-300'
                } ${pkg.id === tenant.packageId ? 'opacity-50' : ''}`}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                {/* Popular Badge */}
                {pkg.isPopular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {pkg.id === tenant.packageId && (
                  <div className="absolute -top-2 right-2">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Atual
                    </span>
                  </div>
                )}

                {/* Radio Button */}
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    name="package"
                    value={pkg.id}
                    checked={selectedPackageId === pkg.id}
                    onChange={() => setSelectedPackageId(pkg.id)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={pkg.id === tenant.packageId}
                  />
                  <span className={`ml-2 text-lg font-semibold ${getPlanTypeColor(pkg.id)}`}>
                    {pkg.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    R$ {pkg.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">/{pkg.billingInterval}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  {pkg.features.slice(0, 3).map((feature) => (
                    <div key={feature.id} className="flex items-center text-sm">
                      <span className={feature.included ? 'text-green-500' : 'text-gray-400'}>
                        {feature.included ? '✓' : '✗'}
                      </span>
                      <span className="ml-2 text-gray-700">{feature.name}</span>
                      {feature.limit && (
                        <span className="ml-1 text-gray-500">({feature.limit})</span>
                      )}
                    </div>
                  ))}
                  {pkg.features.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{pkg.features.length - 3} recursos adicionais
                    </p>
                  )}
                </div>

                {/* Modules Count */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {pkg.modules.filter(m => m.included).length} módulos incluídos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Comparison */}
        {selectedPackage && selectedPackage.id !== tenant.packageId && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">
              {isUpgrade && '⬆️ Upgrade '}
              {isDowngrade && '⬇️ Downgrade '}
              - Mudanças do Plano
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Preço:</p>
                <p>
                  <span className="line-through text-gray-500">
                    R$ {currentPackage?.price.toFixed(2)}
                  </span>
                  {' → '}
                  <span className={isUpgrade ? 'text-green-600' : 'text-red-600'}>
                    R$ {selectedPackage.price.toFixed(2)}
                  </span>
                </p>
              </div>
              <div>
                <p className="font-medium">Módulos:</p>
                <p>
                  {currentPackage?.modules.filter(m => m.included).length} → {selectedPackage.modules.filter(m => m.included).length} módulos
                </p>
              </div>
            </div>
            {isDowngrade && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>Atenção:</strong> Fazer downgrade pode desativar módulos e funcionalidades.
                  Dados não serão perdidos, mas algumas funcionalidades ficarão inacessíveis.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={changing}
          >
            Cancelar
          </button>
          <button
            onClick={handlePlanChange}
            disabled={changing || selectedPackageId === tenant.packageId}
            className={`px-4 py-2 rounded-md text-white ${
              selectedPackageId === tenant.packageId
                ? 'bg-gray-400 cursor-not-allowed'
                : changing
                ? 'bg-blue-400 cursor-wait'
                : isUpgrade
                ? 'bg-green-600 hover:bg-green-700'
                : isDowngrade
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {changing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Alterando...
              </>
            ) : selectedPackageId === tenant.packageId ? (
              'Plano Atual'
            ) : isUpgrade ? (
              '⬆️ Fazer Upgrade'
            ) : isDowngrade ? (
              '⬇️ Fazer Downgrade'
            ) : (
              '🔄 Alterar Plano'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}