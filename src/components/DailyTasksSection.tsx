/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Tag,
  Bell,
  BellOff,
  ChevronRight,
  Info,
  CalendarDays,
  X,
} from 'lucide-react';
import { TaskCategory, TaskItem, Priority, TaskStatus } from '../types';
import { TaskFormModal } from './TaskFormModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { getTodayDateString, getTomorrowDateString } from '../utils/storage';

interface DailyTasksSectionProps {
  tasks: TaskItem[];
  categories: TaskCategory[];
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onSaveTask: (taskData: Omit<TaskItem, 'id' | 'createdAt'>, editingId?: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  onSaveCategory: (category: TaskCategory) => void;
  onDeleteCategory: (
    categoryId: string,
    reassignmentOption: 'delete-all' | 'reassign',
    targetCategoryId?: string
  ) => void;
}

type DateFilterType = 'all' | 'today' | 'tomorrow' | 'upcoming' | 'past' | 'custom';
type StatusFilterType = 'all' | 'pending' | 'completed';

export const DailyTasksSection: React.FC<DailyTasksSectionProps> = ({
  tasks,
  categories,
  notificationsEnabled,
  onToggleNotifications,
  onSaveTask,
  onDeleteTask,
  onToggleTaskStatus,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // Modals state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [showNotificationInfo, setShowNotificationInfo] = useState(false);

  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Category filter
    if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) {
      return false;
    }

    // Status filter
    if (statusFilter === 'pending' && t.status !== 'Pending') return false;
    if (statusFilter === 'completed' && t.status !== 'Completed') return false;

    // Date filter
    if (dateFilter === 'today' && t.date !== today) return false;
    if (dateFilter === 'tomorrow' && t.date !== tomorrow) return false;
    if (dateFilter === 'upcoming' && t.date <= today) return false;
    if (dateFilter === 'past' && t.date >= today) return false;
    if (dateFilter === 'custom' && t.date !== customDate) return false;

    return true;
  });

  // Sort: Pending first, then by date and reminder time
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'Pending' ? -1 : 1;
    }
    return a.date.localeCompare(b.date);
  });

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daily Tasks & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize personal activities, routines, and set reliable 12-hour reminder alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification permission toggle */}
          <button
            type="button"
            onClick={onToggleNotifications}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border ${
              notificationsEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Reminders"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reminders Active</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Enable Reminders</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowNotificationInfo(!showNotificationInfo)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="Browser Limitations Note"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Add Task Primary CTA */}
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskFormOpen(true);
            }}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Honest Technical Limitation Note (if toggled or on first look) */}
      {showNotificationInfo && (
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1 animate-fade-in">
          <p className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600" /> Web Reminder Operating Notice
          </p>
          <p className="text-amber-800">
            Standard web applications cannot guarantee system-level alarms if the browser tab is fully closed or the mobile OS puts the browser process to sleep. When this tab is open or running in the foreground, SRV Tracker actively monitors due reminder times, fires audio/in-app banners, and posts native system notifications when permission is granted.
          </p>
        </div>
      )}

      {/* Categories Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Categories</span>
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
          >
            <Tag className="w-3 h-3" /> Manage Categories
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          {categories.map((cat) => {
            const count = tasks.filter((t) => t.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                style={{
                  backgroundColor: isSelected ? cat.color || '#6366f1' : undefined,
                }}
              >
                {!isSelected && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  />
                )}
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Row: Date presets & Status selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        {/* Date presets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past', label: 'Past' },
              { id: 'custom', label: 'Specific Date' },
            ] as { id: DateFilterType; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateFilter(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                dateFilter === item.id
                  ? 'bg-indigo-100 text-indigo-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom date input if selected */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>
        )}

        {/* Status segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start md:self-auto">
          {(
            [
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
            ] as { id: StatusFilterType; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {sortedTasks.length === 0 ? (
          /* Clean Empty State */
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-3">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No tasks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              There are no tasks matching your selected filters. Create a new task or adjust your category and date filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Your First Task
            </button>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const cat = getCategory(task.categoryId);
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className={`group p-4 bg-white rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'border-slate-100 bg-slate-50/50 opacity-80'
                    : 'border-slate-100 hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                {/* Left: Checkbox + Title + Meta */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleTaskStatus(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-hidden transition-colors"
                    title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setDetailTask(task)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-semibold text-slate-800 truncate ${
                          isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      {/* Priority unboxed label */}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'High'
                            ? 'text-rose-600'
                            : task.priority === 'Medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}

                    {/* Unboxed Metadata row */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span
                        className="font-medium"
                        style={{ color: cat?.color || '#64748b' }}
                      >
                        {cat?.name || 'Uncategorized'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.date === today
                          ? 'Today'
                          : task.date === tomorrow
                          ? 'Tomorrow'
                          : task.date}
                      </span>
                      {task.reminderTime && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-indigo-600">
                            <Clock className="w-3 h-3" />
                            {task.reminderTime}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(task);
                      setIsTaskFormOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskToDelete(task)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Details Modal */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="text-xs font-bold"
                  style={{ color: getCategory(detailTask.categoryId)?.color || '#6366f1' }}
                >
                  {getCategory(detailTask.categoryId)?.name}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{detailTask.title}</h3>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailTask.description && (
              <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-700 whitespace-pre-wrap">
                {detailTask.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Date</span>
                <span className="font-semibold text-slate-700">{detailTask.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Priority</span>
                <span className="font-semibold text-slate-700">{detailTask.priority}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Reminder</span>
                <span className="font-semibold text-indigo-600 font-mono">
                  {detailTask.reminderTime || 'None set'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Status</span>
                <span
                  className={`font-semibold ${
                    detailTask.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {detailTask.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleTaskStatus(detailTask.id);
                  setDetailTask((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: prev.status === 'Completed' ? 'Pending' : 'Completed',
                        }
                      : null
                  );
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {detailTask.status === 'Completed' ? 'Reopen Task' : 'Mark Completed'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = detailTask;
                  setDetailTask(null);
                  setEditingTask(t);
                  setIsTaskFormOpen(true);
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Task?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete &ldquo;
              <span className="font-semibold text-slate-800">{taskToDelete.title}</span>&rdquo;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="py-2 px-4 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="py-2 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        categories={categories}
        taskToEdit={editingTask}
        onSave={(data, id) => {
          onSaveTask(data, id);
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onCancel={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        categories={categories}
        tasks={tasks}
        onClose={() => setIsCategoryManagerOpen(false)}
        onSaveCategory={onSaveCategory}
        onDeleteCategory={onDeleteCategory}
      />
    </div>
  );
};
