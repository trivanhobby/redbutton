import { Router } from 'express';
import { 
  generateSuggestions, 
  createJournalTemplate, 
  polishEntry, 
  initiativeChat,
  uploadFileToOpenAI,
  handleOnboardingChat,
  onboardingChat,
  getSuggestionExplanation
} from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireSubscription } from '../middleware/subscription.middleware';

const router = Router();

// All AI routes are protected
router.use(requireAuth);

// Route to generate suggestions based on emotion (requires subscription)
router.post('/suggestions', requireSubscription('suggestions'), generateSuggestions);

// Route to generate journal template (requires subscription)
router.post('/journal-template', requireSubscription('journal'), createJournalTemplate);

// Route to polish a journal entry (requires subscription)
router.post('/polish-entry', requireSubscription('polish'), polishEntry);

// Route for initiative chat (streaming) (requires subscription)
router.post('/initiative-chat', requireSubscription('chat'), initiativeChat);

// Route for uploading files to OpenAI (requires subscription)
router.post('/upload-file', requireSubscription('chat'), uploadFileToOpenAI);

// Onboarding chat doesn't require subscription
router.post('/onboarding-chat', onboardingChat);

// Route to get explanation for a suggestion (requires subscription)
router.post('/suggestion-explanation', requireSubscription('suggestions'), getSuggestionExplanation);

export default router; 