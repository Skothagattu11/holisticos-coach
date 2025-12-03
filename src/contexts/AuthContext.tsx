import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { authService, AuthUser } from '@/lib/services/authService';
import { useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React 18 strict mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let isMounted = true;

    // Subscribe to auth changes first
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (!isMounted) return;

      if (authUser) {
        setUser(authUser);
        // Clear all queries when user changes to ensure fresh data
        queryClient.clear();
      } else {
        setUser(null);
        queryClient.clear();
      }
      setLoading(false);
    });

    // Check for existing session
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted && currentUser) {
          const role = await authService.getUserRole(currentUser.id);
          setUser({ ...currentUser, role });
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

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
        isAdmin,
        isCoach,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
