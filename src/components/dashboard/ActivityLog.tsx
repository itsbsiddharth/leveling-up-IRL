
import React from 'react';
import { useGame } from '@/context/GameContext';
import { Book, Dumbbell, Clock } from 'lucide-react';

const ActivityLog = () => {
  const { activities } = useGame();
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date >= today;
    const isYesterday = date >= yesterday && date < today;
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'study':
        return <Book className="w-5 h-5 text-cyber-blue" />;
      case 'sports':
        return <Dumbbell className="w-5 h-5 text-cyber-purple" />;
      case 'wasted':
        return <Clock className="w-5 h-5 text-cyber-red" />;
      default:
        return null;
    }
  };
  
  if (activities.length === 0) {
    return (
      <div className="cyber-panel p-6 rounded-lg text-center">
        <p className="text-gray-400">No activities logged yet.</p>
        <p className="text-sm text-gray-500 mt-2">Use the timer to track your activities.</p>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Recent Activity</h3>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
        {activities.slice(0, 10).map(activity => (
          <div 
            key={activity.id} 
            className="flex items-center space-x-3 p-3 rounded-md bg-black/30 border border-gray-800"
          >
            <div className="cyber-panel p-2 rounded-full">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium capitalize text-gray-200">
                    {activity.type}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
                
                <div className="text-sm font-medium">
                  {activity.minutes} mins
                </div>
              </div>
              
              {activity.xpGained && (
                <div className="mt-1 text-xs font-medium text-cyber-blue">
                  +{activity.xpGained} XP
                </div>
              )}
              
              {activity.hpLost && (
                <div className="mt-1 text-xs font-medium text-cyber-red">
                  -{activity.hpLost} HP
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
