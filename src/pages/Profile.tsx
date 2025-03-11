import React, { useState } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { User, LogOut, Mail, Save, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { currentUser, login, signup, logout, isLoading: authLoading } = useAuth();
  const { stats, activities } = useGame();
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const totalTimeSpent = activities.reduce((total, activity) => {
    return total + activity.minutes;
  }, 0);
  
  const totalProductiveTime = activities
    .filter(a => a.type === 'study' || a.type === 'sports')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const totalWastedTime = activities
    .filter(a => a.type === 'wasted')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const studyTime = activities
    .filter(a => a.type === 'study')
    .reduce((total, activity) => total + activity.minutes, 0);
  
  const sportsTime = activities
    .filter(a => a.type === 'sports')
    .reduce((total, activity) => total + activity.minutes, 0);
  
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
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Form submission:", isSigningUp ? "signup" : "login", email, password);
      if (isSigningUp) {
        await signup(email, password, name || email.split('@')[0]);
      } else {
        await login(email, password);
      }
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error('Authentication error in Profile component:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error('Logout error in Profile component:', err);
    }
  };

  const toggleAuthMode = () => {
    setIsSigningUp(!isSigningUp);
    setError(null);
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
                    <h2 className="text-xl font-semibold text-white">{currentUser.username}</h2>
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
              
              <ActivityHeatmap />
              
              <div className="cyber-panel p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Your Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Time Tracked:</span>
                    <span className="text-white">{formatTime(totalTimeSpent)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Productive Time:</span>
                    <span className="text-cyber-blue">{formatTime(totalProductiveTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Study Time:</span>
                    <span className="text-cyber-blue">{formatTime(studyTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sports Time:</span>
                    <span className="text-cyber-purple">{formatTime(sportsTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wasted Time:</span>
                    <span className="text-cyber-red">{formatTime(totalWastedTime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Streak:</span>
                    <span className="text-yellow-400">{stats.streak} days</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total XP:</span>
                    <span className="text-white">{stats.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="cyber-panel p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-white">
                {isSigningUp ? 'Create Account' : 'Sign In'}
              </h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-300 text-sm rounded-md">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleAuth} className="space-y-4">
                {isSigningUp && (
                  <div>
                    <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 pl-10 bg-black/30 border border-gray-700 rounded-md text-white"
                        placeholder="Your Username"
                      />
                      <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                )}
                
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
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {isSigningUp && "Password must be at least 6 characters"}
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || authLoading}
                  className="w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue disabled:opacity-50"
                >
                  {isSigningUp ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={toggleAuthMode}
                  className="text-sm text-cyber-blue hover:underline"
                >
                  {isSigningUp 
                    ? 'Already have an account? Sign In' 
                    : 'Need an account? Create one'}
                </button>
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
