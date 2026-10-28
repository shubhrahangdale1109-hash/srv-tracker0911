/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  GraduationCap,
  Heart,
  BarChart3,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  Footprints,
  Activity,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  AppTab,
  TaskItem,
  TaskCategory,
  CollegeRecord,
  CollegeEvent,
  HealthRecord,
} from '../types';
import { getTodayDateString } from '../utils/storage';

interface HomeDashboardProps {
  tasks: TaskItem[];
  categories: TaskCategory[];
  collegeRecords: CollegeRecord[];
  collegeEvents: CollegeEvent[];
  healthRecords: HealthRecord[];
  onNavigate: (tab: AppTab) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onQuickAddTask: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  categories,
  collegeRecords,
  collegeEvents,
  healthRecords,
  onNavigate,
  onToggleTaskStatus,
  onQuickAddTask,
}) => {
  // Live digital clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayDateString();

  // Formatted date string
  const formattedDayAndDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedLiveClock = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Calculate Today's Tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter((t) => t.status === 'Completed').length;
  const todayPending = todayTasks.filter((t) => t.status === 'Pending').length;
  const todayCompletionPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  // Short list of today's upcoming tasks (max 4)
  const todayUpcomingTasks = todayTasks
    .filter((t) => t.status === 'Pending')
    .slice(0, 4);

  // Latest Health Records
  const todaySteps = healthRecords
    .filter((h) => h.measurementType === 'steps' && h.date === todayStr)
    .reduce((sum, h) => sum + h.value, 0);

  const latestHR = healthRecords
    .filter((h) => h.measurementType === 'heart_rate')
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.value;

  const latestBP = healthRecords
    .filter((h) => h.measurementType === 'blood_pressure')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  // Weekly Progress Summary Calculation
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startWeekStr = monday.toISOString().slice(0, 10);
  const endWeekStr = sunday.toISOString().slice(0, 10);

  const thisWeekTasks = tasks.filter((t) => t.date >= startWeekStr && t.date <= endWeekStr);
  const thisWeekCompleted = thisWeekTasks.filter((t) => t.status === 'Completed').length;
  const thisWeekCompletionPct =
    thisWeekTasks.length > 0 ? Math.round((thisWeekCompleted / thisWeekTasks.length) * 100) : 0;

  const thisWeekCollegeCompleted = collegeRecords.filter(
    (c) => c.status === 'Completed' && c.date >= startWeekStr && c.date <= endWeekStr
  ).length;

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER WITH LIVE CLOCK & DATE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
            <Calendar className="w-4 h-4" />
            <span>{formattedDayAndDate}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to SRV Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Your personal life, academics, and health companion.
          </p>
        </div>

        {/* Live Digital Clock Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2.5 rounded-2xl border border-indigo-100/60">
          <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900/60 block">
              Live Clock
            </span>
            <span className="text-base font-bold font-mono text-indigo-950">
              {formattedLiveClock}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S TASK COMPLETION & PROGRESS HERO */}
      <div className="p-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl text-white shadow-lg shadow-indigo-600/15 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            Today&apos;s Focus
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {todayCompletionPct === 100 && todayTotal > 0
              ? 'All daily tasks completed!'
              : todayTotal === 0
              ? 'No tasks scheduled for today'
              : `${todayPending} pending task${todayPending === 1 ? '' : 's'} remaining`}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 max-w-md">
            {todayTotal === 0
              ? 'Plan ahead or add a task to build healthy daily study and lifestyle habits.'
              : `You have completed ${todayCompleted} out of ${todayTotal} tasks scheduled for today.`}
          </p>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={onQuickAddTask}
              className="py-2 px-4 text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="py-2 px-4 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-1"
            >
              Open Tasks <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-indigo-900/40"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-white transition-all duration-700 ease-out"
              strokeWidth="9"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * todayCompletionPct) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold font-mono text-white">
              {todayCompletionPct}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-indigo-200 tracking-wider">
              Done
            </span>
          </div>
        </div>
      </div>

      {/* 3. FOUR LARGE CARDS LINKING TO THE FOUR MAIN SECTIONS */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Explore Main Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Daily Tasks */}
          <div
            onClick={() => onNavigate('tasks')}
            className="group p-5 bg-white hover:bg-slate-50/80 rounded-3xl border border-slate-100 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Daily Tasks</h3>
              <p className="text-xs text-slate-500 mt-1">
                Custom categories, priority queues & 12-hour clock reminders.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {tasks.filter((t) => t.status === 'Pending').length} pending
              </span>
              <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Card 2: College */}
          <div
            onClick={() => onNavigate('college')}
            className="group p-5 bg-white hover:bg-slate-50/80 rounded-3xl border border-slate-100 hover:border-violet-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. College</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lectures, missed class revision, timetable, info & exams.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {collegeEvents.length} events / exams
              </span>
              <span className="text-violet-600 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Card 3: Health */}
          <div
            onClick={() => onNavigate('health')}
            className="group p-5 bg-white hover:bg-slate-50/80 rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Health</h3>
              <p className="text-xs text-slate-500 mt-1">
                Private step logging, heart rate, blood pressure & weight history.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {todaySteps.toLocaleString()} steps today
              </span>
              <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>

          {/* Card 4: Reports & Analytics */}
          <div
            onClick={() => onNavigate('reports')}
            className="group p-5 bg-white hover:bg-slate-50/80 rounded-3xl border border-slate-100 hover:border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">4. Reports & Analytics</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unified audit, SVG charts, weekly reports & CSV export.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {thisWeekCompletionPct}% weekly rate
              </span>
              <span className="text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TODAY'S UPCOMING TASKS & HEALTH & WEEKLY PROGRESS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Upcoming Tasks */}
        <div className="lg:col-span-2 p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Today&apos;s Upcoming Tasks
              </h3>
              <p className="text-[11px] text-slate-400">
                Pending tasks scheduled for {todayStr}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              View All ({todayTasks.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {todayUpcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {todayTasks.length > 0
                ? 'All of today’s tasks have been completed!'
                : 'No tasks scheduled for today. Click Add Task above to create one.'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayUpcomingTasks.map((t) => {
                const cat = getCategory(t.categoryId);
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(t.id)}
                        className="text-slate-300 hover:text-emerald-500 shrink-0"
                        title="Mark as completed"
                      >
                        <Circle className="w-5 h-5" />
                      </button>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span
                            className="font-medium"
                            style={{ color: cat?.color || '#6366f1' }}
                          >
                            {cat?.name}
                          </span>
                          {t.reminderTime && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-indigo-600">
                                {t.reminderTime}
                              </span>
                            </>
                          )}
                          <span>·</span>
                          <span
                            className={
                              t.priority === 'High'
                                ? 'text-rose-600 font-bold'
                                : t.priority === 'Medium'
                                ? 'text-amber-600 font-bold'
                                : 'text-emerald-600 font-bold'
                            }
                          >
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleTaskStatus(t.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                    >
                      Complete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Health & Weekly Progress Summary */}
        <div className="space-y-5">
          {/* Health Summary Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800">Latest Health Metrics</h3>
              <button
                type="button"
                onClick={() => onNavigate('health')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
              >
                Log Entry
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Today Steps</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {todaySteps.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Latest Pulse</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {latestHR ? `${latestHR} bpm` : '—'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl col-span-2">
                <span className="text-slate-400 block text-[11px]">Blood Pressure</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {latestBP ? `${latestBP.value}/${latestBP.diastolic} mmHg` : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Progress Summary Card */}
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800">Weekly Progress</h3>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Full Audit
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Week Task Completion</span>
                <span className="font-bold font-mono text-indigo-700">
                  {thisWeekCompletionPct}% ({thisWeekCompleted}/{thisWeekTasks.length})
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${thisWeekCompletionPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 pt-1">
                <span>College Completed This Week</span>
                <span className="font-bold font-mono text-emerald-700">
                  {thisWeekCollegeCompleted} activities
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
