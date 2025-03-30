import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Howl } from 'howler';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, VolumeX, Maximize2, Minimize2, 
  GripHorizontal, Music, ChevronDown, ChevronUp,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rnd } from 'react-rnd';

// Track definitions
const TRACKS = [
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

// Global audio instance
let sound: Howl | null = null;

// Optimized visualizer component
const AudioVisualizer = React.memo(({ 
  isPlaying, 
  volume, 
  color = '#05d9e8'
}: { 
  isPlaying: boolean, 
  volume: number, 
  color?: string 
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
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    
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
        gradient.addColorStop(1, color);
        
        // Draw bars
        for (let i = 0; i < barCount; i++) {
          // Generate random height for demo
          let barHeight = Math.random() * canvas.height * 0.8 * (volume / 100);
          
          // Add a pattern to make it look like it's responding to music
          const patternValue = Math.sin((Date.now() / 200) + (i * 0.5)) * 0.5 + 0.5;
          barHeight *= patternValue;
          
          const x = i * (barWidth + barSpacing);
          const y = canvas.height - barHeight;
          
          // Draw bar
          ctx.fillStyle = gradient;
          ctx.shadowBlur = 5;
          ctx.shadowColor = color;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Add scanline effect
        const scanLineY = (canvas.height * (Math.sin(Date.now() / 1000) * 0.5 + 0.5));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, scanLineY, canvas.offsetWidth, 1);
      } else {
        // Draw idle state
        const centerX = canvas.offsetWidth / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 30, canvas.height / 2);
        ctx.lineTo(centerX + 30, canvas.height / 2);
        ctx.stroke();
      }
      
      // Request next frame
      rafRef.current = requestAnimationFrame(drawVisualizer);
    };
    
    // Start animation
    drawVisualizer();
    
    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, volume, color]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-12 rounded-md"
    />
  );
});

AudioVisualizer.displayName = 'AudioVisualizer';

// Track Selection dropdown component
const TrackSelector = ({
  tracks,
  currentIndex,
  onSelect,
  color
}: {
  tracks: typeof TRACKS,
  currentIndex: number,
  onSelect: (index: number) => void,
  color: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-between p-1 rounded cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: `1px solid ${color}80`,
          backgroundColor: isOpen ? `${color}20` : 'transparent',
        }}
      >
        <div className="flex items-center">
          <List size={14} className="mr-1" style={{ color }} />
          <span className="text-sm font-bold truncate" style={{ color }}>
            {tracks[currentIndex].name}
          </span>
        </div>
        {isOpen ? 
          <ChevronUp size={14} style={{ color }} /> : 
          <ChevronDown size={14} style={{ color }} />
        }
      </div>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-40 overflow-y-auto"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}80`,
            boxShadow: `0 0 15px ${color}40`,
          }}
        >
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className={`p-2 cursor-pointer hover:bg-gray-800 flex items-center gap-1 ${currentIndex === idx ? 'bg-gray-900' : ''}`}
              onClick={() => {
                onSelect(idx);
                setIsOpen(false);
              }}
            >
              {currentIndex === idx && (
                <span className="text-xs mr-1" style={{ color: track.color }}>
                  ▶
                </span>
              )}
              <span 
                className="text-sm truncate" 
                style={{ 
                  color: currentIndex === idx ? track.color : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: currentIndex === idx ? 'bold' : 'normal'
                }}
              >
                {track.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Progress bar component with improved one-click interaction
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
  // Handle direct click on progress bar
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.max(0, Math.min(1, clickPosition)) * duration;
    onChange(newPosition);
  }, [duration, onChange]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full space-y-1">
      <div
        className="h-1.5 w-full rounded-full cursor-pointer bg-gray-800 relative"
        onClick={handleClick}
      >
        <div
          className="h-full rounded-full relative"
          style={{ 
            width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
            background: color,
            boxShadow: `0 0 5px ${color}`
          }}
        >
          <div 
            className="absolute w-3 h-3 rounded-full -right-1.5 -top-0.75 cursor-grab"
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              border: '1px solid rgba(255,255,255,0.8)'
            }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color }}>{formatTime(progress)}</span>
        <span style={{ color }}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Main MusicPlayer component
