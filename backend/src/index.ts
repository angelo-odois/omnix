import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middlewares/cors';
import authRoutes from './routes/authRoutes';
import authRoutesV2 from './routes/authRoutesV2';
import salvyRoutes from './routes/salvyRoutes';
import stripeRoutes from './routes/stripeRoutes';
import wahaRoutes from './routes/wahaRoutes';
import messageRoutes from './routes/messageRoutes';
import workflowRoutes from './routes/workflowRoutes';
import adminRoutes from './routes/adminRoutes';
import tenantModuleRoutes from './routes/tenantModuleRoutes';
import whatsappRoutes from './modules/whatsapp/routes';
import messagesRoutes from './modules/messages/routes';
import contactsRoutes from './modules/contacts/routes';
import dashboardRoutes from './routes/dashboardRoutes';
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
    
    const authServiceV2 = (await import('./services/authServiceV2')).default;
    await authServiceV2.initialize();
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
  }
}

// Routes
app.use('/api', authRoutes);
app.use('/api/v2', authRoutesV2); // Nova API v2 com autenticação aprimorada
app.use('/api', salvyRoutes);
app.use('/api', stripeRoutes);
app.use('/api', wahaRoutes);
app.use('/api', messageRoutes);
app.use('/api', workflowRoutes);
app.use('/api/admin', adminRoutes); // Painel administrativo - apenas super admins
app.use('/api/tenant', tenantModuleRoutes); // Self-service de módulos para tenants
app.use('/api/whatsapp', whatsappRoutes); // WhatsApp instance management
app.use('/api/messages', messagesRoutes); // Message and conversation management
app.use('/api/contacts', contactsRoutes); // Contact management
app.use('/api/dashboard', dashboardRoutes); // Dashboard metrics and data

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