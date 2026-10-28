/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TaskCategory,
  TaskItem,
  CollegeRecord,
  CollegePermanentInfo,
  CollegeEvent,
  HealthPermanentInfo,
  HealthRecord,
} from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'srv_categories_v1',
  TASKS: 'srv_tasks_v1',
  COLLEGE_RECORDS: 'srv_college_records_v1',
  COLLEGE_INFO: 'srv_college_info_v1',
  COLLEGE_EVENTS: 'srv_college_events_v1',
  HEALTH_INFO: 'srv_health_info_v1',
  HEALTH_RECORDS: 'srv_health_records_v1',
  NOTIFICATIONS_ENABLED: 'srv_notifications_enabled_v1',
};

// Today helper
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'cat-college', name: 'College Routine', color: '#6366f1', icon: 'GraduationCap', isDefault: true },
  { id: 'cat-study', name: 'Study', color: '#8b5cf6', icon: 'BookOpen', isDefault: true },
  { id: 'cat-personal', name: 'Personal Work', color: '#3b82f6', icon: 'User', isDefault: true },
  { id: 'cat-exercise', name: 'Exercise', color: '#10b981', icon: 'Activity', isDefault: true },
  { id: 'cat-home', name: 'Home', color: '#f59e0b', icon: 'Home', isDefault: true },
  { id: 'cat-other', name: 'Other', color: '#64748b', icon: 'Bookmark', isDefault: true },
];

