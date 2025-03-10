
import { Activity } from '@/context/GameContext';

export type DailyActivitySummary = {
  date: string; // ISO date string (YYYY-MM-DD)
  totalMinutes: number;
  studyMinutes: number;
  sportsMinutes: number;
  wastedMinutes: number;
  xpGained: number;
  hpLost: number;
};

export const getDayKey = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If already in ISO format, extract just the date part
    if (date.includes('T')) {
      return date.split('T')[0];
    }
    return date;
  }
  // Convert Date to YYYY-MM-DD format
  return date.toISOString().split('T')[0];
};

export const isToday = (dateString: string): boolean => {
  const today = getDayKey(new Date());
  const dateKey = getDayKey(dateString);
  return today === dateKey;
};

export const summarizeActivitiesByDay = (activities: Activity[]): Map<string, DailyActivitySummary> => {
  const summaryMap = new Map<string, DailyActivitySummary>();
  
  activities.forEach(activity => {
    const dateKey = getDayKey(activity.timestamp);
    
    // Get or create summary for this day
    const existingSummary = summaryMap.get(dateKey) || {
      date: dateKey,
      totalMinutes: 0,
      studyMinutes: 0,
      sportsMinutes: 0,
      wastedMinutes: 0,
      xpGained: 0,
      hpLost: 0
    };
    
    // Update the summary
    existingSummary.totalMinutes += activity.minutes;
    
    if (activity.type === 'study') {
      existingSummary.studyMinutes += activity.minutes;
    } else if (activity.type === 'sports') {
      existingSummary.sportsMinutes += activity.minutes;
    } else if (activity.type === 'wasted') {
      existingSummary.wastedMinutes += activity.minutes;
    }
    
    if (activity.xpGained) {
      existingSummary.xpGained += activity.xpGained;
    }
    
    if (activity.hpLost) {
      existingSummary.hpLost += activity.hpLost;
    }
    
    // Store updated summary
    summaryMap.set(dateKey, existingSummary);
  });
  
  return summaryMap;
};

export const getActivityLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
  // Define thresholds for activity levels (in minutes)
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
};

export const getMonthsBetweenDates = (startDate: Date, endDate: Date = new Date()) => {
  const months: { year: number; month: number }[] = [];
  
  const currentDate = new Date(startDate);
  currentDate.setDate(1); // Start from the first day of the month
  
  while (currentDate <= endDate) {
    months.push({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth()
    });
    
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return months;
};

export const getDaysInMonth = (year: number, month: number) => {
  // Month is 0-based (0 = January, 11 = December)
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  return new Date(year, month, 1).getDay();
};
