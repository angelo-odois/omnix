import { Link } from 'react-router-dom';
import useModules from '../../hooks/useModules';
import { useAuthStore } from '../../store/authStore';

export default function ModuleStatusWidget() {
  const { user } = useAuthStore();
  const { tenantModules, allModules, loading, hasModule } = useModules();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Super admin não precisa deste widget
  if (user?.role === 'super_admin') {
    return null;
  }

  const activeModules = tenantModules.filter(tm => tm.isEnabled && tm.isActive);
  const totalModules = allModules.filter(m => !m.isCore).length;
  const activationPercentage = Math.round((activeModules.length / totalModules) * 100);

  const coreFeatures = [
    { id: 'messages', name: 'Mensagens', icon: '💬' },
    { id: 'contacts', name: 'Contatos', icon: '👥' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱' }
  ];

  const premiumFeatures = [
    { id: 'workflows', name: 'Automações', icon: '⚡' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'salvy', name: 'IA Assistant', icon: '🤖' },
    { id: 'api', name: 'API Access', icon: '🔌' },
    { id: 'webhooks', name: 'Webhooks', icon: '🔗' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🧩 Recursos Ativos</h3>
          <p className="text-sm text-gray-600">
            {activeModules.length} de {totalModules} recursos disponíveis
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{activationPercentage}%</div>
          <div className="text-xs text-gray-500">ativado</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progresso de ativação</span>
          <span>{activeModules.length}/{totalModules}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${activationPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Core Features */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">🔧 Recursos Essenciais</h4>
        <div className="grid grid-cols-2 gap-2">
          {coreFeatures.map(feature => (
            <div key={feature.id} className="flex items-center p-2 bg-green-50 rounded-lg">
              <span className="text-lg mr-2">{feature.icon}</span>
              <span className="text-sm font-medium text-green-800">{feature.name}</span>
              <span className="ml-auto text-green-600">✓</span>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Features */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">⭐ Recursos Premium</h4>
        <div className="space-y-2">
          {premiumFeatures.map(feature => {
            const isActive = hasModule(feature.id);
            
            return (
              <div 
                key={feature.id} 
                className={`flex items-center p-2 rounded-lg ${
                  isActive ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <span className="text-lg mr-2">{feature.icon}</span>
                <span className={`text-sm font-medium flex-1 ${
                  isActive ? 'text-blue-800' : 'text-gray-600'
                }`}>
                  {feature.name}
                </span>
                {isActive ? (
                  <span className="text-blue-600">✓</span>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Inativo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="pt-4 border-t border-gray-200">
        {activationPercentage < 100 ? (
          <Link
            to="/settings"
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 Ativar Mais Recursos
          </Link>
        ) : (
          <div className="text-center">
            <div className="text-green-600 font-medium text-sm mb-2">
              🎉 Todos os recursos ativados!
            </div>
            <Link
              to="/settings"
              className="text-blue-600 text-sm hover:text-blue-700"
            >
              Gerenciar recursos →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}