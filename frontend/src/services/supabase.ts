import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
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

  console.log("Creating Supabase client with token");

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
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  // If user doesn't exist, create them
  if (!existingUser) {
    await supabase.from("users").insert([
      {
        id: userId,
        email,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return userId;
}

/**
 * Helper function to execute a Supabase operation with automatic token refresh on auth errors
 * @param operation Function that takes a Supabase client and performs an operation
 * @param getClient Function to get the authenticated Supabase client
 * @param refreshToken Function to refresh the auth token
 * @param maxRetries Maximum number of retry attempts (default: 2)
 */
export async function withAuthentication<T>(
  operation: (client: any) => Promise<T>,
  getClient: () => Promise<any>,
  refreshToken: () => Promise<any>,
  maxRetries = 2
): Promise<T> {
  let retries = 0;
  let lastError: any = null;

  while (retries <= maxRetries) {
    try {
      // Get client (this will refresh the token if necessary)
      const client = await getClient();
      if (!client) {
        throw new Error("Could not get authenticated Supabase client");
      }

      // Perform the operation
      return await operation(client);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an authentication error
      const isAuthError = 
        error?.message?.includes('jwt expired') || 
        error?.message?.includes('JWT expired') ||
        error?.message?.includes('401') ||
        error?.message?.includes('403') ||
        error?.code === 'PGRST301' ||
        error?.statusCode === '401' ||
        error?.statusCode === '403';
      
      if (isAuthError && retries < maxRetries) {
        console.log(`Authentication error (attempt ${retries + 1}/${maxRetries}), refreshing token...`);
        
        // Force token refresh
        await refreshToken();
        retries++;
      } else {
        // Not an auth error or max retries reached, rethrow
        throw error;
      }
    }
  }
  
  // If we get here, we've exhausted our retries
  throw lastError;
}
