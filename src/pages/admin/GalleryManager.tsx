import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Image, Plus, Search, Trash2, Edit, Eye, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Album {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  created_at: string;
  image_count: number;
}

const GalleryManager: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setIsLoading(true);
      
      // Get albums
      const { data, error } = await supabase
        .from('albums')
        .select('id, title, description, cover_image, created_at')
        .order('created_at', { ascending: false });

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
      toast.error('Failed to load albums');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      
      // First, get all images in the album
      const { data: images } = await supabase
        .from('gallery')
        .select('image_url')
        .eq('album_id', id);
      
      // Delete all images from the gallery table
      const { error: deleteImagesError } = await supabase
        .from('gallery')
        .delete()
        .eq('album_id', id);
        
      if (deleteImagesError) throw deleteImagesError;
      
      // Try to delete images from storage
      if (images && images.length > 0) {
        try {
          const filePaths = images.map(img => {
            const urlParts = img.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            return `gallery/${id}/${fileName}`;
          });
          
          await supabase.storage
            .from('church-assets')
            .remove(filePaths);
        } catch (storageError) {
          console.warn('Could not delete all files from storage:', storageError);
        }
      }
      
      // Delete the album
      const { error: deleteAlbumError } = await supabase
        .from('albums')
        .delete()
        .eq('id', id);
        
      if (deleteAlbumError) throw deleteAlbumError;
      
      // Update the albums list
      setAlbums(albums.filter(album => album.id !== id));
      toast.success('Album deleted successfully');
    } catch (error: any) {
      console.error('Error deleting album:', error);
      toast.error(error.message || 'Failed to delete album');
    } finally {
      setIsDeleting(null);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Gallery Management</h1>
        
        <Link 
          to="/admin/gallery/new" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center md:justify-start"
        >
          <Plus size={18} className="mr-2" />
          Create New Album
        </Link>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
          />
        </div>
      </div>
      
      {filteredAlbums.length > 0 ? (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Album</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Photos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredAlbums.map((album) => (
                  <tr key={album.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700 mr-3 overflow-hidden">
                          {album.cover_image ? (
                            <img 
                              src={album.cover_image} 
                              alt={album.title} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Image size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{album.title}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{album.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{format(parseISO(album.created_at), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{album.image_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Public
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link 
                          to={`/gallery/${album.id}`}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link 
                          to={`/admin/gallery/edit/${album.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(album.id)}
                          disabled={isDeleting === album.id}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {isDeleting === album.id ? (
                            <div className="h-4 w-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-12 text-center">
          <Image size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Albums Found</h2>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'No albums match your search criteria.' 
              : 'You haven\'t created any albums yet.'}
          </p>
          <Link 
            to="/admin/gallery/new" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Create Your First Album
          </Link>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;