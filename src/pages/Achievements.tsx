import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { useGame } from '@/context/GameContext';
import { ranks, getCurrentRank, getProgressToNextRank, Rank } from '@/utils/ranks';
import RankCard from '@/components/achievements/RankCard';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// Define interface for RankSection props
interface RankSectionProps {
  title: string;
  ranks: Rank[];
  isActive: boolean;
  currentXP: number;
  className?: string;
}

// Create a virtualized section renderer for better performance with many items
const RankSection = memo(({ title, ranks, isActive, currentXP, className = '' }: RankSectionProps) => {
  return (
    <div className={className}>
      <h2 className={`text-sm uppercase tracking-wider mb-3 text-center ${
        isActive ? 'text-cyber-blue cyber-text-glow' : 'text-gray-500'
      }`}>
        {title}
      </h2>
      <div className="space-y-4">
        {ranks.map((rank) => (
          <RankCard 
            key={rank.id}
            rank={rank}
            isUnlocked={currentXP >= rank.xpRequired}
            isActive={isActive && currentXP >= rank.xpRequired && (
              !ranks.find(r => r.xpRequired > rank.xpRequired && currentXP >= r.xpRequired)
            )}
            progress={isActive ? 
              Math.min(100, ((currentXP - rank.xpRequired) / (ranks.find(r => r.xpRequired > rank.xpRequired)?.xpRequired - rank.xpRequired || 1)) * 100) : 
              (currentXP >= rank.xpRequired ? 100 : 0)
            }
          />
        ))}
      </div>
    </div>
  );
});

RankSection.displayName = 'RankSection';

// Easing function for smooth scrolling
const easeInOutQuad = (t: number, b: number, c: number, d: number): number => {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t + b;
  t--;
  return -c / 2 * (t * (t - 2) - 1) + b;
};

// Memoize the component to prevent unnecessary re-renders
const Achievements = memo(() => {
  const { stats } = useGame();
  const currentRankRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Use useMemo for expensive calculations
  const currentRank = useMemo(() => getCurrentRank(stats.xp), [stats.xp]);
  const { percentage } = useMemo(() => getProgressToNextRank(stats.xp), [stats.xp]);
  
  // Sort and categorize ranks using useMemo to avoid recalculation
  const { higherRanks, lowerRanks } = useMemo(() => {
    // Sort ranks from highest to lowest
    const allRanks = [...ranks].sort((a, b) => b.xpRequired - a.xpRequired);
    
    // Categorize ranks based on current position
    const higher = allRanks.filter(rank => rank.xpRequired > stats.xp);
    const lower = allRanks.filter(rank => 
      rank.xpRequired < currentRank.xpRequired
    ).sort((a, b) => b.xpRequired - a.xpRequired); // Keep highest XP first
    
    return { higherRanks: higher, lowerRanks: lower };
  }, [stats.xp, currentRank.xpRequired]);
  
  // Smooth scroll function to prevent blocking main thread
  const smoothScroll = useCallback((element: HTMLDivElement, to: number, duration: number) => {
    const start = element.scrollTop;
    const change = to - start;
    const increment = 20;
    let currentTime = 0;

    const animateScroll = () => {
      currentTime += increment;
      const val = easeInOutQuad(currentTime, start, change, duration);
      element.scrollTop = val;
      if (currentTime < duration) {
        window.requestAnimationFrame(animateScroll);
      }
    };

    window.requestAnimationFrame(animateScroll);
  }, []);
  
  // Scroll to current rank only once on initial render
  useEffect(() => {
    if (currentRankRef.current && scrollContainerRef.current) {
      // Directly manipulate scroll position instead of using scrollIntoView
      // for better performance
      const container = scrollContainerRef.current;
      const element = currentRankRef.current;
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scrollTo = element.offsetTop - container.offsetTop - 
                       (containerRect.height / 2) + (elementRect.height / 2);
                       
      // Use setTimeout to ensure this happens after render
      setTimeout(() => {
        smoothScroll(container, scrollTo, 400);
      }, 300);
    }
  }, [smoothScroll]);
  
  // Memoize scroll functions
  const scrollToTop = useCallback(() => {
    if (higherRanks.length > 0 && scrollContainerRef.current) {
      smoothScroll(scrollContainerRef.current, 0, 400);
    } else {
      toast.info("You've already reached the highest rank!");
    }
  }, [higherRanks.length, smoothScroll]);
  
  const scrollToCurrentRank = useCallback(() => {
    if (currentRankRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = currentRankRef.current;
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scrollTo = element.offsetTop - container.offsetTop - 
                       (containerRect.height / 2) + (elementRect.height / 2);
                       
      smoothScroll(container, scrollTo, 400);
    }
  }, [smoothScroll]);
  
  const scrollToBottom = useCallback(() => {
    if (lowerRanks.length > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      smoothScroll(container, container.scrollHeight, 400);
    } else {
      toast.info("You don't have any lower ranks to view!");
    }
  }, [lowerRanks.length, smoothScroll]);

  return (
    <PageTransition>
      <div className="min-h-screen pb-24">
        <div className="max-w-md mx-auto relative">
          <div className="sticky top-0 z-10 bg-black pt-6 pb-2 px-4">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Hunter Ranks
            </h1>
            <p className="text-gray-400 mb-6">Level up and unlock new abilities</p>
            
            {/* Navigation controls */}
            <div className="flex justify-center space-x-6 mb-2">
              <button 
                onClick={scrollToTop}
                className="flex flex-col items-center text-gray-400 hover:text-cyber-blue transition-colors"
              >
                <ChevronUp className="w-6 h-6" />
                <span className="text-xs">Higher Ranks</span>
              </button>
              
              <button 
                onClick={scrollToCurrentRank}
                className="flex flex-col items-center text-cyber-blue cyber-text-glow"
              >
                <div className="w-3 h-3 bg-cyber-blue rounded-full mb-1"></div>
                <span className="text-xs">Current Rank</span>
              </button>
              
              <button 
                onClick={scrollToBottom}
                className="flex flex-col items-center text-gray-400 hover:text-cyber-blue transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
                <span className="text-xs">Lower Ranks</span>
              </button>
            </div>
          </div>
          
          {/* Scroll container with hardware acceleration */}
          <div 
            ref={scrollContainerRef}
            className="px-4 overflow-y-auto max-h-[calc(100vh-220px)]"
            style={{ 
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'auto' // Use our custom smooth scroll instead
            }}
          >
            {/* Higher locked ranks section (above current) */}
            {higherRanks.length > 0 && (
              <RankSection 
                title="Higher Ranks"
                ranks={higherRanks}
                isActive={false}
                currentXP={stats.xp}
                className="mb-10"
              />
            )}
            
            {/* Current rank section - centered and highlighted */}
            <div ref={currentRankRef} className="mb-10">
              <RankSection 
                title="Current Rank"
                ranks={[currentRank]}
                isActive={true}
                currentXP={stats.xp}
              />
            </div>
            
            {/* Lower ranks section (below current) */}
            {lowerRanks.length > 0 && (
              <RankSection 
                title="Lower Ranks"
                ranks={lowerRanks}
                isActive={false}
                currentXP={stats.xp}
              />
            )}
          </div>
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
});

Achievements.displayName = 'Achievements';

export default Achievements;
