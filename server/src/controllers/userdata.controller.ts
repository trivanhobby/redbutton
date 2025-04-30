import { Request, Response } from 'express';
import UserData from '../models/userdata.model';
import { v4 as uuidv4 } from 'uuid';
import { defaultEmotions, defaultGoals } from '../utils/defaults';

// Get all user data
export const getUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    // Find user data or create if not exists
    let userData = await UserData.findOne({ userId });
    
    // If no user data found, initialize with defaults
    if (!userData) {
      userData = new UserData({
        userId,
        emotions: defaultEmotions,
        actions: [],
        journalEntries: [],
        goals: defaultGoals,
        initiatives: [],
        checkIns: [],
        settings: {
          customEmotions: false,
          theme: 'dark',
          aiEnabled: true
        }
      });
      
      await userData.save();
    }
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving user data' 
    });
  }
};

// Update user settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { settings } = req.body;
    
    if (!settings) {
      res.status(400).json({ 
        success: false, 
        message: 'No settings provided' 
      });
      return;
    }
    
    // Update settings
    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $set: { settings } },
      { new: true, upsert: true }
    );
    
    res.status(200).json({
      success: true,
      settings: userData.settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating settings' 
    });
  }
};

// Add emotion
export const addEmotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { name, emoji, isPositive } = req.body;
    
    if (!name || !emoji || isPositive === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required emotion fields' 
      });
      return;
    }
    
    const newEmotion = {
      id: uuidv4(),
      name,
      emoji,
      isPositive
    };
    
    // Add emotion to user data
    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $push: { emotions: newEmotion } },
      { new: true }
    );
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
      return;
    }
    
    res.status(201).json({
      success: true,
      emotion: newEmotion,
      emotions: userData.emotions
    });
  } catch (error) {
    console.error('Error adding emotion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding emotion' 
    });
  }
};

// Remove emotion
export const removeEmotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { emotionId } = req.params;
    
    if (!emotionId) {
      res.status(400).json({ 
        success: false, 
        message: 'Emotion ID is required' 
      });
      return;
    }
    
    // Remove emotion from user data
    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $pull: { emotions: { id: emotionId } } },
      { new: true }
    );
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      emotions: userData.emotions
    });
  } catch (error) {
    console.error('Error removing emotion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error removing emotion' 
    });
  }
};

// Add journal entry
export const addJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { date, content, emotionRecords = [], actions = [] } = req.body;
    
    if (!date) {
      res.status(400).json({ 
        success: false, 
        message: 'Date is required' 
      });
      return;
    }
    
    // Check if entry already exists for this date
    const existingEntry = await UserData.findOne({
      userId,
      'journalEntries.date': date
    });
    
    if (existingEntry) {
      // Update existing entry
      const updatedData = await UserData.findOneAndUpdate(
        { userId, 'journalEntries.date': date },
        { 
          $set: { 
            'journalEntries.$.content': content,
            'journalEntries.$.emotionRecords': emotionRecords,
            'journalEntries.$.actions': actions
          } 
        },
        { new: true }
      );
      
      res.status(200).json({
        success: true,
        entry: updatedData?.journalEntries.find(e => e.date === date),
        message: 'Journal entry updated'
      });
    } else {
      // Create new entry
      const newEntry = {
        id: uuidv4(),
        date,
        content,
        emotionRecords,
        actions
      };
      
      // Add entry to user data
      const updatedData = await UserData.findOneAndUpdate(
        { userId },
        { $push: { journalEntries: newEntry } },
        { new: true }
      );
      
      res.status(201).json({
        success: true,
        entry: newEntry,
        message: 'Journal entry created'
      });
    }
  } catch (error) {
    console.error('Error adding journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding journal entry' 
    });
  }
};

// Add goal
export const addGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { text, description = '' } = req.body;
    
    if (!text) {
      res.status(400).json({ 
        success: false, 
        message: 'Goal text is required' 
      });
      return;
    }
    
    const newGoal = {
      id: uuidv4(),
      text,
      description,
      completed: false,
      isFixed: false,
      createdAt: new Date().toISOString()
    };
    
    // Add goal to user data
    const userData = await UserData.findOneAndUpdate(
      { userId },
      { $push: { goals: newGoal } },
      { new: true }
    );
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
      return;
    }
    
    res.status(201).json({
      success: true,
      goal: newGoal,
      goals: userData.goals
    });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding goal' 
    });
  }
};

// Add initiative to a goal
export const addInitiative = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { text, goalId } = req.body;
    
    if (!text || !goalId) {
      res.status(400).json({ 
        success: false, 
        message: 'Initiative text and goal ID are required' 
      });
      return;
    }
    
    // Verify the goal exists
    const userData = await UserData.findOne({ 
      userId, 
      'goals.id': goalId 
    });
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'Goal not found' 
      });
      return;
    }
    
    const newInitiative = {
      id: uuidv4(),
      text,
      completed: false,
      goalId,
      createdAt: new Date().toISOString()
    };
    
    // Add initiative to user data
    const updatedData = await UserData.findOneAndUpdate(
      { userId },
      { $push: { initiatives: newInitiative } },
      { new: true }
    );
    
    res.status(201).json({
      success: true,
      initiative: newInitiative,
      initiatives: updatedData?.initiatives.filter(i => i.goalId === goalId)
    });
  } catch (error) {
    console.error('Error adding initiative:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding initiative' 
    });
  }
};

// Add check-in
export const addCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { content, entityId, entityType } = req.body;
    
    if (!content || !entityId || !entityType) {
      res.status(400).json({ 
        success: false, 
        message: 'Check-in content, entity ID, and entity type are required' 
      });
      return;
    }
    
    // Verify the entity exists
    let entityExists = false;
    if (entityType === 'goal') {
      entityExists = !!(await UserData.findOne({ userId, 'goals.id': entityId }));
    } else if (entityType === 'initiative') {
      entityExists = !!(await UserData.findOne({ userId, 'initiatives.id': entityId }));
    }
    
    if (!entityExists) {
      res.status(404).json({ 
        success: false, 
        message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found` 
      });
      return;
    }
    
    const newCheckIn = {
      id: uuidv4(),
      content,
      timestamp: new Date().toISOString(),
      entityId,
      entityType
    };
    
    // Add check-in to user data
    const updatedData = await UserData.findOneAndUpdate(
      { userId },
      { $push: { checkIns: newCheckIn } },
      { new: true }
    );
    
    res.status(201).json({
      success: true,
      checkIn: newCheckIn,
      checkIns: updatedData?.checkIns.filter(c => c.entityId === entityId && c.entityType === entityType)
    });
  } catch (error) {
    console.error('Error adding check-in:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding check-in' 
    });
  }
}; 