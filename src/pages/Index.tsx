
import React from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityLog from '@/components/dashboard/ActivityLog';
import { useGame } from '@/context/GameContext';
import { getCurrentRank } from '@/utils/ranks';

const Index = () => {
  const { stats } = useGame();
  const currentRank = getCurrentRank(stats.xp);

  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Leveling Up IRL
            </h1>
            <p className="text-gray-400">Track your productivity, level up your life</p>
          </div>
          
          <div className="space-y-6">
            <StatsCard />
            
            <ActivityLog />
          </div>
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Index;
