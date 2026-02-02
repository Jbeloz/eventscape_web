import { supabase } from '@/services/supabase';
import { User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initializeAuth: async () => {
    console.log("🔄 Initializing auth, restoring session...");
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log("ℹ️ No active session:", error.message);
        set({ loading: false });
        return;
      }
      if (data.user) {
        console.log("✅ Session restored, user:", data.user.email);
        set({ user: data.user, loading: false });
      } else {
        console.log("ℹ️ No user in session");
        set({ loading: false });
      }
    } catch (err) {
      console.error("❌ Error restoring session:", err);
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Create user record in users table
        const { error: insertError } = await supabase.from('users').insert({
          auth_id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          user_role: 'customer',
        });

        if (insertError) throw insertError;

        set({ user: data.user });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign up failed' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      set({ user: data.user });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign in failed' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Sign out failed' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getCurrentUser: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      set({ user: data.user });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to get user' });
    } finally {
      set({ loading: false });
    }
  },
}));

// Initialize auth on app startup
const authStore = useAuth.getState();
authStore.initializeAuth();
