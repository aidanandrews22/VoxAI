import React, { useRef } from 'react';
import type { Folder } from '../../services/supabase';

interface CollapsedSidebarProps {
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isHoveringCollapsed: boolean;
  setIsHoveringCollapsed: (value: boolean) => void;
  mode: 'folders' | 'notebook';
  setActiveTab?: (tab: 'files' | 'chats') => void;
  handleCreateSession?: () => void;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectFolder: (folderId: string | null) => void;
  allFoldersList: Folder[];
}

const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  isMobile,
  isCollapsed,
  onToggleCollapse,
  isHoveringCollapsed,
  setIsHoveringCollapsed,
  mode,
  setActiveTab,
  handleCreateSession,
  handleFileUpload,
  handleSelectFolder,
  allFoldersList
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCollapsed) {
    return null;
  }
  
  // Mobile collapsed button
  if (isMobile) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-full bg-card shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-95"
        aria-label="Open sidebar"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="h-5 w-5 text-adaptive transition-transform duration-200"
        >
          <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
          <path d="M9 4v16"></path>
          <path d="M14 10l2 2l-2 2"></path>
        </svg>
      </button>
    );
  }
  
  // Desktop floating collapse button and menu
  return (
    <div 
      className="fixed top-4 left-4 z-50 flex flex-col transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsHoveringCollapsed(true)}
      onMouseLeave={() => setIsHoveringCollapsed(false)}
    >
      {/* Main toggle button - always visible */}
      <button
        onClick={onToggleCollapse}
        className={`p-2.5 rounded-full bg-card shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-95 ${isHoveringCollapsed ? 'ring-2 ring-black dark:ring-white ring-opacity-20 dark:ring-opacity-20' : ''}`}
        aria-label="Open sidebar"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`h-5 w-5 text-adaptive transition-all duration-200 ${isHoveringCollapsed ? 'scale-110' : ''}`}
        >
          <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
          <path d="M9 4v16"></path>
          <path d="M14 10l2 2l-2 2"></path>
        </svg>
      </button>
      
      {/* Dropdown menu for notebook mode */}
      {mode === 'notebook' && isHoveringCollapsed && (
        <div className="mt-2 flex flex-col items-center space-y-2 animate-slideDown">
          {/* Files tab icon - Opens sidebar when clicked */}
          <button 
            onClick={() => {
              setActiveTab?.('files');
              onToggleCollapse(); // Expand the sidebar
            }}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="Files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-adaptive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          {/* Chats tab icon - Opens sidebar when clicked */}
          <button 
            onClick={() => {
              setActiveTab?.('chats');
              onToggleCollapse(); // Expand the sidebar
            }}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="Chats"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-adaptive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          
          {/* New chat button - Keep functionality as is */}
          <div 
            onClick={handleCreateSession}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-adaptive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          
          {/* Upload file button - Keep functionality as is */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="Upload File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-adaptive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Dropdown menu for folders mode */}
      {mode === 'folders' && isHoveringCollapsed && (
        <div className="mt-2 flex flex-col items-center space-y-2 animate-slideDown">
          {/* All Notebooks icon */}
          <button 
            onClick={() => handleSelectFolder(null)}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="All Notebooks"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-adaptive" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
          </button>
          
          {/* Unorganized notebooks icon */}
          <button 
            onClick={() => handleSelectFolder('unorganized')}
            className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
            aria-label="Unorganized Notebooks"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-adaptive" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" 
              />
            </svg>
          </button>
          
          {/* Show top 3 most recent folders */}
          {allFoldersList.slice(0, 3).map(folder => (
            <button 
              key={folder.id}
              onClick={() => handleSelectFolder(folder.id)}
              className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
              aria-label={folder.title}
              title={folder.title}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-adaptive" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                />
              </svg>
            </button>
          ))}
          
          {/* Expand icon - This expands the sidebar to see all folders */}
          {allFoldersList.length > 3 && (
            <button 
              onClick={onToggleCollapse}
              className="p-2.5 rounded-full bg-card shadow-md cursor-pointer transition-all duration-300 hover:bg-hover hover:shadow-lg active:scale-95"
              aria-label="Show more folders"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-adaptive" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" 
                />
              </svg>
            </button>
          )}
        </div>
      )}
      
      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload-floating"
      />
    </div>
  );
};

export default CollapsedSidebar; 