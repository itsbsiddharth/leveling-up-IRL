/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const db = admin.firestore();

// Recalculate leaderboard rankings every 30 minutes
exports.updateLeaderboard = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
  try {
    console.log('Starting leaderboard update...');
    
    // Get all users from the leaderboard collection
    const leaderboardSnapshot = await db.collection('leaderboard').get();
    
    if (leaderboardSnapshot.empty) {
      console.log('No leaderboard entries found');
      return null;
    }
    
    // Update lastUpdated timestamp for all entries
    const now = Date.now();
    const batch = db.batch();
    let entriesUpdated = 0;
    
    leaderboardSnapshot.docs.forEach(doc => {
      try {
        const data = doc.data();
        const leaderboardRef = db.collection('leaderboard').doc(doc.id);
        
        // Create an update object with all the required fields
        const updates = { 
          lastUpdated: now 
        };
        
        // Make sure all required fields have values
        if (data.xp === undefined) updates.xp = 0;
        if (data.streak === undefined) updates.streak = 0;
        if (data.level === undefined) updates.level = 1;
        if (data.rank === undefined) updates.rank = 'e-rank';
        if (data.achievementsUnlocked === undefined) updates.achievementsUnlocked = 0;
        
        batch.update(leaderboardRef, updates);
        entriesUpdated++;
      } catch (docError) {
        console.error(`Error processing leaderboard doc ${doc.id}:`, docError);
        // Continue with other documents
      }
    });
    
    // Only commit if we have updates
    if (entriesUpdated > 0) {
      await batch.commit();
      console.log(`Updated ${entriesUpdated} leaderboard entries`);
    } else {
      console.log('No leaderboard entries were updated');
    }
    
    return null;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return null;
  }
});

// Reset daily quests at midnight in user's timezone (approximated by server time)
exports.resetDailyQuests = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
  try {
    console.log('Resetting daily quests...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    // Reset daily quests for each user
    const batch = db.batch();
    
    for (const userDoc of usersSnapshot.docs) {
      const userQuestsRef = db.collection('users').doc(userDoc.id).collection('userQuests');
      const dailyQuestsSnapshot = await userQuestsRef.where('type', '==', 'daily').get();
      
      dailyQuestsSnapshot.docs.forEach(questDoc => {
        batch.update(questDoc.ref, { 
          completed: false,
          completedAt: null
        });
      });
    }
    
    await batch.commit();
    
    console.log('Daily quests reset completed');
    return null;
  } catch (error) {
    console.error('Error resetting daily quests:', error);
    return null;
  }
});

// Award bonus points for streaks every day
exports.awardStreakBonuses = functions.pubsub.schedule('every day 01:00').onRun(async (context) => {
  try {
    console.log('Awarding streak bonuses...');
    
    // Get users with streaks of 7 days or more
    const usersSnapshot = await db.collection('users')
      .where('stats.streak', '>=', 7)
      .get();
    
    // Award bonus XP based on streak length
    const batch = db.batch();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const streak = userData.stats.streak;
      
      // Calculate bonus XP (10 XP per week of streak)
      const bonusXP = Math.floor(streak / 7) * 10;
      
      if (bonusXP > 0) {
        // Update user stats
        const userRef = db.collection('users').doc(userDoc.id);
        batch.update(userRef, { 
          'stats.xp': admin.firestore.FieldValue.increment(bonusXP)
        });
        
        // Update leaderboard entry
        const leaderboardRef = db.collection('leaderboard').doc(userDoc.id);
        batch.update(leaderboardRef, {
          xp: admin.firestore.FieldValue.increment(bonusXP),
          lastUpdated: Date.now()
        });
        
        console.log(`Awarding ${bonusXP} bonus XP to user ${userDoc.id} for ${streak} day streak`);
      }
    }
    
    await batch.commit();
    
    console.log('Streak bonuses awarded');
    return null;
  } catch (error) {
    console.error('Error awarding streak bonuses:', error);
    return null;
  }
});
