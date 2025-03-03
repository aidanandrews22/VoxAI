import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Store the authenticated client in memory
let authenticatedClient: any = null;
let lastToken: string | null = null;

/**
 * Creates a Supabase client with the Clerk JWT token
 * This is necessary for Row Level Security policies to work correctly
 * Uses memoization to avoid creating multiple clients with the same token
 */
export async function createSupabaseClientWithToken(token: string) {
  if (!token) return supabase;
  
  // If we already have a client with this token, return it
  if (authenticatedClient && token === lastToken) {
    return authenticatedClient;
  }
  
  console.log('Creating Supabase client with token');
  
  // Create a new client with the token
  authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  
  // Store the token for future reference
  lastToken = token;
  
  return authenticatedClient;
}

// Function to sync Clerk user with Supabase
export async function syncUserWithSupabase(userId: string, email: string) {
  // Check if user exists in our users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  // If user doesn't exist, create them
  if (!existingUser) {
    await supabase.from('users').insert([
      {
        id: userId,
        email,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return userId;
}

// Database types
export type Notebook = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // Virtual properties for UI state
  isExpanded?: boolean;
  children?: Folder[];
  notebooks?: Notebook[];
};

export type FolderNotebook = {
  folder_id: string;
  notebook_id: string;
  created_at: string;
};

export type NotebookFile = {
  id: string;
  notebook_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  chat_session_id: string;
  notebook_id: string;
  user_id: string;
  content: string;
  is_user: boolean;
  created_at: string;
};

export type ChatSession = {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  created_at: string;
}; 