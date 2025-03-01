import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Save, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';

interface Album {
  id?: string;
  title: string;
  description: string;
  cover_image: string | null;
  visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member';
}

const AlbumEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [album, setAlbum] = useState<Album>({
    title: '',
    description: '',
    cover_image: null,
    visibility: 'public'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAlbum(id);
    }
  }, [id]);

  const fetchAlbum = async (albumId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .single();

      if (error) throw error;
      setAlbum(data);
    } catch (error: any) {
      console.error('Error fetching album:', error);
      toast.error('Failed to load album');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAlbum(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `cover-${Date.now()}.${fileExt}`;
      const filePath = `albums/${fileName}`;
      
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
      
      // Update album with the new cover image URL
      setAlbum(prev => ({ ...prev, cover_image: urlData.publicUrl }));
      
      toast.success('Cover image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      toast.error(error.message || 'Failed to upload cover image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCoverImage = async () => {
    try {
      // If there's a cover image URL, extract the file path to delete from storage
      if (album.cover_image) {
        const urlParts = album.cover_image.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `albums/${fileName}`;
        
        // Try to delete the file from storage (don't throw if it fails)
        await supabase.storage
          .from('church-assets')
          .remove([filePath])
          .catch(err => console.warn('Could not delete file from storage:', err));
      }
      
      // Update album to remove the cover image URL
      setAlbum(prev => ({ ...prev, cover_image: null }));
      toast.success('Cover image removed');
    } catch (error: any) {
      console.error('Error removing cover image:', error);
      toast.error(error.message || 'Failed to remove cover image');
    }
  };

  const saveAlbum = async () => {
    if (!album.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing album
        const { error } = await supabase
          .from('albums')
          .update({
            title: album.title,
            description: album.description,
            cover_image: album.cover_image,
            visibility: album.visibility
          })
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Album updated successfully!');
        navigate(`/gallery/${id}`);
      } else {
        // Create new album
        const { data, error } = await supabase
          .from('albums')
          .insert({
            title: album.title,
            description: album.description,
            cover_image: album.cover_image,
            visibility: album.visibility
          })
          .select();
          
        if (error) throw error;
        toast.success('Album created successfully!');
        
        // Navigate to the new album
        if (data && data[0]) {
          navigate(`/gallery/${data[0].id}`);
        } else {
          navigate('/admin/gallery');
        }
      }
    } catch (error: any) {
      console.error('Error saving album:', error);
      toast.error(error.message || 'Failed to save album');
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
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/admin/gallery')}
            className="mr-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">{id ? 'Edit Album' : 'Create New Album'}</h1>
        </div>
        
        <button
          onClick={saveAlbum}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : (
            <>
              <Save size={18} className="mr-2" />
              Save Album
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Album Title
            </label>
            <input
              type="text"
              name="title"
              value={album.title}
              onChange={handleChange}
              placeholder="Enter album title"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          
          {/* Description */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Album Description
            </label>
            <textarea
              name="description"
              value={album.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the album..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            ></textarea>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cover Image
            </label>
            
            <div className="mb-4">
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 mb-3">
                {album.cover_image ? (
                  <img 
                    src={album.cover_image} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No cover image selected</p>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCoverImageUpload}
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
                      {album.cover_image ? 'Change Cover' : 'Upload Cover'}
                    </>
                  )}
                </button>
                
                {album.cover_image && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverImage}
                    className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remove
                  </button>
                )}
              </div>
              
              <p className="text-xs text-gray-400 mt-2">
                Recommended: 1200x800px, max 5MB. PNG or JPG format.
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
              value={album.visibility}
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
              Control who can see this album on the website.
            </p>
          </div>
          
          {/* Publishing Info */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Publishing</h3>
            <p className="text-gray-300 mb-4">
              This album will be published immediately after saving.
            </p>
            <button
              onClick={saveAlbum}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save size={18} className="mr-2" />
                  {id ? 'Update Album' : 'Publish Album'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumEditor;