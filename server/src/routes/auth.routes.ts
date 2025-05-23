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
  appleCallback,
  oauthLogin
} from '../controllers/auth.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

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
    accessType: 'offline',
    prompt: 'consent',
    session: false 
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL}/auth/google/callback?error=google_auth_failed`,
    session: false 
  }),
  (req, res) => {
    console.log('Google callback - User:', req.user);
    
    const user = req.user as any;
    if (!user || !user.token) {
      console.error('No user or token in callback');
      res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?error=google_auth_failed`);
      return;
    }
    
    // Redirect to frontend with our JWT token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?token=${user.token}`);
  }
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

// OAuth token exchange endpoint
router.post('/oauth', oauthLogin);

export default router; 