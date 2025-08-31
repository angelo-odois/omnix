import { useState, useEffect } from 'react';

interface ModuleConfig {
  id: string;
  displayName: string;
  description: string;
  category: string;
  isCore: boolean;
  icon: string;
  color: string;
  included: boolean;
  limits: {
    maxInstances?: number;
    maxUsers?: number;
    maxRequests?: number;
    maxStorage?: number;
    customLimits?: {
      maxWorkflows?: number;
      maxContacts?: number;
      maxIntegrations?: number;
      maxWebhooks?: number;
      maxApiKeys?: number;
      maxReports?: number;
      maxConversations?: number;
      rateLimitPerHour?: number;
      retentionDays?: number;
    };
  };
}

interface AdvancedModuleConfiguratorProps {
  modules: ModuleConfig[];
  onChange: (modules: ModuleConfig[]) => void;
}

export default function AdvancedModuleConfigurator({ modules, onChange }: AdvancedModuleConfiguratorProps) {
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>(modules);

  useEffect(() => {
    setModuleConfigs(modules);
  }, [modules]);

  const handleToggleModule = (moduleId: string, included: boolean) => {
    const updatedModules = moduleConfigs.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          included,
          // Reset limits when disabling
          limits: included ? module.limits : {
            maxInstances: undefined,
            maxUsers: undefined,
            maxRequests: undefined,
            maxStorage: undefined,
            customLimits: {}
          }
        };
      }
      return module;
    });

    setModuleConfigs(updatedModules);
    onChange(updatedModules);
  };

  const handleLimitChange = (moduleId: string, limitKey: string, value: string | number) => {
    const updatedModules = moduleConfigs.map(module => {
      if (module.id === moduleId) {
        const numValue = typeof value === 'string' ? (value === '' ? undefined : parseInt(value)) : value;
        
        if (limitKey.startsWith('custom.')) {
          const customKey = limitKey.replace('custom.', '');
          return {
            ...module,
            limits: {
              ...module.limits,
              customLimits: {
                ...module.limits.customLimits,
                [customKey]: numValue === 0 ? undefined : numValue
              }
            }
          };
        } else {
          return {
            ...module,
            limits: {
              ...module.limits,
              [limitKey]: numValue === 0 ? undefined : numValue
            }
          };
        }
      }
      return module;
    });

    setModuleConfigs(updatedModules);
    onChange(updatedModules);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'border-red-500 bg-red-50';
      case 'communication': return 'border-green-500 bg-green-50';
      case 'automation': return 'border-purple-500 bg-purple-50';
      case 'integration': return 'border-blue-500 bg-blue-50';
      case 'analytics': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-500 bg-gray-50';
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

  const getModuleSpecificFields = (moduleId: string) => {
    switch (moduleId) {
      case 'whatsapp':
        return [
          { key: 'maxInstances', label: 'Máx. Instâncias WhatsApp', placeholder: '∞ para ilimitado' },
          { key: 'custom.maxContacts', label: 'Máx. Contatos', placeholder: 'Ex: 5000' },
          { key: 'custom.maxGroups', label: 'Máx. Grupos', placeholder: 'Ex: 100' }
        ];
      case 'workflows':
        return [
          { key: 'maxRequests', label: 'Máx. Execuções/Mês', placeholder: 'Ex: 10000' },
          { key: 'custom.maxWorkflows', label: 'Máx. Workflows', placeholder: 'Ex: 20' },
          { key: 'custom.maxActions', label: 'Máx. Ações por Workflow', placeholder: 'Ex: 50' }
        ];
      case 'analytics':
        return [
          { key: 'maxStorage', label: 'Storage Analytics (GB)', placeholder: 'Ex: 10' },
          { key: 'custom.maxReports', label: 'Máx. Relatórios', placeholder: 'Ex: 50' },
          { key: 'custom.retentionDays', label: 'Retenção (Dias)', placeholder: 'Ex: 365' }
        ];
      case 'api':
        return [
          { key: 'maxRequests', label: 'Máx. Requests/Mês', placeholder: 'Ex: 100000' },
          { key: 'custom.maxApiKeys', label: 'Máx. API Keys', placeholder: 'Ex: 10' },
          { key: 'custom.rateLimitPerHour', label: 'Rate Limit/Hora', placeholder: 'Ex: 1000' }
        ];
      case 'salvy':
        return [
          { key: 'maxRequests', label: 'Máx. Requests IA/Mês', placeholder: 'Ex: 5000' },
          { key: 'custom.maxConversations', label: 'Máx. Conversas IA', placeholder: 'Ex: 1000' },
          { key: 'custom.maxTokens', label: 'Máx. Tokens/Mês', placeholder: 'Ex: 1000000' }
        ];
      case 'webhooks':
        return [
          { key: 'maxRequests', label: 'Máx. Calls/Mês', placeholder: 'Ex: 25000' },
          { key: 'custom.maxWebhooks', label: 'Máx. Webhooks', placeholder: 'Ex: 20' },
          { key: 'custom.maxRetries', label: 'Máx. Tentativas', placeholder: 'Ex: 3' }
        ];
      case 'stripe':
        return [
          { key: 'maxRequests', label: 'Máx. Transações/Mês', placeholder: 'Ex: 1000' },
          { key: 'custom.maxAmount', label: 'Valor Máx. (R$)', placeholder: 'Ex: 100000' }
        ];
      default:
        return [
          { key: 'maxRequests', label: 'Máx. Requests/Mês', placeholder: 'Ex: 10000' },
          { key: 'maxUsers', label: 'Máx. Usuários', placeholder: 'Ex: 10' }
        ];
    }
  };

  const formatValue = (value: any) => {
    if (value === undefined || value === null || value === '') return '';
    if (value === -1) return '∞';
    return value.toString();
  };

  const parseValue = (value: string) => {
    if (value === '' || value === '∞') return -1;
    const num = parseInt(value);
    return isNaN(num) ? undefined : num;
  };

  // Agrupar módulos por categoria
  const modulesByCategory = moduleConfigs.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {} as {[key: string]: ModuleConfig[]});

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="text-blue-400">💡</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Configuração Avançada de Módulos</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Toggle</strong>: Liga/desliga módulo no plano</li>
                <li><strong>Limites</strong>: Configure recursos específicos</li>
                <li><strong>∞ ou -1</strong>: Representa ilimitado</li>
                <li><strong>Vazio</strong>: Usa configuração padrão</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
        <div key={category} className={`border-2 rounded-lg p-4 ${getCategoryColor(category)}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">{getCategoryIcon(category)}</span>
            {category.charAt(0).toUpperCase() + category.slice(1)}
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({categoryModules.filter(m => m.included).length}/{categoryModules.length} ativos)
            </span>
          </h3>

          <div className="space-y-4">
            {categoryModules.map((module) => (
              <div key={module.id} className="bg-white rounded-lg border p-4">
                {/* Module Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3"
                      style={{ backgroundColor: module.color + '20' }}
                    >
                      {module.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {module.displayName}
                      </h4>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center">
                    {module.isCore ? (
                      <div className="flex items-center text-sm text-red-600 font-medium">
                        <span className="mr-2">🔒</span>
                        Core (Sempre Ativo)
                      </div>
                    ) : (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={module.included}
                          onChange={(e) => handleToggleModule(module.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {module.included ? 'Ativo' : 'Inativo'}
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Configuration Panel */}
                {(module.included || module.isCore) && (
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                      ⚙️ Configurações e Limites
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getModuleSpecificFields(module.id).map((field) => {
                        const currentValue = field.key.startsWith('custom.') 
                          ? module.limits.customLimits?.[field.key.replace('custom.', '')]
                          : module.limits[field.key as keyof typeof module.limits];

                        return (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={formatValue(currentValue)}
                              onChange={(e) => handleLimitChange(module.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={module.isCore && !['super_admin'].includes('user?.role')} // Placeholder
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Use "∞" ou "-1" para ilimitado
                            </div>
                          </div>
                        );
                      })}

                      {/* Sempre mostrar campos básicos */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Máx. Usuários do Módulo
                        </label>
                        <input
                          type="text"
                          value={formatValue(module.limits.maxUsers)}
                          onChange={(e) => handleLimitChange(module.id, 'maxUsers', e.target.value)}
                          placeholder="Ex: 10 (deixe vazio para ilimitado)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h6 className="text-xs font-semibold text-gray-600 mb-2">🎯 Presets Rápidos:</h6>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            // Preset Básico
                            const basicLimits = getBasicPreset(module.id);
                            handleMultipleLimits(module.id, basicLimits);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          📊 Básico
                        </button>
                        <button
                          onClick={() => {
                            // Preset Profissional
                            const proLimits = getProPreset(module.id);
                            handleMultipleLimits(module.id, proLimits);
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                          🚀 Profissional
                        </button>
                        <button
                          onClick={() => {
                            // Preset Enterprise
                            const enterpriseLimits = getEnterprisePreset(module.id);
                            handleMultipleLimits(module.id, enterpriseLimits);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                        >
                          💎 Enterprise
                        </button>
                        <button
                          onClick={() => {
                            // Reset to unlimited
                            const unlimitedLimits = getUnlimitedPreset(module.id);
                            handleMultipleLimits(module.id, unlimitedLimits);
                          }}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
                        >
                          ∞ Ilimitado
                        </button>
                      </div>
                    </div>

                    {/* Usage Preview */}
                    {module.included && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h6 className="text-xs font-semibold text-gray-600 mb-2">👁️ Preview da Configuração:</h6>
                        <div className="text-xs text-gray-600 space-y-1">
                          {module.limits.maxInstances && (
                            <div>• {module.limits.maxInstances === -1 ? 'Instâncias ilimitadas' : `Até ${module.limits.maxInstances} instâncias`}</div>
                          )}
                          {module.limits.maxRequests && (
                            <div>• {module.limits.maxRequests === -1 ? 'Requests ilimitados' : `${module.limits.maxRequests.toLocaleString()} requests/mês`}</div>
                          )}
                          {module.limits.customLimits && Object.entries(module.limits.customLimits).map(([key, value]) => (
                            value && <div key={key}>• {value === -1 ? `${key} ilimitados` : `${value} ${key.replace('max', '').toLowerCase()}`}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Helper functions for presets
  function getBasicPreset(moduleId: string) {
    const presets: {[key: string]: any} = {
      'whatsapp': { maxInstances: 2, 'custom.maxContacts': 1000, 'custom.maxGroups': 50 },
      'workflows': { maxRequests: 5000, 'custom.maxWorkflows': 5, 'custom.maxActions': 20 },
      'analytics': { maxStorage: 2, 'custom.maxReports': 10, 'custom.retentionDays': 90 },
      'api': { maxRequests: 10000, 'custom.maxApiKeys': 2, 'custom.rateLimitPerHour': 500 },
      'salvy': { maxRequests: 1000, 'custom.maxConversations': 100, 'custom.maxTokens': 50000 }
    };
    return presets[moduleId] || { maxRequests: 1000, maxUsers: 5 };
  }

  function getProPreset(moduleId: string) {
    const presets: {[key: string]: any} = {
      'whatsapp': { maxInstances: 5, 'custom.maxContacts': 5000, 'custom.maxGroups': 200 },
      'workflows': { maxRequests: 20000, 'custom.maxWorkflows': 20, 'custom.maxActions': 100 },
      'analytics': { maxStorage: 10, 'custom.maxReports': 50, 'custom.retentionDays': 365 },
      'api': { maxRequests: 100000, 'custom.maxApiKeys': 10, 'custom.rateLimitPerHour': 5000 },
      'salvy': { maxRequests: 10000, 'custom.maxConversations': 1000, 'custom.maxTokens': 500000 }
    };
    return presets[moduleId] || { maxRequests: 20000, maxUsers: 20 };
  }

  function getEnterprisePreset(moduleId: string) {
    const presets: {[key: string]: any} = {
      'whatsapp': { maxInstances: -1, 'custom.maxContacts': -1, 'custom.maxGroups': -1 },
      'workflows': { maxRequests: -1, 'custom.maxWorkflows': -1, 'custom.maxActions': -1 },
      'analytics': { maxStorage: 50, 'custom.maxReports': -1, 'custom.retentionDays': -1 },
      'api': { maxRequests: -1, 'custom.maxApiKeys': -1, 'custom.rateLimitPerHour': -1 },
      'salvy': { maxRequests: -1, 'custom.maxConversations': -1, 'custom.maxTokens': -1 }
    };
    return presets[moduleId] || { maxRequests: -1, maxUsers: -1 };
  }

  function getUnlimitedPreset(moduleId: string) {
    return getEnterprisePreset(moduleId);
  }

  function handleMultipleLimits(moduleId: string, limits: {[key: string]: any}) {
    let updatedModule = moduleConfigs.find(m => m.id === moduleId);
    if (!updatedModule) return;

    Object.entries(limits).forEach(([key, value]) => {
      handleLimitChange(moduleId, key, value);
    });
  }
}