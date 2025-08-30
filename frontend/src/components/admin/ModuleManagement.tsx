import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: 'communication' | 'automation' | 'integration' | 'analytics' | 'core';
  isActive: boolean;
  isCore: boolean;
  requiresActivation: boolean;
  dependencies: {
    moduleId: string;
    version?: string;
    required: boolean;
  }[];
  permissions: {
    id: string;
    name: string;
    description: string;
    scope: 'read' | 'write' | 'admin';
  }[];
  requiredRoles: string[];
  defaultConfig: {
    maxInstances?: number;
    maxUsers?: number;
    maxRequests?: number;
    storageGB?: number;
    customLimits?: Record<string, any>;
  };
  icon: string;
  color: string;
  tags: string[];
  author: string;
  homepage?: string;
  documentation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleStats {
  totalModules: number;
  activeModules: number;
  coreModules: number;
  categoryDistribution: {
    category: string;
    count: number;
  }[];
  mostUsedModules: {
    moduleId: string;
    moduleName: string;
    tenantCount: number;
    totalRequests: number;
  }[];
}

export default function ModuleManagement() {
  const [modules, setModules] = useState<Module[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Todos', icon: '📋' },
    { id: 'core', name: 'Core', icon: '🔧' },
    { id: 'communication', name: 'Comunicação', icon: '💬' },
    { id: 'automation', name: 'Automação', icon: '⚡' },
    { id: 'integration', name: 'Integração', icon: '🔗' },
    { id: 'analytics', name: 'Analytics', icon: '📊' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load modules and stats in parallel
      const [modulesData, statsData] = await Promise.all([
        adminService.getModules(),
        adminService.getModuleStats()
      ]);

      setModules(modulesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar módulos');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesSearch = module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-red-100 text-red-800';
      case 'communication':
        return 'bg-green-100 text-green-800';
      case 'automation':
        return 'bg-purple-100 text-purple-800';
      case 'integration':
        return 'bg-blue-100 text-blue-800';
      case 'analytics':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando módulos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="text-red-400">⚠️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={loadData}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🧩 Gerenciamento de Módulos</h2>
          <p className="text-gray-600">Configure e gerencie módulos do sistema</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.totalModules}</div>
            <div className="text-sm text-gray-500">Total de Módulos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.activeModules}</div>
            <div className="text-sm text-gray-500">Módulos Ativos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats.coreModules}</div>
            <div className="text-sm text-gray-500">Módulos Core</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {stats.categoryDistribution.length}
            </div>
            <div className="text-sm text-gray-500">Categorias</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar módulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
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
                    <h3 className="text-lg font-semibold text-gray-900">{module.displayName}</h3>
                    <p className="text-sm text-gray-500">v{module.version}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(module.isActive)}`}>
                    {module.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  {module.isCore && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Core
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>

              {/* Category and Tags */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(module.category)}`}>
                  {module.category}
                </span>
                {module.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="inline-flex px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Dependencies */}
              {module.dependencies.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Dependências:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.dependencies.map((dep) => (
                      <span key={dep.moduleId} className={`inline-flex px-2 py-1 text-xs rounded ${
                        dep.required 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {dep.moduleId}
                        {dep.required && ' *'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Roles */}
              {module.requiredRoles.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Roles Necessárias:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.requiredRoles.map((role) => (
                      <span key={role} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t">
                <span>por {module.author}</span>
                <span>{new Date(module.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Nenhum módulo encontrado com os filtros aplicados.' 
              : 'Nenhum módulo encontrado.'}
          </p>
        </div>
      )}

      {/* Most Used Modules */}
      {stats && stats.mostUsedModules.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Módulos Mais Utilizados</h3>
          <div className="space-y-3">
            {stats.mostUsedModules.slice(0, 5).map((moduleUsage, index) => (
              <div key={moduleUsage.moduleId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{moduleUsage.moduleName}</p>
                    <p className="text-xs text-gray-500">{moduleUsage.tenantCount} tenants</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {moduleUsage.totalRequests.toLocaleString()} requests
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="text-blue-400">ℹ️</div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Informações sobre Módulos</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Módulos Core</strong>: Essenciais para o sistema, não podem ser desabilitados</li>
                <li><strong>Dependências com *</strong>: Obrigatórias para o funcionamento do módulo</li>
                <li><strong>Categoria</strong>: Agrupa módulos por funcionalidade</li>
                <li><strong>Roles</strong>: Permissões mínimas necessárias para usar o módulo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}