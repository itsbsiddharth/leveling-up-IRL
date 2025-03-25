import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentRank, getNextRank, getProgressToNextRank, levelWithinRank } from '@/utils/ranks';
import { auth } from '../firebase';
import { getUserData, updateUserStats, migrateLocalDataToFirestore } from '../firebase/userService';
import { FirestoreUser, UserStats } from '../firebase/schema';
import { usePopup } from './PopupContext';
import { showXpGainPopup, showHpChangePopup, showLevelUpPopup, showQuestCompletePopup, showErrorPopup, showSuccessPopup, showInfoPopup } from '@/utils/popupUtils';

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
  maxStreak: number; // maximum streak ever achieved
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
  completeRecoveryChallenge: (hpAmount?: number) => void;
  completeQuest: (xpValue: number, questTitle: string) => void;
  hardReset: () => Promise<void>;
}

const GameContext = createContext<GameContextType>({
  stats: {
    xp: 0,
    hp: 100,
    streak: 0,
    maxStreak: 0,
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
  hardReset: async () => {},
});

export const useGame = () => useContext(GameContext);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Game state
  const [stats, setStats] = useState<GameStats>({
    xp: 0,
    hp: 100,
    streak: 0,
    maxStreak: 0,
    lastActive: null,
  });
  
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Access popup context
  const { showXpChangePopup, showHpChangePopup, showLevelUpPopup, showQuestCompletePopup, showErrorPopup } = usePopup();
  
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
              maxStreak: userData.stats.maxStreak || 0,
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
      setStats(prev => {
        const newStreak = prev.streak + 1;
        const newMaxStreak = Math.max(newStreak, prev.maxStreak);
        
        return {
          ...prev,
          streak: newStreak,
          maxStreak: newMaxStreak,
          lastActive: today,
        };
      });
      
      // Show streak notification
      showSuccessPopup(`Streak increased to ${stats.streak + 1} days!`, {
        description: "Keep up the momentum!"
      });
    } else if (stats.lastActive !== today) {
      // Not consecutive, reset streak to 1
      setStats(prev => ({
        ...prev,
        streak: 1,
        // maxStreak is unchanged since we're resetting current streak
        lastActive: today,
      }));
      
      // Show streak reset notification
      showInfoPopup(`New streak started!`, {
        description: "Let's build momentum day by day."
      });
    }
  };
  
  // XP calculation for productive activities
  const getXpForActivity = (minutes: number, isHighQuality = false) => {
    // Base XP: 1 XP per minute exactly as per design brief
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
  
  // HP loss calculation for distractions with tiered penalties
  const getHpForWastedTime = (minutes: number) => {
    // Base HP loss: 1 HP per 5 minutes as per design brief
    let hpLoss = Math.floor(minutes / 5);
    
    // Implement tiered penalty for distractions over 1 hour
    if (minutes > 60) {
      // Add 50% more HP loss for time beyond 60 minutes
      const baseHpLoss = Math.floor(60 / 5); // HP loss for first hour
      const extraMinutes = minutes - 60;
      const extraHpLoss = Math.floor(extraMinutes / 5 * 1.5); // 50% higher penalty
      hpLoss = baseHpLoss + extraHpLoss;
    }
    
    // Cap HP loss at 60 to prevent excessive punishment but still significant
    return Math.min(hpLoss, 60);
  };
  
  // HP recovery calculation - improved as per design brief
  const getHpForRecovery = (minutes: number) => {
    // Enhanced recovery: 10 HP per 5 minutes (2 HP per minute)
    let hpGain = Math.floor(minutes / 5 * 10);
    
    // Cap recovery at 60 HP per session (30 minutes of recovery)
    return Math.min(hpGain, 60);
  };
  
  const logActivity = (type: ActivityType, minutes: number, isHighQuality = false) => {
    // Check if the session is longer than 12 hours (720 minutes)
    if (minutes > 720) {
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
      
      // Get current and new rank to check for rank up
      const currentRank = getCurrentRank(stats.xp);
      const newRank = getCurrentRank(stats.xp + xpGained);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        xp: prev.xp + xpGained,
        lastActive: todayDate,
      }));
      
      // Show XP gain popup
      showXpChangePopup(xpGained, `${type} activity (${minutes} min)`);
      
      // Check if the user ranked up and show rank up popup
      if (newRank.id !== currentRank.id) {
        showLevelUpPopup(levelWithinRank(stats.xp + xpGained), newRank.title);
      }
      
    } else if (type === 'distractions') {
      hpLost = getHpForWastedTime(minutes);
      
      // Update stats
      setStats(prev => {
        const newHp = Math.max(0, prev.hp - hpLost);
        const wasAtZero = newHp === 0 && prev.hp > 0;
        
        if (wasAtZero) {
          showErrorPopup(`CRITICAL DAMAGE: Your energy is depleted!`, {
            description: "Complete a recovery activity to restore your HP."
          });
        }
        
        return {
          ...prev,
          hp: newHp,
          lastActive: todayDate,
        };
      });
      
      // Show HP loss popup
      showHpChangePopup(-hpLost, `distractions (${minutes} min)`);
      
    } else if (type === 'recovery') {
      hpGained = getHpForRecovery(minutes);
      
      // Update stats with a cap at 100 HP
      setStats(prev => ({
        ...prev,
        hp: Math.min(100, prev.hp + hpGained),
        lastActive: todayDate,
      }));
      
      // Show HP gain popup
      showHpChangePopup(hpGained, `recovery (${minutes} min)`);
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
          maxStreak: stats.maxStreak,
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
  const completeRecoveryChallenge = (hpAmount = 10) => {
    // Add HP for completing a recovery challenge
    setStats(prev => {
      const newHp = Math.min(prev.hp + hpAmount, 100);
      const wasFullyRestored = prev.hp < 100 && newHp === 100;
      
      // Show appropriate notification
      if (wasFullyRestored) {
        showSuccessPopup('HP fully restored!', {
          description: 'Your energy has been completely restored.'
        });
      } else {
        showSuccessPopup(`+${hpAmount} HP recovered!`, {
          description: "Recovery challenge completed successfully.",
          hp: hpAmount
        });
      }
      
      return {
        ...prev,
        hp: newHp
      };
    });
    
    // Update Firestore
    if (auth.currentUser) {
      updateUserStats({ hp: Math.min(stats.hp + hpAmount, 100) }).catch(err => {
        console.error('Failed to update HP in Firestore:', err);
      });
    }
  };
  
  // Quest completion
  const completeQuest = (xpValue: number, questTitle: string = "Quest") => {
    // Add the XP from the quest completion
    setStats(prev => ({
      ...prev,
      xp: prev.xp + xpValue,
    }));
    
    // Show quest complete popup with the quest title and XP gained
    showXpChangePopup(xpValue, `Quest completed: ${questTitle}`);
    
    // Also show the dedicated quest completion popup
    if (showQuestCompletePopup) {
      showQuestCompletePopup(questTitle, xpValue);
    }
    
    // Update Firestore
    if (auth.currentUser) {
      updateUserStats({ 
        xp: stats.xp + xpValue,
        questsCompleted: 1  // Increment quests completed counter
      }).catch(err => {
        console.error('Failed to update XP in Firestore:', err);
      });
    }
    
    console.log(`Quest completed! +${xpValue} XP awarded`);
  };
  
  // Hard reset stats to initial values
  const hardReset = async () => {
    setStats({
      xp: 0,
      hp: 100,
      streak: 0,
      maxStreak: 0,
      lastActive: null,
    });
    
    // ... existing code ...
  };
  
  // Passive HP regeneration
  useEffect(() => {
    // Only run if the user is signed in and data is initialized
    if (!isFirebaseInitialized || !auth.currentUser) return;
    
    // Check if HP is already at max
    if (stats.hp >= 100) return;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if any distraction activities were logged today
    const hasDistractionToday = activities.some(activity => {
      const activityDate = activity.timestamp.split('T')[0];
      return activityDate === today && activity.type === 'distractions';
    });
    
    // If no distractions today, set up passive regeneration
    if (!hasDistractionToday) {
      // Regenerate 2 HP per hour as per design brief
      const regenerationInterval = setInterval(() => {
        setStats(prev => {
          // Only regenerate if HP is less than 100
          if (prev.hp < 100) {
            const newHp = Math.min(prev.hp + 2, 100);
            
            // If we hit 100 HP after this regeneration, show a notification
            if (prev.hp < 100 && newHp === 100) {
              showSuccessPopup('HP fully restored!', {
                description: 'Your energy has been completely restored.'
              });
            }
            
            // Also update Firestore
            if (auth.currentUser) {
              updateUserStats({ hp: newHp }).catch(err => {
                console.error('Failed to update HP in Firestore:', err);
              });
            }
            
            return {
              ...prev,
              hp: newHp
            };
          }
          return prev;
        });
      }, 3600000); // 1 hour in milliseconds
      
      return () => clearInterval(regenerationInterval);
    }
  }, [isFirebaseInitialized, stats.hp, activities]);
  
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
        completeQuest,
        hardReset
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
      completeQuest,
      hardReset
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
