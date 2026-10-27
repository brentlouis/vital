import { useCallback, useMemo, useState } from 'react';
import { useDemo } from '../../store/context';
import { allowedSteps, isTerminal } from '../../domain/flow';
import { accessTo, activeGrant, type Access } from '../../domain/access';
import { PEOPLE, RHU, capabilitiesOf, findStaff } from '../../domain/reference';
import { toView, type Appointment } from '../../domain/view';
import type { EventStatus, Status } from '../../domain/types';
import type { Minute } from '../../domain/time';
import type { DialogSpec, ToastSpec } from '../../components/ui';
import { stepUi, byVariant, toldLine, type StepUi } from '../../components/steps';
import { useReferralForm } from '../../components/referral/useReferralForm';

export type Screen = 'queue' | 'new' | 'detail' | 'search' | 'denied' | 'plan' | 'report';
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
  /* The queue opens on what needs someone here to act; everything is one tab away. */
  const [filter, setFilter] = useState<QueueTab>('Needs follow-up');
  const [direction, setDirection] = useState<Direction>('Outgoing');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [toast, setToast] = useState<ToastSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposeFor, setProposeFor] = useState<string | null>(null);
  const referral = useReferralForm(RHU, now);

  const viewer = demo.staffViewer(RHU);
  const member = findStaff(RHU, viewer.name);
  const caps = capabilitiesOf(RHU);
  /* Capabilities, not facility type, decide what this portal shows. A facility with both
     gets one queue with a direction filter rather than two screens. */
  /* The health centre has doctors, so patients book visits with it: it refers out and receives
     doctor visits, with a switch between the two. */
  const merged = caps.canRefer;

  /* A referring facility sees only the appointments it referred. A patient's own bookings and
     other facilities' referrals are records the patient never shared with it (brief §2.4). */
  const shown = useMemo(() => state.appointments
    .filter(a => a.origin === 'Referred' && a.fromFacility === RHU)
    .map(a => toView(a, now)), [state.appointments, now]);
  /* Doctor visits patients booked with this health centre. */
  const visits = useMemo(() => state.appointments
    .filter(a => a.lab === RHU)
    .map(a => toView(a, now)), [state.appointments, now]);

  const access = useCallback((a: Appointment): Access => accessTo(a.record, viewer, state.grants, now),
    [viewer, state.grants, now]);

  const queue = useMemo(() => {
    const outgoing = shown;
    const incoming = visits;
    const visitsView = merged && direction === 'Incoming';
    const scoped = visitsView ? incoming : outgoing;
    /* A visit needs follow-up here when this health centre has a step to take on it. */
    const bucket = (r: Appointment): RhuBucket => !visitsView ? RHU_BUCKET[r.status]
      : isTerminal(r.status) ? 'closed' : allowedSteps(r.record, viewer, now).length ? 'follow' : 'flight';
    const buckets: Record<QueueTab, Appointment[]> = {
      All: scoped,
      'In flight': scoped.filter(r => bucket(r) === 'flight'),
      'Needs follow-up': scoped.filter(r => bucket(r) === 'follow'),
      Closed: scoped.filter(r => bucket(r) === 'closed'),
    };
    return { outgoing, incoming, buckets };
  }, [shown, visits, merged, direction, viewer, now]);

  const all = useMemo(() => [...shown, ...visits], [shown, visits]);
  const selected = all.find(r => r.id === selectedId) || shown[0] || null;

  /* Opening a record is a read, and every read is checked against consent. A refusal is
     recorded in the audit log and shown as access denied (R8). */
  const openDetail = useCallback((id: string) => {
    const a = all.find(r => r.id === id);
    setError(null);
    if (a && access(a) === 'denied') {
      demo.recordDenied(viewer, a.patientId);
      setDeniedFor(a.patientId);
      setScreen('denied');
      return;
    }
    setSelectedId(id);
    setScreen('detail');
  }, [all, access, demo, viewer]);

  const actionsFor = useCallback((a: Appointment): Action[] =>
    access(a) === 'denied' ? [] : allowedSteps(a.record, viewer, now)
      .map(s => ({ to: s.to, ui: stepUi(a.record, s.to) }))
      .filter((x): x is Action => !!x.ui)
      .sort(byVariant), [access, viewer, now]);

  const run = useCallback((a: Appointment, act: Action) => {
    /* A new time is picked from this health centre's published times, on the visit itself. */
    if (act.ui.opens === 'propose') { setProposeFor(a.id); return; }
    if (act.ui.confirm) {
      const c = act.ui.confirm(a, toldLine(a, RHU));
      setDialog({ title: c.title, body: c.body, action: c.action, cancel: c.cancel,
        onConfirm: () => {
          setDialog(null);
          const refused = demo.take(a.id, viewer, act.to, { note: c.note });
          setError(refused);
          if (!refused) setToast({ key: Date.now(), message: `${a.patient} ${act.ui.done}.` });
        } });
      return;
    }
    const refused = demo.take(a.id, viewer, act.to);
    setError(refused);
    if (refused) return;
    setToast({
      key: Date.now(),
      message: `${a.patient} ${act.ui.done}.`,
    });
  }, [demo, viewer]);

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

  const proposeTime = useCallback((a: Appointment, slot: Minute) => {
    const refused = demo.take(a.id, viewer, 'Reschedule proposed', { slot });
    setError(refused);
    if (refused) return;
    setProposeFor(null);
    setToast({ key: Date.now(), message: `New time proposed to ${a.patient}. They have 48 hours to answer.` });
  }, [demo, viewer]);

  /* Tests the doctor orders at a visit: the referral form, with the patient and visit filled in. */
  const orderFromVisit = useCallback((a: Appointment) => {
    referral.startFromVisit(a.patientId, a.id);
    setScreen('new');
  }, [referral]);
  const orderedFrom = useCallback((a: Appointment) => all.filter(r => r.fromVisit === a.id), [all]);

  const send = useCallback(() => {
    const draft = referral.draft();
    if (!draft) return;
    const made = demo.create(draft, viewer, referral.consentNote(viewer.name));
    if (typeof made === 'string') { setError(made); return; }
    if (referral.form.shareHistory) demo.grantHistory(made.patientId, made.lab, made.id, viewer.name);
    setSelectedId(made.id);
    setFilter('All');
    setScreen('detail');
    setToast({ key: Date.now(), message: `Referral ${made.id} sent to ${made.lab}. The laboratory and the patient are told.` });
    referral.reset();
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
    viewer, title: member?.title ?? 'Staff', caps, merged, now, screen, setScreen, filter, setFilter, direction, setDirection,
    ...queue, selected, openDetail, access, actionsFor, run, error, dialog, setDialog, toast, setToast, undoFor, takeBack,
    deniedFor, referral, send, orderFromVisit, orderedFrom, proposeFor, setProposeFor, proposeTime, query, setQuery, people,
  };
}

export type Rhu = ReturnType<typeof useRhu>;
