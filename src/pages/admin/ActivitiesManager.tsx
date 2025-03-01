import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Clock, Plus, Search, Trash2, Edit, Filter, Calendar, MapPin, User } from 'lucide-react';

interface Activity {
  id: string;
  day_of_week: string;
  title: string;
  description: string;
  time: string;
  location: string;
  leader?: string;
  category?: string;
}

const ActivitiesManager: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    id: '',
    day_of_week: 'Sunday',
    title: '',
    description: '',
    time: '',
    location: '',
    leader: '',
    category: 'All'
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const categories = ['All', 'Men', 'Women', 'Youth', 'Marriage', 'Prayer', 'Bible Study'];

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('day_of_week')
        .order('time');

      if (error) throw error;
      
      // If no activities, add sample ones
      if (!data || data.length === 0) {
        const sampleActivities = generateSampleActivities();
        setActivities(sampleActivities);
      } else {
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleActivities = (): Activity[] => {
    return [
      {
        id: '1',
        day_of_week: 'Sunday',
        title: 'Morning Worship Service',
        description: 'Join us for worship, prayer, and an inspiring message from our pastor.',
        time: '09:00 AM',
        location: 'Main Sanctuary',
        category: 'All'
      },
      {
        id: '2',
        day_of_week: 'Sunday',
        title: 'Sunday School',
        description: 'Bible study classes for all ages.',
        time: '11:00 AM',
        location: 'Education Building',
        category: 'All'
      },
      {
        id: '3',
        day_of_week: 'Sunday',
        title: 'Evening Service',
        description: 'A more intimate worship experience with communion on the first Sunday of each month.',
        time: '06:00 PM',
        location: 'Chapel',
        category: 'All'
      },
      {
        id: '4',
        day_of_week: 'Wednesday',
        title: 'Bible Study',
        description: 'Mid-week Bible study and prayer meeting.',
        time: '07:00 PM',
        location: 'Fellowship Hall',
        category: 'Bible Study'
      },
      {
        id: '5',
        day_of_week: 'Friday',
        title: 'Youth Group',
        description: 'Fun, fellowship, and faith for teens and young adults.',
        time: '06:30 PM',
        location: 'Youth Center',
        category: 'Youth'
      },
      {
        id: '6',
        day_of_week: 'Monday',
        title: 'Prayer Warriors',
        description: 'Dedicated prayer time for the church, community, and world needs.',
        time: '07:00 PM',
        location: 'Prayer Room',
        leader: 'Pastor Johnson',
        category: 'Prayer'
      },
      {
        id: '7',
        day_of_week: 'Tuesday',
        title: 'Women\'s Bible Study',
        description: 'Weekly gathering for women to study Scripture and support one another.',
        time: '10:00 AM',
        location: 'Fellowship Hall',
        leader: 'Sarah Williams',
        category: 'Women'
      },
      {
        id: '8',
        day_of_week: 'Wednesday',
        title: 'Marriage Enrichment',
        description: 'Building stronger marriages through biblical principles and practical advice.',
        time: '06:30 PM',
        location: 'Room 201',
        leader: 'John & Mary Davis',
        category: 'Marriage'
      },
      {
        id: '9',
        day_of_week: 'Friday',
        title: 'Men\'s Fellowship',
        description: 'Comradery, knowledge, growth, instruction and fun for the Men of God.',
        time: '07:00 PM',
        location: 'Chicken Wings or Church (Pool)',
        leader: 'Brother Mike',
        category: 'Men'
      }
    ];
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setActivities(activities.filter(activity => activity.id !== id));
      toast.success('Activity deleted successfully');
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast.error(error.message || 'Failed to delete activity');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (activity: Activity) => {
    setCurrentActivity(activity);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setCurrentActivity({
      id: '',
      day_of_week: 'Sunday',
      title: '',
      description: '',
      time: '',
      location: '',
      leader: '',
      category: 'All'
    });
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentActivity(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentActivity.title || !currentActivity.time || !currentActivity.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      if (isEditing) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update({
            day_of_week: currentActivity.day_of_week,
            title: currentActivity.title,
            description: currentActivity.description,
            time: currentActivity.time,
            location: currentActivity.location,
            leader: currentActivity.leader,
            category: currentActivity.category
          })
          .eq('id', currentActivity.id);
          
        if (error) throw error;
        
        setActivities(activities.map(activity => 
          activity.id === currentActivity.id ? currentActivity : activity
        ));
        
        toast.success('Activity updated successfully');
      } else {
        // Create new activity
        const { data, error } = await supabase
          .from('activities')
          .insert({
            day_of_week: currentActivity.day_of_week,
            title: currentActivity.title,
            description: currentActivity.description,
            time: currentActivity.time,
            location: currentActivity.location,
            leader: currentActivity.leader,
            category: currentActivity.category
          })
          .select();
          
        if (error) throw error;
        
        if (data) {
          setActivities([...activities, data[0]]);
        }
        
        toast.success('Activity created successfully');
      }
      
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast.error(error.message || 'Failed to save activity');
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = filterDay === 'all' || activity.day_of_week === filterDay;
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory;
    
    return matchesSearch && matchesDay && matchesCategory;
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
        <h1 className="text-3xl font-bold">Activities Management</h1>
        
        <button 
          onClick={handleAddNew}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center md:justify-start"
        >
          <Plus size={18} className="mr-2" />
          Add New Activity
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          
          <div className="flex items-center">
            <Calendar size={18} className="text-gray-400 mr-2" />
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="all">All Days</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <Filter size={18} className="text-gray-400 mr-2" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Activity Form */}
      {isFormOpen && (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Activity' : 'Add New Activity'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Day of Week*
                </label>
                <select
                  name="day_of_week"
                  value={currentActivity.day_of_week}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={currentActivity.category}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Activity Title*
              </label>
              <input
                type="text"
                name="title"
                value={currentActivity.title}
                onChange={handleFormChange}
                required
                placeholder="e.g., Men's Fellowship"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={currentActivity.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Describe the activity..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Time*
                </label>
                <input
                  type="text"
                  name="time"
                  value={currentActivity.time}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., 7:00 PM"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Location*
                </label>
                <input
                  type="text"
                  name="location"
                  value={currentActivity.location}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., Fellowship Hall"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Leader/Organizer
              </label>
              <input
                type="text"
                name="leader"
                value={currentActivity.leader || ''}
                onChange={handleFormChange}
                placeholder="e.g., Brother Mike"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                {isEditing ? 'Update Activity' : 'Add Activity'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Activities List */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 hover:bg-opacity-60 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{activity.title}</h3>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Calendar size={14} className="mr-1" />
                    <span>{activity.day_of_week}</span>
                    <span className="mx-2">•</span>
                    <Clock size={14} className="mr-1" />
                    <span>{activity.time}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    disabled={isDeleting === activity.id}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {isDeleting === activity.id ? (
                      <div className="h-4 w-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
              
              {activity.category && (
                <div className="mb-3">
                  <span className="inline-block text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300 px-2 py-0.5 rounded-full">
                    {activity.category}
                  </span>
                </div>
              )}
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{activity.description}</p>
              
              <div className="flex flex-wrap gap-y-2 text-sm">
                <div className="flex items-center text-gray-400 mr-6">
                  <MapPin size={16} className="mr-1" />
                  <span>{activity.location}</span>
                </div>
                
                {activity.leader && (
                  <div className="flex items-center text-gray-400">
                    <User size={16} className="mr-1" />
                    <span>{activity.leader}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-12 text-center">
          <Clock size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold mb-2">No Activities Found</h2>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterDay !== 'all' || filterCategory !== 'all'
              ? 'No activities match your search criteria. Try adjusting your filters.'
              : 'You haven\'t created any activities yet.'}
          </p>
          <button 
            onClick={handleAddNew}
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Create Your First Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivitiesManager;