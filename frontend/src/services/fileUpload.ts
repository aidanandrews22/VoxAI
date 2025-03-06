import { supabase } from "./supabase";
import type { NotebookFile } from "../types/notebook";

/**
 * Uploads a file to Supabase storage and adds a record to the notebook_files table
 * Then sends the file to the ingest API endpoint for processing
 * @param file The file to upload
 * @param notebookId The ID of the notebook to associate the file with
 * @param userId The ID of the user uploading the file
 * @param supabaseClient Optional authenticated Supabase client
 * @param retryCount Number of times to retry on auth errors
 */
export async function uploadFile(
  file: File,
  isNote: boolean = false,
  notebookId: string,
  userId: string,
  supabaseClient = supabase,
  retryCount: number = 0,
): Promise<{
  success: boolean;
  data?: NotebookFile;
  error?: any;
  isProcessing?: boolean;
  message?: string;
  fileType?: string;
  shouldRetryWithNewToken?: boolean;
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
      
      // Handle JWT expired errors specifically
      if (
        (uploadError as any).statusCode === '403' && 
        uploadError.message === 'jwt expired' && 
        retryCount < 2
      ) {
        console.log(`JWT expired during upload, attempt ${retryCount + 1}/3`);
        return {
          success: false,
          error: "Authentication token expired. Will retry with new token.",
          shouldRetryWithNewToken: true
        };
      }
      
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
      user_id: userId, // Keep the original userId for database records
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
      
      // Handle JWT expired errors for database operations
      if (dbError.code === 'PGRST301' && retryCount < 2) {
        console.log(`JWT expired during database insert, attempt ${retryCount + 1}/3`);
        return {
          success: false,
          error: "Authentication token expired. Will retry with new token.",
          shouldRetryWithNewToken: true
        };
      }
      
      throw dbError;
    }

    console.log("Database record created, sending to ingest API");

    // Return success immediately after database record is created
    // The isProcessing flag is set to true to indicate that processing is ongoing
    return {
      success: true,
      data: fileRecord,
      isProcessing: true,
      message: "File uploaded successfully. Processing has started.",
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Check for authentication-related errors
    const errorStr = String(error);
    if ((errorStr.includes('401') || errorStr.includes('403') || 
         errorStr.includes('jwt') || errorStr.includes('unauthorized')) && 
        retryCount < 2) {
      return {
        success: false,
        error: "Authentication error. Will retry with new token.",
        shouldRetryWithNewToken: true
      };
    }
    
    return { success: false, error };
  }
}

/**
 * Fetches all files for a notebook
 * @param notebookId The ID of the notebook to fetch files for
 * @param supabaseClient Optional authenticated Supabase client
 */
