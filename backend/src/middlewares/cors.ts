import cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:8500',
    'http://localhost:8501',
    'http://localhost:8502',
    'http://localhost:8503',
    'http://localhost:8504',
    'http://localhost:8505',
    'http://localhost:8506',
    process.env.FRONTEND_URL || 'http://localhost:8505'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});