import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Calendar, Image, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Overview: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    news: 0,
    activities: 0,
    gallery: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch counts from each table
        const [
          { count: usersCount }, 
          { count: eventsCount }, 
          { count: newsCount },
          { count: activitiesCount },
          { count: galleryCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('news').select('*', { count: 'exact', head: true }),
          supabase.from('activities').select('*', { count: 'exact', head: true }),
          supabase.from('gallery').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          users: usersCount || 0,
          events: eventsCount || 0,
          news: newsCount || 0,
          activities: activitiesCount || 0,
          gallery: galleryCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { name: 'Users', value: stats.users, icon: <Users size={24} className="text-blue-400" /> },
    { name: 'Events', value: stats.events, icon: <Calendar size={24} className="text-purple-400" /> },
    { name: 'News Articles', value: stats.news, icon: <FileText size={24} className="text-green-400" /> },
    { name: 'Activities', value: stats.activities, icon: <Clock size={24} className="text-yellow-400" /> },
    { name: 'Gallery Items', value: stats.gallery, icon: <Image size={24} className="text-pink-400" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-300">{stat.name}</h2>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-400 text-center py-8">
              Activity data will appear here once the website has more user interactions.
            </p>
          </div>
        </div>
        
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/admin/news" 
              className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 p-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors"
            >
              <FileText size={24} className="mb-2 text-blue-400" />
              <span>Add News</span>
            </Link>
            <Link 
              to="/admin/events/new" 
              className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 p-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors"
            >
              <Calendar size={24} className="mb-2 text-purple-400" />
              <span>Add Event</span>
            </Link>
            <Link 
              to="/admin/gallery/new" 
              className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 hover:from-pink-500/30 hover:to-pink-600/30 p-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors"
            >
              <Image size={24} className="mb-2 text-pink-400" />
              <span>Add Gallery Item</span>
            </Link>
            <Link 
              to="/admin/users" 
              className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 p-4 rounded-lg flex flex-col items-center justify-center text-center transition-colors"
            >
              <Users size={24} className="mb-2 text-green-400" />
              <span>Manage Users</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;