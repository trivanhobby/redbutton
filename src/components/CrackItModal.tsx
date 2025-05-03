import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData, Goal, Initiative, CheckIn } from '../context/DataContext';
import { format } from 'date-fns';
import { streamChatResponse, processFile, ChatContext, ChatMessage, MessageContent, TextContent, ImageContent } from '../utils/chat';
import type { ChatCompletionMessageParam } from 'openai/resources';

// Message types for the chat
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hasCheckIn?: boolean;
  checkIns?: string[];
  timestamp: string;
  attachments?: Attachment[];
}

// Attachment interface
interface Attachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  url: string;
  size?: number;
  fileId?: string; // OpenAI file ID for non-image files
  base64Data?: string; // Base64-encoded data for images
}

// Props interface
interface CrackItModalProps {
  goal: Goal;
  initiative: Initiative;
  onClose: () => void;
}

const CrackItModal: React.FC<CrackItModalProps> = ({ goal, initiative, onClose }) => {
  const { data, addCheckIn } = useData();
  
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  
  // State for attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for scrolling to bottom of chat
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Storage key for chat history
  const storageKey = `crackitChat_${initiative.id}`;
  
  // Load chat history on mount
  useEffect(() => {
    const savedChat = localStorage.getItem(storageKey);
    if (savedChat) {
      try {
        const parsedChat = JSON.parse(savedChat);
        setMessages(parsedChat);
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    } else {
      // Initialize with a system message
      const initialMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `Welcome to the Crack It session for "${initiative.text}"! I'll help you break down this initiative and figure out concrete next steps. How would you like to approach this?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([initialMessage]);
      localStorage.setItem(storageKey, JSON.stringify([initialMessage]));
    }
  }, [initiative.id, storageKey]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamedResponse]);
  
  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  // Process non-image files for OpenAI using the backend API
  const processNonImageFile = async (file: File): Promise<string | null> => {
    try {
      console.log(`Uploading file ${file.name} to OpenAI via backend...`);
      
      // Create a FormData object for the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the base API URL
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
      
      // Create headers with auth token if available
      const headers: HeadersInit = {};
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/ai/upload-file`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.fileId) {
        throw new Error('Failed to upload file');
      }
      
      console.log(`File uploaded successfully with ID: ${data.fileId}`);
      return data.fileId;
    } catch (error) {
      console.error('Error uploading file to OpenAI:', error);
      return null;
    }
  };
  
  // Add a function to convert an image to base64
  const getBase64FromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Extract the base64 data part (remove the data:image/jpeg;base64, prefix)
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    
    // Process non-image attachments to upload to OpenAI
    const processedAttachments = [...attachments];
    
    // Upload non-image files to OpenAI through the backend
    for (let i = 0; i < processedAttachments.length; i++) {
      const attachment = processedAttachments[i];
      if (attachment.type !== 'image') {
        try {
          // Extract the File object from the URL
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          const file = new File([blob], attachment.name, { type: blob.type });
          
          // Upload to OpenAI through backend
          const fileId = await processNonImageFile(file);
          if (fileId) {
            processedAttachments[i] = {
              ...attachment,
              fileId
            };
          }
        } catch (error) {
          console.error(`Error processing non-image attachment ${attachment.name}:`, error);
        }
      }
    }
    
    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAttachments([]);
    
    // Set typing indicator
    setIsTyping(true);
    setStreamedResponse('');
    
    try {
      // Prepare context for AI
      const context: ChatContext = {
        goal: {
          text: goal.text,
          description: goal.description
        },
        initiative: {
          text: initiative.text,
          completed: initiative.completed
        },
        // Get check-ins for this initiative
        checkIns: data.checkIns
          .filter(checkIn => 
            checkIn.entityId === initiative.id && 
            checkIn.entityType === 'initiative'
          )
          .map(checkIn => ({
            content: checkIn.content,
            timestamp: checkIn.timestamp
          }))
      };
      
      // Prepare conversation history
      const conversationHistory: ChatMessage[] = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role as ('user' | 'assistant'),
          content: msg.content
        }));
      
      // Prepare message content, potentially including images
      let messageContent: MessageContent[] = [];
      
      // Add text content if present
      if (inputMessage.trim()) {
        messageContent.push({
          type: "text",
          text: inputMessage
        });
      }
      
      // Add base64-encoded images if present
      const imageAttachments = userMessage.attachments?.filter(att => 
        att.type === 'image' && att.base64Data
      );
      
      if (imageAttachments && imageAttachments.length > 0) {
        for (const img of imageAttachments) {
          if (img.base64Data) {
            // Determine image MIME type
            const mimeType = img.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            
            messageContent.push({
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${img.base64Data}`
              }
            });
          }
        }
      }
      
      // Add note about file attachments if present
      const fileAttachments = userMessage.attachments?.filter(att => att.type !== 'image' && att.fileId);
      if (fileAttachments && fileAttachments.length > 0) {
        for (const file of fileAttachments) {
          if (file.fileId) {
            messageContent.push({
              type: "file",
              file: { file_id: file.fileId }
            });
          }
        }
      }
      
      // Use the streamChatResponse function that now supports images
      const { fullResponse, checkIns, hasCheckIn } = await streamChatResponse(
        context,
        conversationHistory,
        messageContent,
        (chunk) => {
          setStreamedResponse(prev => (prev + chunk).replace('<check_in>', '').replace('</check_in>', ''));
        }
      );
      
      // After response is complete, add the message to the chat
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullResponse,
          checkIns: checkIns,
          hasCheckIn: hasCheckIn,
          timestamp: new Date().toISOString(),
        }
      ]);
      
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsTyping(false);
      setStreamedResponse('');
    }
  };
  
  // Update handleFileSelect function to properly handle async operations
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Process files sequentially to avoid state update issues
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Process file using the utility function
      const processedFile = processFile(file);
      
      // If it's an image, get base64 data
      if (file.type.startsWith('image/')) {
        try {
          const base64Data = await getBase64FromUrl(processedFile.url);
          setAttachments(prev => [...prev, {
            ...processedFile,
            base64Data,
            type: 'image'
          } as Attachment]);
        } catch (error) {
          console.error('Error encoding image as base64:', error);
          setAttachments(prev => [...prev, processedFile as Attachment]);
        }
      } else {
        setAttachments(prev => [...prev, processedFile as Attachment]);
      }
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle adding a check-in from a message
  const handleAddCheckIn = (content: string) => {
    addCheckIn(content, initiative.id, 'initiative');
    
    // Show confirmation
    alert('Check-in added successfully!');
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50">
      <motion.div 
        className="bg-gray-950 border border-gray-800 rounded-xl shadow-2xl w-full max-w-7xl h-[80vh] mx-4 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>Crack It: {initiative.text}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        
        {/* Main content - split layout */}
        <div className="flex h-[calc(80vh-70px)]">
          {/* Left side - Chat */}
          <div className="flex-1 flex flex-col border-r border-gray-800">
            {/* Chat messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    {/* Message content */}
                    <div className="whitespace-pre-wrap mb-1">{message.content}</div>
                    
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map(attachment => (
                          <div 
                            key={attachment.id}
                            className="flex items-center p-2 rounded bg-gray-700/50"
                          >
                            {attachment.type === 'image' ? (
                              <div className="w-full">
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="max-h-40 rounded object-contain mb-1 mx-auto"
                                />
                                <div className="text-xs text-gray-300 truncate">{attachment.name}</div>
                              </div>
                            ) : (
                              <>
                                <span className="text-lg mr-2">📄</span>
                                <div className="flex-1 truncate">
                                  <div className="text-sm">{attachment.name}</div>
                                  {attachment.size && (
                                    <div className="text-xs text-gray-400">{formatFileSize(attachment.size)}</div>
                                  )}
                                </div>
                                <a 
                                  href={attachment.url} 
                                  download={attachment.name}
                                  className="text-primary hover:text-blue-400 ml-2"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  📥
                                </a>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-right text-xs mt-1 opacity-75">
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </div>
                    
                    {/* Check-in button (if available) */}
                    {message.role === 'assistant' && message.hasCheckIn && (
                      <button
                        onClick={() => handleAddCheckIn(message.content)}
                        className="mt-2 text-xs bg-blue-600/30 text-blue-300 px-3 py-1 rounded hover:bg-blue-600/50 flex items-center"
                      >
                        <span className="mr-1">📌</span> Add as check-in
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Streaming message indicator */}
              {isTyping && streamedResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-800 text-gray-200">
                    <div className="whitespace-pre-wrap">{streamedResponse}</div>
                    <div className="mt-1 flex items-center">
                      <div className="loader">
                        <span className="dot dot1"></span>
                        <span className="dot dot2"></span>
                        <span className="dot dot3"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Attachments preview */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div 
                  className="px-4 py-2 bg-gray-900 border-t border-gray-800"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex flex-wrap gap-2">
                    {attachments.map(attachment => (
                      <div 
                        key={attachment.id}
                        className="relative group"
                      >
                        {attachment.type === 'image' ? (
                          <div className="w-16 h-16 rounded border border-gray-700 overflow-hidden bg-gray-800">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded border border-gray-700 flex items-center justify-center bg-gray-800">
                            <span className="text-2xl">📄</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Input area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-gray-200 p-2 rounded-md hover:bg-gray-800 flex items-center"
                  title="Attach files or images"
                >
                  <span className="mr-1">📎</span>
                  <span className="text-sm">Attach</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    className="w-full p-3 border border-gray-700 rounded-md bg-gray-800 text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    style={{
                      maxHeight: '150px',
                      height: 'auto'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && attachments.length === 0) || isTyping}
                  className={`p-3 rounded-md ${
                    (!inputMessage.trim() && attachments.length === 0) || isTyping
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-opacity-90'
                  }`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
          
          {/* Right side - Initiative details */}
          <div className="w-1/3 overflow-y-auto bg-gray-900/50">
            {/* Context header */}
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">Initiative Context</h3>
              <div className="mb-4 p-3 bg-gray-800 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Goal:</div>
                <div className="text-gray-200 font-medium">{goal.text}</div>
                {goal.description && (
                  <div className="mt-2 text-sm text-gray-300 italic">{goal.description}</div>
                )}
              </div>
              
              <div className="p-3 bg-gray-800 rounded-md">
                <div className="text-sm text-gray-400 mb-1">Initiative:</div>
                <div className="text-gray-200 font-medium">{initiative.text}</div>
                <div className="mt-2 flex">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    initiative.completed
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {initiative.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Check-ins section */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium text-white">Check-ins</h3>
                <button
                  onClick={() => {
                    const content = prompt('Add a new check-in:');
                    if (content?.trim()) {
                      addCheckIn(content, initiative.id, 'initiative');
                    }
                  }}
                  className="text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center"
                >
                  <span className="mr-1">+</span> Add check-in
                </button>
              </div>
              
              {/* Check-ins list */}
              <div className="space-y-3 border-l-2 border-gray-700 pl-4 py-2">
                {data.checkIns
                  .filter(checkIn => checkIn.entityId === initiative.id && checkIn.entityType === 'initiative')
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((checkIn) => (
                    <div 
                      key={checkIn.id}
                      className="relative"
                    >
                      <div className="absolute w-3 h-3 rounded-full bg-primary -left-[22px] top-1.5"></div>
                      <div className="p-3 rounded-md bg-blue-900/30 border border-blue-700/50">
                        <div className="flex justify-between mb-1">
                          <div className="text-sm text-gray-400">
                            {format(new Date(checkIn.timestamp), 'MMM d, h:mm a')}
                          </div>
                        </div>
                        <p className="text-gray-200 whitespace-pre-wrap text-sm">{checkIn.content}</p>
                      </div>
                    </div>
                  ))}
                
                {data.checkIns.filter(checkIn => 
                  checkIn.entityId === initiative.id && checkIn.entityType === 'initiative'
                ).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No check-ins yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Styles for typing indicator */}
      <style>
        {`
          .loader {
            display: flex;
            align-items: center;
          }
          .dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            margin-right: 3px;
            background: #9ca3af;
            animation: wave 1.3s linear infinite;
          }
          .dot2 {
            animation-delay: -1.1s;
          }
          .dot3 {
            animation-delay: -0.9s;
          }
          @keyframes wave {
            0%, 60%, 100% {
              transform: initial;
            }
            30% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CrackItModal; 