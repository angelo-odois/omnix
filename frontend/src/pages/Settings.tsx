import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import ModuleMarketplace from './ModuleMarketplace';
import SoundTester from '../components/notifications/SoundTester';

export default function Settings() {
  const { user, tenant } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Geral', icon: '⚙️' },
    { id: 'notifications', name: 'Notificações', icon: '🔔' },
    { id: 'modules', name: 'Módulos', icon: '🧩' },
    { id: 'billing', name: 'Faturamento', icon: '💳' },
    { id: 'users', name: 'Usuários', icon: '👥' },
    { id: 'integrations', name: 'Integrações', icon: '🔗' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={tenant?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={tenant?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return <SoundTester />;
      
      case 'modules':
        return <ModuleMarketplace />;
        
      case 'billing':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Faturamento</h3>
            <p className="text-gray-600">Funcionalidade de faturamento será implementada em breve.</p>
          </div>
        );
        
      case 'users':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciamento de Usuários</h3>
            <p className="text-gray-600">Funcionalidade de usuários será implementada em breve.</p>
          </div>
        );
        
      case 'integrations':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Integrações</h3>
            <p className="text-gray-600">Funcionalidade de integrações será implementada em breve.</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do seu sistema</p>
      </div>

      {/* Tenant Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{tenant?.name || 'Sua Empresa'}</h2>
            <p className="opacity-90">Plano: {tenant?.package || 'Starter'}</p>
            <p className="text-sm opacity-75">{user?.name} • {user?.role}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">R$ 97,00</div>
            <div className="text-sm opacity-75">/mês</div>
            <button className="mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors">
              🚀 Fazer Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}