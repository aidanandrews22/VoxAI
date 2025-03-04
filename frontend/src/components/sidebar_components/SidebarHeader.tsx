import React from "react";
import { useNavigate } from "react-router-dom";

interface SidebarHeaderProps {
  mode: "folders" | "notebook";
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse: () => void;
  notebookName?: string;
  toggleNotesPanel?: () => void;
  isNotesPanelExpanded?: boolean;
  toggleSandbox?: () => void;
  isSandboxExpanded?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  mode,
  isCollapsed,
  isMobile,
  onToggleCollapse,
  notebookName = "",
  toggleNotesPanel,
  isNotesPanelExpanded,
  toggleSandbox,
  isSandboxExpanded,
}) => {
  const navigate = useNavigate();

  // Determine whether to show the notes toggle button
  const showNotesToggle = mode === "notebook" && toggleNotesPanel;
  
  // Determine whether to show the sandbox toggle button
  const showSandboxToggle = mode === "notebook" && toggleSandbox;

  return (
    <div className="p-4 flex items-center justify-between transition-colors duration-200">
      {(!isCollapsed || isMobile) && (
        <div className="flex items-center">
          {mode === "notebook" && (
            <button
              onClick={() => navigate("/notebooks")}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
          <h2 className="font-medium text-adaptive">
            {mode === "notebook" ? notebookName : "Folders"}
          </h2>
        </div>
      )}
      
      <div className="flex items-center">
        {/* Notes Toggle Button - Only show in notebook mode */}
        {showNotesToggle && (
          <button
            onClick={toggleNotesPanel}
            className="p-1.5 mr-1 rounded-md hover:bg-hover cursor-pointer transition-all duration-200 active:scale-95"
            aria-label={isNotesPanelExpanded ? "Hide notes panel" : "Show notes panel"}
            title={isNotesPanelExpanded ? "Hide notes" : "Show notes"}
          >
          <svg 
            viewBox="0 0 384 384" 
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            className="w-full h-full text-foreground"
          >
            <path 
              d="M384,0v384H0V0h384ZM329.74,24.26c-5.37-5.37-14.94-10.13-22.59-10.79H64.1c-17.77,2.21-31.98,16.99-33.37,34.88v287.3c1.33,17.35,15.78,33.22,33.41,34.84,23.14,2.13,49.31-1.59,72.78.05,11.67-.84,12.94-17.5,2.04-20.87-22.47-2-48.14,2.13-70.23-.27-7.37-.8-13.89-5.25-15.89-12.61-.3-96.86-1.06-193.98.38-290.7,2.49-7.27,9.39-11.22,16.88-11.62h230.31c10.63.73,17.52,5.12,19.08,16.16l.06,105.69c3.89,13.23,20.74,10.29,21.69-2.96-1.36-32.83,1.84-67.13.04-99.78-.61-11.05-3.56-21.34-11.55-29.33ZM100.01,82.01c-5.44,5.44-3.38,15.19,3.83,17.78l160.54.72c14.1-1.51,13.34-21.15-.76-21.74l-155.27-.04c-2.6.09-6.51,1.46-8.34,3.29ZM107.84,139.71c-13.29,1.08-15.27,18.69-1.73,21.56l162.07-.71c10.81-6.26,7.23-20.5-5.31-21.05l-155.03.2ZM308.08,191.46c-7.43.84-15.14,4.44-20.84,9.16-35.08,36.1-72.4,70.43-106.11,107.64-2.38,12.05-6.63,27.12-7.16,39.33-.67,15.55,10.16,24,25.15,22.9,7.29-.53,34.9-5.13,40.09-8.66l104.32-104.18c23.86-28.22,1.2-70.31-35.44-66.19ZM104.8,201.17c-10.93,3.69-10.51,17.77.63,20.78l83.13-.02c11.44-2.62,11.42-18.26,0-20.86l-83.76.1Z" 
              style={{ fill: "none" }}
            />
            <path 
              d="M329.74,24.26c7.99,7.99,10.94,18.28,11.55,29.33,1.79,32.65-1.41,66.95-.04,99.78-.96,13.25-17.8,16.19-21.69,2.96l-.06-105.69c-1.56-11.04-8.45-15.43-19.08-16.17H70.1c-7.49.4-14.39,4.35-16.88,11.62-1.44,96.73-.68,193.85-.38,290.7,2,7.37,8.52,11.81,15.89,12.61,22.09,2.4,47.76-1.74,70.23.27,10.9,3.36,9.63,20.03-2.04,20.87-23.47-1.64-49.64,2.08-72.78-.05-17.63-1.62-32.08-17.48-33.41-34.84V48.35c1.4-17.89,15.61-32.66,33.37-34.88h243.05c7.64.66,17.22,5.42,22.59,10.79Z"
              fill="currentColor"
            />
            <path 
              d="M100.01,82.01c1.82-1.82,5.73-3.2,8.34-3.29l155.27.04c14.1.59,14.86,20.23.76,21.74l-160.54-.72c-7.21-2.59-9.28-12.34-3.83-17.78Z"
              fill="currentColor"
            />
            <path 
              d="M107.84,139.71l155.03-.2c12.54.55,16.12,14.79,5.31,21.05l-162.07,.71c-13.54-2.86-11.56-20.47,1.73-21.56Z"
              fill="currentColor"
            />
            <path 
              d="M104.8,201.17l83.76-.1c11.42,2.61,11.44,18.24,0,20.86l-83.13.02c-11.14-3.01-11.55-17.09-.63-20.78Z"
              fill="currentColor"
            />
            <g>
              <path 
                d="M308.08,191.46c36.63-4.12,59.3,37.97,35.44,66.19l-104.32,104.18c-5.19,3.54-32.8,8.13-40.09,8.66-14.99,1.09-25.82-7.35-25.15-22.9.53-12.21,4.78-27.28,7.16-39.33,33.71-37.21,71.03-71.54,106.11-107.64,5.7-4.72,13.41-8.32,20.84-9.16ZM308.8,213.18c-7.12,1.2-16.27,12.06-20.83,17.45l25.9,26.61c5.41-6.38,16.34-13.4,17.56-22.18,1.96-14.14-8.56-24.26-22.63-21.88ZM195.75,349.5l32.22-6.4,70.51-70.47-26.48-25.77-70.6,69.67-5.65,32.97Z"
                fill="currentColor"
              />
              <polygon 
                points="195.75 349.5 201.41 316.53 272.01 246.86 298.49 272.62 227.97 343.1 195.75 349.5" 
                style={{ fill: "none" }}
              />
              <path 
                d="M308.8,213.18c14.08-2.38,24.59,7.74,22.63,21.88-1.22,8.78-12.15,15.8-17.56,22.18l-25.9-26.61c4.56-5.38,13.71-16.24,20.83-17.45Z" 
                style={{ fill: "none" }}
              />
            </g>
          </svg>
          </button>
        )}
        
        {/* Sandbox Toggle Button - Only show in notebook mode */}
        {showSandboxToggle && (
          <button
            onClick={toggleSandbox}
            className="p-1.5 mr-1 rounded-md hover:bg-hover cursor-pointer transition-all duration-200 active:scale-95"
            aria-label={isSandboxExpanded ? "Hide sandbox panel" : "Show sandbox panel"}
            title={isSandboxExpanded ? "Hide sandbox" : "Show sandbox"}
          >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <title>ic_fluent_code_24_regular</title>
            <desc>Created with Sketch.</desc>
            <g id="🔍-Product-Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
              <g id="ic_fluent_code_24_regular" fill="#212121" fillRule="nonzero">
                <path d="M8.06561801,18.9432081 L14.565618,4.44320807 C14.7350545,4.06523433 15.1788182,3.8961815 15.5567919,4.06561801 C15.9032679,4.2209348 16.0741922,4.60676263 15.9697642,4.9611247 L15.934382,5.05679193 L9.43438199,19.5567919 C9.26494549,19.9347657 8.82118181,20.1038185 8.44320807,19.934382 C8.09673215,19.7790652 7.92580781,19.3932374 8.03023576,19.0388753 L8.06561801,18.9432081 L14.565618,4.44320807 L8.06561801,18.9432081 Z M2.21966991,11.4696699 L6.46966991,7.21966991 C6.76256313,6.9267767 7.23743687,6.9267767 7.53033009,7.21966991 C7.79659665,7.48593648 7.8208027,7.90260016 7.60294824,8.19621165 L7.53033009,8.28033009 L3.81066017,12 L7.53033009,15.7196699 C7.8232233,16.0125631 7.8232233,16.4874369 7.53033009,16.7803301 C7.26406352,17.0465966 6.84739984,17.0708027 6.55378835,16.8529482 L6.46966991,16.7803301 L2.21966991,12.5303301 C1.95340335,12.2640635 1.9291973,11.8473998 2.14705176,11.5537883 L2.21966991,11.4696699 L6.46966991,7.21966991 L2.21966991,11.4696699 Z M16.4696699,7.21966991 C16.7359365,6.95340335 17.1526002,6.9291973 17.4462117,7.14705176 L17.5303301,7.21966991 L21.7803301,11.4696699 C22.0465966,11.7359365 22.0708027,12.1526002 21.8529482,12.4462117 L21.7803301,12.5303301 L17.5303301,16.7803301 C17.2374369,17.0732233 16.7625631,17.0732233 16.4696699,16.7803301 C16.2034034,16.5140635 16.1791973,16.0973998 16.3970518,15.8037883 L16.4696699,15.7196699 L20.1893398,12 L16.4696699,8.28033009 C16.1767767,7.98743687 16.1767767,7.51256313 16.4696699,7.21966991 Z" id="🎨-Color"
                fill="currentcolor">
                </path>
              </g>
            </g>
          </svg>
          </button>
        )}
        
        {/* Sidebar Collapse Button - Already existed */}
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
    </div>
  );
};

export default SidebarHeader;
