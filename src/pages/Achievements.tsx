import React, { useEffect, useRef, memo, useCallback, useMemo, useState } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { ranks, getCurrentRank, getProgressToNextRank, Rank } from '@/utils/ranks';
import RankCard from '@/components/achievements/RankCard';
import { ChevronUp, ChevronDown, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import { getGlobalLeaderboard, getCurrentUserRanking } from '@/firebase/leaderboardService';
import { LeaderboardEntry } from '@/firebase/schema';

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
  const { currentUser } = useAuth();
  const currentRankRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Simplified leaderboard state - only global leaderboard now
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | undefined>(undefined);
  const [userRanking, setUserRanking] = useState<{ rank: number, totalUsers: number } | null>(null);
  
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
  
  // Scroll to current rank on initial render
  useEffect(() => {
    if (currentRankRef.current && scrollContainerRef.current) {
      // Wait for all elements to be properly rendered and sized
      setTimeout(() => {
        const container = scrollContainerRef.current!;
        const element = currentRankRef.current!;
        
        // Calculate the center position that puts the current rank in the middle of the screen
        const containerHeight = container.clientHeight;
        const elementRect = element.getBoundingClientRect();
        
        // Calculate exact scroll position to center the element with a small offset to prevent cutoff at any zoom level
        const scrollTo = Math.max(0, element.offsetTop - (containerHeight / 2) + (elementRect.height / 2) - 20);
        
        // Use smooth scrolling for better UX
        smoothScroll(container, scrollTo, 500);
      }, 400); // Increased timeout further to ensure all elements are rendered
    }
  }, [smoothScroll]);
  
  // Simplified fetch leaderboard function - only fetches global leaderboard
  useEffect(() => {
    if (showLeaderboard) {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        setLeaderboardEntries([]); // Reset entries to avoid showing stale data
        setLeaderboardError(undefined); // Reset any previous errors
        
        try {
          // Check if user is logged in before fetching data
          if (!currentUser) {
            console.log('User not logged in, skipping leaderboard fetch');
            setIsLoadingLeaderboard(false);
            return;
          }
          
          console.log('Fetching leaderboard data for user:', currentUser.id);
          
          // Only fetch global leaderboard data
          try {
            const leaderboardData = await getGlobalLeaderboard(15);
            console.log('Global leaderboard fetched:', leaderboardData.length, 'entries');
            
            // Check if current user is in the results
            const currentUserInLeaderboard = leaderboardData.some(entry => entry.uid === currentUser.id);
            console.log('Current user in leaderboard results:', currentUserInLeaderboard);
            
            if (!currentUserInLeaderboard) {
              console.log('Current user not found in leaderboard, they may need to sync their profile');
            }
            
            setLeaderboardEntries(leaderboardData);
          } catch (queryError) {
            console.error('Error executing leaderboard query:', queryError);
            
            // Check for missing index error
            const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
            if (errorMessage.includes('requires an index')) {
              setLeaderboardError('Leaderboard requires a Firebase index. Please try again later.');
              toast.error('Leaderboard requires a Firebase index. Please contact the developer.');
            } else if (errorMessage.includes('invalid data')) {
              setLeaderboardError('Invalid data in leaderboard query.');
              toast.error('Invalid data in leaderboard query.');
            } else {
              setLeaderboardError(`Error: ${errorMessage}`);
              toast.error(`Error loading leaderboard: ${errorMessage}`);
            }
            
            setIsLoadingLeaderboard(false);
            return;
          }
          
          // Get user's ranking if user is logged in
          if (currentUser) {
            try {
              const ranking = await getCurrentUserRanking();
              console.log('Current user ranking:', ranking);
              setUserRanking(ranking);
            } catch (rankError) {
              console.error('Error fetching user ranking:', rankError);
              // Don't show a toast for this - it's not critical
            }
          }
        } catch (error) {
          console.error('Error in leaderboard fetch process:', error);
          
          // Provide a more helpful error message based on the error type
          let errorMessage = 'Failed to load leaderboard data.';
          
          if (!currentUser) {
            errorMessage = 'Please log in to view the leaderboard.';
          } else if (error instanceof Error) {
            // Add specific error details if available
            if (error.message.includes('requires an index')) {
              errorMessage = 'Leaderboard requires a Firebase index. Please wait while this is being set up.';
            } else if (error.message.includes('invalid data')) {
              errorMessage = 'There was an issue with the leaderboard data.';
            } else {
              errorMessage += ' Error: ' + error.message;
            }
          }
          
          setLeaderboardError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      };
      
      fetchLeaderboard();
    }
  }, [showLeaderboard, currentUser]);
  
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
      
      // Get accurate measurements
      const containerHeight = container.clientHeight;
      const elementRect = element.getBoundingClientRect();
      
      // Calculate exact center position with offset to prevent cutoff
      const scrollTo = Math.max(0, element.offsetTop - (containerHeight / 2) + (elementRect.height / 2) - 20);
      
      smoothScroll(container, scrollTo, 500);
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
  
  // Get the current rank title for leaderboard
  const getCurrentRankTitle = () => {
    const rank = ranks.find(r => r.id === currentRank.id);
    return rank ? rank.title : '';
  };
  
  // Get the next rank in the sequence
  const getNextRank = () => {
    const currentIndex = ranks.findIndex(r => r.id === currentRank.id);
    if (currentIndex < ranks.length - 1) {
      return ranks[currentIndex + 1].id;
    }
    return currentRank.id;
  };
  
  // Get the previous rank in the sequence
  const getPreviousRank = () => {
    const currentIndex = ranks.findIndex(r => r.id === currentRank.id);
    if (currentIndex > 0) {
      return ranks[currentIndex - 1].id;
    }
    return currentRank.id;
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-20">
        <div className="max-w-md mx-auto relative">
          <div className="sticky top-0 z-10 bg-black pt-6 pb-2 px-4">
            <div className="flex justify-between items-center mb-1">
              <h1 className="text-3xl font-bold cyber-text-glow text-cyber-blue">
                Hunter Ranks
              </h1>
              <button 
                onClick={() => setShowLeaderboard(true)} 
                className="cyber-button-outline py-1.5 px-3 text-sm flex items-center"
              >
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Leaderboard
              </button>
            </div>
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
          
          {/* Main scroll container - optimized for all zoom levels */}
          <div 
            ref={scrollContainerRef}
            className="px-4 scrollbar-none overflow-y-auto"
            style={{ 
              height: 'min(calc(100vh - 220px), 600px)',
              maxHeight: '70vh',
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'auto'
            }}
          >
            {/* Flex container to ensure proper positioning */}
            <div className="flex flex-col min-h-full">
              {/* Top section with fixed minimum height */}
              <div className="min-h-[120px] pt-6">
                {higherRanks.length > 0 && (
                  <RankSection 
                    title="Higher Ranks"
                    ranks={higherRanks}
                    isActive={false}
                    currentXP={stats.xp}
                    className="mb-10"
                  />
                )}
              </div>
              
              {/* Current rank always visible on initial load */}
              <div ref={currentRankRef} className="mb-10 mt-4">
                <RankSection 
                  title="Current Rank"
                  ranks={[currentRank]}
                  isActive={true}
                  currentXP={stats.xp}
                />
              </div>
              
              {/* Bottom section with appropriate spacing */}
              <div className="min-h-[120px] pb-16">
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
        </div>
      </div>
      
      {/* Leaderboard Modal - Simplified to only show global leaderboard */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col cyber-panel border border-cyber-blue rounded-lg p-4">
            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold cyber-text-glow text-cyber-blue">
                  Hunter Leaderboard
                </h2>
                <button 
                  onClick={() => setShowLeaderboard(false)} 
                  className="p-1 rounded-full text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm">See how you rank among other hunters</p>
              
              {userRanking && userRanking.rank > 0 && (
                <div className="mt-2 text-sm text-cyber-blue">
                  Your Rank: <span className="font-bold">{userRanking.rank}</span> of {userRanking.totalUsers}
                </div>
              )}
            </div>
            
            {/* Leaderboard content */}
            <div className="flex-1 overflow-y-auto">
              {/* Add debug info to help identify user ID issues */}
              {currentUser && (
                <div className="text-xs text-gray-500 mb-2 px-2">
                  Debug: User ID = {currentUser.id}
                </div>
              )}
              
              <LeaderboardTable 
                entries={leaderboardEntries} 
                currentUserId={currentUser?.id}
                isLoading={isLoadingLeaderboard}
                error={leaderboardError}
              />
            </div>
          </div>
        </div>
      )}
      
      <Navbar />
    </PageTransition>
  );
});

Achievements.displayName = 'Achievements';

export default Achievements;
