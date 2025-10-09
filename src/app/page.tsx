'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AcademicCalendar from '@/components/AcademicCalendar';
import HolidayPredictor from '@/components/HolidayPredictor';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'timetable' | 'predictor'>('timetable');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Smart Attendance Management
          </h1>
          <p className="text-gray-300 text-lg">
            Manage your academic schedule and track attendance with intelligent insights
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="bg-gray-800 rounded-lg p-1 flex gap-2">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'timetable'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              📅 Timetable & Attendance
            </button>
            <button
              onClick={() => setActiveTab('predictor')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'predictor'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🔮 Holiday & Attendance Predictor
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'timetable' && <AcademicCalendar />}
          {activeTab === 'predictor' && <HolidayPredictor />}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pb-6 text-center"
        >
          <div className="text-gray-500 text-sm space-y-1">
            <p>
              Made with {' '}
              <span className="text-gray-400">Claude Sonnet</span>
            </p>
            <p>
              Created by{' '}
              <a
                href="https://github.com/workwithaaditya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors underline"
              >
                @workwithaaditya
              </a>
            </p>
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
