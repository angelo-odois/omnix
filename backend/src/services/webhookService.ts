import crypto from 'crypto';

export interface InstanceWebhook {
  id: string;
  instanceId: string;
  sessionName: string;
  tenantId: string;
  webhookToken: string;
  webhookUrl: string;
  secret: string;
  active: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  metadata?: any;
}

class WebhookService {
  // Armazenamento em memória (em produção, usar banco de dados)
  private webhooks: Map<string, InstanceWebhook> = new Map();
  // Índice por token para busca rápida
  private tokenIndex: Map<string, string> = new Map();
  // Índice por sessão
  private sessionIndex: Map<string, string> = new Map();
  // Índice por tenant
  private tenantIndex: Map<string, Set<string>> = new Map();

  constructor() {
    console.log('WebhookService initialized');
  }

  // Gerar token único para webhook
  private generateWebhookToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Gerar secret para validação HMAC
  private generateSecret(): string {
    return crypto.randomBytes(24).toString('base64');
  }

  // Criar webhook para instância
  createInstanceWebhook(data: {
    instanceId: string;
    sessionName: string;
    tenantId: string;
    baseUrl?: string;
  }): InstanceWebhook {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const webhookToken = this.generateWebhookToken();
    const secret = this.generateSecret();
    
    // URL base pública do backend (acessível pelo WAHA)
    // Em produção deve ser a URL pública do servidor
    // Para desenvolvimento local com WAHA cloud, usar ngrok ou túnel similar
    const baseUrl = data.baseUrl || 
                   process.env.BACKEND_PUBLIC_URL || 
                   process.env.BACKEND_URL || 
                   'http://localhost:3000';
    
    // URL única do webhook para esta instância
    const webhookUrl = `${baseUrl}/api/waha/webhook/${webhookToken}`;
    
    const webhook: InstanceWebhook = {
      id: webhookId,
      instanceId: data.instanceId,
      sessionName: data.sessionName,
      tenantId: data.tenantId,
      webhookToken,
      webhookUrl,
      secret,
      active: true,
      createdAt: new Date(),
      metadata: {}
    };
    
    // Salvar webhook
    this.webhooks.set(webhookId, webhook);
    
    // Atualizar índices
    this.tokenIndex.set(webhookToken, webhookId);
    this.sessionIndex.set(data.sessionName, webhookId);
    
    if (!this.tenantIndex.has(data.tenantId)) {
      this.tenantIndex.set(data.tenantId, new Set());
    }
    this.tenantIndex.get(data.tenantId)!.add(webhookId);
    
    console.log(`Webhook created for instance ${data.instanceId}:`, {
      url: webhookUrl,
      session: data.sessionName
    });
    
    return webhook;
  }

  // Buscar webhook por token
  getWebhookByToken(token: string): InstanceWebhook | null {
    const webhookId = this.tokenIndex.get(token);
    if (!webhookId) return null;
    
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      // Atualizar último uso
      webhook.lastUsedAt = new Date();
    }
    
    return webhook || null;
  }

  // Buscar webhook por sessionName
  getWebhookBySessionName(sessionName: string): InstanceWebhook | null {
    const webhookId = this.sessionIndex.get(sessionName);
    if (!webhookId) return null;
    
    return this.webhooks.get(webhookId) || null;
  }

  // Buscar webhook por sessão
  getWebhookBySession(sessionName: string): InstanceWebhook | null {
    const webhookId = this.sessionIndex.get(sessionName);
    if (!webhookId) return null;
    
    return this.webhooks.get(webhookId) || null;
  }

  // Listar webhooks do tenant
  getTenantWebhooks(tenantId: string): InstanceWebhook[] {
    const webhookIds = this.tenantIndex.get(tenantId);
    if (!webhookIds) return [];
    
    const webhooks: InstanceWebhook[] = [];
    for (const id of webhookIds) {
      const webhook = this.webhooks.get(id);
      if (webhook) {
        webhooks.push(webhook);
      }
    }
    
    return webhooks;
  }

  // Atualizar webhook
  updateWebhook(webhookId: string, updates: Partial<InstanceWebhook>): InstanceWebhook | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;
    
    // Atualizar campos permitidos
    if (updates.active !== undefined) webhook.active = updates.active;
    if (updates.metadata) webhook.metadata = { ...webhook.metadata, ...updates.metadata };
    
    return webhook;
  }

  // Desativar webhook
  deactivateWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;
    
    webhook.active = false;
    return true;
  }

  // Deletar webhook
  deleteWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;
    
    // Remover dos índices
    this.tokenIndex.delete(webhook.webhookToken);
    this.sessionIndex.delete(webhook.sessionName);
    this.tenantIndex.get(webhook.tenantId)?.delete(webhookId);
    
    // Remover webhook
    this.webhooks.delete(webhookId);
    
    console.log(`Webhook deleted: ${webhookId}`);
    return true;
  }

  // Validar assinatura HMAC
  validateHMACSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Comparação segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Verificar se webhook está ativo
  isWebhookActive(token: string): boolean {
    const webhook = this.getWebhookByToken(token);
    return webhook?.active || false;
  }

  // Estatísticas
  getStats() {
    const stats = {
      totalWebhooks: this.webhooks.size,
      activeWebhooks: 0,
      inactiveWebhooks: 0,
      webhooksPerTenant: new Map<string, number>()
    };
    
    for (const webhook of this.webhooks.values()) {
      if (webhook.active) {
        stats.activeWebhooks++;
      } else {
        stats.inactiveWebhooks++;
      }
      
      const count = stats.webhooksPerTenant.get(webhook.tenantId) || 0;
      stats.webhooksPerTenant.set(webhook.tenantId, count + 1);
    }
    
    return stats;
  }

  // Limpar webhooks inativos (manutenção)
  cleanInactiveWebhooks(daysInactive: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    let deletedCount = 0;
    const toDelete: string[] = [];
    
    for (const [id, webhook] of this.webhooks.entries()) {
      if (!webhook.active && 
          (!webhook.lastUsedAt || webhook.lastUsedAt < cutoffDate)) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      if (this.deleteWebhook(id)) {
        deletedCount++;
      }
    }
    
    console.log(`Cleaned ${deletedCount} inactive webhooks`);
    return deletedCount;
  }
}

// Singleton
export default new WebhookService();