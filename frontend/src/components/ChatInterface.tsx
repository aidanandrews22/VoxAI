import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '../services/supabase';

interface ChatInterfaceProps {
  currentChatSession: ChatSession | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isStreaming: boolean;
  streamingContent: string;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleCreateSession: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentChatSession,
  messages,
  isLoadingMessages,
  isStreaming,
  streamingContent,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleCreateSession,
  messagesEndRef
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height first
    textarea.style.height = 'auto';
    
    // Set to scrollHeight (capped at max-h-[25vh] through CSS class)
    textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.25)}px`;
  };

  // Initialize textarea height when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, []);

  // Reset height and then auto-resize when inputMessage changes
  useEffect(() => {
    if (textareaRef.current && inputMessage === '') {
      // Reset to default height when empty
      textareaRef.current.style.height = 'auto';
    } else {
      autoResizeTextarea();
    }
  }, [inputMessage]);

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
      {!currentChatSession ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
              <div className="p-6 bg-hover rounded-2xl shadow-sm max-w-md w-full text-center">
                <h3 className="text-xl font-semibold text-adaptive mb-2">
                  Welcome to VoxAI Chat
                </h3>
                <p className="text-muted mb-6">
                  Start a new chat to interact with your files and get intelligent responses
                </p>
                <button
                  onClick={handleCreateSession}
                  className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm font-medium cursor-pointer"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main chat area with messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 pt-12 pb-12">
              <div className="flex flex-col h-full">
                <div className="flex-1 mb-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : messages.length === 0 && !isStreaming ? (
                    <div className="text-center py-12">
                      <p className="text-muted">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Display messages from Supabase */}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className="w-full py-4"
                        >
                          <div className="flex items-start">
                            {/* Message content */}
                            <div className={`flex-1 p-4 rounded-2xl ${
                              message.is_user 
                                ? 'bg-background' 
                                : ''
                            }`}>
                              <div className="flex items-center mb-1">
                                <p className="text-sm font-medium text-adaptive">
                                  {message.is_user ? 'You' : 'VoxAI'}
                                </p>
                                <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                                <p className="text-xs text-muted">
                                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-adaptive">{message.content}</p>
                              </div>
                              
                              {/* Copy button */}
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors cursor-pointer"
                                  aria-label="Copy message"
                                >
                                  {copiedMessageId === message.id ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                      </svg>
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Display streaming content if active */}
                      {isStreaming && streamingContent && (
                        <div className="w-full py-4">
                          <div className="flex items-start">
                            {/* Avatar or indicator */}
                            <div className="mr-4 flex-shrink-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-hover text-gray-700 dark:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Message content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-center mb-1">
                                <p className="text-sm font-medium text-adaptive">
                                  VoxAI
                                </p>
                                <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center space-x-1">
                                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
                                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                  <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                              </div>
                              <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-adaptive">{streamingContent}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat input bar - floating over content but contained in chat area */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-20">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative">
                <div className="flex items-center backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-adaptive focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white before:absolute before:inset-0 before:rounded-2xl before:shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:before:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-4 bg-transparent outline-none text-adaptive relative z-10 resize-none min-h-[56px] max-h-[25vh] overflow-y-auto"
                    disabled={isStreaming}
                    rows={1}
                    onInput={autoResizeTextarea}
                    onFocus={autoResizeTextarea}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (inputMessage.trim() && !isStreaming) {
                          handleSendMessage(e);
                        }
                      }
                    }}
                  />
                  <div className="flex-shrink-0 items-center justify-end relative z-10 mr-3">
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isStreaming}
                      className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
                    >
                      {isStreaming ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white dark:border-black"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;