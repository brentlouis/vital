import { createContext, useContext } from 'react';
import { givenFirst, person } from '../domain/reference';
import type { AppointmentRecord, EventStatus, Issue, Registration, Viewer } from '../domain/types';
import type { Minute } from '../domain/time';
import type { DemoState, TakeOptions } from './state';

export interface DemoApi {
  state: DemoState;
  now: Minute;
  /** Take one step of the flow. Refused — with the reason — unless the rules allow it. */
  take: (id: string, viewer: Viewer, to: EventStatus, opts?: TakeOptions) => string | null;
  /** The one-tap step this viewer can still take back on an appointment, if any. */
  undoable: (id: string, viewer: Viewer) => { status: EventStatus; at: Minute } | null;
  /** Take back a one-tap step this viewer just took, while nobody has acted since. */
  undo: (id: string, viewer: Viewer, status: EventStatus) => string | null;
  /** Bring a new appointment into existence with its origin's first event; `note` is written on it. */
  create: (draft: Omit<AppointmentRecord, 'id' | 'trail' | 'results'>, viewer: Viewer, note?: string) => AppointmentRecord | string;
  tick: (minutes: number) => void;
  revokeGrant: (patientId: string, facility: string) => void;
  setStaff: (facility: string, name: string) => void;
  markSeen: (key: string) => void;
  openResult: (id: string, viewer: Viewer) => void;
  /** The patient's own note of who sent them. Not an event: it grants and records nothing. */
  setReferredBy: (id: string, text: string | null) => void;
  recordDenied: (viewer: Viewer, patientId: string) => void;
  /** Writes an audit entry when a facility views a patient's shared history. */
  recordHistoryView: (viewer: Viewer, patientId: string) => void;
  grantHistory: (patientId: string, facility: string, appointmentId: string | null, by: string) => void;
  revokeHistory: (patientId: string, facility: string) => void;
  reportIssue: (issue: Omit<Issue, 'id' | 'at' | 'status'>) => void;
  resolveIssue: (id: string, resolution: string) => void;
  submitRegistration: (r: Registration) => void;
  decideRegistration: (reference: string, status: 'Approved' | 'Rejected', reason: string | null) => void;
  reset: () => void;
  /** The signed-in person on a facility's shared terminal. */
  staffViewer: (facility: string) => Viewer & { kind: 'staff' };
}

export const Ctx = createContext<DemoApi | null>(null);

export function useDemo(): DemoApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useDemo must be used inside DemoProvider');
  return api;
}

/* The patient viewer for the wallet. */
export function patientViewer(patientId: string): Viewer & { kind: 'patient' } {
  return { kind: 'patient', patientId, name: givenFirst(person(patientId).name) };
}
