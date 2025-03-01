import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguageStore } from '../store/languageStore';

interface ChurchInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

interface Activity {
  id: string;
  day_of_week: string;
  title: string;
  time: string;
}

const Footer: React.FC = () => {
  const { t, language } = useLanguageStore();
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: 'Grace Church',
    tagline: 'Bringing hope, faith, and community to all who seek it.',
    email: 'info@gracechurch.org',
    phone: '(123) 456-7890',
    address: '123 Faith Street, City, State 12345'
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });

  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch church info and social links from database
    const fetchSettings = async () => {
      try {
        const { data: churchData, error: churchError } = await supabase
          .from('settings')
          .select('*')
          .eq('type', 'church_info')
          .single();
        
        if (churchData && !churchError) {
          setChurchInfo(churchData.data as ChurchInfo);
        }

        const { data: socialData, error: socialError } = await supabase
          .from('settings')
          .select('*')
          .eq('type', 'social_links')
          .single();
        
        if (socialData && !socialError) {
          setSocialLinks(socialData.data as SocialLinks);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    // Fetch activities
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('id, day_of_week, title, time')
          .order('day_of_week');
        
        if (data && !error) {
          // Sort activities by day of week (starting with Sunday)
          const dayOrder = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
          };
          
          const sortedActivities = [...data].sort((a, b) => 
            dayOrder[a.day_of_week as keyof typeof dayOrder] - dayOrder[b.day_of_week as keyof typeof dayOrder]
          );
          
          setActivities(sortedActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchSettings();
    fetchActivities();
  }, []);

  // Get day abbreviation
  const getDayAbbreviation = (day: string): string => {
    if (language === 'es') {
      switch (day) {
        case 'Sunday': return 'Dom';
        case 'Monday': return 'Lun';
        case 'Tuesday': return 'Mar';
        case 'Wednesday': return 'Mié';
        case 'Thursday': return 'Jue';
        case 'Friday': return 'Vie';
        case 'Saturday': return 'Sáb';
        default: return day.substring(0, 3);
      }
    } else {
      switch (day) {
        case 'Sunday': return 'Sun';
        case 'Monday': return 'Mon';
        case 'Tuesday': return 'Tue';
        case 'Wednesday': return 'Wed';
        case 'Thursday': return 'Thu';
        case 'Friday': return 'Fri';
        case 'Saturday': return 'Sat';
        default: return day.substring(0, 3);
      }
    }
  };

  return (
    <footer className="bg-black bg-opacity-50 backdrop-blur-md text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {churchInfo.name}
            </h3>
            <p className="text-gray-300 mb-4">
              {churchInfo.tagline}
            </p>
            <div className="flex space-x-4">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <Facebook size={20} />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <Instagram size={20} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                  <Youtube size={20} />
                </a>
              )}
              {!socialLinks.facebook && !socialLinks.instagram && !socialLinks.twitter && !socialLinks.youtube && (
                <>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <Twitter size={20} />
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors">
                    <Youtube size={20} />
                  </a>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('quick_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-white transition-colors">
                  {t('events')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-300 hover:text-white transition-colors">
                  {t('news')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-300 hover:text-white transition-colors">
                  {t('gallery')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('weekly_activities_footer')}</h3>
            {activities.length > 0 ? (
              <ul className="space-y-2 text-gray-300">
                {activities.slice(0, 4).map((activity) => (
                  <li key={activity.id} className="flex items-center">
                    <Clock size={14} className="mr-2 text-blue-400 flex-shrink-0" />
                    <span>
                      {getDayAbbreviation(activity.day_of_week)} - {activity.title} {activity.time}
                    </span>
                  </li>
                ))}
                <li className="mt-3">
                  <Link to="/activities" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                    {t('view_all_activities')} →
                  </Link>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-blue-400 flex-shrink-0" />
                  <span>{language === 'es' ? 'Mié - Hombres 7:00 PM' : 'Wed - Men 7:00 PM'}</span>
                </li>
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-blue-400 flex-shrink-0" />
                  <span>{language === 'es' ? 'Jue - Mujeres 7:00 PM' : 'Thu - Women 7:00 PM'}</span>
                </li>
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-blue-400 flex-shrink-0" />
                  <span>{language === 'es' ? 'Vie - Jóvenes 6:30 PM' : 'Fri - Youth 6:30 PM'}</span>
                </li>
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-blue-400 flex-shrink-0" />
                  <span>{language === 'es' ? 'Dom - Servicio 3:00 PM' : 'Sun - Service 3:00 PM'}</span>
                </li>
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('contact_information')}</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <MapPin size={16} className="mr-2" />
                {churchInfo.address}
              </li>
              <li className="flex items-center">
                <Phone size={16} className="mr-2" />
                {churchInfo.phone}
              </li>
              <li className="flex items-center">
                <Mail size={16} className="mr-2" />
                {churchInfo.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {churchInfo.name}. {t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;