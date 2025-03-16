import React, { useState, useEffect, useRef } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { 
  User, 
  LogOut, 
  Mail, 
  Save, 
  Clock, 
  BookOpen, 
  Activity, 
  Heart, 
  Flame, 
  TrendingUp, 
  Trophy, 
  Award,
  Send,
  Camera,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { checkLeaderboardData, addTestLeaderboardEntries } from '@/utils/testUtils';
import { getUserData, updateLeaderboardEntry } from '@/firebase/userService';
import { getGlobalLeaderboard } from '@/firebase/leaderboardService';

const Profile = () => {
  const { currentUser, logout, signInWithGoogleAuth, sendPasswordlessEmail, updateUsername, updateProfilePicture, isLoading, error } = useAuth();
  const { stats, activities } = useGame();
  
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set initial username from currentUser when available
  useEffect(() => {
    if (currentUser?.name) {
      setNewUsername(currentUser.name);
    }
  }, [currentUser?.name]);
  
  // Calculate all time metrics
  const totalTimeSpent = activities.reduce((total, activity) => {
    return total + activity.minutes;
  }, 0);
  
  const totalProductiveTime = activities
    .filter(a => a.type === 'intellectual' || a.type === 'physical')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const intellectualTime = activities
    .filter(a => a.type === 'intellectual')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const physicalTime = activities
    .filter(a => a.type === 'physical')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const recoveryTime = activities
    .filter(a => a.type === 'recovery')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const totalDistractionsTime = activities
    .filter(a => a.type === 'distractions')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  // Calculate max streak (this would typically come from historical data)
  // For demo purposes, we'll assume max streak is either current streak or a hardcoded value
  const maxStreak = Math.max(stats.streak, 7); // Replace 7 with actual max streak from your data
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${remainingMinutes} mins`;
  };
  
  // Stat item component to maintain consistent styling
  const StatItem = ({ 
    icon, 
    label, 
    value, 
    labelColor = 'text-gray-400' 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    value: string,
    labelColor?: string
  }) => (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <span className={`mr-2 ${labelColor}`}>{icon}</span>
        <span className={labelColor}>{label}:</span>
      </div>
      <span className="text-white">{value}</span>
    </div>
  );
  
  // Check for error changes and show toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogleAuth();
      toast.success('Successfully signed in with Google!');
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };
  
  const handlePasswordlessSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      await sendPasswordlessEmail(email);
      setEmailSent(true);
      toast.success('Sign-in link sent to your email!');
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
    } catch (error) {
      // Error is already handled in AuthContext
    }
  };
  
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    
    try {
      await updateUsername(newUsername);
      setIsEditingUsername(false);
      toast.success("Username updated successfully");
    } catch (error) {
      toast.error("Failed to update username");
      console.error(error);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    
    setSelectedFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle profile picture update
  const handleUpdateProfilePicture = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploadingPhoto(true);
      console.log('Starting profile picture upload...');
      
      // Upload the image with cancellable function
      const { promise, cancel } = updateProfilePicture(selectedFile);
      
      // Store the cancel function for later use
      const handleCancel = () => {
        cancel();
        setIsUploadingPhoto(false);
        setSelectedFile(null);
        setPreviewUrl(null);
      };
      
      // Set up cancel on component unmount
      const cleanup = () => {
        handleCancel();
      };
      
      // Add event listener for beforeunload to cancel upload if page is closed
      window.addEventListener('beforeunload', cleanup);
      
      // Wait for upload to complete
      await promise;
      
      console.log('Profile picture uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Profile picture updated successfully');
      
      // Remove event listener
      window.removeEventListener('beforeunload', cleanup);
    } catch (error) {
      // Show specific error message
      console.error('Profile picture upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
  // Cancel profile picture update
  const handleCancelPhotoUpdate = () => {
    if (isUploadingPhoto) {
      // If upload is in progress, cancel it
      const { cancel } = updateProfilePicture(selectedFile!);
      cancel();
    }
    setIsUploadingPhoto(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Add this function to manually sync user to leaderboard
  const syncUserToLeaderboard = async () => {
    try {
      if (!currentUser) {
        toast.error('You must be signed in to sync your data');
        return;
      }
      
      toast.info('Syncing your profile to leaderboard...');
      
      // Get current user data
      const userData = await getUserData();
      if (!userData) {
        toast.error('Could not find your user data');
        return;
      }
      
      // Manually update leaderboard entry
      await updateLeaderboardEntry(userData);
      toast.success('Your profile has been synced to the leaderboard!');
      
      // For debug: log leaderboard entry
      const leaderboardData = await getGlobalLeaderboard(15);
      console.log('Leaderboard entries after sync:', leaderboardData);
      
      return true;
    } catch (error) {
      console.error('Error syncing user to leaderboard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync profile to leaderboard');
      return false;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Hunter Profile
            </h1>
            <p className="text-gray-400">Your personal stats and settings</p>
          </div>
          
          {currentUser ? (
            <div className="space-y-6">
              <div className="cyber-panel p-6 rounded-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-cyber-blue relative group">
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    ) : currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {/* Photo upload overlay button */}
                    {!selectedFile && (
                      <button
                        onClick={triggerFileInput}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Change profile picture"
                      >
                        <Camera className="h-8 w-8 text-white" />
                      </button>
                    )}
                  </div>
                  
                  {selectedFile ? (
                    <div className="flex flex-col space-y-2 flex-1">
                      <div className="text-sm text-cyber-blue">Update profile picture?</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancelPhotoUpdate}
                          className="cyber-button-outline text-sm py-1 px-3 flex items-center"
                          disabled={isUploadingPhoto}
                        >
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfilePicture}
                          className="cyber-button-primary text-sm py-1 px-3 flex items-center"
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <span className="animate-pulse flex items-center">
                              <div className="w-3 h-3 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </span>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" /> Save
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : isEditingUsername ? (
                    <form onSubmit={handleUpdateUsername} className="w-full">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="cyber-input w-full"
                          placeholder="Enter new username"
                          maxLength={30}
                        />
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setNewUsername(currentUser.name || "");
                            }}
                            className="cyber-button-outline text-sm py-1 px-3"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="cyber-button-primary text-sm py-1 px-3 flex items-center"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span className="animate-pulse">Saving...</span>
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1" /> Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-1 cyber-text">
                        {currentUser.name || "Anonymous User"}
                      </h2>
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="text-xs text-cyber-blue hover:text-cyber-blue-bright transition-colors"
                      >
                        Edit username
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="text-gray-400 text-sm text-center mt-2">
                  {currentUser.email}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="mt-4 cyber-button-outline py-1.5 px-3 text-sm flex items-center justify-center w-full"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
                </button>
              </div>
              
              {/* Add Developer/Debug Tools Section */}
              {currentUser && (
                <div className="mt-8 border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">Developer Tools</h3>
                  <p className="text-sm text-gray-400 mb-3">These tools help troubleshoot data issues</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        const hasData = await checkLeaderboardData();
                        if (!hasData) {
                          toast.error('No leaderboard data found. Try adding test data.');
                        } else {
                          toast.success('Leaderboard data exists. Check console for details.');
                        }
                      }}
                      className="cyber-button-small bg-orange-900/20 text-orange-400 border-orange-800"
                    >
                      Check Leaderboard Data
                    </button>
                    
                    <button
                      onClick={async () => {
                        const success = await addTestLeaderboardEntries();
                        if (success) {
                          toast.success('Test data added to leaderboard. Try viewing the leaderboard now.');
                        }
                      }}
                      className="cyber-button-small bg-blue-900/20 text-blue-400 border-blue-800"
                    >
                      Add Test Leaderboard Data
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      await syncUserToLeaderboard();
                    }}
                    className="p-2 cyber-button-outline text-sm w-full mb-2"
                  >
                    Sync Me to Leaderboard
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Note: These functions are for development purposes only</p>
                </div>
              )}
              
              {/* Activity Heatmap */}
              <ActivityHeatmap />
              
              <div className="cyber-panel p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Your Stats</h3>
                
                <div className="space-y-3">
                  {/* Stats organized in requested order with color coding */}
                  <StatItem 
                    icon={<Clock className="w-4 h-4" />} 
                    label="Total Time Tracked" 
                    value={formatTime(totalTimeSpent)}
                    labelColor="text-cyber-blue"
                  />
                  
                  <StatItem 
                    icon={<Activity className="w-4 h-4" />} 
                    label="Productive Time" 
                    value={formatTime(totalProductiveTime)}
                    labelColor="text-cyber-blue"
                  />
                  
                  <StatItem 
                    icon={<BookOpen className="w-4 h-4" />} 
                    label="Intellectual Time" 
                    value={formatTime(intellectualTime)}
                    labelColor="text-cyber-blue"
                  />
                  
                  <StatItem 
                    icon={<Activity className="w-4 h-4" />} 
                    label="Physical Time" 
                    value={formatTime(physicalTime)}
                    labelColor="text-cyber-purple"
                  />
                  
                  <StatItem 
                    icon={<Heart className="w-4 h-4" />} 
                    label="Recovery Time" 
                    value={formatTime(recoveryTime)}
                    labelColor="text-green-400"
                  />
                  
                  <StatItem 
                    icon={<Flame className="w-4 h-4" />} 
                    label="Distractions Time" 
                    value={formatTime(totalDistractionsTime)}
                    labelColor="text-cyber-red"
                  />
                  
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <StatItem 
                    icon={<TrendingUp className="w-4 h-4" />} 
                    label="Current Streak" 
                    value={`${stats.streak} days`}
                    labelColor="text-yellow-400"
                  />
                  
                  <StatItem 
                    icon={<Trophy className="w-4 h-4" />} 
                    label="Max Streak" 
                    value={`${maxStreak} days`}
                    labelColor="text-yellow-400"
                  />
                  
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <StatItem 
                    icon={<Award className="w-4 h-4" />} 
                    label="Total XP" 
                    value={`${stats.xp.toLocaleString()} XP`}
                    labelColor="text-cyber-blue"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="cyber-panel p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-white">Sign In</h3>
              
              {emailSent ? (
                <div className="text-center py-6">
                  <div className="cyber-panel p-3 rounded-full inline-block mb-4">
                    <Mail className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
                  <p className="text-gray-400 mb-4">
                    We've sent a sign-in link to <span className="text-cyber-blue">{email}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the link in the email to sign in. No password required.
                  </p>
                  <button
                    onClick={() => setEmailSent(false)}
                    className="mt-6 py-2 px-4 text-sm text-gray-400 hover:text-white"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handlePasswordlessSignIn} className="space-y-4 mb-4">
                    <div>
                      <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
                          placeholder="you@example.com"
                          required
                        />
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-2 cyber-panel rounded-md bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue flex items-center justify-center space-x-2"
                      disabled={isLoading || !email}
                    >
                      <Send className="w-4 h-4" />
                      <span>{isLoading ? 'Sending Link...' : 'Email Sign-in Link'}</span>
                    </button>
                  </form>
                  
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-black px-4 text-xs text-gray-400">OR</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full py-2 cyber-panel rounded-md bg-white/5 hover:bg-white/10 border border-gray-700 flex items-center justify-center space-x-2"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    <span className="text-white">{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Profile;
