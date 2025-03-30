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
import { createPortal } from 'react-dom';

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

// Enhanced Track Selection dropdown component with robust event handling
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  
  // Enhanced outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if clicking outside both the trigger and the dropdown
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current && 
        !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside, true);
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]); // Add isOpen to dependencies

  // Handle track selection with improved event handling
  const handleTrackSelect = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close dropdown first to prevent any UI jank
    setIsOpen(false);
    
    // Select track immediately
    onSelect(idx);
  }, [onSelect]);
  
  // Toggle dropdown with improved handling
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);
  
  return (
    <div 
      className="relative" 
      ref={dropdownRef} 
      style={{ zIndex: isOpen ? 1010 : 1000 }}
    >
      <div 
        className="flex items-center justify-between p-1 rounded cursor-pointer hover:bg-gray-800"
        onClick={toggleDropdown}
        style={{
          border: `1px solid ${color}80`,
          backgroundColor: isOpen ? `${color}20` : 'transparent',
          transition: 'all 0.2s ease',
          position: 'relative',
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
      
      {isOpen && createPortal(
        <div 
          ref={dropdownMenuRef}
          className="music-track-dropdown absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-md custom-scrollbar"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}80`,
            boxShadow: `0 0 15px ${color}40`,
            animation: 'fadeIn 0.15s ease',
            zIndex: 9999,
            position: 'absolute',
            width: dropdownRef.current ? dropdownRef.current.offsetWidth : 'auto',
            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
            top: dropdownRef.current ? 
              dropdownRef.current.getBoundingClientRect().bottom + window.scrollY + 4 : 0,
          }}
          onClick={e => e.stopPropagation()}
        >
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className={`p-2 cursor-pointer transition-colors duration-150 hover:bg-gray-800 flex items-center gap-1 ${currentIndex === idx ? 'bg-gray-900' : ''}`}
              onClick={(e) => handleTrackSelect(e, idx)}
              style={{
                borderLeft: currentIndex === idx ? `2px solid ${track.color}` : '2px solid transparent'
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
                  color: track.color,
                  fontWeight: currentIndex === idx ? 'bold' : 'normal',
                  textShadow: currentIndex === idx ? `0 0 5px ${track.color}` : 'none',
                  opacity: currentIndex === idx ? 1 : 0.8
                }}
              >
                {track.name}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

// Enhanced Progress bar component with smoother interactions
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
  const isDraggingRef = useRef(false);
  
  // Handle direct click and drag on progress bar
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!progressBarRef.current) return;
    
    const updatePosition = (clientX: number) => {
      const rect = progressBarRef.current!.getBoundingClientRect();
      const clickPosition = (clientX - rect.left) / rect.width;
      const newPosition = Math.max(0, Math.min(1, clickPosition)) * duration;
      onChange(newPosition);
    };
    
    updatePosition(e.clientX);
  }, [duration, onChange]);
  
  // Add mouse drag support for smoother seeking
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!progressBarRef.current) return;
    
    isDraggingRef.current = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const newPosition = Math.max(0, Math.min(1, clickPosition)) * duration;
        onChange(newPosition);
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
        ref={progressBarRef}
        className="h-1.5 w-full rounded-full cursor-pointer bg-gray-800 relative"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <div
          className="h-full rounded-full relative transition-all duration-75"
          style={{ 
            width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
            background: color,
            boxShadow: `0 0 5px ${color}`
          }}
        >
          <div 
            className="absolute w-3 h-3 rounded-full -right-1.5 -translate-y-1/2 top-1/2 cursor-grab transition-all duration-75"
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

// Improved volume control with draggable functionality
const VolumeControl = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  color
}: {
  volume: number,
  isMuted: boolean,
  onVolumeChange: (volume: number) => void,
  onMuteToggle: () => void,
  color: string
}) => {
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!volumeBarRef.current) return;
    
    const updateVolume = (clientX: number) => {
      const rect = volumeBarRef.current!.getBoundingClientRect();
      const clickPosition = (clientX - rect.left) / rect.width;
      const newVolume = Math.round(Math.max(0, Math.min(1, clickPosition)) * 100);
      onVolumeChange(newVolume);
    };
    
    updateVolume(e.clientX);
  }, [onVolumeChange]);
  
  // Add mouse drag support
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!volumeBarRef.current) return;
    
    isDraggingRef.current = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && volumeBarRef.current) {
        const rect = volumeBarRef.current.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const newVolume = Math.round(Math.max(0, Math.min(1, clickPosition)) * 100);
        onVolumeChange(newVolume);
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onVolumeChange]);
  
  return (
    <div className="flex items-center gap-2 relative">
      <button 
        onClick={onMuteToggle} 
        className="p-1 text-gray-400 hover:text-white transition-colors duration-150"
        style={{ color: isMuted ? color : undefined }}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      
      <div 
        ref={volumeBarRef}
        className="w-20 h-6 relative flex items-center"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="w-full h-1.5 bg-gray-800 rounded-full cursor-pointer"
        >
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{ 
              width: `${isMuted ? 0 : volume}%`,
              background: color,
              boxShadow: `0 0 5px ${color}`
            }}
          />
        </div>
        
        {/* Custom volume slider dragger */}
        <div 
          className="absolute w-3 h-3 rounded-full pointer-events-none transition-all duration-75"
          style={{ 
            left: `calc(${isMuted ? 0 : volume}% - 6px)`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
            border: '1px solid rgba(255,255,255,0.8)'
          }}
        />
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
  const [trackSelectorOpen, setTrackSelectorOpen] = useState(false);
  
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
    
    // Reset progress immediately when changing tracks to avoid jumpy behavior
    setProgress(0);
    
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
  
  // Track progress with more frequent updates
  useEffect(() => {
    if (isPlaying) {
      // Stop any existing interval
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      
      // Start a new interval with more frequent updates (100ms instead of 500ms)
      progressTimerRef.current = window.setInterval(() => {
        if (sound) {
          setProgress(sound.seek());
        }
      }, 100);
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
  
  // Handle progress change (seek) - improved for responsiveness
  const handleProgressChange = (newPosition: number) => {
    if (sound) {
      // Immediately set UI progress for responsive feeling
      setProgress(newPosition);
      
      // Then update actual audio position
      sound.seek(newPosition);
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
  
  // Modified Track Selection handling in MusicPlayer component
  const handleTrackSelection = useCallback((index: number) => {
    // Ensure we're not selecting the same track
    if (index === currentTrackIndex) return;
    
    // Update track index immediately to update UI
    setCurrentTrackIndex(index);
    
    // Force immediate state update and play
    if (sound) {
      sound.stop(); // Stop current track
    }
    
    // Create a new sound instance immediately for quicker feedback
    const track = TRACKS[index];
    const newSound = new Howl({
      src: [track.path],
      html5: true,
      volume: (isMuted ? 0 : volume) / 100,
      autoplay: true, // Auto play the new track
      onload: () => {
        setDuration(newSound.duration());
        setProgress(0);
      },
      onend: () => {
        // Play next track
        const nextIndex = (index + 1) % TRACKS.length;
        setCurrentTrackIndex(nextIndex);
      }
    });
    
    // Replace global sound instance
    if (sound) {
      sound.unload();
    }
    sound = newSound;
    
    // Set playing state to true
    setIsPlaying(true);
  }, [currentTrackIndex, isMuted, volume]);
  
  if (!isVisible) return null;
  
  // Render minimized circular player - completely redesigned for better reliability
  if (isMinimized) {
    return (
      <Rnd
        style={{
          zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        size={{ width: 56, height: 56 }}
        position={{ x: position.x, y: position.y }}
        onDragStop={(e, d) => {
          setPosition({ x: d.x, y: d.y });
        }}
        minWidth={56}
        minHeight={56}
        maxWidth={56}
        maxHeight={56}
        bounds="window"
        disableResizing={true}
      >
        <div 
          className="w-full h-full rounded-full flex items-center justify-center cursor-pointer overflow-hidden relative"
          style={{ 
            background: 'rgba(0,0,0,0.85)',
            border: `2px solid ${isPlaying ? currentTrack.color : 'rgba(100, 100, 100, 0.4)'}`,
            boxShadow: isPlaying ? `0 0 15px ${currentTrack.color}80` : 'none',
            transition: 'all 0.3s ease'
          }}
          onClick={toggleMinimized}
        >
          {/* Music icon in center */}
          <Music 
            size={28} 
            style={{ 
              color: isPlaying ? currentTrack.color : 'rgba(180, 180, 180, 0.7)',
              filter: isPlaying ? `drop-shadow(0 0 4px ${currentTrack.color})` : 'none',
              transition: 'all 0.3s ease'
            }} 
          />
          
          {/* Subtle ring animation when playing */}
          {isPlaying && (
            <div 
              className="absolute inset-0 animate-pulse rounded-full"
              style={{ 
                border: `1px solid ${currentTrack.color}50`,
                boxShadow: `inset 0 0 10px ${currentTrack.color}30`,
              }}
            />
          )}
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
                onSelect={handleTrackSelection}
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
              className="p-1 text-gray-400 hover:text-white transition-colors duration-150"
            >
              <SkipBack size={18} />
            </button>
            
            <button 
              onClick={togglePlayPause} 
              className="p-1.5 rounded-full transition-all duration-150" 
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
              className="p-1 text-gray-400 hover:text-white transition-colors duration-150"
            >
              <SkipForward size={18} />
            </button>
          </div>
          
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onMuteToggle={toggleMute}
            color={currentTrack.color}
          />
        </div>
      </div>
    </Rnd>
  );
};

// Update the styleEl with themed scrollbar styles
const styleEl = document.createElement('style');
styleEl.innerHTML = `
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0;
    height: 0;
    background: transparent;
    border: 0;
  }
  input[type=range]::-moz-range-thumb {
    width: 0;
    height: 0;
    background: transparent;
    border: 0;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Force the dropdown to be visible and in front */
  .music-track-dropdown {
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 9999 !important;
    pointer-events: auto !important;
  }
  
  /* Custom scrollbar styling for cyberpunk theme */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #7122e0, #05d9e8);
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #8a44f2, #25e9f7);
    box-shadow: 0 0 8px rgba(5, 217, 232, 0.5);
  }
`;
document.head.appendChild(styleEl);

export default MusicPlayer; 