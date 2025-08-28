interface PendingRequest {
  id: string;
  userId: string;
  tenantId: string;
  areaCode: string;
  redirectNumber: string;
  displayName: string;
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'expired' | 'canceled';
  createdAt: Date;
  expiresAt: Date;
  metadata?: any;
}

class PendingRequestsService {
  // In-memory storage (em produção, usar banco de dados)
  private requests: Map<string, PendingRequest> = new Map();
  
  // Limpar requisições expiradas a cada 5 minutos
  constructor() {
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, 5 * 60 * 1000);
  }

  // Criar nova solicitação pendente
  createPendingRequest(data: {
    userId: string;
    tenantId: string;
    areaCode: string;
    redirectNumber: string;
    displayName: string;
    stripeSessionId?: string;
    stripeSessionUrl?: string;
  }): PendingRequest {
    const request: PendingRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24 horas
    };
    
    this.requests.set(request.id, request);
    return request;
  }

  // Atualizar solicitação com informações do Stripe
  updateRequestWithStripeSession(
    requestId: string, 
    stripeSessionId: string, 
    stripeSessionUrl: string
  ): PendingRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;
    
    request.stripeSessionId = stripeSessionId;
    request.stripeSessionUrl = stripeSessionUrl;
    request.status = 'processing';
    
    this.requests.set(requestId, request);
    return request;
  }

  // Buscar solicitação por ID
  getRequestById(requestId: string): PendingRequest | null {
    return this.requests.get(requestId) || null;
  }

  // Buscar solicitação por Session ID do Stripe
  getRequestByStripeSessionId(sessionId: string): PendingRequest | null {
    for (const request of this.requests.values()) {
      if (request.stripeSessionId === sessionId) {
        return request;
      }
    }
    return null;
  }

  // Listar solicitações pendentes de um usuário
  getUserPendingRequests(userId: string): PendingRequest[] {
    const userRequests: PendingRequest[] = [];
    const now = new Date();
    
    for (const request of this.requests.values()) {
      if (
        request.userId === userId && 
        request.status === 'pending' || request.status === 'processing' &&
        request.expiresAt > now
      ) {
        userRequests.push(request);
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    return userRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Listar todas as solicitações de um tenant
  getTenantRequests(tenantId: string): PendingRequest[] {
    const tenantRequests: PendingRequest[] = [];
    
    for (const request of this.requests.values()) {
      if (request.tenantId === tenantId) {
        tenantRequests.push(request);
      }
    }
    
    return tenantRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Marcar solicitação como concluída
  markAsCompleted(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    
    request.status = 'completed';
    this.requests.set(requestId, request);
    
    // Remover após 1 hora
    setTimeout(() => {
      this.requests.delete(requestId);
    }, 60 * 60 * 1000);
    
    return true;
  }

  // Marcar solicitação como cancelada
  markAsCanceled(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    
    request.status = 'canceled';
    this.requests.set(requestId, request);
    
    // Remover após 1 hora
    setTimeout(() => {
      this.requests.delete(requestId);
    }, 60 * 60 * 1000);
    
    return true;
  }

  // Cancelar solicitação
  cancelRequest(requestId: string): boolean {
    return this.markAsCanceled(requestId);
  }

  // Limpar requisições expiradas
  private cleanupExpiredRequests(): void {
    const now = new Date();
    const toDelete: string[] = [];
    
    for (const [id, request] of this.requests.entries()) {
      if (request.expiresAt < now) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      const request = this.requests.get(id);
      if (request && (request.status === 'pending' || request.status === 'processing')) {
        request.status = 'expired';
      }
      this.requests.delete(id);
    }
    
    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} expired requests`);
    }
  }

  // Estatísticas (útil para debug)
  getStats() {
    const stats = {
      total: this.requests.size,
      pending: 0,
      processing: 0,
      completed: 0,
      expired: 0,
      canceled: 0,
    };
    
    for (const request of this.requests.values()) {
      stats[request.status]++;
    }
    
    return stats;
  }
}

// Singleton
export default new PendingRequestsService();