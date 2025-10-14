'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  merged: boolean;
  subjectId: number;
  subject: Subject;
}

interface AttendanceRecord {
  id: number;
  subjectId: number;
  date: string;
  status: 'present' | 'absent' | 'holiday';
  count: number; // Number of periods for this subject on this date
  subject: Subject;
}

interface AcademicCalendarProps {
  onSubjectUpdate?: (subjects: Subject[]) => void;
}

const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ onSubjectUpdate }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{day: string, period: number} | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showDateAttendance, setShowDateAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSubjectGraphs, setShowSubjectGraphs] = useState(false);

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const dayLabels = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat'
  };

  // Fetch subjects and timetable data
  useEffect(() => {
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
          
          if (onSubjectUpdate) {
            onSubjectUpdate(subjectsData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [onSubjectUpdate]);

  const fetchData = async () => {
    try {
      const [subjectsRes, timetableRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/timetable')
      ]);

      if (subjectsRes.ok && timetableRes.ok) {
        const subjectsData = await subjectsRes.json();
        const timetableData = await timetableRes.json();
        
        setSubjects(subjectsData);
        setTimetableSlots(timetableData);
        
        if (onSubjectUpdate) {
          onSubjectUpdate(subjectsData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Get slot for specific day and period
  const getSlotForCell = (day: string, period: number): TimetableSlot | null => {
    return timetableSlots.find(slot => 
      slot.dayOfWeek === day && 
      period >= slot.periodStart && 
      period <= slot.periodEnd
    ) || null;
  };

  // Check if cell is part of a merged slot but not the starting cell
  const isCellHidden = (day: string, period: number): boolean => {
    const slot = getSlotForCell(day, period);
    return Boolean(slot?.merged && slot.periodStart !== period);
  };

  // Get span for merged cells
  const getCellSpan = (day: string, period: number): number => {
    const slot = getSlotForCell(day, period);
    if (slot?.merged && slot.periodStart === period) {
      return slot.periodEnd - slot.periodStart + 1;
    }
    return 1;
  };

  // Handle cell click
  const handleCellClick = (day: string, period: number) => {
    const existingSlot = getSlotForCell(day, period);
    
    if (existingSlot) {
      // If clicking on an existing slot, offer to edit or remove
      setSelectedCell({ day, period });
    } else {
      // If empty cell, show subject selection
      setSelectedCell({ day, period });
    }
  };

  // Assign subject to cell
  const assignSubject = async (subjectId: number, merge: boolean = false) => {
    if (!selectedCell) return;

    const { day, period } = selectedCell;
    let periodEnd = period;

    // If merging, find the next period
    if (merge && period < 10) {
      const nextSlot = getSlotForCell(day, period + 1);
      if (!nextSlot) {
        periodEnd = period + 1;
      }
    }

    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek: day,
          periodStart: period,
          periodEnd,
          subjectId,
          merged: merge
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setSelectedCell(null);
      }
    } catch (error) {
      console.error('Error assigning subject:', error);
    }
  };

  // Remove subject from cell
  const removeSubject = async (day: string, period: number) => {
    try {
      const response = await fetch(`/api/timetable?dayOfWeek=${day}&period=${period}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setSelectedCell(null);
      }
    } catch (error) {
      console.error('Error removing subject:', error);
    }
  };

  // Add new subject
  const addSubject = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, color }),
      });

      if (response.ok) {
        await fetchData();
        setShowSubjectForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add subject. Please try again.');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Failed to add subject. Please try again.');
    }
  };

  // Update subject
  const updateSubject = async (id: number, updates: Partial<Subject>) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        await fetchData();
        setEditingSubject(null);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  // Update subject attendance
  const updateSubjectAttendance = async (subjectId: number, totalClasses: number, attendedClasses: number) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subjectId,
          totalClasses,
          attendedClasses,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  // Delete subject
  const deleteSubject = async (subjectId: number) => {
    if (!confirm('Are you sure you want to delete this subject? This will also remove it from the timetable.')) {
      return;
    }

    try {
      const response = await fetch('/api/subjects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: subjectId }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  // Calculate attendance percentage
  const getAttendancePercentage = (subject: Subject) => {
    if (subject.totalClasses === 0) return 0;
    return Math.round((subject.attendedClasses / subject.totalClasses) * 100);
  };

  // Add or update attendance record
  const updateAttendanceRecord = async (subjectId: number, date: Date, status: 'present' | 'absent' | 'holiday') => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          date: date.toISOString(),
          status,
        }),
      });

      if (response.ok) {
        // Refresh attendance records
        const attendanceRes = await fetch('/api/attendance');
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          setAttendanceRecords(attendanceData);
        }
      }
    } catch (error) {
      console.error('Failed to update attendance record:', error);
    }
  };

  // Get attendance records for a specific subject
  const getSubjectAttendanceData = (subjectId: number) => {
    return attendanceRecords
      .filter(record => record.subjectId === subjectId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Generate chart data for a specific subject's attendance over time
  const getSubjectChartData = (subjectId: number) => {
    const records = getSubjectAttendanceData(subjectId);
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!subject || records.length === 0) {
      return null;
    }

    // Show only recent 15 records for cleaner visualization
    // User can still see full data in the stats cards
    const recentRecords = records.slice(-15);

    // Calculate cumulative attendance percentage over time
    let presentCount = 0;
    let totalCount = 0;
    
    // First, count all records before the recent ones for accurate percentage
    // IMPORTANT: Use record.count field to count actual periods, not just records!
    records.slice(0, -15).forEach(record => {
      if (record.status !== 'holiday') {
        const periodCount = (record as any).count || 1;
        totalCount += periodCount;
        if (record.status === 'present') {
          presentCount += periodCount;
        }
      }
    });
    
    const labels: string[] = [];
    const data: number[] = [];

    recentRecords.forEach(record => {
      if (record.status !== 'holiday') {
        const periodCount = (record as any).count || 1;
        totalCount += periodCount;
        if (record.status === 'present') {
          presentCount += periodCount;
        }
        
        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100 * 10) / 10 : 0;
        labels.push(new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        data.push(percentage);
      }
    });

    return {
      labels,
      datasets: [
        {
          label: `${subject.name} Attendance %`,
          data,
          borderColor: subject.color,
          backgroundColor: `${subject.color}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: subject.color,
          pointBorderColor: subject.color,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  };

  // Generate chart data for attendance trends
  const getChartData = () => {
    const labels = subjects.map(s => s.name);
    const data = subjects.map(s => getAttendancePercentage(s));
    
    return {
      labels,
      datasets: [
        {
          label: 'Attendance Percentage',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: subjects.map(s => s.color),
          pointBorderColor: subjects.map(s => s.color),
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
        },
      },
      title: {
        display: true,
        text: 'Subject-wise Attendance Trends',
        color: '#ffffff',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Smart Attendance Management</h2>
          <p className="text-gray-300 mt-1">Create your timetable and track attendance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDateAttendance(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setShowSubjectGraphs(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Subject Graphs
          </button>
          <button
            onClick={() => setShowSubjectForm(true)}
            className="btn-primary"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Subjects List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Subjects ({subjects.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-3 rounded-lg border-2"
              style={{ borderColor: subject.color, backgroundColor: `${subject.color}15` }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-sm font-medium text-gray-200 truncate">
                  {subject.name}
                </span>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSubject(subject);
                  }}
                  className="text-gray-400 hover:text-blue-400 text-xs p-1"
                  title="Edit Subject"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSubject(subject.id);
                  }}
                  className="text-gray-400 hover:text-red-400 text-xs p-1"
                  title="Delete Subject"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Attendance Chart */}
      {subjects.length > 0 && subjects.some(s => s.totalClasses > 0) && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Attendance Analytics</h3>
          <div className="h-64 mb-4">
            <Line data={getChartData()} options={chartOptions} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="p-4 rounded-lg border border-gray-600 bg-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm font-medium text-gray-200">{subject.name}</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      getAttendancePercentage(subject) >= 75
                        ? 'text-green-400'
                        : getAttendancePercentage(subject) >= 60
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {getAttendancePercentage(subject)}%
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {subject.attendedClasses} / {subject.totalClasses} classes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Weekly Timetable</h3>
        <div className="min-w-full">
          {/* Header Row - Periods */}
          <div className="grid grid-cols-11 gap-1 mb-1">
            <div className="p-2 text-center font-medium text-gray-400 text-sm">Day</div>
            {periods.map((period) => (
              <div key={period} className="p-2 text-center font-medium text-gray-300 text-sm">
                P{period}
              </div>
            ))}
          </div>

          {/* Timetable Rows - Days */}
          {daysOfWeek.map((day) => (
            <div key={day} className="grid grid-cols-11 gap-1 mb-1">
              {/* Day Label */}
              <div className="p-3 text-center font-medium text-gray-400 bg-gray-700 rounded text-sm">
                {dayLabels[day as keyof typeof dayLabels]}
              </div>

              {/* Period Cells */}
              {periods.map((period) => {
                if (isCellHidden(day, period)) {
                  return null; // Hidden cell (part of merged slot)
                }

                const slot = getSlotForCell(day, period);
                const span = getCellSpan(day, period);

                return (
                  <motion.div
                    key={`${day}-${period}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-2 h-12 rounded cursor-pointer border-2 transition-all duration-200
                      ${span > 1 ? `col-span-${span}` : ''}
                      ${slot
                        ? 'border-opacity-60 shadow-sm'
                        : 'border-gray-600 hover:border-blue-400 bg-gray-700/50 hover:bg-gray-600/50'
                      }
                    `}
                    style={{
                      backgroundColor: slot ? `${slot.subject.color}20` : undefined,
                      borderColor: slot ? slot.subject.color : '#4B5563',
                      gridColumn: span > 1 ? `span ${span}` : undefined
                    }}
                    onClick={() => handleCellClick(day, period)}
                  >
                    {slot && (
                      <div className="flex flex-col h-full justify-center items-center">
                        <div
                          className="text-xs font-medium text-center truncate w-full"
                          style={{ color: slot.subject.color }}
                        >
                          {slot.subject.name}
                        </div>
                        {slot.merged && (
                          <div className="text-xs text-gray-500 mt-1">
                            P{slot.periodStart}-{slot.periodEnd}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Cell Action Modal */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedCell(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold mb-4 text-white">
                {dayLabels[selectedCell.day as keyof typeof dayLabels]} - Period {selectedCell.period}
              </h4>

              {getSlotForCell(selectedCell.day, selectedCell.period) ? (
                <div className="space-y-3">
                  <p className="text-gray-300">Current assignment:</p>
                  <div className="p-3 rounded-lg bg-gray-700">
                    <div className="font-medium">
                      {getSlotForCell(selectedCell.day, selectedCell.period)?.subject.name}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => removeSubject(selectedCell.day, selectedCell.period)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setSelectedCell(null)}
                      className="flex-1 px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300 text-lg font-medium">Select a subject:</p>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => assignSubject(subject.id)}
                        className="flex items-center space-x-4 p-5 rounded-lg border-2 border-gray-600 hover:bg-gray-700 transition-colors text-left"
                        style={{ borderColor: subject.color }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold text-lg">{subject.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Attendance Modal */}
      <AnimatePresence>
        {showDateAttendance && (
          <DailyAttendanceModal
            subjects={subjects}
            timetableSlots={timetableSlots}
            attendanceRecords={attendanceRecords}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClose={() => setShowDateAttendance(false)}
            onUpdateAttendance={updateAttendanceRecord}
          />
        )}
      </AnimatePresence>

      {/* Subject Graphs Modal */}
      <AnimatePresence>
        {showSubjectGraphs && (
          <SubjectGraphsModal
            subjects={subjects}
            attendanceRecords={attendanceRecords}
            onClose={() => setShowSubjectGraphs(false)}
            getSubjectChartData={getSubjectChartData}
          />
        )}
      </AnimatePresence>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showSubjectForm && (
          <SubjectFormModal
            onClose={() => setShowSubjectForm(false)}
            onSubmit={addSubject}
          />
        )}
      </AnimatePresence>

      {/* Edit Subject Modal */}
      <AnimatePresence>
        {editingSubject && (
          <SubjectEditModal
            subject={editingSubject}
            onClose={() => setEditingSubject(null)}
            onSubmit={updateSubject}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Subject Form Modal Component
const SubjectFormModal: React.FC<{
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
}> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-lg font-semibold mb-4">Add New Subject</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex space-x-2 mb-2">
              {predefinedColors.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setColor(clr)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === clr ? 'border-gray-600' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: clr }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Add Subject
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Subject Edit Modal Component
const SubjectEditModal: React.FC<{
  subject: Subject;
  onClose: () => void;
  onSubmit: (id: number, updates: Partial<Subject>) => void;
}> = ({ subject, onClose, onSubmit }) => {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(subject.id, { name: name.trim(), color });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-lg font-semibold mb-4">Edit Subject</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex space-x-2 mb-2">
              {predefinedColors.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => setColor(clr)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === clr ? 'border-gray-600' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: clr }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Update Subject
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Daily Attendance Modal Component
const DailyAttendanceModal: React.FC<{
  subjects: Subject[];
  timetableSlots: TimetableSlot[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
  onUpdateAttendance: (subjectId: number, date: Date, status: 'present' | 'absent' | 'holiday') => void;
}> = ({ subjects, timetableSlots, attendanceRecords, selectedDate, onDateChange, onClose, onUpdateAttendance }) => {
  
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportData, setBulkImportData] = useState({
    subjectId: '',
    dates: '',
    status: 'present' as 'present' | 'absent' | 'holiday'
  });
  
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const getSubjectsForDay = (dayName: string) => {
    const daySlots = timetableSlots.filter(slot => slot.dayOfWeek === dayName);
    const subjectIds = [...new Set(daySlots.map(slot => slot.subjectId))];
    return subjects.filter(subject => subjectIds.includes(subject.id));
  };

  const getAttendanceForDate = (subjectId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords.find(record => 
      record.subjectId === subjectId && record.date.split('T')[0] === dateStr
    );
  };

  const handleClearRecords = async (subjectId: string, status: 'present' | 'absent' | 'holiday' | 'all') => {
    const subject = subjects.find(s => s.id === parseInt(subjectId));
    if (!subject) return;

    const statusText = status === 'all' ? 'ALL records' : 
                      status === 'present' ? 'Present records' :
                      status === 'absent' ? 'Absent records' : 'Holiday records';
    
    const confirmed = confirm(`Delete ${statusText} for ${subject.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/attendance?subjectId=${subjectId}&status=${status}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete records');
      }

      const count = result.count || 0;
      alert(`Successfully deleted ${count} record(s) (${statusText}) for ${subject.name}`);
      
      // Reload page to refresh data (prevents auto-marking current date)
      window.location.reload();
    } catch (error) {
      console.error('Error deleting records:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Could not delete records'}`);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportData.subjectId || !bulkImportData.dates.trim()) {
      alert('Please select a subject and enter dates');
      return;
    }

    try {
      // Parse dates - supports multiple formats
      const dateLines = bulkImportData.dates.split('\n').filter(line => line.trim());
      const parsedDates: Date[] = [];

      for (const line of dateLines) {
        // Remove extra spaces and split by common separators
        const cleanLine = line.trim();
        
        // Try to extract date in various formats
        // Format: DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
        const dateMatch = cleanLine.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
        
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          if (!isNaN(date.getTime())) {
            parsedDates.push(date);
          }
        }
      }

      if (parsedDates.length === 0) {
        alert('No valid dates found. Use DD-MM-YYYY format.');
        return;
      }

      // NEW PERIOD-WISE LOGIC:
      // Each date upload creates ONE record, auto-assigned to next unmarked period
      // If you upload same date multiple times, each creates a separate period record
      const subjectId = parseInt(bulkImportData.subjectId);
      let totalImported = 0;
      let failedDates: string[] = [];
      
      console.log('Starting period-wise bulk import:', {
        subjectId,
        totalDates: parsedDates.length,
        status: bulkImportData.status
      });
      
      // Process each date (including duplicates)
      for (let i = 0; i < parsedDates.length; i++) {
        const date = parsedDates[i];
        const dateStr = date.toISOString().split('T')[0];
        
        console.log(`Importing ${dateStr} (${i+1}/${parsedDates.length})`);
        
        try {
          // PRIORITY: BULK UPLOAD MODE
          // forceBulkCreate flag ensures EVERY upload creates EXACTLY one record
          // This guarantees accurate counting: 32 uploads = 32 records
          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subjectId,
              date: date.toISOString(),
              status: bulkImportData.status,
              forceBulkCreate: true  // ALWAYS create new record in bulk mode
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Failed to import date');
          }
          
          totalImported++;
        } catch (err) {
          console.error(`Failed to import ${dateStr}:`, err);
          if (!failedDates.includes(dateStr)) {
            failedDates.push(dateStr);
          }
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Show success message
      if (failedDates.length > 0) {
        alert(`Imported ${totalImported} records. ${failedDates.length} failed: ${failedDates.slice(0, 5).join(', ')}${failedDates.length > 5 ? '...' : ''}`);
      } else {
        alert(`Successfully imported ${totalImported} records.`);
      }
      
      // Reload page to refresh all data (prevents auto-marking current date)
      window.location.reload();
      
      setBulkImportData({ subjectId: '', dates: '', status: 'present' });
      setShowBulkImport(false);
    } catch (error) {
      console.error('Bulk import error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to import dates.'}`);
    }
  };

  const dayName = getDayName(selectedDate);
  const subjectsForDay = getSubjectsForDay(dayName);
  const displaySubjects = showAllSubjects ? subjects : subjectsForDay;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Daily Attendance Tracker</h3>
            <p className="text-sm text-gray-400 mt-1">Mark attendance for any date to build historical data</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkImport(!showBulkImport)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showBulkImport 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              📋 {showBulkImport ? 'Single Entry' : 'Bulk Import'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {showBulkImport ? (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border-2 border-blue-600/50 rounded-lg p-6">
              <h4 className="text-xl font-bold text-white mb-4">📋 Bulk Import Attendance</h4>
              
              <div className="space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Subject *
                  </label>
                  <select
                    value={bulkImportData.subjectId}
                    onChange={(e) => setBulkImportData({...bulkImportData, subjectId: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a subject...</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attendance Status *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setBulkImportData({...bulkImportData, status: 'present'})}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        bulkImportData.status === 'present'
                          ? 'bg-green-600 text-white shadow-lg scale-105'
                          : 'bg-gray-700 hover:bg-green-600 text-gray-200'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => setBulkImportData({...bulkImportData, status: 'absent'})}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        bulkImportData.status === 'absent'
                          ? 'bg-red-600 text-white shadow-lg scale-105'
                          : 'bg-gray-700 hover:bg-red-600 text-gray-200'
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => setBulkImportData({...bulkImportData, status: 'holiday'})}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        bulkImportData.status === 'holiday'
                          ? 'bg-yellow-600 text-white shadow-lg scale-105'
                          : 'bg-gray-700 hover:bg-yellow-600 text-gray-200'
                      }`}
                    >
                      Holiday
                    </button>
                  </div>
                </div>

                {/* Clear Records Section */}
                <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-red-400 mb-3">
                    Clear Records
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => bulkImportData.subjectId && handleClearRecords(bulkImportData.subjectId, 'present')}
                      disabled={!bulkImportData.subjectId}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        bulkImportData.subjectId
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Clear All Present
                    </button>
                    <button
                      onClick={() => bulkImportData.subjectId && handleClearRecords(bulkImportData.subjectId, 'absent')}
                      disabled={!bulkImportData.subjectId}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        bulkImportData.subjectId
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Clear All Absent
                    </button>
                    <button
                      onClick={() => bulkImportData.subjectId && handleClearRecords(bulkImportData.subjectId, 'holiday')}
                      disabled={!bulkImportData.subjectId}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        bulkImportData.subjectId
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Clear All Holiday
                    </button>
                    <button
                      onClick={() => bulkImportData.subjectId && handleClearRecords(bulkImportData.subjectId, 'all')}
                      disabled={!bulkImportData.subjectId}
                      className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                        bulkImportData.subjectId
                          ? 'bg-red-700 hover:bg-red-800 text-white font-bold'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Clear ALL Records
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Select a subject before clearing records.
                  </p>
                </div>

                {/* Dates Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter Dates (one per line) *
                  </label>
                  <textarea
                    value={bulkImportData.dates}
                    onChange={(e) => setBulkImportData({...bulkImportData, dates: e.target.value})}
                    placeholder="19-08-2025&#10;21-08-2025&#10;22-08-2025&#10;24-08-2025"
                    rows={12}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    DD-MM-YYYY format, one per line
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleBulkImport}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Import {bulkImportData.dates.split('\n').filter(l => l.trim()).length} Records
                  </button>
                  <button
                    onClick={() => setBulkImportData({ subjectId: '', dates: '', status: 'present' })}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Select Date</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              <Calendar
                onChange={(value) => onDateChange(value as Date)}
                value={selectedDate}
                className="react-calendar-dark"
                maxDate={new Date()}
                calendarType="gregory"
                locale="en-IN"
              />
            </div>
          </div>

          {/* Subjects for selected date */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                {selectedDate.toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h4>
              <button
                onClick={() => setShowAllSubjects(!showAllSubjects)}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg transition-colors"
              >
                {showAllSubjects ? `Scheduled (${subjectsForDay.length})` : `All Subjects (${subjects.length})`}
              </button>
            </div>
            
            {displaySubjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">No subjects {showAllSubjects ? '' : 'scheduled for this day'}.</p>
                {!showAllSubjects && subjects.length > 0 && (
                  <button
                    onClick={() => setShowAllSubjects(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Show all subjects anyway
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {displaySubjects.map((subject) => {
                  const attendanceRecord = getAttendanceForDate(subject.id, selectedDate);
                  const isScheduled = subjectsForDay.some(s => s.id === subject.id);
                  
                  return (
                    <div key={subject.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <div>
                            <span className="text-lg font-semibold text-white">{subject.name}</span>
                            {!isScheduled && showAllSubjects && (
                              <span className="ml-2 text-xs text-gray-500">(Not scheduled)</span>
                            )}
                          </div>
                        </div>
                        {attendanceRecord && (
                          <div className="flex items-center space-x-2">
                            {attendanceRecord.count && attendanceRecord.count > 1 && (
                              <span className="text-xs font-medium text-gray-400 bg-gray-600 px-2 py-1 rounded">
                                {attendanceRecord.count} periods
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              attendanceRecord.status === 'present' 
                                ? 'bg-green-600 text-white'
                                : attendanceRecord.status === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-yellow-600 text-white'
                            }`}>
                              {attendanceRecord.status.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onUpdateAttendance(subject.id, selectedDate, 'present')}
                          className={`py-2 px-3 rounded-lg font-medium transition-all ${
                            attendanceRecord?.status === 'present'
                              ? 'bg-green-600 text-white shadow-lg scale-105'
                              : 'bg-gray-600 hover:bg-green-600 text-gray-200 hover:text-white'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => onUpdateAttendance(subject.id, selectedDate, 'absent')}
                          className={`py-2 px-3 rounded-lg font-medium transition-all ${
                            attendanceRecord?.status === 'absent'
                              ? 'bg-red-600 text-white shadow-lg scale-105'
                              : 'bg-gray-600 hover:bg-red-600 text-gray-200 hover:text-white'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => onUpdateAttendance(subject.id, selectedDate, 'holiday')}
                          className={`py-2 px-3 rounded-lg font-medium transition-all ${
                            attendanceRecord?.status === 'holiday'
                              ? 'bg-yellow-600 text-white shadow-lg scale-105'
                              : 'bg-gray-600 hover:bg-yellow-600 text-gray-200 hover:text-white'
                          }`}
                        >
                          Holiday
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {displaySubjects.length > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Showing {displaySubjects.length} subject{displaySubjects.length !== 1 ? 's' : ''}
                {showAllSubjects ? ' (All)' : ` (Scheduled for ${dayName})`}
              </div>
            )}
          </div>
        </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Subject Graphs Modal Component
const SubjectGraphsModal: React.FC<{
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  getSubjectChartData: (subjectId: number) => any;
}> = ({ subjects, attendanceRecords, onClose, getSubjectChartData }) => {
  const [showOverview, setShowOverview] = useState(true);
  const [predictDate, setPredictDate] = useState('');
  const [predictResults, setPredictResults] = useState<any[]>([]);
  
  // Calculate statistics for a subject
  const getSubjectStats = (subjectId: number) => {
    const records = attendanceRecords.filter(r => r.subjectId === subjectId);
    const presentRecords = records.filter(r => r.status === 'present');
    const absentRecords = records.filter(r => r.status === 'absent');
    
    const totalPresent = presentRecords.reduce((sum, r) => sum + ((r as any).count || 1), 0);
    const totalAbsent = absentRecords.reduce((sum, r) => sum + ((r as any).count || 1), 0);
    const totalClasses = totalPresent + totalAbsent;
    const percentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
    
    return {
      totalPresent,
      totalAbsent,
      totalClasses,
      percentage,
      recordCount: records.filter(r => r.status !== 'holiday').length
    };
  };

  // Predict attendance for a specific date
  const handlePredictToDate = () => {
    if (!predictDate) {
      alert('Please select a date');
      return;
    }

    const targetDate = new Date(predictDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate <= today) {
      alert('Please select a future date');
      return;
    }

    const results = subjects.map(subject => {
      const stats = getSubjectStats(subject.id);
      const currentPercentage = stats.percentage;
      
      // Calculate working days between now and target date (excluding Sundays)
      let workingDays = 0;
      const current = new Date(today);
      while (current < targetDate) {
        current.setDate(current.getDate() + 1);
        if (current.getDay() !== 0) { // Not Sunday
          workingDays++;
        }
      }

      // Estimate classes needed (assume 1 class per working day)
      const estimatedClasses = workingDays;
      
      // Scenarios
      const allPresent = ((stats.totalPresent + estimatedClasses) / (stats.totalClasses + estimatedClasses)) * 100;
      const allAbsent = (stats.totalPresent / (stats.totalClasses + estimatedClasses)) * 100;
      const currentTrend = currentPercentage; // If trend continues
      
      // Classes needed to reach 75%
      const classesFor75 = stats.totalClasses > 0
        ? Math.max(0, Math.ceil((0.75 * stats.totalClasses - stats.totalPresent) / 0.25))
        : 0;

      return {
        subject,
        current: currentPercentage,
        allPresent,
        allAbsent,
        estimatedClasses,
        classesFor75,
        workingDays,
        stats
      };
    });

    setPredictResults(results);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
          font: {
            size: 13,
          },
        },
      },
      title: {
        display: true,
        color: '#ffffff',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-white">Attendance Analytics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setShowOverview(true)}
            className={`px-4 py-2 font-medium transition-colors ${
              showOverview
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setShowOverview(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !showOverview
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Detailed Trends
          </button>
        </div>

        {/* Content */}
        {showOverview ? (
          <div className="space-y-6">
            {/* All Subjects Gauge Overview */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">All Subjects at a Glance</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map(subject => {
                  const stats = getSubjectStats(subject.id);
                  const percentage = stats.percentage;
                  const strokeDasharray = `${percentage * 2.51} 251`;
                  
                  return (
                    <div key={subject.id} className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="relative w-24 h-24 mx-auto mb-2">
                        <svg className="transform -rotate-90 w-24 h-24">
                          {/* Background circle */}
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="rgba(75, 85, 99, 0.3)"
                            strokeWidth="8"
                            fill="none"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke={
                              percentage >= 75 ? '#10b981' :
                              percentage >= 60 ? '#f59e0b' : '#ef4444'
                            }
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-lg font-bold ${
                            percentage >= 75 ? 'text-green-400' :
                            percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="text-sm font-medium text-white truncate">{subject.name}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {stats.totalPresent}/{stats.totalClasses}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Predict to Date */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Predict Attendance to Date</h4>
              <div className="flex gap-3 mb-4">
                <input
                  type="date"
                  value={predictDate}
                  onChange={(e) => setPredictDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <button
                  onClick={handlePredictToDate}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Predict
                </button>
              </div>

              {predictResults.length > 0 && (
                <div className="space-y-3">
                  {predictResults.map(result => (
                    <div key={result.subject.id} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: result.subject.color }}
                          />
                          <span className="font-medium text-white">{result.subject.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">
                          {result.workingDays} working days • ~{result.estimatedClasses} classes
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Current</div>
                          <div className={`text-lg font-bold ${
                            result.current >= 75 ? 'text-green-400' :
                            result.current >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {result.current.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">All Present</div>
                          <div className={`text-lg font-bold ${
                            result.allPresent >= 75 ? 'text-green-400' :
                            result.allPresent >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {result.allPresent.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">All Absent</div>
                          <div className={`text-lg font-bold ${
                            result.allAbsent >= 75 ? 'text-green-400' :
                            result.allAbsent >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {result.allAbsent.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Need for 75%</div>
                          <div className="text-lg font-bold text-blue-400">
                            {result.classesFor75} classes
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">{subjects.map((subject) => {
            const chartData = getSubjectChartData(subject.id);
            const stats = getSubjectStats(subject.id);
            
            return (
              <div key={subject.id} className="bg-gray-700/50 rounded-xl p-6 border-2 border-gray-600 hover:border-gray-500 transition-colors snap-start min-h-[600px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full shadow-lg"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h4 className="text-2xl font-bold text-white">{subject.name}</h4>
                  </div>
                  <div className={`text-3xl font-bold ${
                    stats.percentage >= 75 ? 'text-green-400' : 
                    stats.percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {stats.percentage.toFixed(1)}%
                  </div>
                </div>

                {/* Statistics Cards - Sleek & Minimal */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-semibold text-green-400">{stats.totalPresent}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Present</div>
                  </div>
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-semibold text-red-400">{stats.totalAbsent}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Absent</div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-semibold text-blue-400">{stats.totalClasses}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Total</div>
                  </div>
                </div>
                
                {chartData && stats.recordCount > 0 ? (
                  <div>
                    <div className="h-96 bg-gray-800/50 rounded-lg p-4 mb-4">
                      <Line data={chartData} options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            ...chartOptions.plugins.title,
                            text: `${subject.name} - Recent Attendance Trend (Last ${chartData.labels.length} classes)`,
                          },
                        },
                        scales: {
                          ...chartOptions.scales,
                          y: {
                            ...chartOptions.scales.y,
                            min: (() => {
                              // Calculate dynamic Y-axis minimum based on data range
                              const minValue = Math.min(...chartData.datasets[0].data);
                              const maxValue = Math.max(...chartData.datasets[0].data);
                              const range = maxValue - minValue;
                              
                              // If attendance is consistently high (range small and all values > 70)
                              if (minValue >= 70 && range <= 30) {
                                return Math.max(0, Math.floor(minValue / 10) * 10 - 10); // Round down to nearest 10, then subtract 10
                              }
                              // If attendance is in mid range (50-80)
                              else if (minValue >= 50 && maxValue <= 90) {
                                return Math.max(0, Math.floor(minValue / 10) * 10 - 10);
                              }
                              // Default to 0 for low or highly variable attendance
                              return 0;
                            })(),
                          },
                        },
                      }} />
                    </div>
                    {stats.recordCount > 15 && (
                      <div className="text-center text-sm text-gray-400 mb-4">
                        Showing recent {chartData.labels.length} classes • Total: {stats.recordCount} records
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">
                    <p>No attendance data available</p>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AcademicCalendar;