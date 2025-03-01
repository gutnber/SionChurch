import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Image, Calendar, Plus, Upload, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
  image_count: number;
}

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthStore();
  
  // Check if user has permission to upload
  const canUpload = user && ['admin', 'pastor', 'leader'].includes(user.role);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      
      // Get albums with image count
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, description, cover_image, created_at');

      if (error) throw error;
      
      // For each album, get the image count
      const albumsWithCounts = await Promise.all(
        (data || []).map(async (album) => {
          const { count, error: countError } = await supabase
            .from('gallery')
            .select('id', { count: 'exact', head: true })
            .eq('album_id', album.id);
          
          return {
            ...album,
            image_count: count || 0
          };
        })
      );
      
      setAlbums(albumsWithCounts);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !selectedAlbum) {
      toast.error('Please select both an album and an image');
      return;
    }

    // Validate file type
    const fileType = uploadFile.type;
    if (!fileType.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (uploadFile.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate a unique file name
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${selectedAlbum}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);
      
      // Add the image to the gallery table
      const { error: insertError } = await supabase
        .from('gallery')
        .insert({
          album_id: selectedAlbum,
          image_url: urlData.publicUrl,
          uploaded_by: user?.id
        });
      
      if (insertError) throw insertError;
      
      // Update the album's cover image if it doesn't have one
      const { data: albumData } = await supabase
        .from('albums')
        .select('cover_image')
        .eq('id', selectedAlbum)
        .single();
        
      if (albumData && !albumData.cover_image) {
        await supabase
          .from('albums')
          .update({ cover_image: urlData.publicUrl })
          .eq('id', selectedAlbum);
      }
      
      toast.success('Image uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setSelectedAlbum('');
      
      // Refresh albums to update image count
      fetchAlbums();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-4xl font-bold mb-4">Photo Gallery</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Browse through our collection of photos from church events, activities, and gatherings.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
          />
        </div>
        
        <div className="flex space-x-3 w-full md:w-auto">
          {user?.role === 'admin' && (
            <Link 
              to="/admin/gallery/new" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center flex-1 md:flex-none"
            >
              <Plus size={18} className="mr-2" />
              Create Album
            </Link>
          )}
          
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none"
            >
              <Upload size={18} className="mr-2" />
              Upload Photo
            </button>
          )}
        </div>
      </div>
      
      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAlbums.map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link 
                to={`/gallery/${album.id}`}
                className="block bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition-all"
              >
                <div className="h-48 bg-gray-800 relative">
                  {album.cover_image ? (
                    <img 
                      src={album.cover_image} 
                      alt={album.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
                      <Image size={48} className="text-white opacity-30" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 px-3 py-1 m-2 rounded-lg text-sm flex items-center">
                    <Image size={14} className="mr-1" />
                    {album.image_count} photos
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Calendar size={14} className="mr-1" />
                    <span>{format(parseISO(album.created_at), 'MMMM d, yyyy')}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-2">{album.title}</h2>
                  
                  <p className="text-gray-300 line-clamp-2">
                    {album.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
          <Image size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Albums Found</h2>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'No albums match your search criteria.' 
              : 'There are no photo albums yet.'}
          </p>
          {user?.role === 'admin' && (
            <Link 
              to="/admin/gallery/new" 
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Create First Album
            </Link>
          )}
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Upload Photo</h2>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Select Album
                </label>
                <select
                  value={selectedAlbum}
                  onChange={(e) => setSelectedAlbum(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="">Select an album</option>
                  {albums.map(album => (
                    <option key={album.id} value={album.id}>{album.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Choose Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max file size: 5MB. Supported formats: JPG, PNG, GIF.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile || !selectedAlbum}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;