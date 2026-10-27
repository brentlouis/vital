/* What the pilot measures (concept note objectives 3–7) and the audit log, derived from the
   records — never stored separately, so they cannot drift from what happened. */

import { liveTrail, shownStatus, isVisit } from './flow';
import { MANUAL_BASELINE_HOURS, PEOPLE } from './reference';
import type { DemoState } from '../store/state';
import type { AppointmentRecord } from './types';
import type { Minute } from './time';

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Hours from Sent to the first result released, for a referral that has one. */
export function turnaroundHours(a: AppointmentRecord): number | null {
  if (a.origin !== 'Referred') return null;
  const sent = a.trail[0];
  const result = liveTrail(a).find(e => e.status === 'Endorsed');
  return result ? (result.at - sent.at) / 60 : null;
}

export interface SiteMeasure { lab: string; referrals: number; results: number; medianHours: number | null }

export function pilotMeasures(s: DemoState, now: Minute) {
  const referred = s.appointments.filter(a => a.origin === 'Referred' && !isVisit(a));
  const times = referred.map(turnaroundHours).filter((h): h is number => h !== null);
  const med = median(times);
  /* Arrival is confirmed when the receiving facility recorded it; only referrals whose time
     has passed count. */
  const due = referred.filter(a => a.slot < now && !['Declined', 'Consent revoked'].includes(shownStatus(a, now)));
  const arrived = due.filter(a => liveTrail(a).some(e => e.status === 'Patient arrived'));
  const results = s.appointments.flatMap(a => a.results).filter(r => r.voidedAt === undefined && r.released <= now);
  const labs = [...new Set(referred.map(a => a.lab))].sort();
  const sites: SiteMeasure[] = labs.map(lab => {
    const mine = referred.filter(a => a.lab === lab);
    return {
      lab, referrals: mine.length,
      results: mine.reduce((n, a) => n + a.results.filter(r => r.voidedAt === undefined).length, 0),
      medianHours: median(mine.map(turnaroundHours).filter((h): h is number => h !== null)),
    };
  });
  return {
    referrals: referred.length,
    completed: referred.filter(a => shownStatus(a, now) === 'Completed').length,
    medianHours: med,
    baselineHours: MANUAL_BASELINE_HOURS,
    reduction: med === null ? null : Math.round((1 - med / MANUAL_BASELINE_HOURS) * 100),
    arrivalsConfirmed: arrived.length, arrivalsDue: due.length,
    resultsDelivered: results.length,
    patients: PEOPLE.length,
    visits: s.appointments.filter(isVisit).length,
    issuesOpen: s.issues.filter(i => i.status === 'Open').length,
    issuesTotal: s.issues.length,
    sites,
  };
}

/* One line of the audit log: every status written to a trail, and every access check that
   was refused or that opened a patient's history. */
export interface AuditRow {
  at: Minute;
  actor: string;
  facility: string;
  patientId: string;
  kind: 'Status update' | 'Access';
  what: string;
  appointmentId?: string;
}

export function auditRows(s: DemoState): AuditRow[] {
  const updates: AuditRow[] = s.appointments.flatMap(a => a.trail.map(e => ({
    at: e.at, actor: e.actor, facility: e.facility, patientId: a.patientId, kind: 'Status update' as const,
    what: e.withdraws ? `Withdrew ${e.status}` : e.status, appointmentId: a.id,
  })));
  const access: AuditRow[] = s.audit.map(e => ({
    at: e.at, actor: e.actor, facility: e.facility, patientId: e.patientId, kind: 'Access' as const,
    what: e.action === 'Access denied' ? 'Access denied' : 'Viewed patient history',
  }));
  return [...updates, ...access].sort((a, b) => b.at - a.at);
}

/* Patients a facility is caring for: anyone with an appointment it sent or receives that is
   not closed, or that closed in the last 30 days. What the plan bracket counts. */
export function activePatients(s: DemoState, facility: string, now: Minute): number {
  const ids = new Set<string>();
  for (const a of s.appointments) {
    if (a.lab !== facility && a.fromFacility !== facility) continue;
    const last = a.trail[a.trail.length - 1].at;
    const status = shownStatus(a, now);
    if (!['Completed', 'Declined', 'No-show', 'Consent revoked'].includes(status) || now - last <= 30 * 1440) ids.add(a.patientId);
  }
  return ids.size;
}

/* A laboratory's track record from VITAL's own records, shown to Premium+ referrers: median
   hours from referral to result, and how often it accepts the referrals it decides on. */
export function labTrackRecord(s: DemoState, lab: string, now: Minute) {
  const mine = s.appointments.filter(a => a.lab === lab && a.origin === 'Referred' && !isVisit(a));
  const live = mine.map(a => liveTrail(a).filter(e => e.at <= now));
  const accepted = live.filter(t => t.some(e => e.status === 'Accepted')).length;
  const declined = live.filter(t => t.some(e => e.status === 'Declined') && !t.some(e => e.status === 'Accepted')).length;
  const decided = accepted + declined;
  return {
    medianHours: median(mine.map(turnaroundHours).filter((h): h is number => h !== null)),
    decided, rate: decided ? accepted / decided : null,
  };
}

