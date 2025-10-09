// Utility functions for attendance calculations and data management

import { Subject, WeeklySchedule, PredictionResult, DayOfWeek } from '@/types';

/**
 * Calculate current attendance percentage for a subject
 */
export const calculateAttendancePercentage = (attended: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Get attendance status color class based on percentage
 */
export const getAttendanceStatusClass = (percentage: number): string => {
  if (percentage >= 90) return 'attendance-high';
  if (percentage >= 75) return 'attendance-medium';
  return 'attendance-low';
};

/**
 * Get day of week from date
 */
export const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] as DayOfWeek;
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse date from YYYY-MM-DD string
 */
export const parseDateString = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

/**
 * Check if a date is a weekend (Sunday)
 */
export const isWeekend = (date: Date): boolean => {
  return date.getDay() === 0; // Sunday
};

/**
 * Get subjects scheduled for a specific day
 */
export const getSubjectsForDay = (
  date: Date,
  schedule: WeeklySchedule,
  subjects: Subject[]
): Subject[] => {
  const dayOfWeek = getDayOfWeek(date);
  const subjectIds = schedule[dayOfWeek] || [];
  return subjects.filter(subject => subjectIds.indexOf(subject.id) !== -1);
};

/**
 * Calculate future attendance predictions
 */
export const calculatePredictions = (
  subjects: Subject[],
  schedule: WeeklySchedule,
  dateMarks: { [date: string]: 'absent' | 'holiday' },
  startDate: Date,
  endDate: Date
): PredictionResult[] => {
  const predictions: PredictionResult[] = [];

  subjects.forEach(subject => {
    let futureTotal = 0;
    let futureAttended = 0;

    // Iterate through each day in the prediction period
    const current = new Date(startDate);
    while (current <= endDate) {
      // Skip weekends
      if (!isWeekend(current)) {
        const dateString = formatDateString(current);
        const daySubjects = getSubjectsForDay(current, schedule, [subject]);
        
        // If this subject has classes on this day
        if (daySubjects.length > 0) {
          futureTotal++;
          
          // Check if marked as absent or holiday
          const mark = dateMarks[dateString];
          if (mark !== 'absent' && mark !== 'holiday') {
            futureAttended++; // Assume present if not marked otherwise
          }
        }
      }
      
      current.setDate(current.getDate() + 1);
    }

    const currentPercentage = calculateAttendancePercentage(
      subject.attendedClasses,
      subject.totalClasses
    );

    const totalAttended = subject.attendedClasses + futureAttended;
    const totalClasses = subject.totalClasses + futureTotal;
    const predictedPercentage = calculateAttendancePercentage(totalAttended, totalClasses);

    predictions.push({
      subjectId: subject.id,
      subjectName: subject.name,
      currentPercentage,
      predictedPercentage,
      percentageChange: predictedPercentage - currentPercentage,
      currentAttended: subject.attendedClasses,
      currentTotal: subject.totalClasses,
      futureAttended,
      futureTotal,
    });
  });

  return predictions;
};

/**
 * Generate date range for calendar display
 */
export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Export data as JSON
 */
export const exportAsJSON = (data: any, filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data as CSV
 */
export const exportAsCSV = (data: PredictionResult[], filename: string): void => {
  const headers = [
    'Subject',
    'Current Attendance %',
    'Predicted Attendance %',
    'Change %',
    'Current Attended',
    'Current Total',
    'Future Attended',
    'Future Total'
  ];
  
  const rows = data.map(item => [
    item.subjectName,
    item.currentPercentage.toString(),
    item.predictedPercentage.toString(),
    item.percentageChange.toString(),
    item.currentAttended.toString(),
    item.currentTotal.toString(),
    item.futureAttended.toString(),
    item.futureTotal.toString()
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Storage utilities for localStorage
 */
export const storage = {
  save: (key: string, data: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  load: (key: string): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
};