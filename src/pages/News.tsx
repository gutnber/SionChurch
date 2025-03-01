import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { FileText, Calendar, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    name: string;
  };
}

const News: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchArticles();
  }, [isAuthenticated]);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('news')
        .select(`
          id,
          title,
          content,
          image_url,
          created_at,
          author:author_id(name)
        `)
        .order('created_at', { ascending: false });
      
      // If user is not authenticated, only show public articles
      if (!isAuthenticated) {
        query = query.eq('visibility', 'public');
      } else if (user) {
        // If user is authenticated, show articles based on their role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const role = profile.role;
          
          if (role === 'admin') {
            // Admins can see all articles
          } else if (role === 'pastor') {
            query = query.in('visibility', ['public', 'member', 'server', 'leader', 'pastor']);
          } else if (role === 'leader') {
            query = query.in('visibility', ['public', 'member', 'server', 'leader']);
          } else if (role === 'server') {
            query = query.in('visibility', ['public', 'member', 'server']);
          } else {
            query = query.in('visibility', ['public', 'member']);
          }
        }
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Function to create a preview of the content
  const createPreview = (content: string, maxLength = 150) => {
    const stripped = stripHtml(content);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Church News</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Stay updated with the latest news, announcements, and stories from our church community.
        </p>
      </div>
      
      {user?.role === 'admin' && (
        <div className="mb-8 flex justify-end">
          <Link 
            to="/admin/news" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center"
          >
            <FileText size={18} className="mr-2" />
            Manage News
          </Link>
        </div>
      )}
      
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link 
              key={article.id} 
              to={`/news/${article.id}`}
              className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-transform"
            >
              <div className="h-48 bg-gray-800 relative">
                {article.image_url ? (
                  <img 
                    src={article.image_url} 
                    alt={article.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
                    <FileText size={48} className="text-white opacity-30" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <Calendar size={14} className="mr-1" />
                  <span>{format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                  <span className="mx-2">•</span>
                  <User size={14} className="mr-1" />
                  <span>{article.author?.name || 'Unknown'}</span>
                </div>
                
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">{article.title}</h2>
                
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {createPreview(article.content)}
                </p>
                
                <div className="flex items-center text-blue-400 text-sm font-medium">
                  Read More <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No News Articles Yet</h2>
          <p className="text-gray-400 mb-6">
            Check back soon for updates and announcements from our church.
          </p>
          {user?.role === 'admin' && (
            <Link 
              to="/admin/news" 
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Create First Article
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default News;