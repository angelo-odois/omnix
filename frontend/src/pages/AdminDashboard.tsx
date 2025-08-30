import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { adminService } from '../services/adminService';
import PackageManagement from '../components/admin/PackageManagement';
import TenantManagement from '../components/admin/TenantManagement';
import UserManagement from '../components/admin/UserManagement';
import DashboardStats from '../components/admin/DashboardStats';
import ModuleManagement from '../components/admin/ModuleManagement';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário é super admin
    if (!user || user.role !== 'super_admin') {
      window.location.href = '/login';
      return;
    }
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">Apenas Super Admins podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'modules', name: 'Módulos', icon: '🧩' },
    { id: 'packages', name: 'Pacotes', icon: '📦' },
    { id: 'tenants', name: 'Tenants', icon: '🏢' },
    { id: 'users', name: 'Usuários', icon: '👥' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'modules':
        return <ModuleManagement />;
      case 'packages':
        return <PackageManagement />;
      case 'tenants':
        return <TenantManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🛠️ Painel Administrativo OmniX
              </h1>
              <p className="text-gray-600">Gerencie pacotes, tenants e usuários do sistema</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logado como</p>
              <p className="font-medium text-gray-900">{user.name}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
}