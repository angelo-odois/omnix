import { useState, useEffect } from 'react';
import { adminService, Package, TenantAdmin } from '../../services/adminService';

interface CreateTenantModalProps {
  onTenantCreated: (tenant: TenantAdmin) => void;
  onClose: () => void;
}

export default function CreateTenantModal({ onTenantCreated, onClose }: CreateTenantModalProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    packageId: '',
    domain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await adminService.getPackages();
      const activePackages = packagesData.filter(pkg => pkg.isActive);
      setPackages(activePackages);
      
      // Pre-select the first package
      if (activePackages.length > 0) {
        setFormData(prev => ({ ...prev, packageId: activePackages[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pacotes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, adminPassword: password }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Nome da empresa é obrigatório';
    if (!formData.email.trim()) return 'Email da empresa é obrigatório';
    if (!formData.packageId) return 'Pacote é obrigatório';
    if (!formData.adminName.trim()) return 'Nome do admin é obrigatório';
    if (!formData.adminEmail.trim()) return 'Email do admin é obrigatório';
    if (!formData.adminPassword.trim()) return 'Senha é obrigatória';
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Email da empresa inválido';
    if (!emailRegex.test(formData.adminEmail)) return 'Email do admin inválido';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const newTenant = await adminService.createTenant(formData);
      
      onTenantCreated(newTenant);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tenant');
    } finally {
      setCreating(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === formData.packageId);

  const getPlanTypeColor = (packageId: string) => {
    if (packageId.includes('starter')) return 'text-blue-600';
    if (packageId.includes('professional')) return 'text-green-600';
    if (packageId.includes('enterprise')) return 'text-purple-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏢 Criar Novo Tenant</h2>
            <p className="text-gray-600">Configure uma nova empresa no sistema</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={creating}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🏢 Informações da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Empresa Demo LTDA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email da Empresa *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domínio Personalizado (Opcional)
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  placeholder="app.empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">👤 Administrador</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Admin *
                </label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  placeholder="João Silva"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Admin *
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  placeholder="admin@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha Temporária *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    placeholder="Senha temporária"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creating}
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    disabled={creating}
                  >
                    🎲 Gerar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  O admin receberá essas credenciais por email
                </p>
              </div>
            </div>
          </div>

          {/* Package Selection */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📦 Plano</h3>
            <div className="space-y-3">
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.packageId === pkg.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="packageId"
                    value={pkg.id}
                    checked={formData.packageId === pkg.id}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                    disabled={creating}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`text-lg font-semibold ${getPlanTypeColor(pkg.id)}`}>
                          {pkg.name}
                        </span>
                        {pkg.isPopular && (
                          <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-gray-900">
                          R$ {pkg.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">/{pkg.billingInterval}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pkg.modules.filter(m => m.included).length} módulos incluídos
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Selected Package Details */}
          {selectedPackage && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">📋 Módulos que serão ativados:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedPackage.modules
                  .filter(m => m.included)
                  .slice(0, 6)
                  .map((module) => (
                    <div key={module.moduleId} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700 capitalize">
                        {module.moduleId.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
              </div>
              {selectedPackage.modules.filter(m => m.included).length > 6 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{selectedPackage.modules.filter(m => m.included).length - 6} módulos adicionais
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className={`px-6 py-2 rounded-md text-white ${
                creating
                  ? 'bg-green-400 cursor-wait'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {creating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando Tenant...
                </>
              ) : (
                '🏢 Criar Tenant'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}