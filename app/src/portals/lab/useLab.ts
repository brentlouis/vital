import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemo } from '../../store/context';
import { allowedSteps } from '../../domain/flow';
import { accessTo, type Access } from '../../domain/access';
import { capabilitiesOf, findStaff } from '../../domain/reference';
import { DAY, at, dayIndex, fmtDayLong, fmtSlot, type Minute } from '../../domain/time';
import { STATUS_META, type Bucket } from '../../domain/status';
import { toView, priorityFirst, type Appointment } from '../../domain/view';
import { estimateFor, suggestTime } from '../../domain/estimate';
import type { EventStatus } from '../../domain/types';
import type { DialogSpec, ToastSpec } from '../../components/ui';
import { stepUi, byVariant, toldLine, type StepUi } from '../../components/steps';
import { useReferralForm } from '../../components/referral/useReferralForm';

export type Screen = 'queue' | 'detail' | 'upload' | 'day' | 'denied' | 'new' | 'plan' | 'report';
export type QueueTab = 'New' | 'Accepted' | 'Awaiting patient' | 'Reschedule proposed' | 'Completed';
export type Direction = 'Incoming' | 'Visits' | 'Outgoing';

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
  const [toast, setToast] = useState<ToastSpec | null>(null);
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
    /* Received: everything this facility performs. Tests and doctor visits are separate lists,
       so a laboratory queue is never mixed with the doctor's. */
    const received = views.filter(a => a.lab === signedIn);
    const incoming = received.filter(a => !a.visit);
    const visits = received.filter(a => a.visit);
    const outgoing = views.filter(a => a.lab !== signedIn && a.fromFacility === signedIn);
    const scoped = !merged ? incoming : direction === 'Outgoing' ? outgoing : direction === 'Visits' ? visits : incoming;
    const buckets = Object.fromEntries(QUEUE_TABS.map(t =>
      [t, scoped.filter(r => STATUS_META[r.status].bucket === TAB_BUCKET[t]).sort(priorityFirst)])) as Record<QueueTab, Appointment[]>;
    const selected = views.find(r => r.id === selectedId) || incoming[0] || null;
    /* The switch above the queue, for a facility that refers (has doctors) and receives. */
    const directions: { id: Direction; label: string; count: number }[] = [
      { id: 'Incoming', label: 'Tests received', count: incoming.length },
      { id: 'Visits', label: 'Doctor visits', count: visits.length },
      { id: 'Outgoing', label: 'Referrals sent', count: outgoing.length },
    ];
    return { incoming, visits, received, outgoing, buckets, selected, directions };
  }, [state.appointments, signedIn, now, merged, direction, selectedId]);

  const access = useCallback((a: Appointment): Access => accessTo(a.record, viewer, state.grants, now),
    [viewer, state.grants, now]);

  /* The buttons for one appointment, straight from the flow table. */
  const actionsFor = useCallback((a: Appointment): Action[] =>
    allowedSteps(a.record, viewer, now)
      .map(s => ({ to: s.to, ui: stepUi(a.record, s.to) }))
      .filter((x): x is Action => !!x.ui)
      .sort(byVariant), [viewer, now]);

  const take = useCallback((id: string, to: EventStatus, opts?: { note?: string; slot?: Minute; result?: { file: string; size: string } }) => {
    setDialog(null);
    const refused = demo.take(id, viewer, to, opts);
    setError(refused);
    return !refused;
  }, [demo, viewer]);

  /* Says what was just written. Taking a step back is a button on the detail, not here. */
  const confirmDone = useCallback((a: Appointment, to: EventStatus) => {
    const ui = stepUi(a.record, to);
    if (!ui) return;
    setToast({ key: Date.now(), message: `${a.patient} ${ui.done}.` });
  }, []);


  /* The step this person can still take back on an appointment, shown as a button where
     they took it, and taking it back. */
  const undoFor = useCallback((a: Appointment) => demo.undoable(a.id, viewer), [demo, viewer]);
  const takeBack = useCallback((a: Appointment) => {
    const u = demo.undoable(a.id, viewer);
    if (!u) return;
    const refused = demo.undo(a.id, viewer, u.status);
    setError(refused);
    if (!refused) setToast({ key: Date.now(), message: `Undone: ${a.patient} is no longer ${stepUi(a.record, u.status)?.done ?? u.status.toLowerCase()}.` });
  }, [demo, viewer]);

  const openDetail = useCallback((id: string) => { setSelectedId(id); setError(null); setScreen('detail'); }, []);

  /* Runs a step: straight away, after a confirmation, or by opening its screen. */
  const run = useCallback((a: Appointment, act: Action) => {
    if (act.ui.opens === 'upload') { setSelectedId(a.id); setUpload({ attached: false, confirmed: false }); setScreen('upload'); return; }
    if (act.ui.opens === 'propose') { setProposeFor(a.id); setScreen('day'); return; }
    if (act.ui.confirm) {
      const c = act.ui.confirm(a, toldLine(a, signedIn));
      setDialog({ title: c.title, body: c.body, action: c.action, cancel: c.cancel,
        onConfirm: () => { if (take(a.id, act.to, { note: c.note })) confirmDone(a, act.to); } });
      return;
    }
    if (take(a.id, act.to)) confirmDone(a, act.to);
  }, [signedIn, take, confirmDone]);

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
    const hit = derived.received.find(r => r.status === status);
    if (hit) setSelectedId(hit.id);
    setScreen('detail');
  }, [derived.received]);

  const commitUpload = useCallback((sel: Appointment) => {
    if (take(sel.id, 'Endorsed', { result: { file: resultFileName(sel), size: '152 KB' } })) {
      confirmDone(sel, 'Endorsed');
      setUpload({ attached: false, confirmed: false });
      setScreen('detail');
    }
  }, [take, confirmDone]);

  /* A clinic that refers out sends the appointment from here. A referral waits in
     Outgoing → New; an internal order is already this laboratory's accepted work. */
  /* Tests the doctor orders at a visit: the referral form, with the patient and the visit
     already filled in. */
  const orderFromVisit = useCallback((a: Appointment) => {
    referral.startFromVisit(a.patientId, a.id);
    setScreen('new');
  }, [referral]);

  const sendReferral = useCallback(() => {
    if (!merged) return;
    const draft = referral.draft();
    if (!draft) return;
    const made = demo.create(draft, viewer, referral.consentNote(viewer.name));
    if (typeof made === 'string') { setError(made); return; }
    if (referral.form.shareHistory) demo.grantHistory(made.patientId, made.lab, made.id, viewer.name);
    const internal = made.origin === 'Internal';
    setToast({
      key: Date.now(),
      message: internal
        ? `Internal order ${made.id} placed for ${made.lab}. The patient is told.`
        : `Referral ${made.id} sent to ${made.lab}. The laboratory and the patient are told.`,
    });
    setDirection(internal ? 'Incoming' : 'Outgoing');
    setFilter(internal ? 'Accepted' : 'New');
    setSelectedId(made.id);
    setScreen('detail');
    referral.reset();
  }, [merged, referral, demo, viewer]);

  /* VITAL's pick of a new time for an appointment: the same day as booked if anything is open,
     otherwise the next day that has a time. Never the current slot. */
  const suggestFor = useCallback((a: Appointment) => {
    for (let d = 0; d < 7; d++) {
      const s = suggestTime(a.lab, a.tests, Math.max(a.slot, now) + d * DAY, state.appointments, now, a.slot);
      if (s) return s;
    }
    return null;
  }, [state.appointments, now]);

  /* The patient let VITAL pick, so staff never set a time by hand: VITAL picks again and the
     appointment is accepted at that time. The patient is told it moved. */
  const repick = useCallback((a: Appointment) => {
    const s = suggestFor(a);
    if (!s) return;
    if (take(a.id, 'Accepted', { slot: s.slot, note: `The original time did not fit this facility’s schedule. VITAL picked a new one: ${s.reason.toLowerCase()}.` })) {
      setToast({ key: Date.now(), message: `VITAL moved ${a.patient} to ${fmtSlot(s.slot)}. They were told.` });
    }
  }, [suggestFor, take]);

  const startPropose = useCallback((id: string) => { setProposeFor(id); setScreen('day'); }, []);
  const cancelPropose = useCallback(() => { setProposeFor(null); setScreen('detail'); }, []);
  const proposeSlot = useCallback((slot: Minute) => {
    if (!proposeFor) return;
    const id = proposeFor;
    if (take(id, 'Reschedule proposed', { slot, note: 'The time chosen does not fit this facility’s schedule.' })) {
      const a = derived.received.find(r => r.id === id);
      if (a) confirmDone(a, 'Reschedule proposed');
      setProposeFor(null);
      setSelectedId(id);
      setScreen('detail');
    }
  }, [proposeFor, take, derived.received, confirmDone]);

  /* L6 — this facility's published slots for one day, with the appointments sitting in them.
     This is the only source of slot data: P7, R2 and L9 offer these same times. */
  const day = useMemo(() => {
    /* Today and the next three days. VITAL keeps no timetable: this lists the appointments
       booked for each time, so staff can check a requested time against their own schedule. */
    const today = dayIndex(now);
    const days = [0, 1, 2, 3].map(i => ({ day: at(today + i, '00:00') }));
    const current = days[Math.min(dayOffset, days.length - 1)];
    const d = dayIndex(current.day);
    const items = derived.received.filter(r => dayIndex(r.slot) === d && !['Declined', 'Consent revoked'].includes(r.status));
    const times = [...new Set(items.map(r => r.slot))].sort((a, b) => a - b);
    return {
      days, label: fmtDayLong(current.day), count: items.length,
      slots: times.map(slot => ({ slot, items: items.filter(r => r.slot === slot) })),
    };
  }, [now, dayOffset, derived.received]);

  /* Wait and result timing for one appointment, learned from past timestamps. */
  const estimate = useCallback((a: Appointment) => estimateFor(a.record, state.appointments, now), [state.appointments, now]);

  return {
    estimate,
    signedIn, staff: viewer.name, title: member?.title ?? 'Staff', readOnly: viewer.readOnly, viewer, caps, merged, now,
    screen, setScreen, filter, setFilter, direction, setDirection,
    ...derived,
    access, actionsFor, run, take, error, setError,
    openDetail, openFirst, pickConfig,
    dialog, setDialog, toast, setToast, undoFor, takeBack,
    upload, setUpload, commitUpload,
    proposeFor: proposeFor ? derived.received.find(r => r.id === proposeFor) || null : null,
    startPropose, cancelPropose, proposeSlot, suggestFor, repick, day, dayOffset, setDayOffset,
    referral, sendReferral, orderFromVisit,
  };
}

export type Lab = ReturnType<typeof useLab>;
