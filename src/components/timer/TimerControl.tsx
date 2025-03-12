
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
  
  const [activeCategory, setActiveCategory] = useState<'study' | 'sports' | 'wasted' | 'recovery'>('study');
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
  
  const handleCategoryChange = (category: 'study' | 'sports' | 'wasted' | 'recovery') => {
    if (activeTimer.isRunning) {
      toast.error("Stop the timer before changing category");
      return;
    }
    setActiveCategory(category);
    // Reset high quality flag when changing categories
    if (category === 'wasted' || category === 'recovery') {
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
    
    if (manualMinutes && parseInt(manualMinutes) > 0) {
      // Use manual input if provided
      minutesToLog = parseInt(manualMinutes);
    } else if (activeTimer.elapsedTime > 0) {
      // Otherwise use the timer
      minutesToLog = Math.ceil(activeTimer.elapsedTime / 60);
    }
    
    if (minutesToLog <= 0) {
      toast.error("Please enter a valid time or start the timer");
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
      case 'study': return 'text-cyber-blue border-cyber-blue';
      case 'sports': return 'text-cyber-purple border-cyber-purple';
      case 'wasted': return 'text-cyber-red border-cyber-red';
      case 'recovery': return 'text-green-400 border-green-400';
    }
  };
  
  const getCategoryIcon = () => {
    switch (activeCategory) {
      case 'study': return <BookOpen className="w-5 h-5" />;
      case 'sports': return <Dumbbell className="w-5 h-5" />;
      case 'wasted': return <Clock className="w-5 h-5" />;
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
            onClick={() => handleCategoryChange('study')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'study' 
                ? 'cyber-panel border-cyber-blue text-cyber-blue'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col items-center">
              <BookOpen className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Study</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('sports')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'sports' 
                ? 'cyber-panel border-cyber-purple text-cyber-purple'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col items-center">
              <Dumbbell className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Sports</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('wasted')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'wasted' 
                ? 'cyber-panel border-cyber-red text-cyber-red'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 mb-1" />
              <div className="text-xs font-medium">Wasted</div>
            </div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('recovery')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'recovery' 
                ? 'cyber-panel border-green-400 text-green-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
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
            activeCategory === 'study' ? 'text-cyber-blue' :
            activeCategory === 'sports' ? 'text-cyber-purple' :
            activeCategory === 'wasted' ? 'text-cyber-red' : 'text-green-400'
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
                  activeCategory === 'study' ? 'text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue' :
                  activeCategory === 'sports' ? 'text-cyber-purple border-cyber-purple/50 hover:border-cyber-purple' :
                  activeCategory === 'wasted' ? 'text-cyber-red border-cyber-red/50 hover:border-cyber-red' :
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
                  activeCategory === 'study' ? 'text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue' :
                  activeCategory === 'sports' ? 'text-cyber-purple border-cyber-purple/50 hover:border-cyber-purple' :
                  activeCategory === 'wasted' ? 'text-cyber-red border-cyber-red/50 hover:border-cyber-red' :
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
          {(activeCategory === 'study' || activeCategory === 'sports') && (
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
