import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '../config/stripe';
import UserData from '../models/userdata.model';
import { validateStripeConfig } from '../config/stripe';

// Get available subscription products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return the configured products with their details
    const products = {
      monthly: {
        id: STRIPE_CONFIG.products.monthly.id,
        name: STRIPE_CONFIG.products.monthly.name,
        description: STRIPE_CONFIG.products.monthly.description,
        trialDays: STRIPE_CONFIG.products.monthly.trialDays
      },
      yearly: {
        id: STRIPE_CONFIG.products.yearly.id,
        name: STRIPE_CONFIG.products.yearly.name,
        description: STRIPE_CONFIG.products.yearly.description,
        trialDays: STRIPE_CONFIG.products.yearly.trialDays
      }
    };

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription products'
    });
  }
};

// Create a Stripe Checkout session
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { productId } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    if (!productId || ![STRIPE_CONFIG.products.monthly.id, STRIPE_CONFIG.products.yearly.id].includes(productId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
      return;
    }

    // Get or create Stripe customer
    let userData = await UserData.findOne({ userId });
    if (!userData) {
      res.status(404).json({
        success: false,
        message: 'User data not found'
      });
      return;
    }

    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user?.email,
        metadata: {
          userId: userId.toString()
        }
      });
      customerId = customer.id;
      
      // Update user data with Stripe customer ID
      userData.stripeCustomerId = customerId;
      await userData.save();
    }

    // Check for existing active Stripe subscription
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
      });
      const activeSub = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');
      if (activeSub) {
        // Update DB with latest info
        userData.isSubscribed = activeSub.status === 'active' || activeSub.status === 'trialing';
        userData.subscriptionType = activeSub.items.data[0].price.id === STRIPE_CONFIG.products.monthly.id ? 'monthly' : 'yearly';
        let periodEnd = (activeSub as any).current_period_end;
        if (!(typeof periodEnd === 'number' && !isNaN(periodEnd))) {
          // Try to calculate from current_period_start + interval if possible
          const start = (activeSub as any).current_period_start;
          let interval = null;
          if (userData.subscriptionType === 'monthly') interval = 30 * 24 * 60 * 60; // 30 days in seconds
          if (userData.subscriptionType === 'yearly') interval = 365 * 24 * 60 * 60; // 365 days in seconds
          if (typeof start === 'number' && interval) {
            periodEnd = start + interval;
          } else {
            console.warn('No valid current_period_end or fallback for subscription:', activeSub.id);
          }
        }
        userData.subscriptionEnd = (typeof periodEnd === 'number' && !isNaN(periodEnd)) ? new Date(periodEnd * 1000) : null;
        userData.stripeSubscriptionId = activeSub.id;
        userData.activeProductId = activeSub.items.data[0].price.id;
        await userData.save();
        res.status(200).json({
          success: true,
          message: 'You already have an active subscription.',
          data: {
            alreadySubscribed: true,
            subscriptionId: activeSub.id,
            status: activeSub.status
          }
        });
        return;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: productId === STRIPE_CONFIG.products.monthly.id 
          ? STRIPE_CONFIG.products.monthly.priceId 
          : STRIPE_CONFIG.products.yearly.priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.products[productId === STRIPE_CONFIG.products.monthly.id ? 'monthly' : 'yearly'].trialDays,
      },
      success_url: `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId: userId.toString()
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
};

// Get current subscription status
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const userData = await UserData.findOne({ userId });
    if (!userData) {
      res.status(404).json({
        success: false,
        message: 'User data not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        isSubscribed: userData.isSubscribed,
        subscriptionType: userData.subscriptionType,
        subscriptionEnd: userData.subscriptionEnd,
        activeProductId: userData.activeProductId
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
};

// Handle Stripe webhook events
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).json({
      success: false,
      message: 'No Stripe signature found'
    });
    return;
  }

  try {
    validateStripeConfig();
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_CONFIG.webhookSecret
    );
    console.log('Stripe event:', event.type, event.id);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata.userId;
        let userData = null;
        if (userId) {
          userData = await UserData.findOne({ userId });
        }
        // Fallback: find by Stripe customer ID
        if (!userData && subscription.customer) {
          userData = await UserData.findOne({ stripeCustomerId: subscription.customer });
          if (userData) {
            userId = userData.userId.toString();
          }
        }
        if (!userData) {
          console.warn('Webhook: Could not find user for subscription', subscription.id, 'customer', subscription.customer);
          throw new Error('No user found for subscription');
        }
        // Update subscription status
        userData.isSubscribed = subscription.status === 'active' || subscription.status === 'trialing';
        userData.subscriptionType = subscription.items.data[0].price.id === STRIPE_CONFIG.products.monthly.id ? 'monthly' : 'yearly';
        let periodEnd = (subscription as any).current_period_end;
        if (!(typeof periodEnd === 'number' && !isNaN(periodEnd))) {
          // Try to calculate from current_period_start + interval if possible
          const start = (subscription as any).current_period_start;
          let interval = null;
          if (userData.subscriptionType === 'monthly') interval = 30 * 24 * 60 * 60; // 30 days in seconds
          if (userData.subscriptionType === 'yearly') interval = 365 * 24 * 60 * 60; // 365 days in seconds
          if (typeof start === 'number' && interval) {
            periodEnd = start + interval;
          } else {
            console.warn('No valid current_period_end or fallback for subscription:', subscription.id);
          }
        }
        userData.subscriptionEnd = (typeof periodEnd === 'number' && !isNaN(periodEnd)) ? new Date(periodEnd * 1000) : null;
        userData.stripeSubscriptionId = subscription.id;
        userData.activeProductId = subscription.items.data[0].price.id;
        // Also update stripeCustomerId if missing
        if (!userData.stripeCustomerId && subscription.customer) {
          userData.stripeCustomerId = subscription.customer as string;
        }
        await userData.save();
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (!userId) {
          throw new Error('No userId in subscription metadata');
        }

        const userData = await UserData.findOne({ userId });
        if (!userData) {
          throw new Error('User data not found');
        }

        // Reset subscription status
        userData.isSubscribed = false;
        userData.subscriptionType = null;
        userData.subscriptionEnd = null;
        userData.stripeSubscriptionId = null;
        userData.activeProductId = null;

        await userData.save();
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook error'
    });
  }
};

// Restore subscription from Stripe
export const restoreSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const userData = await UserData.findOne({ userId });
    if (!userData) {
      res.status(404).json({ success: false, message: 'User data not found' });
      return;
    }
    if (!userData.stripeCustomerId) {
      res.status(404).json({ success: false, message: 'No Stripe customer found for user' });
      return;
    }
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'all',
      limit: 10
    });
    const activeSub = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');
    if (activeSub) {
      console.log('Stripe subscription:', activeSub);
      userData.isSubscribed = activeSub.status === 'active' || activeSub.status === 'trialing';
      userData.subscriptionType = activeSub.items.data[0].price.id === STRIPE_CONFIG.products.monthly.id ? 'monthly' : 'yearly';
      let periodEnd = (activeSub as any).current_period_end;
      if (!(typeof periodEnd === 'number' && !isNaN(periodEnd))) {
        // Try to calculate from current_period_start + interval if possible
        const start = (activeSub as any).current_period_start;
        let interval = null;
        if (userData.subscriptionType === 'monthly') interval = 30 * 24 * 60 * 60; // 30 days in seconds
        if (userData.subscriptionType === 'yearly') interval = 365 * 24 * 60 * 60; // 365 days in seconds
        if (typeof start === 'number' && interval) {
          periodEnd = start + interval;
        } else {
          console.warn('No valid current_period_end or fallback for subscription:', activeSub.id);
        }
      }
      userData.subscriptionEnd = (typeof periodEnd === 'number' && !isNaN(periodEnd)) ? new Date(periodEnd * 1000) : null;
      userData.stripeSubscriptionId = activeSub.id;
      userData.activeProductId = activeSub.items.data[0].price.id;
      await userData.save();
      res.json({
        success: true,
        message: 'Subscription restored.',
        data: {
          isSubscribed: userData.isSubscribed,
          subscriptionType: userData.subscriptionType,
          subscriptionEnd: userData.subscriptionEnd,
          activeProductId: userData.activeProductId
        }
      });
      return;
    } else {
      // No active subscription
      userData.isSubscribed = false;
      userData.subscriptionType = null;
      userData.subscriptionEnd = null;
      userData.stripeSubscriptionId = null;
      userData.activeProductId = null;
      await userData.save();
      res.json({
        success: false,
        message: 'No active subscription found to restore.'
      });
      return;
    }
  } catch (error) {
    console.error('Error restoring subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to restore subscription' });
  }
}; 