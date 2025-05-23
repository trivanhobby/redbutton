import { Router } from 'express';
import { 
  login, 
  register, 
  createInvite, 
  verifyInvite, 
  googleCallback,
  getCurrentUser,
  generateInviteLink,
  facebookCallback,
  appleCallback
} from '../controllers/auth.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import passport from 'passport';

const router = Router();

// Authentication routes
router.post('/login', login);
router.post('/register', register);
router.post('/verify-invite', verifyInvite);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);
router.post('/invite', requireAuth, requireAdmin, createInvite);

// Admin route for direct invite link generation (no email)
router.post('/admin/generate-invite', generateInviteLink);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed',
    session: false 
  }),
  googleCallback
);

// Facebook OAuth routes
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email'],
    session: false
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login?error=facebook_auth_failed',
    session: false
  }),
  facebookCallback
);

// Apple OAuth routes
router.get(
  '/apple',
  passport.authenticate('apple', {
    scope: ['name', 'email'],
    session: false
  })
);

router.post(
  '/apple/callback',
  passport.authenticate('apple', {
    failureRedirect: '/login?error=apple_auth_failed',
    session: false
  }),
  appleCallback
);

export default router; 