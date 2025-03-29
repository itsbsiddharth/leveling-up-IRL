import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Howl } from 'howler';

// Define the tracks with their paths and colors
export const TRACKS = [
  { 
    id: 'dark-aria', 
    name: 'DARK ARIA LV2', 
    path: '/music/1-DARK-ARIA-LV2.mp3',
    color: '#7122e0'
  },
  { 
    id: 'snake-ost', 
    name: 'Snake OST Cover', 
    path: '/music/2-Snake-OST-Cover.mp3',
    color: '#4361ee'
  },
  { 
    id: 'solo-leveling-reawaker', 
    name: 'Solo Leveling - ReawakeR', 
    path: '/music/3 Solo-Leveling-Opening-ReawakeR.mp3',
    color: '#ff3c6f'
  },
  { 
    id: 'solo-leveling-level', 
    name: 'Solo Leveling - Level', 
    path: '/music/4-Solo-Leveling-Opening-Level.mp3',
    color: '#00b4d8'
  },
  { 
    id: 'solo-leveling-ending', 
    name: 'Solo Leveling S2 Ending', 
    path: '/music/5-Solo-Leveling-S2-Ending.mp3',
    color: '#e63946'
  }
];

// User track type
export interface UserTrack {
  id: string;
  name: string;
  path: string; 
  color: string;
}

