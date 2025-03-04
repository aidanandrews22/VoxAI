import { supabase, withAuthentication } from "./supabase";
import type { NotebookFile } from "../types/notebook";

/**
 * Uploads a file to Supabase storage and adds a record to the notebook_files table
 * Then sends the file to the ingest API endpoint for processing
 * @param file The file to upload
 * @param notebookId The ID of the notebook to associate the file with
 * @param userId The ID of the user uploading the file
 * @param getSupabaseClient Function to get an authenticated Supabase client
 * @param refreshToken Function to refresh the authentication token
 */
export async function uploadFile(
  file: File,
  isNote: boolean = false,
  notebookId: string,
  userId: string,
  getSupabaseClient?: () => Promise<any>,
  refreshToken?: () => Promise<any>
): Promise<{
  success: boolean;
  data?: NotebookFile;
  error?: any;
  isProcessing?: boolean;
  message?: string;
  fileType?: string;
}> {
  // If we have getSupabaseClient and refreshToken functions, use withAuthentication
  // Otherwise fall back to default supabase client
  if (getSupabaseClient && refreshToken) {
    return withAuthentication(
      async (client) => {
        return uploadFileInternal(file, isNote, notebookId, userId, client);
      },
      getSupabaseClient,
      refreshToken,
      3 // Allow up to 3 retries for file uploads
    );
  } else {
    // Legacy fallback path
    return uploadFileInternal(file, isNote, notebookId, userId, supabase);
  }
}

/**
 * Internal implementation of file upload
 */
async function uploadFileInternal(
  file: File,
  isNote: boolean,
  notebookId: string,
  userId: string,
  supabaseClient: any
): Promise<{
  success: boolean;
  data?: NotebookFile;
  error?: any;
  isProcessing?: boolean;
  message?: string;
  fileType?: string;
}> {
  try {
    console.log("Starting file upload with user ID:", userId);

    // Format the storage path correctly for our bucket policies
    const filePath = `${userId}/${notebookId}/${Date.now()}_${file.name}`;

    console.log("Uploading to path:", filePath);

    // Upload the file to Supabase storage
    const { error: uploadError } = await supabaseClient.storage
      .from("Vox")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      
      // Return specific error for unsupported file type
      if (uploadError.message && uploadError.message.includes("content type")) {
        return {
          success: false,
          error: `Unsupported file type: ${file.type}`,
          fileType: file.type,
        };
      }
      throw uploadError;
    }

    // Get the public URL for the file
    const { data: publicUrlData } = supabaseClient.storage
      .from("Vox")
      .getPublicUrl(filePath);

    if (!publicUrlData) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    console.log("File uploaded successfully, creating database record");

    // Create a record in the notebook_files table
    const fileData: Omit<NotebookFile, "id" | "created_at"> = {
      notebook_id: notebookId,
      user_id: userId, 
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      is_note: isNote,
    };

    const { data: fileRecord, error: dbError } = await supabaseClient
      .from("notebook_files")
      .insert([fileData])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw dbError;
    }

    console.log("Database record created, sending to ingest API");

    // Return success immediately after database record is created
    return {
      success: true,
      data: fileRecord,
      isProcessing: true,
      message: "File uploaded successfully. Processing has started.",
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error };
  }
}

/**
 * Fetches all files for a notebook
 * @param notebookId The ID of the notebook to fetch files for
 * @param getSupabaseClient Function to get an authenticated Supabase client
 * @param refreshToken Function to refresh the authentication token
 */
export async function getNotebookFiles(
  notebookId: string,
  getSupabaseClient?: () => Promise<any>,
  refreshToken?: () => Promise<any>
): Promise<{ success: boolean; data?: NotebookFile[]; error?: any }> {
  // If we have getSupabaseClient and refreshToken functions, use withAuthentication
  if (getSupabaseClient && refreshToken) {
    try {
      const data = await withAuthentication(
        async (client) => {
          const { data, error } = await client
            .from("notebook_files")
            .select("*")
            .eq("notebook_id", notebookId)
            .order("created_at", { ascending: false });
  
          if (error) throw error;
          return data;
        },
        getSupabaseClient,
        refreshToken,
        2
      );
      
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching notebook files:", error);
      return { success: false, error };
    }
  } else {
    // Legacy fallback path
    try {
      const { data, error } = await supabase
        .from("notebook_files")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: false });
  
      if (error) {
        throw error;
      }
  
      return { success: true, data };
    } catch (error) {
      console.error("Error fetching notebook files:", error);
      return { success: false, error };
    }
  }
}

