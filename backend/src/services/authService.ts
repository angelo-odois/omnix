import jwt from 'jsonwebtoken';
import { generateOTP, isOTPExpired } from '../utils/otp';
import emailService from './emailService';
import { OTPStore, User } from '../types/auth';

// Temporary in-memory store (should be Redis or DB in production)
const otpStore = new Map<string, OTPStore>();
const userStore = new Map<string, User>();

// Mock users for testing
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@omnix.com',
    name: 'Admin User',
    role: 'admin',
    tenantId: 'tenant-1'
  },
  {
    id: '2',
    email: 'gestor@omnix.com',
    name: 'Gestor User',
    role: 'gestor',
    tenantId: 'tenant-1'
  },
  {
    id: '3',
    email: 'operador@omnix.com',
    name: 'Operador User',
    role: 'operador',
    tenantId: 'tenant-1'
  },
  {
    id: '4',
    email: 'ahspimentel@gmail.com',
    name: 'André Pimentel',
    role: 'admin',
    tenantId: 'tenant-1'
  }
];

// Initialize mock users
mockUsers.forEach(user => userStore.set(user.email, user));

class AuthService {
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate OTP
      const otp = generateOTP(6);
      
      // Store OTP with timestamp
      otpStore.set(email, {
        email,
        otp,
        createdAt: new Date(),
        attempts: 0
      });

      // Get user name if exists
      const user = userStore.get(email);
      
      // Send OTP via email
      await emailService.sendOTP(email, otp, user?.name);

      console.log(`📧 OTP sent to ${email}: ${otp}`);
      
      return {
        success: true,
        message: 'Código enviado para seu email'
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw new Error('Falha ao enviar código');
    }
  }

  async verifyOTP(email: string, inputOtp: string): Promise<{ 
    success: boolean; 
    token?: string; 
    user?: User;
    tenant?: any;
    message?: string 
  }> {
    const stored = otpStore.get(email);

    if (!stored) {
      return {
        success: false,
        message: 'Código inválido ou expirado'
      };
    }

    // Check expiry
    if (isOTPExpired(stored.createdAt, parseInt(process.env.OTP_EXPIRY_MINUTES || '10'))) {
      otpStore.delete(email);
      return {
        success: false,
        message: 'Código expirado'
      };
    }

    // Check attempts
    if (stored.attempts >= 3) {
      otpStore.delete(email);
      return {
        success: false,
        message: 'Muitas tentativas. Solicite um novo código'
      };
    }

    // Verify OTP
    if (stored.otp !== inputOtp) {
      stored.attempts++;
      return {
        success: false,
        message: 'Código incorreto'
      };
    }

    // OTP is valid, remove from store
    otpStore.delete(email);

    // Get or create user
    let user = userStore.get(email);
    if (!user) {
      // Create new user with default role
      user = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        role: 'operador',
        tenantId: 'tenant-1'
      };
      userStore.set(email, user);
      
      // Send welcome email for new users
      await emailService.sendWelcomeEmail(email, user.name);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET || 'dev-secret',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
      }
    );

    // Mock tenant data
    const tenant = {
      id: user.tenantId,
      name: 'OmniX Demo',
      domain: 'omnix.com',
      plan: 'premium',
      status: 'active'
    };

    return {
      success: true,
      token,
      user,
      tenant
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      const user = userStore.get(decoded.email);
      return user || null;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();