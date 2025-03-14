import React, { useState, useEffect } from 'react';
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
  Send
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { currentUser, logout, signInWithGoogleAuth, sendPasswordlessEmail, isLoading, error } = useAuth();
  const { stats, activities } = useGame();
  
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Calculate all time metrics
  const totalTimeSpent = activities.reduce((total, activity) => {
    return total + activity.minutes;
  }, 0);
  
  const totalProductiveTime = activities
    .filter(a => a.type === 'study' || a.type === 'sports')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const studyTime = activities
    .filter(a => a.type === 'study')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const sportsTime = activities
    .filter(a => a.type === 'sports')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const recoveryTime = activities
    .filter(a => a.type === 'recovery')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const totalWastedTime = activities
    .filter(a => a.type === 'wasted')
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
                  <div className="cyber-panel p-3 rounded-full">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.name || 'User'} 
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-cyber-blue" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{currentUser.name || 'User'}</h2>
                    <p className="text-sm text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="cyber-panel py-2 px-4 rounded-md text-gray-300 border-gray-700 flex items-center space-x-2 hover:border-gray-500 text-sm"
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
              
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
                    label="Study Time" 
                    value={formatTime(studyTime)}
                    labelColor="text-cyber-blue"
                  />
                  
                  <StatItem 
                    icon={<Activity className="w-4 h-4" />} 
                    label="Sports Time" 
                    value={formatTime(sportsTime)}
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
                    label="Wasted Time" 
                    value={formatTime(totalWastedTime)}
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
