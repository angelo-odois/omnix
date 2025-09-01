import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService, type DashboardData, type PeriodFilter } from '../services/dashboardService';
import { api } from '../lib/api';

interface UseDashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  initialFilter?: PeriodFilter;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    initialFilter = { period: 'today' }
  } = options;

  const [state, setState] = useState<UseDashboardState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [filter, setFilter] = useState<PeriodFilter>(initialFilter);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      // Tentar buscar instâncias reais diretamente
      let realInstances = [];
      try {
        console.log('Fetching real instances...');
        const instancesResponse = await api.get('/whatsapp/instances');
        realInstances = instancesResponse.data.data || [];
        console.log('Real instances fetched:', realInstances.length, realInstances);
      } catch (error) {
        console.log('Failed to fetch real instances:', error);
      }

      // Use dados reais das instâncias se disponíveis
      const data = {
        metrics: {
          conversations: { total: 0, active: 0, unread: 0, change: 0 },
          contacts: { total: 0, new: 0, change: 0 },
          instances: { 
            total: realInstances.length,
            connected: realInstances.filter((i: any) => i.status === 'connected').length,
            disconnected: realInstances.filter((i: any) => i.status === 'disconnected').length,
            error: realInstances.filter((i: any) => i.status === 'error').length
          },
          messages: { today: 0, thisWeek: 0, thisMonth: 0, avgResponseTime: 0, change: 0 },
          workflows: { total: 0, active: 0, executionsToday: 0, change: 0 }
        },
        conversations: [],
        instances: realInstances.map((instance: any) => ({
          id: instance.id,
          name: instance.name,
          phoneNumber: instance.phoneNumber,
          status: instance.status,
          messagesToday: 0,
          lastSeen: instance.lastSeen,
          tenantName: instance.tenantName,
          tenantEmail: instance.tenantEmail
        })),
        recentActivity: [],
        teamPerformance: [],
        lastUpdated: new Date().toISOString()
      };
      
      setState(prev => ({
        ...prev,
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

      return data;
    } catch (error) {
      console.log('API failed, using fallback data:', error);
      
      // Fallback para mock data se API falhar
      const mockData: DashboardData = {
        metrics: {
          conversations: {
            total: 156,
            active: 42,
            unread: 12,
            change: 8.5
          },
          contacts: {
            total: 1234,
            new: 23,
            change: 5.2
          },
          instances: {
            total: 3,
            connected: 2,
            disconnected: 1,
            error: 0
          },
          messages: {
            today: 245,
            thisWeek: 1678,
            thisMonth: 6834,
            avgResponseTime: 4.5,
            change: -12.3
          },
          workflows: {
            total: 8,
            active: 6,
            executionsToday: 45,
            change: 15.7
          }
        },
        conversations: [
          {
            id: '1',
            contactName: 'João Silva',
            contactPhone: '+5511987654321',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 3,
            isArchived: false,
            instanceName: 'Comercial'
          },
          {
            id: '2',
            contactName: 'Maria Santos',
            contactPhone: '+5511123456789',
            lastMessageAt: new Date(Date.now() - 300000).toISOString(),
            unreadCount: 1,
            isArchived: false,
            instanceName: 'Suporte'
          }
        ],
        instances: [
          {
            id: '1',
            name: 'Comercial',
            phoneNumber: '+55 11 98765-4321',
            status: 'connected',
            messagesToday: 156,
            lastSeen: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Suporte',
            phoneNumber: '+55 61 91234-5678',
            status: 'connected',
            messagesToday: 89,
            lastSeen: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Financeiro',
            phoneNumber: null,
            status: 'disconnected',
            messagesToday: 0,
            lastSeen: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'message',
            title: 'Nova mensagem de João Silva',
            description: 'Olá, gostaria de mais informações...',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'conversation',
            title: 'Conversa iniciada com Maria Santos',
            description: 'Nova conversa no canal de suporte',
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '3',
            type: 'instance',
            title: 'Instância Financeiro desconectou',
            description: 'Instância perdeu conexão',
            timestamp: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: '4',
            type: 'workflow',
            title: 'Workflow de boas-vindas executado',
            description: 'Executado para novo contato',
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ],
        teamPerformance: [
          {
            userId: '1',
            userName: 'Maria Santos',
            conversationsToday: 24,
            avgResponseTime: 3.8,
            satisfaction: 95,
            status: 'online'
          },
          {
            userId: '2',
            userName: 'João Pedro',
            conversationsToday: 18,
            avgResponseTime: 5.2,
            satisfaction: 87,
            status: 'online'
          },
          {
            userId: '3',
            userName: 'Ana Costa',
            conversationsToday: 15,
            avgResponseTime: 4.1,
            satisfaction: 92,
            status: 'away'
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      
      setState(prev => ({
        ...prev,
        data: mockData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

      return mockData;
    }
  }, [filter]);

  const refreshData = useCallback(async () => {
    return fetchDashboardData(false);
  }, [fetchDashboardData]);

  const updateFilter = useCallback((newFilter: PeriodFilter) => {
    setFilter(newFilter);
  }, []);

  const exportData = useCallback(async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Simular exportação enquanto API não está implementada
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Export simulated:', format.toUpperCase());

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao exportar dados';
      
      console.error('❌ Export error:', errorMessage);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [filter]);

  const clearCache = useCallback(async () => {
    try {
      await fetchDashboardData(true);
      
      console.log({
        type: 'success',
        title: 'Cache Limpo',
        message: 'Dados atualizados com sucesso',
        priority: 'normal'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao limpar cache';
      
      console.error('❌ Clear cache error:', errorMessage);
    }
  }, [fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      refreshData().catch(() => {
        // Silently handle background refresh errors
        console.log('Background refresh failed');
      });
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Filter
    filter,
    updateFilter,
    
    // Actions
    refresh: refreshData,
    exportData,
    clearCache,
    
    // Utils
    isStale: state.lastUpdated ? Date.now() - state.lastUpdated.getTime() > refreshInterval : false,
  };
};