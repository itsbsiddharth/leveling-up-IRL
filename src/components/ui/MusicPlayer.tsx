import React, { useState, useEffect, useRef, memo } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Volume1, VolumeX, 
  Maximize2, Minimize2, RefreshCw, 
  ChevronDown, ChevronUp, MoveIcon, Grip,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicPlayer } from '@/context/MusicContext';
import 'react-resizable/css/styles.css';

// Optimized audio visualizer component
const AudioVisualizer = memo(({ 
  audioData,
  color = '#00b4d8',
  height = 60
}: { 
  audioData: number[],
  color: string,
  height?: number
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ensure proper canvas sizing for high DPI displays
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const renderFrame = () => {
      if (!canvas || !ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barCount = Math.min(32, audioData.length);
      const barWidth = (canvas.width / barCount) * 0.7;
      const barSpacing = (canvas.width / barCount) * 0.3;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `${color}`);
      gradient.addColorStop(0.8, `${color}80`);
      gradient.addColorStop(1, `${color}40`);
      
      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const value = audioData[i] || 0.05;
        const x = i * (barWidth + barSpacing);
        const barHeight = value * height * 0.8;
        const y = height - barHeight;
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      
      // Add scanline effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }
      
      // Add glitch effect occasionally
      if (Math.random() > 0.98) {
        const glitchX = Math.random() * canvas.width;
        const glitchWidth = Math.random() * 20 + 10;
        const glitchHeight = Math.random() * 5 + 2;
        ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.fillRect(glitchX, Math.random() * height, glitchWidth, glitchHeight);
      }
      
      rafRef.current = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioData, color, height]);
  
  return (
    <div className="w-full overflow-hidden rounded-md">
      <canvas 
        ref={canvasRef} 
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
});

AudioVisualizer.displayName = 'AudioVisualizer';

// Custom button styled with cyberpunk theme
const CyberButton = ({
  onClick,
  children,
  active = false,
  color = '#00b4d8',
  className = '',
  size = 'md'
}: {
  onClick: () => void,
  children: React.ReactNode,
  active?: boolean,
  color?: string,
  className?: string,
  size?: 'sm' | 'md' | 'lg'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };
  
  return (
    <button
      className={cn(
        "rounded-md transition-all duration-200 relative",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: active || isHovered ? `${color}20` : 'transparent',
        color: active ? color : 'white',
        border: `1px solid ${active || isHovered ? color : 'transparent'}`,
        boxShadow: active || isHovered ? `0 0 8px ${color}40` : 'none'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {active && (
        <span 
          className="absolute bottom-0 left-0 right-0 h-0.5" 
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
};

// Track selector component
const TrackSelector = ({ 
  color 
}: { 
  color: string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTrackIndex, setCurrentTrackIndex, getCurrentTrack } = useMusicPlayer();
  const { TRACKS } = require('@/context/MusicContext');
  const allTracks = [...TRACKS];
  
  const handleSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsOpen(false);
  };
  
  return (
    <div className="relative z-20">
      <button
        className="w-full px-3 py-2 rounded-md flex items-center justify-between"
        style={{
          backgroundColor: isOpen ? `${color}20` : 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${isOpen ? color : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: isOpen ? `0 0 10px ${color}40` : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span 
          className="text-sm font-semibold truncate mr-2"
          style={{ color }}
        >
          {getCurrentTrack().name}
        </span>
        
        {isOpen ? (
          <ChevronUp size={16} style={{ color }} />
        ) : (
          <ChevronDown size={16} style={{ color }} />
        )}
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}`
          }}
        >
          {allTracks.map((track, index) => (
            <div
              key={track.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-800 flex items-center gap-2"
              style={{
                backgroundColor: index === currentTrackIndex ? `${track.color}20` : 'transparent',
                borderLeft: `2px solid ${index === currentTrackIndex ? track.color : 'transparent'}`
              }}
              onClick={() => handleSelect(index)}
            >
              <span 
                className="text-sm truncate"
                style={{ 
                  color: index === currentTrackIndex ? track.color : 'white',
                  fontWeight: index === currentTrackIndex ? 'bold' : 'normal'
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

// Improved progress bar with single-click seeking
const ProgressBar = () => {
  const { progress, duration, seek } = useMusicPlayer();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const currentTrack = useMusicPlayer().getCurrentTrack();
  const color = currentTrack.color;
  
  const handleProgressChange = (e: React.MouseEvent) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percentage * duration);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercentage = duration ? (progress / duration) * 100 : 0;
  
  return (
    <div className="w-full space-y-1">
      <div
        ref={progressBarRef}
        className="h-1.5 w-full rounded-full cursor-pointer relative hover:h-2 transition-all overflow-hidden"
        onClick={handleProgressChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => isDragging && handleProgressChange(e)}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div
          className="absolute top-0 left-0 h-full"
          style={{ 
            width: `${progressPercentage}%`,
            background: `linear-gradient(to right, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}`
          }}
        />
        
        {/* Tick marks */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-0.5 opacity-30"
            style={{
              left: `${i * 10}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.5)'
            }}
          />
        ))}
        
        {/* Progress handle */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full"
          style={{
            left: `calc(${progressPercentage}% - 4px)`,
            backgroundColor: color,
            boxShadow: `0 0 5px ${color}`,
            display: isDragging ? 'block' : 'none'
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Volume control with improved UX
const VolumeControl = () => {
  const { volume, setVolume, isMuted, toggleMute } = useMusicPlayer();
  const currentTrack = useMusicPlayer().getCurrentTrack();
  const color = currentTrack.color;
  
  return (
    <div className="flex items-center gap-2">
      <CyberButton
        onClick={toggleMute}
        color={color}
        size="sm"
        active={isMuted}
      >
        {isMuted ? (
          <VolumeX size={16} />
        ) : volume < 30 ? (
          <Volume1 size={16} />
        ) : (
          <Volume2 size={16} />
        )}
      </CyberButton>
      
      <div className="relative w-20 h-6 group">
        <input 
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="w-full h-1.5 mt-2 appearance-none bg-gray-700 rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${volume}%, rgba(75, 85, 99, 0.5) ${volume}%, rgba(75, 85, 99, 0.5) 100%)`
          }}
        />
        
        <div 
          className="absolute h-3 w-3 rounded-full top-2 pointer-events-none"
          style={{
            left: `calc(${volume}% - 6px)`,
            backgroundColor: color,
            boxShadow: `0 0 5px ${color}`,
            border: '1px solid white',
            opacity: 0.9
          }}
        />
      </div>
    </div>
  );
};

// Draggy handle component
const DragHandle = ({ color }: { color: string }) => {
  return (
    <div 
      className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center cursor-move"
      style={{ backgroundColor: `${color}20` }}
    >
      <Grip size={14} className="opacity-70" />
    </div>
  );
};

// Resize handle component
const ResizeHandle = ({ color }: { color: string }) => {
  return (
    <div 
      className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-center justify-center"
      style={{ color }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path
          d="M9 1v8H1"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  );
};

// Main MusicPlayer component
const MusicPlayer: React.FC = () => {
  const { 
    isPlaying, togglePlay, next, previous, 
    isLoopMode, toggleLoop, audioData, 
    isMinimized, toggleMinimized,
    playerPosition, setPlayerPosition
  } = useMusicPlayer();
  
  const currentTrack = useMusicPlayer().getCurrentTrack();
  const color = currentTrack.color;
  
  const [isResizing, setIsResizing] = useState(false);
  
  // Set up refs for drag constraints
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setPlayerPosition({
          ...playerPosition,
          x: Math.min(playerPosition.x, window.innerWidth - playerPosition.width),
          y: Math.min(playerPosition.y, window.innerHeight - playerPosition.height - 80) // Keep above navbar
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [playerPosition, setPlayerPosition]);
  
  // Setup auto-hide for navbar clicks
  useEffect(() => {
    const navbarElements = document.querySelectorAll('#navbar-container a, #navbar-container button');
    const handleNavClick = () => {
      if (!isMinimized) {
        toggleMinimized();
      }
    };
    
    navbarElements.forEach(el => {
      el.addEventListener('click', handleNavClick);
    });
    
    return () => {
      navbarElements.forEach(el => {
        el.removeEventListener('click', handleNavClick);
      });
    };
  }, [isMinimized, toggleMinimized]);
  
  // Handle drag stop
  const handleDragStop = (_: any, data: { x: number, y: number }) => {
    setPlayerPosition({
      ...playerPosition,
      x: data.x,
      y: data.y
    });
  };
  
  // Handle resize stop
  const handleResizeStop = (_: any, { size }: { size: { width: number, height: number } }) => {
    setPlayerPosition({
      ...playerPosition,
      width: size.width,
      height: size.height
    });
    setIsResizing(false);
  };
  
  // Render minimized player
  if (isMinimized) {
    return (
      <Draggable
        defaultPosition={{ x: playerPosition.x, y: playerPosition.y }}
        onStop={handleDragStop}
        bounds="parent"
      >
        <div 
          ref={containerRef}
          className="fixed p-1 rounded-full shadow-lg z-50 cursor-pointer"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}`,
            boxShadow: `0 0 15px ${color}80`
          }}
        >
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center"
            onClick={toggleMinimized}
            style={{
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          >
            <Music 
              size={20} 
              color={color}
              className={isPlaying ? 'animate-pulse' : ''}
            />
          </button>
        </div>
      </Draggable>
    );
  }
  
  // Render full player
  return (
    <Draggable
      handle=".drag-handle"
      defaultPosition={{ x: playerPosition.x, y: playerPosition.y }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <Resizable
        width={playerPosition.width}
        height={playerPosition.height}
        minConstraints={[250, 300]}
        maxConstraints={[500, 600]}
        onResizeStart={() => setIsResizing(true)}
        onResizeStop={handleResizeStop}
        resizeHandles={['se']}
        handle={<ResizeHandle color={color} />}
      >
        <div 
          ref={containerRef}
          className="fixed overflow-hidden rounded-lg shadow-2xl z-50"
          style={{
            width: `${playerPosition.width}px`,
            height: `${playerPosition.height}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${color}80`,
            boxShadow: `0 0 20px ${color}30`
          }}
        >
          {/* Scanline overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10 z-0"
            style={{
              backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
              backgroundSize: '100% 4px'
            }}
          />
          
          {/* Diagonal accent line */}
          <div 
            className="absolute transform rotate-45 opacity-20 pointer-events-none z-0" 
            style={{ 
              top: '50%',
              left: '-50%',
              right: '-50%',
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
            }}
          />
          
          {/* Drag handle */}
          <div className="drag-handle">
            <DragHandle color={color} />
          </div>
          
          {/* Minimize button */}
          <div className="absolute top-1 right-1 z-20">
            <CyberButton
              onClick={toggleMinimized}
              color={color}
              size="sm"
            >
              <Minimize2 size={14} />
            </CyberButton>
          </div>
          
          {/* Content container with proper padding */}
          <div className="flex flex-col p-3 pt-8 h-full">
            {/* Track selector */}
            <div className="mb-3">
              <TrackSelector color={color} />
            </div>
            
            {/* Visualizer */}
            <div className="mb-3">
              <AudioVisualizer 
                audioData={audioData} 
                color={color}
                height={Math.min(80, playerPosition.height * 0.2)}
              />
            </div>
            
            {/* Progress Bar */}
            <div className="mb-3">
              <ProgressBar />
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <CyberButton
                  onClick={previous}
                  color={color}
                  size="sm"
                >
                  <SkipBack size={16} />
                </CyberButton>
                
                <CyberButton
                  onClick={togglePlay}
                  color={color}
                  size="lg"
                  className="w-10 h-10 flex items-center justify-center"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </CyberButton>
                
                <CyberButton
                  onClick={next}
                  color={color}
                  size="sm"
                >
                  <SkipForward size={16} />
                </CyberButton>
                
                <CyberButton
                  onClick={toggleLoop}
                  color={color}
                  size="sm"
                  active={isLoopMode}
                >
                  <RefreshCw size={14} />
                </CyberButton>
              </div>
              
              <VolumeControl />
            </div>
            
            {/* Status bar */}
            <div 
              className="mt-auto pt-2 border-t flex justify-between text-[9px] font-mono uppercase opacity-70"
              style={{ borderColor: `${color}40` }}
            >
              <span>{currentTrack.name}</span>
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        </div>
      </Resizable>
    </Draggable>
  );
};

export default MusicPlayer; 