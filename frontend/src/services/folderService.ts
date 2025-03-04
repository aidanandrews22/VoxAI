import { supabase } from "./supabase";
import type { Folder, Notebook, FolderNotebook } from "./supabase";

/**
 * Create a new folder for a user
 */
export async function createFolder(
  userId: string,
  title: string,
  description?: string,
  parentFolderId?: string,
): Promise<{ success: boolean; data?: Folder; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folders")
      .insert([
        {
          user_id: userId,
          title,
          description,
          parent_folder_id: parentFolderId || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error };
  }
}

/**
 * Get all root folders for a user (folders with no parent)
 */
export async function getUserRootFolders(
  userId: string,
): Promise<{ success: boolean; data?: Folder[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .is("parent_folder_id", null)
      .order("title", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching root folders:", error);
    return { success: false, error };
  }
}

/**
 * Get all child folders for a parent folder
 */
export async function getChildFolders(
  parentFolderId: string,
): Promise<{ success: boolean; data?: Folder[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("parent_folder_id", parentFolderId)
      .order("title", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching child folders:", error);
    return { success: false, error };
  }
}

/**
 * Get all folders and their nested children for a user
 * This recursively builds the folder hierarchy
 */
export async function getUserFoldersHierarchy(
  userId: string,
): Promise<{ success: boolean; data?: Folder[]; error?: any }> {
  try {
    // First get all user's folders
    const { data: allFolders, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", userId)
      .order("title", { ascending: true });

    if (error) {
      throw error;
    }

    if (!allFolders || allFolders.length === 0) {
      return { success: true, data: [] };
    }

    // Build the folder tree
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // First pass: create a map of all folders
    allFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [], notebooks: [] });
    });

    // Second pass: build the hierarchy
    allFolders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id)!;

      if (folder.parent_folder_id === null) {
        // This is a root folder
        rootFolders.push(folderWithChildren);
      } else {
        // This is a child folder
        const parentFolder = folderMap.get(folder.parent_folder_id);
        if (parentFolder) {
          if (!parentFolder.children) {
            parentFolder.children = [];
          }
          parentFolder.children.push(folderWithChildren);
        }
      }
    });

    return { success: true, data: rootFolders };
  } catch (error) {
    console.error("Error fetching folder hierarchy:", error);
    return { success: false, error };
  }
}

/**
 * Get notebooks in a specific folder
 */
export async function getNotebooksInFolder(
  folderId: string,
): Promise<{ success: boolean; data?: Notebook[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folder_notebooks")
      .select("notebook_id, notebooks:notebook_id(*)")
      .eq("folder_id", folderId);

    if (error) {
      throw error;
    }

    // Extract the notebook data from the join result
    // The notebooks property is actually a single object, not an array
    const notebooks = data.map(
      (item) => item.notebooks,
    ) as unknown as Notebook[];

    return { success: true, data: notebooks };
  } catch (error) {
    console.error("Error fetching notebooks in folder:", error);
    return { success: false, error };
  }
}

/**
 * Add a notebook to a folder
 */
