import React, { useState, useEffect } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityLog from '@/components/dashboard/ActivityLog';
import { useGame } from '@/context/GameContext';
import { getCurrentRank } from '@/utils/ranks';

// Simple error boundary component for individual components
const SafeComponent = ({ 
  children, 
  fallback = <div className="cyber-panel p-4 border border-cyber-red bg-black/50 text-cyber-red text-sm">
    Component failed to load
  </div>
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    return () => {
      setHasError(false);
    };
  }, []);

  if (hasError) {
    return fallback;
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Component error:", error);
    setHasError(true);
    return fallback;
  }
};

const Index = () => {
  const { stats } = useGame();
  let currentRank;
  
  try {
    currentRank = getCurrentRank(stats.xp);
  } catch (error) {
    console.error("Error getting current rank:", error);
    currentRank = null;
  }

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
            <SafeComponent>
              <StatsCard />
            </SafeComponent>
            
            <SafeComponent>
              <ActivityLog />
            </SafeComponent>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
