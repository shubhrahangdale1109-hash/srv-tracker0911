/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Check, Clock, X, Calendar, AlertCircle } from 'lucide-react';
import { TaskItem, TaskCategory } from '../types';

interface DueReminderAlertModalProps {
  task: TaskItem | null;
  categories: TaskCategory[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
}

export const DueReminderAlertModal: React.FC<DueReminderAlertModalProps> = ({
  task,
  categories,
  onComplete,
  onSnooze,
  onDismiss,
}) => {
  if (!task) return null;

  const category = categories.find((c) => c.id === task.categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-indigo-500/20 overflow-hidden flex flex-col animate-scale-up"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="due-reminder-title"
      >
        {/* Top Header with Pulsing Bell */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/10 animate-bounce">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 block">
                SRV Tracker Reminder
              </span>
              <h2 id="due-reminder-title" className="text-lg font-extrabold leading-tight">
                Task Due Now!
              </h2>
            </div>
          </div>

          <button
            onClick={() => onDismiss(task.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${category?.color || '#6366f1'}15`,
                  color: category?.color || '#6366f1',
                }}
              >
                {category?.name || 'Task'}
              </span>

              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  task.priority === 'High'
                    ? 'bg-rose-50 text-rose-700'
                    : task.priority === 'Medium'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {task.priority} Priority
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {task.title}
            </h3>
          </div>

          {task.description && (
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-100 whitespace-pre-wrap">
              {task.description}
            </div>
          )}

          {/* Scheduled Date & Time Card */}
          <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-950 font-semibold">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Scheduled: {task.reminderTime || 'Now'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.reminderDate || task.date}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Mark as Completed
          </button>

          <button
            type="button"
            onClick={() => onSnooze(task.id)}
            className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1"
            title="Remind again in 5 minutes"
          >
            <Clock className="w-3.5 h-3.5" />
            Snooze 5m
          </button>

          <button
            type="button"
            onClick={() => onDismiss(task.id)}
            className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors text-center"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
