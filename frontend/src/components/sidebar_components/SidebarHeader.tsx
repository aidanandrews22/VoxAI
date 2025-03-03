import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarHeaderProps {
  mode: 'folders' | 'notebook';
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
  notebookName?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  mode,
  isCollapsed,
  isMobile,
  onToggleCollapse,
  notebookName = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 flex items-center justify-between transition-colors duration-200">
      {(!isCollapsed || isMobile) && (
        <div className="flex items-center">
          {mode === 'notebook' && (
            <button 
              onClick={() => navigate('/notebooks')}
              className="mr-2 p-1 rounded-md hover:bg-hover cursor-pointer transition-all duration-200"
              aria-label="Back to notebooks"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-600 dark:text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h2 className="font-medium text-adaptive">
            {mode === 'notebook' ? notebookName : 'Folders'}
          </h2>
        </div>
      )}
      <button 
        onClick={onToggleCollapse}
        className="p-1.5 rounded-md hover:bg-hover cursor-pointer transition-all duration-200 active:scale-95"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isMobile ? (
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
            className="h-5 w-5 text-adaptive"
          >
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M15 3v18"></path>
            <path d="m10 15-3-3 3-3"></path>
          </svg>
        ) : isCollapsed ? (
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
            className="h-5 w-5 text-adaptive"
          >
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
            <path d="M9 4v16"></path>
            <path d="M14 10l2 2l-2 2"></path>
          </svg>
        ) : (
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
            className="h-5 w-5 text-adaptive"
          >
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M15 3v18"></path>
            <path d="m10 15-3-3 3-3"></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default SidebarHeader; 