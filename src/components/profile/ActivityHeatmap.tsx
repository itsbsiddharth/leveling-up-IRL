import React, { useMemo, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { 
  summarizeActivitiesByDay, 
  getDaysInMonth,
  getFirstDayOfMonth,
  getDayKey
} from '@/utils/activityUtils';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ActivityHeatmap = () => {
  const { activities } = useGame();
  const { currentUser } = useAuth();
  
  // Find the user's signup date or default to current month
  const signupDate = useMemo(() => {
    if (currentUser?.createdAt) {
      return new Date(currentUser.createdAt);
    }
    return new Date();
  }, [currentUser]);
  
  // Initialize with current month and year
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  
  // Calculate if we can navigate to the previous month (not before signup date)
  const canGoToPrevMonth = useMemo(() => {
    if (currentDate.year < signupDate.getFullYear()) return false;
    if (currentDate.year === signupDate.getFullYear() && currentDate.month <= signupDate.getMonth()) return false;
    return true;
  }, [currentDate, signupDate]);
  
  // Calculate if we can navigate to the next month (not after current date)
  const canGoToNextMonth = useMemo(() => {
    const now = new Date();
    if (currentDate.year > now.getFullYear()) return false;
    if (currentDate.year === now.getFullYear() && currentDate.month >= now.getMonth()) return false;
    return true;
  }, [currentDate]);
  
  // Go to previous month
  const goToPrevMonth = () => {
    if (!canGoToPrevMonth) return;
    
    setCurrentDate(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  };
  
  // Go to next month
  const goToNextMonth = () => {
    if (!canGoToNextMonth) return;
    
    setCurrentDate(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  };
  
  const activityData = useMemo(() => {
    return summarizeActivitiesByDay(activities);
  }, [activities]);
  
  return (
    <div className="cyber-panel p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-cyber-blue" />
          <h3 className="text-lg font-semibold text-white">Activity</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToPrevMonth}
            disabled={!canGoToPrevMonth}
            className={`cyber-button-small p-1 ${!canGoToPrevMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium text-gray-400">
            {monthNames[currentDate.month]} {currentDate.year}
          </span>
          
          <button 
            onClick={goToNextMonth}
            disabled={!canGoToNextMonth}
            className={`cyber-button-small p-1 ${!canGoToNextMonth ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          <div className="text-xs text-gray-500 grid grid-cols-7 gap-1 mb-1">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: getFirstDayOfMonth(currentDate.year, currentDate.month) }, (_, i) => (
              <div key={`empty-${i}`} className="w-6 h-6"></div>
            ))}
            
            {/* Day cells */}
            {Array.from({ length: getDaysInMonth(currentDate.year, currentDate.month) }, (_, i) => {
              const day = i + 1;
              const dateKey = getDayKey(new Date(currentDate.year, currentDate.month, day));
              const dailySummary = activityData.get(dateKey);
              const isActive = dailySummary && dailySummary.totalMinutes > 0;
              
              const isCurrentDay = dateKey === getDayKey(new Date());
              const borderClass = isCurrentDay ? 'border border-cyber-purple' : '';
              
              return (
                <div
                  key={day}
                  className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${isActive ? 'bg-cyber-blue' : 'bg-gray-800'} ${borderClass} transition-all duration-200 hover:transform hover:scale-110`}
                  title={`${monthNames[currentDate.month]} ${day}, ${currentDate.year}: ${dailySummary?.totalMinutes || 0} minutes`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
