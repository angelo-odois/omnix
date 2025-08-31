import { createHash } from 'crypto';

interface AICache {
  conversationId: string;
  messageHash: string; // Hash das últimas mensagens
  lastAnalysis: {
    sentiment: any;
    suggestions: any[];
    insights: any[];
    timestamp: Date;
    promptUsed?: string;
  };
  contextData: {
    customerName?: string;
    businessContext?: string;
    messageCount: number;
    lastMessageTime: Date;
  };
  metadata: {
    cacheHits: number;
    lastAccessed: Date;
    expiresAt: Date;
  };
}

class AICacheService {
  private cache: Map<string, AICache> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity to reuse cache

  constructor() {
    // Clean expired cache every 10 minutes
    setInterval(() => this.cleanExpiredCache(), 10 * 60 * 1000);
    console.log('🗄️ AI Cache Service initialized');
  }

  // Generate hash for message content to detect changes
  private generateMessageHash(messages: string[]): string {
    const content = messages.slice(-5).join('|'); // Last 5 messages
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  // Calculate similarity between message sets
  private calculateSimilarity(messages1: string[], messages2: string[]): number {
    const set1 = new Set(messages1.join(' ').toLowerCase().split(' '));
    const set2 = new Set(messages2.join(' ').toLowerCase().split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // Check if we can reuse cached analysis
  async getCachedAnalysis(
    conversationId: string,
    messages: string[],
    customerName?: string,
    promptUsed?: string
  ): Promise<AICache['lastAnalysis'] | null> {
    const cacheKey = conversationId;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (new Date() > cached.metadata.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    const currentHash = this.generateMessageHash(messages);
    
    // Exact match - perfect cache hit
    if (cached.messageHash === currentHash && cached.lastAnalysis.promptUsed === promptUsed) {
      cached.metadata.cacheHits++;
      cached.metadata.lastAccessed = new Date();
      
      console.log(`💾 Cache HIT (exact): ${conversationId} - ${cached.metadata.cacheHits} hits`);
      return cached.lastAnalysis;
    }

    // Check for similar conversations (fuzzy matching)
    if (messages.length > 0 && cached.contextData.messageCount > 0) {
      const cachedMessages = []; // Would need to store messages for similarity check
      // For now, we'll use a simple heuristic based on message count and time
      
      const messageCountDiff = Math.abs(messages.length - cached.contextData.messageCount);
      const timeDiff = Math.abs(new Date().getTime() - cached.contextData.lastMessageTime.getTime());
      
      // If only 1-2 new messages and less than 5 minutes, consider similar
      if (messageCountDiff <= 2 && timeDiff < 5 * 60 * 1000) {
        console.log(`💾 Cache HIT (similar): ${conversationId} - using recent analysis`);
        
        // Update metadata but keep analysis
        cached.metadata.lastAccessed = new Date();
        cached.messageHash = currentHash;
        cached.contextData.messageCount = messages.length;
        cached.contextData.lastMessageTime = new Date();
        
        return cached.lastAnalysis;
      }
    }

    console.log(`🔄 Cache MISS: ${conversationId} - needs new analysis`);
    return null;
  }

  // Store new analysis in cache
  async setCachedAnalysis(
    conversationId: string,
    messages: string[],
    analysis: {
      sentiment: any;
      suggestions: any[];
      insights: any[];
    },
    context: {
      customerName?: string;
      businessContext?: string;
      promptUsed?: string;
    }
  ): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestCache();
    }

    const messageHash = this.generateMessageHash(messages);
    const now = new Date();
    
    const cacheEntry: AICache = {
      conversationId,
      messageHash,
      lastAnalysis: {
        sentiment: analysis.sentiment,
        suggestions: analysis.suggestions,
        insights: analysis.insights,
        timestamp: now,
        promptUsed: context.promptUsed
      },
      contextData: {
        customerName: context.customerName,
        businessContext: context.businessContext,
        messageCount: messages.length,
        lastMessageTime: now
      },
      metadata: {
        cacheHits: 0,
        lastAccessed: now,
        expiresAt: new Date(now.getTime() + this.CACHE_DURATION)
      }
    };

    this.cache.set(conversationId, cacheEntry);
    
    console.log(`💾 Cache SET: ${conversationId} - expires in ${this.CACHE_DURATION / 1000 / 60} minutes`);
  }

  // Invalidate cache when conversation context changes significantly
  async invalidateCache(conversationId: string, reason?: string): Promise<void> {
    const deleted = this.cache.delete(conversationId);
    if (deleted) {
      console.log(`🗑️ Cache INVALIDATED: ${conversationId} - ${reason || 'manual'}`);
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalEntries: number;
    totalHits: number;
    averageAge: number;
    hitRate: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.cache.values());
    const now = new Date();
    
    const totalHits = entries.reduce((sum, entry) => sum + entry.metadata.cacheHits, 0);
    const totalRequests = entries.length + totalHits;
    
    const ages = entries.map(entry => now.getTime() - entry.metadata.lastAccessed.getTime());
    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
    
    const timestamps = entries.map(entry => entry.lastAnalysis.timestamp);
    
    return {
      totalEntries: entries.length,
      totalHits: totalHits,
      averageAge: averageAge / 1000 / 60, // in minutes
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined
    };
  }

  // Clean expired entries
  private cleanExpiredCache(): void {
    const now = new Date();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.metadata.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  // LRU eviction
  private evictOldestCache(): void {
    let oldestKey = '';
    let oldestTime = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.lastAccessed < oldestTime) {
        oldestTime = entry.metadata.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache eviction (LRU): ${oldestKey}`);
    }
  }

  // Force cache refresh for conversation
  async refreshConversationCache(conversationId: string): Promise<void> {
    await this.invalidateCache(conversationId, 'forced refresh');
  }

  // Preload cache for active conversations
  async preloadActiveConversations(conversationIds: string[]): Promise<void> {
    console.log(`🚀 Preloading cache for ${conversationIds.length} active conversations`);
    // This would trigger analysis for conversations that don't have recent cache
    // Implementation would depend on having access to conversation data
  }
}

export default new AICacheService();