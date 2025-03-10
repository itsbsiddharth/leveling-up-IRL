
import React from 'react';
import { Rank } from '@/utils/ranks';
import { useGame } from '@/context/GameContext';
import { Lock, CheckCircle } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';

interface RankCardProps {
  rank: Rank;
  isUnlocked: boolean;
  isActive: boolean;
  progress?: number;
}

const RankCard = ({ rank, isUnlocked, isActive, progress = 0 }: RankCardProps) => {
  return (
    <div 
      className={`cyber-panel p-4 rounded-lg transition-all duration-300 ${
        isActive 
          ? 'border-2 scale-105 animate-pulse-glow' 
          : isUnlocked 
            ? 'opacity-90' 
            : 'opacity-50'
      } ${
        rank.color === 'blue' 
          ? 'border-cyber-blue/70' 
          : rank.color === 'purple' 
            ? 'border-cyber-purple/70' 
            : 'border-cyber-red/70'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-lg font-semibold ${
          rank.color === 'blue' 
            ? 'text-cyber-blue cyber-text-glow' 
            : rank.color === 'purple' 
              ? 'text-cyber-purple cyber-purple-glow' 
              : 'text-cyber-red cyber-red-glow'
        }`}>
          {rank.title}
        </h3>
        
        {isUnlocked ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <Lock className="w-5 h-5 text-gray-500" />
        )}
      </div>
      
      <p className="text-sm text-gray-300 mb-3">
        {rank.description}
      </p>
      
      {isActive && progress < 100 && (
        <div className="mb-3">
          <ProgressBar 
            value={progress} 
            max={100} 
            color={rank.color} 
            size="sm" 
          />
        </div>
      )}
      
      <div className="text-xs text-gray-400 mb-2">Benefits:</div>
      <ul className="text-xs text-gray-300 space-y-1 pl-4">
        {rank.benefits.map((benefit, index) => (
          <li key={index} className="list-disc">
            {benefit}
          </li>
        ))}
      </ul>
      
      <div className="mt-3 text-xs text-gray-400">
        XP Required: <span className="text-white">{rank.xpRequired.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default RankCard;
