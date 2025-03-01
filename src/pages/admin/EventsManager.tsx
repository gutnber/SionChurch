import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { Calendar, Plus, Search, Trash2, Edit, Eye, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  visibility: string;
  image_url: string | null;
}

const EventsManager: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      
      // Get the event to find the image URL
      const { data: event } = await supabase
        .from('events')
        .select('image_url')
        .eq('id', id)
        .single();
      
      // Delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // If there's an image, delete it from storage
      if (event?.image_url) {
        const urlParts = event.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `events/${fileName}`;
        
        await supabase.storage
          .from('church-assets')
          .remove([filePath])
          .catch(err => console.warn('Could not delete file from storage:', err));
      }
      
      // Update the events list
      setEvents(events.filter(event => event.id !== id));
      toast.success('Event deleted successfully');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error.message || 'Failed to delete event');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const eventDate = parseISO(event.date);
    
    if (filter === 'upcoming') {
      return matchesSearch && isFuture(eventDate);
    } else if (filter === 'past') {
      return matchesSearch && isPast(eventDate);
    }
    
    return matchesSearch;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Events Management</h1>
        
        <Link 
          to="/admin/events/new" 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center md:justify-start"
        >
          <Plus size={18} className="mr-2" />
          Create New Event
        </Link>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          
          <div className="flex items-center">
            <Filter size={18} className="text-gray-400 mr-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredEvents.length > 0 ? (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-700 mr-3 overflow-hidden">
                          {event.image_url ? (
                            <img 
                              src={event.image_url} 
                              alt={event.title} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Calendar size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium">{event.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{format(parseISO(event.date), 'MMM d, yyyy')}</div>
                      <div className="text-sm text-gray-400">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{event.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.visibility === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : event.visibility === 'member'
                          ? 'bg-blue-100 text-blue-800'
                          : event.visibility === 'server'
                          ? 'bg-yellow-100 text-yellow-800'
                          : event.visibility === 'leader'
                          ? 'bg-orange-100 text-orange-800'
                          : event.visibility === 'pastor'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.visibility.charAt(0).toUpperCase() + event.visibility.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link 
                          to={`/events/${event.id}`}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link 
                          to={`/admin/events/edit/${event.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id)}
                          disabled={isDeleting === event.id}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {isDeleting === event.id ? (
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
          <Calendar size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Events Found</h2>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'No events match your search criteria.' 
              : 'You haven\'t created any events yet.'}
          </p>
          <Link 
            to="/admin/events/new" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Create Your First Event
          </Link>
        </div>
      )}
    </div>
  );
};

export default EventsManager;