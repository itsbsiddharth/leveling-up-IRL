import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Play, Pause, RotateCcw, Save, BookOpen, Dumbbell, Clock, Heart } from 'lucide-react';
import { usePopup } from '@/context/PopupContext';

const TimerControl = () => {
  const { 
    activeTimer, 
    startTimer, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    logActivity 
  } = useGame();
  
  const { 
    showXpChangePopup, 
    showHpChangePopup, 
    showInfoPopup, 
    showErrorPopup 
  } = usePopup();
  
  const [activeCategory, setActiveCategory] = useState<'intellectual' | 'physical' | 'distractions' | 'recovery'>('intellectual');
  const [manualMinutes, setManualMinutes] = useState<string>('');
  const [isHighQuality, setIsHighQuality] = useState<boolean>(false);
  const [displayTime, setDisplayTime] = useState(0);
  
  // Update the display time every 100ms when the timer is running
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (activeTimer.isRunning && activeTimer.startTime) {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const elapsed = activeTimer.elapsedTime + (now - activeTimer.startTime);
        // Convert to seconds for display
        setDisplayTime(Math.floor(elapsed / 1000));
      }, 100);
    } else {
      // When not running, just show the stored elapsed time
      setDisplayTime(Math.floor(activeTimer.elapsedTime / 1000));
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimer.isRunning, activeTimer.startTime, activeTimer.elapsedTime]);
  
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
    // If timer is running, automatically log the current session before changing category
    if (activeTimer.isRunning && activeTimer.type) {
      // Calculate minutes for the current session
      const minutesToLog = Math.max(1, Math.round(displayTime / 60));
      
      // Log the activity for the current category
      logActivity(activeTimer.type, minutesToLog, isHighQuality);
      
      // Show activity logged popup based on the type
      if (activeTimer.type === 'intellectual' || activeTimer.type === 'physical') {
        const xpGained = getXpForActivity(minutesToLog, isHighQuality);
        showXpChangePopup(xpGained, `${activeTimer.type} activity (${minutesToLog} min)`);
      } else if (activeTimer.type === 'distractions') {
        const hpLost = getHpForWastedTime(minutesToLog);
        showHpChangePopup(-hpLost, `distractions (${minutesToLog} min)`);
      } else if (activeTimer.type === 'recovery') {
        const hpGained = getHpForRecovery(minutesToLog);
        showHpChangePopup(hpGained, `recovery (${minutesToLog} min)`);
      }
      
      // Reset the timer
      resetTimer();
    } else if (activeTimer.elapsedTime > 0) {
      // If timer is not running but has elapsed time, just reset it
      resetTimer();
      showInfoPopup("Timer reset", { description: "Activity category changed" });
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
      // Use the displayTime value instead of elapsedTime for more accurate timing
      minutesToLog = Math.max(1, Math.round(displayTime / 60));
      
      // If less than 60 seconds, still log it as 1 minute minimum
      if (displayTime < 60) {
        minutesToLog = 1;
      }
    }
    
    // Always allow logging, even for small values
    if (minutesToLog < 0) {
      showErrorPopup("Invalid Time Entry", { description: "Please enter a valid time" });
      return;
    }
    
    // Log the activity
    logActivity(activeCategory, minutesToLog, isHighQuality);
    
    // Show appropriate popup based on the activity type
    if (activeCategory === 'intellectual' || activeCategory === 'physical') {
      const xpGained = getXpForActivity(minutesToLog, isHighQuality);
      showXpChangePopup(xpGained, `${activeCategory} activity (${minutesToLog} min)`);
    } else if (activeCategory === 'distractions') {
      const hpLost = getHpForWastedTime(minutesToLog);
      showHpChangePopup(-hpLost, `distractions (${minutesToLog} min)`);
    } else if (activeCategory === 'recovery') {
      const hpGained = getHpForRecovery(minutesToLog);
      showHpChangePopup(hpGained, `recovery (${minutesToLog} min)`);
    }
    
    // Reset manual input and high quality flag
    setManualMinutes('');
    setIsHighQuality(false);
    
    // Reset the timer after logging
    resetTimer();
  };
  
  // Helper functions to calculate XP and HP changes
  const getXpForActivity = (minutes: number, isHighQuality: boolean): number => {
    // Base XP calculation: 1 XP per minute
    let xp = minutes;
    
    // If high quality, add a 50% bonus
    if (isHighQuality) {
      xp = Math.ceil(xp * 1.5);
    }
    
    return xp;
  };
  
  const getHpForWastedTime = (minutes: number): number => {
    // Lose 1 HP per 5 minutes of distractions, minimum 1 HP
    return Math.max(1, Math.floor(minutes / 5));
  };
  
  const getHpForRecovery = (minutes: number): number => {
    // Gain 10 HP per 5 minutes of recovery, minimum 5 HP
    return Math.max(5, Math.floor(minutes / 5) * 10);
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
            {formatTime(displayTime)}
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
