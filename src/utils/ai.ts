import OpenAI from 'openai';
import { Emotion, Action, Goal, JournalEntry, AppData } from '../context/DataContext';

// Initialize the OpenAI client
let openai: OpenAI | null = null;

// This function tries to initialize OpenAI with the provided key
export const initializeOpenAI = (apiKey: string) => {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }
  
  try {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // This is for browser usage, in production use a backend
    });
    
    // We could potentially validate the API key by making a small test request
    // This would be more secure than just checking format, but would use an API call
    // For example: openai.models.list().then(() => {...}).catch(() => {...})
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return false;
  }
};

// Initializes OpenAI with a stored API key if available
export const initializeOpenAIFromStorage = () => {
  try {
    // First check localStorage
    const savedData = localStorage.getItem('redButtonData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const apiKey = parsedData?.settings?.apiKey;
      
      if (apiKey && apiKey.trim() !== '') {
        return initializeOpenAI(apiKey);
      }
    }
    
    // If no key in localStorage, check environment variables
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
      console.log('Using OpenAI API key from environment variables');
      
      // Initialize OpenAI with the environment variable
      const success = initializeOpenAI(envApiKey);
      
      // If successful, also save to app data for future use
      if (success && savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          parsedData.settings.apiKey = envApiKey;
          localStorage.setItem('redButtonData', JSON.stringify(parsedData));
          console.log('Saved environment API key to local storage');
        } catch (e) {
          console.error('Failed to save environment API key to local storage', e);
        }
      }
      
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing OpenAI from storage:', error);
    return false;
  }
};

// Gets the OpenAI instance, or null if not initialized
export const getOpenAI = (): OpenAI | null => {
  return openai;
};

const defaultSuggestions = [
  'Take a deep breath and count to 10',
  'Write down what you are feeling right now',
  'Drink a glass of water and stretch',
]

// Helper function to format goals with initiatives and check-ins
const formatGoalsWithDetails = (
  goals: Goal[], 
  initiatives: any[] = [], 
  checkIns: any[] = []
): string => {
  if (!goals || goals.length === 0) {
    return "No goals set yet.";
  }

  // Filter to active goals
  const activeGoals = goals.filter(goal => !goal.completed);
  
  return activeGoals.map(goal => {
    // Get initiatives for this goal
    const goalInitiatives = initiatives
      .filter(initiative => initiative.goalId === goal.id && !initiative.completed)
      .map(initiative => {
        // Get check-ins for this initiative
        const initiativeCheckIns = checkIns
          .filter(checkIn => checkIn.entityId === initiative.id && checkIn.entityType === 'initiative')
          .map(checkIn => `    - Check-in (${new Date(checkIn.timestamp).toLocaleDateString()}): ${checkIn.content}`);
        
        const initiativeStr = `  - Initiative: ${initiative.text}`;
        
        if (initiativeCheckIns.length > 0) {
          return initiativeStr + '\n' + initiativeCheckIns.join('\n');
        }
        return initiativeStr;
      });
    
    // Get check-ins for this goal
    const goalCheckIns = checkIns
      .filter(checkIn => checkIn.entityId === goal.id && checkIn.entityType === 'goal')
      .map(checkIn => `  - Check-in (${new Date(checkIn.timestamp).toLocaleDateString()}): ${checkIn.content}`);
    
    let goalString = `Goal: ${goal.text}`;
    
    if (goal.description) {
      goalString += `\n  Description: ${goal.description}`;
    }
    
    if (goalInitiatives.length > 0) {
      goalString += '\n  Initiatives:\n' + goalInitiatives.join('\n');
    }
    
    if (goalCheckIns.length > 0) {
      goalString += '\n  Goal Check-ins:\n' + goalCheckIns.join('\n');
    }
    
    return goalString;
  }).join('\n\n');
};

