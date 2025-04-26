import OpenAI from 'openai';
import { Emotion, Action, Goal, JournalEntry } from '../context/DataContext';

// Initialize the OpenAI client
let openai: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string) => {
  try {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // This is for browser usage, in production use a backend
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
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
    The user is feeling ${emotion.name.toLowerCase()} (${emotion.emoji}) right now and has ${availableMinutes} minutes available.
    
    Their goals are:
    ${activeGoals.map(goal => `- ${goal}`).join('\n')}
    
    Recent journal entries:
    ${recentContent || 'No recent entries'}
    
    Given their current emotional state, goals, and recent reflections, suggest ${availableMinutes < 15 ? '1-2' : '2-3'} specific, actionable steps they can take in the next ${availableMinutes} minutes to feel better and move towards their goals.
    
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