import { supabase } from './supabase';
import type { NotebookFile } from '../types/notebook';

/**
 * Uploads a file to Supabase storage and adds a record to the notebook_files table
 * Then sends the file to the ingest API endpoint for processing
 * @param file The file to upload
 * @param notebookId The ID of the notebook to associate the file with
 * @param userId The ID of the user uploading the file
 * @param supabaseClient Optional authenticated Supabase client
 */
export async function uploadFile(
  file: File,
  notebookId: string,
  userId: string,
  supabaseClient = supabase
): Promise<{ 
  success: boolean; 
  data?: NotebookFile; 
  error?: any; 
  isProcessing?: boolean;
  message?: string;
  fileType?: string;
}> {
  try {
    console.log('Starting file upload with user ID:', userId);
    
    // Format the storage path correctly for our bucket policies
    const filePath = `${userId}/${notebookId}/${Date.now()}_${file.name}`
    
    console.log('Uploading to path:', filePath);

    // Upload the file to Supabase storage
    const { error: uploadError } = await supabaseClient.storage
      .from('Vox')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Return specific error for unsupported file type
      if (uploadError.message && uploadError.message.includes('content type')) {
        return { 
          success: false, 
          error: `Unsupported file type: ${file.type}`, 
          fileType: file.type 
        };
      }
      throw uploadError;
    }

    // Get the public URL for the file
    const { data: publicUrlData } = supabaseClient.storage
      .from('Vox')
      .getPublicUrl(filePath);

    if (!publicUrlData) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    console.log('File uploaded successfully, creating database record');

    // Create a record in the notebook_files table
    const fileData: Omit<NotebookFile, 'id' | 'created_at'> = {
      notebook_id: notebookId,
      user_id: userId, // Keep the original userId for database records
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    };

    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('notebook_files')
      .insert([fileData])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    console.log('Database record created, sending to ingest API');

    // Return success immediately after database record is created
    // The isProcessing flag is set to true to indicate that processing is ongoing
    return { 
      success: true, 
      data: fileRecord, 
      isProcessing: true, 
      message: 'File uploaded successfully. Processing has started.' 
    };
  } catch (error) {
    console.error('Error uploading file:', error);
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
  supabaseClient = supabase
): Promise<{ success: boolean; data?: NotebookFile[]; error?: any }> {
  try {
    const { data, error } = await supabaseClient
      .from('notebook_files')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching notebook files:', error);
    return { success: false, error };
  }
}

/**
 * Deletes a file from storage and removes its record from the database
 * Then calls API to delete embeddings from vector database
 * @param fileId The ID of the file to delete
 * @param supabaseClient Optional authenticated Supabase client
 */
export async function deleteFile(
  fileId: string,
  supabaseClient = supabase
): Promise<{ success: boolean; error?: any }> {
  console.log('[DEBUG] deleteFile function starting for:', fileId);
  
  try {
    // First get the file to know its path
    console.log('[DEBUG] Fetching file data from Supabase');
    const { data: file, error: fetchError } = await supabaseClient
      .from('notebook_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) {
      console.error('[DEBUG] Error fetching file data:', fetchError);
      throw fetchError;
    }
    
    console.log('[DEBUG] File data retrieved:', file.file_name);

    // Get the pinecone_id from file_metadata table
    console.log('[DEBUG] Fetching file metadata (pinecone_id)');
    const { data: fileMetadata, error: metadataError } = await supabaseClient
      .from('file_metadata')
      .select('pinecone_id')
      .eq('file_id', fileId)
      .single();

    // Store pinecone_id to use after deletion
    const pineconeId = fileMetadata?.pinecone_id;
    console.log('[DEBUG] Retrieved pinecone_id:', pineconeId);
    
    if (metadataError) {
      console.warn('[DEBUG] Could not find pinecone_id for file:', metadataError);
      // Continue with deletion even if we couldn't get the pinecone_id
    }

    // Delete from storage
    console.log('[DEBUG] Deleting file from storage');
    const { error: storageError } = await supabaseClient.storage
      .from('Vox')
      .remove([file.file_path]);

    if (storageError) {
      console.error('[DEBUG] Error deleting from storage:', storageError);
      // Continue anyway to clean up the database record
    } else {
      console.log('[DEBUG] Successfully deleted file from storage');
    }

    // Delete the record
    console.log('[DEBUG] Deleting file record from database');
    const { error: deleteError } = await supabaseClient
      .from('notebook_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('[DEBUG] Error deleting file record:', deleteError);
      throw deleteError;
    }
    
    console.log('[DEBUG] Successfully deleted file record from database');

    // After successful deletion from Supabase, delete embeddings from vector DB if we have a pinecone_id
    // This will be handled asynchronously without awaiting to prevent UI blocking
    if (pineconeId) {
      console.log('[DEBUG] Starting embeddings deletion process (asynchronously)');
      // Call API to delete embeddings but don't await it as it's not critical for UI state
      // We'll handle errors inside the function instead
      setTimeout(() => {
        deleteEmbeddings(pineconeId)
          .then(() => console.log('[DEBUG] Async embeddings deletion completed successfully'))
          .catch(error => console.error('[DEBUG] Async error during embeddings deletion:', error));
      }, 100);
    } else {
      console.log('[DEBUG] No pinecone_id found for file, skipping embeddings deletion');
    }

    console.log('[DEBUG] File deletion process completed successfully for:', fileId);
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] Error in deleteFile function:', error);
    return { success: false, error };
  }
}

/**
 * Call the API to delete embeddings for a file
 * @param fileId The Pinecone ID to delete
 */
async function deleteEmbeddings(fileId: string): Promise<void> {
  try {
    console.log('[DEBUG] Starting embeddings deletion for file:', fileId);
    
    const response = await fetch('http://localhost:8000/api/v1/files/delete-by-pinecone-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[DEBUG] Successfully deleted embeddings:', result.message);
    } else {
      console.error('[DEBUG] Failed to delete embeddings:', result.detail || result.message);
    }
  } catch (error) {
    console.error('[DEBUG] Error calling delete embeddings API:', error);
  } finally {
    console.log('[DEBUG] Completed embeddings deletion process for:', fileId);
  }
}

/**
 * Initiates processing of a file that has been uploaded to Supabase
 * @param fileId The ID of the file to process
 */
export async function processFile(
  fileId: string
): Promise<{ success: boolean; message?: string; error?: any }> {
  try {
    const ingestResponse = await fetch('http://localhost:8000/api/v1/files/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
      }),
    });

    const ingestResult = await ingestResponse.json();
    console.log('Ingest API response:', ingestResult);

    if (!ingestResult.success) {
      console.warn('File processing might not be complete:', ingestResult.message);
      return { 
        success: false, 
        error: ingestResult.message || 'File processing failed', 
        message: 'File was uploaded but processing failed' 
      };
    }

    // Look for the successful processing log in the response
    if (ingestResult.logs && ingestResult.logs.includes('processed successfully')) {
      console.log('File processed successfully:', ingestResult.logs);
      return { 
        success: true, 
        message: 'File processed successfully' 
      };
    }
    
    console.log('File ingested successfully', ingestResult);
    return { success: true, message: 'File processing has started' };
  } catch (error) {
    console.error('Error calling ingest API:', error);
    return { 
      success: false, 
      error: 'File processing failed. Please try again later.' 
    };
  }
} 