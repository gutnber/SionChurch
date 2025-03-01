import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { toast } from 'react-hot-toast';
import { Palette, Plus, Trash2, Check, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ChurchInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

const Settings: React.FC = () => {
  const { themes, activeTheme, setActiveTheme, addTheme, updateTheme, deleteTheme } = useThemeStore();
  
  const [newTheme, setNewTheme] = useState({
    name: '',
    primaryColor: '#121212',
    secondaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
  });

  const [churchInfo, setChurchInfo] = useState<ChurchInfo>({
    name: 'Grace Church',
    tagline: 'A place of worship, community, and spiritual growth for all',
    email: 'info@gracechurch.org',
    phone: '(123) 456-7890',
    address: '123 Faith Street, City, State 12345',
    logoUrl: ''
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: ''
  });

  const [isSavingChurchInfo, setIsSavingChurchInfo] = useState(false);
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    fetchSettings();
  }, []);

  const handleAddTheme = async () => {
    if (!newTheme.name) {
      toast.error('Please provide a theme name');
      return;
    }
    
    await addTheme(newTheme);
    
    // Reset form
    setNewTheme({
      name: '',
      primaryColor: '#121212',
      secondaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
    });
  };

  const handleChurchInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChurchInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialLinks(prev => ({ ...prev, [name]: value }));
  };

  const saveChurchInfo = async () => {
    try {
      setIsSavingChurchInfo(true);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          type: 'church_info',
          data: churchInfo
        }, {
          onConflict: 'type'
        });
      
      if (error) throw error;
      
      toast.success('Church information saved successfully!');
    } catch (error: any) {
      console.error('Error saving church info:', error);
      toast.error(error.message || 'Failed to save church information');
    } finally {
      setIsSavingChurchInfo(false);
    }
  };

  const saveSocialLinks = async () => {
    try {
      setIsSavingSocialLinks(true);
      
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          type: 'social_links',
          data: socialLinks
        }, {
          onConflict: 'type'
        });
      
      if (error) throw error;
      
      toast.success('Social links saved successfully!');
    } catch (error: any) {
      console.error('Error saving social links:', error);
      toast.error(error.message || 'Failed to save social links');
    } finally {
      setIsSavingSocialLinks(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      setIsUploadingLogo(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);
      
      // Update church info with the new logo URL
      const logoUrl = urlData.publicUrl;
      setChurchInfo(prev => ({ ...prev, logoUrl }));
      
      // Save the updated church info
      await supabase
        .from('settings')
        .upsert({
          type: 'church_info',
          data: { ...churchInfo, logoUrl }
        }, {
          onConflict: 'type'
        });
      
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setIsUploadingLogo(true);
      
      // If there's a logo URL, extract the file path to delete from storage
      if (churchInfo.logoUrl) {
        const urlParts = churchInfo.logoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `logos/${fileName}`;
        
        // Try to delete the file from storage (don't throw if it fails)
        await supabase.storage
          .from('church-assets')
          .remove([filePath])
          .catch(err => console.warn('Could not delete file from storage:', err));
      }
      
      // Update church info to remove the logo URL
      const updatedInfo = { ...churchInfo };
      delete updatedInfo.logoUrl;
      
      // Save the updated church info
      const { error } = await supabase
        .from('settings')
        .upsert({
          type: 'church_info',
          data: updatedInfo
        }, {
          onConflict: 'type'
        });
      
      if (error) throw error;
      
      // Update local state
      setChurchInfo(updatedInfo);
      toast.success('Logo removed successfully!');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(error.message || 'Failed to remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Website Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Management */}
        <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
          <div className="flex items-center mb-6">
            <Palette size={24} className="text-purple-400 mr-2" />
            <h2 className="text-xl font-bold">Theme Management</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Available Themes</h3>
            <div className="space-y-4">
              {themes.length > 0 ? (
                themes.map((theme) => (
                  <div 
                    key={theme.id} 
                    className={`p-4 rounded-lg border ${
                      theme.isActive 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex space-x-2 mr-3">
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: theme.primaryColor }}
                          ></div>
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: theme.secondaryColor }}
                          ></div>
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: theme.accentColor }}
                          ></div>
                        </div>
                        <span className="font-medium">{theme.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        {!theme.isActive && (
                          <>
                            <button
                              onClick={() => setActiveTheme(theme.id)}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="Activate Theme"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => deleteTheme(theme.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete Theme"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        {theme.isActive && (
                          <span className="text-blue-400 text-sm">Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No custom themes available. Create one below!</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Create New Theme</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder="Modern Dark"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Primary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      value={newTheme.primaryColor}
                      onChange={(e) => setNewTheme({ ...newTheme, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.primaryColor}
                      onChange={(e) => setNewTheme({ ...newTheme, primaryColor: e.target.value })}
                      className="flex-1 ml-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      value={newTheme.secondaryColor}
                      onChange={(e) => setNewTheme({ ...newTheme, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.secondaryColor}
                      onChange={(e) => setNewTheme({ ...newTheme, secondaryColor: e.target.value })}
                      className="flex-1 ml-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex">
                    <input
                      type="color"
                      value={newTheme.accentColor}
                      onChange={(e) => setNewTheme({ ...newTheme, accentColor: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newTheme.accentColor}
                      onChange={(e) => setNewTheme({ ...newTheme, accentColor: e.target.value })}
                      className="flex-1 ml-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
                <div 
                  className="p-4 rounded-lg border border-gray-700"
                  style={{ backgroundColor: newTheme.primaryColor }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div 
                      className="h-8 w-32 rounded"
                      style={{ backgroundColor: newTheme.secondaryColor }}
                    ></div>
                    <div 
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: newTheme.accentColor }}
                    ></div>
                  </div>
                  <div 
                    className="h-20 rounded"
                    style={{ backgroundColor: `${newTheme.secondaryColor}33` }}
                  ></div>
                </div>
              </div>
              
              <button
                onClick={handleAddTheme}
                className="flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={18} className="mr-2" />
                Add Theme
              </button>
            </div>
          </div>
        </div>
        
        {/* Other Settings */}
        <div className="space-y-8">
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>Website Information</span>
            </h2>

            {/* Logo Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Church Logo
              </label>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700">
                  {churchInfo.logoUrl ? (
                    <img 
                      src={churchInfo.logoUrl} 
                      alt="Church Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-gray-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isUploadingLogo}
                      className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingLogo ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Upload size={16} className="mr-2" />
                          {churchInfo.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                    </button>
                    
                    {churchInfo.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={isUploadingLogo}
                        className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Recommended: Square image, max 2MB. PNG or JPG format.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Church Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={churchInfo.name}
                  onChange={handleChurchInfoChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={churchInfo.tagline}
                  onChange={handleChurchInfoChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={churchInfo.email}
                  onChange={handleChurchInfoChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={churchInfo.phone}
                  onChange={handleChurchInfoChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={churchInfo.address}
                  onChange={handleChurchInfoChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                ></textarea>
              </div>
              
              <button 
                onClick={saveChurchInfo}
                disabled={isSavingChurchInfo}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {isSavingChurchInfo ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Information
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Social Media Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={socialLinks.facebook}
                  onChange={handleSocialLinksChange}
                  placeholder="https://facebook.com/yourchurch"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={socialLinks.instagram}
                  onChange={handleSocialLinksChange}
                  placeholder="https://instagram.com/yourchurch"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={socialLinks.twitter}
                  onChange={handleSocialLinksChange}
                  placeholder="https://twitter.com/yourchurch"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  YouTube
                </label>
                <input
                  type="url"
                  name="youtube"
                  value={socialLinks.youtube}
                  onChange={handleSocialLinksChange}
                  placeholder="https://youtube.com/yourchurch"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                />
              </div>
              
              <button 
                onClick={saveSocialLinks}
                disabled={isSavingSocialLinks}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {isSavingSocialLinks ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Social Links
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;