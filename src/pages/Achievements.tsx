
import React from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { useGame } from '@/context/GameContext';
import { ranks, getCurrentRank, getProgressToNextRank } from '@/utils/ranks';
import RankCard from '@/components/achievements/RankCard';

const Achievements = () => {
  const { stats } = useGame();
  const currentRank = getCurrentRank(stats.xp);
  const { percentage } = getProgressToNextRank(stats.xp);

  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Hunter Ranks
            </h1>
            <p className="text-gray-400">Level up and unlock new abilities</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ranks.map((rank) => (
              <RankCard 
                key={rank.id}
                rank={rank}
                isUnlocked={stats.xp >= rank.xpRequired}
                isActive={currentRank.id === rank.id}
                progress={currentRank.id === rank.id ? percentage : 0}
              />
            ))}
          </div>
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Achievements;
