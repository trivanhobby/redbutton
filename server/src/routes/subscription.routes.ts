import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getProducts,
  createCheckoutSession,
  getSubscriptionStatus,
  restoreSubscription
} from '../controllers/subscription.controller';

const router = express.Router();

// Get available subscription products
router.get('/products', requireAuth, getProducts);

// Create a Stripe Checkout session
router.post('/create-session', requireAuth, createCheckoutSession);

// Get current subscription status
router.get('/status', requireAuth, getSubscriptionStatus);

// Restore purchases
router.post('/restore', requireAuth, restoreSubscription);

export default router; 