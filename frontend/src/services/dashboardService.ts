import { api } from '../lib/api';

export interface DashboardMetrics {
  conversations: {
    total: number;
    active: number;
    unread: number;
    change: number;
  };
  contacts: {
    total: number;
    new: number;
    change: number;
  };
  instances: {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
  };
  messages: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    avgResponseTime: number;
    change: number;
  };
  workflows: {
    total: number;
    active: number;
    executionsToday: number;
    change: number;
  };
}

export interface ConversationStats {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessageAt: string;
  unreadCount: number;
  isArchived: boolean;
  instanceName?: string;
}

export interface InstanceStats {
  id: string;
  name: string;
  phoneNumber: string | null;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  messagesToday: number;
  lastSeen: string | null;
}

export interface RecentActivity {
  id: string;
  type: 'message' | 'conversation' | 'instance' | 'workflow';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface TeamPerformance {
  userId: string;
  userName: string;
  conversationsToday: number;
  avgResponseTime: number;
  satisfaction: number;
  status: 'online' | 'offline' | 'away';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  conversations: ConversationStats[];
  instances: InstanceStats[];
  recentActivity: RecentActivity[];
  teamPerformance: TeamPerformance[];
  lastUpdated: string;
}

export interface PeriodFilter {
  period: 'today' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

class DashboardService {
  /**
   * Get all dashboard data
   */
  async getDashboardData(filter?: PeriodFilter): Promise<DashboardData> {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard', { params });
    return response.data.data;
  }

  /**
   * Get dashboard metrics only
   */
  async getMetrics(filter?: PeriodFilter): Promise<DashboardMetrics> {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard/metrics', { params });
    return response.data.data;
  }

  /**
   * Get active conversations with stats
   */
  async getConversations(limit = 10): Promise<ConversationStats[]> {
    const response = await api.get('/dashboard/conversations', { 
      params: { limit } 
    });
    return response.data.data;
  }

  /**
   * Get WhatsApp instances status
   */
  async getInstances(): Promise<InstanceStats[]> {
    const response = await api.get('/dashboard/instances');
    return response.data.data;
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit = 20): Promise<RecentActivity[]> {
    const response = await api.get('/dashboard/activity', { 
      params: { limit } 
    });
    return response.data.data;
  }

  /**
   * Get team performance metrics
   */
  async getTeamPerformance(filter?: PeriodFilter): Promise<TeamPerformance[]> {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard/team', { params });
    return response.data.data;
  }

  /**
   * Get message analytics
   */
  async getMessageAnalytics(filter?: PeriodFilter) {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard/messages/analytics', { params });
    return response.data.data;
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(filter?: PeriodFilter) {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard/conversations/analytics', { params });
    return response.data.data;
  }

  /**
   * Get workflow execution stats
   */
  async getWorkflowStats(filter?: PeriodFilter) {
    const params = filter ? { 
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate 
    } : {};
    
    const response = await api.get('/dashboard/workflows/stats', { params });
    return response.data.data;
  }

  /**
   * Get real-time notifications count
   */
  async getNotificationsCount(): Promise<{ unread: number; total: number }> {
    const response = await api.get('/dashboard/notifications/count');
    return response.data.data;
  }

  /**
   * Export dashboard data
   */
  async exportData(format: 'csv' | 'xlsx' | 'pdf', filter?: PeriodFilter): Promise<Blob> {
    const params = {
      format,
      ...filter
    };
    
    const response = await api.get('/dashboard/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Refresh dashboard cache
   */
  async refreshCache(): Promise<void> {
    await api.post('/dashboard/refresh');
  }
}

export const dashboardService = new DashboardService();