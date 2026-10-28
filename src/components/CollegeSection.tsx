/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Building2,
  CalendarCheck,
  ArrowRight,
  BookOpen,
  Filter,
  Check,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  CollegeRecord,
  CollegeRecordType,
  CollegeRecordStatus,
  CollegePermanentInfo,
  CollegeEvent,
  CollegeEventType,
  Priority,
  TaskItem,
} from '../types';
import { getTodayDateString, getTomorrowDateString } from '../utils/storage';
import { ClockPickerModal } from './ClockPickerModal';

interface CollegeSectionProps {
  records: CollegeRecord[];
  info: CollegePermanentInfo;
  events: CollegeEvent[];
  onSaveRecord: (record: Omit<CollegeRecord, 'id' | 'createdAt'>, editingId?: string) => void;
  onDeleteRecord: (id: string) => void;
  onToggleRecordStatus: (id: string) => void;
  onSaveInfo: (info: CollegePermanentInfo) => void;
  onSaveEvent: (event: Omit<CollegeEvent, 'id' | 'createdAt'>, editingId?: string) => void;
  onDeleteEvent: (id: string) => void;
  onCreateFollowUpTask: (record: CollegeRecord) => void;
}

const RECORD_TYPES: CollegeRecordType[] = [
  'Lecture',
  'Study',
  'Assignment',
  'Missed Class',
  'Revision',
  'Lab / Practical',
  'Project',
  'Exam Prep',
  'College Event',
  'Administrative',
  'Other',
];

const EVENT_TYPES: CollegeEventType[] = [
  'Exam',
  'Assignment Deadline',
  'College Fest',
  'Practical Exam',
  'Project Presentation',
  'Fee Submission',
  'Important Meeting',
  'Other',
];

