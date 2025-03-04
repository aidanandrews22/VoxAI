import React, { useState, useEffect } from "react";
import { FolderViewProps } from "./SidebarTypes";
import FolderItem from "./FolderItem";
import {
  getUserFoldersHierarchy,
  getUnorganizedNotebooks,
  createFolder,
  deleteFolder,
  isParentFolder,
} from "../../services/folderService";
import type { Folder, Notebook } from "../../types/notebook";

const FolderView: React.FC<FolderViewProps> = ({
  userId,
  isMobile,
  isCollapsed,
  selectedFolderId,
  onSelectFolder,
  onFoldersUpdated,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unorganizedNotebooks, setUnorganizedNotebooks] = useState<Notebook[]>(
    [],
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    isParent: boolean;
  } | null>(null);
  const [allFoldersList, setAllFoldersList] = useState<Folder[]>([]);

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setIsLoading(true);
      try {
        // Load folder hierarchy
        const foldersResult = await getUserFoldersHierarchy(userId);
        if (foldersResult.success && foldersResult.data) {
          setFolders(foldersResult.data);

          // Create a flat list of all folders for collapsed view
          const flatList: Folder[] = [];
          const flattenFolders = (folderList: Folder[]) => {
            folderList.forEach((folder) => {
              flatList.push(folder);
              if (folder.children && folder.children.length > 0) {
                flattenFolders(folder.children);
              }
            });
          };

          flattenFolders(foldersResult.data);
          setAllFoldersList(flatList);

          // Initially expand first level folders for better UX
          const initialExpanded = new Set<string>();
          foldersResult.data.forEach((folder) => {
            initialExpanded.add(folder.id);
          });
          setExpandedFolders(initialExpanded);
        }

        // Load unorganized notebooks
        const unorganizedResult = await getUnorganizedNotebooks(userId);
        if (unorganizedResult.success && unorganizedResult.data) {
          setUnorganizedNotebooks(unorganizedResult.data);
        }
      } catch (err) {
        console.error("Error loading sidebar data:", err);
        setError("Failed to load folders");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userId]);

  const handleToggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleSelectFolder = (folderId: string | null) => {
    onSelectFolder(folderId);
  };

  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const result = await createFolder(
        userId,
        newFolderName.trim(),
        undefined,
        parentFolderId || undefined,
      );

      if (result.success && result.data) {
        // Refresh folder list
        const foldersResult = await getUserFoldersHierarchy(userId);
        if (foldersResult.success && foldersResult.data) {
          setFolders(foldersResult.data);

          // Update flat list for collapsed view
          const flatList: Folder[] = [];
          const flattenFolders = (folderList: Folder[]) => {
            folderList.forEach((folder) => {
              flatList.push(folder);
              if (folder.children && folder.children.length > 0) {
                flattenFolders(folder.children);
              }
            });
          };

          flattenFolders(foldersResult.data);
          setAllFoldersList(flatList);

          // Expand the parent folder if this was a subfolder
          if (parentFolderId) {
            setExpandedFolders((prev) => {
              const newSet = new Set(prev);
              newSet.add(parentFolderId);
              return newSet;
            });
          }
        }

        // Reset form
        setNewFolderName("");
        setIsCreatingFolder(false);
        setParentFolderId(null);
        setError(null);

        // Notify parent component that folders have been updated
        if (onFoldersUpdated) {
          onFoldersUpdated();
        }
      } else {
        setError("Failed to create folder");
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      setError("An error occurred while creating the folder");
    }
  };

  const handleAddSubfolder = (parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setParentFolderId(parentId);
    setIsCreatingFolder(true);
  };

  const handleDeleteClick = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if this is a parent folder
    const isParent = await isParentFolder(folderId);

    // Set the folder to delete with its parent status
    setFolderToDelete({ id: folderId, isParent });
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const result = await deleteFolder(folderToDelete.id);

      if (result.success) {
        // If the deleted folder was selected, reset selection
        if (selectedFolderId === folderToDelete.id) {
          onSelectFolder(null);
        }

        // Refresh folder list
        const foldersResult = await getUserFoldersHierarchy(userId);
        if (foldersResult.success && foldersResult.data) {
          setFolders(foldersResult.data);

          // Update flat list for collapsed view
          const flatList: Folder[] = [];
          const flattenFolders = (folderList: Folder[]) => {
            folderList.forEach((folder) => {
              flatList.push(folder);
              if (folder.children && folder.children.length > 0) {
                flattenFolders(folder.children);
              }
            });
          };

          flattenFolders(foldersResult.data);
          setAllFoldersList(flatList);
        }

        // Reset state
        setFolderToDelete(null);

        // Notify parent component that folders have been updated
        if (onFoldersUpdated) {
          onFoldersUpdated();
        }
      } else {
        setError("Failed to delete folder");
      }
    } catch (err) {
      console.error("Error deleting folder:", err);
      setError("An error occurred while deleting the folder");
    }
  };

  const cancelDeleteFolder = () => {
    setFolderToDelete(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <>
          {error && !isCollapsed && (
            <div className="text-red-500 text-sm p-2 mb-2">{error}</div>
          )}

          {/* Delete folder confirmation modal */}
          {folderToDelete && !isCollapsed && (
            <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
              <div
                className={`bg-card rounded-lg p-6 ${isMobile ? "w-[90%]" : "max-w-sm"} mx-auto shadow-xl transition-all duration-300 ease-in-out animate-fadeIn`}
              >
                <h3 className="text-lg font-medium text-adaptive mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-muted mb-6">
                  {folderToDelete.isParent
                    ? "This folder contains subfolders and/or notebooks. Deleting it will also delete all its contents. Are you sure you want to continue?"
                    : "Are you sure you want to delete this folder?"}
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDeleteFolder}
                    className="px-4 py-2 text-sm font-medium text-adaptive bg-hover hover:bg-active dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteFolder}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCollapsed ? null : ( // We don't need to render anything in collapsed state since we now use the floating menu
            // Render expanded view with hierarchy
            <>
              {/* All Notebooks (unfiltered) option */}
              <div
                className={`flex items-center py-1.5 px-3 my-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedFolderId === null
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-hover"
                }`}
                onClick={() => handleSelectFolder(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 transition-colors duration-200"
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
                <span>All Notebooks</span>
              </div>

              {/* Unorganized notebooks */}
              <div
                className={`flex items-center py-1.5 px-3 my-1.5 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedFolderId === "unorganized"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-hover"
                }`}
                onClick={() => handleSelectFolder("unorganized")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 transition-colors duration-200"
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
                <span>Unorganized</span>
              </div>

              {/* Folder list */}
              <div className="mt-2">
                {folders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    depth={0}
                    isCollapsed={isCollapsed}
                    isMobile={isMobile}
                    isSelected={selectedFolderId === folder.id}
                    expandedFolders={expandedFolders}
                    handleToggleFolder={handleToggleFolder}
                    handleSelectFolder={handleSelectFolder}
                    handleAddSubfolder={handleAddSubfolder}
                    handleDeleteClick={handleDeleteClick}
                  />
                ))}
              </div>

              {/* Create new folder button */}
              {!isCreatingFolder && (
                <button
                  onClick={() => {
                    setIsCreatingFolder(true);
                    setParentFolderId(null);
                  }}
                  className="flex items-center w-full py-2 px-3 mt-3 text-sm text-adaptive dark:text-gray-400 hover:bg-hover rounded-md cursor-pointer transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 transition-transform duration-200"
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
                  New Folder
                </button>
              )}

              {/* Create folder modal */}
              {isCreatingFolder && (
                <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-50">
                  <div
                    className={`bg-card rounded-lg p-6 ${isMobile ? "w-[90%]" : "max-w-sm"} mx-auto shadow-xl transition-all duration-300 ease-in-out animate-fadeIn`}
                  >
                    <h3 className="text-lg font-medium text-adaptive mb-4">
                      Create New Folder
                    </h3>
                    <form onSubmit={handleCreateNewFolder}>
                      <div className="mb-4">
                        <label
                          htmlFor="folderName"
                          className="block text-sm font-medium text-muted mb-2"
                        >
                          Folder Name
                        </label>
                        <input
                          type="text"
                          id="folderName"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="w-full text-sm px-3 py-2 border border-none rounded-md bg-input text-adaptive focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all duration-200"
                          placeholder="Enter folder name"
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName("");
                            setParentFolderId(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-adaptive bg-hover hover:bg-active dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md cursor-pointer transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer transition-all duration-200"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FolderView;
