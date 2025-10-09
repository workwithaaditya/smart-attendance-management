// Types for the attendance tracking application

export interface Subject {
  id: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
}

export interface WeeklySchedule {
  [key: string]: string[]; // day of week -> array of subject IDs
}

export interface AttendanceData {
  subjects: Subject[];
  schedule: WeeklySchedule;
  dateMarks: {
    [date: string]: 'absent' | 'holiday'; // date string -> mark type
  };
}

export interface PredictionResult {
  subjectId: string;
  subjectName: string;
  currentPercentage: number;
  predictedPercentage: number;
  percentageChange: number;
  currentAttended: number;
  currentTotal: number;
  futureAttended: number;
  futureTotal: number;
}

export interface CalendarDay {
  date: Date;
  subjects: string[];
  mark?: 'absent' | 'holiday';
  isWeekend?: boolean;
  isPast?: boolean;
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface AppStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
}