import { collection, query, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { COLLECTIONS, LeaderboardEntry } from './schema';

// Get global leaderboard (top users by XP)
export const getGlobalLeaderboard = async (limitCount = 100): Promise<LeaderboardEntry[]> => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized');
      throw new Error('Firebase not initialized');
    }

    // Simple query - just order by XP descending
    const leaderboardQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(leaderboardQuery);
    
    return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    throw error;
  }
};

// Get current user's position in the global leaderboard
export const getCurrentUserRanking = async (): Promise<{ rank: number, totalUsers: number }> => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      console.error('Firebase not initialized');
      throw new Error('Firebase not initialized');
    }

    const user = auth.currentUser;
    if (!user) {
      console.warn('No authenticated user when getting ranking');
      return { rank: -1, totalUsers: 0 };
    }
    
    // Get current user's leaderboard entry
    const userDoc = await getDoc(doc(db, COLLECTIONS.LEADERBOARD, user.uid));
    if (!userDoc.exists()) {
      console.warn(`User ${user.uid} not found in leaderboard`);
      return { rank: -1, totalUsers: 0 };
    }
    
    const userData = userDoc.data() as LeaderboardEntry;
    
    // Make sure XP is defined before counting users with higher XP
    if (userData.xp === undefined) {
      console.warn(`User ${user.uid} has undefined XP in leaderboard`);
      return { rank: -1, totalUsers: 0 };
    }
    
    // Count users with higher XP - requires index on xp field
    const higherXPQuery = query(
      collection(db, COLLECTIONS.LEADERBOARD),
      orderBy('xp', 'desc')
    );
    
    const higherXPSnapshot = await getDocs(higherXPQuery);
    
    // Find user's position in the sorted list
    let userRank = -1;
    
    higherXPSnapshot.docs.forEach((doc, index) => {
      if (doc.id === user.uid) {
        userRank = index + 1;
      }
    });
    
    return { 
      rank: userRank,
      totalUsers: higherXPSnapshot.size
    };
  } catch (error) {
    console.error('Error getting current user ranking:', error);
    throw error;
  }
}; 