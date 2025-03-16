import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, where, limit, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { COLLECTIONS, FirestoreUser, UserStats, LeaderboardEntry } from './schema';
import { getCurrentRank, levelWithinRank } from '@/utils/ranks';

// Create or update user data in Firestore
export const syncUserData = async (userData: Partial<FirestoreUser>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user
      const newUser: FirestoreUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: Date.now(),
        lastActive: Date.now(),
        stats: {
          xp: 0,
          hp: 100,
          streak: 0,
          level: 1,
          rank: 'e-rank',
          questsCompleted: 0,
          achievementsUnlocked: 0,
          totalProductiveMinutes: 0,
          totalPhysicalMinutes: 0,
          totalIntellectualMinutes: 0,
          totalRecoveryMinutes: 0,
          totalDistractionMinutes: 0
        },
        ...userData
      };
      
      await setDoc(userRef, newUser);
      
      // Add to leaderboard for new users
      await updateLeaderboardEntry(newUser);
      
      return newUser;
    } else {
      // Update existing user
      const updatedData = {
        ...userData,
        lastActive: Date.now()
      };
      
      await updateDoc(userRef, updatedData);
      
      // Refresh leaderboard if stats were updated
      if (userData.stats) {
        const existingUser = userDoc.data() as FirestoreUser;
        await updateLeaderboardEntry({
          ...existingUser,
          ...updatedData
        } as FirestoreUser);
      }
      
      return {
        ...userDoc.data(),
        ...updatedData
      };
    }
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw error;
  }
};

// Get current user data from Firestore
export const getUserData = async (): Promise<FirestoreUser | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as FirestoreUser;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user stats after activity or quest completion
export const updateUserStats = async (stats: Partial<UserStats>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const userData = await getUserData();
    if (!userData) throw new Error('User data not found');

    // Merge with existing stats
    const updatedStats = {
      ...userData.stats,
      ...stats
    };
    
    // Calculate rank and level
    const currentRank = getCurrentRank(updatedStats.xp);
    const level = levelWithinRank(updatedStats.xp);
    
    // Update the stats with calculated values
    updatedStats.rank = currentRank.id;
    updatedStats.level = level;

    await syncUserData({ stats: updatedStats });
    
    return updatedStats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Update user's leaderboard entry
export const updateLeaderboardEntry = async (userData: FirestoreUser) => {
  try {
    const { uid, displayName, photoURL, stats } = userData;
    
    // Log the process for debugging
    console.log('Updating leaderboard entry for user:', uid, displayName);
    
    // Ensure we have the minimum required data
    if (!uid) {
      console.error('Cannot update leaderboard: Missing user ID');
      throw new Error('Cannot update leaderboard: Missing user ID');
    }
    
    // Create or update leaderboard entry with default values for missing fields
    const leaderboardEntry: LeaderboardEntry = {
      uid,
      displayName: displayName || 'Anonymous Hunter',
      photoURL: photoURL || null,
      xp: stats?.xp || 0,
      rank: stats?.rank || 'e-rank',
      level: stats?.level || 1,
      achievementsUnlocked: stats?.achievementsUnlocked || 0,
      streak: stats?.streak || 0,
      lastUpdated: Date.now()
    };

    // Log the entry we're about to save
    console.log('Saving leaderboard entry:', leaderboardEntry);

    const leaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, uid);
    await setDoc(leaderboardRef, leaderboardEntry);
    
    console.log('Leaderboard entry updated successfully');
    
    return leaderboardEntry;
  } catch (error) {
    console.error('Error updating leaderboard entry:', error);
    throw error;
  }
};

// Get user's position in leaderboard
export const getUserRanking = async (uid: string): Promise<number> => {
  try {
    // Query all users with higher XP to determine rank
    const userDoc = await getDoc(doc(db, COLLECTIONS.LEADERBOARD, uid));
    if (!userDoc.exists()) {
      return -1; // User not found in leaderboard
    }
    
    const userData = userDoc.data() as LeaderboardEntry;
    
    // Count users with more XP
    const higherRankedQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      where('xp', '>', userData.xp)
    );
    
    const higherRankedSnapshot = await getDocs(higherRankedQuery);
    
    // Rank is number of users with more XP + 1
    return higherRankedSnapshot.size + 1;
  } catch (error) {
    console.error('Error getting user ranking:', error);
    throw error;
  }
};

// Migrate localStorage data to Firestore
export const migrateLocalDataToFirestore = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    
    // Get local data
    const gameStats = localStorage.getItem('gameStats');
    const activities = localStorage.getItem('activities');
    
    if (!gameStats) return; // No data to migrate
    
    const stats = JSON.parse(gameStats);
    
    // Calculate additional stats from activities
    let statsToUpdate: Partial<UserStats> = {
      xp: stats.xp || 0,
      hp: stats.hp || 100,
      streak: stats.streak || 0,
    };
    
    if (activities) {
      const parsedActivities = JSON.parse(activities);
      
      // Calculate activity totals
      const totals = parsedActivities.reduce((acc: any, activity: any) => {
        if (activity.type === 'intellectual') {
          acc.totalIntellectualMinutes += activity.minutes;
          acc.totalProductiveMinutes += activity.minutes;
        } else if (activity.type === 'physical') {
          acc.totalPhysicalMinutes += activity.minutes;
          acc.totalProductiveMinutes += activity.minutes;
        } else if (activity.type === 'recovery') {
          acc.totalRecoveryMinutes += activity.minutes;
        } else if (activity.type === 'distractions') {
          acc.totalDistractionMinutes += activity.minutes;
        }
        return acc;
      }, {
        totalProductiveMinutes: 0,
        totalIntellectualMinutes: 0,
        totalPhysicalMinutes: 0,
        totalRecoveryMinutes: 0,
        totalDistractionMinutes: 0
      });
      
      statsToUpdate = {
        ...statsToUpdate,
        ...totals
      };
    }
    
    // Update user data with local stats
    await updateUserStats(statsToUpdate);
    
    return statsToUpdate;
  } catch (error) {
    console.error('Error migrating data to Firestore:', error);
    throw error;
  }
}; 