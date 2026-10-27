import type { AppointmentRecord } from './types';
import { liveTrail, storedStatus } from './flow';
import { dayIndex, toDate, type Minute } from './time';

/* Time estimates learned from the status trail: how long a patient will wait at a busy facility,
   and when results will be ready at any laboratory.

   The prototype has no model behind it. It stands in for one shared model trained on every
   facility's timestamps (arrival to result release), so a quiet laboratory borrows from similar
   ones until its own history is large enough: each facility's pace is pulled toward the network
   average in proportion to how little it has recorded (partial pooling). The figures below are
   synthetic, chosen to look like a pilot network a year in. */

/** Typical arrival-to-release time for each test, in minutes, declared by the laboratory when it
    joins. The starting point before any history exists. A vaccination has no result. */
export const TYPICAL_TURNAROUND: Record<string, number> = {
  CBC: 120, 'Fasting blood sugar': 90, Urinalysis: 60, 'Chest X-ray': 180,
  'Lipid profile': 240, 'Sputum smear': 1440, 'Pregnancy test': 30,
};

/** What the network has recorded at each laboratory (synthetic): completed requests on record,
    average requests a day, minutes per patient at the counter, and how its turnaround compares
    with the typical time (1.15 = 15% slower). */
export const FACILITY_HISTORY: Record<string, { requests: number; perDay: number; perPatient: number; pace: number }> = {
  'Tagbilaran Diagnostic Center': { requests: 1240, perDay: 38, perPatient: 6, pace: 1.15 },
  'Panglao Island Medical Lab': { requests: 420, perDay: 15, perPatient: 7, pace: 1.05 },
  'Dauis Bayview Laboratory': { requests: 310, perDay: 12, perPatient: 8, pace: 1 },
  'Baclayon Parish Diagnostics': { requests: 140, perDay: 6, perPatient: 10, pace: 0.95 },
  'Loon Heritage Clinical Lab': { requests: 60, perDay: 4, perPatient: 10, pace: 0.9 },
  'Loboc Riverside Laboratory': { requests: 25, perDay: 3, perPatient: 12, pace: 1 },
};

/** How many records a facility needs before its own pace counts as much as the network's. */
const POOLING = 150;
/** A queue estimate is shown only where people actually queue and there is history to learn from. */
const BUSY_PER_DAY = 20;
const BUSY_HISTORY = 200;

export interface Estimate {
  /** Present only at busy facilities, before the patient is seen. */
  wait?: { ahead: number; minutes: number };
  /** When results are likely to be released: a range, never a single minute. */
  result?: { from: Minute; to: Minute; overnight: boolean };
  /** Plain words on what the estimate rests on. */
  basis: string;
}

/* Round to the quarter hour on the clock (the demo's minute 0 is 09:41). */
const CLOCK_OFFSET = 9 * 60 + 41;
const round15 = (m: Minute) => Math.round((m + CLOCK_OFFSET) / 15) * 15 - CLOCK_OFFSET;

/* Patients typically queued at a busy counter at this hour: a morning peak (synthetic). */
function walkIns(perDay: number, at: Minute): number {
  const h = toDate(at).getHours();
  const load = h < 7 || h >= 17 ? 0 : h < 11 ? 1 : h < 14 ? 0.6 : 0.35;
  return Math.round((perDay / 8) * load);
}

