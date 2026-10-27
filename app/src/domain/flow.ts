/* The appointment state machine — brief §2.1 as data. Every screen asks allowedSteps what a
   person may do, and the store refuses any write this table does not allow. Change a rule
   here and every portal follows; tests (flow.test.ts) check the seed against it. */

import type { AppointmentRecord, EventStatus, Origin, Status, TrailEvent, Viewer } from './types';
import { HOUR, DAY, type Minute } from './time';

/* Who, relative to one appointment, may take a step. */
export type Role = 'receiver' | 'orderer' | 'patient';

export interface Step {
  to: EventStatus;
  /** The statuses — as shown, so Overdue counts — this step can follow. */
  from: Status[];
  by: Role;
  /** An extra condition beyond status and role. */
  when?: (a: AppointmentRecord, now: Minute) => boolean;
}

/* A slot is Overdue this long after it passes with no arrival (brief §2.2). */
export const OVERDUE_GRACE = HOUR;
/* A patient has this long to answer a proposed time (brief §2.1). */
export const RESPOND_WINDOW = 2 * DAY;

export const TERMINAL: Status[] = ['Declined', 'No-show', 'Completed', 'Consent revoked'];
const OPEN: Status[] = ['Sent', 'Booked', 'Received', 'Accepted', 'Overdue', 'Reschedule proposed',
  'Patient arrived', 'Endorsed', 'Result voided'];

export const STEPS: Step[] = [
  { to: 'Received', from: ['Sent', 'Booked'], by: 'receiver' },
  { to: 'Accepted', from: ['Received'], by: 'receiver' },
  { to: 'Declined', from: ['Received'], by: 'receiver' },
  /* A time the facility cannot keep is not a decline: it proposes one it can. */
  { to: 'Reschedule proposed', from: ['Received', 'Accepted'], by: 'receiver' },
  /* Only the patient can accept a new time — they are the one travelling. */
  { to: 'Accepted', from: ['Reschedule proposed'], by: 'patient', when: (a, now) => !responseExpired(a, now) },
  /* An unanswered proposal returns to the facility, which records the decline. */
  { to: 'Declined', from: ['Reschedule proposed'], by: 'receiver', when: (a, now) => responseExpired(a, now) },
  { to: 'Patient arrived', from: ['Accepted', 'Overdue'], by: 'receiver' },
  /* No-show only once the slot has passed: before that the patient may still come. */
  { to: 'No-show', from: ['Overdue'], by: 'receiver' },
  /* A test ends in a result; a doctor visit ends when the doctor has seen the patient. */
  { to: 'Endorsed', from: ['Patient arrived', 'Result voided'], by: 'receiver', when: a => !isVisit(a) },
  { to: 'Completed', from: ['Patient arrived'], by: 'receiver', when: a => isVisit(a) },
  /* Whoever ordered the test closes the loop: the referrer, the ordering clinic, or — for a
     personal appointment — the patient, by opening the result. */
  { to: 'Completed', from: ['Endorsed'], by: 'orderer' },
  /* A misfiled result can be voided even after it was acknowledged. */
  { to: 'Result voided', from: ['Endorsed', 'Completed'], by: 'receiver', when: a => !isVisit(a) },
  { to: 'Consent revoked', from: OPEN, by: 'patient' },
];

export function isVisit(a: Pick<AppointmentRecord, 'kind'>): boolean { return a.kind === 'Consultation'; }

/* The one event that brings each origin into existence, and who writes it. */
export const START: Record<Origin, { status: EventStatus; by: Role }> = {
  Referred: { status: 'Sent', by: 'orderer' },
  Personal: { status: 'Booked', by: 'patient' },
  Internal: { status: 'Accepted', by: 'orderer' },
};

/* The steps that stand: the trail without withdrawn steps and the entries withdrawing them.
   The trail itself is append-only — a withdrawal is a further entry, never a removal. */
export function liveTrail(a: AppointmentRecord): TrailEvent[] {
  const live: TrailEvent[] = [];
  for (const e of a.trail) {
    if (e.withdraws) live.pop();
    else live.push(e);
  }
  return live;
}

/* Status is always the latest event that stands (brief §2). */
export function storedStatus(a: AppointmentRecord): EventStatus {
  const live = liveTrail(a);
  return live[live.length - 1].status;
}

