import React, { useState } from 'react';
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
  isEditingChatTitle: boolean;
  editedChatTitle: string;
  setEditedChatTitle: (title: string) => void;
  handleSaveChatTitle: () => void;
  handleEditChatTitle: (session: ChatSession) => void;
  handleCancelEditTitle?: () => void;
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
  isEditingChatTitle,
  editedChatTitle,
  setEditedChatTitle,
  handleSaveChatTitle,
  handleEditChatTitle,
  handleCancelEditTitle,
  messagesEndRef
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {!currentChatSession ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm max-w-md w-full text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to VoxAI Chat
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
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
          <div className="flex-1 overflow-y-auto pb-16">
            <div className="max-w-3xl mx-auto px-4 pt-4">
              <div className="flex flex-col h-full">
                {/* Chat title with edit functionality */}
                <div className="sticky top-0 z-10 py-3 mb-4 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
                  {isEditingChatTitle ? (
                    <form 
                      className="flex w-full" 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveChatTitle();
                      }}
                    >
                      <input
                        type="text"
                        value={editedChatTitle}
                        onChange={(e) => setEditedChatTitle(e.target.value)}
                        className="flex-1 p-2 bg-transparent border-b-2 border-black dark:border-white focus:outline-none text-gray-900 dark:text-white"
                        autoFocus
                        placeholder="Enter chat title..."
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            handleCancelEditTitle?.();
                          }
                        }}
                      />
                      <div className="flex ml-2">
                        <button
                          type="button"
                          onClick={handleCancelEditTitle}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          aria-label="Cancel editing"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="submit"
                          className="p-1 ml-1 text-black dark:text-white"
                          aria-label="Save title"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {currentChatSession.title}
                        </h2>
                      </div>
                      <div className="flex ml-2">
                        <button
                          onClick={() => handleEditChatTitle(currentChatSession)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          aria-label="Edit chat title"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 mb-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : messages.length === 0 && !isStreaming ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
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
                            {/* Avatar or indicator */}
                            <div className="mr-4 flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                message.is_user 
                                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {message.is_user ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            
                            {/* Message content */}
                            <div className={`flex-1 p-4 rounded-2xl ${
                              message.is_user 
                                ? 'bg-gray-50 dark:bg-gray-900' 
                                : ''
                            }`}>
                              <div className="flex items-center mb-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.is_user ? 'You' : 'VoxAI'}
                                </p>
                                <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message.content}</p>
                              </div>
                              
                              {/* Copy button */}
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => handleCopyMessage(message.content, message.id)}
                                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
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
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                </svg>
                              </div>
                            </div>
                            
                            {/* Message content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-center mb-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{streamingContent}</p>
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
          
          {/* Chat input bar - now within the same container structure */}
          <div className="left-0 right-0 z-20 px-4 pointer-events-none">
            <div className="fixed bottom-6 w-full max-w-3xl mx-auto">
              <form onSubmit={handleSendMessage} className="relative pointer-events-auto">
                <div className="flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white before:absolute before:inset-0 before:rounded-full before:shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:before:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-4 bg-transparent outline-none text-gray-900 dark:text-white relative z-10"
                    disabled={isStreaming}
                  />
                  <div className="relative z-10">
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isStreaming}
                      className="p-3 m-1.5 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
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