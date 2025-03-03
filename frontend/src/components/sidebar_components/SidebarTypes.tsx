import type { Folder, Notebook, NotebookFile, ChatSession } from '../../services/supabase';

// Extended NotebookFile type to include processing status
export interface ExtendedNotebookFile extends NotebookFile {
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

export interface SidebarProps {
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
  files?: ExtendedNotebookFile[];
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
  uploadingFiles?: Set<string>; // Add uploadingFiles prop
}

export interface FolderItemProps {
  folder: Folder;
  depth?: number;
  isCollapsed: boolean;
  isMobile: boolean;
  isSelected: boolean;
  expandedFolders: Set<string>;
  handleToggleFolder: (folderId: string, e: React.MouseEvent) => void;
  handleSelectFolder: (folderId: string | null) => void;
  handleAddSubfolder: (parentId: string, e: React.MouseEvent) => void;
  handleDeleteClick: (folderId: string, e: React.MouseEvent) => void;
}

export interface FileListItemProps {
  file: ExtendedNotebookFile;
  isMobile: boolean;
  isChecked: boolean;
  toggleFileChecked: (fileId: string, e: React.MouseEvent) => void;
  handleDeleteFile?: (fileId: string) => void;
  getFileSize: (size: number) => string;
}

export interface ChatSessionItemProps {
  session: ChatSession;
  isMobile: boolean;
  isActive: boolean;
  setCurrentChatSession?: (session: ChatSession) => void;
  handleEditChatTitle?: (session: ChatSession) => void;
  confirmDeleteSession?: (sessionId: string) => void;
}

export interface FolderViewProps {
  userId: string;
  isMobile: boolean;
  isCollapsed: boolean;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFoldersUpdated?: () => void;
}

export interface NotebookViewProps {
  userId: string;
  isMobile: boolean;
  isCollapsed: boolean;
  notebookName: string;
  activeTab: 'files' | 'chats';
  setActiveTab?: (tab: 'files' | 'chats') => void;
  files: ExtendedNotebookFile[];
  chatSessions: ChatSession[];
  isLoadingFiles: boolean;
  currentChatSession: ChatSession | null;
  handleCreateSession?: () => void;
  handleDeleteFile?: (fileId: string) => void;
  handleEditChatTitle?: (session: ChatSession) => void;
  confirmDeleteSession?: (sessionId: string) => void;
  setCurrentChatSession?: (session: ChatSession) => void;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: Set<string>;
} 