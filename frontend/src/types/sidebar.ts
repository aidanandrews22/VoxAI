import React from "react";
import { z } from "zod";
import { ChatSessionSchema, type ChatSession } from "./chat";
import { NotebookFileSchema, type Folder } from "./notebook";

// ExtendedNotebookFile schema with Zod
export const ExtendedNotebookFileSchema = NotebookFileSchema.extend({
  isProcessing: z.boolean().optional(),
  isDeletingFile: z.boolean().optional(),
});

// Type derived from the schema
export type ExtendedNotebookFile = z.infer<typeof ExtendedNotebookFileSchema>;

// SidebarProps schema with Zod
export const SidebarPropsSchema = z.object({
  // Core/Folder navigation props
  userId: z.string(),
  isCollapsed: z.boolean(),
  onToggleCollapse: z.function().args().returns(z.void()),
  selectedFolderId: z.string().nullable(),
  onSelectFolder: z.function().args(z.string().nullable()).returns(z.void()),
  onFoldersUpdated: z.function().args().returns(z.void()).optional(),
  
  // Notes panel toggle functionality
  toggleNotesPanel: z.function().args().returns(z.void()).optional(),
  isNotesPanelExpanded: z.boolean().optional(),
  
  // Sandbox toggle functionality
  toggleSandbox: z.function().args().returns(z.void()).optional(),
  isSandboxExpanded: z.boolean().optional(),

  // Notebook-specific props (optional)
  mode: z.enum(["folders", "notebook"]).optional(),
  activeTab: z.enum(["files", "chats"]).optional(),
  setActiveTab: z
    .function()
    .args(z.enum(["files", "chats"]))
    .returns(z.void())
    .optional(),
  files: z.array(ExtendedNotebookFileSchema).optional(),
  chatSessions: z.array(ChatSessionSchema).optional(),
  isLoadingFiles: z.boolean().optional(),
  currentChatSession: ChatSessionSchema.nullable().optional(),
  handleCreateSession: z.function().args().returns(z.void()).optional(),
  handleDeleteFile: z.function().args(z.string()).returns(z.void()).optional(),
  handleEditChatTitle: z
    .function()
    .args(ChatSessionSchema)
    .returns(z.void())
    .optional(),
  confirmDeleteSession: z
    .function()
    .args(z.string())
    .returns(z.void())
    .optional(),
  setCurrentChatSession: z
    .function()
    .args(ChatSessionSchema)
    .returns(z.void())
    .optional(),
  handleFileUpload: z
    .function()
    .args(z.custom<React.ChangeEvent<HTMLInputElement>>())
    .returns(z.promise(z.void()))
    .optional(),
  notebookName: z.string().optional(),
  uploadingFiles: z.custom<Set<string>>().optional(),
});

// Type derived from the schema
export type SidebarProps = z.infer<typeof SidebarPropsSchema>;

// FolderItemProps schema with Zod
export const FolderItemPropsSchema = z.object({
  folder: z.custom<Folder>(),
  depth: z.number().optional(),
  isCollapsed: z.boolean(),
  isMobile: z.boolean(),
  isSelected: z.boolean(),
  expandedFolders: z.custom<Set<string>>(),
  handleToggleFolder: z.function(),
  handleSelectFolder: z.function(),
  handleAddSubfolder: z.function(),
  handleDeleteClick: z.function(),
});

// Type derived from the schema
export type FolderItemProps = z.infer<typeof FolderItemPropsSchema>;

// FileListItemProps schema with Zod
export const FileListItemPropsSchema = z.object({
  file: ExtendedNotebookFileSchema,
  isMobile: z.boolean(),
  isChecked: z.boolean(),
  toggleFileChecked: z
    .function()
    .args(z.string(), z.custom<React.MouseEvent>())
    .returns(z.void()),
  handleDeleteFile: z.function().args(z.string()).returns(z.void()).optional(),
  getFileSize: z.function().args(z.number()).returns(z.string()),
});

// Type derived from the schema
export type FileListItemProps = z.infer<typeof FileListItemPropsSchema>;

// ChatSessionItemProps schema with Zod
export const ChatSessionItemPropsSchema = z.object({
  session: z.custom<ChatSession>(),
  isMobile: z.boolean(),
  isActive: z.boolean(),
  setCurrentChatSession: z.function().optional(),
  handleEditChatTitle: z.function().optional(),
  confirmDeleteSession: z.function().optional(),
});

// Type derived from the schema
export type ChatSessionItemProps = z.infer<typeof ChatSessionItemPropsSchema>;

// FolderViewProps schema with Zod
export const FolderViewPropsSchema = z.object({
  userId: z.string(),
  isMobile: z.boolean(),
  isCollapsed: z.boolean(),
  selectedFolderId: z.string().nullable(),
  onSelectFolder: z.function().args(z.string().nullable()).returns(z.void()),
  onFoldersUpdated: z.function().args().returns(z.void()).optional(),
});

// Type derived from the schema
export type FolderViewProps = z.infer<typeof FolderViewPropsSchema>;

// NotebookViewProps schema with Zod
export const NotebookViewPropsSchema = z.object({
  userId: z.string(),
  isMobile: z.boolean(),
  isCollapsed: z.boolean(),
  notebookName: z.string(),
  activeTab: z.enum(["files", "chats"]),
  setActiveTab: z
    .function()
    .args(z.enum(["files", "chats"]))
    .returns(z.void())
    .optional(),
  files: z.array(ExtendedNotebookFileSchema),
  chatSessions: z.array(z.custom<ChatSession>()),
  isLoadingFiles: z.boolean(),
  currentChatSession: z.custom<ChatSession>().nullable(),
  handleCreateSession: z.function().args().returns(z.void()).optional(),
  handleDeleteFile: z.function().args(z.string()).returns(z.void()).optional(),
  handleEditChatTitle: z
    .function()
    .args(ChatSessionSchema)
    .returns(z.void())
    .optional(),
  confirmDeleteSession: z
    .function()
    .args(z.string())
    .returns(z.void())
    .optional(),
  setCurrentChatSession: z
    .function()
    .args(ChatSessionSchema)
    .returns(z.void())
    .optional(),
  handleFileUpload: z
    .function()
    .args(z.custom<React.ChangeEvent<HTMLInputElement>>())
    .returns(z.promise(z.void()))
    .optional(),
  uploadingFiles: z.custom<Set<string>>(),
});

// Type derived from the schema
export type NotebookViewProps = z.infer<typeof NotebookViewPropsSchema>;
