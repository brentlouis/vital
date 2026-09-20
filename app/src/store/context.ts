import { createContext, useContext } from 'react';
import { givenFirst, person } from '../domain/reference';
import type { AppointmentRecord, EventStatus, Registration, Viewer } from '../domain/types';
import type { Minute } from '../domain/time';
import type { DemoState, TakeOptions } from './state';

export interface DemoApi {
  state: DemoState;
  now: Minute;
  /** Take one step of the flow. Refused — with the reason — unless the rules allow it. */
  take: (id: string, viewer: Viewer, to: EventStatus, opts?: TakeOptions) => string | null;
  /** Bring a new appointment into existence with its origin's first event. */
  create: (draft: Omit<AppointmentRecord, 'id' | 'trail' | 'results'>, viewer: Viewer) => AppointmentRecord | string;
  tick: (minutes: number) => void;
  revokeGrant: (patientId: string, facility: string) => void;
  setStaff: (facility: string, name: string) => void;
  markSeen: (key: string) => void;
  openResult: (id: string, viewer: Viewer) => void;
  /** The patient's own note of who sent them. Not an event: it grants and records nothing. */
  setReferredBy: (id: string, text: string | null) => void;
  recordDenied: (viewer: Viewer, patientId: string) => void;
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
