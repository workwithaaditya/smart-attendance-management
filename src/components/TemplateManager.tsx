'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Download, Upload, Trash2, Users, Calendar, Book, Filter } from 'lucide-react';

interface TemplateSubject {
  id: number;
  name: string;
  code: string | null;
  color: string;
  timetableSlots: {
    id: number;
    dayOfWeek: string;
    periodStart: number;
    periodEnd: number;
    merged: boolean;
  }[];
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  semester: string | null;
  section: string | null;
  batch: string | null;
  isPublic: boolean;
  importCount: number;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  templateSubjects: TemplateSubject[];
  _count: {
    templateSubjects: number;
    templateTimetable: number;
  };
}

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  onQuickShare?: () => void;
}

export default function TemplateManager({ isOpen, onClose, onImportSuccess, onQuickShare }: TemplateManagerProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-templates' | 'create'>('browse');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showQuickShareModal, setShowQuickShareModal] = useState(false);
  
  // Create template form
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateSemester, setTemplateSemester] = useState('');
  const [templateSection, setTemplateSection] = useState('');
  const [templateBatch, setTemplateBatch] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, activeTab, searchQuery, semesterFilter, sectionFilter, batchFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'my-templates') params.append('myTemplates', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (sectionFilter) params.append('section', sectionFilter);
      if (batchFilter) params.append('batch', batchFilter);

      const response = await fetch(`/api/templates?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        alert(data.error || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          semester: templateSemester,
          section: templateSection,
          batch: templateBatch,
          isPublic,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Template created successfully! 🎉');
        setTemplateName('');
        setTemplateDescription('');
        setTemplateSemester('');
        setTemplateSection('');
        setTemplateBatch('');
        setActiveTab('my-templates');
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickShare = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          semester: templateSemester,
          section: templateSection,
          batch: templateBatch,
          isPublic: true, // Always public for quick share
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Template shared successfully! 🎉\nYour classmates can now find it by searching.');
        setShowQuickShareModal(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateSemester('');
        setTemplateSection('');
        setTemplateBatch('');
        setActiveTab('my-templates');
      } else {
        alert(data.error || 'Failed to share template');
      }
    } catch (error) {
      console.error('Error sharing template:', error);
      alert('Failed to share template');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTemplate = async (templateId: number, clearExisting: boolean) => {
    const confirmed = clearExisting
      ? confirm('This will delete all your current subjects and timetable. Continue?')
      : confirm('Import this template? Existing subjects with same names will be updated.');

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearExisting }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message || 'Template imported successfully!');
        onImportSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to import template');
      }
    } catch (error) {
      console.error('Error importing template:', error);
      alert('Failed to import template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Delete this template? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Template deleted successfully');
        fetchTemplates();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };
    return days[day.toLowerCase()] || day;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-6 h-6 text-purple-400" />
                  Template Manager
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Share and import timetable templates
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Quick Share Button */}
            <button
              onClick={() => setShowQuickShareModal(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Share My Timetable as Template
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-800/50">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'browse'
                  ? 'text-purple-400 border-purple-400 bg-gray-700/30'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700/20'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                Browse Templates
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my-templates')}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'my-templates'
                  ? 'text-purple-400 border-purple-400 bg-gray-700/30'
                  : 'text-gray-400 border-transparent hover:text-gray-300 hover:bg-gray-700/20'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Book className="w-4 h-4" />
                My Templates
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Browse Templates */}
            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Semester (e.g., 5th)"
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g., A)"
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Batch (e.g., A1)"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Templates Grid */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No templates found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-gray-700 rounded-lg p-5 hover:bg-gray-650 transition-colors cursor-pointer"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                            {template.description && (
                              <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-sm">
                            <Download className="w-4 h-4" />
                            <span>{template.importCount}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {template.semester && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {template.semester}
                            </span>
                          )}
                          {template.section && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                              Section {template.section}
                            </span>
                          )}
                          {template.batch && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                              Batch {template.batch}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-gray-400">
                            <span className="flex items-center gap-1">
                              <Book className="w-4 h-4" />
                              {template._count.templateSubjects} subjects
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {template._count.templateTimetable} slots
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportTemplate(template.id, false);
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Import
                          </button>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-600 flex items-center gap-2 text-xs text-gray-500">
                          {template.user.image ? (
                            <img src={template.user.image} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span>by {template.user.name || 'Anonymous'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Templates */}
            {activeTab === 'my-templates' && (
              <div className="space-y-4">
                {/* Template Limit Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-blue-300 text-sm">
                    <strong>Templates:</strong> {templates.length} / 5 (Maximum limit to save space)
                  </p>
                  {templates.length >= 5 && (
                    <span className="text-yellow-400 text-xs">Limit reached! Delete some to create new ones.</span>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading your templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">You haven't created any templates yet</p>
                    <p className="text-gray-500 text-sm mb-4">
                      Click the "Share My Timetable as Template" button above to create one
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-gray-700 rounded-lg p-5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                            {template.description && (
                              <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {template.semester && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {template.semester}
                            </span>
                          )}
                          {template.section && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                              Section {template.section}
                            </span>
                          )}
                          {template.batch && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                              Batch {template.batch}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            template.isPublic 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {template.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Book className="w-4 h-4" />
                              {template._count.templateSubjects} subjects
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {template.importCount} imports
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Template */}
            {activeTab === 'create' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Note:</strong> This will create a template from your current subjects and timetable.
                    Make sure you've set up everything correctly before creating a template.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 font-medium mb-2">
                      Template Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 5th Sem ISE Section A Batch A1"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      placeholder="Add details about this timetable..."
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Semester
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 5th Sem"
                        value={templateSemester}
                        onChange={(e) => setTemplateSemester(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., A"
                        value={templateSection}
                        onChange={(e) => setTemplateSection(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Batch
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., A1"
                        value={templateBatch}
                        onChange={(e) => setTemplateBatch(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isPublic" className="text-gray-300">
                      Make this template public (other users can import it)
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateTemplate}
                    disabled={loading || !templateName.trim()}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Template'}
                  </button>
                  <button
                    onClick={() => {
                      setTemplateName('');
                      setTemplateDescription('');
                      setTemplateSemester('');
                      setTemplateSection('');
                      setTemplateBatch('');
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Share Modal */}
          {showQuickShareModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowQuickShareModal(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Share Your Timetable</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Create a template from your current subjects and schedule
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuickShareModal(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p className="text-blue-300 text-sm">
                      <strong>Note:</strong> This will create a public template from your current subjects and timetable.
                      Make sure you've set up everything correctly before sharing.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Template Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 5th Sem ISE Section A Batch A1"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        placeholder="Add details about this timetable..."
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">
                          Semester
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 5th"
                          value={templateSemester}
                          onChange={(e) => setTemplateSemester(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">
                          Section
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., A"
                          value={templateSection}
                          onChange={(e) => setTemplateSection(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">
                          Batch
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., A1"
                          value={templateBatch}
                          onChange={(e) => setTemplateBatch(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex gap-3">
                  <button
                    onClick={handleQuickShare}
                    disabled={loading || !templateName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                  >
                    {loading ? 'Sharing...' : 'Share Template'}
                  </button>
                  <button
                    onClick={() => setShowQuickShareModal(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Template Preview Modal */}
          {selectedTemplate && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70" onClick={() => setSelectedTemplate(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedTemplate.name}</h3>
                    {selectedTemplate.description && (
                      <p className="text-gray-400 mt-1">{selectedTemplate.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {selectedTemplate.templateSubjects.map((subject) => (
                      <div key={subject.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <h4 className="text-lg font-semibold text-white">{subject.name}</h4>
                          {subject.code && (
                            <span className="text-gray-400 text-sm">({subject.code})</span>
                          )}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                            const slots = subject.timetableSlots.filter(
                              (slot) => getDayName(slot.dayOfWeek) === day
                            );
                            return (
                              <div key={day} className="text-center">
                                <div className="text-xs text-gray-400 mb-1">{day}</div>
                                <div className="space-y-1">
                                  {slots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className="bg-gray-600 rounded px-2 py-1 text-xs text-white"
                                    >
                                      {slot.periodStart}-{slot.periodEnd}
                                    </div>
                                  ))}
                                  {slots.length === 0 && (
                                    <div className="text-gray-500 text-xs">-</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-700 flex gap-3">
                  <button
                    onClick={() => handleImportTemplate(selectedTemplate.id, false)}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Import (Keep Existing)
                  </button>
                  <button
                    onClick={() => handleImportTemplate(selectedTemplate.id, true)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Import (Replace All)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
