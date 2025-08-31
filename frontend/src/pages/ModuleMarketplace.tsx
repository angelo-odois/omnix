import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import useModules from '../hooks/useModules';
import { adminService } from '../services/adminService';

interface Module {
  id: string;
  displayName: string;
  description: string;
  category: string;
  isCore: boolean;
  icon: string;
  color: string;
  tags: string[];
  defaultConfig: {
    maxInstances?: number;
    maxRequests?: number;
    customLimits?: Record<string, any>;
  };
}

export default function ModuleMarketplace() {
  const { user } = useAuthStore();
  const { tenantModules, allModules, hasModule, loading } = useModules();
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [activating, setActivating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (allModules.length > 0) {
      // Filtrar módulos que não estão ativos e não são core
      const available = allModules.filter(module => 
        !module.isCore && !hasModule(module.id)
      );
      setAvailableModules(available);
    }
  }, [allModules, tenantModules]);

  const handleActivateModule = async (moduleId: string) => {
    if (!user?.tenantId) return;

    try {
      setActivating(moduleId);
      setError(null);

      // Use tenant self-service API
      const response = await fetch(`/api/tenant/my-modules/${moduleId}/request-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ config: {} })
      });

      const result = await response.json();

      if (!result.success) {
        if (result.upgrade) {
          setError(`${result.message}\n\nUpgrade necessário para: ${result.upgrade.availableIn.join(', ')}`);
        } else {
          setError(result.message);
        }
        return;
      }
      
      // Refresh modules data
      window.location.reload(); // Simples reload para atualizar dados
      
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar módulo');
    } finally {
      setActivating(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'communication': return 'border-green-200 bg-green-50';
      case 'automation': return 'border-purple-200 bg-purple-50';
      case 'integration': return 'border-blue-200 bg-blue-50';
      case 'analytics': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return '💬';
      case 'automation': return '⚡';
      case 'integration': return '🔗';
      case 'analytics': return '📊';
      default: return '📦';
    }
  };

  const getModulePrice = (moduleId: string) => {
    // Preços fictícios para demonstração
    const prices: {[key: string]: number} = {
      'salvy': 50,
      'analytics': 30,
      'webhooks': 20,
      'api': 40,
      'stripe': 25
    };
    return prices[moduleId] || 29;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando marketplace...</span>
      </div>
    );
  }

  if (!user?.tenantId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas usuários de tenant podem acessar o marketplace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛒 Marketplace de Módulos
        </h1>
        <p className="text-gray-600 mb-6">
          Ative recursos adicionais para expandir as funcionalidades do seu sistema
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Active Modules Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">✅ Módulos Ativos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tenantModules.filter(tm => tm.isEnabled && tm.isActive).map((tenantModule) => {
            const module = allModules.find(m => m.id === tenantModule.moduleId);
            if (!module) return null;
            
            return (
              <div key={module.id} className="flex items-center p-3 bg-green-50 rounded-lg">
                <span className="text-2xl mr-3">{module.icon}</span>
                <div>
                  <div className="font-medium text-green-800">{module.displayName}</div>
                  <div className="text-xs text-green-600">Ativo</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Modules */}
      {availableModules.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-6">🚀 Módulos Disponíveis</h2>
          
          {/* Group by category */}
          {Object.entries(
            availableModules.reduce((acc, module) => {
              if (!acc[module.category]) acc[module.category] = [];
              acc[module.category].push(module);
              return acc;
            }, {} as {[key: string]: Module[]})
          ).map(([category, categoryModules]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryModules.map((module) => (
                  <div 
                    key={module.id} 
                    className={`border-2 rounded-lg p-6 ${getCategoryColor(module.category)} hover:shadow-md transition-shadow`}
                  >
                    {/* Module Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: module.color + '20' }}
                        >
                          {module.icon}
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {module.displayName}
                          </h4>
                          <div className="flex space-x-1 mt-1">
                            {module.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          R$ {getModulePrice(module.id)}
                        </div>
                        <div className="text-sm text-gray-500">/mês</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4">{module.description}</p>

                    {/* Features/Limits */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Inclui:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {module.defaultConfig.maxInstances && (
                          <li>• Até {module.defaultConfig.maxInstances} instâncias</li>
                        )}
                        {module.defaultConfig.maxRequests && (
                          <li>• {module.defaultConfig.maxRequests.toLocaleString()} requests/mês</li>
                        )}
                        {module.defaultConfig.customLimits && Object.entries(module.defaultConfig.customLimits).map(([key, value]) => (
                          <li key={key}>• {value === -1 ? 'Ilimitado' : value} {key.replace('max', '').toLowerCase()}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleActivateModule(module.id)}
                      disabled={activating === module.id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        activating === module.id
                          ? 'bg-gray-400 text-white cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {activating === module.id ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Ativando...
                        </>
                      ) : (
                        <>
                          ✨ Ativar Módulo
                        </>
                      )}
                    </button>

                    {/* Trial Info */}
                    <p className="text-xs text-gray-500 text-center mt-2">
                      💡 Teste grátis por 7 dias
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Todos os Módulos Ativados!
          </h2>
          <p className="text-gray-600">
            Você já tem acesso a todos os recursos disponíveis para seu plano.
          </p>
        </div>
      )}

      {/* Plan Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">🚀 Quer Mais Recursos?</h3>
        <p className="mb-4">
          Faça upgrade do seu plano e tenha acesso a módulos premium como IA, Analytics Avançado e mais!
        </p>
        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
          Ver Planos Premium
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="text-blue-400">ℹ️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Como Funciona</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Ative módulos individuais conforme sua necessidade</li>
                <li>Teste gratuitamente por 7 dias antes de ser cobrado</li>
                <li>Cancele a qualquer momento sem compromisso</li>
                <li>Módulos são adicionados à sua fatura mensal</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}