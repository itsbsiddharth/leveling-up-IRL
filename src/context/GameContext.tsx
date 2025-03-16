import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';
import { auth } from '../firebase';
import { getUserData, updateUserStats, migrateLocalDataToFirestore } from '../firebase/userService';
import { FirestoreUser, UserStats } from '../firebase/schema';

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

// Define an interface for the confirmation modal
interface SessionConfirmationModal {
  isOpen: boolean;
  type: ActivityType | null;
  minutes: number;
  isHighQuality: boolean;
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
  confirmLongSession: (confirm: boolean) => void;
  undoActivity: (activityId: string) => void;
  startTimer: (type: ActivityType) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  getXpForActivity: (minutes: number, isHighQuality?: boolean) => number;
  getHpForWastedTime: (minutes: number) => number;
  getHpForRecovery: (minutes: number) => number;
  completeRecoveryChallenge: () => void;
  completeQuest: (questId: string) => void;
}

const GameContext = createContext<GameContextType>({
  stats: {
    xp: 0,
    hp: 100,
    streak: 0,
    lastActive: null,
  },
  activities: [],
  activeTimer: {
    type: null,
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
  },
  logActivity: () => {},
  confirmLongSession: () => {},
  undoActivity: () => {},
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  resetTimer: () => {},
  getXpForActivity: () => 0,
  getHpForWastedTime: () => 0,
  getHpForRecovery: () => 0,
  completeRecoveryChallenge: () => {},
  completeQuest: () => {},
});

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Game state
  const [stats, setStats] = useState<GameStats>({
    xp: 0,
    hp: 100,
    streak: 0,
    lastActive: null,
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Timer state
  const [activeTimer, setActiveTimer] = useState({
    type: null as ActivityType | null,
    isRunning: false,
    startTime: null as number | null,
    elapsedTime: 0, // in milliseconds
  });
  
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  
  // Add state for confirmation dialog
  const [sessionConfirmation, setSessionConfirmation] = useState<SessionConfirmationModal>({
    isOpen: false,
    type: null,
    minutes: 0,
    isHighQuality: false
  });
  
  // Check for Firebase user and load data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (auth.currentUser && !isFirebaseInitialized) {
        try {
          const userData = await getUserData();
          
          if (userData && userData.stats) {
            setStats({
              xp: userData.stats.xp || 0,
              hp: userData.stats.hp || 100,
              streak: userData.stats.streak || 0,
              lastActive: userData.lastActive ? new Date(userData.lastActive).toISOString().split('T')[0] : null,
            });
            
            // Load activities if available
            if (userData.activities && Array.isArray(userData.activities)) {
              setActivities(userData.activities);
            }
          }
          
          setIsFirebaseInitialized(true);
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
    };
    
    loadUserData();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserData();
      } else {
        // Reset to default state if logged out
        setIsFirebaseInitialized(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Update streak when user logs activity on a new day
  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (stats.lastActive === today) {
      // Already logged activity today, no streak update needed
      return;
    }
    
    // Check if the last activity was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (stats.lastActive === yesterdayStr) {
      // Consecutive day, increment streak
      setStats(prev => ({
        ...prev,
        streak: prev.streak + 1,
        lastActive: today,
      }));
      
      // Show streak notification
      toast.success(`Streak increased to ${stats.streak + 1} days!`, {
        description: "Keep up the momentum!"
      });
    } else if (stats.lastActive !== today) {
      // Not consecutive, reset streak to 1
      setStats(prev => ({
        ...prev,
        streak: 1,
        lastActive: today,
      }));
      
      // Show streak reset notification
      toast.info(`New streak started!`, {
        description: "Let's build momentum day by day."
      });
    }
  };
  
  // XP calculation for productive activities
  const getXpForActivity = (minutes: number, isHighQuality = false) => {
    // Base XP: 1 XP per minute
    let xp = minutes;
    
    // High quality bonus: +50%
    if (isHighQuality) {
      xp = Math.floor(xp * 1.5);
    }
    
    // Bonus for longer sessions (diminishing returns)
    if (minutes >= 30) {
      xp += 5; // +5 XP bonus for 30+ minute sessions
    }
    
    if (minutes >= 60) {
      xp += 5; // Additional +5 XP bonus for 60+ minute sessions
    }
    
    return xp;
  };
  
  // HP loss calculation for distractions
  const getHpForWastedTime = (minutes: number) => {
    // Base HP loss: 1 HP per 5 minutes
    let hpLoss = Math.floor(minutes / 5);
    
    // Cap HP loss at 50 to prevent excessive punishment
    return Math.min(hpLoss, 50);
  };
  
  // HP recovery calculation
  const getHpForRecovery = (minutes: number) => {
    // Base recovery: 1 HP per 2 minutes
    let hpGain = Math.floor(minutes / 2);
    
    // Cap recovery at 50 HP per session
    return Math.min(hpGain, 50);
  };
  
  const logActivity = (type: ActivityType, minutes: number, isHighQuality = false) => {
    // Check if the session is longer than 6 hours (360 minutes)
    if (minutes > 360) {
      // Show confirmation dialog
      setSessionConfirmation({
        isOpen: true,
        type,
        minutes,
        isHighQuality
      });
      return; // Don't proceed until user confirms
    }
    
    // Continue with normal activity logging
    processActivityLog(type, minutes, isHighQuality);
  };
  
  // New method to handle confirmation response
  const confirmLongSession = (confirm: boolean) => {
    if (confirm && sessionConfirmation.type) {
      // User confirmed, proceed with logging
      processActivityLog(
        sessionConfirmation.type,
        sessionConfirmation.minutes,
        sessionConfirmation.isHighQuality
      );
    }
    
    // Reset the confirmation state
    setSessionConfirmation({
      isOpen: false,
      type: null,
      minutes: 0,
      isHighQuality: false
    });
  };
  
  // Add handler for undoing activities
  const undoActivity = (activityId: string) => {
    // Find the activity to be removed
    const activityToRemove = activities.find(activity => activity.id === activityId);
    
    if (!activityToRemove) return;
    
    // Update stats
    let updatedStats = { ...stats };
    
    if (activityToRemove.xpGained) {
      updatedStats.xp = Math.max(0, stats.xp - activityToRemove.xpGained);
    }
    
    if (activityToRemove.hpLost) {
      updatedStats.hp = Math.min(100, stats.hp + activityToRemove.hpLost);
    }
    
    if (activityToRemove.hpGained) {
      updatedStats.hp = Math.max(0, stats.hp - activityToRemove.hpGained);
    }
    
    // Update the stats
    setStats(updatedStats);
    
    // Remove the activity from the list
    setActivities(currentActivities => 
      currentActivities.filter(activity => activity.id !== activityId)
    );
    
    // Update Firestore
    const updateFirestoreStats = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Get current stat totals
        const firestoreUser = await getUserData();
        if (!firestoreUser || !firestoreUser.stats) return;
        
        const statUpdates: Partial<UserStats> = {
          xp: updatedStats.xp,
          hp: updatedStats.hp,
        };
        
        // Decrement type-specific stats
        if (activityToRemove.type === 'intellectual') {
          statUpdates.totalIntellectualMinutes = 
            Math.max(0, (firestoreUser.stats.totalIntellectualMinutes || 0) - activityToRemove.minutes);
          statUpdates.totalProductiveMinutes = 
            Math.max(0, (firestoreUser.stats.totalProductiveMinutes || 0) - activityToRemove.minutes);
        } else if (activityToRemove.type === 'physical') {
          statUpdates.totalPhysicalMinutes = 
            Math.max(0, (firestoreUser.stats.totalPhysicalMinutes || 0) - activityToRemove.minutes);
          statUpdates.totalProductiveMinutes = 
            Math.max(0, (firestoreUser.stats.totalProductiveMinutes || 0) - activityToRemove.minutes);
        } else if (activityToRemove.type === 'distractions') {
          statUpdates.totalDistractionMinutes = 
            Math.max(0, (firestoreUser.stats.totalDistractionMinutes || 0) - activityToRemove.minutes);
        } else if (activityToRemove.type === 'recovery') {
          statUpdates.totalRecoveryMinutes = 
            Math.max(0, (firestoreUser.stats.totalRecoveryMinutes || 0) - activityToRemove.minutes);
        }
        
        // Update Firestore
        await updateUserStats(statUpdates);
      } catch (error) {
        console.error("Error updating Firestore after undo:", error);
      }
    };
    
    updateFirestoreStats();
  };
  
  // Extract the actual logging logic to a separate function
  const processActivityLog = (type: ActivityType, minutes: number, isHighQuality = false) => {
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
      isHighQuality
    };
    
    setActivities(prev => [newActivity, ...prev]);
    
    // Update streak if needed
    updateStreak();
    
    // Sync with Firestore
    const updateFirestoreStats = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Get current stat totals for different activity types
        const firestoreUser = await getUserData();
        if (!firestoreUser || !firestoreUser.stats) return;
        
        const statUpdates: Partial<UserStats> = {
          xp: stats.xp + xpGained,
          hp: type === 'distractions' 
            ? Math.max(stats.hp - hpLost, 0) 
            : type === 'recovery'
              ? Math.min(stats.hp + hpGained, 100)
              : stats.hp,
          streak: stats.streak,
        };
        
        // Update the type-specific total minutes
        if (type === 'intellectual') {
          statUpdates.totalIntellectualMinutes = 
            (firestoreUser.stats.totalIntellectualMinutes || 0) + minutes;
        } else if (type === 'physical') {
          statUpdates.totalPhysicalMinutes = 
            (firestoreUser.stats.totalPhysicalMinutes || 0) + minutes;
        } else if (type === 'distractions') {
          statUpdates.totalDistractionMinutes = 
            (firestoreUser.stats.totalDistractionMinutes || 0) + minutes;
        } else if (type === 'recovery') {
          statUpdates.totalRecoveryMinutes = 
            (firestoreUser.stats.totalRecoveryMinutes || 0) + minutes;
        }
        
        // Update total productive minutes (intellectual + physical)
        if (type === 'intellectual' || type === 'physical') {
          statUpdates.totalProductiveMinutes = 
            (firestoreUser.stats.totalProductiveMinutes || 0) + minutes;
        }
        
        // Update Firestore
        await updateUserStats(statUpdates);
        
        // Also add the activity to Firestore
        // ... existing code to add activity to Firestore if needed ...
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    };
    
    updateFirestoreStats();
    
    // Reset timer after logging
    resetTimer();
  };
  
  // Timer functions
  const startTimer = (type: ActivityType) => {
    setActiveTimer({
      type,
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  };
  
  const pauseTimer = () => {
    if (activeTimer.isRunning && activeTimer.startTime) {
      const now = Date.now();
      const newElapsedTime = activeTimer.elapsedTime + (now - activeTimer.startTime);
      
      setActiveTimer({
        ...activeTimer,
        isRunning: false,
        startTime: null,
        elapsedTime: newElapsedTime,
      });
    }
  };
  
  const resumeTimer = () => {
    if (!activeTimer.isRunning) {
      setActiveTimer({
        ...activeTimer,
        isRunning: true,
        startTime: Date.now(),
      });
    }
  };
  
  const resetTimer = () => {
    setActiveTimer({
      type: null,
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
    });
  };
  
  // Recovery challenge completion
  const completeRecoveryChallenge = () => {
    // Add HP for completing a recovery challenge
    setStats(prev => ({
      ...prev,
      hp: Math.min(prev.hp + 10, 100), // Add 10 HP, capped at 100
    }));
    
    toast.success(`+10 HP recovered!`, {
      description: "Recovery challenge completed successfully."
    });
    
    // Update Firestore
    if (auth.currentUser) {
      updateUserStats({ hp: Math.min(stats.hp + 10, 100) });
    }
  };
  
  // Quest completion
  const completeQuest = (questId: string) => {
    // Implementation for quest completion
    // This would update quest status and award XP
    console.log(`Quest ${questId} completed`);
  };
  
  if (!isFirebaseInitialized) {
    // Return a loading state or the default context
    return (
      <GameContext.Provider value={{
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
        confirmLongSession,
        undoActivity,
        completeQuest
      }}>
        {children}
      </GameContext.Provider>
    );
  }
  
  return (
    <GameContext.Provider value={{
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
      confirmLongSession,
      undoActivity,
      completeQuest
    }}>
      {children}
      
      {/* Session length confirmation modal */}
      {sessionConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="cyber-panel bg-cyber-black border border-cyan-500/50 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Long Session</h3>
            
            <p className="text-gray-300 mb-4">
              It appears you are attempting to log an unusually long session ({sessionConfirmation.minutes} minutes). 
              Are you certain you wish to proceed? This may result in an unintended surge in XP.
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => confirmLongSession(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmLongSession(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700"
              >
                Yes, Log Session
              </button>
            </div>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
};

export default GameProvider;
