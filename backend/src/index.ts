import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middlewares/cors';
import authRoutes from './routes/authRoutes';
import authRoutesV2 from './routes/authRoutesV2';
import salvyRoutes from './routes/salvyRoutes';
import stripeRoutes from './routes/stripeRoutes';
import wahaRoutes from './routes/wahaRoutes';
import messageRoutes from './routes/messageRoutes';
import emailService from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(corsMiddleware);
// Stripe webhook precisa do raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
async function initializeServices() {
  try {
    await emailService.initialize();
    console.log('✅ Email service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
  }
}

// Routes
app.use('/api', authRoutes);
app.use('/api/v2', authRoutesV2); // Nova API v2 com autenticação aprimorada
app.use('/api', salvyRoutes);
app.use('/api', stripeRoutes);
app.use('/api', wahaRoutes);
app.use('/api', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║     🚀 OmniX Backend Server                 ║
║                                              ║
║     Running on: http://localhost:${PORT}       ║
║     Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                              ║
║     Endpoints:                               ║
║     POST /api/auth/magic-link               ║
║     POST /api/auth/verify-otp               ║
║     GET  /api/auth/session                  ║
║     POST /api/auth/logout                   ║
║                                              ║
║     Test users:                              ║
║     - admin@omnix.com (admin)               ║
║     - gestor@omnix.com (gestor)             ║
║     - operador@omnix.com (operador)         ║
║     - ahspimentel@gmail.com (admin)         ║
║                                              ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();