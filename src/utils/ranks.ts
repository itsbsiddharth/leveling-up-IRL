export interface Rank {
  id: string;
  title: string;
  xpRequired: number;
  color: 'blue' | 'purple' | 'red';
  benefits: string[];
  description: string;
}

// XP required for each level beyond S-Rank Level 5
export const XP_PER_EXTENDED_LEVEL = 1000;

// Size of each level within S-Rank (before extended levels)
export const S_RANK_LEVEL_SIZE = 2000;

export const ranks: Rank[] = [
  {
    id: 'e-rank',
    title: 'E-Rank Hunter',
    xpRequired: 0,
    color: 'blue',
    benefits: [
      'Basic timer functionality', 
      'XP tracking',
      'Basic HP recovery (5 HP per 30 min)'
    ],
    description: 'A novice just beginning their journey.',
  },
  {
    id: 'd-rank',
    title: 'D-Rank Hunter',
    xpRequired: 500,
    color: 'blue',
    benefits: [
      'Streak bonuses', 
      'Basic items',
      'Recovery challenges (+15 HP)'
    ],
    description: 'Shows potential with consistent effort.',
  },
  {
    id: 'c-rank',
    title: 'C-Rank Hunter',
    xpRequired: 1500,
    color: 'blue',
    benefits: [
      'Enhanced HP recovery (8 HP per 30 min)', 
      'Custom categories',
      'Passive HP regeneration'
    ],
    description: 'A reliable hunter with growing skills.',
  },
  {
    id: 'b-rank',
    title: 'B-Rank Hunter',
    xpRequired: 3500,
    color: 'purple',
    benefits: [
      'Enhanced XP gains', 
      'Special items',
      'HP restoration items'
    ],
    description: 'Recognized for dedication and consistent results.',
  },
  {
    id: 'a-rank',
    title: 'A-Rank Hunter',
    xpRequired: 7000,
    color: 'purple',
    benefits: [
      'Superior streak bonuses', 
      'Rare artifacts',
      'Advanced recovery techniques (+20 HP)'
    ],
    description: 'Elite status with impressive achievements.',
  },
  {
    id: 's-rank',
    title: 'S-Rank Hunter',
    xpRequired: 15000,
    color: 'red',
    benefits: [
      'Legendary items', 
      'Maximum efficiency',
      'Master recovery (full HP restoration)'
    ],
    description: 'Legendary hunter of extraordinary capability.',
  },
];

// Calculate the base XP for S-Rank max level (level 5)
// This is the starting point for extended leveling
export const S_RANK_MAX_LEVEL_XP = 15000 + ((5 - 1) * S_RANK_LEVEL_SIZE);

export const getCurrentRank = (xp: number): Rank => {
  // Find the highest rank the user has achieved based on XP
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (xp >= ranks[i].xpRequired) {
      return ranks[i];
    }
  }
  return ranks[0]; // Default to E-Rank
};

export const getNextRank = (xp: number): Rank | null => {
  const currentRank = getCurrentRank(xp);
  const currentIndex = ranks.findIndex(rank => rank.id === currentRank.id);
  
  if (currentIndex < ranks.length - 1) {
    return ranks[currentIndex + 1];
  }
  
  return null; // No next rank if at max rank
};

// This function determines what level the user is within their current rank
export const levelWithinRank = (xp: number): number => {
  const currentRank = getCurrentRank(xp);
  
  // If we're at S-Rank
  if (currentRank.id === 's-rank') {
    // Check if we're on extended levels (beyond level 5)
    if (xp >= S_RANK_MAX_LEVEL_XP) {
      const xpBeyondMaxLevel = xp - S_RANK_MAX_LEVEL_XP;
      const extendedLevel = Math.floor(xpBeyondMaxLevel / XP_PER_EXTENDED_LEVEL) + 6; // Start at level 6
      return extendedLevel;
    } else {
      // We're in normal S-Rank levels (1-5)
      const level = Math.floor((xp - currentRank.xpRequired) / S_RANK_LEVEL_SIZE) + 1;
      return Math.min(level, 5);
    }
  }
  
  // For ranks below S-Rank, calculate normally
  const nextRank = getNextRank(xp);
  if (!nextRank) return 5; // Fallback, shouldn't happen
  
  const totalXpInRank = nextRank.xpRequired - currentRank.xpRequired;
  const currentXpInRank = xp - currentRank.xpRequired;
  
  // Each level is 20% of progress to next rank
  const levelSize = totalXpInRank / 5;
  const level = Math.floor(currentXpInRank / levelSize) + 1;
  
  return Math.min(level, 5); // Cap at level 5 for each rank
};

export const getProgressToNextRank = (xp: number): { current: number, max: number, percentage: number } => {
  const currentRank = getCurrentRank(xp);
  const nextRank = getNextRank(xp);
  
  // Function to calculate S-Rank level without calling levelWithinRank (to avoid circular dependency)
  const calculateSRankLevel = (xpValue: number): number => {
    if (xpValue >= S_RANK_MAX_LEVEL_XP) {
      const xpBeyondMaxLevel = xpValue - S_RANK_MAX_LEVEL_XP;
      return Math.floor(xpBeyondMaxLevel / XP_PER_EXTENDED_LEVEL) + 6; // Start at level 6
    } else {
      const level = Math.floor((xpValue - 15000) / S_RANK_LEVEL_SIZE) + 1;
      return Math.min(level, 5);
    }
  };
  
  if (!nextRank) {
    // Max rank reached - we are in S-Rank
    // Check if we're on the extended levels (beyond level 5)
    if (xp >= S_RANK_MAX_LEVEL_XP) {
      // We're beyond S-Rank Level 5
      // Calculate which extended level we're on
      const currentLevel = calculateSRankLevel(xp);
      
      // Calculate progress within this extended level
      const currentLevelBaseXP = S_RANK_MAX_LEVEL_XP + ((currentLevel - 6) * XP_PER_EXTENDED_LEVEL);
      
      const current = xp - currentLevelBaseXP;
      const max = XP_PER_EXTENDED_LEVEL;
      const percentage = Math.min(Math.round((current / max) * 100), 100);
      
      return { current, max, percentage };
    } else {
      // We're still within the normal S-Rank levels (1-5)
      const currentLevel = calculateSRankLevel(xp);
      const currentLevelBaseXP = 15000 + ((currentLevel - 1) * S_RANK_LEVEL_SIZE);
      
      const current = xp - currentLevelBaseXP;
      const max = S_RANK_LEVEL_SIZE;
      const percentage = Math.min(Math.round((current / max) * 100), 100);
      
      return { current, max, percentage };
    }
  }
  
  // Normal rank progression (not yet at S-Rank)
  const current = xp - currentRank.xpRequired;
  const max = nextRank.xpRequired - currentRank.xpRequired;
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  
  return { current, max, percentage };
};
