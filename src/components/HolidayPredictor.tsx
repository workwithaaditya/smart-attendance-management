'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Subject {
  id: number;
  name: string;
  color: string;
  totalClasses: number;
  attendedClasses: number;
}

interface TimetableSlot {
  id: number;
  dayOfWeek: string;
  periodStart: number;
  periodEnd: number;
  subjectId: number;
  subject?: Subject;
}

interface AttendanceRecord {
  id: number;
  subjectId: number;
  date: string;
  status: string;
  count: number;
}

const HolidayPredictor: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar state
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [collegeHolidays, setCollegeHolidays] = useState<Set<string>>(new Set());
  const [personalLeaves, setPersonalLeaves] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<any[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, timetableRes, attendanceRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/timetable'),
        fetch('/api/attendance')
      ]);

      if (subjectsRes.ok && timetableRes.ok && attendanceRes.ok) {
        const subjectsData = await subjectsRes.json();
        const timetableData = await timetableRes.json();
        const attendanceData = await attendanceRes.json();
        
        setSubjects(subjectsData);
        setTimetableSlots(timetableData);
        setAttendanceRecords(attendanceData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days for selected month
  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add days from previous month to start on correct day of week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }
    
    // Add all days of current month
    for (let date = 1; date <= lastDay.getDate(); date++) {
      days.push(new Date(year, month, date));
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const toggleCollegeHoliday = (date: Date) => {
    const key = formatDateKey(date);
    const newSet = new Set(collegeHolidays);
    
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
      // Remove from personal leaves if it was there
      const leavesSet = new Set(personalLeaves);
      leavesSet.delete(key);
      setPersonalLeaves(leavesSet);
    }
    
    setCollegeHolidays(newSet);
  };

  const togglePersonalLeave = (date: Date) => {
    const key = formatDateKey(date);
    const newSet = new Set(personalLeaves);
    
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
      // Remove from college holidays if it was there
      const holidaysSet = new Set(collegeHolidays);
      holidaysSet.delete(key);
      setCollegeHolidays(holidaysSet);
    }
    
    setPersonalLeaves(newSet);
  };

  const calculatePredictions = () => {
    if (!targetDate) {
      alert('Please select a target date');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(0, 0, 0, 0);

    if (endDate <= today) {
      alert('Please select a future date');
      return;
    }
    
    const subjectPredictions = subjects.map(subject => {
      const subjectSlots = timetableSlots.filter(slot => slot.subjectId === subject.id);
      
      // Calculate ACTUAL current attendance from records
      const subjectRecords = attendanceRecords.filter(record => record.subjectId === subject.id);
      
      let actualTotalClasses = 0;
      let actualAttendedClasses = 0;
      
      subjectRecords.forEach(record => {
        if (record.status !== 'holiday') {
          const count = record.count || 1;
          actualTotalClasses += count;
          if (record.status === 'present') {
            actualAttendedClasses += count;
          }
        }
      });
      
      // Calculate future classes from today to target date
      let totalClassesInPeriod = 0;
      let attendedClasses = 0;
      
      // Calculate for each day from today to target date
      const currentDate = new Date(today);
      while (currentDate <= endDate) {
        const dateKey = formatDateKey(currentDate);
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Count classes for this subject on this day
        const classesOnDay = subjectSlots.filter(slot => slot.dayOfWeek === dayName).length;
        
        if (classesOnDay > 0) {
          // Check if it's a college holiday or personal leave
          if (collegeHolidays.has(dateKey)) {
            // College holiday - no classes
            // Do nothing
          } else if (personalLeaves.has(dateKey)) {
            // Personal leave - classes happen but you're absent
            totalClassesInPeriod += classesOnDay;
          } else {
            // Normal day - assume present
            totalClassesInPeriod += classesOnDay;
            attendedClasses += classesOnDay;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const currentAttended = actualAttendedClasses;
      const currentTotal = actualTotalClasses;
      const currentPercentage = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;
      
      const futureTotal = currentTotal + totalClassesInPeriod;
      const futureAttended = currentAttended + attendedClasses;
      const futurePercentage = futureTotal > 0 ? (futureAttended / futureTotal) * 100 : 0;
      
      return {
        subject,
        currentAttended,
        currentTotal,
        currentPercentage,
        classesInPeriod: totalClassesInPeriod,
        attendedInPeriod: attendedClasses,
        missedInPeriod: totalClassesInPeriod - attendedClasses,
        futureTotal,
        futureAttended,
        futurePercentage,
        percentageChange: futurePercentage - currentPercentage
      };
    });
    
    setPredictions(subjectPredictions);
    setShowPrediction(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === selectedMonth.getMonth();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getDayClasses = (date: Date): string => {
    const dateKey = formatDateKey(date);
    const isCollegeHoliday = collegeHolidays.has(dateKey);
    const isPersonalLeave = personalLeaves.has(dateKey);
    const currentMonth = isCurrentMonth(date);
    const today = isToday(date);
    
    let classes = 'relative p-2 min-h-[80px] border border-gray-700 cursor-pointer transition-all hover:bg-gray-700/50 ';
    
    if (!currentMonth) {
      classes += 'bg-gray-900/50 text-gray-600 ';
    } else if (isCollegeHoliday) {
      classes += 'bg-red-900/30 border-red-600 ';
    } else if (isPersonalLeave) {
      classes += 'bg-orange-900/30 border-orange-600 ';
    } else {
      classes += 'bg-gray-800 ';
    }
    
    if (today) {
      classes += 'ring-2 ring-blue-500 ';
    }
    
    return classes;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-600/50 rounded-lg p-6"
      >
        <h3 className="text-xl font-bold text-white mb-3">📋 How to Use</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="flex items-start gap-2">
            <span className="text-red-400">🔴</span>
            <div>
              <strong className="text-white">Left Click</strong> - Mark as College Holiday
              <p className="text-xs text-gray-400">College is closed, no classes scheduled</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-400">🟠</span>
            <div>
              <strong className="text-white">Right Click</strong> - Mark as Personal Leave
              <p className="text-xs text-gray-400">You're taking leave, classes will count as absent</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={previousMonth}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <h2 className="text-2xl font-bold text-white">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-gray-400 py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dateKey = formatDateKey(date);
            const isCollegeHoliday = collegeHolidays.has(dateKey);
            const isPersonalLeave = personalLeaves.has(dateKey);
            
            return (
              <div
                key={index}
                className={getDayClasses(date)}
                onClick={() => toggleCollegeHoliday(date)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  togglePersonalLeave(date);
                }}
              >
                <div className="text-sm font-medium text-white mb-1">
                  {date.getDate()}
                </div>
                {isCollegeHoliday && (
                  <div className="text-xs bg-red-600 text-white px-1 py-0.5 rounded">
                    🔴 Holiday
                  </div>
                )}
                {isPersonalLeave && (
                  <div className="text-xs bg-orange-600 text-white px-1 py-0.5 rounded">
                    🟠 Leave
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Target Date Selector */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Target Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-2">
            Predictions will calculate from today to this date, considering marked holidays and leaves
          </p>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculatePredictions}
          disabled={!targetDate}
          className={`w-full mt-6 font-medium py-3 px-6 rounded-lg transition-colors ${
            targetDate
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Calculate Predictions to {targetDate ? new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Selected Date'}
        </button>
      </motion.div>

      {/* Predictions Display */}
      {showPrediction && predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6 space-y-4"
        >
          <h3 className="text-2xl font-semibold text-white mb-4">
            Predictions to {new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {predictions.map((pred, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-5 border-2"
                style={{ borderColor: pred.subject.color || '#3B82F6' }}
              >
                <h4 className="text-xl font-bold text-white mb-3">{pred.subject.name}</h4>
                
                {/* Current vs Future */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Current</p>
                    <p className="text-2xl font-bold text-white">{pred.currentPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">{pred.currentAttended}/{pred.currentTotal}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">By Target Date</p>
                    <p className="text-2xl font-bold" style={{ color: pred.subject.color }}>
                      {pred.futurePercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">{pred.futureAttended}/{pred.futureTotal}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Classes till date:</span>
                    <span className="text-white font-bold">{pred.classesInPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Will attend:</span>
                    <span className="text-green-400 font-bold">{pred.attendedInPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Will miss:</span>
                    <span className="text-red-400 font-bold">{pred.missedInPeriod}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-600">
                    <span className="text-gray-300">Change:</span>
                    <span className={`font-bold ${pred.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pred.percentageChange >= 0 ? '+' : ''}{pred.percentageChange.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Warning */}
                {pred.futurePercentage < 75 && (
                  <div className="mt-3 bg-red-900/30 border border-red-600/50 rounded p-2 text-xs text-red-300">
                    Below 75% threshold
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-600/30 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-white mb-2">Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400">College Holidays</p>
                <p className="text-2xl font-bold text-red-400">{collegeHolidays.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Personal Leaves</p>
                <p className="text-2xl font-bold text-orange-400">{personalLeaves.size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Working Days</p>
                <p className="text-2xl font-bold text-green-400">
                  {new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() - collegeHolidays.size}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HolidayPredictor;
