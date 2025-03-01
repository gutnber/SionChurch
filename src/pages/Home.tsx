import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { format, parseISO, isFuture } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

interface HomePageContent {
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  welcome_title: string;
  welcome_text: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
}

interface Activity {
  id: string;
  day_of_week: string;
  title: string;
  description: string;
  time: string;
  location: string;
}

const Home: React.FC = () => {
  const { t, language } = useLanguageStore();
  const { user } = useAuthStore();
  const [homeContent, setHomeContent] = useState<HomePageContent>({
    hero_title: 'Welcome to Grace Church',
    hero_subtitle: 'A place of worship, community, and spiritual growth for all',
    hero_image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
    welcome_title: 'Join Us for Worship',
    welcome_text: 'Weekly services and gatherings'
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchHomeContent(),
        fetchEvents(),
        fetchActivities()
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const fetchHomeContent = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('type', 'home_page')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record doesn't exist yet, use default values
          console.log('No home page settings found, using defaults');
        } else {
          throw error;
        }
      }
      
      if (data && data.data) {
        setHomeContent(data.data as HomePageContent);
      }
    } catch (error) {
      console.error('Error fetching home page content:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      
      // Filter for upcoming events only
      const upcomingEvents = (data || [])
        .filter(event => isFuture(new Date(event.date)))
        .slice(0, 3);
      
      setEvents(upcomingEvents);
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
    }
  };

  // Get day name based on language
  const getDayName = (day: string): string => {
    if (language === 'es') {
      switch (day) {
        case 'Sunday': return 'Domingo';
        case 'Monday': return 'Lunes';
        case 'Tuesday': return 'Martes';
        case 'Wednesday': return 'Miércoles';
        case 'Thursday': return 'Jueves';
        case 'Friday': return 'Viernes';
        case 'Saturday': return 'Sábado';
        default: return day;
      }
    }
    return day;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden rounded-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src={homeContent.hero_image}
            alt="Church"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {language === 'es' ? t('welcome_church') : homeContent.hero_title}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {language === 'es' ? t('church_subtitle') : homeContent.hero_subtitle}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              to="/events" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
            >
              {t('upcoming_events')}
            </Link>
            <Link 
              to="/contact" 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-white hover:text-gray-900 transition-colors"
            >
              {t('contact_us')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Service Times */}
      <section className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            {language === 'es' ? t('join_us_worship') : homeContent.welcome_title}
          </h2>
          <p className="text-gray-300">
            {language === 'es' ? t('weekly_services') : homeContent.welcome_text}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activities.length > 0 ? (
            activities.slice(0, 3).map((activity, index) => (
              <div key={activity.id} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl">
                <div className={`${
                  index === 0 ? 'bg-blue-500' : 
                  index === 1 ? 'bg-purple-600' : 
                  'bg-gradient-to-r from-blue-500 to-purple-600'
                } rounded-full w-12 h-12 flex items-center justify-center mb-4`}>
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                <p className="text-gray-300 mb-4">
                  {getDayName(activity.day_of_week)} {t('at')} {activity.time}
                </p>
                <p className="text-gray-400">{activity.description}</p>
              </div>
            ))
          ) : (
            // Fallback if no activities
            <>
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl">
                <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('sunday_service')}</h3>
                <p className="text-gray-300 mb-4">3:00 PM</p>
                <p className="text-gray-400">{t('join_worship_description')}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl">
                <div className="bg-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('bible_study')}</h3>
                <p className="text-gray-300 mb-4">{t('wednesday')} 7:00 PM</p>
                <p className="text-gray-400">{t('bible_study_description')}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('youth')}</h3>
                <p className="text-gray-300 mb-4">{t('friday')} 6:30 PM</p>
                <p className="text-gray-400">{t('youth_description')}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Events */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{t('upcoming_events')}</h2>
          <Link to="/events" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
            {t('view_all')} <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden">
                <img 
                  src={event.image_url || `https://images.unsplash.com/photo-1507036066871-b7e8032b3dea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`}
                  alt="Event"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-sm text-blue-400 mb-2">
                    {format(parseISO(event.date), language === 'es' ? 'dd MMM, yyyy' : 'MMM dd, yyyy')}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-300 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <Link 
                    to={`/events/${event.id}`} 
                    className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
                  >
                    {t('learn_more')}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            // Fallback if no events
            [1, 2, 3].map((item) => (
              <div key={item} className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-${item === 1 ? '1507036066871-b7e8032b3dea' : item === 2 ? '1501281668581-f7b9b0eec847' : '1472746729193-0533d2b762da'}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`}
                  alt="Event"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-sm text-blue-400 mb-2">
                    {item === 1 ? 'Jun 15, 2025' : item === 2 ? 'Jun 22, 2025' : 'Jul 5, 2025'}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {item === 1 ? t('summer_bible_camp') : item === 2 ? t('community_outreach') : t('worship_night')}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {item === 1 
                      ? t('bible_camp_description')
                      : item === 2 
                        ? t('outreach_description')
                        : t('worship_night_description')}
                  </p>
                  <Link 
                    to={`/events/${item}`} 
                    className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
                  >
                    {t('learn_more')}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bible Q&A Teaser */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h2 className="text-3xl font-bold mb-4">{t('bible_questions')}</h2>
            <p className="text-gray-200 mb-6">
              {t('bible_qa_description')}
            </p>
            <Link 
              to="/bible-qa" 
              className="inline-block bg-white text-gray-900 px-6 py-3 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {t('ask_question')}
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-black bg-opacity-30 p-6 rounded-xl max-w-md">
              <div className="flex items-center mb-4">
                <BookOpen size={24} className="text-blue-400 mr-2" />
                <h3 className="text-xl font-semibold">{t('sample_question')}</h3>
              </div>
              <p className="text-gray-300 italic mb-4">
                {t('forgiveness_question')}
              </p>
              <div className="bg-black bg-opacity-50 p-4 rounded-lg">
                <p className="text-gray-200">
                  {language === 'es' 
                    ? "La Biblia enseña que el perdón es central para la fe cristiana. En Mateo 6:14-15, Jesús dice: 'Porque si perdonáis a los hombres sus ofensas, os perdonará también a vosotros vuestro Padre celestial; mas si no perdonáis a los hombres sus ofensas, tampoco vuestro Padre os perdonará vuestras ofensas.'"
                    : "The Bible teaches that forgiveness is central to the Christian faith. In Matthew 6:14-15, Jesus says, \"For if you forgive other people when they sin against you, your heavenly Father will also forgive you. But if you do not forgive others their sins, your Father will not forgive your sins.\""
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-4">{t('join_community')}</h2>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          {t('community_description')}
        </p>
        <Link 
          to="/signup" 
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
        >
          {t('sign_up_today')}
        </Link>
      </section>
    </div>
  );
};

export default Home;