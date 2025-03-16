import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { COLLECTIONS, LeaderboardEntry } from '../firebase/schema';
import { toast } from 'sonner';

/**
 * Utility to check if the leaderboard collection exists and contains data
 */
export const checkLeaderboardData = async (): Promise<boolean> => {
  try {
    const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARD);
    const snapshot = await getDocs(leaderboardRef);
    
    if (snapshot.empty) {
      console.log('No leaderboard data exists');
      return false;
    } else {
      console.log(`Found ${snapshot.size} leaderboard entries`);
      snapshot.forEach(doc => console.log(doc.id, doc.data()));
      return true;
    }
  } catch (error) {
    console.error('Error checking leaderboard data:', error);
    return false;
  }
};

/**
 * Add test entries to the leaderboard collection
 */
export const addTestLeaderboardEntries = async (): Promise<boolean> => {
  try {
    // Make sure user is logged in
    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in to add test data');
      return false;
    }
    
    // First, check if the current user already has a leaderboard entry
    const userLeaderboardRef = doc(db, COLLECTIONS.LEADERBOARD, user.uid);
    const userLeaderboardDoc = await getDoc(userLeaderboardRef);
    
    // Add the current user to the leaderboard if not present
    if (!userLeaderboardDoc.exists()) {
      const currentUserEntry: LeaderboardEntry = {
        uid: user.uid,
        displayName: user.displayName || 'Current User',
        photoURL: user.photoURL,
        xp: 1000, // Start with 1000 XP
        rank: 'e-rank',
        level: 1,
        achievementsUnlocked: 1,
        streak: 3,
        lastUpdated: Date.now()
      };
      
      await setDoc(userLeaderboardRef, currentUserEntry);
      console.log('Added current user to leaderboard');
    } else {
      console.log('Current user already exists in leaderboard');
    }
    
    // Add some test users
    const testUsers = [
      {
        uid: 'test-user-1',
        displayName: 'Test Hunter Alpha',
        photoURL: null,
        xp: 1500,
        rank: 'd-rank',
        level: 3,
        achievementsUnlocked: 5,
        streak: 7,
        lastUpdated: Date.now()
      },
      {
        uid: 'test-user-2',
        displayName: 'Test Hunter Beta',
        photoURL: null,
        xp: 800,
        rank: 'e-rank',
        level: 2,
        achievementsUnlocked: 2,
        streak: 2,
        lastUpdated: Date.now()
      },
      {
        uid: 'test-user-3',
        displayName: 'Test Hunter Gamma',
        photoURL: null,
        xp: 2500,
        rank: 'c-rank',
        level: 5,
        achievementsUnlocked: 8,
        streak: 14,
        lastUpdated: Date.now()
      }
    ];
    
    // Add each test user to the leaderboard
    for (const testUser of testUsers) {
      const testUserRef = doc(db, COLLECTIONS.LEADERBOARD, testUser.uid);
      await setDoc(testUserRef, testUser);
      console.log(`Added test user ${testUser.displayName} to leaderboard`);
    }
    
    toast.success('Test data added to leaderboard successfully');
    return true;
  } catch (error) {
    console.error('Error adding test leaderboard entries:', error);
    toast.error('Failed to add test data to leaderboard');
    return false;
  }
}; 