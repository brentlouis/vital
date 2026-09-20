/* The demo's state and every change it can undergo. Pure: no React, so the tests can drive
   it directly. */

import { SEED_APPOINTMENTS, SEED_GRANTS, SEED_REGISTRATIONS, FIRST_NEW_ID } from '../domain/seed';
import { START, canTake, rolesOf, storedStatus } from '../domain/flow';
import type { AppointmentRecord, AuditEntry, EventStatus, Registration, StandingGrant, TrailEvent, Viewer } from '../domain/types';
import type { Minute } from '../domain/time';

export interface DemoState {
  version: number;
  now: Minute;
  appointments: AppointmentRecord[];
  grants: StandingGrant[];
  registrations: Registration[];
  audit: AuditEntry[];
  /** Who is signed in on each facility's shared terminal. */
  activeStaff: Record<string, string>;
  /** The last moment each viewer looked at their notifications. */
  seen: Record<string, Minute>;
  /** When the patient first opened each result. */
  opened: Record<string, Minute>;
  nextId: number;
}

export const VERSION = 3;
export const KEY = 'vital-demo-state';

export function seedState(): DemoState {
  return {
    version: VERSION,
    now: 0,
    appointments: structuredClone(SEED_APPOINTMENTS),
    grants: structuredClone(SEED_GRANTS),
    registrations: structuredClone(SEED_REGISTRATIONS),
    audit: [],
    activeStaff: {},
    seen: {},
    opened: {},
    nextId: FIRST_NEW_ID,
  };
}

export function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as DemoState;
      if (s.version === VERSION) return s;
    }
  } catch { /* private window or blocked storage: start from the seed */ }
  return seedState();
}

export type Action =
  | { type: 'take'; id: string; event: TrailEvent; result?: { file: string; size: string } }
  | { type: 'create'; record: AppointmentRecord }
  | { type: 'tick'; minutes: number }
  | { type: 'revokeGrant'; patientId: string; facility: string }
  | { type: 'setStaff'; facility: string; name: string }
  | { type: 'markSeen'; key: string }
  | { type: 'opened'; id: string }
  | { type: 'referredBy'; id: string; text: string | null }
  | { type: 'audit'; entry: AuditEntry }
  | { type: 'submitRegistration'; registration: Registration }
  | { type: 'decideRegistration'; reference: string; status: 'Approved' | 'Rejected'; reason: string | null }
  | { type: 'replace'; state: DemoState }
  | { type: 'reset' };

/* Each write takes a minute of demo time: the clock moves first and the event happens at the
   new time, so every event has its own timestamp and anything written after someone opened
   their notifications is newer than that moment. */
export const STEP = 1;

export function reducer(s: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'take': {
      const { event } = action;
      return {
        ...s,
        now: Math.max(s.now, event.at),
        appointments: s.appointments.map(a => {
          if (a.id !== action.id) return a;
          const next: AppointmentRecord = { ...a, trail: [...a.trail, event], results: [...a.results] };
          if (event.status === 'Accepted' && event.slot !== undefined) next.slot = event.slot;
          if (event.status === 'Endorsed' && action.result) {
            next.results.push({ ...action.result, released: event.at, by: event.actor });
          }
          if (event.status === 'Result voided' && next.results.length) {
            const i = next.results.length - 1;
            next.results[i] = { ...next.results[i], voidedAt: event.at, voidedBy: event.actor, voidReason: event.note ?? 'attached to the wrong patient' };
          }
          return next;
        }),
      };
    }
    case 'create':
      return { ...s, now: Math.max(s.now, action.record.trail[0].at), nextId: s.nextId + 1, appointments: [action.record, ...s.appointments] };
    case 'tick':
      return { ...s, now: s.now + action.minutes };
    case 'revokeGrant':
      return {
        ...s, now: s.now + STEP,
        grants: s.grants.map(g => g.patientId === action.patientId && g.facility === action.facility && g.revokedAt === undefined
          ? { ...g, revokedAt: s.now + STEP } : g),
      };
    case 'setStaff':
      return { ...s, activeStaff: { ...s.activeStaff, [action.facility]: action.name } };
    case 'markSeen':
      return { ...s, seen: { ...s.seen, [action.key]: s.now } };
    case 'opened':
      return s.opened[action.id] !== undefined ? s : { ...s, opened: { ...s.opened, [action.id]: s.now } };
    case 'referredBy':
      return { ...s, appointments: s.appointments.map(a => a.id === action.id ? { ...a, referredBy: action.text } : a) };
    case 'audit':
      return { ...s, audit: [...s.audit, action.entry] };
    case 'submitRegistration':
      return {
        ...s, now: s.now + STEP,
        registrations: [...s.registrations.filter(r => r.reference !== action.registration.reference), action.registration],
      };
    case 'decideRegistration':
      return {
        ...s, now: s.now + STEP,
        registrations: s.registrations.map(r => r.reference === action.reference
          ? { ...r, status: action.status, reason: action.reason, decidedAt: s.now + STEP } : r),
      };
    case 'replace':
      return action.state;
    case 'reset':
      return seedState();
  }
}


export interface TakeOptions {
  note?: string;
  slot?: Minute;
  result?: { file: string; size: string };
}

/* Checks one step against the flow table and, if allowed, returns the action that records
   it. The only way anything is written to a trail. */
export function prepareTake(s: DemoState, id: string, viewer: Viewer, to: EventStatus, opts: TakeOptions = {}): Action | string {
  const a = s.appointments.find(x => x.id === id);
  if (!a) return `No appointment ${id}.`;
  const at = s.now + STEP;
  if (!canTake(a, viewer, at, to)) {
    const who = viewer.kind === 'patient' ? 'The patient' : `${viewer.name} at ${viewer.facility}`;
    return `${who} cannot move ${id} from ${storedStatus(a)} to ${to}.`;
  }
  const event: TrailEvent = {
    status: to, at, actor: viewer.name,
    facility: viewer.kind === 'patient' ? 'Health wallet' : viewer.facility,
    ...(opts.note ? { note: opts.note } : {}),
    ...(opts.slot !== undefined ? { slot: opts.slot } : {}),
  };
  return { type: 'take', id, event, result: opts.result };
}

/* Brings an appointment into existence with its origin's first event, written by someone
   allowed to write it. */
export function prepareCreate(s: DemoState, draft: Omit<AppointmentRecord, 'id' | 'trail' | 'results'>, viewer: Viewer): Action | string {
  const start = START[draft.origin];
  const record: AppointmentRecord = {
    ...draft, id: `APT-${s.nextId}`, results: [],
    trail: [{
      status: start.status, at: s.now + STEP, actor: viewer.name,
      facility: viewer.kind === 'patient' ? 'Health wallet' : viewer.facility, slot: draft.slot,
    }],
  };
  if (!rolesOf(record, viewer).includes(start.by)) {
    return `${viewer.name} cannot start a ${draft.origin.toLowerCase()} appointment.`;
  }
  return { type: 'create', record };
}
