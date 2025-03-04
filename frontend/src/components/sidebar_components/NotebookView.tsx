import React from "react";
import { NotebookViewProps } from "./SidebarTypes";
import FilesTabContent from "./FilesTabContent";
import ChatsTabContent from "./ChatsTabContent";

const NotebookView: React.FC<NotebookViewProps> = ({
  userId,
  isMobile,
  isCollapsed,
  notebookName,
  activeTab,
  setActiveTab,
  files,
  chatSessions,
  isLoadingFiles,
  currentChatSession,
  handleCreateSession,
  handleDeleteFile,
  handleEditChatTitle,
  confirmDeleteSession,
  setCurrentChatSession,
  handleFileUpload,
  uploadingFiles,
}) => {
  // State for checked files
  const [checkedFiles, setCheckedFiles] = React.useState<Set<string>>(
    new Set(),
  );

  // Effect to handle new files that aren't in the saved toggled state
  React.useEffect(() => {
    if (files.length > 0) {
      setCheckedFiles((prevCheckedFiles) => {
        // If we already have checked files, don't auto-check new ones
        if (prevCheckedFiles.size > 0) {
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
          return newCheckedFiles;
        }

        return prevCheckedFiles;
      });
    }
  }, [files]);

  // Toggle file checked state
  const toggleFileChecked = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the file
    const file = files.find((f) => f.id === fileId);

    // Don't toggle processing files
    if (file?.isProcessing) return;

    setCheckedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  return (
    <>
      {!isCollapsed && (
        <>
          {/* Tabs for Files and Chat History */}
          <div className="flex border-b border-none">
            <button
              onClick={() => setActiveTab?.("files")}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "files"
                  ? "text-adaptive border-b-2 border-black dark:border-white"
                  : "text-muted hover:text-adaptive"
              } cursor-pointer`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab?.("chats")}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === "chats"
                  ? "text-adaptive border-b-2 border-black dark:border-white"
                  : "text-muted hover:text-adaptive"
              } cursor-pointer`}
            >
              Chats
            </button>
          </div>

          {/* Files Tab Content */}
          {activeTab === "files" && (
            <FilesTabContent
              files={files}
              isLoadingFiles={isLoadingFiles}
              isMobile={isMobile}
              checkedFiles={checkedFiles}
              toggleFileChecked={toggleFileChecked}
              handleDeleteFile={handleDeleteFile}
              handleFileUpload={handleFileUpload}
              uploadingFiles={uploadingFiles}
            />
          )}

          {/* Chat History Tab Content */}
          {activeTab === "chats" && (
            <ChatsTabContent
              chatSessions={chatSessions}
              isMobile={isMobile}
              currentChatSession={currentChatSession}
              handleCreateSession={handleCreateSession}
              handleEditChatTitle={handleEditChatTitle}
              confirmDeleteSession={confirmDeleteSession}
              setCurrentChatSession={setCurrentChatSession}
            />
          )}
        </>
      )}
    </>
  );
};

export default NotebookView;
