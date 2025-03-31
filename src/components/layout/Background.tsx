import React, { useEffect, useState } from 'react';

/**
 * Background component that displays the app's background image
 * It handles proper preloading, positioning, and responsiveness
 */
const Background: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [imagePath, setImagePath] = useState('/images/background.jpg');
  
  useEffect(() => {
    // Preload the background image with fallback logic
    const loadImage = (path: string) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        setLoaded(true);
        setImagePath(path);
      };
      img.onerror = () => {
        if (path === '/images/background.jpg') {
          console.log("Failed to load from /images/, trying root path");
          loadImage('/background.jpg');
        }
      };
    };
    
    loadImage('/images/background.jpg');
  }, []);

  return (
    <>
      {/* Use two background elements for extra reliability */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url('${imagePath}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out',
          zIndex: -1000, 
          pointerEvents: 'none',
          willChange: 'opacity',
        }}
      />
      
      {/* Add a lighter gradient overlay for better background visibility */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.4))',
          zIndex: -999,
        }}
      />
    </>
  );
};

export default Background; 