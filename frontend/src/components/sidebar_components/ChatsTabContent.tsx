import React from "react";
import { ChatSession } from "../../services/supabase";
import ChatSessionItem from "./ChatSessionItem";

interface ChatsTabContentProps {
  chatSessions: ChatSession[];
  isMobile: boolean;
  currentChatSession: ChatSession | null;
  handleCreateSession?: () => void;
  handleEditChatTitle?: (session: ChatSession) => void;
  confirmDeleteSession?: (sessionId: string) => void;
  setCurrentChatSession?: (session: ChatSession) => void;
}

const ChatsTabContent: React.FC<ChatsTabContentProps> = ({
  chatSessions,
  isMobile,
  currentChatSession,
  handleCreateSession,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-none">
        <div
          onClick={handleCreateSession}
          className={`cursor-pointer flex items-center justify-center w-full ${
            isMobile ? "p-4" : "p-3"
          } rounded-lg bg-background border border-none hover:bg-hover transition-all duration-200 active:scale-[0.98]`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${isMobile ? "h-6 w-6" : "h-5 w-5"} text-gray-500 dark:text-gray-400 mr-2`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span
            className={`${isMobile ? "text-base" : "text-sm"} font-medium text-adaptive`}
          >
            New Chat
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {chatSessions.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">
            No chat sessions yet
          </p>
        ) : (
          <ul className="space-y-2">
            {chatSessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isMobile={isMobile}
                isActive={currentChatSession?.id === session.id}
                setCurrentChatSession={setCurrentChatSession}
                handleEditChatTitle={handleEditChatTitle}
                confirmDeleteSession={confirmDeleteSession}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatsTabContent;
