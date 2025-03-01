import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, Calendar, Users, Plus, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

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

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('Sunday');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { user } = useAuthStore();

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
        .order('time');

      if (error) throw error;

      // Group activities by day of week
      const groupedActivities: Record<string, Activity[]> = {};
      
      daysOfWeek.forEach(day => {
        groupedActivities[day] = [];
      });

      data?.forEach(activity => {
        if (groupedActivities[activity.day_of_week]) {
          groupedActivities[activity.day_of_week].push(activity);
        }
      });

      setActivities(groupedActivities);
      
      // Set active day to the first day that has activities, or Sunday by default
      const firstDayWithActivities = daysOfWeek.find(day => groupedActivities[day].length > 0) || 'Sunday';
      setActiveDay(firstDayWithActivities);
      
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample activities for demonstration
  useEffect(() => {
    if (!isLoading && Object.values(activities).flat().length === 0) {
      const sampleActivities: Record<string, Activity[]> = {
        'Sunday': [
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
          }
        ],
        'Monday': [
          {
            id: '6',
            day_of_week: 'Monday',
            title: 'Prayer Warriors',
            description: 'Dedicated prayer time for the church, community, and world needs.',
            time: '07:00 PM',
            location: 'Prayer Room',
            leader: 'Pastor Johnson',
            category: 'Prayer'
          }
        ],
        'Tuesday': [
          {
            id: '7',
            day_of_week: 'Tuesday',
            title: 'Women\'s Bible Study',
            description: 'Weekly gathering for women to study Scripture and support one another.',
            time: '10:00 AM',
            location: 'Fellowship Hall',
            leader: 'Sarah Williams',
            category: 'Women'
          }
        ],
        'Wednesday': [
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
            id: '8',
            day_of_week: 'Wednesday',
            title: 'Marriage Enrichment',
            description: 'Building stronger marriages through biblical principles and practical advice.',
            time: '06:30 PM',
            location: 'Room 201',
            leader: 'John & Mary Davis',
            category: 'Marriage'
          }
        ],
        'Thursday': [],
        'Friday': [
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
            id: '9',
            day_of_week: 'Friday',
            title: 'Men\'s Fellowship',
            description: 'Comradery, knowledge, growth, instruction and fun for the Men of God.',
            time: '07:00 PM',
            location: 'Chicken Wings or Church (Pool)',
            leader: 'Brother Mike',
            category: 'Men'
          }
        ],
        'Saturday': [
          {
            id: '10',
            day_of_week: 'Saturday',
            title: 'Community Service',
            description: 'Serving our local community through various outreach projects.',
            time: '09:00 AM',
            location: 'Meet at Church Parking Lot',
            leader: 'Outreach Team',
            category: 'All'
          }
        ]
      };
      
      setActivities(sampleActivities);
      setActiveDay('Sunday');
    }
  }, [isLoading, activities]);

  const filteredActivities = activeCategory && activeCategory !== 'All'
    ? activities[activeDay]?.filter(activity => activity.category === activeCategory)
    : activities[activeDay];

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
        <h1 className="text-4xl font-bold mb-4">Weekly Activities</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Join us throughout the week for worship, study, fellowship, and service opportunities.
        </p>
      </div>
      
      {user?.role === 'admin' && (
        <div className="mb-8 flex justify-end">
          <Link 
            to="/admin/activities" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity flex items-center"
          >
            <Clock size={18} className="mr-2" />
            Manage Activities
          </Link>
        </div>
      )}
      
      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex space-x-2 mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category === 'All' ? null : category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  (category === 'All' && !activeCategory) || activeCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Day Selector */}
      <div className="flex overflow-x-auto pb-4 mb-8 scrollbar-hide">
        <div className="flex space-x-2 mx-auto">
          {daysOfWeek.map((day) => {
            const filteredCount = activeCategory && activeCategory !== 'All'
              ? activities[day]?.filter(activity => activity.category === activeCategory).length
              : activities[day]?.length;
              
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeDay === day
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {day}
                {filteredCount > 0 && (
                  <span className="ml-2 bg-white bg-opacity-20 text-white text-xs rounded-full px-2 py-0.5">
                    {filteredCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Activities for Selected Day */}
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Calendar size={24} className="mr-2 text-blue-400" />
          {activeDay} Activities
          {activeCategory && activeCategory !== 'All' && (
            <span className="ml-2 text-sm bg-blue-500 bg-opacity-20 px-2 py-1 rounded-full">
              {activeCategory}
            </span>
          )}
        </h2>
        
        {filteredActivities?.length > 0 ? (
          <div className="space-y-6">
            {filteredActivities.map((activity, index) => (
              <motion.div 
                key={activity.id} 
                className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 transition-transform hover:scale-[1.01]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{activity.title}</h3>
                    {activity.category && activity.category !== 'All' && (
                      <span className="inline-block mt-1 text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300 px-2 py-0.5 rounded-full">
                        {activity.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <Clock size={18} className="text-blue-400 mr-2" />
                    <span className="text-gray-300">{activity.time}</span>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">{activity.description}</p>
                
                <div className="flex flex-wrap gap-y-2">
                  <div className="flex items-center text-gray-400 mr-6">
                    <MapPin size={18} className="mr-2" />
                    <span>{activity.location}</span>
                  </div>
                  
                  {activity.leader && (
                    <div className="flex items-center text-gray-400">
                      <User size={18} className="mr-2" />
                      <span>Led by: {activity.leader}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">No activities scheduled for {activeDay}{activeCategory ? ` in ${activeCategory}` : ''}</p>
            <p>Check other days or categories for more information.</p>
          </div>
        )}
      </div>
      
      {/* Call to Action */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Want to Get Involved?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          We have many opportunities to serve and participate in our church community.
          Contact us to learn more about how you can get involved.
        </p>
        <Link 
          to="/contact" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default Activities;