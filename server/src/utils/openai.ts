import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Goal, Initiative, CheckIn } from '../types/app.types';
import { API_CONFIG_FULL } from '../config/api';
import fs from 'fs';

dotenv.config();

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Initialize OpenAI with API key
export const initializeOpenAI = (apiKey?: string): boolean => {
  try {
    const key = apiKey || API_CONFIG_FULL.openaiApiKey;
    
    if (!key) {
      console.error('OpenAI API key not provided');
      return false;
    }
    
    openai = new OpenAI({ apiKey: key });
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    return false;
  }
};

// Make sure OpenAI is initialized
export const ensureOpenAI = (): OpenAI => {
  if (!openai) {
    const success = initializeOpenAI();
    if (!success || !openai) {
      throw new Error('Failed to initialize OpenAI client');
    }
  }
  return openai;
};

// Enhanced suggestion with optional related item
export interface EnhancedSuggestion {
  text: string;
  relatedItem?: {
    id: string;
    type: 'goal' | 'initiative';
    name: string;
  };
}

// Format goals and initiatives into a string format for the AI prompt
const formatGoalsWithDetails = (
  goals: Goal[], 
  initiatives: Initiative[] = [], 
  checkIns: CheckIn[] = []
): string => {
  let formattedGoals = '';
  
  goals.forEach(goal => {
    const goalInitiatives = initiatives.filter(i => i.goalId === goal.id);
    const goalCheckIns = checkIns.filter(c => c.entityId === goal.id && c.entityType === 'goal');
    
    // Add the goal
    formattedGoals += `GOAL: ID: ${goal.id} - ${goal.text}\n`;
    if (goal.description) {
      formattedGoals += `DESCRIPTION: ${goal.description}\n`;
    }
    
    // Add goal check-ins
    if (goalCheckIns.length > 0) {
      formattedGoals += 'PROGRESS NOTES:\n';
      goalCheckIns.forEach(checkIn => {
        const date = new Date(checkIn.timestamp).toLocaleDateString();
        formattedGoals += `- ${date}: ${checkIn.content}\n`;
      });
    }
    
    // Add initiatives
    if (goalInitiatives.length > 0) {
      formattedGoals += 'INITIATIVES:\n';
      goalInitiatives.forEach(initiative => {
        formattedGoals += `- ID: ${initiative.id} - ${initiative.text} (${initiative.completed ? 'COMPLETED' : 'IN PROGRESS'})\n`;
        
        // Add initiative check-ins
        const initiativeCheckIns = checkIns.filter(c => 
          c.entityId === initiative.id && c.entityType === 'initiative'
        );
        
        if (initiativeCheckIns.length > 0) {
          initiativeCheckIns.forEach(checkIn => {
            const date = new Date(checkIn.timestamp).toLocaleDateString();
            formattedGoals += `  * ${date}: ${checkIn.content}\n`;
          });
        }
      });
    }
    
    formattedGoals += '\n';
  });
  
  return formattedGoals;
};

