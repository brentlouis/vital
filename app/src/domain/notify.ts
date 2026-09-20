/* Notifications are derived from the status trail, never stored: an event either reaches a
   person or it does not. Nobody is told about something they did themselves. */

import { RHU, givenFirst, person } from './reference';
import { isTerminal, shownStatus } from './flow';
import { DAY, fmt, fmtTime, fmtDay, type Minute } from './time';
import type { AppointmentRecord, Viewer } from './types';

export interface Notice {
  at: Minute;
  kind: string;
  message: string;
  appointmentId: string;
  tone: 'forest' | 'amber' | 'clay';
}

/* Six transitions plus one 24-hour reminder reach the patient (brief §2.5). */
function forPatient(a: AppointmentRecord, now: Minute): Notice[] {
  const out: Notice[] = [];
  const day = fmtDay(a.slot);
  a.trail.forEach((e, i) => {
    if (e.facility === 'Health wallet') return;
    const push = (kind: string, message: string, tone: Notice['tone'] = 'forest') =>
      out.push({ at: e.at, kind, message, appointmentId: a.id, tone });
    if (i === 0 && a.origin !== 'Personal') push('Scheduled', `${a.fromFacility ?? RHU} scheduled an appointment for you on ${day}.`);
    if (e.status === 'Reschedule proposed' && e.slot !== undefined) push('New time proposed', `${a.lab} proposed a new time for your appointment: ${fmt(e.slot)}.`, 'amber');
    if (e.status === 'Accepted' && i > 0) push('Confirmed', `${a.lab} confirmed your appointment.`);
    if (e.status === 'Declined') push('Declined', `${a.lab} couldn’t accept your appointment. Choose another facility.`, 'clay');
    if (e.status === 'Endorsed') push('Result ready', `Your result from ${a.lab} is ready to view.`);
    if (e.status === 'Result voided') push('Result withdrawn', `${a.lab} withdrew a result that was attached to the wrong person. A correct result will follow.`, 'clay');
  });
  /* The one time-based notification: 24 hours before the slot. */
  const remind = a.slot - DAY;
  if (remind <= now && now < a.slot && !isTerminal(shownStatus(a, now))) {
    out.push({ at: remind, kind: 'Reminder', message: `Reminder: your appointment at ${a.lab} is tomorrow at ${fmtTime(a.slot)}.`, appointmentId: a.id, tone: 'forest' });
  }
  return out;
}

/* What a facility hears about. The one that ordered the test hears how it is going; the one
   performing it hears when work arrives and when the patient changes it. */
function forFacility(a: AppointmentRecord, facility: string): Notice[] {
  const out: Notice[] = [];
  const ordered = a.origin !== 'Personal' && a.fromFacility === facility;
  const receives = a.lab === facility;
  const who = person(a.patientId).name;
  a.trail.forEach((e, i) => {
    if (e.facility === facility) return;
    const push = (kind: string, message: string, tone: Notice['tone'] = 'forest') =>
      out.push({ at: e.at, kind, message, appointmentId: a.id, tone });
    if (receives) {
      if (i === 0) push('New appointment', `${a.origin === 'Personal' ? `${givenFirst(who)} booked` : `${a.fromFacility} sent`} ${a.tests.join(', ')} for ${fmt(a.slot)}.`);
      if (e.status === 'Accepted' && e.facility === 'Health wallet') push('New time accepted', `${who} accepted the proposed time, ${fmt(a.slot)}.`);
      if (e.status === 'Consent revoked') push('Access withdrawn', `${who} withdrew this facility’s access to ${a.id}.`, 'amber');
    }
    if (ordered) {
      if (e.status === 'Accepted' && e.facility === a.lab) push('Accepted', `${a.lab} accepted ${who}’s appointment for ${fmt(a.slot)}.`);
      if (e.status === 'Accepted' && e.facility === 'Health wallet') push('New time accepted', `${who} accepted ${a.lab}’s proposed time, ${fmt(a.slot)}.`);
      if (e.status === 'Declined') push('Declined', `${a.lab} declined ${who}’s appointment.`, 'clay');
      if (e.status === 'Reschedule proposed') push('New time proposed', `${a.lab} proposed a new time to ${who}.`, 'amber');
      if (e.status === 'No-show') push('Did not arrive', `${who} did not arrive at ${a.lab} for the ${fmt(a.slot)} slot.`, 'amber');
      if (e.status === 'Endorsed') push('Result ready', `${a.lab} released ${who}’s ${a.tests.join(', ')} result. Acknowledge it to close the appointment.`);
      if (e.status === 'Result voided') push('Result withdrawn', `${a.lab} voided a result for ${who}.`, 'clay');
      if (e.status === 'Consent revoked') push('Access withdrawn', `${who} withdrew consent for ${a.id}.`, 'amber');
    }
  });
  return out;
}

export function noticesFor(viewer: Viewer, appointments: AppointmentRecord[], now: Minute): Notice[] {
  const out = viewer.kind === 'patient'
    ? appointments.filter(a => a.patientId === viewer.patientId).flatMap(a => forPatient(a, now))
    : appointments.flatMap(a => forFacility(a, viewer.facility));
  return out.filter(n => n.at <= now).sort((a, b) => b.at - a.at);
}

/* Before a viewer first opens their notifications, anything from the six hours before the
   demo opened counts as unread. */
export const UNSEEN_FROM = -360;

/* Key for remembering what a viewer has already seen. */
export function seenKey(viewer: Viewer): string {
  return viewer.kind === 'patient' ? `patient:${viewer.patientId}` : `facility:${viewer.facility}`;
}
