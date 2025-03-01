import React from 'react';
import { useLanguageStore, Language } from '../store/languageStore';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <div className="flex items-center">
      <Globe size={16} className="mr-2 text-gray-300" />
      <select
        value={language}
        onChange={handleChange}
        className="bg-transparent text-gray-300 border-none focus:outline-none cursor-pointer"
      >
        <option value="en">{t('english')}</option>
        <option value="es">{t('spanish')}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;