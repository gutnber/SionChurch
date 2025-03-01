import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CreateAdmin: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(false);

  useEffect(() => {
    // Check if admin user already exists
    const checkAdminUser = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'henrygutierrezbaja@gmail.com')
          .single();
          
        if (data) {
          setUserExists(true);
        }
      } catch (error) {
        // User doesn't exist, which is fine
        console.log('Admin user does not exist yet');
      }
    };
    
    checkAdminUser();
  }, []);

  const createAdminUser = async () => {
    try {
      setIsCreating(true);
      setError('');
      
      // Create the admin user with the specified email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'henrygutierrezbaja@gmail.com',
        password: '110203Gl!',
        options: {
          data: {
            name: 'Admin User',
            phone: '(123) 456-7890'
          }
        }
      });

      if (signUpError) throw signUpError;

      // Check if the user was created successfully
      if (data?.user) {
        // Manually create the profile to ensure it exists
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: 'henrygutierrezbaja@gmail.com',
            name: 'Admin User',
            phone: '(123) 456-7890',
            role: 'admin'
          })
          .select();
            
        if (insertError) {
          console.error('Error creating profile:', insertError);
          // If insert fails, try update
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', data.user.id);
            
          if (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }

        toast.success('Admin user created successfully!');
        setIsComplete(true);
      } else {
        throw new Error('Failed to create admin user');
      }
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      
      // Handle user already exists error
      if (error.message?.includes('User already registered')) {
        setError('Admin user already exists. You can sign in with the provided credentials.');
        setIsComplete(true);
      } else {
        setError(error.message || 'An error occurred while creating the admin user');
        toast.error(error.message || 'Failed to create admin user');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Account Setup</h1>
        
        {error && !isComplete && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isComplete || userExists ? (
          <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-100 px-4 py-3 rounded mb-4">
            <p className="font-medium">Admin user {userExists ? 'already exists' : 'created successfully'}!</p>
            <p className="mt-2">
              Email: henrygutierrezbaja@gmail.com<br />
              Password: 110203Gl!
            </p>
            <p className="mt-2">You can now sign in with these credentials.</p>
            
            <div className="mt-4">
              <Link 
                to="/signin" 
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-center"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-6">
              This will create an admin user with the following credentials:
            </p>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <p className="mb-2">
                <span className="text-gray-400">Email:</span> henrygutierrezbaja@gmail.com
              </p>
              <p>
                <span className="text-gray-400">Password:</span> 110203Gl!
              </p>
            </div>
            
            <button
              onClick={createAdminUser}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Admin User...' : 'Create Admin User'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateAdmin;