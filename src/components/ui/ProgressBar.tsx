
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: 'blue' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ProgressBar = ({
  value,
  max,
  color = 'blue',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  
  const getHeight = () => {
    switch(size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-6';
      default: return 'h-4';
    }
  };
  
  const getColor = () => {
    switch(color) {
      case 'purple': return 'from-cyber-purple/40 to-cyber-purple';
      case 'red': return 'from-cyber-red/40 to-cyber-red';
      default: return 'from-cyber-blue/40 to-cyber-blue';
    }
  };
  
  const getShadow = () => {
    switch(color) {
      case 'purple': return 'shadow-[0_0_10px_rgba(127,0,255,0.5)]';
      case 'red': return 'shadow-[0_0_10px_rgba(255,49,49,0.5)]';
      default: return 'shadow-[0_0_10px_rgba(0,255,255,0.5)]';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full bg-black/50 rounded-full border border-gray-700", getHeight())}>
        <div 
          className={cn(
            "rounded-full flex items-center justify-end px-2",
            getHeight(),
            `bg-gradient-to-r ${getColor()}`,
            getShadow()
          )}
          style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
        >
          {showLabel && size !== 'sm' && (
            <span className={cn("text-xs font-semibold", size === 'lg' ? 'text-sm' : 'text-xs')}>
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
