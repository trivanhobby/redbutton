import { Router } from 'express';
import { 
  getUserData, 
  updateSettings,
  addEmotion,
  removeEmotion,
  addJournalEntry,
  addGoal,
  addInitiative,
  addCheckIn
} from '../controllers/userdata.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All user data routes are protected
router.use(requireAuth);

// Get all user data
router.get('/', getUserData);

// Update user settings
router.patch('/settings', updateSettings);

// Emotions routes
router.post('/emotions', addEmotion);
router.delete('/emotions/:emotionId', removeEmotion);

// Journal routes
router.post('/journal', addJournalEntry);

// Goals routes
router.post('/goals', addGoal);

// Initiatives routes
router.post('/initiatives', addInitiative);

// Check-ins routes
router.post('/checkins', addCheckIn);

export default router; 