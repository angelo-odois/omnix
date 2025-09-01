import OpenAI from 'openai';
import aiPromptService, { AIPromptTemplate, AIScript } from './aiPromptService';

interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  emotion: 'happy' | 'sad' | 'angry' | 'excited' | 'frustrated' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  keywords: string[];
  score: number; // -1 to 1
}

interface ResponseSuggestion {
  content: string;
  tone: 'professional' | 'friendly' | 'empathetic' | 'solution_focused';
  confidence: number;
  context: string;
}

interface ConversationInsight {
  type: 'escalation' | 'opportunity' | 'warning' | 'recommendation';
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured');
    } else {
      console.log('🤖 AI Service initialized with OpenAI');
    }
  }

  async analyzeSentiment(messages: string[], contactName?: string): Promise<SentimentAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getMockSentiment();
    }

    try {
      const conversationText = messages.join('\n');
      const customerName = contactName || 'Cliente';

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de sentimento para atendimento ao cliente brasileiro. 
            Analise TODA a conversa cronologicamente para entender o contexto completo.
            
            IMPORTANTE:
            - Considere a evolução do sentimento durante a conversa
            - Identifique padrões e mudanças de humor
            - Extraia palavras-chave relevantes do contexto completo
            - Avalie urgência baseada em toda a interação
            
            Retorne APENAS um JSON válido:
            {
              "sentiment": "positive|negative|neutral",
              "confidence": 0.8,
              "emotion": "happy|sad|angry|excited|frustrated|neutral", 
              "urgency": "low|medium|high",
              "keywords": ["palavra1", "palavra2"],
              "score": 0.5
            }
            
            Score: -1 (muito negativo) a +1 (muito positivo)
            Confidence: 0 a 1 (baseado na clareza do contexto)
            Keywords: máximo 5 palavras-chave mais relevantes da conversa inteira`
          },
          {
            role: 'user',
            content: `CONVERSA CRONOLÓGICA COMPLETA com "${customerName}":

${conversationText}

Analise o sentimento considerando TODA a evolução da conversa acima:`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const analysis = JSON.parse(content);
      
      // Validate required fields
      if (!analysis.sentiment || typeof analysis.confidence !== 'number') {
        throw new Error('Invalid AI response format');
      }

      return {
        sentiment: analysis.sentiment,
        confidence: Math.min(Math.max(analysis.confidence, 0), 1),
        emotion: analysis.emotion || 'neutral',
        urgency: analysis.urgency || 'medium',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 5) : [],
        score: typeof analysis.score === 'number' ? Math.min(Math.max(analysis.score, -1), 1) : 0
      };

    } catch (error: any) {
      console.error('OpenAI sentiment analysis error:', error.message || error);
      console.log('🔄 Using mock sentiment analysis as fallback');
      return this.getMockSentiment();
    }
  }

  async generateResponseSuggestions(
    messages: string[], 
    sentiment: SentimentAnalysis,
    contactName?: string,
    businessContext?: string,
    tenantId?: string,
    customPromptId?: string
  ): Promise<ResponseSuggestion[]> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getMockSuggestions(contactName || 'Cliente');
    }

    try {
      const conversationText = messages.slice(-5).join('\n');
      const customerName = contactName || 'Cliente';
      
      // Get custom prompt if specified
      let systemPrompt = '';
      let userPrompt = '';
      let temperature = 0.7;
      let maxTokens = 500;
      
      if (tenantId && customPromptId) {
        const customPrompt = await aiPromptService.getPromptTemplate(tenantId, customPromptId);
        if (customPrompt && customPrompt.isActive) {
          systemPrompt = customPrompt.systemPrompt;
          userPrompt = customPrompt.userPromptTemplate
            .replace('{customerName}', customerName)
            .replace('{messageHistory}', conversationText)
            .replace('{businessContext}', businessContext || 'atendimento geral');
          
          temperature = customPrompt.settings.temperature;
          maxTokens = customPrompt.settings.maxTokens;
        }
      }
      
      // Use default prompt if no custom prompt
      if (!systemPrompt) {
        const context = businessContext || 'atendimento ao cliente geral';
        systemPrompt = `Você é um assistente especializado em atendimento ao cliente brasileiro.
        Analise TODA a conversa e gere 3 sugestões de resposta baseadas no contexto completo.
        
        Contexto do negócio: ${context}
        Sentimento atual: ${sentiment.sentiment} (${sentiment.emotion})
        Urgência detectada: ${sentiment.urgency}
        Palavras-chave: ${sentiment.keywords.join(', ')}
        
        IMPORTANTE: 
        - Leia toda a conversa cronologicamente
        - Entenda o problema/necessidade do cliente
        - Considere as mensagens anteriores para contexto
        - Mantenha consistência com respostas anteriores
        
        Retorne APENAS um JSON válido:
        [
          {
            "content": "resposta sugerida baseada em TODO o contexto",
            "tone": "professional|friendly|empathetic|solution_focused",
            "confidence": 0.9,
            "context": "explicação baseada na conversa completa"
          }
        ]
        
        Diretrizes:
        - Use linguagem natural brasileira
        - Seja empático e profissional
        - Adapte o tom ao sentimento e histórico
        - Use o nome do cliente: ${customerName}
        - Ofereça soluções baseadas na conversa inteira
        - Evite repetir respostas já dadas`;
        
        userPrompt = `CONVERSA COMPLETA com ${customerName}:

${conversationText}

ANÁLISE SOLICITADA:
- Sentimento: ${sentiment.sentiment} (${sentiment.emotion})
- Urgência: ${sentiment.urgency}
- Contexto: ${context}

Gere 3 sugestões que considerem TODA a conversa acima:`;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: Math.max(maxTokens, 800) // Ensure minimum 800 tokens for rich context
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const suggestions = JSON.parse(content);
      
      if (!Array.isArray(suggestions)) {
        throw new Error('Invalid suggestions format');
      }

      const formattedSuggestions = suggestions.map(suggestion => ({
        content: suggestion.content,
        tone: suggestion.tone || 'professional',
        confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        context: suggestion.context || 'Sugestão baseada no contexto da conversa'
      }));

      return formattedSuggestions;

    } catch (error: any) {
      console.error('OpenAI response generation error:', error.message || error);
      console.log('🔄 Using mock suggestions as fallback');
      return this.getMockSuggestions(contactName || 'Cliente');
    }
  }

  async generateConversationInsights(
    messages: string[],
    sentiment: SentimentAnalysis,
    conversationDuration: number // in minutes
  ): Promise<ConversationInsight[]> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getMockInsights(sentiment);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um analista especializado em atendimento ao cliente.
            Analise a conversa e gere insights acionáveis para melhorar o atendimento.
            
            Sentimento: ${sentiment.sentiment} (score: ${sentiment.score})
            Duração da conversa: ${conversationDuration} minutos
            Urgência: ${sentiment.urgency}
            
            Retorne APENAS um JSON válido com até 3 insights:
            [
              {
                "type": "escalation|opportunity|warning|recommendation",
                "message": "insight específico",
                "action": "ação recomendada (opcional)",
                "priority": "low|medium|high"
              }
            ]`
          },
          {
            role: 'user',
            content: `Conversa:\n${messages.slice(-10).join('\n')}`
          }
        ],
        temperature: 0.4,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getMockInsights(sentiment);
      }

      const insights = JSON.parse(content);
      return Array.isArray(insights) ? insights.slice(0, 3) : [insights];

    } catch (error: any) {
      console.error('OpenAI insights generation error:', error);
      return this.getMockInsights(sentiment);
    }
  }

  // Fallback methods when OpenAI is not available
  private getMockSentiment(): SentimentAnalysis {
    const sentiments = ['positive', 'negative', 'neutral'] as const;
    const emotions = ['happy', 'sad', 'angry', 'excited', 'frustrated', 'neutral'] as const;
    const urgencies = ['low', 'medium', 'high'] as const;
    
    return {
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
      keywords: ['produto', 'preço', 'entrega'].filter(() => Math.random() > 0.5),
      score: Math.random() * 2 - 1 // -1 to 1
    };
  }

  private getMockSuggestions(customerName: string): ResponseSuggestion[] {
    return [
      {
        content: `Olá ${customerName}! Como posso ajudar você hoje?`,
        tone: 'friendly',
        confidence: 0.9,
        context: 'Saudação padrão amigável'
      },
      {
        content: `${customerName}, entendo sua situação. Vou verificar isso para você imediatamente.`,
        tone: 'empathetic',
        confidence: 0.8,
        context: 'Resposta empática para problemas'
      },
      {
        content: `Perfeito, ${customerName}! Temos excelentes opções que podem te interessar.`,
        tone: 'solution_focused',
        confidence: 0.85,
        context: 'Foco em soluções e vendas'
      }
    ];
  }

  private getMockInsights(sentiment: SentimentAnalysis): ConversationInsight[] {
    const insights: ConversationInsight[] = [];

    if (sentiment.score < -0.5) {
      insights.push({
        type: 'escalation',
        message: 'Cliente demonstra insatisfação. Considere escalar para supervisor.',
        action: 'Transferir para supervisor',
        priority: 'high'
      });
    }

    if (sentiment.urgency === 'high') {
      insights.push({
        type: 'warning',
        message: 'Mensagem indica alta urgência. Resposta rápida recomendada.',
        priority: 'high'
      });
    }

    if (sentiment.score > 0.3) {
      insights.push({
        type: 'opportunity',
        message: 'Cliente satisfeito. Momento ideal para ofertas adicionais.',
        action: 'Apresentar produtos relacionados',
        priority: 'medium'
      });
    }

    return insights;
  }

  async improveMessage(message: string, tone: string = 'professional', contactName?: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      return message; // Return original if no AI
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um atendente profissional brasileiro. 
            Reescreva a mensagem com o tom solicitado: ${tone}
            Mantenha o mesmo significado, mas melhore a comunicação.
            Responda APENAS com a mensagem reescrita, sem explicações.`
          },
          {
            role: 'user',
            content: `Cliente: ${contactName || 'Cliente'}\nMensagem para melhorar: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.choices[0]?.message?.content?.trim() || message;
    } catch (error) {
      console.error('Message improvement error:', error);
      return message;
    }
  }
}

export default new AIService();