export const CollegeSection: React.FC<CollegeSectionProps> = ({
  records,
  info,
  events,
  onSaveRecord,
  onDeleteRecord,
  onToggleRecordStatus,
  onSaveInfo,
  onSaveEvent,
  onDeleteEvent,
  onCreateFollowUpTask,
}) => {
  // Main Subsections: 'routine' (Overview & Daily Routine) vs 'permanent' (Permanent Info & Events) vs 'weekly-report'
  const [activeTab, setActiveTab] = useState<'routine' | 'permanent' | 'report'>('routine');

  // Record Form Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CollegeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<CollegeRecord | null>(null);

  // Form fields for record
  const [recTitle, setRecTitle] = useState('');
  const [recType, setRecType] = useState<CollegeRecordType>('Lecture');
  const [recSubject, setRecSubject] = useState('');
  const [recDate, setRecDate] = useState(getTodayDateString());
  const [recStartTime, setRecStartTime] = useState('');
  const [recEndTime, setRecEndTime] = useState('');
  const [recNotes, setRecNotes] = useState('');
  const [recStatus, setRecStatus] = useState<CollegeRecordStatus>('Planned');
  const [recPriority, setRecPriority] = useState<Priority>('Medium');
  const [clockTarget, setClockTarget] = useState<'start' | 'end' | null>(null);

  // Filter for Routine
  const [routineStatusFilter, setRoutineStatusFilter] = useState<string>('all');
  const [routineTypeFilter, setRoutineTypeFilter] = useState<string>('all');

  // Permanent Info Edit state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempInfo, setTempInfo] = useState<CollegePermanentInfo>(info);

  // Event Form Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CollegeEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<CollegeEventType>('Exam');
  const [eventDate, setEventDate] = useState(getTodayDateString());
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventReminder, setEventReminder] = useState(true);
  const [isEventClockOpen, setIsEventClockOpen] = useState(false);

  // Filter for Events
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Report Date Range
  const [reportRange, setReportRange] = useState<'this-week' | 'all'>('this-week');

  const today = getTodayDateString();

  // Reset or populate Record Modal
  const openNewRecordModal = (prefillType?: CollegeRecordType) => {
    setEditingRecord(null);
    setRecTitle('');
    setRecType(prefillType || 'Lecture');
    setRecSubject('');
    setRecDate(today);
    setRecStartTime('09:00 AM');
    setRecEndTime('10:30 AM');
    setRecNotes('');
    setRecStatus(prefillType === 'Missed Class' ? 'Missed' : 'Planned');
    setRecPriority('Medium');
    setIsRecordModalOpen(true);
  };

  const openEditRecordModal = (record: CollegeRecord) => {
    setEditingRecord(record);
    setRecTitle(record.title);
    setRecType(record.recordType);
    setRecSubject(record.subject || '');
    setRecDate(record.date);
    setRecStartTime(record.startTime || '');
    setRecEndTime(record.endTime || '');
    setRecNotes(record.notes || '');
    setRecStatus(record.status);
    setRecPriority(record.priority || 'Medium');
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    onSaveRecord(
      {
        title: recTitle.trim(),
        recordType: recType,
        subject: recSubject.trim() || undefined,
        date: recDate,
        startTime: recStartTime || undefined,
        endTime: recEndTime || undefined,
        notes: recNotes.trim() || undefined,
        status: recStatus,
        priority: recPriority,
        linkedTaskId: editingRecord?.linkedTaskId,
        followUpCreated: editingRecord?.followUpCreated,
      },
      editingRecord ? editingRecord.id : undefined
    );
    setIsRecordModalOpen(false);
  };

  // Event modal handlers
  const openNewEventModal = () => {
    setEditingEvent(null);
    setEventTitle('');
    setEventType('Exam');
    setEventDate(today);
    setEventTime('10:00 AM');
    setEventLocation('');
    setEventDesc('');
    setEventReminder(true);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: CollegeEvent) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventType(ev.eventType);
    setEventDate(ev.date);
    setEventTime(ev.time || '');
    setEventLocation(ev.location || '');
    setEventDesc(ev.description || '');
    setEventReminder(!!ev.reminder);
    setIsEventModalOpen(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    onSaveEvent(
      {
        title: eventTitle.trim(),
        eventType,
        date: eventDate,
        time: eventTime || undefined,
        location: eventLocation.trim() || undefined,
        description: eventDesc.trim() || undefined,
        reminder: eventReminder,
        status: editingEvent ? editingEvent.status : 'Upcoming',
      },
      editingEvent ? editingEvent.id : undefined
    );
    setIsEventModalOpen(false);
  };

  // Filter Routine Records
  const filteredRecords = records.filter((r) => {
    if (routineStatusFilter !== 'all' && r.status !== routineStatusFilter) return false;
    if (routineTypeFilter !== 'all' && r.recordType !== routineTypeFilter) return false;
    return true;
  });

  // Events filtered & sorted
  const sortedEvents = [...events]
    .filter((ev) => eventTypeFilter === 'all' || ev.eventType === eventTypeFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  // College Weekly Report Calculation
  const totalPlannedCollege = records.length;
  const completedCollege = records.filter((r) => r.status === 'Completed').length;
  const pendingCollege = records.filter((r) => r.status === 'Pending' || r.status === 'Planned').length;
  const missedClasses = records.filter((r) => r.status === 'Missed').length;
  const collegeCompletionPct =
    totalPlannedCollege > 0 ? Math.round((completedCollege / totalPlannedCollege) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            College & Academics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage daily classes, lectures, missed revisions, college information, and exams.
          </p>
        </div>

        {/* Subsection Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'routine'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Routine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permanent')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'permanent'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Info & Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'report'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Report
          </button>
        </div>
      </div>

      {/* SUBSECTION 1: OVERVIEW & DAILY ROUTINE */}
      {activeTab === 'routine' && (
        <div className="space-y-5 animate-fade-in">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={routineTypeFilter}
                onChange={(e) => setRoutineTypeFilter(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                <option value="all">All Activity Types</option>
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(['all', 'Planned', 'Pending', 'Completed', 'Missed'] as string[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRoutineStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                      routineStatusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Record Missed Class button */}
              <button
                type="button"
                onClick={() => openNewRecordModal('Missed Class')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Record Missed Class</span>
              </button>

              {/* Add Activity CTA */}
              <button
                type="button"
                onClick={() => openNewRecordModal()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            </div>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
                <BookOpen className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No college activities found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add lectures, study sessions, assignments, or record missed classes to track your academic progress.
                </p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isMissed = rec.status === 'Missed';
                const isCompleted = rec.status === 'Completed';

                return (
                  <div
                    key={rec.id}
                    className={`p-4 bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isMissed
                        ? 'border-rose-200 bg-rose-50/30'
                        : isCompleted
                        ? 'border-slate-100 bg-slate-50/50 opacity-80'
                        : 'border-slate-100 hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Type indicator + Content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleRecordStatus(rec.id)}
                        className="mt-0.5 shrink-0 focus:outline-hidden"
                        title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : isMissed ? (
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm font-bold text-slate-800 truncate ${
                              isCompleted ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {rec.title}
                          </h4>

                          {/* Unboxed record type */}
                          <span className="text-xs font-semibold text-indigo-600">
                            {rec.recordType}
                          </span>

                          {/* Subject if provided */}
                          {rec.subject && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs font-medium text-slate-600">
                                {rec.subject}
                              </span>
                            </>
                          )}

                          {/* Status unboxed badge */}
                          <span className="text-slate-300">·</span>
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                              isMissed
                                ? 'text-rose-600'
                                : isCompleted
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>

                        {rec.notes && (
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{rec.notes}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {rec.date === today ? 'Today' : rec.date}
                          </span>
                          {(rec.startTime || rec.endTime) && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-mono text-slate-500">
                                <Clock className="w-3 h-3" />
                                {rec.startTime} {rec.endTime ? `— ${rec.endTime}` : ''}
                              </span>
                            </>
                          )}
                          {rec.priority && (
                            <>
                              <span>·</span>
                              <span className="text-slate-500">{rec.priority} Priority</span>
                            </>
                          )}
                        </div>

                        {/* Missed Class Follow-Up Action */}
                        {isMissed && (
                          <div className="pt-1.5 flex items-center gap-2">
                            {rec.followUpCreated ? (
                              <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Follow-up revision task scheduled in Daily Tasks
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onCreateFollowUpTask(rec)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                              >
                                <ArrowRight className="w-3 h-3" />
                                Create Revision Task in Daily Tasks
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditRecordModal(rec)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(rec)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBSECTION 2: PERMANENT COLLEGE INFORMATION & EVENTS */}
      {activeTab === 'permanent' && (
        <div className="space-y-6 animate-fade-in">
          {/* Permanent College Details Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Permanent College Information
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Student ID, semester, faculty mentors, and academic enrollment details.
                  </p>
                </div>
              </div>

              {!isEditingInfo ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempInfo(info);
                    setIsEditingInfo(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Information
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSaveInfo(tempInfo);
                      setIsEditingInfo(false);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Information
                  </button>
                </div>
              )}
            </div>

            {/* View or Edit fields */}
            {isEditingInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">College Name</label>
                  <input
                    type="text"
                    value={tempInfo.collegeName || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, collegeName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Student Name</label>
                  <input
                    type="text"
                    value={tempInfo.studentName || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, studentName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Course / Degree</label>
                  <input
                    type="text"
                    value={tempInfo.course || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, course: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={tempInfo.department || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Semester</label>
                  <input
                    type="text"
                    value={tempInfo.semester || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, semester: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={tempInfo.rollNumber || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, rollNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">College ID Number</label>
                  <input
                    type="text"
                    value={tempInfo.collegeIdNumber || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, collegeIdNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Class / Section</label>
                  <input
                    type="text"
                    value={tempInfo.classSection || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, classSection: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Faculty / Mentor</label>
                  <input
                    type="text"
                    value={tempInfo.facultyMentor || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, facultyMentor: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Official Website</label>
                  <input
                    type="text"
                    value={tempInfo.officialWebsite || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, officialWebsite: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">College Address</label>
                  <input
                    type="text"
                    value={tempInfo.address || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, address: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-slate-600 font-medium mb-1">Additional Notes</label>
                  <textarea
                    rows={2}
                    value={tempInfo.additionalNotes || ''}
                    onChange={(e) => setTempInfo({ ...tempInfo, additionalNotes: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">College</span>
                  <span className="font-semibold text-slate-800">
                    {info.collegeName || 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Student</span>
                  <span className="font-semibold text-slate-800">
                    {info.studentName || 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Course & Dept</span>
                  <span className="font-semibold text-slate-800">
                    {info.course ? `${info.course} (${info.department || ''})` : 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Semester & Section</span>
                  <span className="font-semibold text-slate-800">
                    {info.semester ? `${info.semester} · ${info.classSection || ''}` : 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Roll & ID</span>
                  <span className="font-semibold font-mono text-slate-800">
                    {info.rollNumber ? `${info.rollNumber} / ${info.collegeIdNumber || ''}` : 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Mentor</span>
                  <span className="font-semibold text-slate-800">
                    {info.facultyMentor || 'Not specified'}
                  </span>
                </div>
                {info.address && (
                  <div className="p-3 bg-slate-50 rounded-2xl sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Address</span>
                    <span className="font-medium text-slate-700">{info.address}</span>
                  </div>
                )}
                {info.officialWebsite && (
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <span className="text-slate-400 block text-[11px]">Website</span>
                    <a
                      href={info.officialWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-indigo-600 hover:underline truncate block"
                    >
                      {info.officialWebsite}
                    </a>
                  </div>
                )}
                {info.additionalNotes && (
                  <div className="p-3 bg-slate-50 rounded-2xl sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 block text-[11px]">Notes</span>
                    <span className="font-medium text-slate-700">{info.additionalNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* College Exams, Events, and Important Dates */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Exams, Events & Important Dates
                </h3>
                <p className="text-[11px] text-slate-400">
                  Track upcoming examination schedules, fest dates, project deadlines, and fee submissions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Events</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={openNewEventModal}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-2.5">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No upcoming college events or examinations recorded.
                </div>
              ) : (
                sortedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700">{ev.eventType}</span>
                        <span className="text-slate-300">·</span>
                        <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                      </div>
                      {ev.description && (
                        <p className="text-xs text-slate-500">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-700">{ev.date}</span>
                        {ev.time && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-slate-600">{ev.time}</span>
                          </>
                        )}
                        {ev.location && (
                          <>
                            <span>·</span>
                            <span>{ev.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openEditEventModal(ev)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventToDelete(ev)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBSECTION 3: COLLEGE WEEKLY REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">College Weekly Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Summary of planned classes, completed activities, and recorded missed sessions.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-indigo-600">
                {collegeCompletionPct}%
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Completion Rate
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Planned</span>
              <span className="text-xl font-bold font-mono text-slate-800">
                {totalPlannedCollege}
              </span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-xs text-emerald-700 block">Completed</span>
              <span className="text-xl font-bold font-mono text-emerald-800">
                {completedCollege}
              </span>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-xs text-amber-700 block">Pending / Planned</span>
              <span className="text-xl font-bold font-mono text-amber-800">
                {pendingCollege}
              </span>
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <span className="text-xs text-rose-700 block">Missed Classes</span>
              <span className="text-xl font-bold font-mono text-rose-800">
                {missedClasses}
              </span>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              College Records & Status Overview
            </h4>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-white flex items-center justify-between text-xs gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-800">{r.title}</span>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      <span>{r.recordType}</span>
                      {r.subject && ` · ${r.subject}`}
                      <span> · {r.date}</span>
                    </div>
                  </div>
                  <span
                    className={`font-bold uppercase tracking-wider text-[11px] shrink-0 ${
                      r.status === 'Completed'
                        ? 'text-emerald-600'
                        : r.status === 'Missed'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Creation / Edit Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingRecord ? 'Edit College Record' : 'Add College Activity'}
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Activity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures Lecture or Revise Tree Traversal"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={recType}
                    onChange={(e) => {
                      const t = e.target.value as CollegeRecordType;
                      setRecType(t);
                      if (t === 'Missed Class') setRecStatus('Missed');
                    }}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {RECORD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Operating Systems"
                    value={recSubject}
                    onChange={(e) => setRecSubject(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setClockTarget('start')}
                    className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-indigo-300"
                  >
                    {recStartTime || 'Pick Start'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                  <button
                    type="button"
                    onClick={() => setClockTarget('end')}
                    className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-indigo-300"
                  >
                    {recEndTime || 'Pick End'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status & Progress
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {(['Planned', 'Pending', 'Completed', 'Missed'] as CollegeRecordStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRecStatus(st)}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          recStatus === st
                            ? st === 'Completed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'Missed'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Missed Lecture Topics
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, topics covered, or revision details..."
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock Picker Modal for College Record Times */}
      <ClockPickerModal
        isOpen={clockTarget !== null}
        initialTime={clockTarget === 'start' ? recStartTime || '09:00 AM' : recEndTime || '10:30 AM'}
        onConfirm={(picked) => {
          if (clockTarget === 'start') setRecStartTime(picked);
          if (clockTarget === 'end') setRecEndTime(picked);
          setClockTarget(null);
        }}
        onCancel={() => setClockTarget(null)}
      />

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingEvent ? 'Edit College Event' : 'Add College Event / Exam'}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="p-6 overflow-y-auto space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Examination"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as CollegeEventType)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
                  <button
                    type="button"
                    onClick={() => setIsEventClockOpen(true)}
                    className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-left"
                  >
                    {eventTime || 'Pick Time'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 4"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes, syllabus, or instructions..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock Picker for Event Time */}
      <ClockPickerModal
        isOpen={isEventClockOpen}
        initialTime={eventTime || '10:00 AM'}
        onConfirm={(picked) => {
          setEventTime(picked);
          setIsEventClockOpen(false);
        }}
        onCancel={() => setIsEventClockOpen(false)}
      />

      {/* Record Deletion Confirmation */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete College Record?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete &ldquo;
              <span className="font-semibold text-slate-800">{recordToDelete.title}</span>&rdquo;?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="py-2 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="py-2 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Deletion Confirmation */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Event?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete &ldquo;
              <span className="font-semibold text-slate-800">{eventToDelete.title}</span>&rdquo;?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="py-2 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEvent(eventToDelete.id);
                  setEventToDelete(null);
                }}
                className="py-2 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
