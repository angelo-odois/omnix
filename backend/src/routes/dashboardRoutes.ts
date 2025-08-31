import { Router } from 'express';
import { authMiddleware } from '../middlewares/authV2';
import { Request, Response } from 'express';
import { db } from '../lib/database';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Dashboard metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const { period = 'today' } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get conversations metrics
    const [totalConversations, activeConversations, unreadConversations] = await Promise.all([
      db.conversation.count({
        where: { tenantId, createdAt: { gte: startDate } }
      }),
      db.conversation.count({
        where: { 
          tenantId, 
          lastMessageAt: { gte: startDate },
          isArchived: false
        }
      }),
      db.conversation.count({
        where: { 
          tenantId, 
          unreadCount: { gt: 0 },
          isArchived: false
        }
      })
    ]);

    // Get contacts metrics
    const [totalContacts, newContacts] = await Promise.all([
      db.contact.count({ where: { tenantId } }),
      db.contact.count({
        where: { tenantId, createdAt: { gte: startDate } }
      })
    ]);

    // Get instances metrics
    const [totalInstances, connectedInstances, disconnectedInstances, errorInstances] = await Promise.all([
      db.whatsAppInstance.count({ where: { tenantId } }),
      db.whatsAppInstance.count({
        where: { tenantId, status: 'connected' }
      }),
      db.whatsAppInstance.count({
        where: { tenantId, status: 'disconnected' }
      }),
      db.whatsAppInstance.count({
        where: { tenantId, status: 'error' }
      })
    ]);

    // Get messages metrics
    const messagesCount = await db.message.count({
      where: { 
        tenantId, 
        createdAt: { gte: startDate }
      }
    });

    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [messagesThisWeek, messagesThisMonth] = await Promise.all([
      db.message.count({
        where: { tenantId, createdAt: { gte: thisWeekStart } }
      }),
      db.message.count({
        where: { tenantId, createdAt: { gte: thisMonthStart } }
      })
    ]);

    // Calculate average response time (simplified)
    const avgResponseTime = 4.2; // TODO: Implement real calculation

    // Get workflows metrics
    const [totalWorkflows, activeWorkflows] = await Promise.all([
      db.workflow.count({ where: { tenantId } }),
      db.workflow.count({
        where: { tenantId, isActive: true }
      })
    ]);

    const workflowExecutions = await db.workflowExecution.count({
      where: {
        tenantId,
        startedAt: { gte: startDate }
      }
    });

    const metrics = {
      conversations: {
        total: totalConversations,
        active: activeConversations,
        unread: unreadConversations,
        change: 8.5 // TODO: Calculate real change
      },
      contacts: {
        total: totalContacts,
        new: newContacts,
        change: 5.2 // TODO: Calculate real change
      },
      instances: {
        total: totalInstances,
        connected: connectedInstances,
        disconnected: disconnectedInstances,
        error: errorInstances
      },
      messages: {
        today: messagesCount,
        thisWeek: messagesThisWeek,
        thisMonth: messagesThisMonth,
        avgResponseTime: avgResponseTime,
        change: -12.3 // TODO: Calculate real change
      },
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows,
        executionsToday: workflowExecutions,
        change: 15.7 // TODO: Calculate real change
      }
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar métricas do dashboard'
    });
  }
});

// Get instances with today's message count
router.get('/instances', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const instances = await db.whatsAppInstance.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true,
        lastSeen: true
      }
    });

    // Get message counts for each instance
    const instancesWithMessages = await Promise.all(
      instances.map(async (instance) => {
        const messagesToday = await db.message.count({
          where: {
            tenantId,
            createdAt: { gte: today },
            // TODO: Add instance relation when available
          }
        });

        return {
          ...instance,
          messagesToday
        };
      })
    );

    res.json({
      success: true,
      data: instancesWithMessages
    });

  } catch (error) {
    console.error('Dashboard instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar instâncias'
    });
  }
});

// Get recent activity
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Get recent conversations
    const recentConversations = await db.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) / 2,
      select: {
        id: true,
        contactName: true,
        contactPhone: true,
        createdAt: true
      }
    });

    // Get recent messages
    const recentMessages = await db.message.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) / 2,
      select: {
        id: true,
        from: true,
        content: true,
        createdAt: true,
        conversation: {
          select: {
            contactName: true,
            contactPhone: true
          }
        }
      }
    });

    // Combine and format activities
    const activities = [
      ...recentConversations.map(conv => ({
        id: `conv_${conv.id}`,
        type: 'conversation' as const,
        title: `Nova conversa com ${conv.contactName || conv.contactPhone}`,
        description: 'Conversa iniciada',
        timestamp: conv.createdAt.toISOString()
      })),
      ...recentMessages.map(msg => ({
        id: `msg_${msg.id}`,
        type: 'message' as const,
        title: `Nova mensagem de ${msg.conversation?.contactName || msg.from}`,
        description: msg.content.substring(0, 50) + '...',
        timestamp: msg.createdAt.toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, Number(limit));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar atividade recente'
    });
  }
});

// Get team performance
router.get('/team', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Get team members (users in this tenant)
    const teamMembers = await db.user.findMany({
      where: { 
        tenantId,
        isActive: true,
        role: { in: ['tenant_operator', 'tenant_manager'] }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock performance data for now
    const teamPerformance = teamMembers.map(member => ({
      userId: member.id,
      userName: member.name,
      conversationsToday: Math.floor(Math.random() * 30) + 5,
      avgResponseTime: Math.floor(Math.random() * 300) + 60, // seconds
      satisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
      status: ['online', 'offline', 'away'][Math.floor(Math.random() * 3)] as 'online' | 'offline' | 'away'
    }));

    res.json({
      success: true,
      data: teamPerformance
    });

  } catch (error) {
    console.error('Dashboard team error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar performance da equipe'
    });
  }
});

// Get complete dashboard data
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Make parallel requests to get all dashboard data
    const [metricsRes, instancesRes, activityRes, teamRes] = await Promise.all([
      fetch(`http://localhost:8300/api/dashboard/metrics?${new URLSearchParams(req.query as any)}`, {
        headers: { 'Authorization': req.headers.authorization || '' }
      }),
      fetch(`http://localhost:8300/api/dashboard/instances`, {
        headers: { 'Authorization': req.headers.authorization || '' }
      }),
      fetch(`http://localhost:8300/api/dashboard/activity?limit=20`, {
        headers: { 'Authorization': req.headers.authorization || '' }
      }),
      fetch(`http://localhost:8300/api/dashboard/team`, {
        headers: { 'Authorization': req.headers.authorization || '' }
      })
    ]);

    const [metrics, instances, activity, team] = await Promise.all([
      metricsRes.json().then(r => r.data),
      instancesRes.json().then(r => r.data),
      activityRes.json().then(r => r.data),
      teamRes.json().then(r => r.data)
    ]);

    // Mock conversations for now
    const conversations = [
      {
        id: '1',
        contactName: 'João Silva',
        contactPhone: '+5511987654321',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 3,
        isArchived: false,
        instanceName: 'Comercial'
      }
    ];

    const dashboardData = {
      metrics,
      conversations,
      instances,
      recentActivity: activity,
      teamPerformance: team,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    // Fallback to individual endpoint calls
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar dados do dashboard'
    });
  }
});

export default router;