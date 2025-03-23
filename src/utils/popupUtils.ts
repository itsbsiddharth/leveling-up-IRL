import { toast } from 'sonner';
import { usePopup } from '@/context/PopupContext';

// Create a singleton to store the popup context reference
// This allows us to use the popup context outside of React components
let popupContextRef: ReturnType<typeof usePopup> | null = null;

export const setPopupContextRef = (context: ReturnType<typeof usePopup>) => {
  popupContextRef = context;
};

export const getPopupContextRef = () => {
  return popupContextRef;
};

// This is a replacement for the toast.success method that shows our futuristic popup
export const showSuccessPopup = (title: string, options?: {
  description?: string;
  xp?: number;
  hp?: number;
  level?: number;
  rank?: string;
  questTitle?: string;
  icon?: React.ReactNode;
}) => {
  // First show the toast for backward compatibility
  toast.success(title, {
    description: options?.description,
    icon: options?.icon
  });
  
  // Then show our futuristic popup if context is available
  if (popupContextRef) {
    // Determine which type of popup to show based on the options
    if (options?.xp !== undefined) {
      popupContextRef.showXpChangePopup(options.xp, options.description);
    } else if (options?.hp !== undefined) {
      popupContextRef.showHpChangePopup(options.hp, options.description);
    } else if (options?.level !== undefined) {
      popupContextRef.showLevelUpPopup(options.level, options.rank);
    } else if (options?.questTitle !== undefined) {
      popupContextRef.showQuestCompletePopup(options.questTitle, options.xp || 0);
    } else {
      // Generic success popup handled by toast
    }
  }
};

// Error popup replacement
export const showErrorPopup = (title: string, options?: {
  description?: string;
  icon?: React.ReactNode;
}) => {
  // Show regular toast for backward compatibility
  toast.error(title, {
    description: options?.description,
    icon: options?.icon
  });
  
  // Currently we don't have a specific error popup in our futuristic design
  // Future enhancement: add error popup to FuturisticPopup component
};

// Info popup replacement
export const showInfoPopup = (title: string, options?: {
  description?: string;
  icon?: React.ReactNode;
}) => {
  // Show regular toast for backward compatibility
  toast.info(title, {
    description: options?.description,
    icon: options?.icon
  });
  
  // Currently we don't have a specific info popup in our futuristic design
  // Future enhancement: add info popup to FuturisticPopup component
};

// Quest complete popup helper
export const showQuestCompletePopup = (questTitle: string, xpGained: number) => {
  if (popupContextRef) {
    popupContextRef.showQuestCompletePopup(questTitle, xpGained);
  } else {
    // Fallback to toast if context isn't available
    toast.success(`Quest completed! +${xpGained} XP`, {
      description: questTitle,
      icon: "🌟"
    });
  }
};

// Level up popup helper
export const showLevelUpPopup = (level: number, rank?: string) => {
  if (popupContextRef) {
    popupContextRef.showLevelUpPopup(level, rank);
  } else {
    // Fallback to toast if context isn't available
    toast.success(`Level Up! Level ${level} ${rank || ''}`, {
      description: "Congratulations! You've reached a new level.",
      icon: "🏆"
    });
  }
};

// XP change popup helper
export const showXpGainPopup = (amount: number, reason?: string) => {
  if (popupContextRef) {
    popupContextRef.showXpChangePopup(amount, reason);
  } else {
    // Fallback to toast if context isn't available
    toast.success(`XP Gained! +${amount} XP`, {
      description: reason,
      icon: "✨"
    });
  }
};

// HP change popup helper
export const showHpChangePopup = (amount: number, reason?: string) => {
  if (popupContextRef) {
    popupContextRef.showHpChangePopup(amount, reason);
  } else {
    // Fallback to toast if context isn't available
    const message = amount > 0 ? `HP Restored! +${amount} HP` : `HP Lost! ${amount} HP`;
    toast.info(message, {
      description: reason,
      icon: amount > 0 ? "❤️" : "💔"
    });
  }
};
