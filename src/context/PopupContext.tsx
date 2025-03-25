import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileSetupData {
  name: string;
  photoURL?: string;
}

// XP Change Data
interface XpChangeData {
  visible: boolean;
  amount: number;
  reason?: string;
}

// HP Change Data
interface HpChangeData {
  visible: boolean;
  amount: number;
  reason?: string;
}

// Level Up Data
interface LevelUpData {
  visible: boolean;
  level: number;
  rank?: string;
}

// Quest Complete Data
interface QuestCompleteData {
  visible: boolean;
  title: string;
  xp: number;
}

// Quest Added Data
interface QuestAddedData {
  visible: boolean;
  title: string;
}

interface PopupContextType {
  // Welcome & Login Popups
  isWelcomePopupVisible: boolean;
  setWelcomePopupVisible: (visible: boolean) => void;
  isLoginPopupVisible: boolean;
  setLoginPopupVisible: (visible: boolean) => void;
  
  // Profile Setup Popup
  isProfileSetupVisible: boolean;
  setProfileSetupVisible: (visible: boolean) => void;
  profileSetupData: ProfileSetupData | null;
  setProfileSetupData: (data: ProfileSetupData | null) => void;
  onProfileSetupComplete?: (data: ProfileSetupData) => Promise<void>;
  setOnProfileSetupComplete: (callback: (data: ProfileSetupData) => Promise<void>) => void;
  
  // XP and HP Change Popups
  showXpChangePopup: (amount: number, reason?: string) => void;
  showHpChangePopup: (amount: number, reason?: string) => void;
  xpChangeData: XpChangeData;
  setXpChangeData: React.Dispatch<React.SetStateAction<XpChangeData>>;
  hpChangeData: HpChangeData;
  setHpChangeData: React.Dispatch<React.SetStateAction<HpChangeData>>;
  
  // Rank and Level Up Popups
  showLevelUpPopup: (newLevel: number, newRank?: string) => void;
  levelUpData: LevelUpData;
  setLevelUpData: React.Dispatch<React.SetStateAction<LevelUpData>>;
  
  // Quest Popups
  showQuestCompletePopup: (questTitle: string, xpGained: number) => void;
  showQuestAddedPopup: (questTitle: string) => void;
  questCompleteData: QuestCompleteData;
  setQuestCompleteData: React.Dispatch<React.SetStateAction<QuestCompleteData>>;
  questAddedData: QuestAddedData;
  setQuestAddedData: React.Dispatch<React.SetStateAction<QuestAddedData>>;
  
  // Generic notification popups
  showErrorPopup: (title: string, options?: { description?: string; icon?: React.ReactNode }) => void;
  showInfoPopup: (title: string, options?: { description?: string; icon?: React.ReactNode }) => void;
}

const PopupContext = createContext<PopupContextType>({
  isWelcomePopupVisible: false,
  setWelcomePopupVisible: () => {},
  isLoginPopupVisible: false,
  setLoginPopupVisible: () => {},
  
  isProfileSetupVisible: false,
  setProfileSetupVisible: () => {},
  profileSetupData: null,
  setProfileSetupData: () => {},
  setOnProfileSetupComplete: () => {},
  
  showXpChangePopup: () => {},
  showHpChangePopup: () => {},
  xpChangeData: { visible: false, amount: 0 },
  setXpChangeData: () => {},
  hpChangeData: { visible: false, amount: 0 },
  setHpChangeData: () => {},
  
  showLevelUpPopup: () => {},
  levelUpData: { visible: false, level: 1 },
  setLevelUpData: () => {},
  
  showQuestCompletePopup: () => {},
  showQuestAddedPopup: () => {},
  questCompleteData: { visible: false, title: '', xp: 0 },
  setQuestCompleteData: () => {},
  questAddedData: { visible: false, title: '' },
  setQuestAddedData: () => {},
  
  showErrorPopup: () => {},
  showInfoPopup: () => {},
});

export const usePopup = () => useContext(PopupContext);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Welcome & Login Popups
  const [isWelcomePopupVisible, setWelcomePopupVisible] = useState(false);
  const [isLoginPopupVisible, setLoginPopupVisible] = useState(false);
  
  // Profile Setup Popup
  const [isProfileSetupVisible, setProfileSetupVisible] = useState(false);
  const [profileSetupData, setProfileSetupData] = useState<ProfileSetupData | null>(null);
  const [onProfileSetupComplete, setOnProfileSetupComplete] = useState<((data: ProfileSetupData) => Promise<void>) | undefined>(undefined);
  
  // XP and HP Popups
  const [xpChangeData, setXpChangeData] = useState<XpChangeData>({ 
    visible: false, amount: 0 
  });
  
  const [hpChangeData, setHpChangeData] = useState<HpChangeData>({ 
    visible: false, amount: 0 
  });
  
  // Level Up Popup
  const [levelUpData, setLevelUpData] = useState<LevelUpData>({ 
    visible: false, 
    level: 1
  });
  
  // Quest Popups
  const [questCompleteData, setQuestCompleteData] = useState<QuestCompleteData>({ 
    visible: false, 
    title: '', 
    xp: 0 
  });
  
  const [questAddedData, setQuestAddedData] = useState<QuestAddedData>({ 
    visible: false, 
    title: '' 
  });
  
  // Handlers for showing popups
  const showXpChangePopup = (amount: number, reason?: string) => {
    setXpChangeData({ visible: true, amount, reason });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setXpChangeData(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const showHpChangePopup = (amount: number, reason?: string) => {
    setHpChangeData({ visible: true, amount, reason });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setHpChangeData(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const showLevelUpPopup = (newLevel: number, newRank?: string) => {
    setLevelUpData({ visible: true, level: newLevel, rank: newRank });
  };
  
  const showQuestCompletePopup = (questTitle: string, xpGained: number) => {
    setQuestCompleteData({ visible: true, title: questTitle, xp: xpGained });
    
    // Auto-close after 4 seconds
    setTimeout(() => {
      setQuestCompleteData(prev => ({ ...prev, visible: false }));
    }, 4000);
  };
  
  const showQuestAddedPopup = (questTitle: string) => {
    setQuestAddedData({ visible: true, title: questTitle });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setQuestAddedData(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Generic notification handlers
  const showErrorPopup = (title: string, options?: { description?: string; icon?: React.ReactNode }) => {
    setHpChangeData({
      visible: true,
      amount: -5,
      reason: options?.description || title
    });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setHpChangeData(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const showInfoPopup = (title: string, options?: { description?: string; icon?: React.ReactNode }) => {
    setXpChangeData({
      visible: true,
      amount: 0,
      reason: options?.description || title
    });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      setXpChangeData(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  return (
    <PopupContext.Provider value={{
      isWelcomePopupVisible,
      setWelcomePopupVisible,
      isLoginPopupVisible,
      setLoginPopupVisible,
      
      isProfileSetupVisible,
      setProfileSetupVisible,
      profileSetupData,
      setProfileSetupData,
      setOnProfileSetupComplete,
      onProfileSetupComplete,
      
      showXpChangePopup,
      showHpChangePopup,
      xpChangeData,
      setXpChangeData,
      hpChangeData,
      setHpChangeData,
      
      showLevelUpPopup,
      levelUpData,
      setLevelUpData,
      
      showQuestCompletePopup,
      showQuestAddedPopup,
      questCompleteData,
      setQuestCompleteData,
      questAddedData,
      setQuestAddedData,
      
      showErrorPopup,
      showInfoPopup
    }}>
      {children}
    </PopupContext.Provider>
  );
};

export default PopupProvider;