/** The estimate for one test appointment, or null when there is nothing worth estimating. */
export function estimateFor(a: AppointmentRecord, all: AppointmentRecord[], now: Minute): Estimate | null {
  if (a.kind === 'Consultation') return null;
  const status = storedStatus(a);
  if (!['Accepted', 'Patient arrived'].includes(status)) return null;
  const hist = FACILITY_HISTORY[a.lab];
  const arrived = liveTrail(a).find(e => e.status === 'Patient arrived')?.at;
  const start = arrived ?? a.slot;

  /* Pace, pulled toward the network average (1) when the facility has little history. */
  const n = hist?.requests ?? 0;
  const pace = hist ? (n * hist.pace + POOLING) / (n + POOLING) : 1;
  const confidence = n / (n + POOLING);
  const basis = n >= BUSY_HISTORY
    ? `Estimated from ${n.toLocaleString('en-PH')} past requests at ${a.lab}.`
    : n > 0
      ? `Estimated from ${n} past requests at ${a.lab} and similar laboratories. It gets more precise as ${a.lab} records more.`
      : `Based on the usual time for these tests. It gets more precise as ${a.lab} records more.`;

  const out: Estimate = { basis };

  /* Queue: busy facilities only, on the day, before the result is under way. */
  const sameDay = dayIndex(start) === dayIndex(now);
  if (hist && hist.perDay >= BUSY_PER_DAY && n >= BUSY_HISTORY && sameDay && start - now < 3 * 60) {
    const waiting = all.filter(o => o.id !== a.id && o.lab === a.lab && storedStatus(o) === 'Patient arrived').length;
    const ahead = waiting + walkIns(hist.perDay, Math.max(now, start));
    if (ahead >= 2) out.wait = { ahead, minutes: Math.max(5, Math.round((ahead * hist.perPatient) / 5) * 5) };
  }

  /* Results: tests run side by side, so the slowest one sets the time. */
  const typical = Math.max(0, ...a.tests.map(t => TYPICAL_TURNAROUND[t] ?? 0));
  if (typical > 0) {
    const mid = (out.wait?.minutes ?? 0) + typical * pace;
    const spread = 0.12 + 0.35 * (1 - confidence);
    const from = round15(Math.max(start, now) + mid * (1 - spread * 0.6));
    const to = round15(Math.max(start, now) + mid * (1 + spread));
    out.result = { from, to: Math.max(to, from + 30), overnight: typical >= 12 * 60 };
  }
  return out.wait || out.result ? out : null;
}

/** Tests the patient must fast for, so they are best done first thing in the morning. */
const FASTING = ['Fasting blood sugar', 'Lipid profile'];
/** Hours a laboratory takes patients (the demo assumes the same hours everywhere). */
const OPENS = 7 * 60;
const LAST_SLOT = 16 * 60;
const CLOSES = 17 * 60;

export interface Suggestion {
  slot: Minute;
  /** At a busy laboratory the queue moves, so the patient gets an arrival window. */
  window?: { from: Minute; to: Minute };
  /** Plain words on why this time. */
  reason: string;
}

/* The same model picks the time everywhere; only what it has to avoid differs. At a busy
   laboratory that is the queue (walk-ins plus appointments already booked at that time); at a
   quiet one the wait is near zero at any hour, so the test's preparation and getting the result
   back the same day decide. As a quiet laboratory records more, it behaves like a busy one. */
export function suggestTime(lab: string, tests: string[], day: Minute, all: AppointmentRecord[], now: Minute,
  exclude?: Minute): Suggestion | null {
  const hist = FACILITY_HISTORY[lab];
  const busy = !!hist && hist.perDay >= BUSY_PER_DAY && hist.requests >= BUSY_HISTORY;
  const perPatient = hist?.perPatient ?? 10;
  const n = hist?.requests ?? 0;
  const pace = hist ? (n * hist.pace + POOLING) / (n + POOLING) : 1;
  const fasting = tests.some(t => FASTING.includes(t));
  const typical = Math.max(0, ...tests.map(t => TYPICAL_TURNAROUND[t] ?? 0));
  const overnight = typical >= 12 * 60;
  const midnight = day - (toDate(day).getHours() * 60 + toDate(day).getMinutes());
  const booked = all.filter(o => o.lab === lab && dayIndex(o.slot) === dayIndex(day)
    && !['Declined', 'Consent revoked', 'No-show'].includes(storedStatus(o)));

  let best: { slot: Minute; score: number } | null = null;
  for (let t = OPENS; t <= LAST_SLOT; t += 30) {
    const slot = midnight + t;
    if (slot <= now + 30 || slot === exclude) continue;
    const already = booked.filter(o => Math.abs(o.slot - slot) < 30).length;
    const wait = ((busy ? walkIns(hist!.perDay, slot) : 0) + already) * perPatient;
    const late = fasting && t > 10 * 60 ? 180 : 0;
    const sameDay = overnight || t + typical * pace <= CLOSES ? 0 : 90;
    const score = wait + late + sameDay + (t - OPENS) * 0.01;
    if (!best || score < best.score) best = { slot, score };
  }
  if (!best) return null;
  const reason = busy
    ? (fasting ? 'Early for the fasting test, at the shortest expected wait' : `Shortest expected wait at ${lab}`)
    : fasting ? 'Early, for the fasting test, with results the same day'
      : overnight ? 'Earliest open time' : 'Earliest time with results back the same day';
  return { slot: best.slot, ...(busy ? { window: { from: best.slot, to: best.slot + 30 } } : {}), reason };
}