/* What the appointment shows: the stored status, or Overdue once an accepted slot has
   passed its grace period with no arrival. */
export function shownStatus(a: AppointmentRecord, now: Minute): Status {
  const s = storedStatus(a);
  return s === 'Accepted' && now > a.slot + OVERDUE_GRACE ? 'Overdue' : s;
}

export function isTerminal(s: Status): boolean { return TERMINAL.includes(s); }

/* The latest proposal still waiting on the patient, if any. */
export function openProposal(a: AppointmentRecord) {
  const live = liveTrail(a);
  const last = live[live.length - 1];
  return last.status === 'Reschedule proposed' ? last : undefined;
}
export function responseMinutesLeft(a: AppointmentRecord, now: Minute): number | null {
  const p = openProposal(a);
  return p ? p.at + RESPOND_WINDOW - now : null;
}
export function responseExpired(a: AppointmentRecord, now: Minute): boolean {
  const left = responseMinutesLeft(a, now);
  return left !== null && left <= 0;
}

/* The roles a viewer holds on one appointment. Read-only staff hold none that can write. */
export function rolesOf(a: AppointmentRecord, v: Viewer): Role[] {
  const roles: Role[] = [];
  if (v.kind === 'patient') {
    if (v.patientId !== a.patientId) return roles;
    roles.push('patient');
    if (a.origin === 'Personal') roles.push('orderer');
    return roles;
  }
  if (v.readOnly) return roles;
  if (v.facility === a.lab) roles.push('receiver');
  if (a.origin !== 'Personal' && v.facility === a.fromFacility) roles.push('orderer');
  return roles;
}

/** Every step this viewer may take on this appointment right now. */
export function allowedSteps(a: AppointmentRecord, v: Viewer, now: Minute): Step[] {
  const shown = shownStatus(a, now);
  const roles = rolesOf(a, v);
  return STEPS.filter(s =>
    s.from.includes(shown) && roles.includes(s.by) && (!s.when || s.when(a, now)));
}

export function canTake(a: AppointmentRecord, v: Viewer, now: Minute, to: EventStatus): boolean {
  return allowedSteps(a, v, now).some(s => s.to === to);
}

/* Replays a trail against the table: every event after the first must be a step allowed from
   the status before it, by the role that wrote it. Returns the first problem, or null. Used
   by the tests and available to the store as a last line of defence. */
export function checkTrail(a: AppointmentRecord, roleOfEvent: (i: number) => Role | null): string | null {
  const start = START[a.origin];
  if (a.trail.length === 0) return `${a.id}: empty trail`;
  if (a.trail[0].status !== start.status) {
    return `${a.id}: a ${a.origin.toLowerCase()} appointment must start at ${start.status}, not ${a.trail[0].status}`;
  }
  for (let i = 1; i < a.trail.length; i++) {
    const prev = a.trail[i - 1];
    const ev = a.trail[i];
    if (ev.at < prev.at) return `${a.id}: event ${i} (${ev.status}) is earlier than the one before it`;
    /* A withdrawal names the step right before it, written by the same person. */
    if (ev.withdraws) {
      if (prev.withdraws || prev.status !== ev.status || prev.actor !== ev.actor || prev.facility !== ev.facility) {
        return `${a.id}: event ${i} withdraws ${ev.status}, which is not the step before it by the same person`;
      }
      continue;
    }
    const before: AppointmentRecord = { ...a, trail: a.trail.slice(0, i), slot: slotAt(a, i) };
    const shown = shownStatus(before, ev.at);
    const role = roleOfEvent(i);
    const ok = STEPS.some(s => s.to === ev.status && s.from.includes(shown)
      && (role === null || s.by === role) && (!s.when || s.when(before, ev.at)));
    if (!ok) return `${a.id}: ${ev.status} cannot follow ${shown}${role ? ` when written by the ${role}` : ''}`;
  }
  return null;
}

/* The booked slot as it stood before event i: the slot the first event booked, moved by any
   proposal the patient accepted earlier in the trail. */
function slotAt(a: AppointmentRecord, i: number): Minute {
  let slot = a.trail[0].slot;
  for (let j = 1; j < i; j++) {
    const e = a.trail[j];
    if (e.status === 'Accepted' && e.slot !== undefined) slot = e.slot;
  }
  return slot ?? a.slot;
}
