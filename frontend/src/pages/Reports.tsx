import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Phone,
  Download,
  Calendar,
  Filter,
  Activity
} from 'lucide-react';
import { api } from '../lib/api';

interface ReportMetrics {
  messagesPerDay: number[];
  conversationsPerDay: number[];
  responseTimeAvg: number;
  topContacts: Array<{
    name: string;
    phone: string;
    messageCount: number;
  }>;
  instancePerformance: Array<{
    name: string;
    messageCount: number;
    status: string;
  }>;
}

const Reports: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics>({
    messagesPerDay: [],
    conversationsPerDay: [],
    responseTimeAvg: 0,
    topContacts: [],
    instancePerformance: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockData: ReportMetrics = {
        messagesPerDay: [45, 52, 38, 61, 33, 48, 55],
        conversationsPerDay: [12, 15, 8, 18, 9, 14, 16],
        responseTimeAvg: 4.2,
        topContacts: [
          { name: 'João Silva', phone: '+5511987654321', messageCount: 45 },
          { name: 'Maria Santos', phone: '+5511876543210', messageCount: 38 },
          { name: 'Pedro Costa', phone: '+5511765432109', messageCount: 32 }
        ],
        instancePerformance: [
          { name: 'Comercial', messageCount: 128, status: 'connected' },
          { name: 'Suporte', messageCount: 94, status: 'connected' },
          { name: 'Vendas', messageCount: 76, status: 'disconnected' }
        ]
      };
      
      setMetrics(mockData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // TODO: Implement actual export functionality
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Análise de performance e métricas</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <button 
            onClick={() => exportReport('excel')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mensagens por Dia</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">
                {(metrics.messagesPerDay.reduce((a, b) => a + b, 0) / metrics.messagesPerDay.length || 0).toFixed(0)}
              </p>
              <p className="text-sm mt-2 text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% vs período anterior
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio de Resposta</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">{metrics.responseTimeAvg}min</p>
              <p className="text-sm mt-2 text-green-600 flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Dentro da meta
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
              <p className="text-2xl font-bold text-dark-900 mt-2">94%</p>
              <p className="text-sm mt-2 text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +2.1% vs período anterior
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Volume de Mensagens</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {metrics.messagesPerDay.map((count, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-primary-gradient rounded-t w-full min-h-4"
                  style={{ height: `${(count / Math.max(...metrics.messagesPerDay)) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Contatos Mais Ativos</h2>
          <div className="space-y-4">
            {metrics.topContacts.map((contact, index) => (
              <div key={contact.phone} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-dark-900">{contact.messageCount}</p>
                  <p className="text-xs text-gray-500">mensagens</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instance Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-dark-900 mb-6">Performance por Instância</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.instancePerformance.map((instance) => (
            <div key={instance.name} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-dark-900">{instance.name}</h3>
                <div className={`w-3 h-3 rounded-full ${
                  instance.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mensagens:</span>
                  <span className="text-sm font-medium">{instance.messageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    instance.status === 'connected' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;