const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 300 });
  const [size, setSize] = useState({ width: 320, height: isMinimized ? 64 : 200 });
  const [isVisible, setIsVisible] = useState(true);
  
  const progressTimerRef = useRef<number | null>(null);
  const currentTrack = TRACKS[currentTrackIndex];
  
  // Initialize audio
  useEffect(() => {
    if (!sound) {
      const track = TRACKS[currentTrackIndex];
      sound = new Howl({
        src: [track.path],
        html5: true,
        volume: (isMuted ? 0 : volume) / 100,
        onload: () => {
          if (sound) {
            setDuration(sound.duration());
          }
        },
        onend: () => {
          if (sound) {
            // Play next track
            const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
            setCurrentTrackIndex(nextIndex);
          }
        }
      });
    }
    
    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
        sound = null;
      }
    };
  }, []);
  
  // Handle track change
  useEffect(() => {
    if (sound) {
      sound.stop();
      sound.unload();
    }
    
    const track = TRACKS[currentTrackIndex];
    sound = new Howl({
      src: [track.path],
      html5: true,
      volume: (isMuted ? 0 : volume) / 100,
      onload: () => {
        if (sound) {
          setDuration(sound.duration());
          if (isPlaying) {
            sound.play();
          }
        }
      },
      onend: () => {
        if (sound) {
          // Play next track
          const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
          setCurrentTrackIndex(nextIndex);
        }
      }
    });
  }, [currentTrackIndex]);
  
  // Handle volume change
  useEffect(() => {
    if (sound) {
      sound.volume((isMuted ? 0 : volume) / 100);
    }
  }, [volume, isMuted]);
  
  // Track progress
  useEffect(() => {
    if (isPlaying) {
      // Stop any existing interval
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      // Start a new interval
      progressTimerRef.current = window.setInterval(() => {
        if (sound) {
          setProgress(sound.seek());
        }
      }, 500);
    } else if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [isPlaying]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
      } else {
        sound.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle previous track
  const handlePrevious = () => {
    const prevIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(prevIndex);
  };
  
  // Handle next track
  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIndex);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle progress change (seek)
  const handleProgressChange = (newPosition: number) => {
    if (sound) {
      sound.seek(newPosition);
      setProgress(newPosition);
    }
  };
  
  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
    setSize({ width: 320, height: !isMinimized ? 64 : 200 });
  };
  
  // Handle auto-hide when near navbar
  useEffect(() => {
    const checkPosition = () => {
      // Toggle visibility based on proximity to navigation bar
      const navbarHeight = 64; // Adjust based on your navbar height
      const bottomThreshold = window.innerHeight - navbarHeight - 20;
      
      if (position.y > bottomThreshold) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    
    checkPosition();
    window.addEventListener('resize', checkPosition);
    
    return () => {
      window.removeEventListener('resize', checkPosition);
    };
  }, [position]);
  
  if (!isVisible) return null;
  
  // Render minimized circular player
  if (isMinimized) {
    return (
      <Rnd
        style={{
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        size={{ width: 50, height: 50 }}
        position={{ x: position.x, y: position.y }}
        onDragStop={(e, d) => {
          setPosition({ x: d.x, y: d.y });
        }}
        minWidth={50}
        minHeight={50}
        maxWidth={50}
        maxHeight={50}
        bounds="window"
      >
        <div 
          className="w-full h-full rounded-full flex items-center justify-center cursor-pointer overflow-hidden relative"
          style={{ 
            background: `radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)`,
            border: `2px solid ${currentTrack.color}`,
            boxShadow: `0 0 15px ${currentTrack.color}80`,
          }}
          onClick={toggleMinimized}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i}
                className="absolute w-full h-[1px] bg-white opacity-50"
                style={{ top: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>

          {/* Pulsating circle */}
          <div 
            className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
            style={{ 
              border: `1px solid ${currentTrack.color}80`,
              boxShadow: `inset 0 0 10px ${currentTrack.color}50`
            }}
          />
          
          {/* Play/Pause icon */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            {isPlaying ? (
              <Pause size={18} style={{ color: currentTrack.color }} />
            ) : (
              <Play size={18} style={{ color: currentTrack.color }} />
            )}
          </div>
          
          {/* Rotating border effect */}
          <div 
            className={`absolute inset-[-2px] rounded-full ${isPlaying ? 'animate-spin' : ''}`}
            style={{ 
              borderTop: `1px solid ${currentTrack.color}`,
              borderRight: `1px solid transparent`,
              borderBottom: `1px solid ${currentTrack.color}`,
              borderLeft: `1px solid transparent`,
              animationDuration: '10s',
            }}
          />
        </div>
      </Rnd>
    );
  }
  
  // Render full player
  return (
    <Rnd
      style={{
        zIndex: 999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height)
        });
        setPosition(position);
      }}
      minWidth={220}
      minHeight={isMinimized ? 64 : 150}
      maxWidth={500}
      maxHeight={isMinimized ? 64 : 300}
      dragHandleClassName="drag-handle"
      bounds="window"
    >
      <div 
        className="rounded-md p-2 w-full h-full flex flex-col"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${currentTrack.color}80`,
          boxShadow: `0 0 15px ${currentTrack.color}40`,
        }}
      >
        {/* Header with drag handle and track selector */}
        <div className="flex items-center justify-between mb-2 drag-handle cursor-move">
          <div className="flex items-center gap-2 flex-grow">
            <GripHorizontal size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
              <TrackSelector
                tracks={TRACKS}
                currentIndex={currentTrackIndex}
                onSelect={setCurrentTrackIndex}
                color={currentTrack.color}
              />
            </div>
          </div>
          <button 
            onClick={toggleMinimized} 
            className="p-1 text-gray-400 hover:text-white flex-shrink-0 ml-1"
          >
            <Minimize2 size={16} />
          </button>
        </div>
        
        {/* Visualizer */}
        <div className="mb-2">
          <AudioVisualizer 
            isPlaying={isPlaying} 
            volume={isMuted ? 0 : volume} 
            color={currentTrack.color}
          />
        </div>
        
        {/* Progress bar */}
        <div className="mb-2">
          <ProgressBar 
            progress={progress} 
            duration={duration} 
            color={currentTrack.color}
            onChange={handleProgressChange}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevious} 
              className="p-1 text-gray-400 hover:text-white"
            >
              <SkipBack size={18} />
            </button>
            
            <button 
              onClick={togglePlayPause} 
              className="p-1.5 rounded-full" 
              style={{ 
                color: currentTrack.color,
                border: `1px solid ${currentTrack.color}80`,
                boxShadow: isPlaying ? `0 0 10px ${currentTrack.color}80` : 'none'
              }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            
            <button 
              onClick={handleNext} 
              className="p-1 text-gray-400 hover:text-white"
            >
              <SkipForward size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute} 
              className="p-1 text-gray-400 hover:text-white"
              style={{ color: isMuted ? currentTrack.color : undefined }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-20 h-1.5 appearance-none bg-gray-800 rounded-full"
              style={{ 
                background: `linear-gradient(to right, ${currentTrack.color} 0%, ${currentTrack.color} ${volume}%, #1f2937 ${volume}%, #1f2937 100%)`,
              }}
            />
          </div>
        </div>
      </div>
    </Rnd>
  );
};

export default MusicPlayer; 