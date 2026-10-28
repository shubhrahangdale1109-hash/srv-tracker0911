/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Clock, Plus, Minus, Sun, Moon } from 'lucide-react';

interface ClockPickerModalProps {
  isOpen: boolean;
  initialTime?: string; // e.g. "07:30 AM", "2:15 PM", "14:15", or empty
  onConfirm: (timeString: string) => void;
  onCancel: () => void;
}

export const ClockPickerModal: React.FC<ClockPickerModalProps> = ({
  isOpen,
  initialTime,
  onConfirm,
  onCancel,
}) => {
  const [selectedHour, setSelectedHour] = useState<number>(2);
  const [selectedMinute, setSelectedMinute] = useState<number>(15);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [step, setStep] = useState<'hour' | 'minute'>('hour');

  // Parse initialTime or compute smart default on open
  useEffect(() => {
    if (isOpen) {
      setStep('hour');

      if (initialTime && initialTime.trim() !== '') {
        const clean = initialTime.trim();

        // 12-hour format: "2:15 PM", "02:15 AM", "2:15PM"
        const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
        if (match12) {
          const h = parseInt(match12[1], 10);
          const m = parseInt(match12[2], 10);
          const p = match12[3].toUpperCase() === 'PM' ? 'PM' : 'AM';
          setSelectedHour(h >= 1 && h <= 12 ? h : 12);
          setSelectedMinute(m >= 0 && m <= 59 ? m : 0);
          setSelectedPeriod(p);
          return;
        }

        // 24-hour format: "14:15", "02:15", "2:15"
        const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          let h = parseInt(match24[1], 10);
          const m = parseInt(match24[2], 10);
          const p = h >= 12 ? 'PM' : 'AM';
          if (h > 12) h -= 12;
          if (h === 0) h = 12;
          setSelectedHour(h >= 1 && h <= 12 ? h : 12);
          setSelectedMinute(m >= 0 && m <= 59 ? m : 0);
          setSelectedPeriod(p);
          return;
        }
      }

      // If no initialTime given, default to current local time rounded up to nearest 5 mins
      const now = new Date();
      let h = now.getHours();
      const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      const m = Math.ceil(now.getMinutes() / 5) * 5 % 60;

      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedPeriod(p);
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const formattedHour = String(selectedHour).padStart(2, '0');
  const formattedMinute = String(selectedMinute).padStart(2, '0');
  const formattedTimeString = `${formattedHour}:${formattedMinute} ${selectedPeriod}`;

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    // Smoothly progress to minute selection
    setStep('minute');
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    onConfirm(formattedTimeString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clock-picker-title"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
            <h2 id="clock-picker-title" className="text-base font-bold text-slate-800">
              12-Hour Clock Reminder
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close time picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Time Display & AM/PM Banner */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-white p-5 text-center">
          <div className="flex items-center justify-center gap-2">
            {/* Hour Block */}
            <button
              type="button"
              onClick={() => setStep('hour')}
              className={`text-3xl font-bold font-mono px-3.5 py-1.5 rounded-2xl transition-all ${
                step === 'hour'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105 ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
              }`}
              title="Click to select hour"
            >
              {formattedHour}
            </button>

            <span className="text-2xl font-bold text-slate-400">:</span>

            {/* Minute Block */}
            <button
              type="button"
              onClick={() => setStep('minute')}
              className={`text-3xl font-bold font-mono px-3.5 py-1.5 rounded-2xl transition-all ${
                step === 'minute'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105 ring-2 ring-indigo-300'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
              }`}
              title="Click to select minutes"
            >
              {formattedMinute}
            </button>

            {/* AM / PM Segmented Control */}
            <div className="flex flex-col gap-1 ml-2">
              <button
                type="button"
                onClick={() => setSelectedPeriod('AM')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  selectedPeriod === 'AM'
                    ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-1 ring-indigo-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Morning (AM)"
              >
                <Sun className="w-3 h-3" />
                AM
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('PM')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                  selectedPeriod === 'PM'
                    ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-1 ring-indigo-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                title="Afternoon / Evening (PM)"
              >
                <Moon className="w-3 h-3" />
                PM
              </button>
            </div>
          </div>

          {/* Descriptive helper text */}
          <div className="mt-2 text-xs font-semibold text-indigo-900/80">
            {formattedHour}:{formattedMinute} {selectedPeriod} (
            {selectedPeriod === 'AM' ? 'Morning' : 'Afternoon / Evening'})
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-4 mt-2 text-xs font-medium text-slate-500">
            <button
              type="button"
              onClick={() => setStep('hour')}
              className={`transition-colors underline-offset-4 ${
                step === 'hour' ? 'text-indigo-600 font-bold underline' : 'hover:text-slate-800'
              }`}
            >
              1. Hour ({selectedHour})
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setStep('minute')}
              className={`transition-colors underline-offset-4 ${
                step === 'minute' ? 'text-indigo-600 font-bold underline' : 'hover:text-slate-800'
              }`}
            >
              2. Minutes (:{formattedMinute})
            </button>
          </div>
        </div>

        {/* Clock Face Surface */}
        <div className="p-5 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 rounded-full bg-slate-50 border-2 border-indigo-100 flex items-center justify-center shadow-inner select-none">
            {/* Center Pivot Point */}
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 z-20 shadow-xs ring-4 ring-indigo-100" />

            {/* Clock Hand / Pointer */}
            {step === 'hour' && (
              <div
                className="absolute origin-bottom z-10 pointer-events-none transition-transform duration-200 ease-out"
                style={{
                  height: '78px',
                  width: '2px',
                  bottom: '50%',
                  left: 'calc(50% - 1px)',
                  transform: `rotate(${((selectedHour % 12) * 30)}deg)`,
                  backgroundColor: '#4f46e5',
                }}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 -translate-x-[13px] -translate-y-3 opacity-20" />
              </div>
            )}

            {step === 'minute' && (
              <div
                className="absolute origin-bottom z-10 pointer-events-none transition-transform duration-150 ease-out"
                style={{
                  height: '92px',
                  width: '2px',
                  bottom: '50%',
                  left: 'calc(50% - 1px)',
                  transform: `rotate(${selectedMinute * 6}deg)`,
                  backgroundColor: '#4f46e5',
                }}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 -translate-x-[13px] -translate-y-3 opacity-20" />
              </div>
            )}

            {/* Circular Hour or Minute Numbers */}
            {step === 'hour'
              ? hoursList.map((h, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 95; // px from center
                  const x = Math.round(radius * Math.cos(angle));
                  const y = Math.round(radius * Math.sin(angle));
                  const isSelected = selectedHour === h;

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHourSelect(h)}
                      className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all z-20 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-110 font-bold'
                          : 'text-slate-700 hover:bg-indigo-100/70 active:scale-95'
                      }`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      aria-label={`${h} o'clock`}
                    >
                      {h}
                    </button>
                  );
                })
              : minutesList.map((m, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 95; // px from center
                  const x = Math.round(radius * Math.cos(angle));
                  const y = Math.round(radius * Math.sin(angle));
                  const isSelected = selectedMinute === m;

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinuteSelect(m)}
                      className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all z-20 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-110 font-bold'
                          : 'text-slate-700 hover:bg-indigo-100/70 active:scale-95'
                      }`}
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      aria-label={`${m} minutes`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
          </div>

          {/* Quick Minute Presets & Fine-Tuning */}
          <div className="w-full flex flex-col items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              {[0, 15, 30, 45].map((mVal) => (
                <button
                  key={mVal}
                  type="button"
                  onClick={() => setSelectedMinute(mVal)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    selectedMinute === mVal
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  :{String(mVal).padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev > 0 ? prev - 1 : 59))}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Decrease 1 minute"
              >
                <Minus className="w-3.5 h-3.5" /> 1m
              </button>
              <span className="text-xs text-slate-500 font-mono font-bold">
                :{formattedMinute}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev < 59 ? prev + 1 : 0))}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Increase 1 minute"
              >
                <Plus className="w-3.5 h-3.5" /> 1m
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Confirm ({formattedTimeString})
          </button>
        </div>
      </div>
    </div>
  );
};