// Player position and size state
export interface PlayerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Define the context type
interface MusicContextType {
  isPlaying: boolean;
  currentTrackIndex: number;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  isLoopMode: boolean;
  userTracks: UserTrack[];
  isMinimized: boolean;
  playerPosition: PlayerPosition;
  navBarClicked: boolean;
  audioData: number[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTrackIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  seek: (position: number) => void;
  addUserTrack: (track: UserTrack) => void;
  removeUserTrack: (id: string) => void;
  toggleMinimized: () => void;
  setPlayerPosition: (position: PlayerPosition) => void;
  setNavBarClicked: (clicked: boolean) => void;
  getCurrentTrack: () => (typeof TRACKS[0] | UserTrack);
}

// Create the context with default values
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Sound instance
let sound: Howl | null = null;

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoopMode, setIsLoopMode] = useState(false);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [navBarClicked, setNavBarClicked] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(Array(32).fill(0.05));
  
  // Default position in bottom right, but not overlapping the nav
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({
    x: window.innerWidth - 320 - 16,  // 16px from right edge
    y: window.innerHeight - 400 - 80, // 80px above navbar
    width: 320,
    height: 400
  });
  
  const progressIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get effective volume
  const effectiveVolume = isMuted ? 0 : volume / 100;
  
  // Get current track
  const getCurrentTrack = () => {
    const allTracks = [...TRACKS, ...userTracks];
    return allTracks[currentTrackIndex % allTracks.length];
  };
  
  // Initialize or update audio
  useEffect(() => {
    const currentTrack = getCurrentTrack();
    
    // Clean up previous sound
    if (sound) {
      sound.stop();
      sound.unload();
    }
    
    // Create new sound instance
    sound = new Howl({
      src: [currentTrack.path],
      html5: true,
      volume: effectiveVolume,
      loop: isLoopMode,
      onload: () => {
        if (sound) {
          setDuration(sound.duration());
        }
      },
      onplay: () => {
        setIsPlaying(true);
        
        // Start progress timer
        if (progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
        }
        
        progressIntervalRef.current = window.setInterval(() => {
          if (sound) {
            setProgress(sound.seek());
          }
        }, 500);
        
        // Start visualization 
        startVisualization();
      },
      onpause: () => {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Stop visualization
        stopVisualization();
      },
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
        if (progressIntervalRef.current) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Stop visualization
        stopVisualization();
      },
      onend: () => {
        if (!isLoopMode) {
          next();
        }
      }
    });
    
    // Cleanup on component unmount
    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
      }
      
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      
      stopVisualization();
    };
  }, [currentTrackIndex, isLoopMode, userTracks]);
  
  // Update volume when it changes
  useEffect(() => {
    if (sound) {
      sound.volume(effectiveVolume);
    }
  }, [effectiveVolume]);
  
  // Generate audio visualization data
  const startVisualization = () => {
    if (animationFrameRef.current) return;
    
    const generateData = () => {
      if (!isPlaying) {
        setAudioData(prev => prev.map(() => 0.05));
        return;
      }
      
      // Create realistic-looking audio data
      setAudioData(prev => {
        return prev.map((val) => {
          const target = isPlaying ? Math.random() * 0.7 + 0.3 : 0.05;
          // Smooth transition
          return val + (target - val) * 0.3;
        });
      });
      
      animationFrameRef.current = requestAnimationFrame(generateData);
    };
    
    generateData();
  };
  
  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };
  
  // Player control functions
  const play = () => {
    if (sound && !isPlaying) {
      sound.play();
    }
  };
  
  const pause = () => {
    if (sound && isPlaying) {
      sound.pause();
    }
  };
  
  const togglePlay = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
      } else {
        sound.play();
      }
    }
  };
  
  const next = () => {
    const allTracks = [...TRACKS, ...userTracks];
    const nextIndex = (currentTrackIndex + 1) % allTracks.length;
    setCurrentTrackIndex(nextIndex);
  };
  
  const previous = () => {
    const allTracks = [...TRACKS, ...userTracks];
    const prevIndex = (currentTrackIndex - 1 + allTracks.length) % allTracks.length;
    setCurrentTrackIndex(prevIndex);
  };
  
  const setVolumeLevel = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    
    // Auto un-mute if increasing volume from 0
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleLoop = () => {
    const newLoopMode = !isLoopMode;
    setIsLoopMode(newLoopMode);
    if (sound) {
      sound.loop(newLoopMode);
    }
  };
  
  const seek = (position: number) => {
    if (sound) {
      sound.seek(position);
      setProgress(position);
    }
  };
  
  const addUserTrack = (track: UserTrack) => {
    setUserTracks(prev => [...prev, track]);
  };
  
  const removeUserTrack = (id: string) => {
    setUserTracks(prev => prev.filter(track => track.id !== id));
  };
  
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };
  
  // Auto-hide when navbar is clicked
  useEffect(() => {
    if (navBarClicked && !isMinimized) {
      setIsMinimized(true);
      
      // Reset after a short delay
      const timer = setTimeout(() => {
        setNavBarClicked(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [navBarClicked, isMinimized]);
  
  // Adjust player position on window resize to prevent overlapping
  useEffect(() => {
    const handleResize = () => {
      setPlayerPosition(prev => {
        // Make sure player stays within viewport
        const newX = Math.min(prev.x, window.innerWidth - prev.width - 16);
        const newY = Math.min(prev.y, window.innerHeight - prev.height - 80); // Keep above navbar
        
        return {
          ...prev,
          x: newX,
          y: newY
        };
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // The context value
  const contextValue: MusicContextType = {
    isPlaying,
    currentTrackIndex,
    volume,
    isMuted,
    progress,
    duration,
    isLoopMode,
    userTracks,
    isMinimized,
    playerPosition,
    navBarClicked,
    audioData,
    play,
    pause,
    togglePlay,
    setCurrentTrackIndex,
    next,
    previous,
    setVolume: setVolumeLevel,
    toggleMute,
    toggleLoop,
    seek,
    addUserTrack,
    removeUserTrack,
    toggleMinimized,
    setPlayerPosition,
    setNavBarClicked,
    getCurrentTrack
  };
  
  return (
    <MusicContext.Provider value={contextValue}>
      {children}
    </MusicContext.Provider>
  );
};

// Export the context hook
export const useMusicPlayer = (): MusicContextType => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicProvider');
  }
  return context;
}; 