import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserFoldersHierarchy, 
  createFolder, 
  deleteFolder, 
  isParentFolder 
} from '../services/folderService';
import { getUnorganizedNotebooks } from '../services/folderService';
import type { Folder, Notebook, NotebookFile, ChatSession } from '../services/supabase';

interface SidebarProps {
  // Core/Folder navigation props
  userId: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersUpdated?: () => void; // Optional callback for folder updates
  
  // Notebook-specific props (optional)
  mode?: 'folders' | 'notebook';
  activeTab?: 'files' | 'chats';
  setActiveTab?: (tab: 'files' | 'chats') => void;
  files?: NotebookFile[];
  chatSessions?: ChatSession[];
  isLoadingFiles?: boolean;
  currentChatSession?: ChatSession | null;
  handleCreateSession?: () => void;
  handleDeleteFile?: (fileId: string) => void;
  handleEditChatTitle?: (session: ChatSession) => void;
  confirmDeleteSession?: (sessionId: string) => void;
  setCurrentChatSession?: (session: ChatSession) => void;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  notebookName?: string;
}

const Sidebar = ({ 
  userId, 
  isCollapsed, 
  onToggleCollapse, 
  selectedFolderId, 
  onSelectFolder,
  onFoldersUpdated,
  // Notebook props with defaults
  mode = 'folders',
  activeTab = 'files',
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
  notebookName = ''
}: SidebarProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [unorganizedNotebooks, setUnorganizedNotebooks] = useState<Notebook[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{id: string, isParent: boolean} | null>(null);
  const [allFoldersList, setAllFoldersList] = useState<Folder[]>([]);
  // Add state to track checked files
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());
  
  // Add file input ref for notebook mode
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();

  unorganizedNotebooks;

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
            folderList.forEach(folder => {
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
          foldersResult.data.forEach(folder => {
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
        console.error('Error loading sidebar data:', err);
        setError('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [userId]);

  // Initialize all files as checked by default
  useEffect(() => {
    if (files.length > 0) {
      const newCheckedFiles = new Set<string>();
      files.forEach(file => newCheckedFiles.add(file.id));
      setCheckedFiles(newCheckedFiles);
    }
  }, [files]);

  const handleToggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
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
        parentFolderId || undefined
      );
      
      if (result.success && result.data) {
        // Refresh folder list
        const foldersResult = await getUserFoldersHierarchy(userId);
        if (foldersResult.success && foldersResult.data) {
          setFolders(foldersResult.data);
          
          // Update flat list for collapsed view
          const flatList: Folder[] = [];
          const flattenFolders = (folderList: Folder[]) => {
            folderList.forEach(folder => {
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
            setExpandedFolders(prev => {
              const newSet = new Set(prev);
              newSet.add(parentFolderId);
              return newSet;
            });
          }
        }
        
        // Reset form
        setNewFolderName('');
        setIsCreatingFolder(false);
        setParentFolderId(null);
        setError(null);
        
        // Notify parent component that folders have been updated
        if (onFoldersUpdated) {
          onFoldersUpdated();
        }
      } else {
        setError('Failed to create folder');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('An error occurred while creating the folder');
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
            folderList.forEach(folder => {
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
        setError('Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('An error occurred while deleting the folder');
    }
  };

  const cancelDeleteFolder = () => {
    setFolderToDelete(null);
  };

  // Toggle file checked state
  const toggleFileChecked = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const renderFolderItem = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    
    return (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 my-1 rounded-md cursor-pointer group ${
            isSelected 
              ? 'bg-black text-white dark:bg-white dark:text-black' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{ paddingLeft: `${(depth + 1) * 12}px` }}
          onClick={() => handleSelectFolder(folder.id)}
        >
          {/* Delete folder icon (visible on hover) */}
          {!isCollapsed && (
            <button
              onClick={(e) => handleDeleteClick(folder.id, e)}
              className="w-5 h-5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-red-500 hover:text-red-700"
              title="Delete folder"
              aria-label="Delete folder"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
          {/* Expand/collapse icon */}
          {hasChildren && !isCollapsed ? (
            <button
              onClick={(e) => handleToggleFolder(folder.id, e)}
              className="w-5 h-5 mr-1 flex items-center justify-center cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : !isCollapsed ? (
            <div className="w-5 h-5 mr-1"></div>
          ) : null}
          
          {/* Folder icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${!isCollapsed ? 'mr-2' : 'mx-auto'}`}
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
          
          {/* Folder name */}
          {!isCollapsed && (
            <span className="flex-1 truncate">
              {folder.title}
            </span>
          )}
          
          {/* Add subfolder button (only visible on hover) */}
          {!isCollapsed && (
            <button
              onClick={(e) => handleAddSubfolder(folder.id, e)}
              className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Add subfolder"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Render children if expanded */}
        {!isCollapsed && isExpanded && hasChildren && (
          <div className="ml-2">
            {folder.children?.map(childFolder => renderFolderItem(childFolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Function to render a flat list of folder icons for collapsed mode
  const renderCollapsedFoldersList = () => {
    return (
      <div className="flex flex-col items-center space-y-4 mt-4">
        {/* All Notebooks icon */}
        <div 
          className={`flex items-center justify-center p-2 rounded-md cursor-pointer ${
            selectedFolderId === null 
              ? 'bg-black text-white dark:bg-white dark:text-black' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleSelectFolder(null)}
          title="All Notebooks"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
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
        </div>
        
        {/* Unorganized notebooks icon */}
        <div 
          className={`flex items-center justify-center p-2 rounded-md cursor-pointer ${
            selectedFolderId === 'unorganized' 
              ? 'bg-black text-white dark:bg-white dark:text-black' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          onClick={() => handleSelectFolder('unorganized')}
          title="Unorganized Notebooks"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
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
        </div>
        
        {/* Flat list of all folders */}
        {allFoldersList.map(folder => (
          <div 
            key={folder.id}
            className={`flex items-center justify-center p-2 rounded-md cursor-pointer ${
              selectedFolderId === folder.id 
                ? 'bg-black text-white dark:bg-white dark:text-black' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleSelectFolder(folder.id)}
            title={folder.title}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with toggle button */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center">
            {mode === 'notebook' && (
              <button 
                onClick={() => navigate('/notebooks')}
                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
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
            <h2 className="font-medium text-gray-800 dark:text-white">
              {mode === 'notebook' ? notebookName : 'Folders'}
            </h2>
          </div>
        )}
        <button 
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-600 dark:text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* Conditional rendering based on mode */}
      {mode === 'folders' ? (
        // Folder Navigation Content
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <>
              {error && !isCollapsed && (
                <div className="text-red-500 text-sm p-2 mb-2">
                  {error}
                </div>
              )}
              
              {/* Delete folder confirmation modal */}
              {folderToDelete && !isCollapsed && (
                <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Confirm Deletion
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                      {folderToDelete.isParent 
                        ? 'This folder contains subfolders and/or notebooks. Deleting it will also delete all its contents. Are you sure you want to continue?' 
                        : 'Are you sure you want to delete this folder?'}
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelDeleteFolder}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteFolder}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {isCollapsed ? (
                // Render collapsed view with flat list of icons
                renderCollapsedFoldersList()
              ) : (
                // Render expanded view with hierarchy
                <>
                  {/* All Notebooks (unfiltered) option */}
                  <div 
                    className={`flex items-center py-1 px-3 my-1 rounded-md cursor-pointer ${
                      selectedFolderId === null 
                        ? 'bg-black text-white dark:bg-white dark:text-black' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleSelectFolder(null)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
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
                    className={`flex items-center py-1 px-3 my-1 rounded-md cursor-pointer ${
                      selectedFolderId === 'unorganized' 
                        ? 'bg-black text-white dark:bg-white dark:text-black' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleSelectFolder('unorganized')}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
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
                    {folders.map(folder => renderFolderItem(folder))}
                  </div>

                  {/* Create new folder button */}
                  {!isCreatingFolder && (
                    <button
                      onClick={() => {
                        setIsCreatingFolder(true);
                        setParentFolderId(null);
                      }}
                      className="flex items-center w-full py-1 px-3 mt-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Folder
                    </button>
                  )}

                  {/* Create folder form */}
                  {isCreatingFolder && (
                    <form onSubmit={handleCreateNewFolder} className="mt-3 px-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {parentFolderId ? 'New subfolder' : 'New folder'}
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-l-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Folder name"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-black text-white dark:bg-white dark:text-black rounded-r-md hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingFolder(false);
                            setNewFolderName('');
                            setParentFolderId(null);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      ) : (
        // Notebook Mode Content
        <>
          {!isCollapsed && (
            <>
              {/* Tabs for Files and Chat History */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab?.('files')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'files'
                      ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } cursor-pointer`}
                >
                  Files
                </button>
                <button
                  onClick={() => setActiveTab?.('chats')}
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'chats'
                      ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  } cursor-pointer`}
                >
                  Chats
                </button>
              </div>

              {/* Files Tab Content */}
              {activeTab === 'files' && (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Upload File</span>
                    </label>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingFiles ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    ) : files.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                        No files uploaded yet
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        <div className="flex items-center justify-center mb-2">
                          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                            Click to toggle files
                          </p>
                          <div className="relative ml-1 group">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute top-full right-0 mb-2 w-48 p-2 bg-gray-300 text-gray-500 text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                              Toggled files will be included in the model context when responding to your queries.
                              <div className="absolute top-full right-0 -mt-1 border-4 border-transparent border-t-black dark:border-t-white"></div>
                            </div>
                          </div>
                        </div>
                        {files.map((file) => (
                          <li 
                            key={file.id} 
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div 
                                className="flex-1 truncate"
                                onClick={(e) => toggleFileChecked(file.id, e)}
                              >
                                <p className={`text-sm font-medium truncate ${
                                  checkedFiles.has(file.id) 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-500 dark:text-gray-400 line-through'
                                }`}>
                                  {file.file_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(file.file_size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteFile?.(file.id)}
                                className="text-red-500 hover:text-red-700"
                                aria-label="Delete file"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Chat History Tab Content */}
              {activeTab === 'chats' && (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div
                      onClick={handleCreateSession}
                      className="cursor-pointer flex items-center justify-center w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Chat</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {chatSessions.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                        No chat sessions yet
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {chatSessions.map((session) => (
                          <li 
                            key={session.id}
                            className={`p-2 rounded ${
                              currentChatSession?.id === session.id
                                ? 'bg-gray-200 dark:bg-gray-700'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => setCurrentChatSession?.(session)}
                              >
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {session.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditChatTitle?.(session)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                  aria-label="Edit chat title"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => confirmDeleteSession?.(session.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  aria-label="Delete chat"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Collapsed Notebook Sidebar Icons */}
          {isCollapsed && (
            <div className="flex flex-col items-center py-4 space-y-6">
              {/* Files tab icon */}
              <button 
                onClick={() => setActiveTab?.('files')}
                className={`p-2 rounded-full ${activeTab === 'files' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} cursor-pointer`}
                aria-label="Files"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              {/* Chats tab icon */}
              <button 
                onClick={() => setActiveTab?.('chats')}
                className={`p-2 rounded-full ${activeTab === 'chats' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} cursor-pointer`}
                aria-label="Chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
              
              {/* New chat button */}
              <div 
                onClick={handleCreateSession}
                className="p-3 cursor-pointer flex flex-col items-center justify-center"
                aria-label="New Chat"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              
              {/* Upload file button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 cursor-pointer flex flex-col items-center justify-center"
                aria-label="Upload File"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
              </div>
              
              {/* Hidden file input for upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-collapsed"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Sidebar; 