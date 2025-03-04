import { supabase } from "./supabase";
import type { Notebook } from "../types/notebook";
import type { ChatMessage, ChatSession } from "../types/chat";
import { addNotebookToFolder } from "./folderService";

/**
 * Create a new notebook for a user
 */
export async function createNotebook(
  userId: string,
  title: string,
  description?: string,
): Promise<{ success: boolean; data?: Notebook; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("notebooks")
      .insert([
        {
          user_id: userId,
          title,
          description,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating notebook:", error);
    return { success: false, error };
  }
}

/**
 * Get all notebooks for a user
 */
export async function getUserNotebooks(
  userId: string,
): Promise<{ success: boolean; data?: Notebook[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("notebooks")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return { success: false, error };
  }
}

/**
 * Get a specific notebook by ID
 */
export async function getNotebook(
  notebookId: string,
): Promise<{ success: boolean; data?: Notebook; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("notebooks")
      .select("*")
      .eq("id", notebookId)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching notebook:", error);
    return { success: false, error };
  }
}

/**
 * Create a new chat session in a notebook
 */
export async function createChatSession(
  notebookId: string,
  userId: string,
  title: string = "New Chat",
): Promise<{ success: boolean; data?: ChatSession; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([
        {
          notebook_id: notebookId,
          user_id: userId,
          title,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error creating chat session:", error);
    return { success: false, error };
  }
}

/**
 * Get all chat sessions for a notebook
 */
export async function getNotebookChatSessions(
  notebookId: string,
): Promise<{ success: boolean; data?: ChatSession[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("notebook_id", notebookId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return { success: false, error };
  }
}

/**
 * Send a message in a chat session
 */
export async function sendChatMessage(
  chatSessionId: string,
  notebookId: string,
  userId: string,
  content: string,
  isUser: boolean = true,
): Promise<{ success: boolean; data?: ChatMessage; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          chat_session_id: chatSessionId,
          notebook_id: notebookId,
          user_id: userId,
          content,
          is_user: isUser,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error };
  }
}

/**
 * Get all messages for a chat session
 */
export async function getChatMessages(
  chatSessionId: string,
): Promise<{ success: boolean; data?: ChatMessage[]; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", chatSessionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error };
  }
}

/**
 * Delete a chat session and move its messages to deleted_chat_messages table
 */
export async function deleteChatSession(
  chatSessionId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    // Start a transaction using supabase functions
    const { error: functionError } = await supabase.rpc("delete_chat_session", {
      session_id: chatSessionId,
    });

    if (functionError) {
      throw functionError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return { success: false, error };
  }
}

/**
 * Update a chat session's title
 */
export async function updateChatSessionTitle(
  chatSessionId: string,
  newTitle: string,
): Promise<{ success: boolean; data?: ChatSession; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ title: newTitle })
      .eq("id", chatSessionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error updating chat session title:", error);
    return { success: false, error };
  }
}

/**
 * Create a new notebook for a user, optionally assigning it to a folder
 */
export async function createNotebookWithFolder(
  userId: string,
  title: string,
  description?: string,
  folderId?: string,
): Promise<{ success: boolean; data?: Notebook; error?: any }> {
  try {
    // Create the notebook
    const notebookResult = await createNotebook(userId, title, description);

    if (!notebookResult.success || !notebookResult.data) {
      return notebookResult;
    }

    // If a folder was specified, add the notebook to it
    if (folderId) {
      const folderResult = await addNotebookToFolder(
        folderId,
        notebookResult.data.id,
      );

      if (!folderResult.success) {
        console.error("Failed to add notebook to folder:", folderResult.error);
        // We don't fail the whole operation if folder assignment fails
        // The notebook was still created
      }
    }

    return notebookResult;
  } catch (error) {
    console.error("Error creating notebook with folder:", error);
    return { success: false, error };
  }
}

/**
 * Update an existing notebook
 */
export async function updateNotebook(
  notebookId: string,
  updates: {
    title?: string;
    description?: string;
  },
): Promise<{ success: boolean; data?: Notebook; error?: any }> {
  try {
    const { data, error } = await supabase
      .from("notebooks")
      .update(updates)
      .eq("id", notebookId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error updating notebook:", error);
    return { success: false, error };
  }
}

/**
 * Update a notebook and its folder assignment
 */
export async function updateNotebookWithFolder(
  notebookId: string,
  updates: {
    title?: string;
    description?: string;
  },
  folderId?: string,
): Promise<{ success: boolean; data?: Notebook; error?: any }> {
  try {
    // First update the notebook details
    const notebookResult = await updateNotebook(notebookId, updates);

    if (!notebookResult.success || !notebookResult.data) {
      return notebookResult;
    }

    // Handle folder assignment
    if (folderId) {
      // First remove from any existing folders
      await supabase
        .from("folder_notebooks")
        .delete()
        .eq("notebook_id", notebookId);

      // Then add to the new folder
      const { error: folderError } = await supabase
        .from("folder_notebooks")
        .insert({
          folder_id: folderId,
          notebook_id: notebookId,
        });

      if (folderError) {
        console.error("Failed to update notebook folder:", folderError);
        // We don't fail the whole operation if folder assignment fails
      }
    } else {
      // If no folder specified, remove from all folders (make unorganized)
      await supabase
        .from("folder_notebooks")
        .delete()
        .eq("notebook_id", notebookId);
    }

    return notebookResult;
  } catch (error) {
    console.error("Error updating notebook with folder:", error);
    return { success: false, error };
  }
}
