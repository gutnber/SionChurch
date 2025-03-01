import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Save, Image as ImageIcon, Trash2, ArrowLeft, Edit } from 'lucide-react';

interface HomePageContent {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  welcome_title: string;
  welcome_text: string;
}

const HomeEditor: React.FC = () => {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState<HomePageContent>({
    hero_title: 'Welcome to Grace Church',
    hero_subtitle: 'A place of worship, community, and spiritual growth for all',
    hero_image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
    welcome_title: 'Join Us for Worship',
    welcome_text: 'Weekly services and gatherings'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchHomeContent();
  }, []);

  const fetchHomeContent = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('type', 'home_page')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record doesn't exist yet, use default values
          console.log('No home page settings found, using defaults');
        } else {
          throw error;
        }
      }
      
      if (data && data.data) {
        setContent(data.data as HomePageContent);
      }
    } catch (error) {
      console.error('Error fetching home page content:', error);
      toast.error('Failed to load home page content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, [name]: value }));
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `home/${fileName}`;
      
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
      
      // Update content with the new hero image URL
      setContent(prev => ({ ...prev, hero_image: urlData.publicUrl }));
      
      toast.success('Hero image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading hero image:', error);
      toast.error(error.message || 'Failed to upload hero image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveContent = async () => {
    if (!content.hero_title.trim()) {
      toast.error('Please enter a hero title');
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'home_page',
          data: content
        }, {
          onConflict: 'type'
        });
        
      if (error) throw error;
      
      toast.success('Home page content saved successfully!');
    } catch (error: any) {
      console.error('Error saving home page content:', error);
      toast.error(error.message || 'Failed to save home page content');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
        <h1 className="text-3xl font-bold">Home Page Editor</h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            {previewMode ? (
              <>
                <Edit size={18} className="mr-2" />
                Edit Mode
              </>
            ) : (
              <>
                <ImageIcon size={18} className="mr-2" />
                Preview
              </>
            )}
          </button>
          
          <button
            onClick={saveContent}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
      
      {previewMode ? (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden mb-8">
          <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img
                src={content.hero_image}
                alt="Church"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            </div>
            
            <div className="relative z-10 text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {content.hero_title}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                {content.hero_subtitle}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Hero Section</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  name="hero_title"
                  value={content.hero_title}
                  onChange={handleChange}
                  placeholder="Welcome to Grace Church"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  name="hero_subtitle"
                  value={content.hero_subtitle}
                  onChange={handleChange}
                  placeholder="A place of worship, community, and spiritual growth for all"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
            </div>
            
            {/* Welcome Section */}
            <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Welcome Section</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Welcome Title
                </label>
                <input
                  type="text"
                  name="welcome_title"
                  value={content.welcome_title}
                  onChange={handleChange}
                  placeholder="Join Us for Worship"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Welcome Text
                </label>
                <input
                  type="text"
                  name="welcome_text"
                  value={content.welcome_text}
                  onChange={handleChange}
                  placeholder="Weekly services and gatherings"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div className="mt-4 text-sm text-gray-400">
                <p>Note: The "Join Us for Worship" section will automatically display your weekly activities from the Activities page.</p>
              </div>
            </div>
            
            <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming Events Section</h2>
              
              <div className="text-sm text-gray-400">
                <p>The "Upcoming Events" section automatically displays your upcoming events from the Events page.</p>
                <p className="mt-2">To manage events, go to the <a href="/admin/events" className="text-blue-400 hover:underline">Events Manager</a>.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Hero Image */}
            <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hero Image
              </label>
              
              <div className="mb-4">
                <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 mb-3">
                  {content.hero_image ? (
                    <img 
                      src={content.hero_image} 
                      alt="Hero" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No hero image selected</p>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleHeroImageUpload}
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
                        Change Hero Image
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  Recommended: 1920x1080px, max 5MB. PNG or JPG format.
                </p>
              </div>
            </div>
            
            {/* Publishing Info */}
            <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">Publishing</h3>
              <p className="text-gray-300 mb-4">
                Changes will be published immediately after saving.
              </p>
              <button
                onClick={saveContent}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeEditor;