import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import passport from 'passport';
import { API_CONFIG } from './config/api';
import './config/passport';

// Routes
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import userdataRoutes from './routes/userdata.routes';

// Initialize express app
const app: Express = express();
const PORT = API_CONFIG.port;

// Connect to MongoDB
connectDB();

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
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(passport.initialize());
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/userdata', userdataRoutes);

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
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${API_CONFIG.env} mode`);
}); 