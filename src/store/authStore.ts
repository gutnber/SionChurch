import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'pastor' | 'leader' | 'server' | 'member';
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'pastor' | 'leader' | 'server' | 'member') => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signUp: async (email, password, name, phone) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone
          }
        }
      });

      if (error) throw error;

      toast.success('Account created! Please sign in with your credentials.');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up');
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile after successful sign in
      await get().getUser();
      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, isAuthenticated: false });
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
      throw error;
    }
  },

  getUser: async () => {
    try {
      set({ isLoading: true });
      
      // First check if there's a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // If no session or session error, clear user state
      if (sessionError || !sessionData.session) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      // Get the authenticated user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        
        // If profile doesn't exist yet, try to create it from auth metadata
        if (error.code === 'PGRST116') {
          try {
            const metadata = authUser.user_metadata;
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authUser.email || '',
                name: metadata?.name || 'User',
                phone: metadata?.phone || '',
                role: authUser.email === 'henrygutierrezbaja@gmail.com' ? 'admin' : 'member'
              });
                
            if (!insertError) {
              // Try fetching the profile again
              const { data: newProfile, error: newError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
                  
              if (!newError && newProfile) {
                set({
                  user: {
                    id: authUser.id,
                    email: newProfile.email,
                    name: newProfile.name,
                    phone: newProfile.phone,
                    role: newProfile.role,
                    avatarUrl: newProfile.avatar_url,
                  },
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              }
            }
          } catch (createError) {
            console.error("Error creating profile:", createError);
          }
        }
        
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: {
          id: authUser.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
          avatarUrl: profile.avatar_url,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Get user error:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const currentUser = get().user;
      
      // Only admins can update roles
      if (currentUser?.role !== 'admin') {
        toast.error('Only admins can update user roles');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('User role updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating user role');
      throw error;
    }
  },
}));