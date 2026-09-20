import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemo } from '../../store/context';
import { allowedSteps } from '../../domain/flow';
import { accessTo, type Access } from '../../domain/access';
import { capabilitiesOf, findStaff, publishedDays } from '../../domain/reference';
import { dayIndex, fmtDayLong, type Minute } from '../../domain/time';
import { STATUS_META, type Bucket } from '../../domain/status';
import { toView, type Appointment } from '../../domain/view';
import type { EventStatus } from '../../domain/types';
import type { DialogSpec } from '../../components/ui';
import { STEP_UI, byVariant, toldLine, type StepUi } from '../../components/steps';
import { useReferralForm } from '../../components/referral/useReferralForm';

export type Screen = 'queue' | 'detail' | 'upload' | 'day' | 'denied' | 'new';
export type QueueTab = 'New' | 'Accepted' | 'Awaiting patient' | 'Reschedule proposed' | 'Completed';
export type Direction = 'Incoming' | 'Outgoing';

export const QUEUE_TABS: QueueTab[] = ['New', 'Accepted', 'Awaiting patient', 'Reschedule proposed', 'Completed'];
const TAB_BUCKET: Record<QueueTab, Bucket> = {
  New: 'new', Accepted: 'accepted', 'Awaiting patient': 'awaiting',
  'Reschedule proposed': 'proposed', Completed: 'completed',
};

/* The two supported configurations. The pilot runs one receive-only laboratory; the clinic
   that both refers and receives is the second configuration, not the default. */
export const CONFIGS = [
  { id: 'Loon Heritage Clinical Lab', label: 'Standalone laboratory' },
  { id: 'Tagbilaran Diagnostic Center', label: 'Clinic — refers and receives' },
] as const;

export interface Action { to: EventStatus; ui: StepUi }

export function resultFileName(a: Appointment): string {
  return `${a.test.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${a.id}.pdf`;
}

