import { Request, Response, NextFunction } from 'express';
import UserData from '../models/userdata.model';

/**
 * Middleware to check if the user has an active subscription
 * If not subscribed, returns a generic response based on the endpoint
 */
export const requireSubscription = (endpointType: 'chat' | 'suggestions' | 'journal' | 'polish') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      // If user is subscribed, proceed to the next middleware/controller
      if (userData.isSubscribed) {
        next();
        return;
      }
      next();
      return;

      // For non-subscribers, return generic responses based on endpoint type
      switch (endpointType) {
        case 'chat':
          res.json({
            success: true,
            data: {
              message: "I'm here to help you reflect on your goals and emotions. To get personalized AI assistance, please subscribe to RedButton.",
              suggestions: [
                "Try our free features to get started",
                "Subscribe to unlock AI-powered goal setting and emotional support",
                "Explore our community resources"
              ]
            }
          });
          break;

        case 'suggestions':
          res.json({
            success: true,
            data: {
              suggestions: [
                "Take a moment to breathe and reflect",
                "Write down your thoughts in a journal",
                "Share your feelings with a friend",
                "Try a short meditation",
                "Go for a walk in nature"
              ]
            }
          });
          break;

        case 'journal':
          res.json({
            success: true,
            data: {
              template: "Today I feel...\n\nWhat's on my mind?\n\nWhat am I grateful for?\n\nWhat would I like to improve?"
            }
          });
          break;

        case 'polish':
          res.json({
            success: true,
            data: {
              polishedContent: req.body.content // Return the original content without AI polishing
            }
          });
          break;
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check subscription status'
      });
    }
  };
}; 