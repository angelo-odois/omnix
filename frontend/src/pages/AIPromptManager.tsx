import { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Settings, 
  Zap,
  Brain,
  Target,
  BarChart3,
  Save,
  X,
  Code,
  TestTube,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';

interface AIPrompt {
  id: string;
  name: string;
  description: string;
  category: 'sentiment' | 'suggestions' | 'general' | 'custom';
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  usage: {
    totalUsed: number;
    successRate: number;
    avgResponseTime: number;
  };
  settings: {
    temperature: number;
    maxTokens: number;
    model: string;
  };
}

interface AIScript {
  id: string;
  name: string;
  description: string;
  businessContext: {
    industry: string;
    company: string;
    products: string[];
    policies: string[];
  };
  isActive: boolean;
  stats: {
    timesUsed: number;
    avgSatisfaction: number;
    resolutionRate: number;
  };
}

export default function AIPromptManager() {
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [scripts, setScripts] = useState<AIScript[]>([]);
  const [activeTab, setActiveTab] = useState<'prompts' | 'scripts' | 'testing'>('prompts');
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as any,
    systemPrompt: '',
    userPromptTemplate: '',
    temperature: 0.7,
    maxTokens: 500,
    model: 'gpt-4o-mini'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load real data from API
      const [promptsResponse, scriptsResponse] = await Promise.all([
        api.get('/ai/prompts'),
        api.get('/ai/scripts')
      ]);
      
      const apiPrompts = promptsResponse.data.data || [];
      const apiScripts = scriptsResponse.data.data || [];
      
      // Merge with mock data for demo
      const mockPrompts: AIPrompt[] = [
        {
          id: '1',
          name: 'Atendimento Padrão',
          description: 'Prompt base para atendimento geral',
          category: 'suggestions',
          systemPrompt: 'Você é um atendente profissional brasileiro especializado em excelência no atendimento.',
          userPromptTemplate: 'Cliente {customerName} enviou: {messageHistory}\n\nGere 3 sugestões de resposta empáticas.',
          variables: ['customerName', 'messageHistory'],
          isActive: true,
          isDefault: true,
          priority: 100,
          usage: { totalUsed: 1247, successRate: 0.94, avgResponseTime: 1.3 },
          settings: { temperature: 0.7, maxTokens: 400, model: 'gpt-4o-mini' }
        },
        {
          id: '2',
          name: 'E-commerce Pro',
          description: 'Otimizado para vendas e conversão',
          category: 'custom',
          systemPrompt: 'Você é um consultor de vendas expert. Foque em identificar necessidades, apresentar soluções e converter leads.',
          userPromptTemplate: 'Cliente {customerName} interessado em produtos:\n{messageHistory}\n\nContexto: {businessContext}\n\nSugestões para aumentar conversão:',
          variables: ['customerName', 'messageHistory', 'businessContext'],
          isActive: false,
          isDefault: false,
          priority: 80,
          usage: { totalUsed: 567, successRate: 0.87, avgResponseTime: 1.8 },
          settings: { temperature: 0.8, maxTokens: 600, model: 'gpt-4o-mini' }
        }
      ];

      const mockScripts: AIScript[] = [
        {
          id: '1',
          name: 'Suporte Técnico',
          description: 'Script para resolução de problemas técnicos',
          businessContext: {
            industry: 'Tecnologia',
            company: 'TechCorp',
            products: ['Software', 'Apps', 'API'],
            policies: ['Suporte 24/7', 'Garantia 30 dias']
          },
          isActive: true,
          stats: { timesUsed: 234, avgSatisfaction: 4.7, resolutionRate: 0.89 }
        }
      ];

      // Use API data if available, otherwise use mock data
      setPrompts(apiPrompts.length > 0 ? apiPrompts : mockPrompts);
      setScripts(apiScripts.length > 0 ? apiScripts : mockScripts);
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    try {
      const promptData = {
        ...formData,
        variables: extractVariables(formData.userPromptTemplate),
        settings: {
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          model: formData.model
        }
      };

      if (showEditModal && selectedPrompt) {
        // Update existing prompt
        const response = await api.put(`/ai/prompts/${selectedPrompt.id}`, promptData);
        
        if (response.data.success) {
          setPrompts(prev => prev.map(p => 
            p.id === selectedPrompt.id ? response.data.data : p
          ));
          setShowEditModal(false);
          setSelectedPrompt(null);
          resetForm();
          alert('Prompt atualizado com sucesso!');
        }
      } else {
        // Create new prompt
        const response = await api.post('/ai/prompts', promptData);
        
        if (response.data.success) {
          setPrompts(prev => [...prev, response.data.data]);
          setShowCreateModal(false);
          resetForm();
          alert('Prompt criado com sucesso!');
        }
      }
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      alert('Erro ao salvar prompt: ' + (error.response?.data?.message || error.message));
    }
  };

  const extractVariables = (template: string): string[] => {
    const regex = /{(\w+)}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      systemPrompt: '',
      userPromptTemplate: '',
      temperature: 0.7,
      maxTokens: 500,
      model: 'gpt-4o-mini'
    });
  };

  const testPrompt = async (prompt: AIPrompt) => {
    setTesting(true);
    setSelectedPrompt(prompt);
    
    try {
      const testMessages = [
        'Cliente: Olá, gostaria de informações sobre seus produtos',
        'Atendente: Claro! Que tipo de produto você procura?', 
        'Cliente: Estou procurando um smartphone bom e barato'
      ];

      const response = await api.post(`/ai/prompts/${prompt.id}/test`, {
        testMessages,
        customerName: 'João Silva (Teste)'
      });
      
      setTestResult(response.data);
    } catch (error: any) {
      console.error('Error testing prompt:', error);
      setTestResult({ 
        error: error.response?.data?.message || error.message || 'Erro no teste' 
      });
    } finally {
      setTesting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sentiment': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'suggestions': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'general': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'custom': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="w-7 h-7 mr-3 text-purple-600" />
            Gerenciador de IA
          </h1>
          <p className="text-gray-600 mt-1">Configure prompts e scripts personalizados para o assistente IA</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Prompt
        </button>
      </div>


      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'prompts', label: 'Prompts IA', icon: Bot, count: prompts.length },
            { id: 'scripts', label: 'Scripts', icon: Zap, count: scripts.length },
            { id: 'testing', label: 'Testes', icon: TestTube, count: 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(prompt.category)}`}>
                        {prompt.category}
                      </span>
                      {prompt.isDefault && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded-full border border-yellow-200">
                          Padrão (Somente Leitura)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{prompt.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <div className={`w-3 h-3 rounded-full ${prompt.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Usage Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{prompt.usage.totalUsed}</div>
                    <div className="text-xs text-gray-500">Usos</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{(prompt.usage.successRate * 100).toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">Sucesso</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{prompt.usage.avgResponseTime.toFixed(1)}s</div>
                    <div className="text-xs text-gray-500">Tempo</div>
                  </div>
                </div>

                {/* Variables */}
                {prompt.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Variáveis:</p>
                    <div className="flex flex-wrap gap-1">
                      {prompt.variables.map(variable => (
                        <span key={variable} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-mono">
                          {'{' + variable + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Settings Preview */}
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <div>Temperature: {prompt.settings.temperature}</div>
                  <div>Max Tokens: {prompt.settings.maxTokens}</div>
                  <div>Model: {prompt.settings.model}</div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testPrompt(prompt)}
                    disabled={testing}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Testar Prompt"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      console.log('✏️ Editing prompt:', prompt.id, prompt.name);
                      setSelectedPrompt(prompt);
                      setFormData({
                        name: prompt.name,
                        description: prompt.description,
                        category: prompt.category,
                        systemPrompt: prompt.systemPrompt,
                        userPromptTemplate: prompt.userPromptTemplate,
                        temperature: prompt.settings.temperature,
                        maxTokens: prompt.settings.maxTokens,
                        model: prompt.settings.model
                      });
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title={prompt.isDefault ? 'Prompts padrão não podem ser editados' : 'Editar'}
                    disabled={prompt.isDefault}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setPrompts(prev => 
                        prev.map(p => 
                          p.id === prompt.id 
                            ? { ...p, isActive: !p.isActive }
                            : p
                        )
                      );
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      prompt.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {prompt.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'testing' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TestTube className="w-5 h-5 mr-2 text-green-500" />
              Teste de Prompts IA
            </h3>

            {/* Test Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt para Testar
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onChange={(e) => setSelectedPrompt(prompts.find(p => p.id === e.target.value) || null)}
                >
                  <option value="">Selecione um prompt</option>
                  {prompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name} ({prompt.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente (Teste)
                </label>
                <input
                  type="text"
                  defaultValue="João Silva"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagens de Teste
              </label>
              <textarea
                rows={4}
                defaultValue="Cliente: Olá, gostaria de informações sobre seus produtos&#10;Atendente: Claro! Que tipo de produto você procura?&#10;Cliente: Estou procurando um smartphone bom e barato"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => selectedPrompt && testPrompt(selectedPrompt)}
              disabled={!selectedPrompt || testing}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Testar Prompt
                </>
              )}
            </button>

            {/* Test Results */}
            {testResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Resultado do Teste</h4>
                {testResult.error ? (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>{testResult.error}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResult.data?.suggestions?.map((suggestion: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-800">{suggestion.content}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs">
                          <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            {suggestion.tone}
                          </span>
                          <span className="text-gray-500">
                            {(suggestion.confidence * 100).toFixed(0)}% confiança
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showCreateModal ? 'Criar Novo Prompt' : 'Editar Prompt'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Prompt
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Atendimento E-commerce"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="custom">Personalizado</option>
                    <option value="sentiment">Análise de Sentimento</option>
                    <option value="suggestions">Sugestões de Resposta</option>
                    <option value="general">Geral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descreva o propósito e contexto deste prompt..."
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Code className="w-4 h-4 inline mr-1" />
                  Prompt do Sistema
                </label>
                <textarea
                  rows={6}
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="Você é um especialista em atendimento ao cliente brasileiro...&#10;&#10;Suas responsabilidades:&#10;- Analisar o sentimento do cliente&#10;- Gerar respostas empáticas&#10;- Manter tom profissional&#10;..."
                />
              </div>

              {/* User Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template da Mensagem do Usuário
                </label>
                <textarea
                  rows={4}
                  value={formData.userPromptTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, userPromptTemplate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="Cliente {customerName} enviou as seguintes mensagens:&#10;{messageHistory}&#10;&#10;Contexto do negócio: {businessContext}&#10;&#10;Gere 3 sugestões de resposta..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Use variáveis como {'{customerName}'}, {'{messageHistory}'}, {'{businessContext}'}
                </p>
              </div>

              {/* AI Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{formData.temperature}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Rápido)</option>
                    <option value="gpt-4o">GPT-4o (Premium)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePrompt}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {showCreateModal ? 'Criar Prompt' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}