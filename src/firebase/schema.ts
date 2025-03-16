// Database schema for Firebase Firestore
// This file defines the structure and types for our Firestore collections

export interface FirestoreUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
  lastActive: number;
  stats: UserStats;
}

export interface UserStats {
  xp: number;
  hp: number;
  streak: number;
  level: number;
  rank: string;
  questsCompleted: number;
  achievementsUnlocked: number;
  totalProductiveMinutes: number;
  totalPhysicalMinutes: number;
  totalIntellectualMinutes: number;
  totalRecoveryMinutes: number;
  totalDistractionMinutes: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  rank: string;
  level: number;
  achievementsUnlocked: number;
  streak: number;
  lastUpdated: number;
}

// Collection names - used for consistent references throughout the app
export const COLLECTIONS = {
  USERS: 'users',
  LEADERBOARD: 'leaderboard',
  ACTIVITIES: 'activities',
  QUESTS: 'quests',
  ACHIEVEMENTS: 'achievements'
};

// Define subcollection names
export const SUBCOLLECTIONS = {
  USER_ACTIVITIES: 'userActivities',
  USER_QUESTS: 'userQuests',
  USER_ACHIEVEMENTS: 'userAchievements'
}; 