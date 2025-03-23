import { useState, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { usePopup } from '@/context/PopupContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Howl } from 'howler';
import { FuturisticPopup } from './FuturisticPopup';
import { FaUser, FaUpload, FaCheck } from 'react-icons/fa';

// Sound effects
const inputSound = new Howl({
  src: ['/sounds/input-click.mp3'], 
  volume: 0.3,
});

const confirmSound = new Howl({
  src: ['/sounds/profile-confirm.mp3'],
  volume: 0.5,
});

interface ProfileSetupPopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileSetupPopup({ visible, onClose }: ProfileSetupPopupProps) {
  const { updateUsername, updateProfilePicture, currentUser } = useAuth();
  const { onProfileSetupComplete } = usePopup();
  
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Update username when user data loads
  useEffect(() => {
    if (currentUser?.name) {
      setUsername(currentUser.name);
    }
    if (currentUser?.photoURL) {
      setPreviewUrl(currentUser.photoURL);
    }
  }, [currentUser]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    inputSound.play();
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    inputSound.play();
  };
  
  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Update username if it's changed
      if (username !== currentUser?.name) {
        await updateUsername(username);
      }
      
      // Update profile picture if a new one is selected
      let photoURL = currentUser?.photoURL || null;
      if (selectedFile) {
        const { promise } = updateProfilePicture(selectedFile);
        photoURL = await promise;
      }
      
      // Play confirmation sound
      confirmSound.play();
      
      // Notify parent component that setup is complete
      if (onProfileSetupComplete) {
        await onProfileSetupComplete({
          name: username,
          photoURL: photoURL || undefined
        });
      }
      
      // Close the popup
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <FuturisticPopup
      visible={visible}
      title="Complete Your Profile"
      subtitle="Customize your gaming identity"
      content={
        <div className="space-y-6">
          {error && (
            <p className="text-red-500 bg-red-500/10 p-2 rounded-md text-sm">
              {error}
            </p>
          )}
          
          {/* Profile picture section */}
          <div className="flex flex-col items-center space-y-4">
            <div 
              className="w-24 h-24 rounded-full bg-cyber-dark border-2 border-cyber-blue overflow-hidden flex items-center justify-center relative"
              style={{ boxShadow: '0 0 15px #00FFFF' }}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-cyber-blue text-4xl" />
              )}
            </div>
            
            <label className="cursor-pointer">
              <div className="bg-cyber-blue/20 text-cyber-blue border border-cyber-blue rounded-md px-4 py-2 flex items-center justify-center gap-2 hover:bg-cyber-blue/30 transition-colors">
                <FaUpload />
                <span>Upload Photo</span>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </label>
          </div>
          
          {/* Username section */}
          <div className="space-y-2">
            <label className="block text-sm text-cyan-300">Display Name</label>
            <Input 
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="bg-cyber-dark/50 border-cyber-blue focus:border-cyan-400 text-white"
              disabled={isSubmitting}
            />
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 space-x-3 flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !username.trim()}
              className="bg-cyber-purple hover:bg-purple-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <FaCheck /> Save Profile
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
              className="border-cyber-blue text-cyber-blue hover:bg-cyber-blue/20 px-6 py-2 rounded-md"
            >
              Skip
            </Button>
          </div>
        </div>
      }
      onClose={onClose}
      autoCloseDelay={0}
      soundPath="/sounds/popup.mp3"
      backgroundImage="/images/swirling-bg.gif"
      glowColor="purple"
    />
  );
}
