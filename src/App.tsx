/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  CheckSquare,
  GraduationCap,
  Heart,
  BarChart3,
  Plus,
  CheckCircle,
  Bell,
  X,
  Sparkles,
} from 'lucide-react';
import {
  AppTab,
  TaskItem,
  TaskCategory,
  TaskStatus,
  CollegeRecord,
  CollegeRecordStatus,
  CollegePermanentInfo,
  CollegeEvent,
  HealthPermanentInfo,
  HealthRecord,
  WeightEntry,
  ToastMessage,
} from './types';
import {
  loadCategories,
  saveCategories,
  loadTasks,
  saveTasks,
  loadCollegeRecords,
  saveCollegeRecords,
  loadCollegeInfo,
  saveCollegeInfo,
  loadCollegeEvents,
  saveCollegeEvents,
  loadHealthInfo,
  saveHealthInfo,
  loadHealthRecords,
  saveHealthRecords,
  loadNotificationPreference,
  saveNotificationPreference,
  getTodayDateString,
  getTomorrowDateString,
} from './utils/storage';
import {
  getBrowserNotificationStatus,
  requestBrowserNotificationPermission,
  triggerBrowserNotification,
  parseTaskReminderDateTime,
  normalizeReminderTimeString,
  playReminderChime,
} from './utils/notifications';
import { HomeDashboard } from './components/HomeDashboard';
import { DailyTasksSection } from './components/DailyTasksSection';
import { CollegeSection } from './components/CollegeSection';
import { HealthSection } from './components/HealthSection';
import { ReportsSection } from './components/ReportsSection';
import { TaskFormModal } from './components/TaskFormModal';
import { DueReminderAlertModal } from './components/DueReminderAlertModal';

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Application Data States
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [collegeRecords, setCollegeRecords] = useState<CollegeRecord[]>([]);
  const [collegeInfo, setCollegeInfo] = useState<CollegePermanentInfo>({});
  const [collegeEvents, setCollegeEvents] = useState<CollegeEvent[]>([]);
  const [healthInfo, setHealthInfo] = useState<HealthPermanentInfo>({ weightHistory: [] });
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Due Reminder Alert Modal Queue
  const [dueAlertQueue, setDueAlertQueue] = useState<TaskItem[]>([]);

  // Quick Task Modal
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);

  // Load data from localStorage on initial mount
  useEffect(() => {
    setCategories(loadCategories());
    setTasks(loadTasks());
    setCollegeRecords(loadCollegeRecords());
    setCollegeInfo(loadCollegeInfo());
    setCollegeEvents(loadCollegeEvents());
    setHealthInfo(loadHealthInfo());
    setHealthRecords(loadHealthRecords());

    const savedPref = loadNotificationPreference();
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      setNotificationsEnabled(true);
      saveNotificationPreference(true);
    } else {
      setNotificationsEnabled(savedPref);
    }
  }, []);

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Robust Reminder Checker Loop
  // In-app alerts run whenever the app is open; native notifications trigger if permitted
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentEpoch = now.getTime();

      setTasks((prevTasks) => {
        let changed = false;
        const newlyDueTasks: TaskItem[] = [];

        const updated = prevTasks.map((task) => {
          // Skip completed tasks, already notified tasks, or tasks with no reminder
          if (task.status === 'Completed' || task.reminderNotified || !task.reminderTime) {
            return task;
          }

          const remDate = parseTaskReminderDateTime(
            task.reminderDate || task.date,
            task.reminderTime
          );
          if (!remDate) return task;

          const remEpoch = remDate.getTime();

          // Check if due: current time has reached or passed scheduled reminder
          // Limit to within the past 24 hours to avoid firing for tasks from days ago
          if (currentEpoch >= remEpoch && currentEpoch - remEpoch < 24 * 60 * 60 * 1000) {
            changed = true;
            newlyDueTasks.push(task);

            // Play audio chime
            playReminderChime();

            // Dispatch native desktop/mobile browser notification if permitted
            triggerBrowserNotification(`SRV Tracker: ${task.title}`, {
              body: task.description || `Reminder due now: ${task.reminderTime}`,
              tag: `srv-reminder-${task.id}`,
            });

            // Post in-app toast log
            showToast(`⏰ Reminder Due: ${task.title} (${task.reminderTime})`, 'info');

            // Mark notified immediately so duplicate reminders never fire
            return { ...task, reminderNotified: true };
          }

          return task;
        });

        if (changed) {
          saveTasks(updated);
          // Add newly due tasks to the in-app alert queue (without duplicates)
          setDueAlertQueue((prevQueue) => {
            const existingIds = new Set(prevQueue.map((t) => t.id));
            const fresh = newlyDueTasks.filter((t) => !existingIds.has(t.id));
            return [...prevQueue, ...fresh];
          });
          return updated;
        }

        return prevTasks;
      });
    };

    // Run every 3 seconds for high responsiveness
    const interval = setInterval(checkReminders, 3000);
    checkReminders(); // check immediately on mount/update

    // Check immediately when user switches back to this tab
    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        checkReminders();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  // Toggle notification preference with permission request
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestBrowserNotificationPermission();
      setNotificationsEnabled(true);
      saveNotificationPreference(true);
      if (granted) {
        showToast('Browser notifications enabled successfully!');
      } else {
        showToast('In-app alerts are active. Browser notifications require site permission.', 'info');
      }
    } else {
      setNotificationsEnabled(false);
      saveNotificationPreference(false);
      showToast('Browser notifications turned off. In-app alerts remain active.', 'info');
    }
  };

  // Due Reminder Alert Actions
  const handleDismissDueAlert = (taskId: string) => {
    setDueAlertQueue((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCompleteDueAlert = (taskId: string) => {
    handleToggleTaskStatus(taskId);
    setDueAlertQueue((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task marked as completed.');
  };

  const handleSnoozeDueAlert = (taskId: string) => {
    // Snooze by 5 minutes from now
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
    let h = snoozeTime.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const m = snoozeTime.getMinutes();
    const formattedSnoozeTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;

    const todayStr = getTodayDateString();

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              reminderTime: formattedSnoozeTime,
              reminderDate: todayStr,
              reminderNotified: false, // Reset so it can trigger in 5 minutes
            }
          : t
      );
      saveTasks(updated);
      return updated;
    });

    setDueAlertQueue((prev) => prev.filter((t) => t.id !== taskId));
    showToast(`Reminder snoozed for 5 minutes until ${formattedSnoozeTime}.`);
  };

  // Task Handlers
  const handleSaveTask = (
    taskData: Omit<TaskItem, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    const normalizedTime = taskData.reminderTime
      ? normalizeReminderTimeString(taskData.reminderTime)
      : undefined;

    if (editingId) {
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === editingId) {
            // If reminder time, date, or status changed, reset reminderNotified to false
            const timeChanged = t.reminderTime !== normalizedTime;
            const dateChanged = t.reminderDate !== taskData.reminderDate;
            const statusChanged = t.status !== taskData.status;

            const shouldResetNotified =
              timeChanged ||
              dateChanged ||
              (statusChanged && taskData.status === 'Pending');

            return {
              ...t,
              ...taskData,
              reminderTime: normalizedTime,
              reminderNotified: shouldResetNotified ? false : t.reminderNotified,
            };
          }
          return t;
        });
        saveTasks(updated);
        return updated;
      });
      showToast('Task updated successfully.');
    } else {
      const newTask: TaskItem = {
        ...taskData,
        reminderTime: normalizedTime,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        reminderNotified: false,
      };
      setTasks((prev) => {
        const updated = [newTask, ...prev];
        saveTasks(updated);
        return updated;
      });
      showToast('Task created successfully.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      saveTasks(updated);
      return updated;
    });
    // Remove from due alert queue if present
    setDueAlertQueue((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task deleted.');
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus: TaskStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
            // If reopening, reset reminderNotified so future reminder can fire
            reminderNotified: nextStatus === 'Completed' ? t.reminderNotified : false,
          };
        }
        return t;
      });
      saveTasks(updated);
      return updated;
    });
    showToast('Task status updated.');
  };

  // Category Handlers
  const handleSaveCategory = (category: TaskCategory) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      let updated: TaskCategory[];
      if (exists) {
        updated = prev.map((c) => (c.id === category.id ? category : c));
      } else {
        updated = [...prev, category];
      }
      saveCategories(updated);
      return updated;
    });
    showToast('Category saved.');
  };

  const handleDeleteCategory = (
    categoryId: string,
    option: 'delete-all' | 'reassign',
    targetCategoryId?: string
  ) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== categoryId);
      saveCategories(updated);
      return updated;
    });

    setTasks((prev) => {
      let updated: TaskItem[];
      if (option === 'delete-all') {
        updated = prev.filter((t) => t.categoryId !== categoryId);
      } else {
        const fallbackTarget = targetCategoryId || categories[0]?.id || 'cat-other';
        updated = prev.map((t) =>
          t.categoryId === categoryId ? { ...t, categoryId: fallbackTarget } : t
        );
      }
      saveTasks(updated);
      return updated;
    });

    showToast('Category deleted.');
  };

  // College Handlers
  const handleSaveCollegeRecord = (
    recData: Omit<CollegeRecord, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setCollegeRecords((prev) => {
        const updated = prev.map((r) => (r.id === editingId ? { ...r, ...recData } : r));
        saveCollegeRecords(updated);
        return updated;
      });
      showToast('College activity updated.');
    } else {
      const newRec: CollegeRecord = {
        ...recData,
        id: `col-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setCollegeRecords((prev) => {
        const updated = [newRec, ...prev];
        saveCollegeRecords(updated);
        return updated;
      });
      showToast('College activity recorded.');
    }
  };

  const handleDeleteCollegeRecord = (id: string) => {
    setCollegeRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveCollegeRecords(updated);
      return updated;
    });
    showToast('College record deleted.');
  };

  const handleToggleCollegeRecordStatus = (id: string) => {
    setCollegeRecords((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id) {
          const next: CollegeRecordStatus = r.status === 'Completed' ? 'Pending' : 'Completed';
          return { ...r, status: next };
        }
        return r;
      });
      saveCollegeRecords(updated);
      return updated;
    });
    showToast('College record status updated.');
  };

  const handleSaveCollegeInfo = (info: CollegePermanentInfo) => {
    setCollegeInfo(info);
    saveCollegeInfo(info);
    showToast('College permanent information saved.');
  };

  const handleSaveCollegeEvent = (
    eventData: Omit<CollegeEvent, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setCollegeEvents((prev) => {
        const updated = prev.map((e) => (e.id === editingId ? { ...e, ...eventData } : e));
        saveCollegeEvents(updated);
        return updated;
      });
      showToast('College event updated.');
    } else {
      const newEv: CollegeEvent = {
        ...eventData,
        id: `ev-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setCollegeEvents((prev) => {
        const updated = [newEv, ...prev];
        saveCollegeEvents(updated);
        return updated;
      });
      showToast('College event added.');
    }
  };

  const handleDeleteCollegeEvent = (id: string) => {
    setCollegeEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveCollegeEvents(updated);
      return updated;
    });
    showToast('College event deleted.');
  };

  // Follow-up revision task for missed college class
  const handleCreateFollowUpTask = (record: CollegeRecord) => {
    const today = getTodayDateString();
    const collegeCat =
      categories.find((c) => c.name.toLowerCase().includes('college')) || categories[0];
    const newFollowUp: TaskItem = {
      id: `task-followup-${Date.now()}`,
      title: `Revise: ${record.title}`,
      categoryId: collegeCat ? collegeCat.id : 'cat-college',
      description: `Follow-up revision for missed lecture${record.subject ? ` in ${record.subject}` : ''}.\n${record.notes || ''}`,
      date: today,
      priority: record.priority || 'High',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      reminderNotified: false,
    };

    setTasks((prev) => {
      const updated = [newFollowUp, ...prev];
      saveTasks(updated);
      return updated;
    });

    setCollegeRecords((prev) => {
      const updated = prev.map((r) =>
        r.id === record.id ? { ...r, followUpCreated: true, linkedTaskId: newFollowUp.id } : r
      );
      saveCollegeRecords(updated);
      return updated;
    });

    showToast('Revision task created in Daily Tasks!');
  };

  // Health Handlers
  const handleSaveHealthInfo = (info: HealthPermanentInfo) => {
    setHealthInfo(info);
    saveHealthInfo(info);
    showToast('Health profile saved.');
  };

  const handleSaveHealthRecord = (
    recData: Omit<HealthRecord, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      setHealthRecords((prev) => {
        const updated = prev.map((r) => (r.id === editingId ? { ...r, ...recData } : r));
        saveHealthRecords(updated);
        return updated;
      });
      showToast('Health record updated.');
    } else {
      const newRec: HealthRecord = {
        ...recData,
        id: `hr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setHealthRecords((prev) => {
        const updated = [newRec, ...prev];
        saveHealthRecords(updated);
        return updated;
      });
      showToast('Health record logged.');
    }
  };

  const handleDeleteHealthRecord = (id: string) => {
    setHealthRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveHealthRecords(updated);
      return updated;
    });
    showToast('Health record deleted.');
  };

  const handleAddWeightEntry = (entry: WeightEntry) => {
    setHealthInfo((prev) => {
      const updated = {
        ...prev,
        weight: entry.weight,
        weightHistory: [entry, ...(prev.weightHistory || [])],
        updatedAt: new Date().toISOString(),
      };
      saveHealthInfo(updated);
      return updated;
    });
    showToast(`Logged weight: ${entry.weight} kg`);
  };

  // Current active alert task (top of queue)
  const currentDueAlertTask = dueAlertQueue.length > 0 ? dueAlertQueue[0] : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800 pb-20 md:pb-8">
      {/* 3-ZONE DESKTOP TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8 transition-all">
        {/* Zone 1: Single text wordmark with subtle clean badge */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-sm tracking-tight">SRV</span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight block leading-tight">
              SRV Tracker
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:block leading-none">
              Life · Academics · Health
            </span>
          </div>
        </div>

        {/* Zone 2: 4-5 Clean Nav links (visible on md+) */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'home'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'tasks'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Daily Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('college')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'college'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            College
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'health'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Health
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'reports'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Reports & Analytics
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsQuickTaskModalOpen(true)}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {activeTab === 'home' && (
          <HomeDashboard
            tasks={tasks}
            categories={categories}
            collegeRecords={collegeRecords}
            collegeEvents={collegeEvents}
            healthRecords={healthRecords}
            onNavigate={(tab) => setActiveTab(tab)}
            onToggleTaskStatus={handleToggleTaskStatus}
            onQuickAddTask={() => setIsQuickTaskModalOpen(true)}
          />
        )}

        {activeTab === 'tasks' && (
          <DailyTasksSection
            tasks={tasks}
            categories={categories}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'college' && (
          <CollegeSection
            records={collegeRecords}
            info={collegeInfo}
            events={collegeEvents}
            onSaveRecord={handleSaveCollegeRecord}
            onDeleteRecord={handleDeleteCollegeRecord}
            onToggleRecordStatus={handleToggleCollegeRecordStatus}
            onSaveInfo={handleSaveCollegeInfo}
            onSaveEvent={handleSaveCollegeEvent}
            onDeleteEvent={handleDeleteCollegeEvent}
            onCreateFollowUpTask={handleCreateFollowUpTask}
          />
        )}

        {activeTab === 'health' && (
          <HealthSection
            info={healthInfo}
            records={healthRecords}
            onSaveInfo={handleSaveHealthInfo}
            onSaveRecord={handleSaveHealthRecord}
            onDeleteRecord={handleDeleteHealthRecord}
            onAddWeightEntry={handleAddWeightEntry}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsSection
            tasks={tasks}
            categories={categories}
            collegeRecords={collegeRecords}
            collegeEvents={collegeEvents}
            healthRecords={healthRecords}
          />
        )}
      </main>

      {/* MOBILE BOTTOM TAB BAR (Navigation Anchor) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'tasks' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('college')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'college' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">College</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'health' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Health</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`min-h-[48px] flex flex-col items-center justify-center transition-colors ${
              activeTab === 'reports' ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Reports</span>
          </button>
        </div>
      </div>

      {/* PROMINENT IN-APP DUE REMINDER ALERT MODAL */}
      <DueReminderAlertModal
        task={currentDueAlertTask}
        categories={categories}
        onComplete={handleCompleteDueAlert}
        onSnooze={handleSnoozeDueAlert}
        onDismiss={handleDismissDueAlert}
      />

      {/* QUICK TASK MODAL */}
      <TaskFormModal
        isOpen={isQuickTaskModalOpen}
        categories={categories}
        onSave={(data) => {
          handleSaveTask(data);
          setIsQuickTaskModalOpen(false);
        }}
        onCancel={() => setIsQuickTaskModalOpen(false)}
      />

      {/* NON-INTRUSIVE FLOATING TOASTS */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 backdrop-blur-md text-white text-xs font-medium rounded-2xl shadow-xl flex items-center gap-2.5 animate-slide-up ${
              t.type === 'info'
                ? 'bg-indigo-900/95 ring-1 ring-indigo-400/30'
                : 'bg-slate-900/90'
            }`}
          >
            {t.type === 'info' ? (
              <Bell className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
