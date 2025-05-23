import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { addGoal, addInitiative } from '../../utils/api';

interface ExtractableItem {
  type: 'goal' | 'initiative';
  id: string;
  goalId?: string;
  text: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string; // visible text
  extractables?: ExtractableItem[];
  timestamp: string;
}

interface OnboardingGoalChatProps {
  selectedGoalId?: string;
}

const OnboardingGoalChat: React.FC<OnboardingGoalChatProps> = ({ selectedGoalId }) => {
  const {
    data,
    addGoal: addGoalToContext,
    addInitiative: addInitiativeToContext,
    updateGoal,
    updateInitiative,
  } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [streamedExtractables, setStreamedExtractables] = useState<ExtractableItem[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState('');
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);
  const [editingInitiativeText, setEditingInitiativeText] = useState('');
  const [encouragedGoalId, setEncouragedGoalId] = useState<string | null>(null);
  const [sessionGoalIds, setSessionGoalIds] = useState<string[]>([]); // Track session-created goals
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Synthetic first message for goal context
  useEffect(() => {
    let initialMessages: Message[] = [];
    if (selectedGoalId) {
      const goal = data.goals.find(g => g.id === selectedGoalId);
      if (goal) {
        initialMessages.push({
          id: `msg_goal_intro_${selectedGoalId}`,
          role: 'assistant',
          text: `So, you want to talk about goal "${goal.text} (id: ${goal.id})". I will help you to figure out the best initiatives how to reach it!`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      initialMessages.push({
        id: `msg_${Date.now()}`,
        role: 'assistant',
        text: "Welcome! Let's create your first goals and initiatives. What would you like to achieve?",
        timestamp: new Date().toISOString(),
      });
    }
    setMessages(initialMessages);
  }, [selectedGoalId, data.goals]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  // Helper to build message history for API
  const getHistory = () =>
    messages.map((msg) => ({ role: msg.role, content: msg.text }));

  // Find initiatives for a goal
  const getInitiativesForGoal = (goalId: string) =>
    data.initiatives.filter((i) => i.goalId === goalId);

  // Add encouragement message after a goal is added
  const encourageInitiatives = (goalText: string, goalId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_encourage_${Date.now()}`,
        role: 'assistant',
        text: `Great! Now, let's figure out 2–3 concrete steps (initiatives) to help you reach your goal: "${goalText}". What are some first actions you could take?`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setEncouragedGoalId(goalId);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setStreamedText('');
    setStreamedExtractables([]);

    try {
      // Streaming API call
      const API_BASE_URL = process.env.REACT_APP_API_URL!;
      const response = await fetch(`${API_BASE_URL}/ai/onboarding-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {}),
        },
        body: JSON.stringify({ history: [...getHistory(), { role: 'user', content: inputMessage }] }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      let fullText = '';
      let lastExtractables: ExtractableItem[] = [];
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
        // Process SSE chunks (split by double newlines)
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (chunk.startsWith('data: ')) {
            const dataStr = chunk.slice(6);
            if (dataStr.trim() === '') continue;
            const data = JSON.parse(dataStr);
            if (data.done) continue;
            if (data.error) throw new Error(data.error);
            fullText = data.text;
            lastExtractables = data.extractables || [];
            setStreamedText(fullText);
            setStreamedExtractables(lastExtractables);
          }
        }
      }
      // After streaming, add the assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          text: fullText,
          extractables: lastExtractables,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setStreamedText('');
      setStreamedExtractables([]);
    }
  };

  // Add goal and encourage initiatives
  const handleAddGoal = async (text: string) => {
    try {
      await addGoal(text);
      addGoalToContext(text);
      // Find the new goal (by text, most recent, and not fixed)
      const newGoal = data.goals.concat().reverse().find((g) => g.text === text && !g.isFixed);
      if (newGoal) {
        setSessionGoalIds((prev) => [...prev, newGoal.id]);
        encourageInitiatives(newGoal.text, newGoal.id);
      }
      // Add as user message to chat for LLM context
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_user_goal_${Date.now()}`,
          role: 'user',
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
      alert('Goal added successfully!');
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Failed to add goal. Please try again.');
    }
  };

  const handleAddInitiative = async (text: string, goalId: string) => {
    try {
      const actualGoalId = selectedGoalId || goalId;
      await addInitiative(text, actualGoalId);
      addInitiativeToContext(text, actualGoalId);
      // Add as user message to chat for LLM context
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_user_initiative_${Date.now()}`,
          role: 'user',
          text,
          timestamp: new Date().toISOString(),
        },
      ]);
      alert('Initiative added successfully!');
    } catch (error) {
      console.error('Error adding initiative:', error);
      alert('Failed to add initiative. Please try again.');
    }
  };

  // Inline editing for goals
  const startEditGoal = (goalId: string, currentText: string) => {
    setEditingGoalId(goalId);
    setEditingGoalText(currentText);
  };
  const saveEditGoal = (goalId: string) => {
    if (editingGoalText.trim()) {
      updateGoal(goalId, { text: editingGoalText });
    }
    setEditingGoalId(null);
    setEditingGoalText('');
  };

  // Inline editing for initiatives
  const startEditInitiative = (initiativeId: string, currentText: string) => {
    setEditingInitiativeId(initiativeId);
    setEditingInitiativeText(currentText);
  };
  const saveEditInitiative = (initiativeId: string) => {
    if (editingInitiativeText.trim()) {
      updateInitiative(initiativeId, editingInitiativeText);
    }
    setEditingInitiativeId(null);
    setEditingInitiativeText('');
  };

  // Render a message, showing extractables as buttons (not as plain text)
  const renderAssistantMessage = (text: string, extractables?: ExtractableItem[]) => {
    if (!extractables || extractables.length === 0) return <span>{text}</span>;
    return (
      <>
        {text && <span>{text}</span>}
        {extractables.map((item, idx) => (
          <span key={item.id + idx} className="ml-2">
            <button
              onClick={() =>
                item.type === 'goal'
                  ? handleAddGoal(item.text)
                  : handleAddInitiative(item.text, item.goalId || '')
              }
              className="ml-2 text-xs bg-blue-600/30 text-blue-300 px-3 py-1 rounded hover:bg-blue-600/50"
            >
              {item.type === 'goal' ? 'Add as a goal' : 'Add as an initiative'}
            </button>
            <span className="ml-1 italic text-gray-400">{item.text}</span>
          </span>
        ))}
      </>
    );
  };

  // Sidebar: preview of agreed goals and initiatives
  const renderSidebar = () => {
    // Collect all goal IDs to show: session-created + selectedGoalId (if not already included)
    const sidebarGoalIds = Array.from(new Set([
      ...sessionGoalIds,
      ...(selectedGoalId ? [selectedGoalId] : []),
    ]));
    // Filter out fixed goals unless selected, but always include selectedGoalId if present
    const sidebarGoals = data.goals.filter(
      (g) =>
        sidebarGoalIds.includes(g.id) &&
        (!g.isFixed || g.id === selectedGoalId)
    );
    return (
      <div className="w-80 min-w-[18rem] max-w-xs bg-gray-900 border-l border-gray-800 p-4 flex flex-col h-full sticky top-0">
        <h3 className="text-lg font-semibold mb-4 text-primary">Your Goals & Steps</h3>
        {sidebarGoals.length === 0 ? (
          <div className="text-gray-400 italic">No goals yet. Add a goal to get started!</div>
        ) : (
          <div className="space-y-4">
            {sidebarGoals.map((goal) => (
              <div key={goal.id} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  {editingGoalId === goal.id ? (
                    <>
                      <input
                        className="flex-1 p-1 rounded bg-gray-700 text-white border border-primary focus:outline-none mr-2"
                        value={editingGoalText}
                        onChange={(e) => setEditingGoalText(e.target.value)}
                        onBlur={() => saveEditGoal(goal.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditGoal(goal.id);
                          if (e.key === 'Escape') setEditingGoalId(null);
                        }}
                        autoFocus
                      />
                      <button
                        className="text-xs text-primary ml-1"
                        onClick={() => saveEditGoal(goal.id)}
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-white">{goal.text}</span>
                      <button
                        className="ml-2 text-xs text-gray-400 hover:text-primary"
                        onClick={() => startEditGoal(goal.id, goal.text)}
                        title="Edit goal"
                      >
                        ✎
                      </button>
                    </>
                  )}
                </div>
                {/* Initiatives for this goal */}
                <div className="ml-2 mt-1">
                  {getInitiativesForGoal(goal.id).length === 0 && encouragedGoalId === goal.id && (
                    <div className="text-xs text-blue-300 mb-1">Try adding 2–3 steps to reach this goal!</div>
                  )}
                  {getInitiativesForGoal(goal.id).map((initiative) => (
                    <div key={initiative.id} className="flex items-center mb-1">
                      {editingInitiativeId === initiative.id ? (
                        <>
                          <input
                            className="flex-1 p-1 rounded bg-gray-700 text-white border border-primary focus:outline-none mr-2"
                            value={editingInitiativeText}
                            onChange={(e) => setEditingInitiativeText(e.target.value)}
                            onBlur={() => saveEditInitiative(initiative.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditInitiative(initiative.id);
                              if (e.key === 'Escape') setEditingInitiativeId(null);
                            }}
                            autoFocus
                          />
                          <button
                            className="text-xs text-primary ml-1"
                            onClick={() => saveEditInitiative(initiative.id)}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-200 text-sm">{initiative.text}</span>
                          <button
                            className="ml-2 text-xs text-gray-400 hover:text-primary"
                            onClick={() => startEditInitiative(initiative.id, initiative.text)}
                            title="Edit initiative"
                          >
                            ✎
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 h-full min-h-0">
        <div
          ref={chatContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
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
                {message.role === 'assistant'
                  ? renderAssistantMessage(message.text, message.extractables)
                  : <span>{message.text}</span>}
                <div className="text-right text-xs mt-1 opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (streamedText || streamedExtractables.length > 0) && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-800 text-gray-200">
                {renderAssistantMessage(streamedText, streamedExtractables)}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-end gap-2">
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
              disabled={!inputMessage.trim() || isTyping}
              className={`p-3 rounded-md ${
                !inputMessage.trim() || isTyping
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-opacity-90'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
      {/* Sidebar */}
      {renderSidebar()}
    </div>
  );
};

export default OnboardingGoalChat; 