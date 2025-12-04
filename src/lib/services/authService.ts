import { supabase, isSupabaseConfigured } from '../supabase';
import type { UserRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt?: string;
  emailConfirmed?: boolean;
}

export const authService = {
  // Sign up a new user
  async signUp(email: string, password: string, name?: string): Promise<AuthUser | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'client', // Default role is client
        },
      },
    });

    if (error) throw error;
    if (!data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name,
      role: (data.user.user_metadata?.role as UserRole) || 'client',
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at,
    };
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser | null> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name,
      role: (data.user.user_metadata?.role as UserRole) || 'client',
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at,
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name,
      role: (user.user_metadata?.role as UserRole) || 'client',
      avatarUrl: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
    };
  },

  // Update user role (admin only) - uses user_roles table
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // First, check if user_roles entry exists
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingRole) {
      // Update existing role
      const { error } = await supabase
        .from('user_roles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    }
  },

  // Get all users with their roles (admin only)
  async getAllUsers(): Promise<UserWithRole[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Fetch users from profiles table (which should mirror auth.users)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) throw rolesError;

    const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    return (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email || '',
      name: profile.full_name || profile.email?.split('@')[0],
      role: (rolesMap.get(profile.id) as UserRole) || 'client',
      createdAt: profile.created_at,
      lastSignInAt: profile.last_sign_in_at,
      emailConfirmed: !!profile.email_confirmed_at,
    }));
  },

  // Get user's role from user_roles table
  async getUserRole(userId: string): Promise<UserRole> {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[AuthService] Supabase not configured, returning client role');
      return 'client';
    }

    console.log('[AuthService] Fetching role for user:', userId);

    // Use Promise.race for reliable timeout
    const fetchRole = async (): Promise<UserRole> => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthService] Role fetch error:', error.message);
        return 'client';
      }

      if (!data) {
        console.log('[AuthService] No role found, defaulting to client');
        return 'client';
      }

      console.log('[AuthService] Found role:', data.role);
      return data.role as UserRole;
    };

    const timeout = new Promise<UserRole>((resolve) => {
      setTimeout(() => {
        console.warn('[AuthService] Role fetch timed out, defaulting to client');
        resolve('client');
      }, 1500);
    });

    try {
      return await Promise.race([fetchRole(), timeout]);
    } catch (err) {
      console.error('[AuthService] getUserRole exception:', err);
      return 'client';
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!isSupabaseConfigured() || !supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const role = await authService.getUserRole(session.user.id);
        callback({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name,
          role,
          avatarUrl: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
        });
      } else {
        callback(null);
      }
    });
  },

  // Create a coach profile when promoting to coach
  // Note: experts table doesn't have email column - we only store name
  async createCoachProfile(userId: string, name: string, _email: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Check if expert profile already exists with this ID
    const { data: existingById } = await supabase
      .from('experts')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingById) {
      console.log('Expert profile already exists for user ID:', userId);
      return;
    }

    // Try to insert with explicit ID (if table allows it)
    try {
      const { error: insertError } = await supabase
        .from('experts')
        .insert({
          id: userId,
          name,
          is_active: true,
        });

      if (insertError) {
        // If explicit ID insertion fails, try without ID
        console.warn('Could not insert with explicit ID, trying auto-generated ID:', insertError.message);

        const { error: fallbackError } = await supabase
          .from('experts')
          .insert({
            name,
            is_active: true,
          });

        if (fallbackError) {
          console.error('Error creating expert profile:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (err) {
      console.error('Exception creating expert profile:', err);
      throw err;
    }
  },
};
