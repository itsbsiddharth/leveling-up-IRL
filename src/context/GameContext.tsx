import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';

export type ActivityType = 'intellectual' | 'physical' | 'distractions' | 'recovery';

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

// Add Quest interfaces and types
export type QuestCategory = 'intellectual' | 'physical' | 'recovery';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  xpValue: number;
  completed: boolean;
  dueDate: string; // ISO string
  notes?: string;
  completedAt?: string; // ISO string
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
  // Add quest related functions
  completeQuest: (xpAmount: number) => void;
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
  completeQuest: () => {},
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
    // No XP for 0 minutes
    if (minutes <= 0) {
      return 0;
    }
    
    // New XP calculation: 1 XP per 3 minutes
    // 0-3 minutes: 0 XP
    // 3-6 minutes: 1 XP
    // 6-9 minutes: 2 XP
    // etc.
    
    // Calculate base XP (integer division by 3)
    let baseXp = 0;
    if (minutes >= 3) {
      baseXp = Math.floor(minutes / 3);
    }
    
    // Apply streak bonus
    const streakBonus = getStreakBonus();
    
    // Apply quality bonus (10% extra for high-quality sessions)
    const qualityBonus = isHighQuality ? 0.1 : 0;
    
    // Calculate total XP with all bonuses
    const totalXp = Math.floor(baseXp * (1 + streakBonus + qualityBonus));
    
    return totalXp;
  };
  
  const getHpForWastedTime = (minutes: number) => {
    // No HP loss for 0 minutes
    if (minutes <= 0) {
      return 0;
    }
    
    // Get today's distractions time before this session
    const today = new Date().toISOString().split('T')[0];
    const todayDistractionsMinutes = activities
      .filter(a => a.type === 'distractions' && a.timestamp.includes(today))
      .reduce((total, activity) => total + activity.minutes, 0);
    
    // New HP loss calculation: -1 HP per 6 minutes
    // 0-6 minutes: 0 HP
    // 6-12 minutes: 1 HP
    // 12-18 minutes: 2 HP
    // etc.
    
    // Base HP loss rate: 1 HP per 6 minutes
    let ratePerSixMinutes = 1;
    
    // Tier 1: After 1 hour of distractions, increase to 2 HP per 6 minutes
    if (todayDistractionsMinutes >= 60) {
      ratePerSixMinutes = 2;
    }
    
    // Tier 2: After 2 hours of distractions, increase to 3 HP per 6 minutes
    if (todayDistractionsMinutes >= 120) {
      ratePerSixMinutes = 3;
    }
    
    // Calculate HP loss
    const hpLoss = Math.floor(minutes / 6) * ratePerSixMinutes;
    
    return hpLoss;
  };
  
  const getHpForRecovery = (minutes: number) => {
    // No HP gain for 0 minutes
    if (minutes <= 0) {
      return 0;
    }
    
    // New HP gain calculation: 1 HP per 6 minutes
    // 0-6 minutes: 0 HP
    // 6-12 minutes: 1 HP
    // 12-18 minutes: 2 HP
    // etc.
    const hpGain = Math.floor(minutes / 6);
    
    return hpGain;
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
    if (type === 'intellectual' || type === 'physical') {
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
      
      // Always show a notification, even for 0 XP
      toast.success(`+${xpGained} XP gained!`, {
        description: `Logged ${minutes} minutes of ${type}${isHighQuality ? ' (high quality)' : ''}.`
      });
    } else if (type === 'distractions') {
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
      
      // Always show a notification, even for 0 HP loss
      toast.error(`-${hpLost} HP lost!`, {
        description: `Logged ${minutes} minutes of distractions.`
      });
    } else if (type === 'recovery') {
      hpGained = getHpForRecovery(minutes);
      
      setStats(prev => ({
        ...prev,
        hp: Math.min(prev.hp + hpGained, 100), // Cap at maximum HP
        lastActive: todayDate,
      }));
      
      // Always show a notification, even for 0 HP gain
      toast.success(`+${hpGained} HP recovered!`, {
        description: `Logged ${minutes} minutes of recovery time.`
      });
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
  
  // Add a new function to handle quest completion
  const completeQuest = (xpAmount: number) => {
    // Add XP to user's total
    setStats(prev => ({
      ...prev,
      xp: prev.xp + xpAmount
    }));
    
    // Update streak if needed
    updateStreak();
    
    // Save the updated stats in localStorage
    localStorage.setItem('gameStats', JSON.stringify({
      ...stats,
      xp: stats.xp + xpAmount
    }));
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
        completeQuest
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
