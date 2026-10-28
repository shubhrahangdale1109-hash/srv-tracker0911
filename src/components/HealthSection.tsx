/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Heart,
  Footprints,
  Activity,
  Timer,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Check,
  X,
  Shield,
  History,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  HealthPermanentInfo,
  HealthRecord,
  HealthMeasurementType,
  WeightEntry,
} from '../types';
import { getTodayDateString } from '../utils/storage';
import { ClockPickerModal } from './ClockPickerModal';

interface HealthSectionProps {
  info: HealthPermanentInfo;
  records: HealthRecord[];
  onSaveInfo: (info: HealthPermanentInfo) => void;
  onSaveRecord: (record: Omit<HealthRecord, 'id' | 'createdAt'>, editingId?: string) => void;
  onDeleteRecord: (id: string) => void;
  onAddWeightEntry: (entry: WeightEntry) => void;
}

export const HealthSection: React.FC<HealthSectionProps> = ({
  info,
  records,
  onSaveInfo,
  onSaveRecord,
  onDeleteRecord,
  onAddWeightEntry,
}) => {
  // Subsections switcher: 'tracking' (Daily Health Tracking) vs 'permanent' (Permanent Health Info & Weight History)
  const [activeTab, setActiveTab] = useState<'tracking' | 'permanent'>('tracking');

  // Filter for Daily Tracking
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Record Form Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<HealthRecord | null>(null);

  // Form fields for record
  const [measurementType, setMeasurementType] =
    useState<HealthMeasurementType>('steps');
  const [primaryValue, setPrimaryValue] = useState<string>('6000');
  const [diastolicValue, setDiastolicValue] = useState<string>('80');
  const [recDate, setRecDate] = useState(getTodayDateString());
  const [recTime, setRecTime] = useState('08:00 AM');
  const [recNotes, setRecNotes] = useState('');
  const [isClockPickerOpen, setIsClockPickerOpen] = useState(false);

  // Permanent Info Editing State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempHeight, setTempHeight] = useState<string>(info.height ? String(info.height) : '');
  const [tempWeight, setTempWeight] = useState<string>(info.weight ? String(info.weight) : '');
  const [tempBloodGroup, setTempBloodGroup] = useState<string>(info.bloodGroup || '');
  const [tempAllergies, setTempAllergies] = useState<string>(info.allergies || '');
  const [tempHealthNotes, setTempHealthNotes] = useState<string>(info.generalHealthNotes || '');

  // New weight log modal
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeightVal, setNewWeightVal] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(getTodayDateString());
  const [newWeightNotes, setNewWeightNotes] = useState('');

  const today = getTodayDateString();

  const openNewRecordModal = (type: HealthMeasurementType = 'steps') => {
    setEditingRecord(null);
    setMeasurementType(type);
    if (type === 'steps') setPrimaryValue('5000');
    else if (type === 'heart_rate') setPrimaryValue('72');
    else if (type === 'blood_pressure') {
      setPrimaryValue('120');
      setDiastolicValue('80');
    } else if (type === 'walking_duration') setPrimaryValue('30');
    setRecDate(today);
    setRecTime('08:30 AM');
    setRecNotes('');
    setIsRecordModalOpen(true);
  };

  const openEditRecordModal = (rec: HealthRecord) => {
    setEditingRecord(rec);
    setMeasurementType(rec.measurementType);
    setPrimaryValue(String(rec.value));
    setDiastolicValue(rec.diastolic ? String(rec.diastolic) : '80');
    setRecDate(rec.date);
    setRecTime(rec.time);
    setRecNotes(rec.notes || '');
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(primaryValue);
    if (isNaN(val)) return;

    let unit = 'steps';
    if (measurementType === 'heart_rate') unit = 'bpm';
    if (measurementType === 'blood_pressure') unit = 'mmHg';
    if (measurementType === 'walking_duration') unit = 'minutes';

    onSaveRecord(
      {
        measurementType,
        value: val,
        diastolic:
          measurementType === 'blood_pressure' ? parseFloat(diastolicValue) || 80 : undefined,
        unit,
        date: recDate,
        time: recTime,
        notes: recNotes.trim() || undefined,
      },
      editingRecord ? editingRecord.id : undefined
    );
    setIsRecordModalOpen(false);
  };

  const handleSavePermanentInfo = () => {
    const updated: HealthPermanentInfo = {
      ...info,
      height: tempHeight ? parseFloat(tempHeight) : undefined,
      weight: tempWeight ? parseFloat(tempWeight) : undefined,
      bloodGroup: tempBloodGroup.trim() || undefined,
      allergies: tempAllergies.trim() || undefined,
      generalHealthNotes: tempHealthNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    onSaveInfo(updated);
    setIsEditingInfo(false);
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightVal);
    if (isNaN(w) || w <= 0) return;

    onAddWeightEntry({
      id: `w-${Date.now()}`,
      date: newWeightDate,
      weight: w,
      notes: newWeightNotes.trim() || undefined,
    });

    setIsWeightModalOpen(false);
    setNewWeightVal('');
    setNewWeightNotes('');
  };

  // Filter Records
  const filteredRecords = records.filter((r) => {
    if (selectedTypeFilter !== 'all' && r.measurementType !== selectedTypeFilter) {
      return false;
    }
    if (dateFilter === 'today' && r.date !== today) return false;
    return true;
  });

  // Calculate quick stats
  const todaySteps = records
    .filter((r) => r.measurementType === 'steps' && r.date === today)
    .reduce((sum, r) => sum + r.value, 0);

  const latestHR = records
    .filter((r) => r.measurementType === 'heart_rate')
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.value;

  const latestBP = records
    .filter((r) => r.measurementType === 'blood_pressure')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const todayWalkMin = records
    .filter((r) => r.measurementType === 'walking_duration' && r.date === today)
    .reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Personal Health & Wellness
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log steps, heart rate, blood pressure, walking duration, and physical profile.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'tracking'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Tracking
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
            Permanent Info & Weight
          </button>
        </div>
      </div>

      {/* Transparent Manual Entry Notice */}
      <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p>
          <span className="font-bold">Private & Manual:</span> All health entries are stored purely in your browser&apos;s local storage. This application does not connect to external smartwatches, simulate fake Bluetooth data, or share personal biometrics with external APIs.
        </p>
      </div>

      {/* SUBSECTION 1: DAILY HEALTH TRACKING */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stat Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Steps */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Steps Today</span>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {todaySteps.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1">steps</span>
              </div>
            </div>

            {/* Heart Rate */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Latest Pulse</span>
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {latestHR || '—'}
                </span>
                <span className="text-xs text-slate-400 ml-1">bpm</span>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Blood Pressure</span>
                <div className="w-7 h-7 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {latestBP ? `${latestBP.value}/${latestBP.diastolic}` : '—'}
                </span>
                <span className="text-xs text-slate-400 ml-1">mmHg</span>
              </div>
            </div>

            {/* Walking */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Walk Duration</span>
                <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Timer className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {todayWalkMin}
                </span>
                <span className="text-xs text-slate-400 ml-1">min</span>
              </div>
            </div>
          </div>

          {/* Action Row & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
            {/* Filter by measurement */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: 'All Metrics' },
                  { id: 'steps', label: 'Steps' },
                  { id: 'blood_pressure', label: 'Blood Pressure' },
                  { id: 'heart_rate', label: 'Heart Rate' },
                  { id: 'walking_duration', label: 'Walking' },
                ] as { id: string; label: string }[]
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                    selectedTypeFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Add Record CTA */}
            <button
              type="button"
              onClick={() => openNewRecordModal('steps')}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Health Record</span>
            </button>
          </div>

          {/* Records History List */}
          <div className="space-y-2.5">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
                <Activity className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No health records recorded</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Record daily steps, resting heart rate, blood pressure readings, or walking sessions to see historical logs.
                </p>
              </div>
            ) : (
              filteredRecords.map((r) => {
                const isSteps = r.measurementType === 'steps';
                const isBP = r.measurementType === 'blood_pressure';
                const isHR = r.measurementType === 'heart_rate';
                const isWalk = r.measurementType === 'walking_duration';

                let displayTitle = 'Metric Entry';
                let icon = <Activity className="w-4 h-4 text-indigo-600" />;
                let formattedVal = `${r.value} ${r.unit}`;

                if (isSteps) {
                  displayTitle = 'Daily Steps';
                  icon = <Footprints className="w-4 h-4 text-emerald-600" />;
                  formattedVal = `${r.value.toLocaleString()} steps`;
                } else if (isBP) {
                  displayTitle = 'Blood Pressure Reading';
                  icon = <Activity className="w-4 h-4 text-violet-600" />;
                  formattedVal = `${r.value}/${r.diastolic} mmHg`;
                } else if (isHR) {
                  displayTitle = 'Heart Rate';
                  icon = <Heart className="w-4 h-4 text-rose-600" />;
                  formattedVal = `${r.value} bpm`;
                } else if (isWalk) {
                  displayTitle = 'Walking Duration';
                  icon = <Timer className="w-4 h-4 text-amber-600" />;
                  formattedVal = `${r.value} minutes`;
                }

                return (
                  <div
                    key={r.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xs flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        {icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800">{displayTitle}</h4>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-bold font-mono text-indigo-700">
                            {formattedVal}
                          </span>
                        </div>
                        {r.notes && (
                          <p className="text-xs text-slate-500 truncate">{r.notes}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{r.date}</span>
                          <span>·</span>
                          <span className="font-mono">{r.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditRecordModal(r)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordToDelete(r)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Delete Entry"
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

      {/* SUBSECTION 2: PERMANENT HEALTH INFORMATION & WEIGHT HISTORY */}
      {activeTab === 'permanent' && (
        <div className="space-y-6 animate-fade-in">
          {/* Permanent Bio Info Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Permanent Health Profile
                </h3>
                <p className="text-[11px] text-slate-400">
                  Stable health measurements that do not require daily logging.
                </p>
              </div>

              {!isEditingInfo ? (
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
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
                    onClick={handleSavePermanentInfo}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Profile
                  </button>
                </div>
              )}
            </div>

            {isEditingInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={tempHeight}
                    onChange={(e) => setTempHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempWeight}
                    onChange={(e) => setTempWeight(e.target.value)}
                    placeholder="e.g. 68.5"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={tempBloodGroup}
                    onChange={(e) => setTempBloodGroup(e.target.value)}
                    placeholder="e.g. B+"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-medium mb-1">Allergies</label>
                  <input
                    type="text"
                    value={tempAllergies}
                    onChange={(e) => setTempAllergies(e.target.value)}
                    placeholder="e.g. None known, or dust sensitivity"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-medium mb-1">
                    General Health Notes & Goals
                  </label>
                  <textarea
                    rows={2}
                    value={tempHealthNotes}
                    onChange={(e) => setTempHealthNotes(e.target.value)}
                    placeholder="e.g. Daily water goal: 2.5L, 8 hours sleep target"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Height</span>
                  <span className="font-semibold text-slate-800">
                    {info.height ? `${info.height} cm` : 'Not recorded'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Weight</span>
                  <span className="font-semibold text-slate-800">
                    {info.weight ? `${info.weight} kg` : 'Not recorded'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Blood Group</span>
                  <span className="font-semibold text-slate-800">
                    {info.bloodGroup || 'Not recorded'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Allergies</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {info.allergies || 'None recorded'}
                  </span>
                </div>
                {info.generalHealthNotes && (
                  <div className="p-3 bg-slate-50 rounded-2xl sm:col-span-4">
                    <span className="text-slate-400 block text-[11px]">Health Notes</span>
                    <span className="text-slate-700">{info.generalHealthNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Weight Log History */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Weight Log History</h3>
                  <p className="text-[11px] text-slate-400">
                    Track weight measurements over time with dated checkpoints.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewWeightVal(info.weight ? String(info.weight) : '');
                  setNewWeightDate(today);
                  setIsWeightModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Weight
              </button>
            </div>

            <div className="space-y-2">
              {(!info.weightHistory || info.weightHistory.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No weight entries recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                  {info.weightHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">{item.date}</span>
                        {item.notes && <span className="text-slate-400">· {item.notes}</span>}
                      </div>
                      <span className="font-bold font-mono text-indigo-700">
                        {item.weight} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Creation / Edit Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingRecord ? 'Edit Health Entry' : 'Log Health Entry'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Metric Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'steps', label: 'Steps' },
                      { id: 'heart_rate', label: 'Heart Rate (bpm)' },
                      { id: 'blood_pressure', label: 'Blood Pressure' },
                      { id: 'walking_duration', label: 'Walking (min)' },
                    ] as { id: HealthMeasurementType; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMeasurementType(m.id);
                        if (m.id === 'steps') setPrimaryValue('6000');
                        if (m.id === 'heart_rate') setPrimaryValue('72');
                        if (m.id === 'blood_pressure') {
                          setPrimaryValue('120');
                          setDiastolicValue('80');
                        }
                        if (m.id === 'walking_duration') setPrimaryValue('30');
                      }}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-colors ${
                        measurementType === m.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Input(s) */}
              {measurementType === 'blood_pressure' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="120"
                      value={primaryValue}
                      onChange={(e) => setPrimaryValue(e.target.value)}
                      className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="80"
                      value={diastolicValue}
                      onChange={(e) => setDiastolicValue(e.target.value)}
                      className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Value ({measurementType === 'steps' ? 'steps count' : measurementType === 'heart_rate' ? 'bpm' : 'minutes'})
                  </label>
                  <input
                    type="number"
                    required
                    value={primaryValue}
                    onChange={(e) => setPrimaryValue(e.target.value)}
                    className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                  <button
                    type="button"
                    onClick={() => setIsClockPickerOpen(true)}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left"
                  >
                    {recTime || 'Pick Time'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Post-lunch walk or morning resting rate"
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock Picker Modal for Health Record Time */}
      <ClockPickerModal
        isOpen={isClockPickerOpen}
        initialTime={recTime || '08:00 AM'}
        onConfirm={(picked) => {
          setRecTime(picked);
          setIsClockPickerOpen(false);
        }}
        onCancel={() => setIsClockPickerOpen(false)}
      />

      {/* Weight Log Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Log Weight Checkpoint</h3>
            <form onSubmit={handleAddWeight} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Weight in Kilograms (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 68.5"
                  value={newWeightVal}
                  onChange={(e) => setNewWeightVal(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning baseline"
                  value={newWeightNotes}
                  onChange={(e) => setNewWeightNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="py-2 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Weight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Deletion Confirmation */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Health Record?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this {recordToDelete.measurementType.replace('_', ' ')} record from {recordToDelete.date}?
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
    </div>
  );
};
