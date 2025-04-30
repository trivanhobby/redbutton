import dotenv from 'dotenv';

dotenv.config();

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface AiLimitsConfig {
  maxTokens: {
    chat: number;
    suggestions: number;
    journal: number;
    polish: number;
  };
  temperature: {
    chat: number;
    suggestions: number;
    journal: number;
    polish: number;
  };
}

interface ApiConfig {
  env: string;
  port: number;
  mongoUri: string;
  corsOrigin: string | string[];
  rateLimit: RateLimitConfig;
}

/**
 * Basic API configuration
 */
export const API_CONFIG: ApiConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/redbutton',
  corsOrigin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:3000', 'http://localhost:5173'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes by default
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requests per windowMs by default
  }
};

/**
 * Extended API configuration interface with additional settings
 */
interface ApiConfigFull extends ApiConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  openaiApiKey: string;
  defaultModel: string;
  chatModel: string;
  aiLimits: AiLimitsConfig;
}

/**
 * Full API configuration with additional settings for JWT, OpenAI, and AI limits
 */
export const API_CONFIG_FULL: ApiConfigFull = {
  // Server configuration (inheriting basic config properties)
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/redbutton',
  corsOrigin: process.env.CORS_ORIGIN || '*', // In production, limit this to your frontend domain
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // OpenAI configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
  chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
  
  // AI request limits
  aiLimits: {
    maxTokens: {
      chat: parseInt(process.env.MAX_TOKENS_CHAT || '1000'),
      suggestions: parseInt(process.env.MAX_TOKENS_SUGGESTIONS || '600'),
      journal: parseInt(process.env.MAX_TOKENS_JOURNAL || '750'),
      polish: parseInt(process.env.MAX_TOKENS_POLISH || '1000'),
    },
    temperature: {
      chat: parseFloat(process.env.TEMPERATURE_CHAT || '0.7'),
      suggestions: parseFloat(process.env.TEMPERATURE_SUGGESTIONS || '0.7'),
      journal: parseFloat(process.env.TEMPERATURE_JOURNAL || '0.7'),
      polish: parseFloat(process.env.TEMPERATURE_POLISH || '0.4'),
    }
  }
}; 