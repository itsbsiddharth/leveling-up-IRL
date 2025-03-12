
export interface Rank {
  id: string;
  title: string;
  xpRequired: number;
  color: 'blue' | 'purple' | 'red';
  benefits: string[];
  description: string;
}

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
    xpRequired: 1000,
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
    xpRequired: 3000,
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
    xpRequired: 6000,
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
    xpRequired: 10000,
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

export const getProgressToNextRank = (xp: number): { current: number, max: number, percentage: number } => {
  const currentRank = getCurrentRank(xp);
  const nextRank = getNextRank(xp);
  
  if (!nextRank) {
    // Max rank reached
    return { current: 1, max: 1, percentage: 100 };
  }
  
  const current = xp - currentRank.xpRequired;
  const max = nextRank.xpRequired - currentRank.xpRequired;
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  
  return { current, max, percentage };
};

export const levelWithinRank = (xp: number): number => {
  const { current, max } = getProgressToNextRank(xp);
  
  // Calculate level within rank (each level is 20% of progress to next rank)
  const levelSize = max / 5;
  const level = Math.floor(current / levelSize) + 1;
  
  return Math.min(level, 5); // Cap at level 5
};
