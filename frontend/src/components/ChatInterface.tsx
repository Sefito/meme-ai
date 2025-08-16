import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatInterfaceProps {
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onGenerateReady?: (sessionId: string) => void;
  disabled?: boolean;
}

export default function ChatInterface({ 
  sessionId, 
  onSessionChange, 
  onGenerateReady, 
  disabled = false 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when session ID changes
  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory(currentSessionId);
    }
  }, [currentSessionId]);

  const loadChatHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (response.ok) {
        const history = await response.json();
        setMessages(history.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading || disabled) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          session_id: currentSessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const assistantResponse = await response.json();
      
      // Update session ID if this is a new session
      if (!currentSessionId && assistantResponse.session_id) {
        setCurrentSessionId(assistantResponse.session_id);
        onSessionChange?.(assistantResponse.session_id);
      }

      // Add assistant response to messages
      const assistantMsg: ChatMessage = {
        id: assistantResponse.id,
        content: assistantResponse.content,
        role: assistantResponse.role,
        timestamp: assistantResponse.timestamp
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
      
      // Remove the user message from UI on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGenerateClick = () => {
    if (currentSessionId && messages.length > 0) {
      onGenerateReady?.(currentSessionId);
    } else {
      toast.error('Primero mantén una conversación para generar un meme');
    }
  };

  return (
    <div className="flex flex-col h-96 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-medium text-sm">Chat sobre tu meme</h3>
        {messages.length > 0 && (
          <button
            onClick={handleGenerateClick}
            disabled={disabled}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white text-sm rounded-md transition-colors"
          >
            Generar
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-8">
            ¡Cuéntame qué tipo de meme quieres crear!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 opacity-70 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-neutral-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-700 p-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Pensando...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex space-x-2">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={disabled || isLoading}
            className="flex-1 p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            style={{ minHeight: '38px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading || disabled}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-400 text-white rounded-md transition-colors flex items-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}