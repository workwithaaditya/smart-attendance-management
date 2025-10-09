'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AcademicCalendar from '@/components/AcademicCalendar';

export default function HomePage() {
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

        {/* Academic Calendar Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AcademicCalendar />
        </motion.div>
      </div>
    </div>
  );
}
