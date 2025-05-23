import { Goal, Initiative, AppData } from '../context/DataContext';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources';
import * as api from './api';

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

export interface FileContent {
  type: "file";
  file: {
    file_id: string;
  };
}

export type MessageContent = TextContent | ImageContent | FileContent;

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

// Helper function to create authorization headers
const createAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Stream chat response using the server API
export const streamChatResponse = async (
  context: ChatContext,
  history: ChatMessage[],
  message: string | MessageContent[],
  onChunk: (chunk: string) => void
): Promise<{ fullResponse: string; checkIns: string[]; hasCheckIn: boolean }> => {
  try {
    // Convert message to string if it's an array of MessageContent
    const messageContent = typeof message === 'string' 
      ? message 
      : message.map(m => {
          if (m.type === 'text') {
            return m.text;
          } else if (m.type === 'image_url') {
            return `[image: ${m.image_url.url}]`;
          } else if (m.type === 'file') {
            return `[file: ${m.file.file_id}]`;
          }
          return '';
        }).join(' ');
    
    // Convert history to string content if needed
    const stringHistory = history.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' 
        ? msg.content 
        : msg.content.map(m => {
            if (m.type === 'text') {
              return m.text;
            } else if (m.type === 'image_url') {
              return `[image: ${m.image_url.url}]`;
            } else if (m.type === 'file') {
              return `[file: ${m.file.file_id}]`;
            }
            return '';
          }).join(' ')
    }));
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';
    
    // Create the EventSource for server-sent events
    const response = await fetch(`${API_BASE_URL}/ai/initiative-chat`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        context,
        history: stringHistory,
        message: messageContent
      })
    });
    
    // Create a reader from the response body
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get reader from response');
    }
    
    // Process the stream
    let fullResponse = '';
    let checkIns: string[] = [];
    let hasCheckIn = false;
    
    // Function to process chunks of data
    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text
        const chunkText = new TextDecoder().decode(value);
        
        // Process each event in the chunk
        const events = chunkText.split('\n\n');
        for (const event of events) {
          if (!event.trim() || !event.startsWith('data: ')) continue;
          
          try {
            const jsonData = JSON.parse(event.substring(6));
            
            if (jsonData.error) {
              throw new Error(jsonData.error);
            }
            
            if (jsonData.text) {
              fullResponse += jsonData.text;
              onChunk(jsonData.text);
            }
            
            if (jsonData.done) {
              // Extract additional data from the completion message
              checkIns = jsonData.checkIns || [];
              hasCheckIn = jsonData.hasCheckIn || false;
              return;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    };
    
    await processStream();
    
    return {
      fullResponse,
      checkIns,
      hasCheckIn
    };
  } catch (error) {
    console.error('Error in chat stream:', error);
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
