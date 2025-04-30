import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser } from '../models/user.model';

// Define extended request with user property
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

/**
 * Middleware to check if the user is authenticated via JWT token
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: IUser) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - valid authentication required'
      });
      return;
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is not active'
      });
      return;
    }
    
    // Attach user to request
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to check if the user is an admin
 * Must be used after requireAuth middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized - authentication required'
    });
    return;
  }
  
  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden - admin access required'
    });
    return;
  }
  
  next();
}; 