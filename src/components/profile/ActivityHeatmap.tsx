
import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { 
  getActivityLevel, 
  summarizeActivitiesByDay, 
  getMonthsBetweenDates,
  getDaysInMonth,
  getFirstDayOfMonth,
  getDayKey
} from '@/utils/activityUtils';
import { Calendar } from 'lucide-react';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ActivityHeatmap = () => {
  const { activities } = useGame();
  
  const activityData = useMemo(() => {
    return summarizeActivitiesByDay(activities);
  }, [activities]);
  
  // Find the earliest activity date or default to 3 months ago if no activities
  const earliestDate = useMemo(() => {
    if (activities.length === 0) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return threeMonthsAgo;
    }
    
    // Find the earliest activity date
    const dates = activities.map(a => new Date(a.timestamp));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [activities]);
  
  // Get months to display in the heatmap
  const monthsToDisplay = useMemo(() => {
    return getMonthsBetweenDates(earliestDate);
  }, [earliestDate]);
  
  const getActivityColorClass = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0: return 'bg-gray-800';
      case 1: return 'bg-cyber-blue/20';
      case 2: return 'bg-cyber-blue/40';
      case 3: return 'bg-cyber-blue/70';
      case 4: return 'bg-cyber-blue';
    }
  };
  
  return (
    <div className="cyber-panel p-6 rounded-lg">
      <div className="flex items-center space-x-3 mb-4">
        <Calendar className="w-5 h-5 text-cyber-blue" />
        <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          {monthsToDisplay.map(({ year, month }) => {
            const daysInMonth = getDaysInMonth(year, month);
            const firstDayOfMonth = getFirstDayOfMonth(year, month);
            
            // Create array of days
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            
            return (
              <div key={`${year}-${month}`} className="mb-4">
                <div className="text-sm font-medium text-gray-400 mb-2">
                  {monthNames[month]} {year}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before the first day of month */}
                  {Array.from({ length: firstDayOfMonth }, (_, i) => (
                    <div key={`empty-${i}`} className="w-4 h-4"></div>
                  ))}
                  
                  {/* Day cells */}
                  {days.map(day => {
                    const dateKey = getDayKey(new Date(year, month, day));
                    const dailySummary = activityData.get(dateKey);
                    const activityLevel = dailySummary 
                      ? getActivityLevel(dailySummary.totalMinutes)
                      : 0;
                    
                    const isCurrentDay = dateKey === getDayKey(new Date());
                    const borderClass = isCurrentDay ? 'border border-cyber-purple' : '';
                    
                    return (
                      <div
                        key={day}
                        className={`w-4 h-4 rounded-sm ${getActivityColorClass(activityLevel)} ${borderClass} transition-all duration-200 hover:transform hover:scale-150 cursor-pointer`}
                        title={`${monthNames[month]} ${day}, ${year}: ${dailySummary?.totalMinutes || 0} minutes`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-end items-center space-x-2 mt-2">
        <div className="text-xs text-gray-400">Less</div>
        <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
        <div className="w-3 h-3 rounded-sm bg-cyber-blue/20"></div>
        <div className="w-3 h-3 rounded-sm bg-cyber-blue/40"></div>
        <div className="w-3 h-3 rounded-sm bg-cyber-blue/70"></div>
        <div className="w-3 h-3 rounded-sm bg-cyber-blue"></div>
        <div className="text-xs text-gray-400">More</div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
