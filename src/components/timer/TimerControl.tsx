import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';
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
  
  const [activeCategory, setActiveCategory] = useState<'study' | 'sports' | 'wasted'>('study');
  const [manualMinutes, setManualMinutes] = useState<string>('');
  
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
  
  const handleCategoryChange = (category: 'study' | 'sports' | 'wasted') => {
    if (activeTimer.isRunning) {
      toast.error("Stop the timer before changing category");
      return;
    }
    setActiveCategory(category);
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
    logActivity(activeCategory, minutesToLog);
    
    // Reset manual input
    setManualMinutes('');
  };
  
  return (
    <div className="cyber-panel p-6 rounded-lg">
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-white">Track Your Time</h2>
          <p className="text-sm text-gray-400">Log activities to gain XP or track wasted time</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => handleCategoryChange('study')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'study' 
                ? 'cyber-panel border-cyber-blue text-cyber-blue'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="text-sm font-medium">Study</div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('sports')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'sports' 
                ? 'cyber-panel border-cyber-purple text-cyber-purple'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="text-sm font-medium">Sports</div>
          </button>
          
          <button
            onClick={() => handleCategoryChange('wasted')}
            className={`p-3 rounded-md transition duration-200 ${
              activeCategory === 'wasted' 
                ? 'cyber-panel border-cyber-red text-cyber-red'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div className="text-sm font-medium">Wasted</div>
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="text-4xl font-mono cyber-text-glow text-cyber-blue">
            {formatTime(activeTimer.elapsedTime)}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4 mb-8">
          {!activeTimer.isRunning ? (
            <>
              <button
                onClick={activeTimer.elapsedTime > 0 ? handleResumeTimer : handleStartTimer}
                className="cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue"
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
                className="cyber-panel p-3 rounded-full w-12 h-12 flex items-center justify-center text-cyber-purple border-cyber-purple/50 hover:border-cyber-purple"
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
            className="w-full cyber-panel py-3 px-4 rounded-md flex items-center justify-center space-x-2 text-cyber-blue border-cyber-blue/50 hover:border-cyber-blue"
          >
            <Save className="w-5 h-5" />
            <span>Log Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerControl;
