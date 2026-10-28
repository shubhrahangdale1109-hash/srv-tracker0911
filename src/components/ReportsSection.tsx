/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  GraduationCap,
  Heart,
  Activity,
  Layers,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';
import {
  TaskItem,
  TaskCategory,
  CollegeRecord,
  CollegeEvent,
  HealthRecord,
} from '../types';
import { getTodayDateString } from '../utils/storage';

interface ReportsSectionProps {
  tasks: TaskItem[];
  categories: TaskCategory[];
  collegeRecords: CollegeRecord[];
  collegeEvents: CollegeEvent[];
  healthRecords: HealthRecord[];
}

type DateRangeFilter =
  | 'today'
  | 'last-7-days'
  | 'this-week'
  | 'last-30-days'
  | 'this-month'
  | 'custom';

type DomainFilter = 'overall' | 'tasks' | 'college' | 'health';

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  tasks,
  categories,
  collegeRecords,
  collegeEvents,
  healthRecords,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('this-week');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('overall');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedHealthMetric, setSelectedHealthMetric] = useState<string>('all');

  // Custom date range state
  const [customStart, setCustomStart] = useState<string>(getTodayDateString());
  const [customEnd, setCustomEnd] = useState<string>(getTodayDateString());

  // Weekly Report Week Offset (0 = this week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const todayStr = getTodayDateString();

  // Helper to determine if a date falls in range
  const isDateInRange = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date(todayStr + 'T00:00:00');

    if (dateRange === 'today') {
      return dateStr === todayStr;
    }
    if (dateRange === 'last-7-days') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 7);
      return target >= past7 && target <= now;
    }
    if (dateRange === 'this-week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now);
      monday.setDate(diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return target >= monday && target <= sunday;
    }
    if (dateRange === 'last-30-days') {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 30);
      return target >= past30 && target <= now;
    }
    if (dateRange === 'this-month') {
      const [ty, tm] = dateStr.split('-');
      const [ny, nm] = todayStr.split('-');
      return ty === ny && tm === nm;
    }
    if (dateRange === 'custom') {
      return dateStr >= customStart && dateStr <= customEnd;
    }
    return true;
  };

  // Filter datasets by date range
  const filteredTasks = tasks.filter((t) => {
    if (!isDateInRange(t.date)) return false;
    if (domainFilter === 'tasks' && selectedCategoryId !== 'all') {
      return t.categoryId === selectedCategoryId;
    }
    return true;
  });

  const filteredCollege = collegeRecords.filter((r) => isDateInRange(r.date));
  const filteredHealth = healthRecords.filter((h) => {
    if (!isDateInRange(h.date)) return false;
    if (domainFilter === 'health' && selectedHealthMetric !== 'all') {
      return h.measurementType === selectedHealthMetric;
    }
    return true;
  });

  // Calculate high-integrity metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = filteredTasks.filter((t) => t.status === 'Pending').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalCollege = filteredCollege.length;
  const completedCollege = filteredCollege.filter((r) => r.status === 'Completed').length;
  const pendingCollege = filteredCollege.filter((r) => r.status === 'Planned' || r.status === 'Pending').length;
  const missedCollege = filteredCollege.filter((r) => r.status === 'Missed').length;
  const collegeCompletionRate =
    totalCollege > 0 ? Math.round((completedCollege / totalCollege) * 100) : 0;

  const totalHealthLogs = filteredHealth.length;

  // Category-wise Breakdown Data
  const categoryStats = categories.map((cat) => {
    const catTasks = filteredTasks.filter((t) => t.categoryId === cat.id);
    const count = catTasks.length;
    const completed = catTasks.filter((t) => t.status === 'Completed').length;
    const rate = count > 0 ? Math.round((completed / count) * 100) : 0;
    return {
      category: cat,
      count,
      completed,
      rate,
    };
  });

  // Steps by date for chart
  const stepRecords = healthRecords
    .filter((h) => h.measurementType === 'steps' && isDateInRange(h.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Pulse records for chart
  const hrRecords = healthRecords
    .filter((h) => h.measurementType === 'heart_rate' && isDateInRange(h.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Blood pressure records
  const bpRecords = healthRecords
    .filter((h) => h.measurementType === 'blood_pressure' && isDateInRange(h.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Walking duration records
  const walkRecords = healthRecords
    .filter((h) => h.measurementType === 'walking_duration' && isDateInRange(h.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate target week dates for the itemized weekly report
  const getWeeklyReportData = (offset: number) => {
    const now = new Date(todayStr + 'T00:00:00');
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startStr = monday.toISOString().slice(0, 10);
    const endStr = sunday.toISOString().slice(0, 10);

    const weekTasks = tasks.filter((t) => t.date >= startStr && t.date <= endStr);
    const weekCollege = collegeRecords.filter((c) => c.date >= startStr && c.date <= endStr);
    const weekHealth = healthRecords.filter((h) => h.date >= startStr && h.date <= endStr);
    const weekEvents = collegeEvents.filter((e) => e.date >= startStr && e.date <= endStr);

    const wCompletedTasks = weekTasks.filter((t) => t.status === 'Completed');
    const wPendingTasks = weekTasks.filter((t) => t.status === 'Pending');
    const wMissedClasses = weekCollege.filter((c) => c.status === 'Missed');
    const wCompletedCollege = weekCollege.filter((c) => c.status === 'Completed');

    const pct =
      weekTasks.length > 0 ? Math.round((wCompletedTasks.length / weekTasks.length) * 100) : 0;

    return {
      startDate: startStr,
      endDate: endStr,
      weekTasks,
      wCompletedTasks,
      wPendingTasks,
      wMissedClasses,
      wCompletedCollege,
      weekHealth,
      weekEvents,
      pct,
    };
  };

  const weekReport = getWeeklyReportData(weekOffset);

  // Export to CSV Function
  const handleExportCSV = () => {
    const rows = [
      ['Section', 'Title / Metric', 'Date', 'Status / Value', 'Details'],
      ...tasks.map((t) => [
        'Daily Task',
        t.title,
        t.date,
        t.status,
        `Priority: ${t.priority}, Reminder: ${t.reminderTime || 'None'}`,
      ]),
      ...collegeRecords.map((c) => [
        'College Activity',
        c.title,
        c.date,
        c.status,
        `Type: ${c.recordType}, Subject: ${c.subject || 'N/A'}`,
      ]),
      ...healthRecords.map((h) => [
        'Health Log',
        h.measurementType,
        h.date,
        h.measurementType === 'blood_pressure' ? `${h.value}/${h.diastolic} ${h.unit}` : `${h.value} ${h.unit}`,
        h.notes || 'N/A',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SRV_Tracker_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Holistic insights, completion trends, and weekly summaries computed from actual saved records.
          </p>
        </div>

        {/* Print & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            title="Print Weekly Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Date Range & Domain Selector */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3">
        {/* Date Presets */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Time Range
          </span>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'this-week', label: 'This Week' },
                { id: 'last-7-days', label: 'Last 7 Days' },
                { id: 'this-month', label: 'This Month' },
                { id: 'last-30-days', label: 'Last 30 Days' },
                { id: 'custom', label: 'Custom Range' },
              ] as { id: DateRangeFilter; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDateRange(item.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  dateRange === item.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Picker */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">From</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
            <span className="text-slate-500 font-medium">To</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        )}

        {/* Domain Sub-filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            Focus Area
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'overall', label: 'Overall Progress' },
                { id: 'tasks', label: 'Daily Tasks' },
                { id: 'college', label: 'College' },
                { id: 'health', label: 'Health' },
              ] as { id: DomainFilter; label: string }[]
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomainFilter(d.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  domainFilter === d.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Conditional Category Filter if Tasks selected */}
          {domainFilter === 'tasks' && (
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Task Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Conditional Health Metric Filter if Health selected */}
          {domainFilter === 'health' && (
            <select
              value={selectedHealthMetric}
              onChange={(e) => setSelectedHealthMetric(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="all">All Health Measurements</option>
              <option value="steps">Steps</option>
              <option value="heart_rate">Heart Rate (bpm)</option>
              <option value="blood_pressure">Blood Pressure (mmHg)</option>
              <option value="walking_duration">Walking Duration (min)</option>
            </select>
          )}
        </div>
      </div>

      {/* OVERALL PROGRESS DASHBOARD (High integrity KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">
            Tasks Completion
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-indigo-600">
              {taskCompletionRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({completedTasks}/{totalTasks})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pendingTasks} pending tasks in range
          </span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">
            College Academic Rate
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {collegeCompletionRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({completedCollege}/{totalCollege})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {pendingCollege} pending classes/studies
          </span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">
            Missed Classes
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-rose-600">
              {missedCollege}
            </span>
            <span className="text-xs text-slate-400">sessions</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Recorded in academic history
          </span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">
            Health Checkpoints
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-mono text-violet-600">
              {totalHealthLogs}
            </span>
            <span className="text-xs text-slate-400">entries</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Logged across steps, BP & HR
          </span>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Task Breakdown Chart */}
        {(domainFilter === 'overall' || domainFilter === 'tasks') && (
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Task Category Breakdown
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total tasks and completion progress per custom category.
                </p>
              </div>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            {categoryStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No categories found.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {categoryStats.map((item) => (
                  <div key={item.category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.category.color || '#6366f1' }}
                        />
                        {item.category.name}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {item.completed} / {item.count} ({item.rate}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${item.rate}%`,
                          backgroundColor: item.category.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Steps History Chart (Clean SVG Bar Chart) */}
        {(domainFilter === 'overall' || domainFilter === 'health') && (
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Steps Activity History</h3>
                <p className="text-[11px] text-slate-400">
                  Daily recorded steps from manual health logs.
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>

            {stepRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No step entries found for this range.
              </div>
            ) : (
              <div className="pt-2">
                {/* SVG Responsive Bar Chart */}
                <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
                  {stepRecords.map((s) => {
                    const maxSteps = Math.max(10000, ...stepRecords.map((x) => x.value));
                    const heightPct = Math.round((s.value / maxSteps) * 100);
                    return (
                      <div
                        key={s.id}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group"
                      >
                        <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {s.value}
                        </span>
                        <div
                          className="w-full max-w-[28px] bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                          style={{ height: `${Math.max(8, heightPct)}%` }}
                        />
                        <span className="text-[10px] text-slate-500 truncate w-full text-center">
                          {s.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-2">
                  <span>Target: 10,000 steps</span>
                  <span>
                    Avg:{' '}
                    {Math.round(
                      stepRecords.reduce((a, b) => a + b.value, 0) / stepRecords.length
                    ).toLocaleString()}{' '}
                    steps
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pulse & Blood Pressure Trends */}
        {(domainFilter === 'overall' || domainFilter === 'health') && (
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Heart Rate & Blood Pressure
                </h3>
                <p className="text-[11px] text-slate-400">
                  Recent resting cardiovascular logs.
                </p>
              </div>
              <Heart className="w-4 h-4 text-rose-500" />
            </div>

            {hrRecords.length === 0 && bpRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No heart rate or blood pressure logs in selected range.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {hrRecords.slice(0, 3).map((hr) => (
                  <div
                    key={hr.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-700">Heart Rate</span>
                      <span className="text-slate-400 ml-2">{hr.date} · {hr.time}</span>
                    </div>
                    <span className="font-bold font-mono text-rose-600">
                      {hr.value} bpm
                    </span>
                  </div>
                ))}

                {bpRecords.slice(0, 3).map((bp) => (
                  <div
                    key={bp.id}
                    className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-700">Blood Pressure</span>
                      <span className="text-slate-400 ml-2">{bp.date} · {bp.time}</span>
                    </div>
                    <span className="font-bold font-mono text-violet-600">
                      {bp.value}/{bp.diastolic} mmHg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* College Weekly Breakdown */}
        {(domainFilter === 'overall' || domainFilter === 'college') && (
          <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Academic Activities Ratio
                </h3>
                <p className="text-[11px] text-slate-400">
                  Planned vs Completed vs Missed college work.
                </p>
              </div>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-slate-400 block text-[11px]">Completed</span>
                <span className="text-xl font-bold font-mono text-emerald-800">
                  {completedCollege}
                </span>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-slate-400 block text-[11px]">Pending</span>
                <span className="text-xl font-bold font-mono text-amber-800">
                  {pendingCollege}
                </span>
              </div>
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-slate-400 block text-[11px]">Missed</span>
                <span className="text-xl font-bold font-mono text-rose-800">
                  {missedCollege}
                </span>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${totalCollege > 0 ? (completedCollege / totalCollege) * 100 : 0}%`,
                }}
                className="bg-emerald-500 h-full"
                title="Completed"
              />
              <div
                style={{
                  width: `${totalCollege > 0 ? (pendingCollege / totalCollege) * 100 : 0}%`,
                }}
                className="bg-amber-400 h-full"
                title="Pending"
              />
              <div
                style={{
                  width: `${totalCollege > 0 ? (missedCollege / totalCollege) * 100 : 0}%`,
                }}
                className="bg-rose-500 h-full"
                title="Missed"
              />
            </div>
          </div>
        )}
      </div>

      {/* ITEMISED WEEKLY REPORT (with Previous/Next week switcher) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        {/* Weekly Header & Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Weekly Audit & Progress Report
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Week of <span className="font-semibold text-slate-700">{weekReport.startDate}</span> to{' '}
              <span className="font-semibold text-slate-700">{weekReport.endDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Week
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Current Week
              </button>
            )}
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              Next Week <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekly Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block text-[11px]">Tasks Due</span>
            <span className="text-lg font-bold font-mono text-slate-800">
              {weekReport.weekTasks.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {weekReport.pct}% completed
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block text-[11px]">College Done</span>
            <span className="text-lg font-bold font-mono text-emerald-700">
              {weekReport.wCompletedCollege.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">activities</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block text-[11px]">Missed Classes</span>
            <span className="text-lg font-bold font-mono text-rose-600">
              {weekReport.wMissedClasses.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">logged</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl">
            <span className="text-slate-400 block text-[11px]">Health Logs</span>
            <span className="text-lg font-bold font-mono text-violet-700">
              {weekReport.weekHealth.length}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">checkpoints</span>
          </div>
        </div>

        {/* Itemized Tasks Breakdown for the Week */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tasks for this week ({weekReport.weekTasks.length})
          </h4>

          {weekReport.weekTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No tasks scheduled for this week.</p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden text-xs">
              {weekReport.weekTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-white flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        t.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`font-semibold truncate ${
                        t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-slate-400">· {t.date}</span>
                  </div>
                  <span
                    className={`font-bold uppercase tracking-wider text-[10px] shrink-0 ${
                      t.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missed Classes for the week */}
        {weekReport.wMissedClasses.length > 0 && (
          <div className="space-y-2 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Missed Classes Recorded this Week ({weekReport.wMissedClasses.length})
            </h4>
            <div className="space-y-1.5 text-xs">
              {weekReport.wMissedClasses.map((m) => (
                <div key={m.id} className="text-slate-700">
                  <span className="font-bold text-rose-900">{m.title}</span> ({m.date})
                  {m.notes && <span className="text-slate-500 block text-[11px]">{m.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
