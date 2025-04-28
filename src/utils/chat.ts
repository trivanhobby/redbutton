import { Goal, Initiative, AppData } from '../context/DataContext';
import { initializeOpenAIFromStorage, getOpenAI } from './ai';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources';

// Initialize OpenAI
let openai: OpenAI | null = null;

// Define types for message content
export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type MessageContent = TextContent | ImageContent;

// Ensure OpenAI is initialized
const ensureOpenAI = async (): Promise<OpenAI> => {
  // Try to get the existing OpenAI instance
  let openai = getOpenAI();

  if (!openai) {
    // Try to initialize OpenAI from storage
    const success = initializeOpenAIFromStorage();
    if (!success) {
      throw new Error(
        'OpenAI API key not found. Please add your API key in Settings.'
      );
    }
    
    // Get the initialized instance
    openai = getOpenAI();
    if (!openai) {
      throw new Error(
        'Failed to initialize OpenAI client. Please check your API key.'
      );
    }
  }

  return openai;
};

// Context interface for streaming chat
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

// Message interface for chat history
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

/**
 * Stream a chat response from OpenAI with the given context
 * @param context The context for the chat (goal, initiative, check-ins)
 * @param history The conversation history
 * @param message The current user message (string or content array with images)
 * @param onChunk Callback for each chunk of streamed response
 * @returns The full response
 */
export const streamChatResponse = async (
  context: ChatContext,
  history: ChatMessage[],
  message: string | MessageContent[],
  onChunk: (chunk: string) => void
): Promise<{ fullResponse: string; hasCheckIn: boolean }> => {
  try {
    // Ensure OpenAI is initialized
    const openai = await ensureOpenAI();
    
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
    
    IMPORTANT: When suggesting a potential check-in (progress note) that the user might want to record, wrap it in <check_in> tags. For example: "<check_in>Completed initial research on design patterns.</check_in>"
    
    Keep your responses concise, practical and focused on helping the user make progress towards completing their initiative.
    Important - your default response length is under 30 words. Don't make it larger if not asked about deep advice.

    Stay personal. Don't be too formal. Give your advice.
    `;
    
    // Convert string message to content format if needed
    const messageContent = typeof message === 'string' 
      ? [{ type: 'text', text: message }] as MessageContent[]
      : message;
    
    // Add current message to history
    const fullHistory = [
      ...history,
      { 
        role: 'user', 
        content: typeof message === 'string' ? message : 'Message with attachments' 
      }
    ];
    
    // Prepare messages array for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage } as ChatCompletionSystemMessageParam
    ];
    
    // Add history messages with correct typing
    for (const msg of history) {
      // Convert content to appropriate format
      const msgContent = typeof msg.content === 'string' ? msg.content : msg.content;
      
      // Type the message correctly based on role
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msgContent
        } as ChatCompletionUserMessageParam);
      } else if (msg.role === 'assistant') {
        // Assistant messages must have string content
        messages.push({
          role: 'assistant',
          content: typeof msgContent === 'string' ? msgContent : 'Response with attachments'
        } as ChatCompletionAssistantMessageParam);
      }
    }
    
    // Add current message with correct type
    messages.push({
      role: 'user',
      content: messageContent
    } as ChatCompletionUserMessageParam);
    
    // Check if we should use streaming (only for text-only messages)
    const shouldStream = typeof message === 'string';
    
    if (shouldStream) {
      // Call OpenAI streaming API
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
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
      
      // Check if there are check-in suggestions
      const checkInRegex = /<check_in>(.*?)<\/check_in>/g;
      const hasCheckIn = checkInRegex.test(fullResponse);
      
      // Reset regex state (as it's stateful)
      checkInRegex.lastIndex = 0;
      
      // Clean response by removing the actual check-in tags in the response
      // but remember that we have them
      const cleanedResponse = fullResponse.replace(checkInRegex, '$1');
      
      return {
        fullResponse: cleanedResponse,
        hasCheckIn
      };
    } else {
      // For messages with image attachments, use non-streaming API
      onChunk('Processing message with attachments...');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      const responseContent = response.choices[0]?.message?.content || '';
      
      // Check for check-in suggestions
      const checkInRegex = /<check_in>(.*?)<\/check_in>/g;
      const hasCheckIn = checkInRegex.test(responseContent);
      
      // Reset regex state
      checkInRegex.lastIndex = 0;
      
      // Clean response
      const cleanedResponse = responseContent.replace(checkInRegex, '$1');
      
      return {
        fullResponse: cleanedResponse,
        hasCheckIn
      };
    }
  } catch (error) {
    console.error('Error in streaming chat response:', error);
    throw error;
  }
};

/**
 * Extract check-in suggestions from a message
 * @param message The message to extract check-ins from
 * @returns An array of check-in suggestions
 */
export const extractCheckIns = (message: string): string[] => {
  const checkInRegex = /<check_in>(.*?)<\/check_in>/g;
  const checkIns: string[] = [];
  
  let match;
  while ((match = checkInRegex.exec(message)) !== null) {
    checkIns.push(match[1]);
  }
  
  return checkIns;
};

/**
 * Process an uploaded file for chat
 * @param file The file to process
 * @returns An object with the file URL, name, and metadata
 */
export const processFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const isImage = file.type.startsWith('image/');
  
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: isImage ? 'image' : 'document',
    name: file.name,
    url,
    size: file.size
  };
};
