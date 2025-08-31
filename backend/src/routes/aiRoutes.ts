import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/authV2';
import { requireModule } from '../middlewares/moduleAuth';
import { SYSTEM_MODULES } from '../types/modules';
import aiService from '../services/aiService';
import aiPromptService from '../services/aiPromptService';
import aiCacheService from '../services/aiCacheService';
import prisma from '../lib/database';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Analyze conversation sentiment
router.post('/analyze-sentiment', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, contactName } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa é obrigatório'
      });
    }

    // Get recent messages from conversation
    const messages = await prisma.message.findMany({
      where: { 
        conversationId,
        tenantId: req.user?.tenantId 
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma mensagem encontrada na conversa'
      });
    }

    // Extract message contents for analysis
    const messageContents = messages
      .reverse() // Oldest first for context
      .map(msg => `${msg.isInbound ? 'Cliente' : 'Atendente'}: ${msg.content}`);

    const analysis = await aiService.analyzeSentiment(messageContents, contactName);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('AI sentiment analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na análise de sentimento: ' + error.message
    });
  }
});

// Generate response suggestions
router.post('/suggest-responses', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, contactName, businessContext } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa é obrigatório'
      });
    }

    // Get more recent messages for better context
    const messages = await prisma.message.findMany({
      where: { 
        conversationId,
        tenantId: req.user?.tenantId 
      },
      orderBy: { timestamp: 'desc' },
      take: 15 // Increased from 5 to 15 for better context
    });

    // Build richer context with timestamps and more details
    const messageContents = messages
      .reverse() // Oldest first for chronological context
      .map((msg, index) => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString('pt-BR');
        const role = msg.isInbound ? 'Cliente' : 'Atendente';
        return `[${timestamp}] ${role}: ${msg.content}`;
      });

    // Also get conversation metadata for additional context
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    console.log(`🧠 AI Context: ${messageContents.length} messages for ${contactName || conversation?.contactName || 'Cliente'}`);
    console.log('📝 Recent messages:', messageContents.slice(-3)); // Log last 3 for debugging

    // Get sentiment analysis first
    const sentiment = await aiService.analyzeSentiment(messageContents, contactName);
    
    // Generate suggestions based on sentiment (with caching)
    const suggestions = await aiService.generateResponseSuggestions(
      messageContents,
      sentiment,
      contactName,
      businessContext,
      req.user?.tenantId,
      req.body.customPromptId, // use custom prompt if provided
      conversationId // enable caching
    );

    res.json({
      success: true,
      data: {
        sentiment,
        suggestions
      }
    });
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar sugestões: ' + error.message
    });
  }
});

// Get conversation insights
router.post('/conversation-insights', requireModule(SYSTEM_MODULES.MESSAGES, 'read'), async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'ID da conversa é obrigatório'
      });
    }

    // Get conversation data
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        tenantId: req.user?.tenantId 
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: 15
    });

    const messageContents = messages
      .reverse()
      .map(msg => msg.content);

    // Calculate conversation duration
    const firstMessage = messages[messages.length - 1];
    const lastMessage = messages[0];
    const duration = firstMessage && lastMessage 
      ? Math.floor((new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime()) / 60000)
      : 0;

    // Get sentiment and insights
    const sentiment = await aiService.analyzeSentiment(messageContents, conversation.contactName || undefined);
    const insights = await aiService.generateConversationInsights(messageContents, sentiment, duration);

    res.json({
      success: true,
      data: {
        sentiment,
        insights,
        stats: {
          messageCount: messages.length,
          duration: duration,
          responseTime: 2.5, // Mock average response time
          lastActivity: lastMessage?.timestamp || conversation.lastMessageAt
        }
      }
    });
  } catch (error: any) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar insights: ' + error.message
    });
  }
});

// Quick AI response for immediate help
router.post('/quick-response', requireModule(SYSTEM_MODULES.MESSAGES, 'write'), async (req: AuthRequest, res: Response) => {
  try {
    const { message, tone, contactName } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    const improvedMessage = await aiService.improveMessage(message, tone || 'professional', contactName);

    res.json({
      success: true,
      data: {
        original: message,
        improved: improvedMessage || message,
        tone: tone || 'professional'
      }
    });
  } catch (error: any) {
    console.error('Quick response error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao melhorar resposta: ' + error.message
    });
  }
});

// ============= PROMPT MANAGEMENT =============

// Get all prompts for tenant
router.get('/prompts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const prompts = await aiPromptService.getPromptTemplates(req.user.tenantId);
    
    res.json({
      success: true,
      data: prompts
    });
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar prompts'
    });
  }
});

