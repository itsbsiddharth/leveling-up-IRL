import React from 'react';
import { useMusicPlayer } from '@/context/MusicContext';

/**
 * A simple component to debug the music player rendering
 * This will display information about the music player's state
 */
const MusicPlayerDebug: React.FC = () => {
  const { 
    isPlaying, 
    currentTrackIndex, 
    isMinimized, 
    playerPosition, 
    toggleMinimized, 
    getCurrentTrack
  } = useMusicPlayer();

  const currentTrack = getCurrentTrack();

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '0 0 10px 0',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px'
      }}
    >
      <h3>Music Player Debug</h3>
      <div>
        <div>Is Mounted: Yes</div>
        <div>Minimized: {isMinimized ? 'Yes' : 'No'}</div>
        <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
        <div>Track: {currentTrackIndex + 1} - {currentTrack.name}</div>
        <div>Position: {playerPosition.x.toFixed(0)},{playerPosition.y.toFixed(0)}</div>
        <div>Size: {playerPosition.width}x{playerPosition.height}</div>
        <button 
          onClick={toggleMinimized}
          style={{
            background: currentTrack.color,
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            marginTop: '5px'
          }}
        >
          {isMinimized ? 'Expand' : 'Minimize'}
        </button>
      </div>
    </div>
  );
};

export default MusicPlayerDebug; 