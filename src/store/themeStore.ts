import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isActive: boolean;
}

interface ThemeState {
  themes: Theme[];
  activeTheme: Theme | null;
  isLoading: boolean;
  fetchThemes: () => Promise<void>;
  setActiveTheme: (themeId: string) => Promise<void>;
  addTheme: (theme: Omit<Theme, 'id' | 'isActive'>) => Promise<void>;
  updateTheme: (id: string, theme: Partial<Omit<Theme, 'id' | 'isActive'>>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themes: [],
  activeTheme: null,
  isLoading: false,

  fetchThemes: async () => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedThemes = data.map(theme => ({
        id: theme.id,
        name: theme.name,
        primaryColor: theme.primary_color,
        secondaryColor: theme.secondary_color,
        accentColor: theme.accent_color,
        isActive: theme.is_active,
      }));

      const activeTheme = formattedThemes.find(theme => theme.isActive) || null;

      set({ 
        themes: formattedThemes,
        activeTheme,
        isLoading: false 
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch themes');
      set({ isLoading: false });
    }
  },

  setActiveTheme: async (themeId) => {
    try {
      // First, set all themes to inactive
      await supabase
        .from('themes')
        .update({ is_active: false })
        .neq('id', 'placeholder');

      // Then set the selected theme to active
      const { error } = await supabase
        .from('themes')
        .update({ is_active: true })
        .eq('id', themeId);

      if (error) throw error;

      // Update local state
      await get().fetchThemes();
      toast.success('Theme activated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate theme');
    }
  },

  addTheme: async (theme) => {
    try {
      const { error } = await supabase
        .from('themes')
        .insert({
          name: theme.name,
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          is_active: false,
        });

      if (error) throw error;

      await get().fetchThemes();
      toast.success('Theme added successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add theme');
    }
  },

  updateTheme: async (id, theme) => {
    try {
      const { error } = await supabase
        .from('themes')
        .update({
          ...(theme.name && { name: theme.name }),
          ...(theme.primaryColor && { primary_color: theme.primaryColor }),
          ...(theme.secondaryColor && { secondary_color: theme.secondaryColor }),
          ...(theme.accentColor && { accent_color: theme.accentColor }),
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchThemes();
      toast.success('Theme updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update theme');
    }
  },

  deleteTheme: async (id) => {
    try {
      // Check if theme is active
      const activeTheme = get().activeTheme;
      if (activeTheme?.id === id) {
        toast.error('Cannot delete an active theme');
        return;
      }

      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchThemes();
      toast.success('Theme deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete theme');
    }
  },
}));