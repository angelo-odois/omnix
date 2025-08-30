// Sistema de autenticação multi-tenant aprimorado
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import emailService from './emailService';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',     // Admin da plataforma OmniX
  TENANT_ADMIN = 'tenant_admin',   // Admin do tenant (empresa)
  TENANT_MANAGER = 'tenant_manager', // Gestor do tenant
  TENANT_OPERATOR = 'tenant_operator', // Operador/Atendente
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  tenantId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: {
    phoneNumber?: string;
    department?: string;
    avatar?: string;
  };
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  limits: {
    maxUsers: number;
    maxInstances: number;
    maxMessagesPerMonth: number;
    maxContacts: number;
  };
  features: {
    multipleInstances: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    customBranding: boolean;
    analytics: boolean;
    automations: boolean;
  };
  billing?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    currentPeriodEnd?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string | null;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

class AuthServiceV2 {
  private users: Map<string, User> = new Map();
  private tenants: Map<string, Tenant> = new Map();
  private sessions: Map<string, Session> = new Map();
  private invitations: Map<string, Invitation> = new Map();
  private otpStore: Map<string, { otp: string; expiresAt: Date }> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Criar tenants padrão
    const tenants: Tenant[] = [
      {
        id: 'tenant-1',
        name: 'Empresa Demo',
        slug: 'empresa-demo',
        email: 'admin@empresa-demo.com',
        plan: 'professional',
        status: 'active',
        limits: {
          maxUsers: 10,
          maxInstances: 5,
          maxMessagesPerMonth: 10000,
          maxContacts: 1000,
        },
        features: {
          multipleInstances: true,
          apiAccess: true,
          webhooks: true,
          customBranding: false,
          analytics: true,
          automations: true,
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      {
        id: 'tenant-2',
        name: 'Startup XYZ',
        slug: 'startup-xyz',
        email: 'admin@startup-xyz.com',
        plan: 'starter',
        status: 'active',
        limits: {
          maxUsers: 5,
          maxInstances: 2,
          maxMessagesPerMonth: 5000,
          maxContacts: 500,
        },
        features: {
          multipleInstances: true,
          apiAccess: false,
          webhooks: true,
          customBranding: false,
          analytics: true,
          automations: false,
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
      },
    ];

    tenants.forEach(tenant => this.tenants.set(tenant.id, tenant));

    // Criar usuários padrão
    const users: User[] = [
      // Super Admin OmniX
      {
        id: 'super-1',
        email: 'admin@omnix.dev',
        name: 'Super Admin OmniX',
        password: bcrypt.hashSync('OmniX@2024', 10),
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      },
      
      // Tenant 1 - Empresa Demo
      {
        id: 'admin-1',
        email: 'ahspimentel@gmail.com',
        name: 'Angelo Pimentel',
        password: bcrypt.hashSync('123456', 10),
        role: UserRole.TENANT_ADMIN,
        tenantId: 'tenant-1',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        metadata: { phoneNumber: '+5561936182610' },
      },
      {
        id: 'manager-1',
        email: 'gestor@empresa-demo.com',
        name: 'João Gestor',
        password: bcrypt.hashSync('123456', 10),
        role: UserRole.TENANT_MANAGER,
        tenantId: 'tenant-1',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
      },
      {
        id: 'operator-1',
        email: 'maria@empresa-demo.com',
        name: 'Maria Operadora',
        password: bcrypt.hashSync('123456', 10),
        role: UserRole.TENANT_OPERATOR,
        tenantId: 'tenant-1',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
      },
      {
        id: 'operator-2',
        email: 'joao@empresa-demo.com',
        name: 'João Operador',
        password: bcrypt.hashSync('123456', 10),
        role: UserRole.TENANT_OPERATOR,
        tenantId: 'tenant-1',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date(),
      },
      
      // Tenant 2 - Startup XYZ
      {
        id: 'admin-2',
        email: 'admin@startup-xyz.com',
        name: 'Carlos Admin',
        password: bcrypt.hashSync('123456', 10),
        role: UserRole.TENANT_ADMIN,
        tenantId: 'tenant-2',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date(),
      },
    ];

    users.forEach(user => this.users.set(user.id, user));

    console.log('\n=== AUTHSERVICE V2 INITIALIZED ===');
    console.log('Tenants:', Array.from(this.tenants.values()).map(t => t.name));
    console.log('\nAvailable Users:');
    Array.from(this.users.values()).forEach(u => {
      console.log(`- ${u.email} | ${u.role} | Tenant: ${u.tenantId ? this.tenants.get(u.tenantId)?.name : 'OmniX'} | Active: ${u.isActive}`);
    });
    console.log('===================================\n');
  }

  // ============= AUTENTICAÇÃO =============

  async loginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    refreshToken?: string;
    tenant?: Tenant;
    message?: string;
  }> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Email ou senha incorretos' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Usuário inativo' };
    }

    if (!user.password || !bcrypt.compareSync(password, user.password)) {
      return { success: false, message: 'Email ou senha incorretos' };
    }

    // Verificar tenant ativo
    let tenant: Tenant | undefined;
    if (user.tenantId) {
      tenant = this.tenants.get(user.tenantId);
      if (!tenant || tenant.status !== 'active') {
        return { success: false, message: 'Empresa suspensa ou inativa' };
      }
    }

    // Gerar tokens
    const { token, refreshToken } = this.generateTokens(user);
    
    // Criar sessão
    const session: Session = {
      id: uuidv4(),
      userId: user.id,
      tenantId: user.tenantId,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };
    
    this.sessions.set(session.id, session);
    
    // Atualizar último login
    user.lastLoginAt = new Date();
    
    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      tenant,
    };
  }

  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    
    if (!user || !user.isActive) {
      // Não revelar se usuário existe
      return { success: true, message: 'Se o email estiver cadastrado, você receberá o código' };
    }

    const otp = this.generateOTP();
    this.otpStore.set(email, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    // Log para desenvolvimento
    console.log(`\n=== OTP GERADO ===`);
    console.log(`Email: ${email}`);
    console.log(`Código: ${otp}`);
    console.log(`==================\n`);

    // Enviar email
    try {
      await emailService.sendOTP(email, otp, user.name);
    } catch (error) {
      console.error('Error sending OTP email:', error);
    }

    return { success: true, message: 'Código enviado para o email' };
  }

  async verifyOTP(email: string, otp: string): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    refreshToken?: string;
    tenant?: Tenant;
    message?: string;
  }> {
    const storedOTP = this.otpStore.get(email);
    
    // Para desenvolvimento, aceitar '123456'
    if (otp !== '123456') {
      if (!storedOTP || storedOTP.otp !== otp) {
        return { success: false, message: 'Código inválido' };
      }
      
      if (storedOTP.expiresAt < new Date()) {
        this.otpStore.delete(email);
        return { success: false, message: 'Código expirado' };
      }
    }

    this.otpStore.delete(email);
    
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    let tenant: Tenant | undefined;
    if (user.tenantId) {
      tenant = this.tenants.get(user.tenantId);
    }

    const { token, refreshToken } = this.generateTokens(user);
    user.lastLoginAt = new Date();

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      tenant,
    };
  }

  // ============= GERENCIAMENTO DE USUÁRIOS =============

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    tenantId: string | null;
    invitedBy?: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    // Verificar se email já existe
    if (Array.from(this.users.values()).some(u => u.email === data.email)) {
      return { success: false, message: 'Email já cadastrado' };
    }

    // Verificar limites do tenant
    if (data.tenantId) {
      const tenant = this.tenants.get(data.tenantId);
      if (!tenant) {
        return { success: false, message: 'Tenant não encontrado' };
      }

      const tenantUsers = this.getTenantUsers(data.tenantId);
      if (tenantUsers.length >= tenant.limits.maxUsers) {
        return { success: false, message: `Limite de ${tenant.limits.maxUsers} usuários atingido` };
      }
    }

    const user: User = {
      id: uuidv4(),
      email: data.email,
      name: data.name,
      password: bcrypt.hashSync(data.password, 10),
      role: data.role,
      tenantId: data.tenantId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    
    console.log(`User created: ${user.email} (${user.role}) for tenant ${data.tenantId}`);
    
    return { success: true, user: this.sanitizeUser(user) };
  }

  async inviteUser(
    tenantId: string,
    email: string,
    role: UserRole,
    invitedBy: User
  ): Promise<{ success: boolean; invitation?: Invitation; message?: string }> {
    // Verificar se email já existe
    if (Array.from(this.users.values()).some(u => u.email === email)) {
      return { success: false, message: 'Email já cadastrado no sistema' };
    }

    // Verificar se já existe convite pendente
    const existingInvite = Array.from(this.invitations.values()).find(
      i => i.email === email && i.tenantId === tenantId && i.status === 'pending'
    );
    if (existingInvite) {
      return { success: false, message: 'Já existe um convite pendente para este email' };
    }

    // Verificar limites
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { success: false, message: 'Tenant não encontrado' };
    }

    const tenantUsers = this.getTenantUsers(tenantId);
    if (tenantUsers.length >= tenant.limits.maxUsers) {
      return { success: false, message: `Limite de ${tenant.limits.maxUsers} usuários atingido` };
    }

    const invitation: Invitation = {
      id: uuidv4(),
      tenantId,
      email,
      role,
      invitedBy: invitedBy.id,
      invitedByName: invitedBy.name,
      token: uuidv4(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      createdAt: new Date(),
    };

    this.invitations.set(invitation.id, invitation);
    
    // Enviar email de convite
    try {
      // await emailService.sendInvitation(email, invitation, tenant, invitedBy);
      console.log(`Invitation sent to ${email} for ${tenant.name}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
    }

    return { success: true, invitation };
  }

  async acceptInvitation(token: string, name: string, password: string): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    const invitation = Array.from(this.invitations.values()).find(i => i.token === token);
    
    if (!invitation) {
      return { success: false, message: 'Convite inválido' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, message: 'Este convite já foi utilizado' };
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      return { success: false, message: 'Convite expirado' };
    }

    // Criar usuário
    const result = await this.createUser({
      email: invitation.email,
      name,
      password,
      role: invitation.role,
      tenantId: invitation.tenantId,
      invitedBy: invitation.invitedBy,
    });

    if (result.success) {
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
    }

    return result;
  }

  // ============= GERENCIAMENTO DE TENANTS =============

  async createTenant(data: {
    name: string;
    email: string;
    plan?: 'trial' | 'starter' | 'professional' | 'enterprise';
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }): Promise<{ success: boolean; tenant?: Tenant; admin?: User; message?: string }> {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Verificar se slug já existe
    if (Array.from(this.tenants.values()).some(t => t.slug === slug)) {
      return { success: false, message: 'Nome da empresa já está em uso' };
    }

    const plan = data.plan || 'trial';
    const tenant: Tenant = {
      id: uuidv4(),
      name: data.name,
      slug,
      email: data.email,
      plan,
      status: 'active',
      limits: this.getPlanLimits(plan),
      features: this.getPlanFeatures(plan),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tenants.set(tenant.id, tenant);

    // Criar admin do tenant
    const adminResult = await this.createUser({
      email: data.adminEmail,
      name: data.adminName,
      password: data.adminPassword,
      role: UserRole.TENANT_ADMIN,
      tenantId: tenant.id,
    });

    if (!adminResult.success) {
      // Reverter criação do tenant
      this.tenants.delete(tenant.id);
      return { success: false, message: adminResult.message };
    }

    console.log(`Tenant created: ${tenant.name} (${tenant.id})`);
    
    return { success: true, tenant, admin: adminResult.user };
  }

  // ============= HELPERS =============

  private generateTokens(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h',
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '30d' }
    );

    return { token, refreshToken };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  private getPlanLimits(plan: string) {
    const limits: Record<string, any> = {
      trial: { maxUsers: 2, maxInstances: 1, maxMessagesPerMonth: 500, maxContacts: 100 },
      starter: { maxUsers: 5, maxInstances: 2, maxMessagesPerMonth: 5000, maxContacts: 500 },
      professional: { maxUsers: 10, maxInstances: 5, maxMessagesPerMonth: 10000, maxContacts: 1000 },
      enterprise: { maxUsers: 100, maxInstances: 50, maxMessagesPerMonth: 100000, maxContacts: 10000 },
    };
    return limits[plan] || limits.trial;
  }

  private getPlanFeatures(plan: string) {
    const features: Record<string, any> = {
      trial: {
        multipleInstances: false,
        apiAccess: false,
        webhooks: false,
        customBranding: false,
        analytics: false,
        automations: false,
      },
      starter: {
        multipleInstances: true,
        apiAccess: false,
        webhooks: true,
        customBranding: false,
        analytics: true,
        automations: false,
      },
      professional: {
        multipleInstances: true,
        apiAccess: true,
        webhooks: true,
        customBranding: false,
        analytics: true,
        automations: true,
      },
      enterprise: {
        multipleInstances: true,
        apiAccess: true,
        webhooks: true,
        customBranding: true,
        analytics: true,
        automations: true,
      },
    };
    return features[plan] || features.trial;
  }

  // ============= MÉTODOS PÚBLICOS =============

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }

  getUser(userId: string): User | undefined {
    const user = this.users.get(userId);
    return user ? this.sanitizeUser(user) as User : undefined;
  }

  getUserByEmail(email: string): User | undefined {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user ? this.sanitizeUser(user) as User : undefined;
  }

  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  getTenantUsers(tenantId: string): User[] {
    return Array.from(this.users.values())
      .filter(u => u.tenantId === tenantId)
      .map(u => this.sanitizeUser(u) as User);
  }

  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values()).map(u => this.sanitizeUser(u) as User);
  }

  hasPermission(user: User, resource: string, action: string): boolean {
    // Super admin tem todas as permissões
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Mapear permissões por role
    const permissions: Record<string, Record<string, string[]>> = {
      [UserRole.TENANT_ADMIN]: {
        instances: ['view', 'create', 'edit', 'delete'],
        conversations: ['view', 'viewAll', 'send', 'assign', 'close'],
        contacts: ['view', 'create', 'edit', 'delete', 'import', 'export'],
        users: ['view', 'create', 'edit', 'delete', 'invite'],
        settings: ['view', 'billing', 'integrations', 'webhooks'],
        tenants: ['view', 'edit'],
      },
      [UserRole.TENANT_MANAGER]: {
        instances: ['view', 'create', 'edit'],
        conversations: ['view', 'viewAll', 'send', 'assign', 'close'],
        contacts: ['view', 'create', 'edit', 'delete', 'import'],
        users: ['view', 'create', 'edit', 'invite'],
        settings: ['view', 'integrations'],
        tenants: ['view'],
      },
      [UserRole.TENANT_OPERATOR]: {
        instances: ['view'],
        conversations: ['view', 'send', 'close'],
        contacts: ['view', 'create', 'edit'],
        users: ['view'],
        settings: [],
        tenants: [],
      },
    };

    const rolePermissions = permissions[user.role];
    return rolePermissions?.[resource]?.includes(action) || false;
  }
}

export const authServiceV2 = new AuthServiceV2();