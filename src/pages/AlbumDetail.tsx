import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Image, Calendar, ArrowLeft, Edit, Upload, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import ReactMasonry from 'react-masonry-css';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  created_at: string;
  uploaded_by: string;
  uploader?: {
    name: string;
  };
}

const AlbumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if user has permission to upload
  const canUpload = user && ['admin', 'pastor', 'leader'].includes(user.role);
  const canDelete = user && ['admin'].includes(user.role);

  useEffect(() => {
    if (id) {
      fetchAlbum(id);
      fetchImages(id);
    }
  }, [id]);

  // Update current image index when selected image changes
  useEffect(() => {
    if (selectedImage) {
      const index = images.findIndex(img => img.id === selectedImage);
      if (index !== -1) {
        setCurrentImageIndex(index);
      }
    }
  }, [selectedImage, images]);

  const fetchAlbum = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .single();

      if (error) throw error;
      setAlbum(data);
    } catch (error) {
      console.error('Error fetching album:', error);
      navigate('/gallery');
    }
  };

  const fetchImages = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select(`
          id,
          image_url,
          created_at,
          uploaded_by,
          uploader:profiles(name)
        `)
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

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
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${id}/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);
      
      // Add the image to the gallery table
      const { data, error: insertError } = await supabase
        .from('gallery')
        .insert({
          album_id: id,
          image_url: urlData.publicUrl,
          uploaded_by: user?.id
        })
        .select();
      
      if (insertError) throw insertError;
      
      // Update the album's cover image if it doesn't have one
      if (album && !album.cover_image) {
        await supabase
          .from('albums')
          .update({ cover_image: urlData.publicUrl })
          .eq('id', id);
          
        setAlbum({
          ...album,
          cover_image: urlData.publicUrl
        });
      }
      
      // Add the new image to the state
      if (data && data[0]) {
        setImages([
          {
            id: data[0].id,
            image_url: urlData.publicUrl,
            created_at: data[0].created_at,
            uploaded_by: user?.id || '',
            uploader: {
              name: user?.name || 'Unknown'
            }
          },
          ...images
        ]);
      }
      
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

  const handleDeleteImage = async () => {
    if (!selectedImage) return;
    
    try {
      setIsDeleting(true);
      
      // Find the image in the state
      const imageToDelete = images.find(img => img.id === selectedImage);
      if (!imageToDelete) return;
      
      // Delete from database
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', selectedImage);
        
      if (error) throw error;
      
      // Try to delete from storage (this might fail if the URL format is different)
      try {
        const urlParts = imageToDelete.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `gallery/${id}/${fileName}`;
        
        await supabase.storage
          .from('church-assets')
          .remove([filePath]);
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }
      
      // Update state
      setImages(images.filter(img => img.id !== selectedImage));
      setSelectedImage(null);
      setLightboxImage(null);
      
      // If the deleted image was the cover image, update the album
      if (album && album.cover_image === imageToDelete.image_url) {
        const newCoverImage = images.length > 1 
          ? images.find(img => img.id !== selectedImage)?.image_url || null
          : null;
          
        await supabase
          .from('albums')
          .update({ cover_image: newCoverImage })
          .eq('id', id);
          
        setAlbum({
          ...album,
          cover_image: newCoverImage || ''
        });
      }
      
      toast.success('Image deleted successfully');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateImages = (direction: 'prev' | 'next') => {
    if (images.length <= 1) return;
    
    let newIndex = currentImageIndex;
    
    if (direction === 'prev') {
      newIndex = (currentImageIndex - 1 + images.length) % images.length;
    } else {
      newIndex = (currentImageIndex + 1) % images.length;
    }
    
    setCurrentImageIndex(newIndex);
    setLightboxImage(images[newIndex].image_url);
    setSelectedImage(images[newIndex].id);
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">Album not found</h2>
        <p className="text-gray-300 mb-6">
          The album you're looking for might have been removed or is not available.
        </p>
        <Link 
          to="/gallery" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/gallery" 
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Gallery
        </Link>
        
        <div className="flex space-x-2">
          {user?.role === 'admin' && (
            <Link 
              to={`/admin/gallery/edit/${album.id}`}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
            >
              <Edit size={16} className="mr-1" />
              Edit Album
            </Link>
          )}
          
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} className="mr-1" />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden mb-8">
        <div className="h-64 bg-gray-800 relative">
          {album.cover_image ? (
            <img 
              src={album.cover_image} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
              <Image size={64} className="text-white opacity-30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center p-6">
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              <div className="flex items-center justify-center text-gray-300 mb-4">
                <Calendar size={16} className="mr-1" />
                <span>{format(parseISO(album.created_at), 'MMMM d, yyyy')}</span>
              </div>
              <p className="max-w-2xl mx-auto text-gray-200">{album.description}</p>
            </div>
          </div>
        </div>
      </div>
      
      {images.length > 0 ? (
        <div className="mb-8">
          <ReactMasonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {images.map((image) => (
              <div 
                key={image.id} 
                className="mb-4 cursor-pointer relative group"
                onClick={() => {
                  setLightboxImage(image.image_url);
                  setSelectedImage(image.id);
                }}
              >
                <div className="overflow-hidden rounded-lg">
                  <img 
                    src={image.image_url} 
                    alt="Gallery" 
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black bg-opacity-70 rounded-full p-2">
                    <Image size={24} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </ReactMasonry>
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
          <Image size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
          <p className="text-gray-400 mb-6">
            This album doesn't have any photos yet.
          </p>
          {canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Upload First Photo
            </button>
          )}
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setLightboxImage(null);
            setSelectedImage(null);
          }}
        >
          <div className="absolute top-4 right-4 flex space-x-2">
            {canDelete && selectedImage && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage();
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  <Trash2 size={20} />
                )}
              </button>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
                setSelectedImage(null);
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImages('prev');
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-colors"
              >
                <ChevronLeft size={30} />
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImages('next');
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-colors"
              >
                <ChevronRight size={30} />
              </button>
            </>
          )}
          
          <div 
            className="max-w-4xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Gallery" 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumDetail;