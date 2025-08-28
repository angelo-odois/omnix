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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { label: 'Atendimentos', icon: MessageSquare, path: '/conversations' },
  { label: 'Contatos', icon: Users, path: '/contacts' },
  { label: 'Números', icon: Phone, path: '/instances', roles: ['super_admin', 'tenant_admin', 'tenant_manager'] },
  { label: 'Workflows', icon: Workflow, path: '/workflows', roles: ['super_admin', 'tenant_admin', 'tenant_manager'] },
  { label: 'Configurações', icon: Settings, path: '/settings', roles: ['super_admin', 'tenant_admin'] },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <aside 
      className={cn(
        'bg-gray-900 text-white h-screen transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-3', collapsed && 'hidden')}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{tenant?.name || 'OmniX'}</h1>
              <p className="text-xs text-gray-400">WhatsApp Business</p>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-gray-800',
                    isActive && 'bg-gray-800 text-blue-400',
                    collapsed && 'justify-center'
                  )
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
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