import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authService, AuthUser } from '@/lib/services/authService';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAdmin: boolean;
  isCoach: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Function to load user with role
  const loadUserWithRole = useCallback(async (authUser: AuthUser | null) => {
    if (authUser) {
      try {
        const role = await authService.getUserRole(authUser.id);
        setUser({ ...authUser, role });
      } catch (err) {
        console.error('Error fetching role:', err);
        setUser(authUser);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authInitialized = false;

    // Check for existing session immediately
    const initAuth = async () => {
      console.log('[Auth] Starting initialization...');

      try {
        if (!supabase) {
          console.log('[Auth] Supabase not configured, skipping');
          if (isMounted) setLoading(false);
          return;
        }

        // Use getSession for faster initial load (uses cached session)
        console.log('[Auth] Getting session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
          if (isMounted) setLoading(false);
          return;
        }

        if (session?.user && isMounted) {
          console.log('[Auth] Found session for:', session.user.email);

          // Get role with timeout
          let role: UserRole = 'client';
          try {
            const rolePromise = authService.getUserRole(session.user.id);
            const timeoutPromise = new Promise<UserRole>((_, reject) =>
              setTimeout(() => reject(new Error('Role fetch timeout')), 3000)
            );
            role = await Promise.race([rolePromise, timeoutPromise]);
            console.log('[Auth] User role:', role);
          } catch (roleErr) {
            console.warn('[Auth] Could not fetch role, defaulting to client:', roleErr);
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name,
            role,
            avatarUrl: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at,
          });
          authInitialized = true;
        } else {
          console.log('[Auth] No active session found');
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (isMounted) {
          console.log('[Auth] Initialization complete');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (!isMounted) return;

      // Skip if we already initialized and this is just the initial event
      if (authInitialized && authUser) {
        console.log('[Auth] Skipping duplicate auth event');
        return;
      }

      console.log('[Auth] Auth state changed:', authUser?.email || 'signed out');
      await loadUserWithRole(authUser);
      queryClient.invalidateQueries();
      setLoading(false);
    });

    // Safety timeout - 2 seconds max
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => {
          if (prev) {
            console.warn('[Auth] Loading timeout - forcing completion');
          }
          return false;
        });
      }
    }, 2000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [queryClient, loadUserWithRole]);

  // Manual refresh function
  const refreshAuth = async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const role = await authService.getUserRole(currentUser.id);
        setUser({ ...currentUser, role });
        queryClient.invalidateQueries();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const authUser = await authService.signIn(email, password);
      if (authUser) {
        const role = await authService.getUserRole(authUser.id);
        setUser({ ...authUser, role });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      const authUser = await authService.signUp(email, password, name);
      if (authUser) {
        setUser(authUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const isAdmin = user?.role === 'admin';
  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshAuth,
        isAdmin,
        isCoach,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