// Get suggestions for a specific emotion
export const getSuggestionsForEmotion = async (
  emotionId: string,
  emotionName: string,
  isPositive: boolean,
  availableMinutes: number = 10,
  goals: Goal[] = [],
  initiatives: Initiative[] = [],
  checkIns: CheckIn[] = [],
  action?: string
): Promise<EnhancedSuggestion[]> => {
  try {
    const ai = ensureOpenAI();
    
    // Format goals for the prompt
    const goalsText = formatGoalsWithDetails(goals, initiatives, checkIns);
    
    // Create the prompt based on whether it's a positive or negative emotion
    let prompt = isPositive
      ? `I'm feeling ${emotionName} right now and I have ${availableMinutes} minutes available.`
      : `I'm feeling ${emotionName} right now and I have ${availableMinutes} minutes available. I need some suggestions to help me feel better or be more productive.`;
      
    // Add action context for positive emotions
    if (isPositive && action) {
      if (action === 'celebrate') {
        prompt += ` I want to have at least one proposal that will allow me to celebrate this feeling.`;
      } else if (action === 'plan') {
        prompt += ` I want you to help me to identify a next step.`;
      }
    }
    
    // Complete the prompt with goals context
    prompt += `\n\nHere are my current goals and initiatives:\n${goalsText}
    Given my current state and goals, what are 3 specific actions I could take in the next ${availableMinutes} minutes?

    I want your actions to be 
    - very specific and brief. (for example: "let's go running for 30 minutes" is a good initiatve, but "Set a Micro-Goal (Professional Growth): Take 3 minutes to jot down one small, actionable step you can take toward your professional growth" - not so good. it is too abstract )
    - exactly fit to the available time
    - look at the goals, initiatives and check-ins (CONSIDERING IT's DATES - that's what user choose!) AND
      - try to balance between the goals - to not prioritize one goal over the others
      - propose actions that are about different goals
      - combine some very straightforwards actions (for example: "let's go running for 30 minutes") with more abstract & complex ones 

    OUTPUT FORMAT NOTES:
    - each action should be in a new line. No multiline actions. (but line could be a bit longer than 100 characters)
    - if action relevant to specific goal or to specific initiative, follow the format: <id>: <action_text>
    `;    
    // Call OpenAI API
    const response = await ai.chat.completions.create({
      model: API_CONFIG_FULL.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are an empathetic assistant helping users respond effectively to their emotional states.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: API_CONFIG_FULL.aiLimits.temperature.suggestions,
      max_tokens: API_CONFIG_FULL.aiLimits.maxTokens.suggestions
    });
    
    // Extract and format the suggestions
    const suggestionsText = response.choices[0].message.content || '';
    let suggestions = processSuggestions(suggestionsText, goals, initiatives);
    
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
};

// Extract and process suggestions from text, linking them to goals or initiatives where possible
const processSuggestions = (
  text: string,
  goals: Goal[],
  initiatives: Initiative[]
): EnhancedSuggestion[] => {
  // Split the text by new lines and filter out empty lines
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // If no valid lines were found, return a default suggestion
  if (lines.length === 0) {
    return [{ text: "Take a few minutes to reflect on your current emotions." }];
  }
  
  // Process each line into a suggestion with potential goal/initiative links
  return lines.map(line => {
    // Remove any numbering or bullet points
    let cleanedLine = line.replace(/^(\d+\.|\*|\-)\s+/, '').trim();
    
    // Check if the line has an ID reference in format "<id>: <text>"
    const idMatch = cleanedLine.split(':');
    
    if (idMatch.length === 2) {
      // Extract the ID and text
      const id = idMatch[0];
      const text = idMatch[1].trim();
      
      // Try to find a matching initiative first
      const initiative = initiatives.find(i => i.id === id);
      if (initiative) {
        const goal = goals.find(g => g.id === initiative.goalId);
        return { 
          text,
          relatedItem: {
            id: initiative.id,
            type: 'initiative',
            name: `${initiative.text} (${goal?.text || 'Unknown goal'})`
          }
        };
      }
      
      // Then check if it's a goal ID
      const goal = goals.find(g => g.id === id);
      if (goal) {
        return { 
          text,
          relatedItem: {
            id: goal.id,
            type: 'goal',
            name: goal.text
          }
        };
      }
      
      // If ID doesn't match any goal or initiative, just use the text
      return { text };
    }
    
    // No ID in the format. Try to find mentions of initiatives or goals in the text
    const text = cleanedLine.toLowerCase();
    
    // Check initiatives first (more specific)
    for (const initiative of initiatives) {
      if (text.includes(initiative.text.toLowerCase())) {
        const goal = goals.find(g => g.id === initiative.goalId);
        return {
          text: cleanedLine,
          relatedItem: {
            id: initiative.id,
            type: 'initiative',
            name: `${initiative.text} (${goal?.text || 'Unknown goal'})`
          }
        };
      }
    }
    
    // Check goals
    for (const goal of goals) {
      if (text.includes(goal.text.toLowerCase())) {
        return {
          text: cleanedLine,
          relatedItem: {
            id: goal.id,
            type: 'goal',
            name: goal.text
          }
        };
      }
    }
    
    // If no matches found, return just the text
    return { text: cleanedLine };
  });
};

// Generate journal template based on emotions
export const generateJournalTemplate = async (
  emotions: { name: string, isPositive: boolean }[],
  previousEntries: string[] = [],
  goals: Goal[] = [],
  initiatives: Initiative[] = [],
  checkIns: CheckIn[] = []
): Promise<string> => {
  try {
    const ai = ensureOpenAI();
    
    // Prepare emotions for the prompt
    const emotionsText = emotions.map(e => `${e.name} (${e.isPositive ? 'positive' : 'negative'})`).join(', ');
    const goalsText = formatGoalsWithDetails(goals, initiatives, checkIns);
    // Prepare previous entries context (limit to recent entries to save tokens)
    const recentEntries = previousEntries.slice(0, 2).join('\n\n');
    
    const prompt = `
      === TASK ===
      Create a thoughtful journal template for today that helps me reflect on these emotions.
      Include 3-5 specific questions or prompts to guide my reflection.
      Keep it plaintext only. Only questions to answer (or reference to some TODAY's updates like check-ins)
      Today is ${new Date().toLocaleDateString()}.

      === CONTEXT ===
      I experienced these emotions today: ${emotionsText}.
      ${recentEntries ? `\n\nHere are my most recent journal entries:\n${recentEntries}` : ''}
      ${goalsText ? `\n\nHere are my current goals and initiatives:\n${goalsText}` : ''}

      === OUTPUT FORMAT ===
      Plaintext only. Numbered list of questions.
      I allow to add 1 inspirational quote at the end related to today's emotions and updates..
    `;
    
    // Call OpenAI API
    const response = await ai.chat.completions.create({
      model: API_CONFIG_FULL.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive journaling assistant. Create templates that are personal, reflective, and help users process their emotions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: API_CONFIG_FULL.aiLimits.temperature.journal,
      max_tokens: API_CONFIG_FULL.aiLimits.maxTokens.journal
    });
    
    return response.choices[0].message.content || getDefaultJournalTemplate();
  } catch (error) {
    console.error('Error generating journal template:', error);
    return getDefaultJournalTemplate();
  }
};

// Default journal template as fallback
const getDefaultJournalTemplate = (): string => {
  return `# Journal Entry

## How I'm feeling today
[Write about your emotions and overall mood]

## What happened today
[Describe any significant events or interactions]

## Reflections
[What did I learn today? What insights did I gain?]

## Tomorrow
[What am I looking forward to? What do I want to accomplish?]`;
};

// Polish journal entry to improve clarity and flow
export const polishJournalEntry = async (
  entryContent: string
): Promise<string> => {
  try {
    const ai = ensureOpenAI();
    
    // Call OpenAI API
    const response = await ai.chat.completions.create({
      model: API_CONFIG_FULL.defaultModel,
      messages: [
        {
          role: 'system',
          content: `
            You are a skilled writing assistant helping to polish journal entries.
            Maintain the writer's voice, key points, and personal insights.
            Improve clarity, flow, and readability.
            Fix any grammar or spelling issues.
            DO NOT add new content or change the meaning of what was written.
          `
        },
        {
          role: 'user',
          content: `Please polish this journal entry without changing its meaning or adding new content:\n\n${entryContent}`
        }
      ],
      temperature: API_CONFIG_FULL.aiLimits.temperature.polish,
      max_tokens: API_CONFIG_FULL.aiLimits.maxTokens.polish
    });
    
    return response.choices[0].message.content || entryContent;
  } catch (error) {
    console.error('Error polishing journal entry:', error);
    return entryContent;
  }
};

// Stream chat response for initiative discussions
export interface ChatContext {
  goal: {
    text: string;
    description: string;
  };
  initiative: {
    text: string;
    completed: boolean;
  };
  checkIns: {
    content: string;
    timestamp: string;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const streamChatResponse = async (
  context: ChatContext,
  history: ChatMessage[],
  message: string,
  onChunk: (chunk: string) => void
): Promise<{ fullResponse: string; checkIns: string[]; hasCheckIn: boolean }> => {
  try {
    const ai = ensureOpenAI();
    
    // Build system message with initiative context and instruction
    const systemMessage = `
    You are an AI assistant helping the user break down their initiative: "${context.initiative.text}" which is part of their goal: "${context.goal.text}".
    
    ${context.goal.description ? `The goal description is: "${context.goal.description}"` : ''}
    
    ${context.checkIns.length > 0 
      ? `Here are the check-ins (progress notes) for this initiative so far:
      ${context.checkIns.map(c => `- ${new Date(c.timestamp).toLocaleDateString()}: ${c.content}`).join('\n')}` 
      : 'There are no check-ins for this initiative yet.'}
    
    Your role is to help the user:
    1. Break down the initiative into smaller, actionable steps
    2. Identify potential obstacles and solutions
    3. Suggest concrete next actions
    4. Provide guidance on how to approach the initiative

    Stay sharp and concise. Stay very practical. If something is not clear to the user, ask for more details.
    
    IMPORTANT: Every message should contain at least one potential improvement for user to take - a potential check-in (progress note) that the user might want to record, wrap it in <check_in> tags. For example: "<check_in>Completed initial research on design patterns.</check_in>"
    
    Keep your responses concise, practical and focused on helping the user make progress towards completing their initiative.
    Important - your default response length is under 30 words. Don't make it larger if not asked about deep advice.

    Stay personal. Don't be too formal. Give your advice.
    `;
    
    // Prepare messages array for OpenAI
    const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = [
      { role: 'system', content: systemMessage }
    ];
    
    // Add history messages
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: message
    });
    
    // Call OpenAI streaming API
    const stream = await ai.chat.completions.create({
      model: API_CONFIG_FULL.chatModel,
      messages,
      stream: true,
      temperature: API_CONFIG_FULL.aiLimits.temperature.chat,
      max_tokens: API_CONFIG_FULL.aiLimits.maxTokens.chat,
    });
    
    // Process the stream
    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;
        onChunk(content);
      }
    }
    
    const checkIns = extractCheckIns(fullResponse);
    const cleanedResponse = fullResponse.replace('<check_in>', '').replace('</check_in>', '');
    return {
      fullResponse: cleanedResponse,
      checkIns: checkIns,
      hasCheckIn: checkIns.length > 0
    };
  } catch (error) {
    console.error('Error in streaming chat response:', error);
    throw error;
  }
};