export async function getNotebookFiles(
  notebookId: string,
  supabaseClient = supabase,
): Promise<{ success: boolean; data?: NotebookFile[]; error?: any }> {
  try {
    const { data, error } = await supabaseClient
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

/**
 * Deletes a file from Supabase storage and the notebook_files table
 * @param fileId The ID of the file to delete
 * @param supabaseClient Optional authenticated Supabase client
 * @param retryCount Number of times to retry on auth errors
 */
export async function deleteFile(
  fileId: string,
  supabaseClient = supabase,
  retryCount: number = 0,
): Promise<{ success: boolean; error?: any; shouldRetryWithNewToken?: boolean }> {
  try {
    // First get the file details to know what to delete from storage
    const { data: fileData, error: fetchError } = await supabaseClient
      .from("notebook_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError) {
      console.error("Error fetching file data:", fetchError);
      
      // Handle JWT expired errors for database operations
      if ((fetchError.code === 'PGRST301' || fetchError.message?.includes('JWT')) && retryCount < 2) {
        console.log(`JWT expired during file fetch for deletion, attempt ${retryCount + 1}/3`);
        return {
          success: false,
          error: "Authentication token expired. Will retry with new token.",
          shouldRetryWithNewToken: true
        };
      }
      
      return { success: false, error: fetchError };
    }

    if (!fileData) {
      console.error("No file data found");
      return { success: false, error: "File not found" };
    }

    console.log("Retrieved file data for deletion:", fileData);

    // Delete from storage first
    const { error: storageError } = await supabaseClient.storage
      .from("Vox")
      .remove([fileData.file_path]);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
      
      // Handle JWT expired errors specifically
      if (
        (storageError as any).statusCode === '403' && 
        storageError.message === 'jwt expired' && 
        retryCount < 2
      ) {
        console.log(`JWT expired during storage deletion, attempt ${retryCount + 1}/3`);
        return {
          success: false,
          error: "Authentication token expired. Will retry with new token.",
          shouldRetryWithNewToken: true
        };
      }
      
      // If it's not an auth error, just return the error
      return { success: false, error: storageError };
    }

    // Now delete from database
    const { error: dbError } = await supabaseClient
      .from("notebook_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      console.error("Error deleting from database:", dbError);
      
      // Handle JWT expired errors for database operations
      if ((dbError.code === 'PGRST301' || dbError.message?.includes('JWT')) && retryCount < 2) {
        console.log(`JWT expired during database deletion, attempt ${retryCount + 1}/3`);
        return {
          success: false,
          error: "Authentication token expired. Will retry with new token.",
          shouldRetryWithNewToken: true
        };
      }
      
      return { success: false, error: dbError };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteFile:", error);
    
    // Check for authentication-related errors
    const errorStr = String(error);
    if ((errorStr.includes('401') || errorStr.includes('403') || 
         errorStr.includes('jwt') || errorStr.includes('unauthorized')) && 
        retryCount < 2) {
      return {
        success: false,
        error: "Authentication error. Will retry with new token.",
        shouldRetryWithNewToken: true
      };
    }
    
    return { success: false, error };
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

/**
 * Uploads and processes a file with retry logic and state management
 * @param file The file to upload
 * @param notebookId The ID of the notebook
 * @param userId The ID of the user
 * @param refreshTokenFn Function to refresh auth token
 * @param getClientFn Function to get Supabase client
 * @returns Result of the operation
 */
export async function uploadAndProcessFile(
  file: File,
  notebookId: string,
  userId: string,
  refreshTokenFn: () => Promise<void>,
  getClientFn: () => Promise<any>,
): Promise<{
  success: boolean,
  data?: NotebookFile,
  error?: any,
  tempId: string,
  isProcessing?: boolean,
  message?: string,
}> {
  // Create a temporary ID to track the uploading state
  const tempId = `temp-${Date.now()}`;
  
  // Function to handle file upload with retry logic
  const uploadWithRetry = async (retryCount = 0): Promise<any> => {
    try {
      // Get authenticated Supabase client - force refresh if retry
      const authClient = await (retryCount > 0 
        ? refreshTokenFn().then(() => getClientFn()) 
        : getClientFn());

      if (!authClient) {
        console.error("Failed to get authenticated Supabase client");
        throw new Error("Authentication error. Please try again or refresh the page.");
      }

      // Upload to Supabase
      const result = await uploadFile(
        file,
        false,
        notebookId,
        userId,
        authClient,
        retryCount
      );

      // If token expired and we should retry with a new token
      if (!result.success && result.shouldRetryWithNewToken && retryCount < 2) {
        console.log(`Retrying upload with refreshed token, attempt ${retryCount + 1}/3`);
        // Force refresh the token and retry
        await refreshTokenFn();
        return uploadWithRetry(retryCount + 1);
      }

      return result;
    } catch (err) {
      console.error(`Error uploading file (attempt ${retryCount + 1}/3):`, err);
      
      // If we haven't retried too many times and this looks like an auth error, retry
      const errorMsg = String(err).toLowerCase();
      if (retryCount < 2 && 
          (errorMsg.includes('jwt') || 
           errorMsg.includes('unauthorized') || 
           errorMsg.includes('403') || 
           errorMsg.includes('401'))) {
        console.log("Auth error detected, refreshing token and retrying...");
        await refreshTokenFn();
        return uploadWithRetry(retryCount + 1);
      }
      
      throw err;
    }
  };

  try {
    // Start upload with retry logic
    const result = await uploadWithRetry();

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to upload file",
        tempId,
        message: result.fileType 
          ? `Unsupported file type: ${result.fileType}. Please try a different file.`
          : result.error || "Failed to upload file"
      };
    }

    // Add the file to the files list with processing status
    const newFile: NotebookFile & { isProcessing?: boolean } = {
      ...result.data,
      isProcessing: result.isProcessing || false,
    };

    // Return success
    return {
      success: true,
      data: newFile,
      tempId,
      isProcessing: true,
      message: result.message || "File uploaded, AI is now processing..."
    };
  } catch (err) {
    console.error("Error uploading file:", err);
    return {
      success: false,
      error: "An error occurred while uploading the file",
      tempId,
      message: "Error uploading file"
    };
  }
}

/**
 * Deletes a file with retry logic for token refreshing
 * @param fileId The ID of the file to delete
 * @param refreshTokenFn Function to refresh auth token
 * @param getClientFn Function to get Supabase client
 * @returns Result of the delete operation
 */
export async function deleteFileWithRetry(
  fileId: string,
  refreshTokenFn: () => Promise<void>,
  getClientFn: () => Promise<any>,
): Promise<{ success: boolean, error?: any }> {
  // Function to handle file deletion with retry logic
  const deleteWithRetryInternal = async (retryCount = 0): Promise<any> => {
    try {
      // Get authenticated Supabase client - force refresh if retry
      const authClient = await (retryCount > 0 
        ? refreshTokenFn().then(() => getClientFn()) 
        : getClientFn());

      // If we couldn't get an authenticated client, show an error
      if (!authClient) {
        console.error("Authentication failed when trying to delete file");
        throw new Error("Authentication error. Please try again or refresh the page.");
      }

      console.log("Calling deleteFile service function");
      const result = await deleteFile(fileId, authClient, retryCount);
      console.log("deleteFile result:", result);

      // If token expired and we should retry with a new token
      if (!result.success && result.shouldRetryWithNewToken && retryCount < 2) {
        console.log(`Retrying deletion with refreshed token, attempt ${retryCount + 1}/3`);
        // Force refresh the token and retry
        await refreshTokenFn();
        return deleteWithRetryInternal(retryCount + 1);
      }

      return result;
    } catch (err) {
      console.error(`Error deleting file (attempt ${retryCount + 1}/3):`, err);
      
      // If we haven't retried too many times and this looks like an auth error, retry
      const errorMsg = String(err).toLowerCase();
      if (retryCount < 2 && 
          (errorMsg.includes('jwt') || 
           errorMsg.includes('unauthorized') || 
           errorMsg.includes('403') || 
           errorMsg.includes('401'))) {
        console.log("Auth error detected, refreshing token and retrying...");
        await refreshTokenFn();
        return deleteWithRetryInternal(retryCount + 1);
      }
      
      throw err;
    }
  };

  try {
    // Start deletion with retry logic
    return await deleteWithRetryInternal();
  } catch (err) {
    console.error("Error in deleteFileWithRetry:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error deleting file" 
    };
  }
}
