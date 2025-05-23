import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import passport from 'passport';
import { API_CONFIG } from './config/api';
import { initializeStripeConfig } from './config/stripe';
import './config/passport';
import { handleStripeWebhook } from './controllers/subscription.controller';
import http from 'http';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import userdataRoutes from './routes/userdata.routes';
import subscriptionRoutes from './routes/subscription.routes';

// Initialize express app
const app: Express = express();
const PORT = API_CONFIG.port;

// Initialize server
const initializeServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Stripe configuration
    await initializeStripeConfig();

    // Create HTTPS server
    const server = http.createServer(app);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`HTTPS Server running on port ${PORT} in ${API_CONFIG.env} mode`);
      console.log(`Visit http://localhost:${PORT} to access the server`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: API_CONFIG.rateLimit.windowMs,
  max: API_CONFIG.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: API_CONFIG.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Stripe webhook: must be before express.json()!
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.get('/download', (req, res) => {
  res.download('/data/storage/RedButton-1.0.0-universal.dmg'); 
});
// All other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Apply rate limiting
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/userdata', userdataRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success',
    message: 'RedButton server is running',
    version: '1.0.0',
    environment: API_CONFIG.env
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start the server
initializeServer(); 