import { useCallback } from 'react';
import { useSupabaseUser } from '../contexts/UserContext';
import { withAuthentication } from '../services/supabase';

/**
 * Custom hook for interacting with Supabase with automatic authentication handling
 * This hook provides methods to perform authenticated operations with automatic token refresh
 */
export function useSupabase() {
  const { getSupabaseClient, refreshSupabaseToken } = useSupabaseUser();

  /**
   * Execute an authenticated Supabase operation with automatic token refresh
   * Will automatically refresh the token if it expires during the operation
   * Will retry the operation up to the specified number of retries
   * 
   * @param operation Function that takes a Supabase client and returns a promise
   * @param maxRetries Maximum number of retry attempts (default: 2)
   */
  const executeWithAuth = useCallback(<T>(
    operation: (client: any) => Promise<T>,
    maxRetries = 2
  ): Promise<T> => {
    return withAuthentication(
      operation,
      getSupabaseClient,
      refreshSupabaseToken,
      maxRetries
    );
  }, [getSupabaseClient, refreshSupabaseToken]);

  /**
   * Get the authenticated Supabase client (use this if you need direct client access)
   * Prefer using executeWithAuth for most operations to get automatic retry functionality
   */
  const getClient = useCallback(async () => {
    return getSupabaseClient();
  }, [getSupabaseClient]);

  /**
   * Force a token refresh
   * This is useful if you need to refresh the token before a critical operation
   */
  const refreshToken = useCallback(async () => {
    return refreshSupabaseToken();
  }, [refreshSupabaseToken]);

  return {
    executeWithAuth,
    getClient,
    refreshToken
  };
} 