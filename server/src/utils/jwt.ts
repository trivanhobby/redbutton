import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param user User document
 * @returns JWT token
 */
export const generateToken = (user: IUser): string => {
  const payload = { 
    id: user._id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a temporary token (for password reset, email verification, etc.)
 * @param payload Data to encode in the token
 * @param expiresIn Token expiration time
 * @returns JWT token
 */
export const generateTempToken = (payload: any, expiresIn: string = '1h'): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn 
  } as jwt.SignOptions);
}; 