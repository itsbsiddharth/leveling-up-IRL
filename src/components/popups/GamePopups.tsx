import { useEffect, useState } from 'react';
import { FuturisticPopup, ProfileSetupPopup } from '@/components/popups';
import { usePopup } from '@/context/PopupContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { FaGoogle } from 'react-icons/fa';

/**
 * Component that manages all game-related popups in the app
 * This is meant to be included at the top level of the app once
 */
export function GamePopups() {
  const { 
    // Welcome & Login
    isWelcomePopupVisible, 
    setWelcomePopupVisible,
    isLoginPopupVisible,
    setLoginPopupVisible,
    
    // Profile Setup
    isProfileSetupVisible,
    setProfileSetupVisible,
    onProfileSetupComplete,
    profileSetupData,
    setProfileSetupData,
    
    // XP & HP
    xpChangeData,
    setXpChangeData,
    hpChangeData,
    setHpChangeData,
    
    // Level Up
    levelUpData,
    setLevelUpData,
    
    // Quests
    questCompleteData,
    setQuestCompleteData,
    questAddedData,
    setQuestAddedData,
  } = usePopup();
  
  const { currentUser, signInWithGoogleAuth, isLoading: authLoading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    // Check localStorage to see if user has dismissed welcome popup before
    return localStorage.getItem('hasSeenWelcome') === 'true';
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Show welcome popup on first load for non-logged in users
  useEffect(() => {
    // Only show welcome popup if user hasn't seen it before and isn't logged in
    if (!currentUser && !hasSeenWelcome && !isWelcomePopupVisible) {
      // Slight delay to ensure app is fully loaded
      const timer = setTimeout(() => {
        setWelcomePopupVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, hasSeenWelcome, isWelcomePopupVisible, setWelcomePopupVisible]);
  
  // Show profile setup popup if user is logged in for the first time
  // We'll check if the user is logged in but doesn't have a name as indicator of first login
  useEffect(() => {
    if (currentUser && !currentUser.name && !isProfileSetupVisible) {
      const timer = setTimeout(() => {
        setProfileSetupVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, isProfileSetupVisible, setProfileSetupVisible]);
  
  // Function to handle continuing as guest
  const handleContinueAsGuest = () => {
    setWelcomePopupVisible(false);
    // Set the flag in localStorage so we don't show welcome again
    localStorage.setItem('hasSeenWelcome', 'true');
    setHasSeenWelcome(true);
  };
  
  // Function to handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      await signInWithGoogleAuth();
      setWelcomePopupVisible(false);
      // We set hasSeenWelcome here too since they're now logged in
      localStorage.setItem('hasSeenWelcome', 'true');
      setHasSeenWelcome(true);
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Function to handle close of welcome popup
  const handleWelcomeClose = () => {
    setWelcomePopupVisible(false);
    // Set the flag in localStorage so we don't show welcome again
    localStorage.setItem('hasSeenWelcome', 'true');
    setHasSeenWelcome(true);
  };
  
  return (
    <>
      {/* Welcome Popup - Shows when users first visit the site */}
      <FuturisticPopup
        visible={isWelcomePopupVisible}
        title="Welcome to Grindirl!"
        subtitle="Begin your productivity journey"
        content={
          <>
            <p className="text-gray-300 mb-6">
              Track activities, level up, and maximize your potential in this gamified productivity app.
            </p>
            
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating || authLoading}
                className="w-full bg-cyber-purple hover:bg-purple-700 text-white p-3 rounded-md flex items-center justify-center gap-2"
              >
                <FaGoogle />
                {isAuthenticating ? 'Signing in...' : 'Sign In with Google'}
              </Button>
              <Button 
                onClick={handleContinueAsGuest}
                variant="outline"
                disabled={isAuthenticating || authLoading}
                className="w-full border-cyber-blue text-cyber-blue hover:bg-cyber-blue/20 p-3 rounded-md"
              >
                Continue as Guest
              </Button>
            </div>
          </>
        }
        onClose={handleWelcomeClose}
        autoCloseDelay={0} // Don't auto-close this one
        soundPath="/sounds/welcome.mp3"
        backgroundImage="/images/swirling-bg.gif"
      />
      
      {/* Profile Setup Popup - Shows when users log in for the first time */}
      <ProfileSetupPopup 
        visible={isProfileSetupVisible}
        onClose={() => setProfileSetupVisible(false)}
      />
      
      {/* XP Increase Popup */}
      <FuturisticPopup
        visible={xpChangeData.visible}
        title={xpChangeData.amount > 0 ? "XP Gained!" : "XP Reduced"}
        subtitle={`${xpChangeData.amount > 0 ? '+' : ''}${xpChangeData.amount} XP`}
        content={xpChangeData.reason ? <p className="text-gray-300 mb-4">{xpChangeData.reason}</p> : null}
        onClose={() => setXpChangeData(prev => ({ ...prev, visible: false }))}
        autoCloseDelay={3000}
        soundPath="/sounds/xp-gain.mp3"
      />
      
      {/* HP Change Popup */}
      <FuturisticPopup
        visible={hpChangeData.visible}
        title={hpChangeData.amount > 0 ? "HP Restored!" : "HP Lost"}
        subtitle={`${hpChangeData.amount > 0 ? '+' : ''}${hpChangeData.amount} HP`}
        content={hpChangeData.reason ? <p className="text-gray-300 mb-4">{hpChangeData.reason}</p> : null}
        onClose={() => setHpChangeData(prev => ({ ...prev, visible: false }))}
        autoCloseDelay={3000}
        soundPath="/sounds/hp-change.mp3"
        glowColor={hpChangeData.amount > 0 ? "green" : "red"}
      />
      
      {/* Level Up Popup */}
      <FuturisticPopup
        visible={levelUpData.visible}
        title="Level Up!"
        subtitle={`Level ${levelUpData.level} ${levelUpData.rank || ''}`}
        content={
          <p className="text-gray-300 mb-4">
            Congratulations! You've reached a new level. Keep up the good work!
          </p>
        }
        onClose={() => setLevelUpData(prev => ({ ...prev, visible: false }))}
        autoCloseDelay={5000}
        soundPath="/sounds/level-up.mp3"
        backgroundImage="/images/swirling-bg.gif"
        enableConfetti={true}
      />
      
      {/* Quest Complete Popup */}
      <FuturisticPopup
        visible={questCompleteData.visible}
        title="Quest Complete!"
        subtitle={questCompleteData.title}
        content={
          <p className="text-gray-300 mb-4">
            You've earned <span className="text-cyber-blue font-bold">+{questCompleteData.xp} XP</span>
          </p>
        }
        onClose={() => setQuestCompleteData(prev => ({ ...prev, visible: false }))}
        autoCloseDelay={3000}
        soundPath="/sounds/quest-complete.mp3"
      />
      
      {/* New Quest Added Popup */}
      <FuturisticPopup
        visible={questAddedData.visible}
        title="New Quest Available"
        subtitle={questAddedData.title}
        content={
          <p className="text-gray-300 mb-4">
            A new quest has been added to your quest log.
          </p>
        }
        onClose={() => setQuestAddedData(prev => ({ ...prev, visible: false }))}
        autoCloseDelay={3000}
        soundPath="/sounds/quest-added.mp3"
      />
    </>
  );
}
