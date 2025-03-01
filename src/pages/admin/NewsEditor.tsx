import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Save, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NewsArticle {
  id?: string;
  title: string;
  content: string;
  image_url: string | null;
  visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member';
}

const NewsEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  
  const [article, setArticle] = useState<NewsArticle>({
    title: '',
    content: '',
    image_url: null,
    visibility: 'public'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error: any) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArticle(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setArticle(prev => ({ ...prev, content }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `news-${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);
      
      // Update article with the new image URL
      setArticle(prev => ({ ...prev, image_url: urlData.publicUrl }));
      
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      // If there's an image URL, extract the file path to delete from storage
      if (article.image_url) {
        const urlParts = article.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `news/${fileName}`;
        
        // Try to delete the file from storage (don't throw if it fails)
        await supabase.storage
          .from('church-assets')
          .remove([filePath])
          .catch(err => console.warn('Could not delete file from storage:', err));
      }
      
      // Update article to remove the image URL
      setArticle(prev => ({ ...prev, image_url: null }));
      toast.success('Image removed');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const saveArticle = async () => {
    if (!article.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!article.content.trim()) {
      toast.error('Please enter content');
      return;
    }

    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing article
        const { error } = await supabase
          .from('news')
          .update({
            title: article.title,
            content: article.content,
            image_url: article.image_url,
            visibility: article.visibility
          })
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Article updated successfully!');
      } else {
        // Create new article
        const { data, error } = await supabase
          .from('news')
          .insert({
            title: article.title,
            content: article.content,
            image_url: article.image_url,
            author_id: user?.id,
            visibility: article.visibility
          })
          .select();
          
        if (error) throw error;
        toast.success('Article created successfully!');
        
        // Navigate to the edit page for the new article
        if (data && data[0]) {
          navigate(`/admin/news/edit/${data[0].id}`);
        } else {
          navigate('/admin/news');
        }
      }
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error(error.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Custom toolbar options for ReactQuill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/admin/news')}
            className="mr-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">{id ? 'Edit Article' : 'Create New Article'}</h1>
        </div>
        
        <button
          onClick={saveArticle}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : (
            <>
              <Save size={18} className="mr-2" />
              Save Article
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Article Title
            </label>
            <input
              type="text"
              name="title"
              value={article.title}
              onChange={handleChange}
              placeholder="Enter article title"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          
          {/* Content Editor */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Article Content
            </label>
            <div className="bg-white rounded-lg overflow-hidden">
              <ReactQuill 
                ref={quillRef}
                theme="snow" 
                value={article.content} 
                onChange={handleContentChange}
                modules={modules}
                placeholder="Write your article content here..."
                className="h-64 text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Use the toolbar to format your content. Add headings, lists, and more.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Featured Image
            </label>
            
            <div className="mb-4">
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 mb-3">
                {article.image_url ? (
                  <img 
                    src={article.image_url} 
                    alt="Featured" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No image selected</p>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : (
                    <>
                      <ImageIcon size={16} className="mr-2" />
                      {article.image_url ? 'Change Image' : 'Upload Image'}
                    </>
                  )}
                </button>
                
                {article.image_url && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remove
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-2">
                Recommended: 1200x630px, max 5MB. PNG or JPG format.
              </p>
            </div>
          </div>
          
          {/* Visibility Settings */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={article.visibility}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="public">Public (Everyone)</option>
              <option value="member">Members Only</option>
              <option value="server">Servers & Above</option>
              <option value="leader">Leaders & Above</option>
              <option value="pastor">Pastors & Admins</option>
              <option value="admin">Admins Only</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Control who can see this article on the website.
            </p>
          </div>
          
          {/* Publishing Info */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Publishing</h3>
            <p className="text-gray-300 mb-4">
              This article will be published immediately after saving.
            </p>
            <button
              onClick={saveArticle}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save size={18} className="mr-2" />
                  {id ? 'Update Article' : 'Publish Article'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsEditor;