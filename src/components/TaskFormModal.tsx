/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { TaskCategory, TaskItem, Priority, TaskStatus } from '../types';
import { ClockPickerModal } from './ClockPickerModal';
import { getTodayDateString } from '../utils/storage';
import { parseTaskReminderDateTime, normalizeReminderTimeString } from '../utils/notifications';

interface TaskFormModalProps {
  isOpen: boolean;
  categories: TaskCategory[];
  taskToEdit?: TaskItem | null;
  onSave: (taskData: Omit<TaskItem, 'id' | 'createdAt'>, editingId?: string) => void;
  onCancel: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  categories,
  taskToEdit,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [reminderDate, setReminderDate] = useState(getTodayDateString());
  const [reminderTime, setReminderTime] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');

  const [isClockPickerOpen, setIsClockPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setCategoryId(taskToEdit.categoryId);
        setDescription(taskToEdit.description || '');
        setDate(taskToEdit.date);
        setReminderDate(taskToEdit.reminderDate || taskToEdit.date);
        setReminderTime(taskToEdit.reminderTime ? normalizeReminderTimeString(taskToEdit.reminderTime) : '');
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
      } else {
        const today = getTodayDateString();
        setTitle('');
        setCategoryId(categories[0]?.id || '');
        setDescription('');
        setDate(today);
        setReminderDate(today);
        setReminderTime('');
        setPriority('Medium');
        setStatus('Pending');
      }
    }
  }, [isOpen, taskToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a task title.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please select a category.');
      return;
    }

    const normalizedTime = reminderTime ? normalizeReminderTimeString(reminderTime) : undefined;
    const finalReminderDate = normalizedTime ? (reminderDate || date) : undefined;

    onSave(
      {
        title: title.trim(),
        categoryId,
        description: description.trim() || undefined,
        date,
        reminderDate: finalReminderDate,
        reminderTime: normalizedTime,
        priority,
        status,
        completedAt: status === 'Completed' ? new Date().toISOString() : undefined,
      },
      taskToEdit ? taskToEdit.id : undefined
    );
  };

  const handleClearReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReminderTime('');
  };

  // Compute status preview of reminder date/time
  const parsedReminder = reminderTime
    ? parseTaskReminderDateTime(reminderDate || date, reminderTime)
    : null;

  const isReminderPast = parsedReminder ? parsedReminder.getTime() < Date.now() : false;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ready for College"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Additional details, notes, or checklist..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Date & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Task Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setDate(newDate);
                      // Auto-sync reminderDate if it matched the previous date
                      if (reminderDate === date || !reminderDate) {
                        setReminderDate(newDate);
                      }
                    }}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        priority === p
                          ? p === 'High'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : p === 'Medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-emerald-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reminder Section with 12-Hour Clock Picker Trigger */}
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Reminder Time (12-Hour Clock)
                </span>
                {reminderTime && (
                  <button
                    type="button"
                    onClick={handleClearReminder}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline"
                  >
                    Clear reminder
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Reminder Date
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-medium">
                    Pick 12-Hour Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsClockPickerOpen(true)}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-between transition-colors ${
                      reminderTime
                        ? 'bg-white border-indigo-400 text-indigo-900 font-mono shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <span>{reminderTime || 'Click to Pick Time (e.g. 02:15 PM)'}</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Explicit Confirmation / Status Banner */}
              {reminderTime && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                  isReminderPast
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  {isReminderPast ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      Scheduled for: {reminderDate} at {reminderTime}
                    </span>
                    <span className="block text-[11px] mt-0.5">
                      {isReminderPast
                        ? 'Notice: This time has already passed for the selected date.'
                        : 'Active reminder. You will receive an in-app alert when this time arrives.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status (if editing) */}
            {taskToEdit && (
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('Pending')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      status === 'Pending'
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Completed')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      status === 'Completed'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded 12-Hour Clock Picker */}
      <ClockPickerModal
        isOpen={isClockPickerOpen}
        initialTime={reminderTime || ''}
        onConfirm={(pickedTime) => {
          setReminderTime(pickedTime);
          setIsClockPickerOpen(false);
        }}
        onCancel={() => setIsClockPickerOpen(false)}
      />
    </>
  );
};
