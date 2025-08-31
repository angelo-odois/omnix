import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import useModules from '../../hooks/useModules';

interface NavItem {
  path: string;
  name: string;
  icon: string;
  requiredModules?: string[];
  requiredRoles?: string[];
  description?: string;
}

const navigationItems: NavItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: '📊',
    description: 'Visão geral do sistema'
  },
  {
    path: '/conversations',
    name: 'Conversas',
    icon: '💬',
    requiredModules: ['messages'],
    description: 'Central de mensagens'
  },
  {
    path: '/contacts',
    name: 'Contatos',
    icon: '👥',
    requiredModules: ['contacts'],
    description: 'Gerenciamento de contatos'
  },
  {
    path: '/instances',
    name: 'Instâncias',
    icon: '📱',
    requiredModules: ['whatsapp'],
    description: 'WhatsApp Business API'
  },
  {
    path: '/workflows',
    name: 'Workflows',
    icon: '⚡',
    requiredModules: ['workflows'],
    requiredRoles: ['super_admin', 'tenant_admin', 'tenant_manager'],
    description: 'Automações e fluxos'
  },
  {
    path: '/analytics',
    name: 'Analytics',
    icon: '📈',
    requiredModules: ['analytics'],
    requiredRoles: ['super_admin', 'tenant_admin', 'tenant_manager'],
    description: 'Relatórios e métricas'
  },
  {
    path: '/integrations',
    name: 'Integrações',
    icon: '🔗',
    requiredModules: ['webhooks', 'api'],
    requiredRoles: ['super_admin', 'tenant_admin'],
    description: 'Webhooks e API'
  },
  {
    path: '/ai-assistant',
    name: 'IA Assistant',
    icon: '🤖',
    requiredModules: ['salvy'],
    requiredRoles: ['super_admin', 'tenant_admin', 'tenant_manager'],
    description: 'Assistente inteligente'
  },
  {
    path: '/billing',
    name: 'Faturamento',
    icon: '💳',
    requiredModules: ['stripe'],
    requiredRoles: ['super_admin', 'tenant_admin'],
    description: 'Pagamentos e faturas'
  },
  {
    path: '/settings',
    name: 'Configurações',
    icon: '⚙️',
    requiredRoles: ['super_admin', 'tenant_admin'],
    description: 'Configurações do sistema'
  }
];

export default function ModuleAwareNavigation() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasModule, hasAnyModule, getUpgradeInfo, loading } = useModules();

  if (loading) {
    return (
      <nav className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </nav>
    );
  }

  const visibleItems = navigationItems.filter(item => {
    // Verificar roles
    if (item.requiredRoles && !item.requiredRoles.includes(user?.role || '')) {
      return false;
    }

    // Verificar módulos
    if (item.requiredModules) {
      // Se requer qualquer módulo, verificar se pelo menos um está ativo
      if (!hasAnyModule(item.requiredModules)) {
        return false;
      }
    }

    return true;
  });

  const hiddenItems = navigationItems.filter(item => {
    // Items que existem mas estão ocultos por falta de módulos
    if (item.requiredRoles && !item.requiredRoles.includes(user?.role || '')) {
      return false; // Não mostrar se não tem role
    }

    if (item.requiredModules && !hasAnyModule(item.requiredModules)) {
      return true; // Mostrar como "disponível para upgrade"
    }

    return false;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Items Disponíveis */}
      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-gray-500">{item.description}</div>
                )}
              </div>
              
              {/* Module Status Indicators */}
              {item.requiredModules && (
                <div className="flex space-x-1">
                  {item.requiredModules.map(moduleId => {
                    const config = useModules().getModuleConfig(moduleId);
                    if (!config) return null;
                    
                    const isNearLimit = useModules().isNearLimit(moduleId);
                    
                    return (
                      <div
                        key={moduleId}
                        className={`w-2 h-2 rounded-full ${
                          isNearLimit ? 'bg-orange-400' : 'bg-green-400'
                        }`}
                        title={isNearLimit ? 'Próximo do limite' : 'Funcionando normalmente'}
                      />
                    );
                  })}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Features Disponíveis para Upgrade */}
      {hiddenItems.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-4">
            🚀 Disponível para Upgrade
          </h3>
          <div className="space-y-2">
            {hiddenItems.map((item) => {
              const upgradeInfo = item.requiredModules ? getUpgradeInfo(item.requiredModules[0]) : null;
              
              return (
                <Link
                  key={item.path}
                  to="/settings/modules"
                  className="flex items-center px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors border border-dashed border-gray-300"
                >
                  <span className="text-xl mr-3 opacity-50">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs">
                      {upgradeInfo?.message || 'Disponível em planos superiores'}
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    Upgrade
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Link para Gerenciar Módulos (Tenant Admins) */}
      {user?.role && ['super_admin', 'tenant_admin'].includes(user.role) && (
        <div className="border-t pt-4">
          <Link
            to="/settings/modules"
            className="flex items-center px-4 py-3 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <span className="text-xl mr-3">🧩</span>
            <div className="flex-1">
              <div className="font-medium">Gerenciar Módulos</div>
              <div className="text-xs text-purple-500">
                Ative recursos adicionais
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Hook para verificar acesso a uma rota específica
 */
export function useRouteAccess(path: string) {
  const { user } = useAuthStore();
  const { hasModule, hasAnyModule } = useModules();

  const navItem = navigationItems.find(item => item.path === path);
  if (!navItem) return { hasAccess: true, reason: null };

  // Verificar roles
  if (navItem.requiredRoles && !navItem.requiredRoles.includes(user?.role || '')) {
    return { 
      hasAccess: false, 
      reason: 'Permissão insuficiente',
      requiredRoles: navItem.requiredRoles
    };
  }

  // Verificar módulos
  if (navItem.requiredModules && !hasAnyModule(navItem.requiredModules)) {
    return { 
      hasAccess: false, 
      reason: 'Módulo não ativo',
      requiredModules: navItem.requiredModules
    };
  }

  return { hasAccess: true, reason: null };
}

/**
 * Componente para proteção de rotas baseada em módulos
 */
export function ModuleProtectedRoute({ 
  children, 
  requiredModules, 
  requiredRoles,
  fallback 
}: { 
  children: React.ReactNode;
  requiredModules?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { hasModule, hasAnyModule, loading } = useModules();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Verificando permissões...</span>
      </div>
    );
  }

  // Verificar roles
  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    return fallback || (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
        <p className="text-sm text-gray-500 mt-2">
          Roles necessárias: {requiredRoles.join(', ')}
        </p>
      </div>
    );
  }

  // Verificar módulos
  if (requiredModules && !hasAnyModule(requiredModules)) {
    return fallback || (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🧩</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Módulo Não Ativo</h2>
        <p className="text-gray-600">Esta funcionalidade não está ativa no seu plano.</p>
        <p className="text-sm text-gray-500 mt-2">
          Módulos necessários: {requiredModules.join(', ')}
        </p>
        <Link
          to="/settings/modules"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🚀 Ver Planos e Módulos
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}