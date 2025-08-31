import { useState, useEffect } from 'react';
import { adminService, Package, PackageFeature, PackageLimits } from '../../services/adminService';
import AdvancedModuleConfigurator from './AdvancedModuleConfigurator';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  isCore: boolean;
  icon: string;
  color: string;
}

interface PackageEditorProps {
  package?: Package;
  onSave: (savedPackage: Package) => void;
  onClose: () => void;
}

export default function PackageEditor({ package: existingPackage, onSave, onClose }: PackageEditorProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [packageData, setPackageData] = useState({
    name: existingPackage?.name || '',
    description: existingPackage?.description || '',
    price: existingPackage?.price || 0,
    currency: existingPackage?.currency || 'BRL' as 'BRL' | 'USD',
    billingInterval: existingPackage?.billingInterval || 'monthly' as 'monthly' | 'yearly',
    isActive: existingPackage?.isActive ?? true,
    isPopular: existingPackage?.isPopular ?? false,
  });

  const [features, setFeatures] = useState<PackageFeature[]>(existingPackage?.features || [
    { id: 'f1', name: 'WhatsApp Integration', description: 'Conecte números do WhatsApp', included: true },
    { id: 'f2', name: 'Workflows', description: 'Automações e fluxos', included: true },
    { id: 'f3', name: 'Contact Management', description: 'Gerenciamento de contatos', included: true },
    { id: 'f4', name: 'API Access', description: 'Acesso completo à API', included: false },
    { id: 'f5', name: 'Analytics', description: 'Relatórios e métricas', included: false },
    { id: 'f6', name: 'Custom Branding', description: 'Marca própria', included: false },
  ]);

  const [limits, setLimits] = useState<PackageLimits>(existingPackage?.limits || {
    maxUsers: 5,
    maxInstances: 2,
    maxMessagesPerMonth: 10000,
    maxContacts: 2000,
    maxWorkflows: 10,
    maxIntegrations: 5,
    storageGB: 2,
  });

  const [moduleConfigs, setModuleConfigs] = useState<any[]>([]);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const modulesData = await adminService.getModules();
      setModules(modulesData);

      // Converter módulos para formato do configurador avançado
      const moduleConfigsData = modulesData.map(module => {
        const existingModule = existingPackage?.modules?.find(m => m.moduleId === module.id);
        return {
          id: module.id,
          displayName: module.displayName,
          description: module.description,
          category: module.category,
          isCore: module.isCore,
          icon: module.icon,
          color: module.color,
          included: existingModule?.included ?? module.isCore,
          limits: {
            maxInstances: existingModule?.limits?.maxInstances,
            maxUsers: existingModule?.limits?.maxUsers,
            maxRequests: existingModule?.limits?.maxRequests,
            maxStorage: existingModule?.limits?.storageGB,
            customLimits: existingModule?.limits?.customLimits || {}
          }
        };
      });

      setModuleConfigs(moduleConfigsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar módulos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setPackageData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
               type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLimitChange = (key: keyof PackageLimits, value: number) => {
    setLimits(prev => ({ ...prev, [key]: value }));
  };

  const handleFeatureChange = (index: number, field: keyof PackageFeature, value: any) => {
    setFeatures(prev => prev.map((feature, i) => 
      i === index ? { ...feature, [field]: value } : feature
    ));
  };

  const addFeature = () => {
    const newFeature: PackageFeature = {
      id: `f${features.length + 1}`,
      name: '',
      description: '',
      included: false
    };
    setFeatures(prev => [...prev, newFeature]);
  };

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const handleModuleToggle = (moduleId: string, included: boolean) => {
    const module = modules.find(m => m.id === moduleId);
    
    // Não permitir desativar módulos core
    if (module?.isCore && !included) {
      alert('Módulos core não podem ser desativados');
      return;
    }

    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        included
      }
    }));
  };

  const handleModuleLimitChange = (moduleId: string, limitKey: string, value: any) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        limits: {
          ...prev[moduleId]?.limits,
          [limitKey]: value === '' ? undefined : (limitKey.includes('max') ? parseInt(value) || 0 : value)
        }
      }
    }));
  };

  const validateForm = () => {
    if (!packageData.name.trim()) return 'Nome do pacote é obrigatório';
    if (!packageData.description.trim()) return 'Descrição é obrigatória';
    if (packageData.price < 0) return 'Preço deve ser maior ou igual a zero';
    
    const includedModules = moduleConfigs.filter(m => m.included);
    if (includedModules.length === 0) return 'Pelo menos um módulo deve estar incluído';
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const packagePayload = {
        ...packageData,
        features: features.filter(f => f.name.trim()),
        limits,
        modules: moduleConfigs.map(moduleConfig => ({
          moduleId: moduleConfig.id,
          included: moduleConfig.included,
          limits: {
            maxInstances: moduleConfig.limits.maxInstances,
            maxUsers: moduleConfig.limits.maxUsers,
            maxRequests: moduleConfig.limits.maxRequests,
            storageGB: moduleConfig.limits.maxStorage,
            customLimits: moduleConfig.limits.customLimits
          }
        }))
      };

      let savedPackage;
      if (existingPackage) {
        savedPackage = await adminService.updatePackage(existingPackage.id, packagePayload);
      } else {
        savedPackage = await adminService.createPackage(packagePayload);
      }

      onSave(savedPackage);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar pacote');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'border-red-200 bg-red-50';
      case 'communication': return 'border-green-200 bg-green-50';
      case 'automation': return 'border-purple-200 bg-purple-50';
      case 'integration': return 'border-blue-200 bg-blue-50';
      case 'analytics': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return '🔧';
      case 'communication': return '💬';
      case 'automation': return '⚡';
      case 'integration': return '🔗';
      case 'analytics': return '📊';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando módulos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {existingPackage ? '✏️ Editar Pacote' : '📦 Criar Pacote'}
            </h2>
            <p className="text-gray-600">Configure módulos, preços e recursos</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">📋 Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Pacote *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={packageData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Professional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    name="description"
                    value={packageData.description}
                    onChange={handleInputChange}
                    placeholder="Descrição do pacote"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={packageData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moeda
                    </label>
                    <select
                      name="currency"
                      value={packageData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={saving}
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cobrança
                  </label>
                  <select
                    name="billingInterval"
                    value={packageData.billingInterval}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={packageData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <span className="ml-2 text-sm text-gray-700">Ativo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={packageData.isPopular}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={saving}
                    />
                    <span className="ml-2 text-sm text-gray-700">Popular</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">📊 Limites</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Usuários
                  </label>
                  <input
                    type="number"
                    value={limits.maxUsers}
                    onChange={(e) => handleLimitChange('maxUsers', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Instâncias
                  </label>
                  <input
                    type="number"
                    value={limits.maxInstances}
                    onChange={(e) => handleLimitChange('maxInstances', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagens/Mês
                  </label>
                  <input
                    type="number"
                    value={limits.maxMessagesPerMonth}
                    onChange={(e) => handleLimitChange('maxMessagesPerMonth', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Contatos
                  </label>
                  <input
                    type="number"
                    value={limits.maxContacts}
                    onChange={(e) => handleLimitChange('maxContacts', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Workflows
                  </label>
                  <input
                    type="number"
                    value={limits.maxWorkflows}
                    onChange={(e) => handleLimitChange('maxWorkflows', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    value={limits.storageGB}
                    onChange={(e) => handleLimitChange('storageGB', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">✨ Features</h3>
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  disabled={saving}
                >
                  + Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={feature.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onChange={(e) => handleFeatureChange(index, 'included', e.target.checked)}
                      className="w-4 h-4"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                      placeholder="Nome da feature"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={saving}
                    />
                    <input
                      type="number"
                      value={feature.limit || ''}
                      onChange={(e) => handleFeatureChange(index, 'limit', parseInt(e.target.value) || undefined)}
                      placeholder="Limite"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={saving}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Module Configurator */}
          <div>
            <h3 className="text-lg font-semibold mb-4">🧩 Configuração Avançada de Módulos</h3>
            <AdvancedModuleConfigurator
              modules={moduleConfigs}
              onChange={setModuleConfigs}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-md text-white ${
              saving
                ? 'bg-blue-400 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : existingPackage ? (
              '✏️ Atualizar Pacote'
            ) : (
              '📦 Criar Pacote'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}