/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  explanation: string;
}

export const getBrowserNotificationStatus = (): NotificationStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      permission: 'unsupported',
      explanation:
        'Your current browser environment does not support native web desktop/mobile notifications. In-app alerts will be used instead.',
    };
  }

  const perm = Notification.permission;
  let explanation = '';
  if (perm === 'granted') {
    explanation =
      'System notifications are allowed. You will receive native notification banners while the app is running in your browser.';
  } else if (perm === 'denied') {
    explanation =
      'Notifications are blocked in your browser site permissions. In-app alerts will still appear when reminders are due while the tab is open.';
  } else {
    explanation =
      'Click Enable Reminders to allow native desktop/mobile notification banners.';
  }

  return {
    supported: true,
    permission: perm,
    explanation,
  };
};

export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission', err);
    return false;
  }
};

export const triggerBrowserNotification = (
  title: string,
  options?: NotificationOptions
): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.warn('Failed to dispatch native notification', err);
    return false;
  }
};

/**
 * Plays a pleasant reminder audio chime using native Web Audio API.
 * Requires no external audio files or network requests.
 */
export const playReminderChime = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Two-tone chime: D5 (587.33Hz) -> A5 (880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.setValueAtTime(880, now + 0.15);

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);
  } catch (e) {
    // Audio might be silenced if page has had no user interaction yet; ignore safely
    console.debug('Chime could not play', e);
  }
};

/**
 * Normalizes any reminder time string to standard "HH:MM AM/PM" format.
 * Examples:
 * - "2:15 PM" -> "02:15 PM"
 * - "2:15" -> "02:15 AM" (or 24-hr converted)
 * - "14:15" -> "02:15 PM"
 * - "02:15 AM" -> "02:15 AM"
 */
export const normalizeReminderTimeString = (timeStr?: string): string => {
  if (!timeStr) return '';
  const clean = timeStr.trim();

  // Match 12-hour: e.g. "2:15 PM", "02:15am", "2:15PM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = String(parseInt(match12[2], 10)).padStart(2, '0');
    const p = match12[3].toUpperCase();
    if (h < 1) h = 12;
    if (h > 12) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${p}`;
  }

  // Match 24-hour: e.g. "14:15", "02:15", "2:15"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let h = parseInt(match24[1], 10);
    const m = String(parseInt(match24[2], 10)).padStart(2, '0');
    let p = 'AM';
    if (h >= 12) {
      p = 'PM';
      if (h > 12) h -= 12;
    } else if (h === 0) {
      h = 12;
    }
    return `${String(h).padStart(2, '0')}:${m} ${p}`;
  }

  return clean;
};

/**
 * Parses date "YYYY-MM-DD" and time ("02:15 PM", "2:15 PM", "14:15", "2:15") into a Date object.
 * Returns null if invalid.
 */
export const parseTaskReminderDateTime = (dateStr?: string, timeStr?: string): Date | null => {
  if (!dateStr || !timeStr) return null;

  const cleanTime = timeStr.trim();
  const match12 = cleanTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  let hours = -1;
  let minutes = -1;

  if (match12) {
    let h = parseInt(match12[1], 10);
    minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === 'PM') {
      if (h < 12) h += 12;
    } else if (period === 'AM') {
      if (h === 12) h = 0;
    }
    hours = h;
  } else if (match24) {
    hours = parseInt(match24[1], 10);
    minutes = parseInt(match24[2], 10);
  } else {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const d = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(d.getTime()) ? null : d;
};