// Create new prompt
router.post('/prompts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    // Only admins can create prompts
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem criar prompts'
      });
    }

    console.log(`🆕 Creating new prompt for tenant ${req.user.tenantId}`);
    console.log('📝 Prompt data:', JSON.stringify(req.body, null, 2));
    
    const prompt = await aiPromptService.createPromptTemplate(req.user.tenantId, req.body);
    
    console.log(`✅ Successfully created prompt: ${prompt.name} (${prompt.id})`);
    
    res.json({
      success: true,
      data: prompt,
      message: 'Prompt criado com sucesso'
    });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar prompt'
    });
  }
});

// Update prompt
router.put('/prompts/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem editar prompts'
      });
    }

    const { id } = req.params;
    console.log(`🔄 Updating prompt ${id} for tenant ${req.user.tenantId}`);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    const updatedPrompt = await aiPromptService.updatePromptTemplate(req.user.tenantId, id, req.body);
    
    if (!updatedPrompt) {
      console.log(`❌ Prompt ${id} not found for tenant ${req.user.tenantId}`);
      return res.status(404).json({
        success: false,
        message: 'Prompt não encontrado'
      });
    }

    console.log(`✅ Successfully updated prompt: ${updatedPrompt.name}`);
    res.json({
      success: true,
      data: updatedPrompt,
      message: 'Prompt atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar prompt'
    });
  }
});

// Test prompt with sample data
router.post('/prompts/:id/test', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { testMessages, customerName } = req.body;

    if (!testMessages) {
      return res.status(400).json({
        success: false,
        message: 'Mensagens de teste são obrigatórias'
      });
    }

    // Get sentiment first
    const sentiment = await aiService.analyzeSentiment(testMessages, customerName);
    
    // Generate suggestions with custom prompt (no cache for tests)
    const suggestions = await aiService.generateResponseSuggestions(
      testMessages,
      sentiment,
      customerName,
      'Teste de prompt personalizado',
      req.user?.tenantId,
      id
    );

    res.json({
      success: true,
      data: {
        sentiment,
        suggestions,
        promptUsed: id,
        testContext: {
          customerName,
          messageCount: testMessages.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error testing prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao testar prompt'
    });
  }
});

// Get AI scripts
router.get('/scripts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant não identificado'
      });
    }

    const scripts = await aiPromptService.getAIScripts(req.user.tenantId);
    
    res.json({
      success: true,
      data: scripts
    });
  } catch (error: any) {
    console.error('Error fetching scripts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar scripts'
    });
  }
});

// ============= CACHE MANAGEMENT =============

// Get cache statistics
router.get('/cache/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can view cache stats
    if (!['super_admin', 'tenant_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const stats = aiCacheService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        creditsSaved: Math.floor(stats.totalHits * 0.002), // Estimate credits saved
        costSavings: (stats.totalHits * 0.002 * 0.002).toFixed(4) // Rough USD estimate
      }
    });
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao obter estatísticas'
    });
  }
});

// Clear conversation cache
router.delete('/cache/:conversationId', async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    await aiCacheService.invalidateCache(conversationId, 'manual clear by admin');
    
    res.json({
      success: true,
      message: 'Cache da conversa limpo com sucesso'
    });
  } catch (error: any) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao limpar cache'
    });
  }
});

// Force refresh conversation analysis
router.post('/cache/:conversationId/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // Clear existing cache
    await aiCacheService.refreshConversationCache(conversationId);
    
    // Get fresh messages and re-analyze
    const messages = await prisma.message.findMany({
      where: { 
        conversationId,
        tenantId: req.user?.tenantId 
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    if (messages.length > 0) {
      const messageContents = messages
        .reverse()
        .map(msg => `${msg.isInbound ? 'Cliente' : 'Atendente'}: ${msg.content}`);

      // Force new analysis
      const sentiment = await aiService.analyzeSentiment(messageContents);
      const suggestions = await aiService.generateResponseSuggestions(
        messageContents,
        sentiment,
        undefined,
        undefined,
        req.user?.tenantId,
        undefined,
        conversationId
      );

      res.json({
        success: true,
        data: { sentiment, suggestions },
        message: 'Análise atualizada com sucesso'
      });
    } else {
      res.json({
        success: false,
        message: 'Nenhuma mensagem encontrada para analisar'
      });
    }
  } catch (error: any) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar análise'
    });
  }
});

export default router;