import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const { getUser, isLoading: authLoading } = useAuthStore();
  const { fetchThemes, activeTheme, isLoading: themeLoading } = useThemeStore();

  useEffect(() => {
    getUser();
    fetchThemes();
  }, [getUser, fetchThemes]);

  // Apply theme CSS variables
  useEffect(() => {
    if (activeTheme) {
      document.documentElement.style.setProperty('--primary-color', activeTheme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', activeTheme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', activeTheme.accentColor);
    } else {
      // Default theme (black with blue/purple gradients)
      document.documentElement.style.setProperty('--primary-color', '#121212');
      document.documentElement.style.setProperty('--secondary-color', '#3b82f6');
      document.documentElement.style.setProperty('--accent-color', '#8b5cf6');
    }
  }, [activeTheme]);

  if (authLoading || themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;