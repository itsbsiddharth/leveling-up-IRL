import { useEffect, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import confetti from 'canvas-confetti';

interface FuturisticPopupProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  content?: ReactNode;
  onClose: () => void;
  autoCloseDelay?: number;
  soundPath?: string;
  backgroundImage?: string;
  glowColor?: 'blue' | 'red' | 'green' | 'purple';
  enableConfetti?: boolean;
}

export function FuturisticPopup({
  visible,
  title,
  subtitle,
  description,
  content,
  onClose,
  autoCloseDelay = 3000, // Default to 3 seconds
  soundPath,
  backgroundImage,
  glowColor = 'blue',
  enableConfetti = false
}: FuturisticPopupProps) {
  
  // Create a ref to track if we've played the sound for this visibility change
  const soundPlayedRef = useRef(false);
  const confettiRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Play sound effect when popup becomes visible
  useEffect(() => {
    if (visible && soundPath && !soundPlayedRef.current) {
      try {
        console.log(`Attempting to play sound: ${soundPath}`);
        const sound = new Howl({
          src: [soundPath],
          volume: 0.5,
          onload: () => console.log(`Sound loaded successfully: ${soundPath}`),
          onloaderror: (id, error) => console.error(`Error loading sound: ${soundPath}`, error),
          onplayerror: (id, error) => console.error(`Error playing sound: ${soundPath}`, error)
        });
        sound.play();
        soundPlayedRef.current = true;
      } catch (error) {
        console.error('Error initializing or playing sound:', error);
      }
    }
    
    // Reset the sound played flag when popup is closed
    if (!visible) {
      soundPlayedRef.current = false;
      confettiRef.current = false;
    }
  }, [visible, soundPath]);
  
  // Handle confetti effect
  useEffect(() => {
    if (visible && enableConfetti && !confettiRef.current && containerRef.current) {
      try {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        
        // Fire confetti from the center of the popup
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x, y: y * 0.6 },
          colors: ['#00FFFF', '#7F00FF', '#FF0055', '#FFD700'],
          zIndex: 1000
        });
        
        // Add another burst after a slight delay
        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 100,
            origin: { x, y: y * 0.6 },
            colors: ['#00FFFF', '#7F00FF', '#FF0055', '#FFD700'],
            zIndex: 1000
          });
        }, 500);
        
        confettiRef.current = true;
      } catch (error) {
        console.error('Error triggering confetti:', error);
      }
    }
  }, [visible, enableConfetti]);
  
  // Auto-close functionality
  useEffect(() => {
    if (visible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseDelay, onClose]);
  
  // Select glow color based on prop
  const getGlowColor = () => {
    switch (glowColor) {
      case 'red':
        return {
          border: 'border-red-500',
          shadow: 'shadow-[0_0_20px_#FF0000,0_0_40px_rgba(255,0,0,0.3)]',
          textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #FF0000, 0 0 20px #FF0000'
        };
      case 'green':
        return {
          border: 'border-green-500',
          shadow: 'shadow-[0_0_20px_#00FF00,0_0_40px_rgba(0,255,0,0.3)]',
          textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00FF00, 0 0 20px #00FF00'
        };
      case 'purple':
        return {
          border: 'border-purple-500',
          shadow: 'shadow-[0_0_20px_#7F00FF,0_0_40px_rgba(127,0,255,0.3)]',
          textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #7F00FF, 0 0 20px #7F00FF'
        };
      case 'blue':
      default:
        return {
          border: 'border-cyan-500',
          shadow: 'shadow-[0_0_20px_#00FFFF,0_0_40px_rgba(0,255,255,0.3)]',
          textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00FFFF, 0 0 20px #00FFFF'
        };
    }
  };
  
  const glowStyles = getGlowColor();
  
  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          {/* Background overlay with blur */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Popup container */}
          <motion.div
            ref={containerRef}
            className="max-w-md w-full px-4 relative z-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 25
              } 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: 20,
              transition: { duration: 0.2 } 
            }}
          >
            {/* Futuristic popup with neon border */}
            <div className={`relative border-2 ${glowStyles.border} ${glowStyles.shadow} rounded-md overflow-hidden bg-cyber-dark/90`}>
              {/* Background animation effect */}
              {backgroundImage && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30" 
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                />
              )}
              
              {/* Inner glow border */}
              <div className="absolute inset-[3px] border border-cyan-400/50 shadow-[inset_0_0_10px_#00FFFF] rounded-sm" />
              
              {/* Content container */}
              <div className="relative p-6 z-10">
                {/* Title with neon glow */}
                <h2 
                  className="text-2xl md:text-3xl font-bold text-white text-center mb-2"
                  style={{ textShadow: glowStyles.textShadow }}
                >
                  {title}
                </h2>
                
                {/* Subtitle with flicker animation */}
                {subtitle && (
                  <p className="text-lg text-cyan-300 text-center mb-4 animate-flicker">
                    {subtitle}
                  </p>
                )}
                
                {/* Description */}
                {description && (
                  <p className="text-gray-300 text-center mb-4">{description}</p>
                )}
                
                {/* Main content */}
                {content}
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-cyber-blue/20 border border-cyber-blue rounded-md hover:bg-cyber-blue/30 text-cyber-blue transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