export function useLab() {
  const demo = useDemo();
  const { state, now } = demo;
  const [params] = useSearchParams();
  const initial = params.get('facility');
  const [signedIn, setSignedIn] = useState<string>(CONFIGS.some(c => c.id === initial) ? initial! : CONFIGS[0].id);
  const [screen, setScreen] = useState<Screen>('queue');
  const [filter, setFilter] = useState<QueueTab>('New');
  const [direction, setDirection] = useState<Direction>('Incoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposeFor, setProposeFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [upload, setUpload] = useState({ attached: false, confirmed: false });
  const [error, setError] = useState<string | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  const viewer = demo.staffViewer(signedIn);
  const member = findStaff(signedIn, viewer.name);
  const caps = capabilitiesOf(signedIn);
  /* Capabilities, not facility type, decide what this portal shows. A facility that both
     refers and receives gets one queue with a direction filter — never two screens. */
  const merged = caps.canRefer && caps.canReceive;
  const referral = useReferralForm(signedIn, now);

  const derived = useMemo(() => {
    /* Incoming: everything this laboratory performs, its own internal orders included.
       Outgoing: what it referred to another laboratory, which acts on it. */
    const mine = state.appointments.filter(a => a.lab === signedIn || a.fromFacility === signedIn);
    const views = mine.map(a => toView(a, now));
    const incoming = views.filter(a => a.lab === signedIn);
    const outgoing = views.filter(a => a.lab !== signedIn && a.fromFacility === signedIn);
    const scoped = merged && direction === 'Outgoing' ? outgoing : incoming;
    const buckets = Object.fromEntries(QUEUE_TABS.map(t =>
      [t, scoped.filter(r => STATUS_META[r.status].bucket === TAB_BUCKET[t])])) as Record<QueueTab, Appointment[]>;
    const selected = views.find(r => r.id === selectedId) || incoming[0] || null;
    return { incoming, outgoing, buckets, selected };
  }, [state.appointments, signedIn, now, merged, direction, selectedId]);

  const access = useCallback((a: Appointment): Access => accessTo(a.record, viewer, state.grants, now),
    [viewer, state.grants, now]);

  /* The buttons for one appointment, straight from the flow table. */
  const actionsFor = useCallback((a: Appointment): Action[] =>
    allowedSteps(a.record, viewer, now)
      .map(s => ({ to: s.to, ui: STEP_UI[s.to] }))
      .filter((x): x is Action => !!x.ui)
      .sort(byVariant), [viewer, now]);

  const take = useCallback((id: string, to: EventStatus, opts?: { note?: string; slot?: Minute; result?: { file: string; size: string } }) => {
    setDialog(null);
    const refused = demo.take(id, viewer, to, opts);
    setError(refused);
    return !refused;
  }, [demo, viewer]);

  const openDetail = useCallback((id: string) => { setSelectedId(id); setError(null); setScreen('detail'); }, []);

  /* Runs a step: straight away, after a confirmation, or by opening its screen. */
  const run = useCallback((a: Appointment, act: Action) => {
    if (act.ui.opens === 'upload') { setSelectedId(a.id); setUpload({ attached: false, confirmed: false }); setScreen('upload'); return; }
    if (act.ui.opens === 'propose') { setProposeFor(a.id); setScreen('day'); return; }
    if (act.ui.confirm) {
      const c = act.ui.confirm(a, toldLine(a, signedIn));
      setDialog({ title: c.title, body: c.body, action: c.action, cancel: c.cancel, onConfirm: () => take(a.id, act.to, { note: c.note }) });
      return;
    }
    take(a.id, act.to);
  }, [signedIn, take]);

  const pickConfig = useCallback((name: string) => {
    setSignedIn(name);
    setDirection('Incoming');
    setFilter('New');
    setScreen('queue');
    setSelectedId(null);
    setError(null);
  }, []);

  /* L7 jumps to the first no-show this laboratory recorded. */
  const openFirst = useCallback((status: EventStatus) => {
    const hit = derived.incoming.find(r => r.status === status);
    if (hit) setSelectedId(hit.id);
    setScreen('detail');
  }, [derived.incoming]);

  const commitUpload = useCallback((sel: Appointment) => {
    if (take(sel.id, 'Endorsed', { result: { file: resultFileName(sel), size: '152 KB' } })) {
      setUpload({ attached: false, confirmed: false });
      setScreen('detail');
    }
  }, [take]);

  /* A clinic that refers out sends the appointment from here. A referral waits in
     Outgoing → New; an internal order is already this laboratory's accepted work. */
  const sendReferral = useCallback(() => {
    if (!merged) return;
    const draft = referral.draft();
    if (!draft) return;
    const made = demo.create(draft, viewer);
    if (typeof made === 'string') { setError(made); return; }
    const internal = made.origin === 'Internal';
    setDirection(internal ? 'Incoming' : 'Outgoing');
    setFilter(internal ? 'Accepted' : 'New');
    setSelectedId(made.id);
    setScreen('detail');
    referral.clearNote();
  }, [merged, referral, demo, viewer]);

  const startPropose = useCallback((id: string) => { setProposeFor(id); setScreen('day'); }, []);
  const cancelPropose = useCallback(() => { setProposeFor(null); setScreen('detail'); }, []);
  const proposeSlot = useCallback((slot: Minute) => {
    if (!proposeFor) return;
    const id = proposeFor;
    if (take(id, 'Reschedule proposed', { slot, note: 'The time the patient chose is no longer open at this facility.' })) {
      setProposeFor(null);
      setSelectedId(id);
      setScreen('detail');
    }
  }, [proposeFor, take]);

  /* L6 — this facility's published slots for one day, with the appointments sitting in them.
     This is the only source of slot data: P7, R2 and L9 offer these same times. */
  const day = useMemo(() => {
    const days = publishedDays(signedIn, now);
    const current = days[Math.min(dayOffset, Math.max(days.length - 1, 0))];
    if (!current) return { days, label: '', count: 0, slots: [] as { slot: Minute; items: Appointment[]; published: boolean }[] };
    const d = dayIndex(current.day);
    const items = derived.incoming.filter(r => dayIndex(r.slot) === d && !['Declined', 'Consent revoked'].includes(r.status));
    const times = [...new Set([...current.slots, ...items.map(r => r.slot)])].sort((a, b) => a - b);
    return {
      days, label: fmtDayLong(current.day), count: items.length,
      slots: times.map(slot => ({ slot, items: items.filter(r => r.slot === slot), published: current.slots.includes(slot) })),
    };
  }, [signedIn, now, dayOffset, derived.incoming]);

  return {
    signedIn, staff: viewer.name, title: member?.title ?? 'Staff', readOnly: viewer.readOnly, viewer, caps, merged,
    screen, setScreen, filter, setFilter, direction, setDirection,
    ...derived,
    access, actionsFor, run, take, error, setError,
    openDetail, openFirst, pickConfig,
    dialog, setDialog,
    upload, setUpload, commitUpload,
    proposeFor: proposeFor ? derived.incoming.find(r => r.id === proposeFor) || null : null,
    startPropose, cancelPropose, proposeSlot, day, dayOffset, setDayOffset,
    referral, sendReferral,
  };
}

export type Lab = ReturnType<typeof useLab>;
