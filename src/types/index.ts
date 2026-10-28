/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface TaskCategory {
  id: string;
  name: string;
  color: string; // Tailwind pastel accent or hex
  icon: string;
  isDefault?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  categoryId: string;
  description?: string;
  date: string; // YYYY-MM-DD
  reminderTime?: string; // e.g. "07:30 AM"
  reminderDate?: string; // YYYY-MM-DD
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  reminderNotified?: boolean;
}

export type CollegeRecordType =
  | 'Lecture'
  | 'Study'
  | 'Assignment'
  | 'Missed Class'
  | 'Revision'
  | 'Lab / Practical'
  | 'Project'
  | 'Exam Prep'
  | 'College Event'
  | 'Administrative'
  | 'Other';

export type CollegeRecordStatus = 'Planned' | 'Pending' | 'Completed' | 'Missed';

export interface CollegeRecord {
  id: string;
  title: string;
  recordType: CollegeRecordType;
  subject?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "09:00 AM"
  endTime?: string; // e.g. "10:30 AM"
  notes?: string;
  status: CollegeRecordStatus;
  priority?: Priority;
  linkedTaskId?: string; // if created as follow-up task in Tasks
  followUpCreated?: boolean;
  createdAt: string;
}

export interface CollegePermanentInfo {
  collegeName?: string;
  address?: string;
  course?: string;
  department?: string;
  academicYear?: string;
  semester?: string;
  rollNumber?: string;
  studentName?: string;
  classSection?: string;
  collegeIdNumber?: string;
  officialWebsite?: string;
  contactInfo?: string;
  facultyMentor?: string;
  additionalNotes?: string;
  updatedAt?: string;
}

export type CollegeEventType =
  | 'Exam'
  | 'Assignment Deadline'
  | 'College Fest'
  | 'Practical Exam'
  | 'Project Presentation'
  | 'Fee Submission'
  | 'Important Meeting'
  | 'Other';

export interface CollegeEvent {
  id: string;
  title: string;
  eventType: CollegeEventType;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  description?: string;
  reminder?: boolean;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  notes?: string;
}

export interface HealthPermanentInfo {
  height?: number; // cm
  weight?: number; // kg
  bloodGroup?: string;
  allergies?: string;
  generalHealthNotes?: string;
  additionalNotes?: string;
  weightHistory: WeightEntry[];
  updatedAt?: string;
}

export type HealthMeasurementType =
  | 'steps'
  | 'blood_pressure'
  | 'heart_rate'
  | 'walking_duration';

export interface HealthRecord {
  id: string;
  measurementType: HealthMeasurementType;
  value: number; // For steps, heart rate (bpm), walking duration (min). For BP: systolic
  diastolic?: number; // for blood pressure
  unit: string; // 'steps', 'mmHg', 'bpm', 'minutes'
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:15 AM"
  notes?: string;
  createdAt: string;
}

export type AppTab = 'home' | 'tasks' | 'college' | 'health' | 'reports';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}
