
import React, { useState } from 'react';
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
  Award 
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { currentUser, login, logout } = useAuth();
  const { stats, activities } = useGame();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password, name);
      toast.success('Successfully logged in!');
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      toast.error('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    toast.success('Successfully logged out');
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
                    <User className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{currentUser.name}</h2>
                    <p className="text-sm text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="cyber-panel py-2 px-4 rounded-md text-gray-300 border-gray-700 flex items-center space-x-2 hover:border-gray-500 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
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
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
                      placeholder="Your Name"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
                      placeholder="your.email@example.com"
                    />
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 bg-black/30 border border-gray-700 rounded-md text-white"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                </button>
              </form>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>Demo Version: Any email/password will work</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Profile;
