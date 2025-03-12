
import React from 'react';
import { useGame } from '@/context/GameContext';
import { BookOpen, Dumbbell, Clock, Heart, Award } from 'lucide-react';
import { isToday } from '@/utils/activityUtils';

const ActivityLog = () => {
  const { activities } = useGame();
  
  // Filter activities to show only today's
  const todayActivities = activities.filter(activity => isToday(activity.timestamp));
  
  // Format the date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getActivityIcon = (type: string, isHighQuality?: boolean) => {
    switch(type) {
      case 'study':
        return (
          <div className="relative">
            <BookOpen className="w-5 h-5 text-cyber-blue" />
            {isHighQuality && (
              <div className="absolute -top-1 -right-1">
                <Award className="w-3 h-3 text-yellow-400" />
              </div>
            )}
          </div>
        );
      case 'sports':
        return (
          <div className="relative">
            <Dumbbell className="w-5 h-5 text-cyber-purple" />
            {isHighQuality && (
              <div className="absolute -top-1 -right-1">
                <Award className="w-3 h-3 text-yellow-400" />
              </div>
            )}
          </div>
        );
      case 'wasted':
        return <Clock className="w-5 h-5 text-cyber-red" />;
      case 'recovery':
        return <Heart className="w-5 h-5 text-green-400" />;
      default:
        return null;
    }
  };
  
  if (todayActivities.length === 0) {
    return (
      <div className="cyber-panel p-6 rounded-lg text-center">
        <p className="text-gray-400">No activities logged today.</p>
        <p className="text-sm text-gray-500 mt-2">Use the timer to track your activities.</p>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Today's Activity</h3>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
        {todayActivities.map(activity => (
          <div 
            key={activity.id} 
            className="flex items-center space-x-3 p-3 rounded-md bg-black/30 border border-gray-800"
          >
            <div className={`cyber-panel p-2 rounded-full ${
              activity.type === 'study' ? 'border-cyber-blue/50' :
              activity.type === 'sports' ? 'border-cyber-purple/50' :
              activity.type === 'wasted' ? 'border-cyber-red/50' :
              'border-green-400/50'
            }`}>
              {getActivityIcon(activity.type, activity.isHighQuality)}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium capitalize text-gray-200">
                    {activity.type} {activity.isHighQuality && '(high quality)'}
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
              
              {activity.hpGained && (
                <div className="mt-1 text-xs font-medium text-green-400">
                  +{activity.hpGained} HP
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
