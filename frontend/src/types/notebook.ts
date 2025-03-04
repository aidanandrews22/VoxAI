import { z } from "zod";

// NotebookFile schema with Zod
export const NotebookFileSchema = z.object({
  id: z.string().uuid(),
  notebook_id: z.string().uuid(),
  user_id: z.string(),
  file_name: z.string(),
  file_path: z.string(),
  file_type: z.string(),
  file_size: z.number().int().positive(),
  is_note: z.boolean(),
  created_at: z.string().datetime(),
});

// Type derived from the schema
export type NotebookFile = z.infer<typeof NotebookFileSchema>;

// Notebook schema with Zod
export const NotebookSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Type derived from the schema
export type Notebook = z.infer<typeof NotebookSchema>;

// Define FolderSchema type to handle circular reference
type FolderSchemaType = z.ZodObject<{
  id: z.ZodString;
  user_id: z.ZodString;
  parent_folder_id: z.ZodNullable<z.ZodString>;
  title: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
  created_at: z.ZodString;
  updated_at: z.ZodString;
  isExpanded: z.ZodOptional<z.ZodBoolean>;
  children: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodTypeAny>>>;
  notebooks: z.ZodOptional<z.ZodArray<typeof NotebookSchema>>;
}>;

// Folder schema with Zod
export const FolderSchema: FolderSchemaType = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  parent_folder_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Virtual properties for UI state
  isExpanded: z.boolean().optional(),
  children: z.array(z.lazy(() => FolderSchema)).optional(),
  notebooks: z.array(NotebookSchema).optional(),
});

// Type derived from the schema
export type Folder = z.infer<typeof FolderSchema>;

// FolderNotebook schema with Zod
export const FolderNotebookSchema = z.object({
  folder_id: z.string().uuid(),
  notebook_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

// Type derived from the schema
export type FolderNotebook = z.infer<typeof FolderNotebookSchema>;
