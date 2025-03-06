import React from "react";
import { ChatSessionItemProps } from "./SidebarTypes";

const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isMobile,
  isActive,
  setCurrentChatSession,
  handleEditChatTitle,
  confirmDeleteSession,
}) => {
  return (
    <li
      className={`${isMobile ? "p-3" : "p-2"} rounded ${
        isActive ? "bg-background" : "hover:bg-hover"
      } transition-all duration-200`}
    >
      <div className="flex justify-between items-center">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setCurrentChatSession?.(session)}
        >
          <p className="text-sm font-medium text-adaptive truncate">
            {session.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditChatTitle?.(session)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200 p-1 cursor-pointer"
            aria-label="Edit chat title"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => confirmDeleteSession?.(session.id)}
            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 cursor-pointer"
            aria-label="Delete chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
};

export default ChatSessionItem;
