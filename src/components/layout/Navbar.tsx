import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Timer, 
  Trophy, 
  User,
  LucideIcon 
} from 'lucide-react';

// Define interface for navigation items
interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

// Define navigation items for easier management
const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/timer', icon: Timer, label: 'Timer' },
  { path: '/achievements', icon: Trophy, label: 'Ranks' },
  { path: '/profile', icon: User, label: 'Profile' }
];

// Use memo to prevent unnecessary re-renders
const Navbar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const navbarRef = useRef<HTMLDivElement>(null);
  
  const isActive = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Direct navigation function - more responsive than Link
  const handleNavigation = useCallback((path: string) => {
    if (location.pathname !== path) {
      try {
        navigate(path);
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback to direct URL change if navigate fails
        window.location.href = path;
      }
    }
  }, [navigate, location.pathname]);
  
  // Handle clicks anywhere in the navbar area
  const handleNavbarClick = useCallback((e: MouseEvent) => {
    try {
      if (!navbarRef.current) return;
      
      // Get the navbar rectangle
      const navRect = navbarRef.current.getBoundingClientRect();
      
      // Get all the button elements in the navbar
      const buttons = Array.from(navbarRef.current.querySelectorAll('button'));
      
      // If click is within the navbar area
      if (
        e.clientX >= navRect.left && 
        e.clientX <= navRect.right && 
        e.clientY >= navRect.top && 
        e.clientY <= navRect.bottom
      ) {
        // Find the closest button to the click position
        let closestButton: HTMLButtonElement | null = null;
        let closestDistance = Infinity;
        
        buttons.forEach(button => {
          const buttonRect = button.getBoundingClientRect();
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const buttonCenterY = buttonRect.top + buttonRect.height / 2;
          
          // Calculate distance from click to button center
          const distance = Math.sqrt(
            Math.pow(e.clientX - buttonCenterX, 2) + 
            Math.pow(e.clientY - buttonCenterY, 2)
          );
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestButton = button;
          }
        });
        
        // Click the closest button if found
        if (closestButton) {
          closestButton.click();
        }
      }
    } catch (error) {
      console.error("Error in navbar click handler:", error);
    }
  }, []);
  
  // Set up click handler for the navbar area
  useEffect(() => {
    try {
      if (navbarRef.current) {
        // Add click handler to entire document
        document.addEventListener('click', handleNavbarClick);
        
        return () => {
          document.removeEventListener('click', handleNavbarClick);
        };
      }
    } catch (error) {
      console.error("Error setting up navbar click handler:", error);
    }
  }, [handleNavbarClick]);

  // Fallback render function in case of errors
  const renderNavButton = (item: NavItem, index: number) => {
    try {
      const Icon = item.icon;
      return (
        <button 
          key={item.path || index}
          onClick={() => handleNavigation(item.path)}
          className={`flex flex-col items-center transition-all duration-200 relative ${
            isActive(item.path) 
              ? 'text-cyber-blue cyber-text-glow scale-110' 
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label={item.label}
          style={{ 
            minWidth: '50px',
            padding: '8px 0'
          }}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      );
    } catch (error) {
      console.error(`Error rendering nav button ${index}:`, error);
      return (
        <button 
          key={index}
          className="flex flex-col items-center text-gray-400"
          style={{ minWidth: '50px', padding: '8px 0' }}
        >
          <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
          <span className="text-xs mt-1">Menu</span>
        </button>
      );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center items-center">
      <div 
        ref={navbarRef}
        className="cyber-panel p-2 px-6 rounded-full flex space-x-8 sm:space-x-12 relative bg-black border border-gray-800"
        style={{ touchAction: 'manipulation' }} // Improve touch handling
      >
        {NAV_ITEMS.map((item, index) => renderNavButton(item, index))}
      </div>
    </div>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
