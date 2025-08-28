import { Router, Request, Response } from 'express';
import authService from '../services/authService';
import { AuthRequest, authMiddleware } from '../middlewares/auth';

const router = Router();

// Request magic link / OTP
router.post('/auth/magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email é obrigatório' 
      });
    }

    const result = await authService.sendOTP(email);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /auth/magic-link:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao enviar código' 
    });
  }
});

// Verify OTP
router.post('/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email e código são obrigatórios' 
      });
    }

    const result = await authService.verifyOTP(email, otp);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    return res.json({
      token: result.token,
      user: result.user,
      tenant: result.tenant
    });
  } catch (error: any) {
    console.error('Error in /auth/verify-otp:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Erro ao verificar código' 
    });
  }
});

// Validate session
router.get('/auth/session', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    // Mock tenant data
    const tenant = {
      id: user.tenantId,
      name: 'OmniX Demo',
      domain: 'omnix.com',
      plan: 'premium',
      status: 'active'
    };

    return res.json({
      token: req.headers.authorization?.split(' ')[1],
      user,
      tenant
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: 'Erro ao validar sessão' 
    });
  }
});

// Logout (optional - mainly for client-side cleanup)
router.post('/auth/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  // In a real app, you might blacklist the token here
  return res.json({ 
    success: true,
    message: 'Logout realizado com sucesso' 
  });
});

export default router;