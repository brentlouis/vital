/* The prototype clock. Every time in VITAL is a whole number of minutes relative to the
   moment the demo opens — Tuesday 15 September 2026, 09:41 — so negative is the past and
   positive the future. The store advances the clock as people act, and the prototype bar can
   jump it forward to show a slot going overdue or a response window running out. */

export type Minute = number;

export const BASE = new Date(2026, 8, 15, 9, 41).getTime();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LONG_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const pad = (n: number) => String(n).padStart(2, '0');

export const DAY = 1440;
export const HOUR = 60;

export function toDate(m: Minute): Date {
  return new Date(BASE + m * 60000);
}

/** "15 Sep · 09:41" — every timestamp in a trail or a queue. */
export function fmt(m: Minute): string {
  const d = toDate(m);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "09:30" */
export function fmtTime(m: Minute): string {
  const d = toDate(m);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "Wed 16 Sep" */
export function fmtDay(m: Minute): string {
  const d = toDate(m);
  return `${WEEKDAYS[d.getDay()]} ${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** "Wednesday 16 September 2026" */
export function fmtDayLong(m: Minute): string {
  const d = toDate(m);
  return `${LONG_WEEKDAYS[d.getDay()]} ${d.getDate()} ${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Wed 16 Sep · 09:30" — a slot a person chooses, where the weekday matters. */
export function fmtSlot(m: Minute): string {
  return `${fmtDay(m)} · ${fmtTime(m)}`;
}

/** "02 Feb 2026" */
export function fmtDate(m: Minute): string {
  const d = toDate(m);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** The minute of `time` ("09:30") on the day `dayOffset` days from the demo's first day. */
export function at(dayOffset: number, time: string): Minute {
  const [h, mm] = time.split(':').map(Number);
  const d = new Date(BASE);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, mm, 0, 0);
  return Math.round((d.getTime() - BASE) / 60000);
}

/** Whole days from the demo's first day to the calendar day containing `m`. */
export function dayIndex(m: Minute): number {
  const start = new Date(BASE); start.setHours(0, 0, 0, 0);
  const d = toDate(m); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - start.getTime()) / 86400000);
}

/** "2 hours ago" */
export function ago(now: Minute, m: Minute): string {
  const mins = Math.max(0, now - m);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  const d = Math.round(mins / 1440);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}
