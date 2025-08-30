interface TenantNumber {
  id: string;
  tenantId: string;
  salvyAccountId: string;
  phoneNumber: string;
  displayName: string;
  areaCode: string;
  redirectNumber: string;
  monthlyPrice: number;
  status: 'active' | 'inactive' | 'suspended';
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    city?: string;
    state?: string;
    type?: string;
    capabilities?: string[];
    connectedInstance?: string;
    wahaSessionName?: string;
    status?: string;
    connectedAt?: string;
  };
}

class TenantNumbersService {
  // In-memory storage (em produção, usar banco de dados)
  private numbers: Map<string, TenantNumber> = new Map();
  
  // Índice por tenant para busca rápida
  private tenantIndex: Map<string, Set<string>> = new Map();
  
  // Índice por Salvy Account ID
  private salvyIndex: Map<string, string> = new Map();

  constructor() {
    // Não inicializar com dados mock - apenas números reais
    console.log('TenantNumbersService initialized without mock data');
  }

  // Criar novo número para o tenant
  createNumber(data: {
    tenantId: string;
    salvyAccountId: string;
    phoneNumber: string;
    displayName: string;
    areaCode: string;
    redirectNumber: string;
    stripeSubscriptionId?: string;
    metadata?: any;
  }): TenantNumber {
    // Números próprios não têm custo
    const isOwnNumber = data.metadata?.type === 'own_number';
    
    const number: TenantNumber = {
      id: `num_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: data.tenantId,
      salvyAccountId: data.salvyAccountId,
      phoneNumber: data.phoneNumber,
      displayName: data.displayName,
      areaCode: data.areaCode,
      redirectNumber: data.redirectNumber,
      monthlyPrice: isOwnNumber ? 0 : 29.90, // Sem custo para números próprios
      status: 'active',
      stripeSubscriptionId: data.stripeSubscriptionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata || {}
    };

    // Salvar número
    this.numbers.set(number.id, number);
    
    // Atualizar índice do tenant
    if (!this.tenantIndex.has(data.tenantId)) {
      this.tenantIndex.set(data.tenantId, new Set());
    }
    this.tenantIndex.get(data.tenantId)!.add(number.id);
    
    // Atualizar índice Salvy
    this.salvyIndex.set(data.salvyAccountId, number.id);

    console.log(`Created number ${number.phoneNumber} for tenant ${data.tenantId}`);
    
    return number;
  }

  // Buscar números de um tenant
  getTenantNumbers(tenantId: string): TenantNumber[] {
    const numberIds = this.tenantIndex.get(tenantId);
    if (!numberIds) return [];
    
    const tenantNumbers: TenantNumber[] = [];
    for (const id of numberIds) {
      const number = this.numbers.get(id);
      if (number && number.status !== 'suspended') {
        tenantNumbers.push(number);
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    return tenantNumbers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Buscar número por ID
  getNumberById(numberId: string): TenantNumber | null {
    return this.numbers.get(numberId) || null;
  }

  // Buscar número por Salvy Account ID
  getNumberBySalvyId(salvyAccountId: string): TenantNumber | null {
    const numberId = this.salvyIndex.get(salvyAccountId);
    if (!numberId) return null;
    return this.numbers.get(numberId) || null;
  }

  // Verificar se número já existe para o tenant
  numberExistsForTenant(phoneNumber: string, tenantId: string): boolean {
    const numberIds = this.tenantIndex.get(tenantId);
    if (!numberIds) return false;
    
    for (const id of numberIds) {
      const number = this.numbers.get(id);
      if (number && number.phoneNumber === phoneNumber) {
        return true;
      }
    }
    
    return false;
  }

  // Atualizar número
  updateNumber(numberId: string, updates: Partial<TenantNumber>): TenantNumber | null {
    const number = this.numbers.get(numberId);
    if (!number) return null;
    
    // Se estiver atualizando metadata, fazer merge ao invés de substituir
    const updatedMetadata = updates.metadata ? {
      ...number.metadata,
      ...updates.metadata
    } : number.metadata;
    
    const updatedNumber = {
      ...number,
      ...updates,
      metadata: updatedMetadata,
      updatedAt: new Date()
    };
    
    this.numbers.set(numberId, updatedNumber);
    
    console.log(`Updated number ${numberId}:`, {
      phoneNumber: updatedNumber.phoneNumber,
      wahaSessionName: updatedNumber.metadata?.wahaSessionName,
      status: updatedNumber.metadata?.status
    });
    
    return updatedNumber;
  }

  // Atualizar status do número
  updateNumberStatus(numberId: string, status: TenantNumber['status']): boolean {
    const number = this.numbers.get(numberId);
    if (!number) return false;
    
    number.status = status;
    number.updatedAt = new Date();
    this.numbers.set(numberId, number);
    
    return true;
  }

  // Deletar número (soft delete - apenas marca como suspended)
  deleteNumber(numberId: string): boolean {
    return this.updateNumberStatus(numberId, 'suspended');
  }

  // Contar números ativos do tenant
  countActiveTenantNumbers(tenantId: string): number {
    const numberIds = this.tenantIndex.get(tenantId);
    if (!numberIds) return 0;
    
    let count = 0;
    for (const id of numberIds) {
      const number = this.numbers.get(id);
      if (number && number.status === 'active') {
        count++;
      }
    }
    
    return count;
  }

  // Calcular custo mensal do tenant
  calculateTenantMonthlyCost(tenantId: string): number {
    const numbers = this.getTenantNumbers(tenantId);
    return numbers
      .filter(n => n.status === 'active')
      .reduce((sum, n) => sum + n.monthlyPrice, 0);
  }

  // Buscar número por sessão WAHA
  getNumberByWahaSession(wahaSessionName: string): TenantNumber | null {
    for (const number of this.numbers.values()) {
      if (number.metadata?.wahaSessionName === wahaSessionName) {
        return number;
      }
    }
    return null;
  }

  // Verificar se a sessão WAHA está vinculada a algum número
  isSessionLinkedToNumber(wahaSessionName: string): boolean {
    return this.getNumberByWahaSession(wahaSessionName) !== null;
  }

  // Estatísticas globais
  getGlobalStats() {
    const stats = {
      totalNumbers: this.numbers.size,
      activeNumbers: 0,
      inactiveNumbers: 0,
      suspendedNumbers: 0,
      tenantsWithNumbers: this.tenantIndex.size,
      totalMonthlyRevenue: 0
    };
    
    for (const number of this.numbers.values()) {
      if (number.status === 'active') {
        stats.activeNumbers++;
        stats.totalMonthlyRevenue += number.monthlyPrice;
      } else if (number.status === 'inactive') {
        stats.inactiveNumbers++;
      } else if (number.status === 'suspended') {
        stats.suspendedNumbers++;
      }
    }
    
    return stats;
  }

}

// Singleton
export default new TenantNumbersService();