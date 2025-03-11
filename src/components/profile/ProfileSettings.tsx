
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProfileSettings = () => {
  const { currentUser } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cyber-panel p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
        <User className="w-5 h-5 mr-2 text-cyber-blue" />
        Profile Settings
      </h3>
      
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
            Username
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
              placeholder="Your Username"
            />
            <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-gray-500"
              placeholder="your.email@example.com"
            />
            <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          </div>
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
