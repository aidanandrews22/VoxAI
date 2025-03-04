import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseUser } from "../../contexts/UserContext";
import {
  getUserNotebooks,
  createNotebookWithFolder,
  updateNotebookWithFolder,
} from "../../services/notebookService";
import {
  getNotebooksInFolder,
  getNotebooksInFolderRecursive,
  getUnorganizedNotebooks,
  getUserFoldersHierarchy,
  isParentFolder,
} from "../../services/folderService";
import type { Notebook, Folder } from "../../types/notebook";
import Sidebar from "../../components/Sidebar";
import NotebookModal from "../../components/NotebookModal";
// import Header from '../../components/Header';

export default function NotebooksPage() {
  const navigate = useNavigate();
  const { supabaseUserId, isLoading: isUserLoading } = useSupabaseUser();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [includeNestedNotebooks, setIncludeNestedNotebooks] = useState(false);

  // Function to refresh folders
  const refreshFolders = async () => {
    if (!supabaseUserId) return;

    try {
      const result = await getUserFoldersHierarchy(supabaseUserId);
      if (result.success && result.data) {
        setFolders(result.data);
      }
    } catch (err) {
      console.error("Error refreshing folders:", err);
    }
  };

  // Get current folder ID for the notebook being edited
  const getCurrentFolderId = (notebookId: string): string | "unorganized" => {
    // Find the folder that contains this notebook
    const findFolderWithNotebook = (folders: Folder[]): string | null => {
      for (const folder of folders) {
        if (folder.notebooks?.some((nb) => nb.id === notebookId)) {
          return folder.id;
        }
        if (folder.children && folder.children.length > 0) {
          const childResult = findFolderWithNotebook(folder.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };

    const folderId = findFolderWithNotebook(folders);
    return folderId || "unorganized";
  };

  // Refresh folders when component mounts
  useEffect(() => {
    if (supabaseUserId) {
      refreshFolders();
    }
  }, [supabaseUserId]);

  // Refresh folders when selected folder changes
  useEffect(() => {
    if (
      supabaseUserId &&
      selectedFolderId &&
      selectedFolderId !== "unorganized"
    ) {
      refreshFolders();
    }
  }, [selectedFolderId, supabaseUserId]);

  useEffect(() => {
    async function fetchNotebooks() {
      if (!supabaseUserId) return;

      setIsLoading(true);
      try {
        let result;

        if (selectedFolderId === null) {
          // Show all notebooks
          result = await getUserNotebooks(supabaseUserId);
        } else if (selectedFolderId === "unorganized") {
          // Show unorganized notebooks
          result = await getUnorganizedNotebooks(supabaseUserId);
        } else {
          // Show notebooks in the selected folder
          if (includeNestedNotebooks) {
            result = await getNotebooksInFolderRecursive(selectedFolderId);
          } else {
            result = await getNotebooksInFolder(selectedFolderId);
          }
        }

        if (result.success && result.data) {
          setNotebooks(result.data);
        } else {
          setError("Failed to load notebooks");
        }
      } catch (err) {
        console.error("Error fetching notebooks:", err);
        setError("An error occurred while loading notebooks");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotebooks();
  }, [supabaseUserId, selectedFolderId, includeNestedNotebooks]);

  // Fetch folders for dropdown
  useEffect(() => {
    async function fetchFolders() {
      if (!supabaseUserId) return;

      try {
        const result = await getUserFoldersHierarchy(supabaseUserId);
        if (result.success && result.data) {
          setFolders(result.data);
        }
      } catch (err) {
        console.error("Error fetching folders:", err);
      }
    }

    fetchFolders();
  }, [supabaseUserId, selectedFolderId]);

  const handleCreateNotebook = async (notebookData: {
    title: string;
    description: string;
    folderId: string | "unorganized";
  }) => {
    if (!supabaseUserId) return;

    try {
      // Use the folder-aware notebook creation with the selected folder
      const folderId =
        notebookData.folderId !== "unorganized"
          ? notebookData.folderId
          : undefined;

      const result = await createNotebookWithFolder(
        supabaseUserId,
        notebookData.title,
        notebookData.description || undefined,
        folderId,
      );

      if (result.success && result.data) {
        // Only add to the UI list if we're in the right view
        if (
          selectedFolderId === null || // All notebooks
          (selectedFolderId === "unorganized" && !folderId) || // Unorganized view and no folder selected
          (folderId && selectedFolderId === folderId) // Current folder matches selected folder
        ) {
          setNotebooks([result.data, ...notebooks]);
        }

        setShowModal(false);
        setError(null);

        // Navigate to the new notebook
        navigate(`/notebooks/${result.data.id}`);
      } else {
        setError("Failed to create notebook");
      }
    } catch (err) {
      console.error("Error creating notebook:", err);
      setError("An error occurred while creating the notebook");
      throw err;
    }
  };

  const handleUpdateNotebook = async (notebookData: {
    title: string;
    description: string;
    folderId: string | "unorganized";
  }) => {
    if (!editingNotebook) return;

    try {
      const folderId =
        notebookData.folderId !== "unorganized"
          ? notebookData.folderId
          : undefined;

      const result = await updateNotebookWithFolder(
        editingNotebook.id,
        {
          title: notebookData.title,
          description: notebookData.description || undefined,
        },
        folderId,
      );

      if (result.success && result.data) {
        // Update the notebook in the list
        setNotebooks(
          notebooks.map((nb) =>
            nb.id === editingNotebook.id ? result.data! : nb,
          ),
        );

        // If folder changed, we might need to refresh the view
        if (getCurrentFolderId(editingNotebook.id) !== notebookData.folderId) {
          // If we're in a specific folder view and the notebook was moved out
          if (
            selectedFolderId &&
            selectedFolderId !== "unorganized" &&
            selectedFolderId !== notebookData.folderId
          ) {
            setNotebooks(
              notebooks.filter((nb) => nb.id !== editingNotebook.id),
            );
          }
        }

        setShowModal(false);
        setEditingNotebook(null);
        setIsEditing(false);
        setError(null);
      } else {
        setError("Failed to update notebook");
      }
    } catch (err) {
      console.error("Error updating notebook:", err);
      setError("An error occurred while updating the notebook");
      throw err;
    }
  };

  const handleSelectFolder = (folderId: string | null) => {
    setSelectedFolderId(folderId);
  };

  const getFolderTitle = () => {
    if (selectedFolderId === null) return "All Notebooks";
    if (selectedFolderId === "unorganized") return "Unorganized Notebooks";

    // Find the selected folder's title
    const findFolderName = (folders: Folder[]): string | null => {
      for (const folder of folders) {
        if (folder.id === selectedFolderId) {
          return folder.title;
        }
        if (folder.children && folder.children.length > 0) {
          const childResult = findFolderName(folder.children);
          if (childResult) return childResult;
        }
      }
      return null;
    };

    const folderName = findFolderName(folders);

    // If we couldn't find the folder name, refresh folders and return a placeholder
    if (!folderName) {
      refreshFolders();
      return "Loading Folder...";
    }

    return folderName;
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingNotebook(null);
    setShowModal(true);
  };

  const openEditModal = (notebook: Notebook) => {
    setIsEditing(true);
    setEditingNotebook(notebook);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingNotebook(null);
  };

  const handleSubmit = async (notebookData: {
    title: string;
    description: string;
    folderId: string | "unorganized";
  }) => {
    if (isEditing && editingNotebook) {
      return handleUpdateNotebook(notebookData);
    } else {
      return handleCreateNotebook(notebookData);
    }
  };

  // Check if the current view is a specific folder (not All or Unorganized)
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    async function checkIfParentFolder() {
      if (selectedFolderId && selectedFolderId !== "unorganized") {
        const result = await isParentFolder(selectedFolderId);
        setIsParent(!!result);
      } else {
        setIsParent(false);
      }
    }

    checkIfParentFolder();
  }, [selectedFolderId]);

  // Only show toggle if we're in a specific folder view that has children
  const showNestedToggle =
    selectedFolderId !== null && selectedFolderId !== "unorganized" && isParent;

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {supabaseUserId && (
        <Sidebar
          userId={supabaseUserId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          onFoldersUpdated={refreshFolders}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-12">
        {/* <Header /> */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex space-x-10 items-center mb-8">
              <h1 className="text-3xl font-bold text-adaptive">
                {getFolderTitle()}
              </h1>

              {/* Toggle for including nested notebooks - only show in folder view */}
              {showNestedToggle && (
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeNestedNotebooks}
                      onChange={() =>
                        setIncludeNestedNotebooks(!includeNestedNotebooks)
                      }
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 dark:peer-focus:ring-gray-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-black dark:peer-checked:bg-white"></div>
                    <span className="ms-3 text-sm font-medium text-adaptive">
                      Include nested notebooks
                    </span>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Notebook creation card */}
                {notebooks.length !== 0 && (
                  <div
                    onClick={openCreateModal}
                    className="flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors h-full min-h-[200px]"
                  >
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-500 dark:text-gray-400"
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
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Create New Notebook
                      </p>
                    </div>
                  </div>
                )}

                {/* Notebook cards */}
                {notebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative group"
                  >
                    <Link to={`/notebooks/${notebook.id}`} className="block">
                      <h2 className="text-xl font-bold text-adaptive mb-2">
                        {notebook.title}
                      </h2>
                      {notebook.description && (
                        <p className="text-muted mb-4">
                          {notebook.description}
                        </p>
                      )}
                      <div className="text-sm text-muted">
                        Created{" "}
                        {new Date(notebook.created_at).toLocaleDateString()}
                      </div>
                    </Link>

                    {/* Edit button - appears on hover */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(notebook);
                      }}
                      className="absolute top-3 right-3 p-2 bg-hover dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Edit notebook"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-600 dark:text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && notebooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted text-lg mb-4">
                  {selectedFolderId === null
                    ? "You don't have any notebooks yet."
                    : selectedFolderId === "unorganized"
                      ? "You don't have any unorganized notebooks."
                      : "This folder doesn't contain any notebooks."}
                </p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Create Notebook
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notebook Modal - for both creating and editing */}
      <NotebookModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        folders={folders}
        initialData={
          editingNotebook
            ? {
                title: editingNotebook.title,
                description: editingNotebook.description || "",
                folderId: getCurrentFolderId(editingNotebook.id),
              }
            : undefined
        }
        isEditing={isEditing}
        selectedFolderId={
          selectedFolderId !== "unorganized" ? selectedFolderId : undefined
        }
      />
    </div>
  );
}
