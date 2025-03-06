import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatSession } from "../types/chat";
import { Tooltip } from "./Tooltip";

// Add animation styles
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;

// TODO: add more tools (first tool: generate educational video, second tool: make a coding environment, third tool: canvas to draw)

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
  messagesEndRef,
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
    textarea.style.height = "auto";

    // Set to scrollHeight (capped at max-h-[25vh] through CSS class)
    textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.25)}px`;
  };

  // Initialize textarea height when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  // Reset height and then auto-resize when inputMessage changes
  useEffect(() => {
    if (textareaRef.current && inputMessage === "") {
      // Reset to default height when empty
      textareaRef.current.style.height = "auto";
    } else {
      autoResizeTextarea();
    }
  }, [inputMessage]);

  return (
    <>
      {/* Add the animation styles */}
      <style>{animationStyles}</style>
      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-background">
        {!currentChatSession ? (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 pt-4">
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
                <div className="p-6 bg-card rounded-2xl shadow-sm max-w-md w-full text-center">
                  <h3 className="text-xl font-semibold text-adaptive mb-2">
                    Welcome to VoxAI Chat
                  </h3>
                  <p className="text-muted mb-6">
                    Start a new chat to interact with your files and get
                    intelligent responses
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
              <div className="max-w-3xl mx-auto px-4 pt-12 pb-32">
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
                            className="w-full py-4 animate-fadeIn"
                          >
                            <div className="flex items-start">
                              {/* Message content */}
                              <div
                                className={`flex-1 p-4 rounded-2xl ${
                                  message.is_user ? "bg-card" : ""
                                } transition-all duration-300 ease-out`}
                              >
                                <div className="flex items-center mb-1">
                                  <p className="text-sm font-medium text-adaptive">
                                    {message.is_user ? "You" : "VoxAI"}
                                  </p>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                                    •
                                  </span>
                                  <p className="text-xs text-muted">
                                    {new Date(
                                      message.created_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap text-adaptive">
                                    {message.content}
                                  </p>
                                </div>

                                {/* Copy button */}
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={() =>
                                      handleCopyMessage(
                                        message.content,
                                        message.id,
                                      )
                                    }
                                    className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors cursor-pointer"
                                    aria-label="Copy message"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                          />
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
                              {/* Message content */}
                              <div className="flex-1 p-4">
                                <div className="flex items-center mb-1">
                                  <p className="text-sm font-medium text-adaptive">
                                    VoxAI
                                  </p>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">
                                    •
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                    <div className="h-1.5 w-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                  </div>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap text-adaptive">
                                    {streamingContent}
                                  </p>
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
                  <div className="backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-adaptive ring-adaptive focus-within:ring-1 before:absolute before:inset-0 before:rounded-2xl before:shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:before:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
                    <div className="flex items-center">
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
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (inputMessage.trim() && !isStreaming) {
                              handleSendMessage(e);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center mx-auto px-4 py-4 justify-between">
                      <div className="space-x-2 flex items-center">
                        <button
                          aria-disabled="false"
                          aria-label="Upload files and more"
                          className="flex items-center justify-center h-9 rounded-full border border-adaptive text-token-text-secondary w-9 hover:bg-token-main-surface-secondary dark:hover:bg-gray-700"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label=""
                            className="h-[18px] w-[18px]"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 3C12.5523 3 13 3.44772 13 4L13 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13L13 13L13 20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20L11 13L4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11L11 11L11 4C11 3.44772 11.4477 3 12 3Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </button>
                        <button
                          className="flex h-9 min-w-8 items-center justify-center rounded-full border p-2 text-[13px] font-medium radix-state-open:bg-black/10 text-token-text-secondary border-adaptive focus-visible:outline-black can-hover:hover:bg-token-main-surface-secondary dark:focus-visible:outline-white dark:can-hover:hover:bg-gray-700"
                          aria-pressed="false"
                          aria-label="Search"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-[18px] w-[18px]"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9851 4.00291C11.9933 4.00046 11.9982 4.00006 11.9996 4C12.001 4.00006 12.0067 4.00046 12.0149 4.00291C12.0256 4.00615 12.047 4.01416 12.079 4.03356C12.2092 4.11248 12.4258 4.32444 12.675 4.77696C12.9161 5.21453 13.1479 5.8046 13.3486 6.53263C13.6852 7.75315 13.9156 9.29169 13.981 11H10.019C10.0844 9.29169 10.3148 7.75315 10.6514 6.53263C10.8521 5.8046 11.0839 5.21453 11.325 4.77696C11.5742 4.32444 11.7908 4.11248 11.921 4.03356C11.953 4.01416 11.9744 4.00615 11.9851 4.00291ZM8.01766 11C8.08396 9.13314 8.33431 7.41167 8.72334 6.00094C8.87366 5.45584 9.04762 4.94639 9.24523 4.48694C6.48462 5.49946 4.43722 7.9901 4.06189 11H8.01766ZM4.06189 13H8.01766C8.09487 15.1737 8.42177 17.1555 8.93 18.6802C9.02641 18.9694 9.13134 19.2483 9.24522 19.5131C6.48461 18.5005 4.43722 16.0099 4.06189 13ZM10.019 13H13.981C13.9045 14.9972 13.6027 16.7574 13.1726 18.0477C12.9206 18.8038 12.6425 19.3436 12.3823 19.6737C12.2545 19.8359 12.1506 19.9225 12.0814 19.9649C12.0485 19.9852 12.0264 19.9935 12.0153 19.9969C12.0049 20.0001 11.9999 20 11.9999 20C11.9999 20 11.9948 20 11.9847 19.9969C11.9736 19.9935 11.9515 19.9852 11.9186 19.9649C11.8494 19.9225 11.7455 19.8359 11.6177 19.6737C11.3575 19.3436 11.0794 18.8038 10.8274 18.0477C10.3973 16.7574 10.0955 14.9972 10.019 13ZM15.9823 13C15.9051 15.1737 15.5782 17.1555 15.07 18.6802C14.9736 18.9694 14.8687 19.2483 14.7548 19.5131C17.5154 18.5005 19.5628 16.0099 19.9381 13H15.9823ZM19.9381 11C19.5628 7.99009 17.5154 5.49946 14.7548 4.48694C14.9524 4.94639 15.1263 5.45584 15.2767 6.00094C15.6657 7.41167 15.916 9.13314 15.9823 11H19.9381Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                          <div className="whitespace-nowrap pl-1 pr-1 [display:--force-hide-label]">
                            Search
                          </div>
                        </button>
                        <button
                          type="button"
                          id="radix-:rr1:"
                          aria-haspopup="menu"
                          aria-expanded="false"
                          data-state="closed"
                          className="_toolsButton_d2h2h_8 flex h-9 min-w-9 items-center justify-center rounded-full border border-adaptive p-1 text-xs font-semibold text-token-text-secondary focus-visible:outline-black disabled:opacity-30 radix-state-open:bg-black/10 can-hover:hover:bg-token-main-surface-secondary dark:focus-visible:outline-white dark:can-hover:hover:bg-gray-700"
                          aria-label="Use a tool"
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="pointer-events-none h-5 w-5"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z"
                              fill="currentColor"
                            ></path>
                          </svg>
                        </button>
                        <div className="relative ml-1">
                          <Tooltip
                            content="Toggle unused files off"
                            title="For Best Results"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </Tooltip>
                        </div>
                      </div>
                      <div className="flex-shrink-0 items-center justify-end relative z-10 mr-3">
                        <button
                          type="submit"
                          disabled={!inputMessage.trim() || isStreaming}
                          className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-full disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm cursor-pointer"
                        >
                          {isStreaming ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white dark:border-black"></div>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatInterface;
