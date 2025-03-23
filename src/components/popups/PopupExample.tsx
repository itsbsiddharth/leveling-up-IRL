import { useState } from 'react';
import { FuturisticPopup } from './FuturisticPopup';
import { Button } from '../ui/button'; // Assuming you have a Button component in your UI folder

export function PopupExample() {
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [xpVisible, setXpVisible] = useState(false);
  
  const showWelcomePopup = () => {
    setWelcomeVisible(true);
  };
  
  const showXpPopup = () => {
    setXpVisible(true);
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold mb-4">Solo Leveling Popup Examples</h1>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={showWelcomePopup}
          className="bg-cyber-purple hover:bg-purple-700 text-white"
        >
          Show Welcome Popup
        </Button>
        
        <Button 
          onClick={showXpPopup}
          className="bg-cyber-blue hover:bg-cyan-600 text-black"
        >
          Show XP Increase Popup
        </Button>
      </div>
      
      {/* Welcome Popup */}
      <FuturisticPopup
        visible={welcomeVisible}
        title="Welcome Player!"
        subtitle="Prepare for your next quest!"
        onClose={() => setWelcomeVisible(false)}
        soundPath="/sounds/welcome.mp3" // Create this sound file
      />
      
      {/* XP Increase Popup */}
      <FuturisticPopup
        visible={xpVisible}
        title="XP Increased!"
        subtitle="You gained 200 XP"
        onClose={() => setXpVisible(false)}
        autoCloseDelay={3000} // Auto-close after 3 seconds
      />
    </div>
  );
}
