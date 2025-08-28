// Serviço de persistência de sessões WAHA
// Mantém o vínculo entre tenant, usuário e sessão WAHA

interface SessionData {
  sessionName: string;
  tenantId: string;
  displayName: string;
  phoneNumber?: string;
  status: 'pending_qr' | 'connected' | 'disconnected' | 'failed';
  type: 'salvy' | 'own_number';
  webhookUrl?: string;
  webhookToken?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

class SessionPersistenceService {
  private sessions: Map<string, SessionData> = new Map();
  private tenantSessions: Map<string, Set<string>> = new Map();

  // Criar ou atualizar sessão
  saveSession(data: Omit<SessionData, 'createdAt' | 'updatedAt'>): SessionData {
    const existingSession = this.sessions.get(data.sessionName);
    
    const session: SessionData = {
      ...data,
      createdAt: existingSession?.createdAt || new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(data.sessionName, session);
    
    // Adicionar ao índice de tenant
    if (!this.tenantSessions.has(data.tenantId)) {
      this.tenantSessions.set(data.tenantId, new Set());
    }
    this.tenantSessions.get(data.tenantId)!.add(data.sessionName);

    console.log('Session persisted:', {
      sessionName: data.sessionName,
      tenantId: data.tenantId,
      status: data.status,
      type: data.type
    });

    return session;
  }

  // Buscar sessão por nome
  getSession(sessionName: string): SessionData | undefined {
    return this.sessions.get(sessionName);
  }

  // Buscar todas as sessões de um tenant
  getTenantSessions(tenantId: string): SessionData[] {
    const sessionNames = this.tenantSessions.get(tenantId);
    if (!sessionNames) return [];

    const sessions: SessionData[] = [];
    for (const sessionName of sessionNames) {
      const session = this.sessions.get(sessionName);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  // Atualizar status da sessão
  updateSessionStatus(sessionName: string, status: SessionData['status'], phoneNumber?: string): boolean {
    const session = this.sessions.get(sessionName);
    if (!session) return false;

    session.status = status;
    session.updatedAt = new Date();
    
    if (phoneNumber) {
      session.phoneNumber = phoneNumber;
    }

    this.sessions.set(sessionName, session);
    
    console.log('Session status updated:', {
      sessionName,
      status,
      phoneNumber
    });

    return true;
  }

  // Atualizar número da sessão
  updateSessionNumber(sessionName: string, phoneNumber: string): boolean {
    const session = this.sessions.get(sessionName);
    if (!session) return false;

    session.phoneNumber = phoneNumber;
    session.updatedAt = new Date();
    this.sessions.set(sessionName, session);

    console.log('Session number updated:', {
      sessionName,
      phoneNumber
    });

    return true;
  }

  // Remover sessão
  deleteSession(sessionName: string): boolean {
    const session = this.sessions.get(sessionName);
    if (!session) return false;

    // Remover do índice de tenant
    const tenantSessions = this.tenantSessions.get(session.tenantId);
    if (tenantSessions) {
      tenantSessions.delete(sessionName);
    }

    // Remover a sessão
    this.sessions.delete(sessionName);

    console.log('Session deleted:', sessionName);
    return true;
  }

  // Buscar sessão por webhook token
  getSessionByWebhookToken(webhookToken: string): SessionData | undefined {
    for (const session of this.sessions.values()) {
      if (session.webhookToken === webhookToken) {
        return session;
      }
    }
    return undefined;
  }

  // Contar sessões ativas do tenant
  countActiveSessions(tenantId: string): number {
    const sessions = this.getTenantSessions(tenantId);
    return sessions.filter(s => s.status === 'connected').length;
  }

  // Limpar sessões antigas (opcional)
  cleanupOldSessions(maxAgeInDays: number = 30): number {
    const now = new Date();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [sessionName, session] of this.sessions.entries()) {
      const age = now.getTime() - session.updatedAt.getTime();
      if (age > maxAge && session.status !== 'connected') {
        this.deleteSession(sessionName);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old sessions`);
    }

    return deletedCount;
  }

  // Debug: listar todas as sessões
  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }
}

export const sessionPersistenceService = new SessionPersistenceService();