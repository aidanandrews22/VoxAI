import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { syncUserWithSupabase, createSupabaseClientWithToken } from '../services/supabase';

interface UserContextType {
  supabaseUserId: string | null;
  isLoading: boolean;
  error: Error | null;
  getSupabaseClient: () => Promise<any>;
}

const UserContext = createContext<UserContextType>({
  supabaseUserId: null,
  isLoading: true,
  error: null,
  getSupabaseClient: async () => null,
});

export const useSupabaseUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { getToken } = useAuth();
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isClerkLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Sync Clerk user with Supabase
        const userId = await syncUserWithSupabase(
          user.id,
          user.primaryEmailAddress?.emailAddress || ''
        );
        setSupabaseUserId(userId);
        console.log('Synced user with Supabase:', supabaseUserId);
        console.log('User ID:', user.id);
        setError(null);
      } catch (err) {
        console.error('Error syncing user with Supabase:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [user, isClerkLoaded]);

  // Function to get a Supabase client with the user's token
  const getSupabaseClient = async () => {
    if (!user) return null;
    
    try {
      // Get JWT token from Clerk
      // Note: You need to create a 'supabase' JWT template in the Clerk Dashboard
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('No token returned from Clerk');
        return null;
      }
      
      // Create a Supabase client with the token
      return await createSupabaseClientWithToken(token);
    } catch (err) {
      console.error('Error getting Supabase client:', err);
      return null;
    }
  };

  const value = {
    supabaseUserId,
    isLoading,
    error,
    getSupabaseClient,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
} 