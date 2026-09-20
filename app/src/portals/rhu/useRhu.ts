import { useCallback, useMemo, useState } from 'react';
import { useDemo } from '../../store/context';
import { allowedSteps } from '../../domain/flow';
import { accessTo, activeGrant, type Access } from '../../domain/access';
import { PEOPLE, RHU, capabilitiesOf, findStaff } from '../../domain/reference';
import { toView, type Appointment } from '../../domain/view';
import type { EventStatus, Status } from '../../domain/types';
import type { DialogSpec } from '../../components/ui';
import { STEP_UI, byVariant, type StepUi } from '../../components/steps';
import { useReferralForm } from '../../components/referral/useReferralForm';

export type Screen = 'queue' | 'new' | 'detail' | 'search' | 'denied';
export type QueueTab = 'All' | 'In flight' | 'Needs follow-up' | 'Closed';
export type Direction = 'Outgoing' | 'Incoming';

export const QUEUE_TABS: QueueTab[] = ['All', 'In flight', 'Needs follow-up', 'Closed'];

/* From the health centre's side a referral is either still moving, needs someone here to
   act, or is closed. */
type RhuBucket = 'flight' | 'follow' | 'closed';
const RHU_BUCKET: Record<Status, RhuBucket> = {
  Sent: 'flight', Booked: 'flight', Received: 'flight', Accepted: 'flight',
  'Patient arrived': 'flight', Endorsed: 'follow', Completed: 'closed',
  Declined: 'follow', 'No-show': 'follow', Overdue: 'follow', 'Consent revoked': 'closed',
  'Result voided': 'follow', 'Reschedule proposed': 'follow',
};

export interface Action { to: EventStatus; ui: StepUi }

export function useRhu() {
  const demo = useDemo();
  const { state, now } = demo;
  const [screen, setScreen] = useState<Screen>('queue');
  const [filter, setFilter] = useState<QueueTab>('All');
  const [direction, setDirection] = useState<Direction>('Outgoing');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const referral = useReferralForm(RHU, now);

  const viewer = demo.staffViewer(RHU);
  const member = findStaff(RHU, viewer.name);
  const caps = capabilitiesOf(RHU);
  /* Capabilities, not facility type, decide what this portal shows. A facility with both
     gets one queue with a direction filter rather than two screens. */
  const merged = caps.canRefer && caps.canReceive;

  /* A referring facility sees only the appointments it referred. A patient's own bookings and
     other facilities' referrals are records the patient never shared with it (brief §2.4). */
  const shown = useMemo(() => state.appointments
    .filter(a => a.origin === 'Referred' && a.fromFacility === RHU)
    .map(a => toView(a, now)), [state.appointments, now]);

  const access = useCallback((a: Appointment): Access => accessTo(a.record, viewer, state.grants, now),
    [viewer, state.grants, now]);

  const queue = useMemo(() => {
    const outgoing = shown;
    const incoming: Appointment[] = [];
    const scoped = merged && direction === 'Incoming' ? incoming : outgoing;
    const buckets: Record<QueueTab, Appointment[]> = {
      All: scoped,
      'In flight': scoped.filter(r => RHU_BUCKET[r.status] === 'flight'),
      'Needs follow-up': scoped.filter(r => RHU_BUCKET[r.status] === 'follow'),
      Closed: scoped.filter(r => RHU_BUCKET[r.status] === 'closed'),
    };
    return { outgoing, incoming, buckets };
  }, [shown, merged, direction]);

  const selected = shown.find(r => r.id === selectedId) || shown[0] || null;

  /* Opening a record is a read, and every read is checked against consent. A refusal is
     recorded in the audit log and shown as access denied (R8). */
  const openDetail = useCallback((id: string) => {
    const a = shown.find(r => r.id === id);
    setError(null);
    if (a && access(a) === 'denied') {
      demo.recordDenied(viewer, a.patientId);
      setDeniedFor(a.patientId);
      setScreen('denied');
      return;
    }
    setSelectedId(id);
    setScreen('detail');
  }, [shown, access, demo, viewer]);

  const actionsFor = useCallback((a: Appointment): Action[] =>
    access(a) === 'denied' ? [] : allowedSteps(a.record, viewer, now)
      .map(s => ({ to: s.to, ui: STEP_UI[s.to] }))
      .filter((x): x is Action => !!x.ui)
      .sort(byVariant), [access, viewer, now]);

  const run = useCallback((a: Appointment, act: Action) => {
    setError(demo.take(a.id, viewer, act.to));
  }, [demo, viewer]);

  const send = useCallback(() => {
    const draft = referral.draft();
    if (!draft) return;
    const made = demo.create(draft, viewer);
    if (typeof made === 'string') { setError(made); return; }
    setSelectedId(made.id);
    setFilter('All');
    setScreen('detail');
    referral.clearNote();
  }, [referral, demo, viewer]);

  /* R7 — patients this health centre has referred. Whether it may open each one is a consent
     question, answered when a row is opened. */
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PEOPLE.map(p => {
      const mine = shown.filter(r => r.patientId === p.id).sort((a, b) => b.updatedAt - a.updatedAt);
      return {
        ...p, count: mine.length, last: mine.length ? mine[0].updated : '—', latest: mine[0]?.id ?? null,
        consent: !!activeGrant(state.grants, p.id, RHU, now),
      };
    }).filter(p => p.count > 0)
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }, [shown, query, state.grants, now]);

  return {
    viewer, title: member?.title ?? 'Staff', caps, merged, screen, setScreen, filter, setFilter, direction, setDirection,
    ...queue, selected, openDetail, access, actionsFor, run, error, dialog, setDialog,
    deniedFor, referral, send, query, setQuery, people,
  };
}

export type Rhu = ReturnType<typeof useRhu>;
