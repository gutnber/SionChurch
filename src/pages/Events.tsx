import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, isFuture, isPast, parseISO } from 'date-fns';
import { Calendar, MapPin, Clock, Share2, User, ChevronRight } from 'lucide-react';
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
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchEvents();
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          date,
          time,
          location,
          image_url,
          organizer
        `)
        .order('date', { ascending: true });
      
      // If user is not authenticated, only show public events
      if (!isAuthenticated) {
        query = query.eq('visibility', 'public');
      } else if (user) {
        // If user is authenticated, show events based on their role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const role = profile.role;
          
          if (role === 'admin') {
            // Admins can see all events
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
      
      // Add sample events if none exist
      if (!data || data.length === 0) {
        const sampleEvents = generateSampleEvents();
        setEvents(sampleEvents);
      } else {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleEvents = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    return [
      {
        id: '1',
        title: 'Summer Bible Camp',
        description: 'A week of fun activities and Bible learning for children ages 5-12. Join us for games, crafts, music, and daily Bible lessons that will help children grow in their faith.',
        date: nextMonth.toISOString().split('T')[0],
        time: '9:00 AM - 3:00 PM',
        location: 'Church Campus',
        image_url: 'https://images.unsplash.com/photo-1472746729193-0533d2b762da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80',
        organizer: 'Children\'s Ministry Team'
      },
      {
        id: '2',
        title: 'Community Outreach Day',
        description: 'Join us as we serve our local community through various projects. We\'ll be cleaning parks, visiting nursing homes, and helping at the local food bank. All ages welcome!',
        date: new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0],
        time: '10:00 AM - 2:00 PM',
        location: 'Meet at Church Parking Lot',
        image_url: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80',
        organizer: 'Outreach Committee'
      },
      {
        id: '3',
        title: 'Worship Night',
        description: 'An evening of praise and worship with our worship team. Come experience God\'s presence through music, prayer, and fellowship. This special service will focus on thanksgiving and renewal.',
        date: new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0],
        time: '7:00 PM - 9:00 PM',
        location: 'Main Sanctuary',
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80',
        organizer: 'Worship Ministry'
      },
      {
        id: '4',
        title: 'Marriage Retreat',
        description: 'A weekend retreat for married couples to strengthen their relationship through Bible study, workshops, and quality time together. Professional counselors will be available for private sessions.',
        date: lastMonth.toISOString().split('T')[0],
        time: 'All Day',
        location: 'Mountain View Retreat Center',
        image_url: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80',
        organizer: 'Family Ministry'
      },
      {
        id: '5',
        title: 'Youth Conference',
        description: 'Annual youth conference featuring guest speakers, worship bands, and breakout sessions. This year\'s theme is "Bold Faith" and will focus on living out your faith in today\'s world.',
        date: lastMonth.toISOString().split('T')[0],
        time: '6:00 PM - 10:00 PM',
        location: 'Church Youth Center',
        image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80',
        organizer: 'Youth Ministry'
      }
    ];
  };

  const handleShare = (event: Event) => {
    const shareUrl = `${window.location.origin}/events/${event.id}`;
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

  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.date);
    return activeTab === 'upcoming' ? isFuture(eventDate) : isPast(eventDate);
  });

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
        <h1 className="text-4xl font-bold mb-4">Church Events</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Join us for upcoming events and gatherings. Connect with our community and grow in faith together.
        </p>
      </div>
      
      {user?.role === 'admin' && (
        <div className="mb-8 flex justify-end">
          <Link 
            to="/admin/events" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center"
          >
            <Calendar size={18} className="mr-2" />
            Manage Events
          </Link>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex mb-8 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'upcoming'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'past'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Past Events
        </button>
      </div>
      
      {filteredEvents.length > 0 ? (
        <div className="space-y-8">
          {filteredEvents.map((event) => (
            <div 
              key={event.id} 
              className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="h-64 md:h-auto bg-gray-800 relative">
                  {event.image_url ? (
                    <img 
                      src={event.image_url} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900 to-purple-900">
                      <Calendar size={64} className="text-white opacity-30" />
                    </div>
                  )}
                </div>
                
                <div className="p-6 md:col-span-2">
                  <div className="flex flex-wrap items-center text-sm text-blue-400 mb-2 gap-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      <span>{format(parseISO(event.date), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <User size={16} className="mr-1" />
                      <span>{event.organizer}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-3">{event.title}</h2>
                  
                  <div className="flex items-center text-gray-300 mb-4">
                    <MapPin size={18} className="mr-2 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    {event.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Link 
                      to={`/events/${event.id}`}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center"
                    >
                      <ChevronRight size={16} className="mr-1" />
                      Event Details
                    </Link>
                    
                    <button
                      onClick={() => handleShare(event)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <Share2 size={16} className="mr-2" />
                      Share
                    </button>
                    
                    {activeTab === 'upcoming' && (
                      <a 
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${encodeURIComponent(event.date.replace(/-/g, ''))}/${encodeURIComponent(event.date.replace(/-/g, ''))}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      >
                        <Calendar size={16} className="mr-2" />
                        Add to Calendar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Events</h2>
          <p className="text-gray-400 mb-6">
            {activeTab === 'upcoming' 
              ? 'Check back soon for upcoming events and activities.' 
              : 'There are no past events to display at this time.'}
          </p>
          {user?.role === 'admin' && (
            <Link 
              to="/admin/events" 
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Create First Event
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;