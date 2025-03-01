import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { 
  Users, Settings, Calendar, Image, FileText, 
  LayoutGrid, Clock, ChevronRight, ChevronLeft, Home 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col">
        <h1 className="text-3xl font-bold mb-4 text-red-500">{t('access_denied')}</h1>
        <p className="text-gray-300 mb-6">{t('no_permission')}</p>
        <Link 
          to="/" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full"
        >
          {t('return_home')}
        </Link>
      </div>
    );
  }

  const navItems = [
    { name: t('overview'), path: '/admin', icon: <LayoutGrid size={20} /> },
    { name: t('home_page'), path: '/admin/home', icon: <Home size={20} /> },
    { name: t('users'), path: '/admin/users', icon: <Users size={20} /> },
    { name: t('news'), path: '/admin/news', icon: <FileText size={20} /> },
    { name: t('events'), path: '/admin/events', icon: <Calendar size={20} /> },
    { name: t('activities'), path: '/admin/activities', icon: <Clock size={20} /> },
    { name: t('gallery'), path: '/admin/gallery', icon: <Image size={20} /> },
    { name: t('settings'), path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[80vh]">
      {/* Sidebar */}
      <div 
        className={`bg-black bg-opacity-70 backdrop-blur-md h-full fixed md:relative z-10 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 md:w-16 overflow-hidden'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t('admin_panel')}
              </h2>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-gray-800">
            <Link
              to="/"
              className="flex items-center px-3 py-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <span className="mr-3">🏠</span>
              {sidebarOpen && <span>{t('back_to_website')}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;