import { supabase } from './supabase';
import type { NotebookFile } from './supabase';

/**
 * Uploads a file to Supabase storage and adds a record to the notebook_files table
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
): Promise<{ success: boolean; data?: NotebookFile; error?: any }> {
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

    return { success: true, data: fileRecord };
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
 * @param fileId The ID of the file to delete
 * @param supabaseClient Optional authenticated Supabase client
 */
export async function deleteFile(
  fileId: string,
  supabaseClient = supabase
): Promise<{ success: boolean; error?: any }> {
  try {
    // First get the file to know its path
    const { data: file, error: fetchError } = await supabaseClient
      .from('notebook_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabaseClient.storage
      .from('Vox')
      .remove([file.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue anyway to clean up the database record
    }

    // Delete the record
    const { error: deleteError } = await supabaseClient
      .from('notebook_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      throw deleteError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
} 