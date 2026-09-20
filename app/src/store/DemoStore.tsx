/* The one shared store behind every surface. The RHU portal, the laboratory portal, the
   wallet, onboarding and admin all read and write these same records, so a referral sent from
   the RHU arrives in the laboratory's queue and the patient's wallet.

   State is saved to this browser's localStorage, so a reload keeps the demo where it was, and
   a second tab (say the RHU in one and the laboratory in another) follows along live. "Reset
   demo" in the prototype bar returns to the seed. Nothing leaves the browser. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { canTake } from '../domain/flow';
import { defaultStaff, findStaff } from '../domain/reference';
import type { AppointmentRecord, EventStatus, Viewer } from '../domain/types';
import { KEY, VERSION, load, prepareCreate, prepareTake, reducer, seedState, type DemoState, type TakeOptions } from './state';
import { Ctx, type DemoApi } from './context';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const fromOtherTab = useRef(false);

  /* Save every change; skip the echo of a change that just arrived from another tab. */
  useEffect(() => {
    if (fromOtherTab.current) { fromOtherTab.current = false; return; }
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        const next = e.newValue ? JSON.parse(e.newValue) as DemoState : seedState();
        if (next.version !== VERSION) return;
        fromOtherTab.current = true;
        dispatch({ type: 'replace', state: next });
      } catch { /* ignore malformed state */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* Handlers read the latest state through this ref, updated after each commit. */
  const stateRef = useRef(state);
  useLayoutEffect(() => { stateRef.current = state; }, [state]);

  const take = useCallback((id: string, viewer: Viewer, to: EventStatus, opts: TakeOptions = {}) => {
    const action = prepareTake(stateRef.current, id, viewer, to, opts);
    if (typeof action === 'string') return action;
    dispatch(action);
    return null;
  }, []);

  const create = useCallback((draft: Omit<AppointmentRecord, 'id' | 'trail' | 'results'>, viewer: Viewer) => {
    const action = prepareCreate(stateRef.current, draft, viewer);
    if (typeof action === 'string') return action;
    dispatch(action);
    return action.type === 'create' ? action.record : 'Not created.';
  }, []);

  const staffViewer = useCallback((facility: string) => {
    const name = stateRef.current.activeStaff[facility] ?? defaultStaff(facility)?.name ?? '';
    const member = findStaff(facility, name);
    return { kind: 'staff' as const, facility, name, readOnly: member?.role === 'Read-only' };
  }, []);

  const api = useMemo<DemoApi>(() => ({
    state,
    now: state.now,
    take,
    create,
    tick: minutes => dispatch({ type: 'tick', minutes }),
    revokeGrant: (patientId, facility) => dispatch({ type: 'revokeGrant', patientId, facility }),
    setStaff: (facility, name) => dispatch({ type: 'setStaff', facility, name }),
    markSeen: key => dispatch({ type: 'markSeen', key }),
    /* Opening a released result. For a personal appointment the patient closes the loop, so
       the first open writes Completed (brief §2.1); otherwise it only records the view. */
    openResult: (id, viewer) => {
      dispatch({ type: 'opened', id });
      const a = stateRef.current.appointments.find(x => x.id === id);
      if (a && a.origin === 'Personal' && canTake(a, viewer, stateRef.current.now, 'Completed')) {
        take(id, viewer, 'Completed');
      }
    },
    setReferredBy: (id, text) => dispatch({ type: 'referredBy', id, text }),
    recordDenied: (viewer, patientId) => {
      if (viewer.kind !== 'staff') return;
      dispatch({ type: 'audit', entry: { at: stateRef.current.now, actor: viewer.name, facility: viewer.facility, patientId, action: 'Access denied' } });
    },
    submitRegistration: registration => dispatch({ type: 'submitRegistration', registration }),
    decideRegistration: (reference, status, reason) => dispatch({ type: 'decideRegistration', reference, status, reason }),
    reset: () => {
      try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
      dispatch({ type: 'reset' });
    },
    staffViewer,
  }), [state, take, create, staffViewer]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
