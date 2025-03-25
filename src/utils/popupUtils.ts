import { usePopup } from '@/context/PopupContext';
import { Howl } from 'howler';

// Create a singleton to store the popup context reference
// This allows us to use the popup context outside of React components
let popupContextRef: ReturnType<typeof usePopup> | null = null;

// Simple sound cache to prevent reloading sounds
const soundCache: Record<string, Howl> = {};

// Preload common sounds
const commonSounds = [
  '/sounds/success.mp3',
  '/sounds/error.mp3',
  '/sounds/info.mp3',
  '/sounds/xp-gain.mp3',
  '/sounds/hp-change.mp3',
  '/sounds/level-up.mp3',
  '/sounds/quest-complete.mp3'
];

// Preload sounds for immediate playback
commonSounds.forEach(sound => {
  if (!soundCache[sound]) {
    soundCache[sound] = new Howl({
      src: [sound],
      preload: true,
      volume: 0.5
    });
  }
});

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
  // Determine which type of popup to show based on the options
  if (popupContextRef) {
    if (options?.xp !== undefined) {
      popupContextRef.showXpChangePopup(options.xp, options.description);
    } else if (options?.hp !== undefined) {
      popupContextRef.showHpChangePopup(options.hp, options.description);
    } else if (options?.level !== undefined) {
      popupContextRef.showLevelUpPopup(options.level, options.rank);
    } else if (options?.questTitle !== undefined) {
      popupContextRef.showQuestCompletePopup(options.questTitle, options.xp || 0);
    } else {
      // Show a custom popup with the FuturisticPopup component
      const customPopup = document.createElement('div');
      customPopup.className = 'custom-popup';
      document.body.appendChild(customPopup);

      const popup = {
        visible: true,
        title,
        subtitle: options?.description,
        content: null,
        onClose: () => {
          popup.visible = false;
          // We would update state here in a real implementation
        },
        autoCloseDelay: 3000,
        soundPath: '/sounds/success.mp3',
        glowColor: 'blue' as const
      };

      // Play sound directly if context available but no specialized popup type
      const sound = soundCache['/sounds/success.mp3'] || new Howl({
        src: ['/sounds/success.mp3'],
        volume: 0.5
      });
      sound.play();
    }
  }
};

// Error popup replacement
export const showErrorPopup = (title: string, options?: {
  description?: string;
  icon?: React.ReactNode;
}) => {
  if (popupContextRef) {
    // Show a custom popup with the FuturisticPopup component
    const customPopup = document.createElement('div');
    customPopup.className = 'custom-popup';
    document.body.appendChild(customPopup);

    // Play sound directly
    const sound = soundCache['/sounds/error.mp3'] || new Howl({
      src: ['/sounds/error.mp3'],
      volume: 0.5
    });
    sound.play();
    
    // For future implementation:
    // Add a dedicated error popup to PopupContext
    // For now, we'll use hp loss as it's visually similar for errors
    popupContextRef.showHpChangePopup(-5, options?.description || title);
  }
};

// Info popup replacement
export const showInfoPopup = (title: string, options?: {
  description?: string;
  icon?: React.ReactNode;
}) => {
  if (popupContextRef) {
    // Play sound directly
    const sound = soundCache['/sounds/info.mp3'] || new Howl({
      src: ['/sounds/info.mp3'],
      volume: 0.5
    });
    sound.play();
    
    // For future implementation:
    // Add a dedicated info popup to PopupContext
    // For now, we'll leverage the XP change popup with 0 XP to show an info message
    popupContextRef.showXpChangePopup(0, options?.description || title);
  }
};

// Quest complete popup helper
export const showQuestCompletePopup = (questTitle: string, xpGained: number) => {
  if (popupContextRef) {
    popupContextRef.showQuestCompletePopup(questTitle, xpGained);
  }
};

// Level up popup helper
export const showLevelUpPopup = (level: number, rank?: string) => {
  if (popupContextRef) {
    popupContextRef.showLevelUpPopup(level, rank);
  }
};

// XP change popup helper
export const showXpGainPopup = (amount: number, reason?: string) => {
  if (popupContextRef) {
    popupContextRef.showXpChangePopup(amount, reason);
  }
};

// HP change popup helper
export const showHpChangePopup = (amount: number, reason?: string) => {
  if (popupContextRef) {
    popupContextRef.showHpChangePopup(amount, reason);
  }
};
