import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Calendar, User, ArrowLeft, Edit, Share } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  visibility: string;
  author: {
    id: string;
    name: string;
  };
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('news')
        .select(`
          id,
          title,
          content,
          image_url,
          created_at,
          visibility,
          author:author_id(id, name)
        `)
        .eq('id', articleId)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Article not found');
        return;
      }
      
      setArticle(data);
    } catch (error: any) {
      console.error('Error fetching article:', error);
      setError('Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">{error || 'Article not found'}</h2>
        <p className="text-gray-300 mb-6">
          The article you're looking for might have been removed or is not available.
        </p>
        <Link 
          to="/news" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Back to News
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/news" 
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to News
        </Link>
        
        <div className="flex space-x-2">
          {user?.role === 'admin' && (
            <Link 
              to={`/admin/news/edit/${article.id}`}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Link>
          )}
          
          <button
            onClick={handleShare}
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors"
          >
            <Share size={16} className="mr-1" />
            Share
          </button>
        </div>
      </div>
      
      <article className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden">
        {article.image_url && (
          <div className="h-80 bg-gray-800">
            <img 
              src={article.image_url} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex items-center text-gray-400 mb-8">
            <Calendar size={18} className="mr-2" />
            <span>{format(new Date(article.created_at), 'MMMM d, yyyy')}</span>
            <span className="mx-3">•</span>
            <User size={18} className="mr-2" />
            <span>{article.author?.name || 'Unknown'}</span>
          </div>
          
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          ></div>
        </div>
      </article>
      
      <div className="mt-8 text-center">
        <Link 
          to="/news" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Read More News
        </Link>
      </div>
    </div>
  );
};

export default NewsDetail;