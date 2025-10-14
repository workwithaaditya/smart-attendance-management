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
          className="bg-gray-800 rounded-lg p-6 space-y-6"
        >
          <h3 className="text-xl font-semibold text-white">
            Predictions to {new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          
          {/* Individual Subject Cards - Minimal Single Color */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((pred, index) => (
              <div
                key={index}
                className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-white">{pred.subject.name}</h4>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Current</div>
                    <div className="text-lg font-bold text-white">{pred.currentPercentage.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">By Target Date</span>
                    <span className="font-semibold text-white">{pred.futurePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Will Attend</span>
                    <span className="text-white">{pred.attendedInPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Will Miss</span>
                    <span className="text-white">{pred.missedInPeriod}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-600">
                    <span className="text-gray-400">Change</span>
                    <span className="font-semibold text-white">
                      {pred.percentageChange >= 0 ? '+' : ''}{pred.percentageChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Summary Chart */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Overall Summary</h4>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Total Classes</div>
                <div className="text-2xl font-bold text-white">
                  {predictions.reduce((sum, p) => sum + p.classesInPeriod, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Will Attend</div>
                <div className="text-2xl font-bold text-white">
                  {predictions.reduce((sum, p) => sum + p.attendedInPeriod, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Will Miss</div>
                <div className="text-2xl font-bold text-white">
                  {predictions.reduce((sum, p) => sum + p.missedInPeriod, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Avg Change</div>
                <div className="text-2xl font-bold text-white">
                  {predictions.length > 0 
                    ? ((predictions.reduce((sum, p) => sum + p.percentageChange, 0) / predictions.length) >= 0 ? '+' : '')
                    + (predictions.reduce((sum, p) => sum + p.percentageChange, 0) / predictions.length).toFixed(1)
                    : '0.0'}%
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-3">
              {predictions.map((pred, index) => {
                const maxPercentage = 100;
                const currentWidth = (pred.currentPercentage / maxPercentage) * 100;
                const futureWidth = (pred.futurePercentage / maxPercentage) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 font-medium">{pred.subject.name}</span>
                      <span className="text-gray-400">
                        {pred.currentPercentage.toFixed(1)}% → {pred.futurePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Current Bar */}
                      <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-gray-500 h-full flex items-center justify-end px-2 transition-all duration-500"
                          style={{ width: `${currentWidth}%` }}
                        >
                          {currentWidth > 15 && (
                            <span className="text-xs font-semibold text-white">
                              {pred.currentPercentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">→</span>
                      {/* Future Bar */}
                      <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full flex items-center justify-end px-2 transition-all duration-500"
                          style={{ width: `${futureWidth}%` }}
                        >
                          {futureWidth > 15 && (
                            <span className="text-xs font-semibold text-white">
                              {pred.futurePercentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">Total Classes</th>
                  <th className="px-4 py-3 text-center">Will Attend</th>
                  <th className="px-4 py-3 text-center">Will Miss</th>
                  <th className="px-4 py-3 text-center">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {predictions.map((pred, index) => (
                  <tr key={index} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{pred.subject.name}</td>
                    <td className="px-4 py-3 text-center text-white">{pred.classesInPeriod}</td>
                    <td className="px-4 py-3 text-center text-white">{pred.attendedInPeriod}</td>
                    <td className="px-4 py-3 text-center text-white">{pred.missedInPeriod}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-white">
                        {pred.percentageChange >= 0 ? '↑ +' : '↓ '}{Math.abs(pred.percentageChange).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-600/30 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400 mb-1">College Holidays</div>
                <div className="text-2xl font-bold text-white">{Array.from(collegeHolidays).length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Personal Leaves</div>
                <div className="text-2xl font-bold text-white">{Array.from(personalLeaves).length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Working Days</div>
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    const today = new Date();
                    const target = new Date(targetDate);
                    let days = 0;
                    const current = new Date(today);
                    while (current <= target) {
                      if (current.getDay() !== 0) days++;
                      current.setDate(current.getDate() + 1);
                    }
                    return days - Array.from(collegeHolidays).length;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HolidayPredictor;
