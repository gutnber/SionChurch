import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

interface ChurchInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
}

const Contact: React.FC = () => {
  const { t } = useLanguageStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: 'Grace Church',
    tagline: 'A place of worship, community, and spiritual growth for all',
    email: 'info@gracechurch.org',
    phone: '(123) 456-7890',
    address: '123 Faith Street, City, State 12345'
  });
  const { user } = useAuthStore();

  useEffect(() => {
    // Pre-fill form with user data if logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }

    // Fetch church info from database
    const fetchChurchInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('type', 'church_info')
          .single();
        
        if (data && !error) {
          setChurchInfo(data.data as ChurchInfo);
        }
      } catch (error) {
        console.error('Error fetching church info:', error);
      }
    };

    fetchChurchInfo();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success(t('message_sent_success'));
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('contact_us_title')}</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {t('contact_description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">{t('send_message')}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                {t('your_name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('email_address')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  {t('phone_number')}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">
                {t('subject')}
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="">{t('select_subject')}</option>
                <option value="General Inquiry">{t('general_inquiry')}</option>
                <option value="Prayer Request">{t('prayer_request')}</option>
                <option value="Volunteering">{t('volunteering')}</option>
                <option value="Membership">{t('membership')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                {t('your_message')}
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>{t('sending_message')}</>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  {t('send_message_button')}
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">{t('contact_information')}</h2>
            
            <div className="space-y-6">
              <div className="flex">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{t('our_location')}</h3>
                  <p className="text-gray-300">{churchInfo.address}</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{t('phone')}</h3>
                  <p className="text-gray-300">{churchInfo.phone}</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{t('email')}</h3>
                  <p className="text-gray-300">{churchInfo.email}</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{t('sunday_service')}</h3>
                  <p className="text-gray-300">3:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">{t('find_us')}</h2>
            <div className="rounded-lg overflow-hidden h-64 bg-gray-800">
              {/* Placeholder for map - in a real implementation, you would use Google Maps or similar */}
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <p className="text-gray-400">{t('map_placeholder')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;