import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Play, Pause, RotateCcw, Save, BookOpen, Dumbbell, Clock, Heart } from 'lucide-react';
import { toast } from 'sonner';

const TimerControl = () => {
  const { 
    activeTimer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    logActivity 
  } = useGame();
  
  const [activeCategory, setActiveCategory] = useState<'intellectual' | 'physical' | 'distractions' | 'recovery'>('intellectual');
  const [manualMinutes, setManualMinutes] = useState<string>('');
  const [isHighQuality, setIsHighQuality] = useState<boolean>(false);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const format = (num: number) => num.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${format(hours)}:${format(minutes)}:${format(remainingSeconds)}`;
    } else {
      return `${format(minutes)}:${format(remainingSeconds)}`;
    }
  };
  
  const handleCategoryChange = (category: 'intellectual' | 'physical' | 'distractions' | 'recovery') => {
    // If timer is running, automatically stop it before changing category
    if (activeTimer.isRunning) {
      resetTimer();
      // Display a more informative toast that doesn't feel like an error
      toast.info("Timer reset and activity changed");
    }
    
    // Change the category immediately
    setActiveCategory(category);
    
    // Reset high quality flag when changing categories
    if (category === 'distractions' || category === 'recovery') {
      setIsHighQuality(false);
    }
  };
  
  const handleStartTimer = () => {
    startTimer(activeCategory);
  };
  
  const handlePauseTimer = () => {
    pauseTimer();
  };
  
  const handleResumeTimer = () => {
    resumeTimer();
  };
  
  const handleResetTimer = () => {
    resetTimer();
  };
  
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setManualMinutes(value);
    }
  };
  
  const handleLogSession = () => {
    let minutesToLog = 0;
    
    if (manualMinutes && parseInt(manualMinutes) >= 0) {
      // Use manual input if provided (allow even 0 minutes)
      minutesToLog = parseInt(manualMinutes);
    } else if (activeTimer.elapsedTime > 0) {
      // Use the timer value - convert seconds to minutes, preserving even small values
      minutesToLog = Math.max(1, Math.round(activeTimer.elapsedTime / 60));
      
      // If less than 60 seconds, still log it as 1 minute minimum
      if (activeTimer.elapsedTime < 60) {
        minutesToLog = 1;
      }
    }
    
    // Always allow logging, even for small values
    if (minutesToLog < 0) {
      toast.error("Please enter a valid time");
      return;
    }
    
    // Log the activity
    logActivity(activeCategory, minutesToLog, isHighQuality);
    
    // Reset manual input and high quality flag
    setManualMinutes('');
    setIsHighQuality(false);
  };
  
  const getCategoryColor = () => {
    switch (activeCategory) {
      case 'intellectual': return 'text-cyber-blue border-cyber-blue';
      case 'physical': return 'text-cyber-purple border-cyber-purple';
      case 'distractions': return 'text-cyber-red border-cyber-red';
      case 'recovery': return 'text-green-400 border-green-400';
    }
  };
  
  const getCategoryIcon = () => {
    switch (activeCategory) {
      case 'intellectual': return <BookOpen className="w-5 h-5" />;
      case 'physical': return <Dumbbell className="w-5 h-5" />;
      case 'distractions': return <Clock className="w-5 h-5" />;
      case 'recovery': return <Heart className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="cyber-panel p-6 rounded-lg">
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-white">Track Your Time</h2>
          <p className="text-sm text-gray-400">Log activities to gain XP or track wasted time</p>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => handleCategoryChange('intellectual')}
            className={`p-3 rounded-md transition duration-150 transform hover:scale-105 active:scale-95 ${
              activeCategory === 'intellectual' 
                ? 'cyber-panel border-cyber-blue text-cyber-blue shadow-sm shadow-cyber-blue/30'
                : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="flex flex-col items-center">
              <BookOpen className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Intellectual</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('physical')}
            className={`p-3 rounded-md transition duration-150 transform hover:scale-105 active:scale-95 ${
              activeCategory === 'physical' 
                ? 'cyber-panel border-cyber-purple text-cyber-purple shadow-sm shadow-cyber-purple/30'
                : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="flex flex-col items-center">
              <Dumbbell className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Physical</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('distractions')}
            className={`p-3 rounded-md transition duration-150 transform hover:scale-105 active:scale-95 ${
              activeCategory === 'distractions' 
                ? 'cyber-panel border-cyber-red text-cyber-red shadow-sm shadow-cyber-red/30'
                : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Distractions</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('recovery')}
            className={`p-3 rounded-md transition duration-150 transform hover:scale-105 active:scale-95 ${
              activeCategory === 'recovery' 
                ? 'cyber-panel border-green-400 text-green-400 shadow-sm shadow-green-400/30'
                : 'bg-gray-800/90 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="flex flex-col items-center">
              <Heart className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Recovery</div>
            </div>
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className={`text-4xl font-mono cyber-text-glow ${
            activeCategory === 'intellectual' ? 'text-cyber-blue' :
            activeCategory === 'physical' ? 'text-cyber-purple' :
            activeCategory === 'distractions' ? 'text-cyber-red' : 'text-green-400'
          }`}>
            {formatTime(activeTimer.elapsedTime)}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4 mb-8">
          {!activeTimer.isRunning ? (
            <>
              <button
                onClick={activeTimer.elapsedTime > 0 ? handleResumeTimer : handleStartTimer}
                className={`cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center ${
                  activeCategory === 'intellectual' ? 'text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue' :
                  activeCategory === 'physical' ? 'text-cyber-purple border-cyber-purple/50 hover:border-cyber-purple' :
                  activeCategory === 'distractions' ? 'text-cyber-red border-cyber-red/50 hover:border-cyber-red' :
                  'text-green-400 border-green-400/50 hover:border-green-400'
                }`}
              >
                <Play className="w-6 h-6" />
              </button>
              
              {activeTimer.elapsedTime > 0 && (
                <button
                  onClick={handleResetTimer}
                  className="cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center text-gray-400 border-gray-700 hover:border-gray-500"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handlePauseTimer}
                className={`cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center ${
                  activeCategory === 'intellectual' ? 'text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue' :
                  activeCategory === 'physical' ? 'text-cyber-purple border-cyber-purple/50 hover:border-cyber-purple' :
                  activeCategory === 'distractions' ? 'text-cyber-red border-cyber-red/50 hover:border-cyber-red' :
                  'text-green-400 border-green-400/50 hover:border-green-400'
                }`}
              >
                <Pause className="w-6 h-6" />
              </button>
              
              <button
                onClick={handleResetTimer}
                className="cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center text-gray-400 border-gray-700 hover:border-gray-500"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        
        <div className="space-y-4">
          {(activeCategory === 'intellectual' || activeCategory === 'physical') && (
            <div className="flex items-center">
              <input
                id="highQuality"
                type="checkbox"
                checked={isHighQuality}
                onChange={() => setIsHighQuality(!isHighQuality)}
                className="h-4 w-4 text-blue-600 border-gray-700 rounded bg-black/30"
              />
              <label htmlFor="highQuality" className="ml-2 text-sm text-gray-300">
                Mark as high-quality session (+10% XP)
              </label>
            </div>
          )}
          
          <div>
            <label htmlFor="manualTime" className="block text-sm text-gray-400 mb-1">
              Or enter time manually (minutes)
            </label>
            <input
              id="manualTime"
              type="text"
              value={manualMinutes}
              onChange={handleManualInputChange}
              placeholder="e.g. 30"
              className="w-full p-2 bg-black/30 border border-gray-700 rounded-md text-white"
            />
          </div>
          
          <button
            onClick={handleLogSession}
            className={`w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 ${getCategoryColor()}`}
          >
            <Save className="w-5 h-5" />
            <span className="flex items-center">
              {getCategoryIcon()}
              <span className="ml-2">Log Session</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerControl;
