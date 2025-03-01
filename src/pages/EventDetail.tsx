import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, User, ArrowLeft, Edit, Share2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  organizer: string;
  visibility: string;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if the ID is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(eventId)) {
        // If not a valid UUID, redirect to events page
        setError('Invalid event ID format');
        navigate('/events');
        return;
      }
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Event not found');
        return;
      }
      
      setEvent(data);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      setError('Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (!event) return;
    
    const shareUrl = window.location.href;
    const shareTitle = `${event.title} at Grace Church`;
    const shareText = `Join us for ${event.title} on ${format(parseISO(event.date), 'MMMM d, yyyy')} at ${event.time}. ${event.location}`;
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\n${shareUrl}`)
        .then(() => toast.success('Event details copied to clipboard!'))
        .catch(() => toast.error('Failed to copy event details'));
    }
  };

  // Generate Facebook share URL
  const getFacebookShareUrl = () => {
    if (!event) return '';
    const shareUrl = encodeURIComponent(window.location.href);
    return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  };

  // Generate Twitter share URL
  const getTwitterShareUrl = () => {
    if (!event) return '';
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Join us for ${event.title} at Grace Church on ${format(parseISO(event.date), 'MMMM d, yyyy')}!`);
    return `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  };

  // Generate WhatsApp share URL
  const getWhatsAppShareUrl = () => {
    if (!event) return '';
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Join us for ${event.title} at Grace Church on ${format(parseISO(event.date), 'MMMM d, yyyy')} at ${event.time}. ${event.location}`);
    return `https://wa.me/?text=${shareText}%20${shareUrl}`;
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    if (!event) return '';
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const dates = encodeURIComponent(event.date.replace(/-/g, ''));
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}/${dates}&details=${details}&location=${location}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">{error || 'Event not found'}</h2>
        <p className="text-gray-300 mb-6">
          The event you're looking for might have been removed or is not available.
        </p>
        <Link 
          to="/events" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/events" 
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Events
        </Link>
        
        <div className="flex space-x-2">
          {user?.role === 'admin' && (
            <Link 
              to={`/admin/events/edit/${event.id}`}
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
            <Share2 size={16} className="mr-1" />
            Share
          </button>
        </div>
      </div>
      
      <article className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl overflow-hidden">
        {event.image_url && (
          <div className="h-80 bg-gray-800">
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-500 bg-opacity-20 rounded-full p-2 mr-4">
                  <Calendar size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Date</h3>
                  <p className="text-lg">{format(parseISO(event.date), 'MMMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-purple-500 bg-opacity-20 rounded-full p-2 mr-4">
                  <Clock size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Time</h3>
                  <p className="text-lg">{event.time}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-green-500 bg-opacity-20 rounded-full p-2 mr-4">
                  <MapPin size={24} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Location</h3>
                  <p className="text-lg">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-yellow-500 bg-opacity-20 rounded-full p-2 mr-4">
                  <User size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Organizer</h3>
                  <p className="text-lg">{event.organizer}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About This Event</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-line">{event.description}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-xl font-semibold mb-4">Add to Calendar</h2>
            <a 
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Calendar size={18} className="inline-block mr-2" />
              Add to Google Calendar
            </a>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <h2 className="text-xl font-semibold mb-4">Share This Event</h2>
            <div className="flex flex-wrap gap-3">
              <a 
                href={getFacebookShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1877F2] hover:bg-[#0E65D9] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Facebook
              </a>
              <a 
                href={getTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] hover:bg-[#0C85D0] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Twitter
              </a>
              <a 
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#1FB655] text-white px-4 py-2 rounded-lg transition-colors"
              >
                WhatsApp
              </a>
              <button
                onClick={handleShare}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </article>
      
      <div className="mt-8 text-center">
        <Link 
          to="/events" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
        >
          View All Events
        </Link>
      </div>
    </div>
  );
};

export default EventDetail;