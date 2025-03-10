
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Timer, 
  Trophy, 
  User 
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center items-center">
      <div className="cyber-panel p-2 px-6 rounded-full flex space-x-8 sm:space-x-12">
        <Link to="/" className={`flex flex-col items-center transition-all duration-300 ${isActive('/') ? 'text-cyber-blue cyber-text-glow scale-110' : 'text-gray-400 hover:text-white'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/timer" className={`flex flex-col items-center transition-all duration-300 ${isActive('/timer') ? 'text-cyber-blue cyber-text-glow scale-110' : 'text-gray-400 hover:text-white'}`}>
          <Timer className="w-6 h-6" />
          <span className="text-xs mt-1">Timer</span>
        </Link>
        
        <Link to="/achievements" className={`flex flex-col items-center transition-all duration-300 ${isActive('/achievements') ? 'text-cyber-blue cyber-text-glow scale-110' : 'text-gray-400 hover:text-white'}`}>
          <Trophy className="w-6 h-6" />
          <span className="text-xs mt-1">Ranks</span>
        </Link>
        
        <Link to="/profile" className={`flex flex-col items-center transition-all duration-300 ${isActive('/profile') ? 'text-cyber-blue cyber-text-glow scale-110' : 'text-gray-400 hover:text-white'}`}>
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
