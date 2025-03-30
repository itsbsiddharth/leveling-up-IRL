import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  duration?: number; // in milliseconds
  onClose?: () => void;
  color?: string;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  duration = 3000,
  onClose,
  color = '#05d9e8'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 100);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 min-w-[300px] max-w-sm">
      <div 
        className="rounded-md shadow-lg p-4 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid ${color}`,
          boxShadow: `0 0 15px ${color}60`,
        }}
      >
        <div className="flex items-start">
          <div 
            className="flex-shrink-0 mr-3 mt-0.5"
            style={{ color }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1">
            <h3 
              className="text-sm font-medium"
              style={{ color }}
            >
              Success
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              {message}
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 bg-gray-700 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full transition-all duration-100 ease-linear"
            style={{ 
              width: `${progress}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`
            }}
          />
        </div>

        {/* Cyberpunk corner accents */}
        <div className="absolute top-0 left-0 w-3 h-px" style={{ backgroundColor: color }}></div>
        <div className="absolute top-0 left-0 w-px h-3" style={{ backgroundColor: color }}></div>
        <div className="absolute top-0 right-0 w-3 h-px" style={{ backgroundColor: color }}></div>
        <div className="absolute top-0 right-0 w-px h-3" style={{ backgroundColor: color }}></div>
        <div className="absolute bottom-0 left-0 w-3 h-px" style={{ backgroundColor: color }}></div>
        <div className="absolute bottom-0 left-0 w-px h-3" style={{ backgroundColor: color }}></div>
        <div className="absolute bottom-0 right-0 w-3 h-px" style={{ backgroundColor: color }}></div>
        <div className="absolute bottom-0 right-0 w-px h-3" style={{ backgroundColor: color }}></div>
      </div>
    </div>
  );
};

export default SuccessNotification; 