/**
 * Deletes a file from Supabase storage and the notebook_files table
 * @param fileId The ID of the file to delete
 * @param getSupabaseClient Function to get an authenticated Supabase client
 * @param refreshToken Function to refresh the authentication token
 */
export async function deleteFile(
  fileId: string,
  getSupabaseClient?: () => Promise<any>,
  refreshToken?: () => Promise<any>
): Promise<{ success: boolean; error?: any }> {
  // If we have getSupabaseClient and refreshToken functions, use withAuthentication
  if (getSupabaseClient && refreshToken) {
    try {
      await withAuthentication(
        async (client) => {
          return deleteFileInternal(fileId, client);
        },
        getSupabaseClient,
        refreshToken,
        2
      );
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting file with authentication:", error);
      return { success: false, error };
    }
  } else {
    // Legacy fallback path
    try {
      await deleteFileInternal(fileId, supabase);
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, error };
    }
  }
}

/**
 * Internal implementation of file deletion
 */
async function deleteFileInternal(
  fileId: string,
  supabaseClient: any
): Promise<void> {
  // First get the file details to know what to delete from storage
  const { data: fileData, error: fetchError } = await supabaseClient
    .from("notebook_files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (fetchError) {
    console.error("Error fetching file data:", fetchError);
    throw fetchError;
  }

  if (!fileData) {
    console.error("No file data found");
    throw new Error("File not found");
  }

  console.log("Retrieved file data for deletion:", fileData);

  // Delete from storage first
  const { error: storageError } = await supabaseClient.storage
    .from("Vox")
    .remove([fileData.file_path]);

  if (storageError) {
    console.error("Error deleting from storage:", storageError);
    throw storageError;
  }

  // Now delete from database
  const { error: dbError } = await supabaseClient
    .from("notebook_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    console.error("Error deleting from database:", dbError);
    throw dbError;
  }
}

/**
 * Call the API to delete embeddings for a file
 * @param fileId The Pinecone ID to delete
 */
async function deleteEmbeddings(fileId: string): Promise<void> {
  try {
    console.log("[DEBUG] Starting embeddings deletion for file:", fileId);

    const response = await fetch(
      "http://localhost:8000/api/v1/files/delete-by-pinecone-id",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      console.log("[DEBUG] Successfully deleted embeddings:", result.message);
    } else {
      console.error(
        "[DEBUG] Failed to delete embeddings:",
        result.detail || result.message,
      );
    }
  } catch (error) {
    console.error("[DEBUG] Error calling delete embeddings API:", error);
  } finally {
    console.log("[DEBUG] Completed embeddings deletion process for:", fileId);
  }
}

/**
 * Initiates processing of a file that has been uploaded to Supabase
 * @param fileId The ID of the file to process
 */
export async function processFile(
  fileId: string,
): Promise<{ success: boolean; message?: string; error?: any }> {
  try {
    const ingestResponse = await fetch(
      "http://localhost:8000/api/v1/files/ingest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_id: fileId,
        }),
      },
    );

    const ingestResult = await ingestResponse.json();
    console.log("Ingest API response:", ingestResult);

    if (!ingestResult.success) {
      console.warn(
        "File processing might not be complete:",
        ingestResult.message,
      );
      return {
        success: false,
        error: ingestResult.message || "File processing failed",
        message: "File was uploaded but processing failed",
      };
    }

    // Look for the successful processing log in the response
    if (
      ingestResult.logs &&
      ingestResult.logs.includes("processed successfully")
    ) {
      console.log("File processed successfully:", ingestResult.logs);
      return {
        success: true,
        message: "File processed successfully",
      };
    }

    console.log("File ingested successfully", ingestResult);
    return { success: true, message: "File processing has started" };
  } catch (error) {
    console.error("Error calling ingest API:", error);
    return {
      success: false,
      error: "File processing failed. Please try again later.",
    };
  }
}
