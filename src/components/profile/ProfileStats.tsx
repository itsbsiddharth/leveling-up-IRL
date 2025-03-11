
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Activity, TrendingUp, Clock, Zap, Brain, Dumbbell, AlertTriangle } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';

const ProfileStats = () => {
  const { stats, activities } = useGame();
  const currentRank = getCurrentRank(stats.xp);
  const nextRank = getNextRank(stats.xp);
  const progress = getProgressToNextRank(stats.xp);
  const level = levelWithinRank(stats.xp);
  
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

  return (
    <div className="space-y-6">
      {/* Rank and XP Card */}
      <div className="cyber-panel p-6 rounded-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center">
              <Activity className="w-3 h-3 mr-1" /> 
              Current Rank
            </div>
            <h2 className={`text-2xl font-semibold ${currentRank.color === 'blue' ? 'cyber-text-glow text-cyber-blue' : currentRank.color === 'purple' ? 'cyber-purple-glow text-cyber-purple' : 'cyber-red-glow text-cyber-red'}`}>
              {currentRank.title}
            </h2>
            <div className="text-sm text-gray-300 mt-1">Level {level}</div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-xs text-gray-400 uppercase tracking-wider flex items-center">
              <Zap className="w-3 h-3 mr-1" /> 
              Total XP
            </div>
            <div className="text-xl font-semibold text-white">{stats.xp.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">
              Streak: <span className="text-yellow-400">{stats.streak} days</span>
            </div>
          </div>
        </div>
        
        {nextRank ? (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <div className="text-xs text-gray-400">Next: {nextRank.title}</div>
              <div className="text-xs text-gray-400">
                {progress.current.toLocaleString()}/{progress.max.toLocaleString()} XP
              </div>
            </div>
            <ProgressBar 
              value={progress.current} 
              max={progress.max} 
              color={currentRank.color}
            />
          </div>
        ) : (
          <div className="mb-4 text-center">
            <div className="text-sm text-cyber-red cyber-red-glow">Maximum Rank Achieved</div>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <div className="text-xs text-gray-400">HP</div>
            <div className="text-xs text-gray-400">{stats.hp}/100</div>
          </div>
          <ProgressBar 
            value={stats.hp} 
            max={100} 
            color={stats.hp > 50 ? 'blue' : stats.hp > 25 ? 'purple' : 'red'}
          />
        </div>
      </div>
      
      {/* Time Stats Card */}
      <div className="cyber-panel p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-cyber-blue" />
          Time Stats
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-gray-300">Total Time Tracked</span>
            </div>
            <span className="text-white font-medium">{formatTime(totalTimeSpent)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-2 text-cyber-blue" />
              <span className="text-gray-300">Study Time</span>
            </div>
            <span className="text-cyber-blue font-medium">{formatTime(studyTime)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Dumbbell className="w-4 h-4 mr-2 text-cyber-purple" />
              <span className="text-gray-300">Sports Time</span>
            </div>
            <span className="text-cyber-purple font-medium">{formatTime(sportsTime)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-cyber-red" />
              <span className="text-gray-300">Wasted Time</span>
            </div>
            <span className="text-cyber-red font-medium">{formatTime(totalWastedTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;
