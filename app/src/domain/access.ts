/* Who may read what (brief §10.5): every read is checked against consent, never against
   facility identity alone. */

import type { AppointmentRecord, HistoryGrant, StandingGrant, Viewer } from './types';
import { isTerminal, shownStatus } from './flow';
import type { Minute } from './time';

export type Access = 'full' | 'withdrawn' | 'denied';

export function activeGrant(grants: StandingGrant[], patientId: string, facility: string, now: Minute): StandingGrant | undefined {
  return grants.find(g => g.patientId === patientId && g.facility === facility
    && g.granted <= now && (g.revokedAt === undefined || g.revokedAt > now));
}

/**
 * - The patient always reads their own appointments.
 * - The receiving facility reads an appointment addressed to it; once the patient revokes
 *   consent the row stays but its clinical content is withdrawn (an open legal question,
 *   brief §2.3 — the screen draws the first answer without committing to it).
 * - The ordering facility reads it only while the patient's standing grant to it is active.
 *   An internal order is read by that facility as the receiver.
 * - Nobody else, ever.
 */
export function accessTo(a: AppointmentRecord, viewer: Viewer, grants: StandingGrant[], now: Minute): Access {
  if (viewer.kind === 'patient') return viewer.patientId === a.patientId ? 'full' : 'denied';
  const revoked = a.trail.some(e => e.status === 'Consent revoked');
  if (viewer.facility === a.lab) return revoked ? 'withdrawn' : 'full';
  if (a.origin !== 'Personal' && viewer.facility === a.fromFacility) {
    if (!activeGrant(grants, a.patientId, viewer.facility, now)) return 'denied';
    return revoked ? 'withdrawn' : 'full';
  }
  return 'denied';
}

/* The history grant that lets this facility see the patient's earlier results and details
   now, if any: not revoked, and — when given with an appointment — that appointment still open. */
export function historyGrant(grants: HistoryGrant[], appointments: AppointmentRecord[], patientId: string, facility: string, now: Minute): HistoryGrant | undefined {
  return grants.find(g => g.patientId === patientId && g.facility === facility && g.granted <= now
    && (g.revokedAt === undefined || g.revokedAt > now)
    && (g.appointmentId === null || (() => {
      const a = appointments.find(x => x.id === g.appointmentId);
      return !!a && !isTerminal(shownStatus(a, now));
    })()));
}

