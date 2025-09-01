import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Phone, 
  Workflow, 
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';
import useModules from '../../hooks/useModules';
import { withLayoutId, withComponentId } from '../../utils/componentId';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
  requiredModules?: string[];
  description?: string;
}

const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    icon: BarChart3, 
    path: '/dashboard',
    description: 'Visão geral do sistema'
  },
  { 
    label: 'Atendimentos', 
    icon: MessageSquare, 
    path: '/conversations',
    requiredModules: ['messages'],
    description: 'Central de mensagens com IA'
  },
  { 
    label: 'Contatos', 
    icon: Users, 
    path: '/contacts',
    requiredModules: ['contacts'],
    description: 'Gerenciamento de contatos'
  },
  { 
    label: 'WhatsApp', 
    icon: Phone, 
    path: '/whatsapp', 
    roles: ['super_admin', 'tenant_admin', 'tenant_manager'],
    requiredModules: ['whatsapp'],
    description: 'WhatsApp Business API'
  },
  { 
    label: 'Workflows', 
    icon: Workflow, 
    path: '/workflows', 
    roles: ['super_admin', 'tenant_admin', 'tenant_manager'],
    requiredModules: ['workflows'],
    description: 'Automações e fluxos'
  },
  { 
    label: 'Configurações', 
    icon: Settings, 
    path: '/settings', 
    roles: ['super_admin', 'tenant_admin'],
    description: 'Configurações gerais, IA, usuários e instâncias'
  },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuthStore();
  const { hasModule, hasAnyModule, loading, getModuleConfig, isNearLimit } = useModules();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    // Verificar roles
    if (item.roles && !item.roles.includes(user?.role || '')) {
      return false;
    }

    // Verificar módulos (se especificados)
    if (item.requiredModules) {
      // Super admin sempre vê tudo
      if (user?.role === 'super_admin') return true;
      
      // Para outros usuários, verificar se tem pelo menos um dos módulos necessários
      return hasAnyModule(item.requiredModules);
    }

    return true;
  });

  return (
    <aside 
      {...withLayoutId('Sidebar')}
      className={cn(
        'bg-gradient-to-b from-surface-800 to-surface-900 text-white h-screen transition-all duration-300 flex flex-col shadow-2xl',
        collapsed ? 'w-16' : 'w-64'
      )}
      data-collapsed={collapsed}
    >
      <div {...withComponentId('SidebarHeader')} className="p-4 border-b border-dark-500/30">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-3', collapsed && 'hidden')}>
            <div {...withComponentId('SidebarHeader', 'logo')} className="w-10 h-10 bg-gradient-to-br from-whatsapp-500 to-whatsapp-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-whatsapp-300/50">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div {...withComponentId('SidebarHeader', 'brand')}>
              <h1 className="font-bold text-lg bg-gradient-to-r from-white to-whatsapp-100 bg-clip-text text-transparent">{tenant?.name || 'OmniX'}</h1>
              <p className="text-xs text-whatsapp-200">Atendimento Inteligente</p>
            </div>
          </div>
          <button
            {...withComponentId('SidebarHeader', 'toggle')}
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-dark-500/50 rounded-lg transition-colors"
            data-action="toggle-sidebar"
          >
            {collapsed ? <ChevronRight size={20} className="text-neutral-300" /> : <ChevronLeft size={20} className="text-neutral-300" />}
          </button>
        </div>
      </div>

      <nav {...withComponentId('SidebarNav')} className="flex-1 p-4">
        {loading ? (
          <div {...withComponentId('SidebarNav', 'loading')} className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-dark-500/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <ul {...withComponentId('SidebarNav', 'menu')} className="space-y-2">
            {filteredNavItems.map((item) => {
              const isModuleBasedItem = item.requiredModules && item.requiredModules.length > 0;
              const hasRequiredModules = isModuleBasedItem ? hasAnyModule(item.requiredModules) : true;
              
              return (
                <li key={item.path} {...withComponentId('NavItem', item.path.replace('/', ''))}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative group',
                        'hover:bg-whatsapp-500/20 hover:shadow-lg',
                        isActive && 'bg-gradient-to-r from-whatsapp-500 to-whatsapp-600 text-white shadow-lg scale-105',
                        !isActive && 'text-neutral-300',
                        collapsed && 'justify-center',
                        !hasRequiredModules && 'opacity-60'
                      )
                    }
                    title={collapsed ? `${item.label}${item.description ? ` - ${item.description}` : ''}` : undefined}
                    data-nav-item={item.label}
                    data-nav-path={item.path}
                    data-nav-active={window.location.pathname === item.path}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {/* Module Status Indicator */}
                        {isModuleBasedItem && (
                          <div className="flex items-center space-x-1">
                            {item.requiredModules!.map(moduleId => {
                              const moduleConfig = getModuleConfig(moduleId);
                              if (!moduleConfig) return null;
                              
                              const moduleNearLimit = isNearLimit(moduleId);
                              
                              return (
                                <div
                                  key={moduleId}
                                  className={`w-2 h-2 rounded-full ${
                                    !moduleConfig.isEnabled || !moduleConfig.isActive
                                      ? 'bg-red-400'
                                      : moduleNearLimit 
                                      ? 'bg-orange-400' 
                                      : 'bg-green-400'
                                  }`}
                                  title={
                                    !moduleConfig.isEnabled || !moduleConfig.isActive
                                      ? 'Módulo inativo'
                                      : moduleNearLimit 
                                      ? 'Próximo do limite' 
                                      : 'Funcionando'
                                  }
                                />
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className={cn('mb-4', collapsed && 'hidden')}>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-1">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg w-full',
            'hover:bg-red-900/20 text-red-400 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}