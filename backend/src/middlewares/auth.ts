import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

export interface AuthRequest extends Request {
  user?: any;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await authService.validateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Falha na autenticação' });
  }
}