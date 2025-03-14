import React, { useState, memo, useCallback } from 'react';
import { Rank } from '@/utils/ranks';
import { useGame } from '@/context/GameContext';
import { Lock, CheckCircle, ChevronDown, ChevronUp, Trophy, Heart } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import { m } from 'framer-motion';

interface RankCardProps {
  rank: Rank;
  isUnlocked: boolean;
  isActive: boolean;
  progress?: number;
}

// Memoize the component to prevent unnecessary re-renders
const RankCard = memo(({ rank, isUnlocked, isActive, progress = 0 }: RankCardProps) => {
  const [expanded, setExpanded] = useState(isActive);
  
  // Define color schemes based on rank color and status
  const getColorScheme = useCallback(() => {
    if (!isUnlocked) {
      return 'border-gray-700/50 bg-black/40'; // Locked ranks
    }
    
    switch (rank.color) {
      case 'blue': 
        return 'border-cyber-blue/70 bg-gradient-to-b from-cyber-blue/10 to-transparent';
      case 'purple': 
        return 'border-cyber-purple/70 bg-gradient-to-b from-cyber-purple/10 to-transparent';
      case 'red': 
        return 'border-cyber-red/70 bg-gradient-to-b from-cyber-red/10 to-transparent';
      default: 
        return 'border-cyber-blue/70';
    }
  }, [isUnlocked, rank.color]);
  
  const getTitleColor = useCallback(() => {
    if (!isUnlocked) {
      return 'text-gray-400';
    }
    
    switch (rank.color) {
      case 'blue': 
        return 'text-cyber-blue cyber-text-glow';
      case 'purple': 
        return 'text-cyber-purple cyber-purple-glow';
      case 'red': 
        return 'text-cyber-red cyber-red-glow';
      default: 
        return 'text-cyber-blue';
    }
  }, [isUnlocked, rank.color]);
  
  const getBenefitStyles = useCallback(() => {
    if (!isUnlocked) {
      return 'blur-sm text-gray-600';
    }
    return 'text-gray-300';
  }, [isUnlocked]);

  // Check if recovery benefits are available
  const hasRecoveryBenefits = useCallback((benefits: string[]) => {
    return benefits.some(benefit => 
      benefit.toLowerCase().includes('recovery') || 
      benefit.toLowerCase().includes('hp') || 
      benefit.toLowerCase().includes('health')
    );
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // Simplified motion variants
  const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' }
  };

  return (
    <div 
      className={`cyber-panel border-2 rounded-lg transition-colors ${
        isActive 
          ? 'shadow-lg' 
          : isUnlocked 
            ? 'opacity-90 hover:opacity-100' 
            : 'opacity-60 hover:opacity-70'
      } ${getColorScheme()}`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              {isUnlocked && !isActive && (
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              )}
              {isActive && (
                <Trophy className="w-4 h-4 text-yellow-400 mr-2" />
              )}
              <h3 className={`text-lg font-semibold ${getTitleColor()}`}>
                {rank.title}
              </h3>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {isUnlocked ? rank.description : `Requires ${rank.xpRequired.toLocaleString()} XP to unlock`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasRecoveryBenefits(rank.benefits) && isUnlocked && (
              <Heart className="w-4 h-4 text-green-400 mr-1" />
            )}
            {!isUnlocked && (
              <Lock className="w-5 h-5 text-gray-500" />
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {isActive && progress < 100 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to next rank</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar 
              value={progress} 
              max={100} 
              color={rank.color} 
              size="sm" 
            />
          </div>
        )}
      </div>
      
      {expanded && (
        <m.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          className="px-4 pb-4"
        >
          <div className="h-px bg-gray-800 mb-3" />
          
          <div className="text-xs text-gray-400 mb-2">Benefits:</div>
          <ul className={`text-xs space-y-1 pl-4 ${getBenefitStyles()}`}>
            {rank.benefits.map((benefit, index) => {
              const isRecoveryBenefit = benefit.toLowerCase().includes('recovery') || 
                                        benefit.toLowerCase().includes('hp') ||
                                        benefit.toLowerCase().includes('health');
              
              return (
                <li key={index} className={`list-disc ${isRecoveryBenefit && isUnlocked ? 'text-green-400' : ''}`}>
                  {benefit}
                  {isRecoveryBenefit && isUnlocked && (
                    <Heart className="inline-block w-3 h-3 ml-1 text-green-400" />
                  )}
                </li>
              );
            })}
          </ul>
          
          <div className="mt-3 text-xs text-gray-500 flex justify-between">
            <span>XP Required: <span className="text-gray-300">{rank.xpRequired.toLocaleString()}</span></span>
            {isUnlocked && !isActive && (
              <span className="text-green-500 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Unlocked
              </span>
            )}
          </div>
        </m.div>
      )}
    </div>
  );
});

RankCard.displayName = 'RankCard';

export default RankCard;
