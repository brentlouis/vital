/* The appointment as screens read it: the stored record, with the patient's details joined
   in, times formatted, and the status as shown (Overdue derived from the clock). Screens never
   read AppointmentRecord directly, and never write to a view — writes go through the store. */

import { RHU, defaultStaff, person } from './reference';
import { OVERDUE_GRACE, openProposal, responseMinutesLeft, shownStatus, storedStatus } from './flow';
import { fmt, fmtTime, type Minute } from './time';
import type { AppointmentRecord, EventStatus, Origin, Status } from './types';

export interface TrailEventView {
  status: EventStatus;
  at: string;
  actor: string;
  facility: string;
  note?: string;
}

export interface ResultView {
  file: string;
  size: string;
  released: string;
  by: string;
  voided: boolean;
}

export interface Appointment {
  id: string;
  record: AppointmentRecord;
  patient: string;
  patientId: string;
  age: number;
  sex: 'F' | 'M';
  municipality: string;
  origin: Origin;
  fromFacility: string | null;
  referredBy: string | null;
  lab: string;
  labStaff: string;
  tests: string[];
  test: string;
  note: string;
  notSent?: string[];
  /** As shown: Overdue when an accepted slot has passed. */
  status: Status;
  stored: EventStatus;
  slot: Minute;
  scheduledAt: string;
  scheduledTime: string;
  expectedBy: string;
  created: string;
  updated: string;
  updatedAt: Minute;
  declineReason: string | null;
  /** An open proposal, waiting on the patient. */
  proposedSlot: string | null;
  proposedSlotAt: Minute | null;
  proposedAt: string | null;
  respondMinsLeft: number | null;
  respondCountdown: string | null;
  /** The current result document, if one has been released. */
  result: ResultView | null;
  /** The current result is voided and no replacement has been released. */
  voided: boolean;
  /** An earlier result that was voided and has since been replaced. */
  priorVoid: { at: string; by: string; file: string; reason: string } | null;
  trail: TrailEventView[];
}

export function countdown(minsLeft: number): string {
  if (minsLeft <= 0) return 'No response — returned to the facility';
  if (minsLeft < 60) return `${minsLeft} minutes left to respond`;
  const h = Math.round(minsLeft / 60);
  return h === 1 ? '1 hour left to respond' : `${h} hours left to respond`;
}

export function toView(a: AppointmentRecord, now: Minute): Appointment {
  const p = person(a.patientId);
  const last = a.trail[a.trail.length - 1];
  const proposal = openProposal(a);
  const left = responseMinutesLeft(a, now);
  const decline = [...a.trail].reverse().find(e => e.status === 'Declined');
  const current = a.results[a.results.length - 1];
  const earlierVoid = [...a.results].slice(0, -1).reverse().find(r => r.voidedAt !== undefined);
  return {
    id: a.id,
    record: a,
    patient: p.name,
    patientId: p.id,
    age: p.age,
    sex: p.sex,
    municipality: p.municipality,
    origin: a.origin,
    fromFacility: a.fromFacility,
    referredBy: a.referredBy,
    lab: a.lab,
    labStaff: defaultStaff(a.lab)?.name ?? '',
    tests: a.tests,
    test: a.tests.join(', '),
    note: a.note,
    notSent: a.notSent,
    status: shownStatus(a, now),
    stored: storedStatus(a),
    slot: a.slot,
    scheduledAt: fmt(a.slot),
    scheduledTime: fmtTime(a.slot),
    expectedBy: fmt(a.slot + OVERDUE_GRACE),
    created: fmt(a.trail[0].at),
    updated: fmt(last.at),
    updatedAt: last.at,
    declineReason: decline?.note ?? null,
    proposedSlot: proposal?.slot !== undefined ? fmt(proposal.slot) : null,
    proposedSlotAt: proposal?.slot ?? null,
    proposedAt: proposal ? fmt(proposal.at) : null,
    respondMinsLeft: left,
    respondCountdown: left === null ? null : countdown(left),
    result: current ? {
      file: current.file, size: current.size, released: fmt(current.released), by: current.by,
      voided: current.voidedAt !== undefined,
    } : null,
    voided: !!current && current.voidedAt !== undefined,
    priorVoid: earlierVoid && current && current.voidedAt === undefined ? {
      at: fmt(earlierVoid.voidedAt!), by: earlierVoid.voidedBy ?? '', file: earlierVoid.file,
      reason: earlierVoid.voidReason ?? 'attached to the wrong patient',
    } : null,
    trail: a.trail.map(e => ({ status: e.status, at: fmt(e.at), actor: e.actor, facility: e.facility, note: e.note })),
  };
}

/* The referring provider line: whoever originated the appointment — not always the RHU. */
export function providerOf(a: Appointment): string {
  if (a.origin === 'Personal') return 'Booked by the patient';
  const first = a.record.trail[0];
  if (a.origin === 'Internal') return `${first.actor} · internal order`;
  return `${first.actor} · ${a.fromFacility ?? RHU}`;
}
