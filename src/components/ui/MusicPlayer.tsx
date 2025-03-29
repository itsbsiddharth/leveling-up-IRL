import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Howl } from 'howler';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  RefreshCw, ChevronUp, ChevronDown, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the tracks with their paths and colors
const TRACKS = [
  { 
    id: 'dark-aria', 
    name: 'DARK ARIA LV2', 
    path: '/music/1-DARK-ARIA-LV2.mp3',
    color: '#ff2a6d'
  },
  { 
    id: 'snake-ost', 
    name: 'Snake OST Cover', 
    path: '/music/2-Snake-OST-Cover.mp3',
    color: '#05d9e8'
  },
  { 
    id: 'solo-leveling-reawaker', 
    name: 'Solo Leveling - ReawakeR', 
    path: '/music/3 Solo-Leveling-Opening-ReawakeR.mp3',
    color: '#7d5fff'
  },
  { 
    id: 'solo-leveling-level', 
    name: 'Solo Leveling - Level', 
    path: '/music/4-Solo-Leveling-Opening-Level.mp3',
    color: '#ff7e67'
  },
  { 
    id: 'solo-leveling-ending', 
    name: 'Solo Leveling S2 Ending', 
    path: '/music/5-Solo-Leveling-S2-Ending.mp3',
    color: '#00ff9f'
  }
];

// Global audio instance using Howler.js
let sound: Howl | null = null;

// Optimized visualizer component
const AudioVisualizer = memo(({ 
  isPlaying, 
  volume, 
  color = '#05d9e8',
  height = 50
}: { 
  isPlaying: boolean, 
  volume: number, 
  color?: string,
  height?: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  
  // Set up canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ensure canvas is properly sized
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Function to draw the visualizer
    const drawVisualizer = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only animate if playing
      if (isPlaying) {
        const barCount = 32;
        const barWidth = (canvas.offsetWidth / barCount) * 0.8;
        const barSpacing = (canvas.offsetWidth / barCount) * 0.2;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.offsetWidth, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, shiftColor(color, 40));
        
        // Draw bars
        for (let i = 0; i < barCount; i++) {
          // Generate random height for demo, in real app would use audio data
          let randomHeight = Math.random() * (height * 0.8) * (volume / 100);
          
          // Add a pattern to make it look like it's responding to music
          const patternValue = Math.sin((Date.now() / 200) + (i * 0.5)) * 0.5 + 0.5;
          randomHeight *= patternValue;
          
          // Edge bars should be smaller
          const edgeFactor = 1 - Math.pow(Math.abs(i - barCount/2) / (barCount/2), 2) * 0.5;
          randomHeight *= edgeFactor;
          
          const x = i * (barWidth + barSpacing);
          const y = height - randomHeight;
          
          // Draw bar
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, randomHeight);
          
          // Add glow effect
          ctx.shadowColor = color;
          ctx.shadowBlur = 5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Add scanline effect
        const scanLineY = (height * (Math.sin(Date.now() / 1000) * 0.5 + 0.5));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, scanLineY, canvas.offsetWidth, 1);
      } else {
        // Draw idle state
        const centerX = canvas.offsetWidth / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 30, height / 2);
        ctx.lineTo(centerX + 30, height / 2);
        ctx.stroke();
      }
      
      // Request next frame
      rafRef.current = requestAnimationFrame(drawVisualizer);
    };
    
    // Start animation
    drawVisualizer();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, volume, color, height]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full rounded-md"
      style={{ height: `${height}px` }}
    />
  );
});

AudioVisualizer.displayName = 'AudioVisualizer';

// Helper function to shift color hue
function shiftColor(hex: string, degree: number): string {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  
  // Convert RGB to HSL
  let max = Math.max(r, g, b) / 255;
  let min = Math.min(r, g, b) / 255;
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max * 255) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  
  // Shift hue
  h = (h + degree) % 360;
  if (h < 0) h += 360;
  
  // Convert back to HSL
  h /= 360;
  
  // Convert HSL to RGB
  let r1, g1, b1;
  
  if (s === 0) {
    r1 = g1 = b1 = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1/3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1/3);
  }
  
  r = Math.round(r1 * 255);
  g = Math.round(g1 * 255);
  b = Math.round(b1 * 255);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Custom Button component with cyberpunk styling