// Extract check-in suggestions from a message
const extractCheckIns = (message: string): string[] => {
  const checkInRegex = /<check_in>(.*?)<\/check_in>/g;
  const checkIns: string[] = [];
  
  let match;
  while ((match = checkInRegex.exec(message)) !== null) {
    checkIns.push(match[1]);
  }
  
  return checkIns;
};

// Upload a file to OpenAI
export const uploadFileToOpenAI = async (
  filePath: string,
  purpose: 'assistants' | 'fine-tune' = 'assistants'
): Promise<{ id: string, filename: string } | null> => {
  try {
    const openai = ensureOpenAI();
    
    // Create a file stream
    const fileStream = fs.createReadStream(filePath);
    
    // Upload to OpenAI
    const result = await openai.files.create({
      file: fileStream,
      purpose
    });
    
    return {
      id: result.id,
      filename: result.filename
    };
  } catch (error) {
    console.error('Error uploading file to OpenAI:', error);
    return null;
  }
};

export const streamChatCompletion = async (prompt: string): Promise<ReadableStream<Uint8Array>> => {
  if (!openai) {
    throw new Error('OpenAI client is not initialized');
  }
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return stream;
};

export interface ExtractableItem {
  type: 'goal' | 'initiative';
  id: string;
  goalId?: string; // for initiatives
  text: string;
}

