import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Save, Image as ImageIcon, Trash2, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  organizer: string;
  visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member';
}

const EventEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const dateFromQuery = queryParams.get('date');
  
  const [event, setEvent] = useState<Event>({
    title: '',
    description: '',
    date: dateFromQuery || format(new Date(), 'yyyy-MM-dd'),
    time: '',
    location: '',
    image_url: null,
    organizer: '',
    visibility: 'public'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
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
      const fileName = `event-${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;
      
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
      
      // Update event with the new image URL
      setEvent(prev => ({ ...prev, image_url: urlData.publicUrl }));
      
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
      if (event.image_url) {
        const urlParts = event.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `events/${fileName}`;
        
        // Try to delete the file from storage (don't throw if it fails)
        await supabase.storage
          .from('church-assets')
          .remove([filePath])
          .catch(err => console.warn('Could not delete file from storage:', err));
      }
      
      // Update event to remove the image URL
      setEvent(prev => ({ ...prev, image_url: null }));
      toast.success('Image removed');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error(error.message || 'Failed to remove image');
    }
  };

  const saveEvent = async () => {
    if (!event.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!event.date) {
      toast.error('Please select a date');
      return;
    }

    if (!event.time) {
      toast.error('Please enter a time');
      return;
    }

    if (!event.location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    try {
      setIsSaving(true);
      
      if (id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            image_url: event.image_url,
            organizer: event.organizer,
            visibility: event.visibility
          })
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Event updated successfully!');
        
        // Redirect to calendar page
        navigate('/calendar');
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            image_url: event.image_url,
            organizer: event.organizer,
            visibility: event.visibility
          })
          .select();
          
        if (error) throw error;
        toast.success('Event created successfully!');
        
        // Redirect to calendar page
        navigate('/calendar');
      }
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event');
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
            onClick={() => navigate('/admin/events')}
            className="mr-4 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">{id ? 'Edit Event' : 'Create New Event'}</h1>
        </div>
        
        <button
          onClick={saveEvent}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : (
            <>
              <Save size={18} className="mr-2" />
              Save Event
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              value={event.title}
              onChange={handleChange}
              placeholder="Enter event title"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          
          {/* Description */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Description
            </label>
            <textarea
              name="description"
              value={event.description}
              onChange={handleChange}
              rows={6}
              placeholder="Describe the event..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            ></textarea>
          </div>
          
          {/* Date, Time, Location */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={event.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="text"
                  name="time"
                  value={event.time}
                  onChange={handleChange}
                  placeholder="e.g., 7:00 PM - 9:00 PM"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={event.location}
                onChange={handleChange}
                placeholder="Enter event location"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organizer
              </label>
              <input
                type="text"
                name="organizer"
                value={event.organizer}
                onChange={handleChange}
                placeholder="Enter organizer or ministry name"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Image
            </label>
            
            <div className="mb-4">
              <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 mb-3">
                {event.image_url ? (
                  <img 
                    src={event.image_url} 
                    alt="Event" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
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
                      {event.image_url ? 'Change Image' : 'Upload Image'}
                    </>
                  )}
                </button>
                
                {event.image_url && (
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
              value={event.visibility}
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
              Control who can see this event on the website.
            </p>
          </div>
          
          {/* Publishing Info */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <h3 className="text-lg font-medium mb-4">Publishing</h3>
            <p className="text-gray-300 mb-4">
              This event will be published immediately after saving.
            </p>
            <button
              onClick={saveEvent}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save size={18} className="mr-2" />
                  {id ? 'Update Event' : 'Publish Event'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEditor;