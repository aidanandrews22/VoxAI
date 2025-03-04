import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
  syncUserWithSupabase,
  createSupabaseClientWithToken,
} from "../services/supabase";

interface UserContextType {
  supabaseUserId: string | null;
  isLoading: boolean;
  error: Error | null;
  getSupabaseClient: () => Promise<any>;
  refreshSupabaseToken: () => Promise<any>;
}

const UserContext = createContext<UserContextType>({
  supabaseUserId: null,
  isLoading: true,
  error: null,
  getSupabaseClient: async () => null,
  refreshSupabaseToken: async () => null,
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
  
  // Token management
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  
  // Promise management for concurrent refresh requests
  const refreshPromiseRef = useRef<Promise<any> | null>(null);
  
  // Cache for the Supabase client
  const [cachedClient, setCachedClient] = useState<any>(null);

  // Schedule token refresh before expiration
  const scheduleTokenRefresh = useCallback((expiresInMs: number) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    
    // Calculate when to refresh - 30 seconds before expiration
    // This buffer ensures we refresh before the token expires
    const refreshBuffer = 30 * 1000; // 30 seconds
    const refreshTime = Math.max(expiresInMs - refreshBuffer, 0);
    
    // Schedule refresh
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshSupabaseToken();
    }, refreshTime);
    
  }, []);

  // Force refresh the Supabase token
  const refreshSupabaseToken = useCallback(async () => {
    if (!user) return cachedClient;
    
    // Return existing promise if a refresh is already in progress
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    // Create a new refresh promise
    refreshPromiseRef.current = (async () => {
      try {
        // Get a fresh JWT token from Clerk
        const token = await getToken({ template: "supabase" });

        if (!token) {
          console.error("No token returned from Clerk during refresh");
          return null;
        }

        // Create a new Supabase client with the token
        const client = await createSupabaseClientWithToken(token);

        // Update cache and timestamps
        setCachedClient(client);
        
        // Set token expiration to 10 minutes (conservative)
        const expiresInMs = 10 * 60 * 1000;
        setTokenExpiresAt(Date.now() + expiresInMs);
        
        // Schedule the next refresh
        scheduleTokenRefresh(expiresInMs);

        console.log("Successfully refreshed Supabase token with expiry in 10 minutes");
        return client;
      } catch (err) {
        console.error("Error refreshing Supabase token:", err);
        setError(err as Error);
        return null;
      } finally {
        // Clear the promise reference to allow future refreshes
        refreshPromiseRef.current = null;
      }
    })();
    
    return refreshPromiseRef.current;
  }, [user, getToken, cachedClient, scheduleTokenRefresh]);

  // Function to get a Supabase client with the user's token
  const getSupabaseClient = useCallback(async () => {
    if (!user) return null;

    const now = Date.now();
    // More aggressive token refresh policy:
    // If token is expired or will expire in the next 2 minutes
    const tokenExpiringSoon = now > tokenExpiresAt - 2 * 60 * 1000;
    
    if (!cachedClient || tokenExpiringSoon || now >= tokenExpiresAt) {
      return refreshSupabaseToken();
    }

    // Use cached client if it's still valid
    return cachedClient;
  }, [user, cachedClient, tokenExpiresAt, refreshSupabaseToken]);

  // Initialize user session
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
          user.primaryEmailAddress?.emailAddress || "",
        );
        setSupabaseUserId(userId);
        console.log("Synced user with Supabase:", userId);
        setError(null);
        
        // Immediately get a fresh token after user is synced
        await refreshSupabaseToken();
      } catch (err) {
        console.error("Error syncing user with Supabase:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
    
    // Cleanup function to clear any scheduled refreshes
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user, isClerkLoaded, refreshSupabaseToken]);

  // Listen for auth errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is related to authentication
      const errorText = (event.error?.message || event.message || '').toLowerCase();
      if (
        errorText.includes('jwt expired') || 
        errorText.includes('unauthorized') || 
        errorText.includes('auth') || 
        errorText.includes('401') || 
        errorText.includes('403')
      ) {
        // Immediately refresh the token if it seems like an auth error
        refreshSupabaseToken();
      }
    };

    // Listen for global errors
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [refreshSupabaseToken]);

  // Add an error handler effect that will refresh the token on 401/403 errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message?.toLowerCase() || '';
      const isAuthError = 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') ||
        errorMessage.includes('jwt expired');
      
      if (isAuthError && user) {
        console.log('Auth error detected, refreshing token...');
        refreshSupabaseToken();
      }
    }
  }, [error, refreshSupabaseToken, user]);

  const value = {
    supabaseUserId,
    isLoading,
    error,
    getSupabaseClient,
    refreshSupabaseToken,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
