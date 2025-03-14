import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';

export type ActivityType = 'study' | 'sports' | 'wasted' | 'recovery';

export interface Activity {
  id: string;
  type: ActivityType;
  minutes: number;
  timestamp: string;
  xpGained?: number;
  hpLost?: number;
  hpGained?: number;
  isHighQuality?: boolean;
}

interface GameStats {
  xp: number;
  hp: number;
  streak: number; // consecutive days with activity
  lastActive: string | null;
}

interface GameContextType {
  stats: GameStats;
  activities: Activity[];
  activeTimer: {
    type: ActivityType | null;
    isRunning: boolean;
    startTime: number | null;
    elapsedTime: number;
  };
  logActivity: (type: ActivityType, minutes: number, isHighQuality?: boolean) => void;
  startTimer: (type: ActivityType) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  getXpForActivity: (minutes: number, isHighQuality?: boolean) => number;
  getHpForWastedTime: (minutes: number) => number;
  getHpForRecovery: (minutes: number) => number;
  completeRecoveryChallenge: (hpAmount: number) => void;
}

const defaultStats: GameStats = {
  xp: 0,
  hp: 100,
  streak: 0,
  lastActive: null,
};

const defaultContext: GameContextType = {
  stats: defaultStats,
  activities: [],
  activeTimer: {
    type: null,
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
  },
  logActivity: () => {},
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  resetTimer: () => {},
  getXpForActivity: () => 0,
  getHpForWastedTime: () => 0,
  getHpForRecovery: () => 0,
  completeRecoveryChallenge: () => {},
};

