import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

// Product IDs from environment
const MONTHLY_PRODUCT_ID = process.env.STRIPE_MONTHLY_PRODUCT_ID;
const YEARLY_PRODUCT_ID = process.env.STRIPE_YEARLY_PRODUCT_ID;

if (!MONTHLY_PRODUCT_ID || !YEARLY_PRODUCT_ID) {
  throw new Error('Stripe product IDs are not set in environment variables');
}

// Interface for product configuration
interface ProductConfig {
  id: string;
  name: string;
  description: string;
  trialDays: number;
  priceId: string;
}

// Interface for full Stripe config
interface StripeConfig {
  products: {
    monthly: ProductConfig;
    yearly: ProductConfig;
  };
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

// Initialize config with product IDs
let STRIPE_CONFIG: StripeConfig = {
  products: {
    monthly: {
      id: MONTHLY_PRODUCT_ID,
      name: 'RedButton Monthly',
      description: 'Monthly subscription to RedButton',
      trialDays: 7,
      priceId: '' // Will be populated on init
    },
    yearly: {
      id: YEARLY_PRODUCT_ID,
      name: 'RedButton Yearly',
      description: 'Yearly subscription to RedButton',
      trialDays: 7,
      priceId: '' // Will be populated on init
    }
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/subscription/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/subscription/cancel'
};

// Function to initialize Stripe configuration
export const initializeStripeConfig = async (): Promise<void> => {
  try {
    // Fetch monthly product prices
    const monthlyPrices = await stripe.prices.list({
      product: MONTHLY_PRODUCT_ID,
      active: true,
      type: 'recurring',
      limit: 1
    });

    // Fetch yearly product prices
    const yearlyPrices = await stripe.prices.list({
      product: YEARLY_PRODUCT_ID,
      active: true,
      type: 'recurring',
      limit: 1
    });

    if (!monthlyPrices.data.length || !yearlyPrices.data.length) {
      throw new Error('No active prices found for products');
    }

    // Update config with price IDs
    STRIPE_CONFIG.products.monthly.priceId = monthlyPrices.data[0].id;
    STRIPE_CONFIG.products.yearly.priceId = yearlyPrices.data[0].id;

    console.log('Stripe configuration initialized successfully');
    console.log('Monthly price ID:', STRIPE_CONFIG.products.monthly.priceId);
    console.log('Yearly price ID:', STRIPE_CONFIG.products.yearly.priceId);
  } catch (error) {
    console.error('Failed to initialize Stripe configuration:', error);
    throw error;
  }
};

// Export the config
export { STRIPE_CONFIG };

// Validate required environment variables
export const validateStripeConfig = (): void => {
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_MONTHLY_PRODUCT_ID',
    'STRIPE_YEARLY_PRODUCT_ID',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missingVars.join(', ')}`);
  }
}; 