export const streamOnboardingChatResponse = async (
  history: ChatMessage[],
  onChunk: (chunk: { text: string; extractables: ExtractableItem[] }) => void
): Promise<{ fullResponse: string; extractables: ExtractableItem[] }> => {
  try {
    const ai = ensureOpenAI();

    // System prompt for onboarding
    const systemMessage = `
You are an AI onboarding assistant for the RedButton app. 
When you suggest a goal, wrap it as <goal:unique_id>Goal text</goal>.
When you suggest an initiative, wrap it as <initiative:unique_id on goal_id>Initiative text</initiative>.
Do not use the same ID twice. 
Do not include the text inside these tags in the visible message; it will be shown as a button instead.
`;

    // Prepare messages array
    const messages: { role: 'system' | 'user' | 'assistant', content: string }[] = [
      { role: 'system', content: systemMessage }
    ];
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Call OpenAI streaming API
    const stream = await ai.chat.completions.create({
      model: API_CONFIG_FULL.chatModel,
      messages,
      stream: true,
      temperature: API_CONFIG_FULL.aiLimits.temperature.chat,
      max_tokens: API_CONFIG_FULL.aiLimits.maxTokens.chat,
    });

    let fullResponse = '';
    let extractables: ExtractableItem[] = [];

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;

        // Extract goals/initiatives from the current accumulated response
        const extractableItems: ExtractableItem[] = [];
        let visibleText = fullResponse;

        // Extract <goal:...>...</goal>
        const goalRegex = /<goal:([^>]+)>([\s\S]*?)<\/goal>/g;
        let match;
        while ((match = goalRegex.exec(fullResponse)) !== null) {
          extractableItems.push({
            type: 'goal',
            id: match[1],
            text: match[2]
          });
        }
        visibleText = visibleText.replace(goalRegex, '');

        // Extract <initiative:... on ...>...</initiative>
        const initiativeRegex = /<initiative:([^ >]+) on ([^>]+)>([\s\S]*?)<\/initiative>/g;
        while ((match = initiativeRegex.exec(fullResponse)) !== null) {
          extractableItems.push({
            type: 'initiative',
            id: match[1],
            goalId: match[2],
            text: match[3]
          });
        }
        visibleText = visibleText.replace(initiativeRegex, '');

        extractables = extractableItems;

        onChunk({ text: visibleText, extractables });
      }
    }

    return { fullResponse, extractables };
  } catch (error) {
    console.error('Error in onboarding chat stream:', error);
    throw error;
  }
}; 