export const getInitialTasks = (): TaskItem[] => {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  return [
    {
      id: 'task-1',
      title: 'Ready for College & Pack Bag',
      categoryId: 'cat-college',
      description: 'Check timetable and bring lab manuals and notebooks.',
      date: today,
      reminderTime: '07:00 AM',
      reminderDate: today,
      priority: 'High',
      status: 'Completed',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Review Data Structures Lecture Notes',
      categoryId: 'cat-study',
      description: 'Revise binary tree traversals before afternoon test.',
      date: today,
      reminderTime: '04:30 PM',
      reminderDate: today,
      priority: 'Medium',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: '30-minute evening walk & stretch',
      categoryId: 'cat-exercise',
      description: 'Campus garden walking track to hit daily step goal.',
      date: today,
      reminderTime: '06:30 PM',
      reminderDate: today,
      priority: 'Low',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: 'Submit Operating System Lab Report',
      categoryId: 'cat-college',
      description: 'Upload signed PDF on the college student portal.',
      date: tomorrow,
      reminderTime: '10:00 AM',
      reminderDate: tomorrow,
      priority: 'High',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getInitialCollegeRecords = (): CollegeRecord[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'col-1',
      title: 'Web Engineering & React Architecture Lecture',
      recordType: 'Lecture',
      subject: 'Web Technologies',
      date: today,
      startTime: '09:30 AM',
      endTime: '11:00 AM',
      notes: 'Covered state management and component composition.',
      status: 'Completed',
      priority: 'High',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-2',
      title: 'Database Management Systems Lab',
      recordType: 'Lab / Practical',
      subject: 'DBMS',
      date: today,
      startTime: '11:30 AM',
      endTime: '01:00 PM',
      notes: 'Executed SQL schema and index query optimizations.',
      status: 'Completed',
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-3',
      title: 'Computer Networks - Packet Routing Analysis',
      recordType: 'Missed Class',
      subject: 'Computer Networks',
      date: today,
      startTime: '02:00 PM',
      endTime: '03:15 PM',
      notes: 'Could not attend due to university sports tryouts. Need to revise slide deck 4.',
      status: 'Missed',
      priority: 'High',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-4',
      title: 'Algorithm Design Analysis Revision',
      recordType: 'Study',
      subject: 'Design & Analysis of Algorithms',
      date: today,
      startTime: '05:00 PM',
      endTime: '06:30 PM',
      notes: 'Dynamic programming practice set questions 1 to 5.',
      status: 'Planned',
      priority: 'Medium',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getInitialCollegeInfo = (): CollegePermanentInfo => {
  return {
    collegeName: 'SRV Institute of Technology & Science',
    address: 'Academic City Campus, Knowledge Park Sector 4',
    course: 'B.Tech / Bachelor of Technology',
    department: 'Computer Science & Engineering',
    academicYear: '2025–2026',
    semester: 'Semester 5',
    rollNumber: 'CS-2024-042',
    studentName: 'Alex Sharma',
    classSection: 'CSE Section B',
    collegeIdNumber: 'SRV-STU-8821',
    officialWebsite: 'https://srv-institute.edu',
    contactInfo: 'alex.student@srv-institute.edu',
    facultyMentor: 'Prof. Ramesh Kulkarni (HOD CSE)',
    additionalNotes: 'Library card issued. Lab locker #34.',
    updatedAt: new Date().toISOString(),
  };
};

export const getInitialCollegeEvents = (): CollegeEvent[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'event-1',
      title: 'Mid-Term Examinations Begin',
      eventType: 'Exam',
      date: today,
      time: '10:00 AM',
      location: 'Examination Hall Block B',
      description: 'Syllabus covers units 1 to 3. Bring verified admit card.',
      status: 'Upcoming',
      reminder: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-2',
      title: 'Mini-Project Prototype Submission',
      eventType: 'Assignment Deadline',
      date: getTomorrowDateString(),
      time: '04:00 PM',
      location: 'Software Engineering Lab 2',
      description: 'Submit GitHub repository URL and 5-page report document.',
      status: 'Upcoming',
      reminder: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-3',
      title: 'Annual Technical Innovation Symposium',
      eventType: 'College Fest',
      date: '2026-11-12',
      time: '09:00 AM',
      location: 'Main Auditorium',
      description: 'Hackathon presentation and coding showcase.',
      status: 'Upcoming',
      reminder: false,
      createdAt: new Date().toISOString(),
    },
  ];
};

export const getInitialHealthInfo = (): HealthPermanentInfo => {
  const today = getTodayDateString();
  return {
    height: 174,
    weight: 68.5,
    bloodGroup: 'B+',
    allergies: 'None recorded. Mild dust sensitivity in spring.',
    generalHealthNotes: 'Hydration goal: 2.5L daily. Focus on 7-8 hours quality sleep.',
    additionalNotes: 'Emergency Contact: Home (+1-555-0192)',
    weightHistory: [
      { id: 'w-1', date: '2026-10-01', weight: 69.8, notes: 'Monthly baseline weigh-in' },
      { id: 'w-2', date: '2026-10-15', weight: 69.1, notes: 'Progress check' },
      { id: 'w-3', date: today, weight: 68.5, notes: 'Target range achieved' },
    ],
    updatedAt: new Date().toISOString(),
  };
};

export const getInitialHealthRecords = (): HealthRecord[] => {
  const today = getTodayDateString();
  return [
    {
      id: 'hr-1',
      measurementType: 'steps',
      value: 6420,
      unit: 'steps',
      date: today,
      time: '06:00 PM',
      notes: 'Campus commute and post-lecture walk',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hr-2',
      measurementType: 'heart_rate',
      value: 72,
      unit: 'bpm',
      date: today,
      time: '08:30 AM',
      notes: 'Resting pulse upon waking',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hr-3',
      measurementType: 'blood_pressure',
      value: 118,
      diastolic: 78,
      unit: 'mmHg',
      date: today,
      time: '09:00 AM',
      notes: 'Normal resting blood pressure',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hr-4',
      measurementType: 'walking_duration',
      value: 35,
      unit: 'minutes',
      date: today,
      time: '06:30 PM',
      notes: 'Evening stroll around sports ground',
      createdAt: new Date().toISOString(),
    },
  ];
};

// Safe storage utilities
export const loadCategories = (): TaskCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = (categories: TaskCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories', err);
  }
};

export const loadTasks = (): TaskItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      const initial = getInitialTasks();
      saveTasks(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveTasks = (tasks: TaskItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks', err);
  }
};

export const loadCollegeRecords = (): CollegeRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLEGE_RECORDS);
    if (!raw) {
      const initial = getInitialCollegeRecords();
      saveCollegeRecords(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCollegeRecords = (records: CollegeRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLEGE_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save college records', err);
  }
};

export const loadCollegeInfo = (): CollegePermanentInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLEGE_INFO);
    if (!raw) {
      const initial = getInitialCollegeInfo();
      saveCollegeInfo(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const saveCollegeInfo = (info: CollegePermanentInfo): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLEGE_INFO, JSON.stringify(info));
  } catch (err) {
    console.error('Failed to save college info', err);
  }
};

export const loadCollegeEvents = (): CollegeEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLEGE_EVENTS);
    if (!raw) {
      const initial = getInitialCollegeEvents();
      saveCollegeEvents(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCollegeEvents = (events: CollegeEvent[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLEGE_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save college events', err);
  }
};

export const loadHealthInfo = (): HealthPermanentInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_INFO);
    if (!raw) {
      const initial = getInitialHealthInfo();
      saveHealthInfo(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { weightHistory: [] };
  } catch {
    return { weightHistory: [] };
  }
};

export const saveHealthInfo = (info: HealthPermanentInfo): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_INFO, JSON.stringify(info));
  } catch (err) {
    console.error('Failed to save health info', err);
  }
};

export const loadHealthRecords = (): HealthRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
    if (!raw) {
      const initial = getInitialHealthRecords();
      saveHealthRecords(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveHealthRecords = (records: HealthRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save health records', err);
  }
};

export const loadNotificationPreference = (): boolean => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return val === 'true';
  } catch {
    return false;
  }
};

export const saveNotificationPreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save notification preference', err);
  }
};