const GameContext = createContext<GameContextType>(defaultContext);

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<GameStats>(() => {
    const savedStats = localStorage.getItem('gameStats');
    return savedStats ? JSON.parse(savedStats) : defaultStats;
  });
  
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });
  
  const [activeTimer, setActiveTimer] = useState({
    type: null as ActivityType | null,
    isRunning: false,
    startTime: null as number | null,
    elapsedTime: 0,
  });
  
  // Check and update streak on load
  useEffect(() => {
    updateStreak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Save stats and activities to localStorage when they change
  useEffect(() => {
    localStorage.setItem('gameStats', JSON.stringify(stats));
  }, [stats]);
  
  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);
  
  // Update elapsed time while timer is running
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (activeTimer.isRunning && activeTimer.startTime !== null) {
      // Set the interval to update every second
      intervalId = window.setInterval(() => {
        setActiveTimer(prev => {
          if (!prev.isRunning || prev.startTime === null) return prev;
          return {
            ...prev,
            elapsedTime: prev.elapsedTime + 1  // Increment by exactly 1 second each tick
          };
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTimer.isRunning, activeTimer.startTime]);
  
  const updateStreak = () => {
    if (!stats.lastActive) return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(stats.lastActive).toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (today === lastActive) {
      // Already active today, do nothing
      return;
    } else if (yesterdayStr === lastActive) {
      // Active yesterday, increment streak
      setStats(prev => ({
        ...prev,
        streak: prev.streak + 1,
        lastActive: today,
      }));
    } else {
      // Break in streak
      setStats(prev => ({
        ...prev,
        streak: 1, // Reset to 1 since active today
        lastActive: today,
      }));
    }
  };
  
  const getStreakBonus = () => {
    // Calculate the streak bonus (capped at 50%)
    const streakBonus = Math.min(stats.streak * 0.05, 0.5); // 5% per day, max 50%
    return streakBonus;
  };
  
  const getXpForActivity = (minutes: number, isHighQuality = false) => {
    // Base XP: 10 XP per 30 minutes
    const baseXp = Math.floor(minutes / 30) * 10;
    
    // Apply streak bonus
    const streakBonus = getStreakBonus();
    
    // Apply quality bonus (10% extra for high-quality sessions)
    const qualityBonus = isHighQuality ? 0.1 : 0;
    
    // Calculate total XP with all bonuses
    const totalXp = Math.floor(baseXp * (1 + streakBonus + qualityBonus));
    
    return totalXp;
  };
  
  const getHpForWastedTime = (minutes: number) => {
    // Get today's wasted time before this session
    const today = new Date().toISOString().split('T')[0];
    const todayWastedMinutes = activities
      .filter(a => a.type === 'wasted' && a.timestamp.includes(today))
      .reduce((total, activity) => total + activity.minutes, 0);
    
    // Calculate HP loss with tiered penalty
    let hpLoss = 0;
    let remainingMinutes = minutes;
    let currentTotalWasted = todayWastedMinutes;
    
    // Process minutes in 30-minute chunks
    while (remainingMinutes > 0) {
      const chunkSize = Math.min(remainingMinutes, 30);
      const chunkRatio = chunkSize / 30; // For partial chunks
      
      // Standard rate: 5 HP per 30 minutes
      let ratePerThirtyMinutes = 5;
      
      // Tier 1: After 1 hour (60 minutes), increase to 7 HP per 30 minutes
      if (currentTotalWasted >= 60) {
        ratePerThirtyMinutes = 7;
      }
      
      // Tier 2: After 2 hours (120 minutes), increase to 10 HP per 30 minutes
      if (currentTotalWasted >= 120) {
        ratePerThirtyMinutes = 10;
      }
      
      // Calculate HP loss for this chunk
      const chunkLoss = Math.round(ratePerThirtyMinutes * chunkRatio);
      hpLoss += chunkLoss;
      
      // Update for next iteration
      remainingMinutes -= chunkSize;
      currentTotalWasted += chunkSize;
    }
    
    return hpLoss;
  };
  
  const getHpForRecovery = (minutes: number) => {
    // 5 HP per 30 minutes of recovery activity
    return Math.floor(minutes / 30) * 5;
  };
  
  const completeRecoveryChallenge = (hpAmount: number) => {
    setStats(prev => ({
      ...prev,
      hp: Math.min(prev.hp + hpAmount, 100) // Cap at maximum HP
    }));
    
    toast.success(`+${hpAmount} HP recovered!`, {
      description: "Recovery challenge completed successfully."
    });
  };
  
  const logActivity = (type: ActivityType, minutes: number, isHighQuality = false) => {
    const today = new Date().toISOString();
    const todayDate = today.split('T')[0];
    let xpGained = 0;
    let hpLost = 0;
    let hpGained = 0;
    
    // Calculate XP or HP changes
    if (type === 'study' || type === 'sports') {
      xpGained = getXpForActivity(minutes, isHighQuality);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        xp: prev.xp + xpGained,
        lastActive: todayDate,
      }));
      
      const currentRank = getCurrentRank(stats.xp);
      const newRank = getCurrentRank(stats.xp + xpGained);
      
      if (newRank.id !== currentRank.id) {
        toast.success(`Rank Up! You are now a ${newRank.title}!`, {
          description: "New abilities and benefits unlocked."
        });
      }
      
      toast.success(`+${xpGained} XP gained!`, {
        description: `Logged ${minutes} minutes of ${type}${isHighQuality ? ' (high quality)' : ''}.`
      });
    } else if (type === 'wasted') {
      hpLost = getHpForWastedTime(minutes);
      
      // Update stats
      setStats(prev => {
        const newHp = Math.max(prev.hp - hpLost, 0);
        const wasAtZero = newHp === 0 && prev.hp > 0;
        
        if (wasAtZero) {
          toast.error(`CRITICAL DAMAGE: Your energy is depleted!`, {
            description: "Complete a recovery activity to restore your HP."
          });
        }
        
        return {
          ...prev,
          hp: newHp,
          lastActive: todayDate,
        };
      });
      
      if (hpLost > 0) {
        toast.error(`-${hpLost} HP lost!`, {
          description: `Logged ${minutes} minutes of wasted time.`
        });
      }
    } else if (type === 'recovery') {
      hpGained = getHpForRecovery(minutes);
      
      setStats(prev => ({
        ...prev,
        hp: Math.min(prev.hp + hpGained, 100), // Cap at maximum HP
        lastActive: todayDate,
      }));
      
      if (hpGained > 0) {
        toast.success(`+${hpGained} HP recovered!`, {
          description: `Logged ${minutes} minutes of recovery time.`
        });
      }
    }
    
    // Create and add new activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      minutes,
      timestamp: today,
      ...(xpGained ? { xpGained } : {}),
      ...(hpLost ? { hpLost } : {}),
      ...(hpGained ? { hpGained } : {}),
      ...(isHighQuality ? { isHighQuality: true } : {}),
    };
    
    setActivities(prev => [newActivity, ...prev]);
    updateStreak();
    
    // Reset timer after logging
    resetTimer();
  };
  
  const startTimer = (type: ActivityType) => {
    setActiveTimer({
      type,
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  };
  
  const pauseTimer = () => {
    if (!activeTimer.isRunning) return;
    
    setActiveTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
      // Keep the current elapsedTime as is, no calculations needed
    }));
  };
  
  const resumeTimer = () => {
    setActiveTimer(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
  };
  
  const resetTimer = () => {
    setActiveTimer({
      type: null,
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
    });
  };
  
  return (
    <GameContext.Provider
      value={{
        stats,
        activities,
        activeTimer,
        logActivity,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        getXpForActivity,
        getHpForWastedTime,
        getHpForRecovery,
        completeRecoveryChallenge,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
