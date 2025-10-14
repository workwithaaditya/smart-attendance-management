'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Upload } from 'lucide-react';
import AcademicCalendar from '@/components/AcademicCalendar';
import HolidayPredictor from '@/components/HolidayPredictor';
import TemplateManager from '@/components/TemplateManager';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'timetable' | 'predictor'>('timetable');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center"
        >
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="Logo" className="w-20 h-20" />
            </div>
            <h1 className="text-4xl font-light text-white mb-2">
              Smart Attendance Management
            </h1>
            <p className="text-gray-400 text-sm">
              Track your attendance
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-300">
                Sign in to continue
              </p>
            </div>
          </div>

          <button
            onClick={() => signIn('google')}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-gray-500 mt-6">
            Your data is private and secure. Each user has isolated data.
          </p>
        </motion.div>
      </div>
    );
  }

  // Authenticated - show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          {/* Logout Button */}
          <div className="absolute top-0 right-0">
            <div className="flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-300 hidden sm:block">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded-md hover:bg-gray-700/50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center mb-3">
            <img src="/logo.svg" alt="Logo" className="w-16 h-16 mb-3" />
            <h1 className="text-5xl font-light tracking-tight text-white">
              Smart Attendance Management
            </h1>
          </div>
          <p className="text-gray-400 text-base font-light">
            Manage your academic schedule and track attendance
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8 gap-4"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 flex gap-1 border border-gray-700/50">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-8 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'timetable'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Timetable & Attendance
            </button>
            <button
              onClick={() => setActiveTab('predictor')}
              className={`px-8 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'predictor'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Attendance Predictor
            </button>
          </div>

          {/* Template Manager Button */}
          <button
            onClick={() => setShowTemplateManager(true)}
            className="bg-purple-600/20 border-2 border-purple-500/50 text-purple-300 hover:bg-purple-600/30 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/10"
          >
            <Upload className="w-5 h-5" />
            Templates
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'timetable' && <AcademicCalendar key={refreshKey} />}
          {activeTab === 'predictor' && <HolidayPredictor />}
        </motion.div>

        {/* Template Manager Modal */}
        <TemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          onImportSuccess={() => {
            setRefreshKey(prev => prev + 1);
            setShowTemplateManager(false);
          }}
        />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pb-8 text-center border-t border-gray-800/50 pt-8"
        >
          <div className="text-gray-500 text-sm space-y-2 font-light">
            
            <p>
              Developed by{' '}
              <a
                href="https://github.com/workwithaaditya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
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
