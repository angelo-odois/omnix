import prisma from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

export interface AIPromptTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: 'sentiment' | 'suggestions' | 'general' | 'custom';
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[]; // Available variables like {customerName}, {messageHistory}, etc.
  isActive: boolean;
  isDefault: boolean;
  priority: number; // Higher priority prompts are used first
  usage: {
    totalUsed: number;
    successRate: number;
    avgResponseTime: number;
    lastUsed?: Date;
  };
  settings: {
    temperature: number; // 0-1
    maxTokens: number;
    model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIScript {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  triggers: Array<{
    type: 'keyword' | 'sentiment' | 'time' | 'manual';
    condition: string;
    value?: string | number;
  }>;
  prompts: {
    sentimentAnalysis?: string;
    responseGeneration: string;
    contextualInfo?: string;
  };
  responseRules: Array<{
    condition: string; // e.g., "sentiment === 'negative'"
    action: 'escalate' | 'apologize' | 'offer_solution' | 'transfer';
    template: string;
  }>;
  businessContext: {
    industry: string;
    company: string;
    products: string[];
    policies: string[];
    commonIssues: string[];
  };
  isActive: boolean;
  priority: number;
  stats: {
    timesUsed: number;
    avgSatisfaction: number;
    resolutionRate: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class AIPromptService {
  private promptsStorage = new Map<string, AIPromptTemplate[]>();
  
  // ============= PROMPT TEMPLATES =============

  async getPromptTemplates(tenantId: string): Promise<AIPromptTemplate[]> {
    // Get from in-memory storage or create defaults
    if (!this.promptsStorage.has(tenantId)) {
      this.promptsStorage.set(tenantId, this.getDefaultPrompts(tenantId));
    }
    
    return this.promptsStorage.get(tenantId) || [];
  }

  async createPromptTemplate(tenantId: string, data: Partial<AIPromptTemplate>): Promise<AIPromptTemplate> {
    const prompt: AIPromptTemplate = {
      id: uuidv4(),
      tenantId,
      name: data.name || 'Novo Prompt',
      description: data.description || '',
      category: data.category || 'custom',
      systemPrompt: data.systemPrompt || '',
      userPromptTemplate: data.userPromptTemplate || '',
      variables: data.variables || [],
      isActive: data.isActive ?? true,
      isDefault: false,
      priority: data.priority || 0,
      usage: {
        totalUsed: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      settings: {
        temperature: data.settings?.temperature || 0.7,
        maxTokens: data.settings?.maxTokens || 500,
        model: data.settings?.model || 'gpt-4o-mini'
      },
      createdBy: tenantId, // In production, use actual user ID
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to in-memory storage
    const tenantPrompts = this.promptsStorage.get(tenantId) || [];
    tenantPrompts.push(prompt);
    this.promptsStorage.set(tenantId, tenantPrompts);
    
    console.log(`✅ Created prompt: ${prompt.name} for tenant ${tenantId}`);
    return prompt;
  }

  async updatePromptTemplate(tenantId: string, promptId: string, updates: Partial<AIPromptTemplate>): Promise<AIPromptTemplate | null> {
    const tenantPrompts = this.promptsStorage.get(tenantId) || [];
    const promptIndex = tenantPrompts.findIndex(p => p.id === promptId);
    
    if (promptIndex === -1) {
      console.log(`❌ Prompt not found: ${promptId} for tenant ${tenantId}`);
      console.log(`Available prompts:`, tenantPrompts.map(p => ({ id: p.id, name: p.name })));
      return null;
    }
    
    const updatedPrompt = {
      ...tenantPrompts[promptIndex],
      ...updates,
      id: promptId, // Ensure ID is preserved
      tenantId, // Ensure tenantId is preserved
      updatedAt: new Date()
    };
    
    tenantPrompts[promptIndex] = updatedPrompt;
    this.promptsStorage.set(tenantId, tenantPrompts);
    
    console.log(`✅ Updated prompt: ${updatedPrompt.name} (${promptId}) for tenant ${tenantId}`);
    return updatedPrompt;
  }

  async getPromptTemplate(tenantId: string, promptId: string): Promise<AIPromptTemplate | null> {
    const prompts = await this.getPromptTemplates(tenantId);
    return prompts.find(p => p.id === promptId) || null;
  }

  // ============= AI SCRIPTS =============

  async getAIScripts(tenantId: string): Promise<AIScript[]> {
    return this.getDefaultScripts(tenantId);
  }

  async createAIScript(tenantId: string, data: Partial<AIScript>): Promise<AIScript> {
    const script: AIScript = {
      id: uuidv4(),
      tenantId,
      name: data.name || 'Novo Script IA',
      description: data.description || '',
      triggers: data.triggers || [],
      prompts: {
        responseGeneration: data.prompts?.responseGeneration || '',
        sentimentAnalysis: data.prompts?.sentimentAnalysis,
        contextualInfo: data.prompts?.contextualInfo
      },
      responseRules: data.responseRules || [],
      businessContext: {
        industry: data.businessContext?.industry || '',
        company: data.businessContext?.company || '',
        products: data.businessContext?.products || [],
        policies: data.businessContext?.policies || [],
        commonIssues: data.businessContext?.commonIssues || []
      },
      isActive: data.isActive ?? true,
      priority: data.priority || 0,
      stats: {
        timesUsed: 0,
        avgSatisfaction: 0,
        resolutionRate: 0
      },
      createdBy: tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return script;
  }

  // ============= SCRIPT EXECUTION =============

  async executeScript(tenantId: string, scriptId: string, context: {
    messages: string[];
    customerName?: string;
    conversationId: string;
  }): Promise<{
    sentiment: any;
    suggestions: any[];
    insights: any[];
    scriptUsed: AIScript;
  }> {
    const script = await this.getAIScript(tenantId, scriptId);
    if (!script) {
      throw new Error('Script não encontrado');
    }

    // Build dynamic prompt based on script configuration
    const dynamicPrompt = this.buildDynamicPrompt(script, context);
    
    // This would integrate with aiService to execute with custom prompts
    return {
      sentiment: { sentiment: 'positive', confidence: 0.9, emotion: 'happy' },
      suggestions: [
        { content: 'Resposta personalizada baseada no script', confidence: 0.95 }
      ],
      insights: [],
      scriptUsed: script
    };
  }

  async getAIScript(tenantId: string, scriptId: string): Promise<AIScript | null> {
    const scripts = await this.getAIScripts(tenantId);
    return scripts.find(s => s.id === scriptId) || null;
  }

  // ============= UTILITIES =============

  private buildDynamicPrompt(script: AIScript, context: {
    messages: string[];
    customerName?: string;
    conversationId: string;
  }): string {
    let prompt = script.prompts.responseGeneration;
    
    // Replace variables
    prompt = prompt.replace('{customerName}', context.customerName || 'Cliente');
    prompt = prompt.replace('{messageHistory}', context.messages.join('\n'));
    prompt = prompt.replace('{company}', script.businessContext.company);
    prompt = prompt.replace('{products}', script.businessContext.products.join(', '));
    
    return prompt;
  }

  private getDefaultPrompts(tenantId: string): AIPromptTemplate[] {
    return [
      {
        id: 'default-sentiment',
        tenantId,
        name: 'Análise de Sentimento Padrão',
        description: 'Prompt padrão para análise de sentimento em conversas',
        category: 'sentiment',
        systemPrompt: `Você é um especialista em análise de sentimento para atendimento ao cliente brasileiro.
        Analise a conversa e seja preciso na detecção de emoções e urgência.`,
        userPromptTemplate: `CONVERSA COMPLETA com {customerName}:\n\n{messageHistory}\n\nAnalise o sentimento considerando TODO o histórico da conversa acima.`,
        variables: ['customerName', 'messageHistory'],
        isActive: true,
        isDefault: true,
        priority: 100,
        usage: { totalUsed: 156, successRate: 0.94, avgResponseTime: 1.2 },
        settings: { temperature: 0.3, maxTokens: 200, model: 'gpt-4o-mini' },
        createdBy: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'custom-ecommerce',
        tenantId,
        name: 'E-commerce Especializado',
        description: 'Prompt otimizado para lojas online e vendas',
        category: 'suggestions',
        systemPrompt: `Você é um atendente especializado em e-commerce brasileiro.
        Analise TODA a conversa para entender o contexto e necessidades do cliente.
        Foque em converter leads, resolver dúvidas sobre produtos e processar pedidos.
        Seja proativo em oferecer soluções baseadas no histórico completo da conversa.`,
        userPromptTemplate: `HISTÓRICO COMPLETO DA CONVERSA com {customerName}:
        
{messageHistory}

CONTEXTO: {businessContext}

Analise toda a conversa acima e gere 3 respostas estratégicas que:
1. Considerem todo o contexto da conversa
2. Aumentem as chances de conversão
3. Resolvam dúvidas baseadas no histórico`,
        variables: ['customerName', 'messageHistory'],
        isActive: false,
        isDefault: false,
        priority: 80,
        usage: { totalUsed: 89, successRate: 0.89, avgResponseTime: 1.5 },
        settings: { temperature: 0.7, maxTokens: 300, model: 'gpt-4o-mini' },
        createdBy: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  private getDefaultScripts(tenantId: string): AIScript[] {
    return [
      {
        id: 'customer-support-pro',
        tenantId,
        name: 'Suporte ao Cliente Pro',
        description: 'Script avançado para atendimento ao cliente com foco em resolução',
        triggers: [
          { type: 'keyword', condition: 'contains', value: 'problema|erro|bug|não funciona' },
          { type: 'sentiment', condition: 'negative', value: -0.5 }
        ],
        prompts: {
          sentimentAnalysis: `Analise o sentimento focando em frustração técnica e urgência do problema.`,
          responseGeneration: `Você é um especialista em suporte técnico da {company}.
          Cliente: {customerName}
          Produtos: {products}
          
          Histórico da conversa:
          {messageHistory}
          
          Gere 3 respostas empáticas e solucionadoras:
          1. Reconheça o problema
          2. Ofereça solução imediata 
          3. Previna problemas futuros
          
          Seja técnico mas acessível. Use linguagem brasileira natural.`,
          contextualInfo: 'Empresa de tecnologia com foco em soluções rápidas'
        },
        responseRules: [
          {
            condition: "sentiment === 'negative'",
            action: 'apologize',
            template: 'Peço desculpas pelo inconveniente, {customerName}. Vou resolver isso imediatamente.'
          },
          {
            condition: "urgency === 'high'",
            action: 'escalate',
            template: 'Entendo a urgência. Vou conectar você com nosso especialista técnico.'
          }
        ],
        businessContext: {
          industry: 'Tecnologia',
          company: 'TechSolutions',
          products: ['Software', 'Apps', 'Consultoria'],
          policies: ['Garantia 30 dias', 'Suporte 24/7', 'Reembolso integral'],
          commonIssues: ['Login', 'Performance', 'Bugs', 'Integração']
        },
        isActive: true,
        priority: 90,
        stats: { timesUsed: 234, avgSatisfaction: 4.6, resolutionRate: 0.87 },
        createdBy: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sales-optimizer',
        tenantId,
        name: 'Otimizador de Vendas',
        description: 'Script especializado em converter leads e aumentar vendas',
        triggers: [
          { type: 'keyword', condition: 'contains', value: 'preço|comprar|produto|catalogo' },
          { type: 'sentiment', condition: 'positive' }
        ],
        prompts: {
          responseGeneration: `Você é um consultor de vendas expert da {company}.
          Cliente: {customerName}
          
          Produtos disponíveis: {products}
          Políticas: {policies}
          
          Conversa atual:
          {messageHistory}
          
          Gere respostas focadas em:
          1. Identificar necessidades específicas
          2. Apresentar soluções adequadas
          3. Criar urgência saudável
          4. Facilitar processo de compra
          
          Use técnicas de vendas consultivas. Seja útil, não insistente.`
        },
        responseRules: [
          {
            condition: "keywords.includes('preço')",
            action: 'offer_solution',
            template: 'Temos excelentes condições especiais! Posso apresentar nossas opções para você?'
          }
        ],
        businessContext: {
          industry: 'Varejo',
          company: 'Loja Premium',
          products: ['Eletrônicos', 'Casa', 'Moda'],
          policies: ['Parcelamento sem juros', 'Frete grátis', 'Troca fácil'],
          commonIssues: ['Dúvidas sobre produtos', 'Formas de pagamento', 'Prazos']
        },
        isActive: false,
        priority: 70,
        stats: { timesUsed: 145, avgSatisfaction: 4.4, resolutionRate: 0.76 },
        createdBy: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

export default new AIPromptService();