// This function generates suggestions based on the user's emotional state and goals
export const generateSuggestions = async (
  emotion: Emotion,
  availableMinutes: number,
  data: AppData,
  recentJournalEntries: JournalEntry[]
): Promise<string[]> => {
  if (!openai) {
    return defaultSuggestions;
  }

  try {
    // Get all data from localStorage for complete context
    
    const goals = data.goals;
    const initiatives = data.initiatives;
    const checkIns = data.checkIns;
    
    // Format goals with initiatives and check-ins
    const formattedGoals = formatGoalsWithDetails(goals, initiatives, checkIns);
    
    // Extract recent journal content
    const recentContent = recentJournalEntries
      .slice(0, 3)
      .map(entry => entry.content)
      .join('\n');
    
    // Create a prompt for the OpenAI API
    const prompt = `
    The user is feeling ${emotion.name.toLowerCase()} (${emotion.emoji}) right now and has ${availableMinutes} minutes available to improve their state.
    
    Their goals and initiatives are:
    ${formattedGoals}
    === 
    Recent journal entries:
    ${recentContent || 'No recent entries'}
    ===
    Given their current emotional state, goals, and recent reflections, suggest ${availableMinutes < 15 ? '1-2' : '2-3'} specific, actionable steps they can take in the next ${availableMinutes} minutes to ${emotion.isPositive ? 'leverage their positive state and continue making progress' : 'feel better and address concerns'} related to their goals.
    
    The suggestions should be:
    1. Simple and concrete
    2. Achievable in the time frame
    3. Related to their goals and initiatives when possible
    4. Consider their check-ins for context of what they're working on
    5. Sensitive to their emotional state
    
    Provide only the suggestions, each on a new line. Be concise and practical.

    Note 1: Suggestions ARE alternatives - so each should use all the timeframe. 
    Note 2: For negative emotions prioritize suggestions on feeling better and addressing concerns while not contradicting the goals. For positive emotions prioritize suggestions on leveraging the momentum and making progress towards the goals, choosing next step.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a compassionate productivity assistant that helps people take mindful action based on their emotional state.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 350,
    });

    const suggestions = response.choices[0].message.content
      ?.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[0-9-. ]+/, '').trim())
      .slice(0, 3);
    
    return suggestions || defaultSuggestions;
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return defaultSuggestions;
  }
};

// This function generates a journal template with guiding questions based on emotions and context
export const generateJournalTemplate = async (
  emotionRecords: any[],
  data: AppData,
  previousEntries: string[] = []
): Promise<string> => {
  if (!openai) {
    return getDefaultJournalTemplate();
  }

  try {
    // Get all data from localStorage for complete context
    const emotions = data.emotions;
    const goals = data.goals;
    const initiatives = data.initiatives;
    const checkIns = data.checkIns;
        
    // Format goals with initiatives and check-ins
    const formattedGoals = formatGoalsWithDetails(goals, initiatives, checkIns);
    
    // Get emotion names from records
    const emotionNames = emotionRecords.map(record => {
      const emotion = emotions.find(e => e.id === record.emotionId);
      return emotion ? `${emotion.name} (${emotion.emoji})` : 'Unknown';
    });
    
    // Create a prompt for the API
    const prompt = `
    Create a personalized journal template for today based on the following emotions the user experienced:
    ${emotionNames.length > 0 ? emotionNames.join(', ') : 'No emotions recorded yet today'}
    
    ${previousEntries.length > 0 ? `Here are excerpts from their recent journal entries for context:
    ${previousEntries.join('\n\n')}` : ''}
    ===
    Here are their active goals, initiatives, and check-ins:
    ${formattedGoals}
    ===
    Create a helpful journal template with:
    3-5 questions to reflect on, considering their goals, initiatives, check-ins, and emotions. Keep it short and not too hard to fill.
    For questions use regular text, for placeholders of what should be filled use <>.

    Keep the tone supportive, thoughtful, and introspective.
    Format the template using Markdown, with headers, bullet points, and sections.
    The template should be ready to use - the user will just need to fill in the blanks.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a compassionate journaling assistant that helps people process their emotions and make progress on their goals through reflective writing.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 750,
    });

    return response.choices[0].message.content || getDefaultJournalTemplate();
  } catch (error) {
    console.error('Failed to generate journal template:', error);
    return getDefaultJournalTemplate();
  }
};

// This function polishes and improves the journal entry text
export const polishJournalEntry = async (
  entryContent: string
): Promise<string> => {
  if (!openai || !entryContent.trim()) {
    return entryContent;
  }

  try {
    const prompt = `
    Please polish and improve the following journal entry, while preserving all the original thoughts, feelings, and ideas.
    
    Journal entry:
    ${entryContent}
    
    Your improvements should:
    1. Fix any grammar, spelling, and punctuation errors
    2. Improve flow and readability
    3. Add thoughtful transitions between ideas
    4. Enhance clarity where thoughts seem muddled
    5. Maintain the original voice and emotional tone
    6. Keep all personal insights and details
    
    Return only the polished version of the text with no additional commentary.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a skilled editor who helps improve journal entries while preserving the author\'s voice and meaning.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more focused editing
      max_tokens: 1000,
    });

    return response.choices[0].message.content || entryContent;
  } catch (error) {
    console.error('Failed to polish journal entry:', error);
    return entryContent;
  }
};

// Helper function to get a default journal template when API fails
const getDefaultJournalTemplate = (): string => {
  return `
# Today's Reflections

## Current Emotions
_How are you feeling right now? What emotions have you experienced today?_

## Reflection Questions
- What was the most significant part of your day?
- What challenged you today, and how did you respond?
- What are you grateful for right now?
- What did you learn about yourself today?

## Looking Forward
_What are your intentions for tomorrow? What do you want to remember or focus on?_
`;
}; 