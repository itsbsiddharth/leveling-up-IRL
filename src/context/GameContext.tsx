
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';

type ActivityType = 'study' | 'sports' | 'wasted';

interface Activity {
  id: string;
  type: ActivityType;
  minutes: number;
  timestamp: string;
  xpGained?: number;
  hpLost?: number;
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
  logActivity: (type: ActivityType, minutes: number) => void;
  startTimer: (type: ActivityType) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  getXpForActivity: (minutes: number) => number;
  getHpForWastedTime: (minutes: number) => number;
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
    let interval: number | undefined;
    
    if (activeTimer.isRunning && activeTimer.startTime) {
      interval = window.setInterval(() => {
        const currentElapsedTime = Math.floor(
          (Date.now() - activeTimer.startTime + activeTimer.elapsedTime) / 1000
        );
        
        setActiveTimer(prev => ({
          ...prev,
          elapsedTime: currentElapsedTime,
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer.isRunning, activeTimer.startTime, activeTimer.elapsedTime]);
  
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
  
  const getXpForActivity = (minutes: number) => {
    // Base XP: 10 XP per 30 minutes
    const baseXp = Math.floor(minutes / 30) * 10;
    
    // Apply streak bonus
    const bonus = getStreakBonus();
    const totalXp = Math.floor(baseXp * (1 + bonus));
    
    return totalXp;
  };
  
  const getHpForWastedTime = (minutes: number) => {
    // 5 HP per 30 minutes of wasted time
    return Math.floor(minutes / 30) * 5;
  };
  
  const logActivity = (type: ActivityType, minutes: number) => {
    const today = new Date().toISOString();
    const todayDate = today.split('T')[0];
    let xpGained = 0;
    let hpLost = 0;
    
    // Calculate XP or HP changes
    if (type === 'study' || type === 'sports') {
      xpGained = getXpForActivity(minutes);
      
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
        description: `Logged ${minutes} minutes of ${type}.`
      });
    } else if (type === 'wasted') {
      hpLost = getHpForWastedTime(minutes);
      
      setStats(prev => ({
        ...prev,
        hp: Math.max(prev.hp - hpLost, 0), // Prevent HP from going below 0
        lastActive: todayDate,
      }));
      
      if (hpLost > 0) {
        toast.error(`-${hpLost} HP lost!`, {
          description: `Logged ${minutes} minutes of wasted time.`
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
    if (!activeTimer.isRunning || activeTimer.startTime === null) return;
    
    const currentElapsedSeconds = Math.floor(
      (Date.now() - activeTimer.startTime + activeTimer.elapsedTime)
    );
    
    setActiveTimer(prev => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedTime: currentElapsedSeconds,
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
