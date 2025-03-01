import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { toast } from 'react-hot-toast';

const SignIn: React.FC = () => {
  const { t } = useLanguageStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('enter_email_password'));
      return;
    }
    
    try {
      setIsLoading(true);
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(t('invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">{t('welcome_back')}</h1>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              {t('email_address')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? t('signing_in') : t('sign_in')}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-400">
            {t('no_account')}{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
              {t('sign_up')}
            </Link>
          </p>
          <p className="text-gray-400">
            <Link to="/create-admin" className="text-blue-400 hover:text-blue-300 transition-colors">
              {t('create_admin_account')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;