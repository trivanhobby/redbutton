import { Router } from 'express';
import { 
  generateSuggestions, 
  createJournalTemplate, 
  polishEntry, 
  initiativeChat,
  uploadFileToOpenAI,
  handleOnboardingChat,
  onboardingChat
} from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All AI routes are protected
router.use(requireAuth);

// Route to generate suggestions based on emotion
router.post('/suggestions', generateSuggestions);

// Route to generate journal template
router.post('/journal-template', createJournalTemplate);

// Route to polish a journal entry
router.post('/polish-entry', polishEntry);

// Route for initiative chat (streaming)
router.post('/initiative-chat', initiativeChat);

// Route for uploading files to OpenAI
router.post('/upload-file', uploadFileToOpenAI);

router.post('/onboarding-chat', onboardingChat);

export default router; 