export async function addNotebookToFolder(
  folderId: string,
  notebookId: string,
): Promise<{ success: boolean; data?: FolderNotebook; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folder_notebooks")
      .insert([
        {
          folder_id: folderId,
          notebook_id: notebookId,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error adding notebook to folder:", error);
    return { success: false, error };
  }
}

/**
 * Remove a notebook from a folder
 */
export async function removeNotebookFromFolder(
  folderId: string,
  notebookId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from("folder_notebooks")
      .delete()
      .eq("folder_id", folderId)
      .eq("notebook_id", notebookId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing notebook from folder:", error);
    return { success: false, error };
  }
}

/**
 * Update a folder's details
 */
export async function updateFolder(
  folderId: string,
  updates: {
    title?: string;
    description?: string;
    parent_folder_id?: string | null;
  },
): Promise<{ success: boolean; data?: Folder; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folders")
      .update(updates)
      .eq("id", folderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error updating folder:", error);
    return { success: false, error };
  }
}

/**
 * Delete a folder
 * Note: This will cascade delete all child folders and folder-notebook relationships
 * due to the foreign key constraints in the database
 */
export async function deleteFolder(
  folderId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return { success: false, error };
  }
}

/**
 * Get all folders a notebook belongs to
 */
export async function getNotebookFolders(
  notebookId: string,
): Promise<{ success: boolean; data?: Folder[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("folder_notebooks")
      .select("folder_id, folders:folder_id(*)")
      .eq("notebook_id", notebookId);

    if (error) {
      throw error;
    }

    // Extract the folder data from the join result
    // The folders property is actually a single object, not an array
    const folders = data.map((item) => item.folders) as unknown as Folder[];

    return { success: true, data: folders };
  } catch (error) {
    console.error("Error fetching notebook folders:", error);
    return { success: false, error };
  }
}

/**
 * Get all notebooks for a user that are not in any folder (unorganized)
 */
export async function getUnorganizedNotebooks(
  userId: string,
): Promise<{ success: boolean; data?: Notebook[]; error?: any }> {
  try {
    // Get all notebooks for the user
    const { data: allNotebooks, error: notebooksError } = await supabase
      .from("notebooks")
      .select("*")
      .eq("user_id", userId);

    if (notebooksError) {
      throw notebooksError;
    }

    if (!allNotebooks || allNotebooks.length === 0) {
      return { success: true, data: [] };
    }

    // Get all notebooks that are in folders
    const { data: organizedNotebooks, error: organizedError } = await supabase
      .from("folder_notebooks")
      .select("notebook_id")
      .in(
        "notebook_id",
        allNotebooks.map((n) => n.id),
      );

    if (organizedError) {
      throw organizedError;
    }

    // Create a set of organized notebook IDs for quick lookup
    const organizedIds = new Set(
      organizedNotebooks?.map((n) => n.notebook_id) || [],
    );

    // Filter for notebooks that are not in the organized set
    const unorganizedNotebooks = allNotebooks.filter(
      (notebook) => !organizedIds.has(notebook.id),
    );

    return { success: true, data: unorganizedNotebooks };
  } catch (error) {
    console.error("Error fetching unorganized notebooks:", error);
    return { success: false, error };
  }
}

/**
 * Get notebooks in a specific folder and all its nested subfolders
 */
export async function getNotebooksInFolderRecursive(
  folderId: string,
): Promise<{ success: boolean; data?: Notebook[]; error?: any }> {
  try {
    // First, get the folder hierarchy to find all nested folder IDs
    const { data: allFolders, error: foldersError } = await supabase
      .from("folders")
      .select("*");

    if (foldersError) {
      throw foldersError;
    }

    // Build a map of parent to children
    const folderMap = new Map<string, string[]>();
    allFolders?.forEach((folder) => {
      if (folder.parent_folder_id) {
        if (!folderMap.has(folder.parent_folder_id)) {
          folderMap.set(folder.parent_folder_id, []);
        }
        folderMap.get(folder.parent_folder_id)?.push(folder.id);
      }
    });

    // Recursively collect all subfolder IDs
    const collectSubfolderIds = (parentId: string): string[] => {
      const result: string[] = [parentId];
      const children = folderMap.get(parentId) || [];

      children.forEach((childId) => {
        result.push(...collectSubfolderIds(childId));
      });

      return result;
    };

    // Get all folder IDs including the parent and all nested children
    const allFolderIds = collectSubfolderIds(folderId);

    // Get notebooks from all these folders
    const { data, error } = await supabase
      .from("folder_notebooks")
      .select("notebook_id, notebooks:notebook_id(*)")
      .in("folder_id", allFolderIds);

    if (error) {
      throw error;
    }

    // Extract the notebook data from the join result and remove duplicates
    const notebookMap = new Map<string, Notebook>();
    data.forEach((item) => {
      // The notebooks property is actually a single object, not an array
      const notebook = item.notebooks as unknown as Notebook;
      if (notebook && !notebookMap.has(notebook.id)) {
        notebookMap.set(notebook.id, notebook);
      }
    });

    return { success: true, data: Array.from(notebookMap.values()) };
  } catch (error) {
    console.error("Error fetching notebooks in folder recursively:", error);
    return { success: false, error };
  }
}

/**
 * Check if a folder is a parent folder
 */
export async function isParentFolder(folderId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("folders")
      .select("has_children")
      .eq("id", folderId)
      .single();
    return !!data?.has_children;
  } catch {
    return false;
  }
}
