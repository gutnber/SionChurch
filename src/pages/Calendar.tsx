import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, List, Grid, ChevronDown, Download, Share2, Plus, Filter, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  visibility: string;
}

interface Activity {
  id: string;
  day_of_week: string;
  title: string;
  time: string;
  location: string;
  category: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps: {
    type: 'event' | 'activity';
    location: string;
    time?: string;
    organizer?: string;
    category?: string;
    day_of_week?: string;
    originalId: string;
  };
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  url?: string;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const [filterType, setFilterType] = useState<'all' | 'events' | 'activities'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { user } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchEvents();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (events.length > 0 || activities.length > 0) {
      generateCalendarEvents();
    }
  }, [events, activities, filterType, filterCategory]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert day of week to number (0 = Sunday, 1 = Monday, etc.)
  const getDayNumber = (day: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(day);
  };

  // Generate recurring dates for activities based on day of week
  const generateRecurringDates = (dayOfWeek: string, startDate = new Date(), weeks = 52): string[] => {
    const dates: string[] = [];
    const dayNum = getDayNumber(dayOfWeek);
    
    if (dayNum === -1) return dates;
    
    const currentDate = new Date(startDate);
    const currentDay = currentDate.getDay();
    
    // Adjust to the next occurrence of the day of week
    const daysToAdd = (dayNum + 7 - currentDay) % 7;
    currentDate.setDate(currentDate.getDate() + daysToAdd);
    
    // Generate dates for the specified number of weeks
    for (let i = 0; i < weeks; i++) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dates;
  };

  // Parse time string to get hours and minutes
  const parseTime = (timeStr: string): { hours: number, minutes: number } => {
    // Handle formats like "7:00 PM", "07:00 PM", "7 PM", etc.
    const timeRegex = /(\d+)(?::(\d+))?\s*(AM|PM)/i;
    const match = timeStr.match(timeRegex);
    
    if (!match) return { hours: 0, minutes: 0 };
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  };

  const generateCalendarEvents = () => {
    const newCalendarEvents: CalendarEvent[] = [];
    
    // Process one-time events
    if (filterType === 'all' || filterType === 'events') {
      events.forEach(event => {
        // Skip if category filter is active and doesn't match
        if (filterCategory !== 'all' && event.visibility !== filterCategory) return;
        
        const { hours, minutes } = parseTime(event.time.split('-')[0].trim());
        const startDate = new Date(event.date);
        startDate.setHours(hours, minutes);
        
        newCalendarEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          start: startDate.toISOString(),
          extendedProps: {
            type: 'event',
            location: event.location,
            time: event.time,
            organizer: event.organizer,
            originalId: event.id
          },
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          url: `/events/${event.id}`
        });
      });
    }
    
    // Process recurring activities
    if (filterType === 'all' || filterType === 'activities') {
      activities.forEach(activity => {
        // Skip if category filter is active and doesn't match
        if (filterCategory !== 'all' && activity.category !== filterCategory) return;
        
        const dates = generateRecurringDates(activity.day_of_week);
        const { hours, minutes } = parseTime(activity.time.split('-')[0].trim());
        
        dates.forEach(date => {
          const startDate = new Date(date);
          startDate.setHours(hours, minutes);
          
          // Estimate end time (1 hour later if not specified)
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1);
          
          newCalendarEvents.push({
            id: `activity-${activity.id}-${date}`,
            title: activity.title,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            extendedProps: {
              type: 'activity',
              location: activity.location,
              time: activity.time,
              category: activity.category,
              day_of_week: activity.day_of_week,
              originalId: activity.id
            },
            backgroundColor: '#8b5cf6',
            borderColor: '#7c3aed'
          });
        });
      });
    }
    
    setCalendarEvents(newCalendarEvents);
  };

  const handleEventClick = (info: any) => {
    // For activities, prevent default navigation and show details
    if (info.event.extendedProps.type === 'activity') {
      info.jsEvent.preventDefault();
      
      const activity = activities.find(a => a.id === info.event.extendedProps.originalId);
      if (activity) {
        toast(
          <div>
            <h3 className="font-bold">{activity.title}</h3>
            <p>Every {activity.day_of_week} at {activity.time}</p>
            <p>Location: {activity.location}</p>
            {activity.category && <p>Category: {activity.category}</p>}
          </div>,
          {
            duration: 5000,
            style: {
              background: '#1e293b',
              color: '#fff',
              maxWidth: '500px'
            }
          }
        );
      }
    }
  };

  const handleDateClick = (info: any) => {
    // Only admin users can add events
    if (user?.role === 'admin') {
      const clickedDate = new Date(info.dateStr);
      const formattedDate = format(clickedDate, 'yyyy-MM-dd');
      
      // Show options to add event or activity
      toast(
        <div className="space-y-2">
          <h3 className="font-bold">Add to Calendar</h3>
          <div className="flex flex-col space-y-2">
            <Link 
              to={`/admin/events/new?date=${formattedDate}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-center"
            >
              Add Event
            </Link>
            <Link 
              to="/admin/activities"
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-center"
            >
              Add Activity
            </Link>
          </div>
        </div>,
        {
          duration: 5000,
          style: {
            background: '#1e293b',
            color: '#fff'
          }
        }
      );
    }
  };

  const handleViewChange = (viewType: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setViewType(viewType);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewType);
    }
  };

  const handlePrint = async () => {
    if (!calendarRef.current) return;
    
    try {
      const calendarEl = document.querySelector('.fc') as HTMLElement;
      if (!calendarEl) return;
      
      toast.loading('Generating PDF...');
      
      // Create a clone of the calendar to avoid modifying the original
      const calendarClone = calendarEl.cloneNode(true) as HTMLElement;
      calendarClone.style.width = '100%';
      calendarClone.style.height = 'auto';
      calendarClone.style.backgroundColor = 'white';
      
      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1100px'; // Fixed width for PDF
      container.appendChild(calendarClone);
      document.body.appendChild(container);
      
      // Generate canvas from the clone
      const canvas = await html2canvas(calendarClone, {
        scale: 1.5, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove the temporary container
      document.body.removeChild(container);
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('church-calendar.pdf');
      
      toast.dismiss();
      toast.success('Calendar downloaded as PDF');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareTitle = 'Grace Church Calendar';
    const shareText = 'Check out our church calendar for upcoming events and activities!';
    
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareUrl)
        .then(() => toast.success('Calendar link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy calendar link'));
    }
  };

  // Get unique categories from activities
  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    activities.forEach(activity => {
      if (activity.category) categories.add(activity.category);
    });
    events.forEach(event => {
      if (event.visibility) categories.add(event.visibility);
    });
    return Array.from(categories);
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Church Calendar</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          View all our events and activities in one place. Plan your involvement and stay connected with our church community.
        </p>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          {/* View Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-4 py-2 rounded-lg flex items-center ${
                viewType === 'dayGridMonth'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <CalendarIcon size={18} className="mr-2" />
              Month
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-4 py-2 rounded-lg flex items-center ${
                viewType === 'timeGridWeek'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Grid size={18} className="mr-2" />
              Week
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-4 py-2 rounded-lg flex items-center ${
                viewType === 'timeGridDay'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <List size={18} className="mr-2" />
              Day
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-2">
            <div className="relative">
              <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
                <Filter size={18} className="text-gray-400 mr-2" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-transparent border-none text-white focus:outline-none appearance-none pr-8"
                >
                  <option value="all">All Items</option>
                  <option value="events">Events Only</option>
                  <option value="activities">Activities Only</option>
                </select>
                <ChevronDown size={16} className="text-gray-400 absolute right-3" />
              </div>
            </div>
            
            <div className="relative">
              <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2">
                <Filter size={18} className="text-gray-400 mr-2" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none appearance-none pr-8"
                >
                  <option value="all">All Categories</option>
                  {getUniqueCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-gray-400 absolute right-3" />
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
            <button
              onClick={handleShare}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Share2 size={18} className="mr-2" />
              Share
            </button>
            {user?.role === 'admin' && (
              <Link
                to="/admin/events/new"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity"
              >
                <Plus size={18} className="mr-2" />
                Add Event
              </Link>
            )}
          </div>
        </div>
        
        <div className="calendar-container bg-gray-900 rounded-xl p-4 overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewType}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            aspectRatio={1.8}
            firstDay={0} // Sunday as first day
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            allDaySlot={true}
            allDayText="All Day"
            dayMaxEvents={3}
            eventDisplay="block"
            displayEventTime={true}
            nowIndicator={true}
            navLinks={true}
            editable={false}
            selectable={user?.role === 'admin'}
            selectMirror={true}
            dayMaxEventRows={true}
            eventClassNames="cursor-pointer"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <CalendarIcon size={24} className="text-blue-400 mr-2" />
            Upcoming Events
          </h2>
          
          {events.length > 0 ? (
            <div className="space-y-4">
              {events
                .filter(event => new Date(event.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map(event => (
                  <Link 
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-blue-400 text-sm">
                          {format(parseISO(event.date), 'MMMM d, yyyy')} • {event.time}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">{event.location}</p>
                      </div>
                      <div className="bg-blue-500 bg-opacity-20 text-blue-400 text-xs px-2 py-1 rounded-full">
                        Event
                      </div>
                    </div>
                  </Link>
                ))}
              
              <Link 
                to="/events" 
                className="block text-center text-blue-400 hover:text-blue-300 transition-colors mt-4"
              >
                View All Events →
              </Link>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">No upcoming events scheduled.</p>
          )}
        </div>
        
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Clock size={24} className="text-purple-400 mr-2" />
            Weekly Activities
          </h2>
          
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities
                .sort((a, b) => getDayNumber(a.day_of_week) - getDayNumber(b.day_of_week))
                .slice(0, 5)
                .map(activity => (
                  <div 
                    key={activity.id}
                    className="block bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{activity.title}</h3>
                        <p className="text-purple-400 text-sm">
                          Every {activity.day_of_week} • {activity.time}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">{activity.location}</p>
                      </div>
                      <div className="bg-purple-500 bg-opacity-20 text-purple-400 text-xs px-2 py-1 rounded-full">
                        {activity.category || 'Activity'}
                      </div>
                    </div>
                  </div>
                ))}
              
              <Link 
                to="/activities" 
                className="block text-center text-purple-400 hover:text-purple-300 transition-colors mt-4"
              >
                View All Activities →
              </Link>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">No weekly activities scheduled.</p>
          )}
        </div>
      </div>
      
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Need More Information?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          If you have questions about our events or activities, or need assistance with the calendar, please don't hesitate to reach out.
        </p>
        <Link 
          to="/contact" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default Calendar;