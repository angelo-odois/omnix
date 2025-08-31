import jwt from 'jsonwebtoken';
import { generateOTP, isOTPExpired } from '../utils/otp';
import emailService from './emailService';
import prisma from '../lib/database';
import { User } from '@prisma/client';

export interface AuthUser extends User {
  tenant?: {
    id: string;
    name: string;
    email: string;
    packageId: string;
    isActive: boolean;
  };
}

class AuthServiceV2 {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    console.log('\n=== AUTHSERVICE V2 INITIALIZED ===');
    
    // Seed initial data if database is empty
    await this.seedInitialData();
    
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants.map(t => t.name));

    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log('\nAvailable Users:');
    users.forEach(user => {
      console.log(`- ${user.email} | ${user.role} | Tenant: ${user.tenant?.name || 'None'} | Active: ${user.isActive}`);
    });
    
    console.log('===================================\n');
    this.initialized = true;
  }

  private async seedInitialData() {
    // Check if we already have users
    const userCount = await prisma.user.count();
    if (userCount > 0) return;

    console.log('🌱 Seeding initial data...');

    // Create tenants
    const omnixTenant = await prisma.tenant.create({
      data: {
        id: 'omnix-system',
        name: 'OmniX',
        email: 'system@omnix.dev',
        packageId: 'enterprise',
        isActive: true
      }
    });

    const demoTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Empresa Demo',
        email: 'contato@empresa-demo.com',
        packageId: 'starter',
        isActive: true
      }
    });

    const xyzTenant = await prisma.tenant.create({
      data: {
        id: 'tenant-2',
        name: 'Startup XYZ',
        email: 'contato@startup-xyz.com',
        packageId: 'professional',
        isActive: true
      }
    });

    // Create users
    await prisma.user.createMany({
      data: [
        {
          id: 'super-admin',
          email: 'admin@omnix.dev',
          name: 'Super Admin',
          role: 'super_admin',
          tenantId: omnixTenant.id,
          isActive: true
        },
        {
          id: 'user-1',
          email: 'ahspimentel@gmail.com',
          name: 'André Pimentel',
          role: 'tenant_admin',
          tenantId: demoTenant.id,
          isActive: true
        },
        {
          id: 'user-2',
          email: 'gestor@empresa-demo.com',
          name: 'Gestor Demo',
          role: 'tenant_manager',
          tenantId: demoTenant.id,
          isActive: true
        },
        {
          id: 'user-3',
          email: 'maria@empresa-demo.com',
          name: 'Maria Silva',
          role: 'tenant_operator',
          tenantId: demoTenant.id,
          isActive: true
        },
        {
          id: 'user-4',
          email: 'joao@empresa-demo.com',
          name: 'João Santos',
          role: 'tenant_operator',
          tenantId: demoTenant.id,
          isActive: true
        },
        {
          id: 'user-5',
          email: 'admin@startup-xyz.com',
          name: 'Admin XYZ',
          role: 'tenant_admin',
          tenantId: xyzTenant.id,
          isActive: true
        }
      ]
    });

    console.log('✅ Initial data seeded');
  }

  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const otp = generateOTP(6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clean old OTPs for this email
      await prisma.oTP.deleteMany({
        where: { email }
      });

      // Store OTP in database
      await prisma.oTP.create({
        data: {
          email,
          code: otp,
          expiresAt,
          verified: false
        }
      });

      // Get user for email sending
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.isActive) {
        // Don't reveal if user exists
        return {
          success: true,
          message: 'Se o email estiver cadastrado, você receberá o código'
        };
      }

      // Log for development
      console.log(`\n=== OTP GERADO ===`);
      console.log(`Email: ${email}`);
      console.log(`Código: ${otp}`);
      console.log(`==================\n`);

      // Send email
      await emailService.sendOTP(email, otp, user.name);

      return {
        success: true,
        message: 'Código enviado para o email'
      };
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Erro ao enviar código'
      };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; token?: string; user?: AuthUser; message: string }> {
    try {
      // For development, accept '123456'
      let validOTP = false;
      
      if (otp === '123456') {
        validOTP = true;
      } else {
        // Find latest OTP for email
        const otpRecord = await prisma.oTP.findFirst({
          where: {
            email,
            code: otp,
            verified: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!otpRecord) {
          return {
            success: false,
            message: 'Código inválido ou não encontrado'
          };
        }

        if (isOTPExpired(otpRecord.expiresAt)) {
          return {
            success: false,
            message: 'Código expirado'
          };
        }

        // Mark OTP as verified
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { verified: true }
        });

        validOTP = true;
      }

      if (!validOTP) {
        return {
          success: false,
          message: 'Código inválido'
        };
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Usuário não encontrado ou inativo'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          tenantId: user.tenantId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      const authUser: AuthUser = {
        ...user,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          email: user.tenant.email,
          packageId: user.tenant.packageId,
          isActive: user.tenant.isActive
        } : undefined
      };

      return {
        success: true,
        token,
        user: authUser,
        message: 'Login realizado com sucesso'
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true }
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        ...user,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          email: user.tenant.email,
          packageId: user.tenant.packageId,
          isActive: user.tenant.isActive
        } : undefined
      };
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) return null;

    return {
      ...user,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        email: user.tenant.email,
        packageId: user.tenant.packageId,
        isActive: user.tenant.isActive
      } : undefined
    };
  }

  async createUser(userData: {
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    password?: string;
  }): Promise<AuthUser> {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        tenantId: userData.tenantId,
        isActive: true
      },
      include: { tenant: true }
    });

    return {
      ...user,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        email: user.tenant.email,
        packageId: user.tenant.packageId,
        isActive: user.tenant.isActive
      } : undefined
    };
  }
}

const authServiceV2 = new AuthServiceV2();
export default authServiceV2;