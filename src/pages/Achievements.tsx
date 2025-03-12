
import React, { useEffect, useRef } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { useGame } from '@/context/GameContext';
import { ranks, getCurrentRank, getProgressToNextRank } from '@/utils/ranks';
import RankCard from '@/components/achievements/RankCard';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const Achievements = () => {
  const { stats } = useGame();
  const currentRank = getCurrentRank(stats.xp);
  const { percentage } = getProgressToNextRank(stats.xp);
  const currentRankRef = useRef<HTMLDivElement>(null);
  
  // Sort ranks into categories
  const aspirationalRanks = ranks.filter(rank => rank.xpRequired > stats.xp);
  const achievedRanks = ranks.filter(rank => 
    rank.xpRequired <= stats.xp && rank.id !== currentRank.id
  ).sort((a, b) => b.xpRequired - a.xpRequired); // Sort by highest XP first
  
  useEffect(() => {
    // Scroll to the current rank on initial load with a slight delay for animation
    setTimeout(() => {
      if (currentRankRef.current) {
        currentRankRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  }, []);
  
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement>) => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24 overflow-hidden">
        <div className="max-w-md mx-auto relative">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Hunter Ranks
            </h1>
            <p className="text-gray-400 mb-6">Level up and unlock new abilities</p>
            
            {/* Navigation controls */}
            <div className="flex justify-center space-x-6 mb-2">
              <button 
                onClick={() => {
                  if (aspirationalRanks.length > 0) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    toast.info("You've already reached the highest rank!");
                  }
                }}
                className="flex flex-col items-center text-gray-400 hover:text-cyber-blue transition-colors"
              >
                <ChevronUp className="w-6 h-6" />
                <span className="text-xs">Locked Ranks</span>
              </button>
              
              <button 
                onClick={() => scrollToSection(currentRankRef)}
                className="flex flex-col items-center text-cyber-blue cyber-text-glow"
              >
                <div className="w-3 h-3 bg-cyber-blue rounded-full mb-1 animate-pulse"></div>
                <span className="text-xs">Current Rank</span>
              </button>
              
              <button 
                onClick={() => {
                  if (achievedRanks.length > 0) {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  } else {
                    toast.info("You don't have any previously achieved ranks yet!");
                  }
                }}
                className="flex flex-col items-center text-gray-400 hover:text-cyber-blue transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
                <span className="text-xs">Achieved Ranks</span>
              </button>
            </div>
          </div>
          
          {/* Aspirational (locked) ranks section */}
          {aspirationalRanks.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3 text-center">
                Locked Ranks
              </h2>
              <div className="space-y-4">
                {aspirationalRanks.map((rank) => (
                  <RankCard 
                    key={rank.id}
                    rank={rank}
                    isUnlocked={false}
                    isActive={false}
                    progress={0}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Current rank section - centered and highlighted */}
          <div ref={currentRankRef} className="mb-10 transform transition-all duration-500">
            <h2 className="text-sm uppercase tracking-wider text-cyber-blue mb-3 text-center cyber-text-glow">
              Current Rank
            </h2>
            <RankCard 
              key={currentRank.id}
              rank={currentRank}
              isUnlocked={true}
              isActive={true}
              progress={percentage}
            />
          </div>
          
          {/* Previously achieved ranks section */}
          {achievedRanks.length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3 text-center">
                Achieved Ranks
              </h2>
              <div className="space-y-4">
                {achievedRanks.map((rank) => (
                  <RankCard 
                    key={rank.id}
                    rank={rank}
                    isUnlocked={true}
                    isActive={false}
                    progress={100}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Achievements;
