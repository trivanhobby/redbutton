import OpenAI from 'openai';
import { Emotion, Action, Goal, JournalEntry } from '../context/DataContext';

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

// This function generates suggestions based on the user's emotional state and goals
export const generateSuggestions = async (
  emotion: Emotion,
  availableMinutes: number,
  goals: Goal[],
  recentJournalEntries: JournalEntry[]
): Promise<string[]> => {
  if (!openai) {
    return [
      'Take a deep breath and count to 10',
      'Write down what you are feeling right now',
      'Drink a glass of water and stretch',
    ];
  }

  try {
    // Extract active goals
    const activeGoals = goals.filter(goal => !goal.completed).map(goal => goal.text);
    
    // Extract recent journal content
    const recentContent = recentJournalEntries
      .slice(0, 3)
      .map(entry => entry.content)
      .join('\n');
    
    // Create a prompt for the OpenAI API
    const prompt = `
    The user is feeling ${emotion.name.toLowerCase()} (${emotion.emoji}) right now and has ${availableMinutes} minutes available to improve his state.
    
    Their goals are:
    ${activeGoals.map(goal => `- ${goal}`).join('\n')}
    === 
    Recent journal entries:
    ${recentContent || 'No recent entries'}
    ===
    Given their current emotional state, goals, and recent reflections, suggest ${availableMinutes < 15 ? '1-2' : '2-3'} specific, actionable steps they can take in the next ${availableMinutes} minutes to feel better(or if emotion is positive - to use the momentum) and move towards their goals.
    
    The suggestions should be:
    1. Simple and concrete
    2. Achievable in the time frame
    3. Related to their goals when possible
    4. Sensitive to their emotional state
    
    Provide only the suggestions, each on a new line. Be concise and practical.
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
    
    return suggestions || [
      'Take a deep breath and count to 10',
      'Write down what you are feeling right now',
      'Drink a glass of water and stretch',
    ];
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return [
      'Take a deep breath and count to 10',
      'Write down what you are feeling right now',
      'Drink a glass of water and stretch',
    ];
  }
};

// This function generates a journal template with guiding questions based on emotions and context
export const generateJournalTemplate = async (
  emotionRecords: any[],
  emotions: Emotion[],
  goals: Goal[],
  previousEntries: string[] = []
): Promise<string> => {
  if (!openai) {
    return `
# Journal Entry

## How I'm feeling
_Write about your emotions today..._

## Questions to reflect on
- What's the strongest emotion I felt today and why?
- What did I learn or accomplish?
- What am I grateful for?
- What could I have done differently?

## Plans for tomorrow
_What are my intentions for tomorrow?_
`;
  }

  try {
    // Get emotion names from records
    const emotionNames = emotionRecords.map(record => {
      const emotion = emotions.find(e => e.id === record.emotionId);
      return emotion ? `${emotion.name} (${emotion.emoji})` : 'Unknown';
    });
    const activeGoals = goals.filter(goal => !goal.completed).map(goal => goal.text);
    // Create a prompt for the API
    const prompt = `
    Create a personalized journal template for today based on the following emotions the user experienced:
    ${emotionNames.length > 0 ? emotionNames.join(', ') : 'No emotions recorded yet today'}
    
    ${previousEntries.length > 0 ? `Here are excerpts from their recent journal entries for context:
    ${previousEntries.join('\n\n')}` : ''}
    ===
    Here are active goals:
    ${activeGoals.join('\n\n')}
    ===
    Create a helpful journal template with:
    3-5 questions to reflect and some thoughts. Keep in short and not too hard to fill.
    for questions use regular text, for placeholders what should contains some ideas what to fill use <>

    Keep the tone supportive, thoughtful, and introspective.
    Format the template using Markdown, with headers, bullet points, and sections.
    The template should be ready to use - the user will just need to fill in the blanks.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a compassionate journaling assistant that helps people process their emotions through reflective writing.' 
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