const CyberButton = ({
  onClick,
  className,
  color = '#05d9e8',
  children,
  disabled = false
}: {
  onClick: () => void,
  className?: string,
  color?: string,
  children: React.ReactNode,
  disabled?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-2 rounded-md transition-all duration-150 hover:brightness-125 active:brightness-75',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: `1px solid ${color}`,
        boxShadow: `0 0 5px ${color}`,
        color
      }}
    >
      {children}
    </button>
  );
};

// Volume slider component
const VolumeSlider = ({
  volume,
  setVolume,
  color
}: {
  volume: number,
  setVolume: (v: number) => void,
  color: string
}) => {
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={volume}
      onChange={(e) => setVolume(parseInt(e.target.value))}
      className="w-full h-1 appearance-none rounded-full"
      style={{
        background: `linear-gradient(to right, ${color} 0%, ${color} ${volume}%, rgba(255, 255, 255, 0.1) ${volume}%, rgba(255, 255, 255, 0.1) 100%)`,
        cursor: 'pointer'
      }}
    />
  );
};

// Dropdown menu for track selection
const TrackSelector = ({
  tracks,
  currentTrackIndex,
  onSelect,
  color
}: {
  tracks: typeof TRACKS,
  currentTrackIndex: number,
  onSelect: (index: number) => void,
  color: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <CyberButton
        onClick={() => setIsOpen(!isOpen)}
        color={color}
        className="w-full flex items-center justify-between"
      >
        <span className="truncate max-w-[150px]">{tracks[currentTrackIndex].name}</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </CyberButton>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md overflow-hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: `1px solid ${color}`,
            boxShadow: `0 0 10px ${color}`
          }}
        >
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={cn(
                'px-3 py-2 cursor-pointer truncate hover:brightness-125 transition-all',
                index === currentTrackIndex && 'bg-black/50'
              )}
              style={{ color: track.color }}
              onClick={() => {
                onSelect(index);
                setIsOpen(false);
              }}
            >
              {track.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Progress bar component
const ProgressBar = ({
  progress,
  duration,
  color,
  onChange
}: {
  progress: number,
  duration: number,
  color: string,
  onChange: (newPosition: number) => void
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.max(0, Math.min(1, clickPosition)) * duration;
    
    onChange(newPosition);
  }, [duration, onChange]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  
  return (
    <div className="w-full space-y-1">
      <div
        ref={progressBarRef}
        className="h-1 w-full rounded-full cursor-pointer"
        style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
        }}
        onClick={handleClick}
      >
        <div
          className="h-full rounded-full relative"
          style={{ 
            width: `${progressPercent}%`,
            background: color,
            boxShadow: `0 0 5px ${color}`
          }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color }}>
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Main MusicPlayer component
interface MusicPlayerProps {
  minimized?: boolean;
  onToggleMinimize?: () => void;
  fixedPosition?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  minimized = false,
  onToggleMinimize,
  fixedPosition = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoopMode, setIsLoopMode] = useState(false);
  const progressTimerRef = useRef<number | null>(null);
  
  const currentTrack = TRACKS[currentTrackIndex];
  const effectiveVolume = isMuted ? 0 : volume / 100;
  
  // Initialize Howler and load track
  useEffect(() => {
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
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
        }
        
        progressTimerRef.current = window.setInterval(() => {
          if (sound) {
            setProgress(sound.seek());
          }
        }, 500);
      },
      onpause: () => {
        setIsPlaying(false);
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      },
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      },
      onend: () => {
        if (!isLoopMode) {
          playNextTrack();
        }
      }
    });
    
    // Clean up on component unmount
    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
      }
      
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [currentTrackIndex, isLoopMode]);
  
  // Update volume when it changes
  useEffect(() => {
    if (sound) {
      sound.volume(effectiveVolume);
    }
  }, [effectiveVolume]);
  
  // Play/pause function
  const togglePlayPause = useCallback(() => {
    if (!sound) return;
    
    if (isPlaying) {
      sound.pause();
    } else {
      sound.play();
    }
  }, [isPlaying]);
  
  // Play next track
  const playNextTrack = useCallback(() => {
    const newIndex = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(newIndex);
  }, [currentTrackIndex]);
  
  // Play previous track
  const playPrevTrack = useCallback(() => {
    const newIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(newIndex);
  }, [currentTrackIndex]);
  
  // Toggle mute function
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  // Toggle loop mode
  const toggleLoopMode = useCallback(() => {
    const newLoopMode = !isLoopMode;
    setIsLoopMode(newLoopMode);
    if (sound) {
      sound.loop(newLoopMode);
    }
  }, [isLoopMode]);
  
  // Handle progress bar change
  const handleProgressChange = useCallback((newPosition: number) => {
    if (sound) {
      sound.seek(newPosition);
      setProgress(newPosition);
    }
  }, []);
  
  // Select track
  const selectTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
  }, []);
  
  // If minimized, only show a small floating player
  if (minimized) {
    return (
      <div
        className={cn(
          "cyber-panel rounded-full p-2 flex items-center justify-center w-12 h-12 cursor-pointer shadow-lg",
          fixedPosition && "fixed right-4 bottom-4 z-50"
        )}
        onClick={onToggleMinimize}
        style={{
          border: `1px solid ${currentTrack.color}`,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          boxShadow: `0 0 10px ${currentTrack.color}`
        }}
      >
        <Music 
          size={24} 
          style={{ color: currentTrack.color }}
          className="animate-pulse"
        />
      </div>
    );
  }
  
  // Full music player UI
  return (
    <div
      className={cn(
        "cyber-panel rounded-md p-3 w-80 bg-black/90 backdrop-blur-md",
        fixedPosition && "fixed right-4 bottom-4 z-50"
      )}
      style={{
        border: `1px solid ${currentTrack.color}`,
        boxShadow: `0 0 15px ${currentTrack.color}`
      }}
    >
      {/* Header with track selector and minimize button */}
      <div className="flex items-center justify-between mb-3">
        <TrackSelector
          tracks={TRACKS}
          currentTrackIndex={currentTrackIndex}
          onSelect={selectTrack}
          color={currentTrack.color}
        />
        
        {onToggleMinimize && (
          <CyberButton
            onClick={onToggleMinimize}
            color={currentTrack.color}
          >
            <ChevronDown size={18} />
          </CyberButton>
        )}
      </div>
      
      {/* Visualizer */}
      <div className="mb-3">
        <AudioVisualizer
          isPlaying={isPlaying}
          volume={volume}
          color={currentTrack.color}
        />
      </div>
      
      {/* Progress bar */}
      <div className="mb-3">
        <ProgressBar
          progress={progress}
          duration={duration}
          color={currentTrack.color}
          onChange={handleProgressChange}
        />
      </div>
      
      {/* Playback controls */}
      <div className="flex items-center justify-between mb-3">
        <CyberButton
          onClick={playPrevTrack}
          color={currentTrack.color}
        >
          <SkipBack size={18} />
        </CyberButton>
        
        <CyberButton
          onClick={togglePlayPause}
          color={currentTrack.color}
          className="w-12 h-12 flex items-center justify-center"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </CyberButton>
        
        <CyberButton
          onClick={playNextTrack}
          color={currentTrack.color}
        >
          <SkipForward size={18} />
        </CyberButton>
        
        <CyberButton
          onClick={toggleLoopMode}
          color={currentTrack.color}
          className={cn(isLoopMode && 'bg-black/50')}
        >
          <RefreshCw size={18} />
        </CyberButton>
      </div>
      
      {/* Volume control */}
      <div className="flex items-center space-x-2">
        <CyberButton
          onClick={toggleMute}
          color={currentTrack.color}
        >
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </CyberButton>
        
        <VolumeSlider
          volume={volume}
          setVolume={setVolume}
          color={currentTrack.color}
        />
      </div>
    </div>
  );
};

export default MusicPlayer;