import React, { useState, useEffect, useRef, useCallback } from "react";
import { SidebarProps } from "./sidebar_components/SidebarTypes";
import {
  useMediaQuery,
  updateCheckedFiles,
} from "./sidebar_components/SidebarUtils";
import SidebarHeader from "./sidebar_components/SidebarHeader";
import FolderView from "./sidebar_components/FolderView";
import NotebookView from "./sidebar_components/NotebookView";
import CollapsedSidebar from "./sidebar_components/CollapsedSidebar";
import SidebarOverlay from "./sidebar_components/SidebarOverlay";
import { saveToggledFiles, getToggledFiles } from "../services/userService";
import { getCheckedFiles as getCheckedFilesFromUtils } from "./sidebar_components/SidebarUtils";

// Export the getCheckedFiles function to maintain external API compatibility
export const getCheckedFiles = (): string[] => {
  return getCheckedFilesFromUtils();
};

const Sidebar: React.FC<SidebarProps> = ({
  userId,
  isCollapsed,
  onToggleCollapse,
  selectedFolderId,
  onSelectFolder,
  onFoldersUpdated,
  // Notes panel toggle props
  toggleNotesPanel,
  isNotesPanelExpanded,
  // Sandbox toggle props
  toggleSandbox,
  isSandboxExpanded,
  // Notebook props with defaults
  mode = "folders",
  activeTab = "files",
  setActiveTab,
  files = [],
  chatSessions = [],
  isLoadingFiles = false,
  currentChatSession = null,
  handleCreateSession,
  handleDeleteFile,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
  handleFileUpload,
  notebookName = "",
  uploadingFiles = new Set(),
}) => {
  // Add state to track hover on collapsed sidebar
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false);

  // Add keyframe animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.2s ease-out forwards;
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-slideDown {
        animation: slideDown 0.2s ease-out forwards;
      }
      @keyframes slideUp {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); visibility: hidden; }
      }
      .animate-slideUp {
        animation: slideUp 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [allFoldersList, setAllFoldersList] = useState<any[]>([]);

  // Track if the component has loaded toggled files from server to prevent
  // overwriting server state with empty state during initial render
  const [hasLoadedToggledFiles, setHasLoadedToggledFiles] = useState(false);

  // State for checked files - keep local component state for rendering
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());

  // Check if we're on a mobile device
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Effect to load toggled files from server on mount
  useEffect(() => {
    const loadToggledFiles = async () => {
      if (userId) {
        try {
          const toggledFilesArray = await getToggledFiles(userId);
          if (toggledFilesArray.length > 0) {
            // Ensure we're using valid UUIDs from the notebook_files table
            // Filter out any non-UUID values that might have been saved incorrectly
            const validUUIDs = toggledFilesArray.filter(id => 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            );
            
            const newCheckedFiles = new Set(validUUIDs);
            setCheckedFiles(newCheckedFiles);
            updateCheckedFiles(newCheckedFiles); // Update global variable
            console.log("Loaded toggled files from server:", validUUIDs);
          }
          setHasLoadedToggledFiles(true);
        } catch (error) {
          console.error("Error loading toggled files:", error);
          setHasLoadedToggledFiles(true);
        }
      }
    };

    loadToggledFiles();
  }, [userId]);

  // Update the flatFoldersList whenever needed (passed to collapsed sidebar)
  const updateAllFoldersList = (folders: any[]) => {
    setAllFoldersList(folders);
  };

  // Debounce timer ref
  const saveToggledFilesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced function to save toggled files
  const debouncedSaveToggledFiles = useCallback(
    async (toggledFilesArray: string[]) => {
      if (saveToggledFilesTimerRef.current) {
        clearTimeout(saveToggledFilesTimerRef.current);
      }

      saveToggledFilesTimerRef.current = setTimeout(async () => {
        try {
          // Ensure we're only saving valid UUIDs
          const validUUIDs = toggledFilesArray.filter(id => 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          );
          
          await saveToggledFiles(userId, validUUIDs);
          console.log("Saved toggled files to server:", validUUIDs);
        } catch (error) {
          console.error("Error saving toggled files:", error);
        }
        saveToggledFilesTimerRef.current = null;
      }, 1000); // 1 second debounce
    },
    [userId],
  );

  // Effect to persist checked files to server when they change with debouncing
  useEffect(() => {
    if (userId && hasLoadedToggledFiles) {
      const toggledFilesArray = Array.from(checkedFiles);
      debouncedSaveToggledFiles(toggledFilesArray);
    }

    // Update the global reference for the getCheckedFiles function
    updateCheckedFiles(checkedFiles);

    // Clean up timer on unmount
    return () => {
      if (saveToggledFilesTimerRef.current) {
        clearTimeout(saveToggledFilesTimerRef.current);
      }
    };
  }, [checkedFiles, userId, hasLoadedToggledFiles, debouncedSaveToggledFiles]);

  // Effect to handle new files that aren't in the saved toggled state
  useEffect(() => {
    if (hasLoadedToggledFiles && files.length > 0) {
      setCheckedFiles((prevCheckedFiles) => {
        // If we already have checked files, don't auto-check new ones
        if (prevCheckedFiles.size > 0) {
          // Validate that all checked files exist in the current files array
          // This ensures we don't keep references to deleted files
          const validCheckedFiles = new Set<string>();
          const fileIds = new Set(files.map(file => file.id));
          
          prevCheckedFiles.forEach(fileId => {
            if (fileIds.has(fileId)) {
              validCheckedFiles.add(fileId);
            }
          });
          
          // Only update if we've removed any invalid files
          if (validCheckedFiles.size !== prevCheckedFiles.size) {
            updateCheckedFiles(validCheckedFiles);
            return validCheckedFiles;
          }
          
          return prevCheckedFiles;
        }

        // Otherwise, check all non-processing files by default (first-time behavior)
        const newCheckedFiles = new Set<string>(prevCheckedFiles);
        files.forEach((file) => {
          if (!file.isProcessing && !newCheckedFiles.has(file.id)) {
            newCheckedFiles.add(file.id);
          }
        });

        // Only update if we've added new files
        if (newCheckedFiles.size > prevCheckedFiles.size) {
          // Update the global reference
          updateCheckedFiles(newCheckedFiles);
          return newCheckedFiles;
        }

        return prevCheckedFiles;
      });
    }
  }, [files, hasLoadedToggledFiles]);

  return (
    <>
      {/* Collapsed Sidebar UI (Mobile and Desktop) */}
      <CollapsedSidebar
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        isHoveringCollapsed={isHoveringCollapsed}
        setIsHoveringCollapsed={setIsHoveringCollapsed}
        mode={mode}
        setActiveTab={setActiveTab}
        handleCreateSession={handleCreateSession}
        handleFileUpload={handleFileUpload}
        handleSelectFolder={onSelectFolder}
        allFoldersList={[]}
        toggleNotesPanel={toggleNotesPanel}
        isNotesPanelExpanded={isNotesPanelExpanded}
        toggleSandbox={toggleSandbox}
        isSandboxExpanded={isSandboxExpanded}
      />

      {/* Mobile Overlay */}
      <SidebarOverlay
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Main Sidebar Container */}
      <div
        className={`${
          isMobile
            ? // Mobile styles
              isCollapsed
              ? "hidden"
              : "fixed inset-y-0 left-0 z-40 bg-card w-[85%] max-w-sm h-full overflow-y-auto shadow-xl transition-all duration-300 ease-in-out transform translate-x-0 flex flex-col"
            : // Desktop styles - Hide completely when collapsed
              `h-full bg-card border-r border-none flex flex-col shadow-sm transition-all duration-300 ease-in-out ${
                isCollapsed ? "hidden" : "w-64 overflow-y-auto"
              }`
        }`}
      >
        {/* Header with toggle button */}
        <SidebarHeader
          mode={mode}
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggleCollapse={onToggleCollapse}
          notebookName={notebookName}
          toggleNotesPanel={toggleNotesPanel}
          isNotesPanelExpanded={isNotesPanelExpanded}
          toggleSandbox={toggleSandbox}
          isSandboxExpanded={isSandboxExpanded}
        />

        {/* Conditional rendering based on mode */}
        {mode === "folders" ? (
          // Folder Navigation Content
          <FolderView
            userId={userId}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onFoldersUpdated={onFoldersUpdated}
          />
        ) : (
          // Notebook Mode Content
          <NotebookView
            userId={userId}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            notebookName={notebookName}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            files={files}
            chatSessions={chatSessions}
            isLoadingFiles={isLoadingFiles}
            currentChatSession={currentChatSession}
            handleCreateSession={handleCreateSession}
            handleDeleteFile={handleDeleteFile}
            handleEditChatTitle={handleEditChatTitle}
            confirmDeleteSession={confirmDeleteSession}
            setCurrentChatSession={setCurrentChatSession}
            handleFileUpload={handleFileUpload}
            uploadingFiles={uploadingFiles}
          />
        )}
      </div>
    </>
  );
};

export default Sidebar;
