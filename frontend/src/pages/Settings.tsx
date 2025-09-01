import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import ModuleMarketplace from './ModuleMarketplace';
import AIPromptManager from './AIPromptManager';
import AllInstances from './AllInstances';

export default function Settings() {
  const { user, tenant } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Geral', icon: '⚙️', roles: ['super_admin', 'tenant_admin'] },
    { id: 'user', name: 'Perfil do Usuário', icon: '👤', roles: ['tenant_admin'] },
    { id: 'tenant', name: 'Empresa', icon: '🏢', roles: ['tenant_admin'] },
    { id: 'ai', name: 'IA & Prompts', icon: '🤖', roles: ['super_admin', 'tenant_admin'] },
    { id: 'instances', name: 'Todas Instâncias', icon: '📱', roles: ['super_admin'] },
    { id: 'modules', name: 'Módulos', icon: '🧩', roles: ['super_admin', 'tenant_admin'] },
    { id: 'users', name: 'Usuários', icon: '👥', roles: ['super_admin', 'tenant_admin'] },
    { id: 'integrations', name: 'Integrações', icon: '🔗', roles: ['super_admin', 'tenant_admin'] },
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
        
      case 'user':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Perfil do Usuário</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 capitalize"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Último Login
                  </label>
                  <input
                    type="text"
                    value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Primeiro acesso'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        );

      case 'tenant':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    defaultValue={tenant?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email da Empresa
                  </label>
                  <input
                    type="email"
                    defaultValue={tenant?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domínio (Opcional)
                  </label>
                  <input
                    type="text"
                    defaultValue={tenant?.domain || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano Atual
                  </label>
                  <input
                    type="text"
                    value={tenant?.package || 'Starter'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Configurações de Atendimento</h4>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Horário comercial ativo (9h-18h)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Auto-resposta para mensagens fora do horário</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Análise automática de IA nas conversas</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3">
                  Salvar Configurações
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return <AIPromptManager />;

      case 'instances':
        return <AllInstances />;
      
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
            {tabs
              .filter(tab => !tab.roles || tab.roles.includes(user?.role || ''))
              .map((tab) => (
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