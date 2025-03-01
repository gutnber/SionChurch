import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from './LanguageSwitcher';

interface ChurchInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: 'Grace Church',
    tagline: '',
    email: '',
    phone: '',
    address: ''
  });
  const { user, signOut, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch church info from database
    const fetchChurchInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('type', 'church_info')
          .single();
        
        if (data && !error) {
          setChurchInfo(data.data as ChurchInfo);
        }
      } catch (error) {
        console.error('Error fetching church info:', error);
      }
    };

    fetchChurchInfo();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('activities'), path: '/activities' },
    { name: t('events'), path: '/events' },
    { name: t('calendar'), path: '/calendar' },
    { name: t('news'), path: '/news' },
    { name: t('gallery'), path: '/gallery' },
    { name: t('bible_qa'), path: '/bible-qa' },
    { name: t('contact'), path: '/contact' },
  ];

  return (
    <nav className="bg-black bg-opacity-50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            {churchInfo.logoUrl ? (
              <img 
                src={churchInfo.logoUrl} 
                alt={churchInfo.name} 
                className="h-[80px] w-auto"
              />
            ) : (
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {churchInfo.name}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu & Language Switcher (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
                >
                  <span>{user?.name}</span>
                  <ChevronDown size={16} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {t('profile')}
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        {t('admin_dashboard')}
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {t('sign_out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/signin"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t('sign_in')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                >
                  {t('sign_up')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <LanguageSwitcher />
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={18} className="mr-2" />
                  {t('profile')}
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center py-2 text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={18} className="mr-2" />
                    {t('admin_dashboard')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full text-left py-2 text-gray-300 hover:text-white"
                >
                  <LogOut size={18} className="mr-2" />
                  {t('sign_out')}
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Link
                  to="/signin"
                  className="block py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('sign_in')}
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity inline-block text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t('sign_up')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;