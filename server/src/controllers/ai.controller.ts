import { Request, Response } from 'express';
import { 
  getSuggestionsForEmotion, 
  generateJournalTemplate, 
  polishJournalEntry, 
  streamChatResponse, 
  EnhancedSuggestion,
  ChatContext,
  ChatMessage
} from '../utils/openai';
import UserData from '../models/userdata.model';
import User from '../models/user.model';
import { initializeOpenAI, ensureOpenAI } from '../utils/openai';
import { IncomingForm } from 'formidable';
import fs from 'fs';

// Generate suggestions based on emotion
export const generateSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { 
      emotionId, 
      emotionName,
      isPositive, 
      availableMinutes = 10,
      action
    } = req.body;
    
    // Validate required fields
    if (!emotionId || !emotionName || isPositive === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
      return;
    }
    
    // Get user data for context
    const userData = await UserData.findOne({ userId });
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
      return;
    }
    
    // Check if user has API key
    const user = await User.findById(userId);
    if (user?.apiKey) {
      initializeOpenAI(user.apiKey);
    }
    
    // Generate suggestions
    const suggestions = await getSuggestionsForEmotion(
      emotionId,
      emotionName,
      isPositive,
      availableMinutes,
      userData.goals,
      userData.initiatives,
      userData.checkIns,
      action
    );
    
    res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating suggestions' 
    });
  }
};

// Generate journal template
export const createJournalTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { emotions, previousEntries = [] } = req.body;
    
    // Validate required fields
    if (!emotions || !Array.isArray(emotions)) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing or invalid emotions data' 
      });
      return;
    }
    
    // Check if user has API key
    const user = await User.findById(userId);
    if (user?.apiKey) {
      initializeOpenAI(user.apiKey);
    }
    
    const userData = await UserData.findOne({ userId });
    
    if (!userData) {
      res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
      return;
    }
    // Generate template
    const template = await generateJournalTemplate(emotions, previousEntries, userData.goals, userData.initiatives, userData.checkIns);
    
    res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error generating journal template:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating journal template' 
    });
  }
};

// Polish journal entry
export const polishEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { entryContent } = req.body;
    
    // Validate required fields
    if (!entryContent) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing entry content' 
      });
      return;
    }
    
    // Check if user has API key
    const user = await User.findById(userId);
    if (user?.apiKey) {
      initializeOpenAI(user.apiKey);
    }
    
    // Polish entry
    const polishedContent = await polishJournalEntry(entryContent);
    
    res.status(200).json({
      success: true,
      polishedContent
    });
  } catch (error) {
    console.error('Error polishing journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error polishing journal entry' 
    });
  }
};

// Start chat session for initiatives
export const initiativeChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    const { 
      context,
      history = [],
      message 
    } = req.body;
    
    // Validate required fields
    if (!context || !context.initiative || !message) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
      return;
    }
    
    // Check if user has API key
    const user = await User.findById(userId);
    if (user?.apiKey) {
      initializeOpenAI(user.apiKey);
    }
    
    // Set up server-sent events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Function to send chunks of data
    const sendData = (data: string) => {
      res.write(`data: ${JSON.stringify({ text: data })}\n\n`);
    };
    
    // Function to send error
    const sendError = (error: string) => {
      res.write(`data: ${JSON.stringify({ error })}\n\n`);
      res.end();
    };
    
    try {
      // Get user data for context enrichment (optional)
      const userData = await UserData.findOne({ userId });
      
      // Start streaming response
      const result = await streamChatResponse(
        context,
        history,
        message,
        sendData
      );
      
      // Send completion message
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        fullResponse: result.fullResponse,
        checkIns: result.checkIns,
        hasCheckIn: result.hasCheckIn
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error('Error in chat stream:', error);
      sendError('Error processing chat request');
    }
  } catch (error) {
    console.error('Error in initiative chat:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Error processing chat request' 
      });
    } else {
      res.end();
    }
  }
};

// Upload file to OpenAI
export const uploadFileToOpenAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
      return;
    }
    
    // Check if user has API key
    const user = await User.findById(userId);
    if (user?.apiKey) {
      initializeOpenAI(user.apiKey);
    }
    
    // Use formidable to parse the form data with files
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      multiples: false
    });
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({
          success: false,
          message: 'Error parsing file upload'
        });
        return;
      }
      
      // Get the uploaded file - formidable v4 has a different structure
      const fileObj = files.file;
      if (!fileObj || !Array.isArray(fileObj) || fileObj.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }
      
      const file = fileObj[0];
      
      try {
        const openai = ensureOpenAI();
        
        // Create a readable stream from the temporary file
        const fileStream = fs.createReadStream(file.filepath);
        
        // Upload to OpenAI
        const result = await openai.files.create({
          file: fileStream,
          purpose: 'assistants'
        });
        
        // Return the file ID
        res.status(200).json({
          success: true,
          fileId: result.id,
          filename: file.originalFilename || 'uploaded-file'
        });
      } catch (error) {
        console.error('Error uploading file to OpenAI:', error);
        res.status(500).json({
          success: false,
          message: 'Error uploading file to OpenAI'
        });
      } finally {
        // Clean up the temporary file
        if (file.filepath) {
          fs.unlink(file.filepath, (err) => {
            if (err) console.error('Error removing temporary file:', err);
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in file upload:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing file upload' 
    });
  }
}; 