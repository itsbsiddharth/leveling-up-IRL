
import React from 'react';
import { useGame } from '@/context/GameContext';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';
import ProgressBar from '@/components/ui/ProgressBar';
import { AlarmTriangle, Heart } from 'lucide-react';
import { toast } from 'sonner';

const StatsCard = () => {
  const { stats, completeRecoveryChallenge } = useGame();
  const currentRank = getCurrentRank(stats.xp);
  const nextRank = getNextRank(stats.xp);
  const progress = getProgressToNextRank(stats.xp);
  const level = levelWithinRank(stats.xp);

  const isCriticalHP = stats.hp <= 20;
  
  const handleRecoveryChallenge = () => {
    // Quick recovery challenge - gain 15 HP
    completeRecoveryChallenge(15);
  };

  return (
    <div className="cyber-panel p-6 rounded-lg">
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Current Rank</div>
            <h2 className={`text-2xl font-semibold ${currentRank.color === 'blue' ? 'cyber-text-glow text-cyber-blue' : currentRank.color === 'purple' ? 'cyber-purple-glow text-cyber-purple' : 'cyber-red-glow text-cyber-red'}`}>
              {currentRank.title}
            </h2>
            <div className="text-sm text-gray-300 mt-1">Level {level}</div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Total XP</div>
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
            <div className="flex items-center text-xs text-gray-400">
              <Heart className="w-3 h-3 mr-1" />
              HP
            </div>
            <div className="text-xs text-gray-400">{stats.hp}/100</div>
          </div>
          <ProgressBar 
            value={stats.hp} 
            max={100} 
            color={stats.hp > 50 ? 'blue' : stats.hp > 25 ? 'purple' : 'red'}
          />
        </div>
        
        {isCriticalHP && (
          <div className={`p-3 mt-2 mb-1 border ${stats.hp === 0 ? 'border-cyber-red animate-pulse' : 'border-yellow-600'} rounded-md flex items-center justify-between bg-black/40`}>
            <div className="flex items-center">
              <AlarmTriangle className={`${stats.hp === 0 ? 'text-cyber-red' : 'text-yellow-500'} w-5 h-5 mr-2`} />
              <div>
                <div className={`text-sm font-medium ${stats.hp === 0 ? 'text-cyber-red' : 'text-yellow-500'}`}>
                  {stats.hp === 0 ? 'CRITICAL DAMAGE!' : 'Low Energy Warning'}
                </div>
                <div className="text-xs text-gray-400">
                  {stats.hp === 0 
                    ? 'Your energy is depleted. Take a recovery action!' 
                    : 'Your HP is running low. Consider taking a break.'}
                </div>
              </div>
            </div>
            
            {stats.hp === 0 && (
              <button 
                onClick={handleRecoveryChallenge}
                className="py-1.5 px-3 text-xs bg-black border border-green-500 text-green-500 rounded-md hover:bg-green-900/20"
              >
                I'm Recovered
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
