import { useCallback, useMemo, useState } from 'react';
import { patientViewer, useDemo } from '../../store/context';
import { isTerminal } from '../../domain/flow';
import { RHU, WALLET_PATIENT, facility as facilityNamed, publishedSlots, rankFacilities } from '../../domain/reference';
import { UNSEEN_FROM, noticesFor, seenKey, type Notice } from '../../domain/notify';
import { fmt, fmtDate, type Minute } from '../../domain/time';
import { toView, type Appointment } from '../../domain/view';
import type { AppointmentRecord, Status } from '../../domain/types';

export type Screen =
  | 'home' | 'detail' | 'docs' | 'consent' | 'revoke' | 'bookTests' | 'bookFacility'
  | 'booked' | 'profile' | 'notifications' | 'proposed';

export const SCREENS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'P1 Wallet home' },
  { id: 'detail', label: 'P2 Appointment detail' },
  { id: 'docs', label: 'P3 Documents' },
  { id: 'consent', label: 'P4 Consent' },
  { id: 'revoke', label: 'P5 Revoke access' },
  { id: 'bookTests', label: 'P6 New — tests' },
  { id: 'bookFacility', label: 'P7 New — facility' },
  { id: 'booked', label: 'P8 Booked' },
  { id: 'profile', label: 'P9 Profile' },
  { id: 'notifications', label: 'P10 Notifications' },
  { id: 'proposed', label: 'P11 Reschedule proposed' },
];

export type Tone = 'waiting' | 'progress' | 'done' | 'fail' | 'attention';
export type Hue = 'forest' | 'clay' | 'amber' | 'charcoal';

/* Plain language, not system labels (brief §5.3). */
export interface Plain { badge: string; line: string; glyph: string }

/* Who closes the loop depends on the origin, so Completed reads differently for each. */
type Origin = Pick<Appointment, 'origin' | 'fromFacility'>;

function completedLine(o?: Origin): string {
  if (o?.origin === 'Personal') return 'You opened your result. This appointment is finished.';
  if (o?.origin === 'Internal') return `${o.fromFacility} has read the result.`;
  if (o?.fromFacility && o.fromFacility !== RHU) return `${o.fromFacility}, which referred you, has read the result.`;
  return 'Your health centre has read the result.';
}

export function plain(status: Status, lab: string, past = false, o?: Origin): Plain {
  /* A history entry describes what happened and never asks the patient to act — the
     action has already moved on. */
  if (past && status === 'Reschedule proposed') {
    return { badge: 'New time proposed', line: `${lab} could not do the time you chose and proposed another one.`, glyph: 'event_repeat' };
  }
  if (past && status === 'Accepted') {
    return { badge: 'Ready for you', line: `Your time at ${lab} was confirmed.`, glyph: 'event_available' };
  }
  const P: Record<Status, [string, string, string]> = {
    Sent: ['Sent to the laboratory', `${lab} has been asked to do this test.`, 'send'],
    Booked: ['Booked', `Your appointment at ${lab} is booked. You do not need to do anything until then.`, 'event_available'],
    Received: ['Seen by the laboratory', `${lab} has received your appointment.`, 'mark_email_read'],
    Accepted: ['Ready for you', `${lab} is ready for you. You can go in during opening hours.`, 'event_available'],
    'Patient arrived': ['You have been tested', `${lab} has taken your sample.`, 'how_to_reg'],
    Endorsed: ['Result ready', `${lab} has released your result.`, 'description'],
    Completed: ['Finished', completedLine(o), 'task_alt'],
    Declined: ['Could not be done here', `${lab} could not do this test. Choose another facility, or ask your health centre to arrange one.`, 'cancel'],
    Overdue: ['Waiting for you', `${lab} is still expecting you. If you cannot go, tell your health centre.`, 'schedule'],
    'No-show': ['Closed — you did not go', `${lab} recorded that you did not arrive. Ask for a new appointment if you still need the test.`, 'person_off'],
    'Consent revoked': ['You stopped sharing', 'You stopped sharing this appointment, so it was closed.', 'shield'],
    'Reschedule proposed': ['New time proposed', `${lab} cannot do the time you chose and has proposed another one. Accept it, or choose another facility.`, 'event_repeat'],
    'Result voided': ['Result withdrawn', `${lab} withdrew the result because it was attached to the wrong person. A correct result will follow.`, 'report'],
  };
  const p = P[status];
  return { badge: p[0], line: p[1], glyph: p[2] };
}

export function skin(status: Status): { tone: Tone; hue: Hue } {
  if (status === 'Declined' || status === 'Result voided') return { tone: 'fail', hue: 'clay' };
  if (['Overdue', 'No-show', 'Consent revoked', 'Reschedule proposed'].includes(status)) return { tone: 'attention', hue: 'amber' };
  if (status === 'Completed') return { tone: 'done', hue: 'forest' };
  if (['Sent', 'Booked'].includes(status)) return { tone: 'waiting', hue: 'forest' };
  return { tone: 'progress', hue: 'forest' };
}

const NOTE_GLYPH: Record<string, string> = {
  Scheduled: 'event_upcoming', 'New time proposed': 'event_repeat', Confirmed: 'event_available',
  Declined: 'cancel', 'Result ready': 'description', 'Result withdrawn': 'report', Reminder: 'schedule',
};
export const noteSkin = (n: Notice) => ({ glyph: NOTE_GLYPH[n.kind] ?? 'notifications', hue: n.tone as Hue });

/* Every chosen test is accounted for: included, or excluded with its own reason. The two
   exclusion reasons stay apart — one means go elsewhere, the other means get a referral
   and come back. */
export interface BookingSummary {
  headline: string;
  included: string;
  notOffered: string;
  referral: string;
}

function summarise(included: string[], notOffered: string[], referral: string[]): BookingSummary {
  const total = included.length + notOffered.length + referral.length;
  return {
    headline: `Booking ${included.length} of ${total} ${total === 1 ? 'test' : 'tests'}`,
    included: included.join(', '), notOffered: notOffered.join(', '), referral: referral.join(', '),
  };
}

export function summaryFor(facilityName: string | null, tests: string[]): BookingSummary | null {
  const f = facilityNamed(facilityName ?? '');
  if (!f || !tests.length) return null;
  return summarise(
    tests.filter(x => f.coverage.includes(x) && !f.referralTests.includes(x)),
    tests.filter(x => !f.coverage.includes(x)),
    tests.filter(x => f.coverage.includes(x) && f.referralTests.includes(x)),
  );
}

/* The summary recorded on an appointment booked from the wallet. */
function recordedSummary(a: AppointmentRecord): BookingSummary | null {
  if (a.origin !== 'Personal' || (!a.notSent?.length && !a.referralRequired?.length)) return null;
  return summarise(a.tests, a.notSent ?? [], a.referralRequired ?? []);
}

/* The permissions the patient has given, one line each. */
export interface ConsentLine {
  key: string;
  facility: string;
  kind: 'Referring provider' | 'Receiving facility';
  scope: string;
  granted: string;
  until: string;
  active: boolean;
  revoke: { standing: string } | { appointment: string };
}

interface Booking {
  tests: string[];
  facility: string | null;
  slot: Minute | null;
  referredBy: string;
  id: string | null;
}

export function useWallet() {
  const demo = useDemo();
  const { state, now } = demo;
  const viewer = useMemo(() => patientViewer(WALLET_PATIENT.id), []);
  const [screen, setScreenRaw] = useState<Screen>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revokeKey, setRevokeKey] = useState<string | null>(null);
  const [booking, setBookingState] = useState<Booking>({
    tests: ['CBC', 'Chest X-ray'], facility: 'Dauis Bayview Laboratory', slot: null, referredBy: '', id: null,
  });
  const setBooking = useCallback((patch: Partial<Booking>) => setBookingState(b => ({ ...b, ...patch })), []);
  const key = seenKey(viewer);
  const seenAt = state.seen[key] ?? UNSEEN_FROM;

  /* Opening notifications marks everything read. */
  const setScreen = useCallback((id: Screen) => {
    if (id === 'notifications') demo.markSeen(key);
    setScreenRaw(id);
  }, [demo, key]);

  const mine = useMemo(() => state.appointments.filter(a => a.patientId === WALLET_PATIENT.id), [state.appointments]);
  const shown = useMemo(() => mine.map(a => toView(a, now)).sort((a, b) => b.updatedAt - a.updatedAt), [mine, now]);

  /* Anything waiting on the patient comes first: a proposed time, which expires, then a
     result only the patient can close. */
  const waitingOnPatient = (r: Appointment) =>
    r.status === 'Reschedule proposed' ? 0 : r.origin === 'Personal' && r.status === 'Endorsed' ? 1 : 2;
  const active = useMemo(() => shown
    .filter(r => !isTerminal(r.status))
    .sort((a, b) => waitingOnPatient(a) - waitingOnPatient(b))
    .slice(0, 3), [shown]);

  /* P11 shows the selected appointment when it has a proposed time, otherwise the first
     appointment that does. */
  const picked = shown.find(r => r.id === selectedId);
  const selected = (screen === 'proposed' && picked?.status !== 'Reschedule proposed'
    ? shown.find(r => r.status === 'Reschedule proposed') : picked)
    || picked || shown[0] || null;

  const openAppointment = useCallback((r: Appointment) => {
    setSelectedId(r.id);
    setScreenRaw(r.status === 'Reschedule proposed' ? 'proposed' : 'detail');
  }, []);

  const notes = useMemo(() => noticesFor(viewer, state.appointments, now), [viewer, state.appointments, now]);
  const unreadCount = notes.filter(n => n.at > seenAt).length;

  /* Results released to the patient, newest first — voided ones stay, marked. */
  const documents = useMemo(() => mine.flatMap(a => a.results.map(r => ({
    name: `${a.tests.join(', ')} result`, facility: a.lab, date: fmt(r.released), at: r.released,
    voided: r.voidedAt !== undefined,
  }))).sort((a, b) => b.at - a.at), [mine]);

  /* Standing grants to referring facilities, then one line per appointment for the facility
     performing it — open ones while they run, and the most recent closed ones. */
  const consents = useMemo<ConsentLine[]>(() => {
    const standing = state.grants.filter(g => g.patientId === WALLET_PATIENT.id).map(g => {
      const on = g.revokedAt === undefined || g.revokedAt > now;
      return {
        key: `standing:${g.facility}`, facility: g.facility, kind: 'Referring provider' as const,
        scope: 'Appointments and results you send through this facility',
        granted: fmtDate(g.granted), until: on ? 'No end date' : `Stopped ${fmtDate(g.revokedAt!)}`, active: on,
        revoke: { standing: g.facility },
      };
    });
    const perAppointment = [...mine].sort((a, b) => b.trail[b.trail.length - 1].at - a.trail[a.trail.length - 1].at).map(a => {
      const v = toView(a, now);
      const open = !isTerminal(v.status);
      const closedAt = a.trail[a.trail.length - 1].at;
      return {
        key: `appointment:${a.id}`, facility: a.lab, kind: 'Receiving facility' as const,
        scope: `One appointment — ${a.tests.join(', ')}, ${a.id}`,
        granted: fmtDate(a.trail[0].at),
        until: open ? 'When this appointment closes' : v.status === 'Consent revoked' ? `Stopped ${fmtDate(closedAt)}` : `Closed ${fmtDate(closedAt)}`,
        active: open, revoke: { appointment: a.id },
      };
    });
    const openLines = perAppointment.filter(c => c.active);
    const closedLines = perAppointment.filter(c => !c.active).slice(0, 2);
    return [...standing, ...openLines, ...closedLines];
  }, [state.grants, mine, now]);

  /* Booking flow (P6–P8). Slots come from the chosen facility's own published schedule —
     the same data L6 renders — never from a list of VITAL's own. */
  const book = useMemo(() => {
    const ranked = rankFacilities(booking.tests);
    const slots = booking.facility ? publishedSlots(booking.facility, now) : [];
    const chosen = ranked.find(f => f.name === booking.facility);
    const slot = booking.slot !== null && slots.includes(booking.slot) ? booking.slot : null;
    const canBook = !!(booking.facility && slot !== null && booking.tests.length && !chosen?.blocked);
    const blocked = ranked.filter(f => f.blocked);
    const blockedTests = [...new Set(blocked.flatMap(f => f.referralOnly))];
    return {
      ranked, slots, slot, chosen, canBook, blockedTests, hasBlocked: blocked.length > 0,
      summary: summaryFor(booking.facility, booking.tests),
    };
  }, [booking, now]);

  const toggleTest = useCallback((name: string) => {
    setBookingState(b => ({
      ...b, facility: null, slot: null,
      tests: b.tests.includes(name) ? b.tests.filter(x => x !== name) : [...b.tests, name],
    }));
  }, []);

  /* Books the tests this facility accepts directly. The others are recorded on the
     appointment with their reason, so the summary survives on P2. */
  const confirmBooking = useCallback(() => {
    if (!book.canBook || !booking.facility || book.slot === null) return;
    const f = facilityNamed(booking.facility)!;
    const made = demo.create({
      patientId: WALLET_PATIENT.id, origin: 'Personal', fromFacility: null, lab: f.name,
      tests: booking.tests.filter(x => f.coverage.includes(x) && !f.referralTests.includes(x)),
      notSent: booking.tests.filter(x => !f.coverage.includes(x)),
      referralRequired: booking.tests.filter(x => f.coverage.includes(x) && f.referralTests.includes(x)),
      note: 'Booked directly from the health wallet.',
      referredBy: booking.referredBy.trim() || null, slot: book.slot,
    }, viewer);
    if (typeof made === 'string') return;
    setBooking({ id: made.id });
    setScreenRaw('booked');
  }, [book, booking, demo, viewer, setBooking]);

  /* The referred-by note is patient-entered and never grants access. It follows the booked
     appointment so the receiving facility sees it. */
  const setReferredBy = useCallback((v: string) => {
    setBooking({ referredBy: v });
    if (booking.id) demo.setReferredBy(booking.id, v.trim() || null);
  }, [setBooking, booking.id, demo]);

  const openResult = useCallback((r: Appointment) => demo.openResult(r.id, viewer), [demo, viewer]);

  /* P11 can be reached before anything is selected, so both actions work off the
     appointment the screen is actually showing. Only the patient can accept a new time. */
  const acceptProposed = useCallback(() => {
    if (!selected || selected.proposedSlotAt === null) return;
    const refused = demo.take(selected.id, viewer, 'Accepted', { slot: selected.proposedSlotAt });
    if (refused) return;
    setSelectedId(selected.id);
    setScreenRaw('detail');
  }, [selected, demo, viewer]);

  const rebookElsewhere = useCallback(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setBookingState(b => ({ ...b, tests: [...selected.tests], facility: null, slot: null, id: null }));
    setScreenRaw('bookFacility');
  }, [selected]);

  const startRevoke = useCallback((k: string) => { setRevokeKey(k); setScreenRaw('revoke'); }, []);
  const revoke = consents.find(c => c.key === revokeKey) ?? consents.find(c => c.active) ?? null;
  const confirmRevoke = useCallback(() => {
    if (!revoke) return;
    if ('standing' in revoke.revoke) demo.revokeGrant(WALLET_PATIENT.id, revoke.revoke.standing);
    else demo.take(revoke.revoke.appointment, viewer, 'Consent revoked');
    setScreenRaw('consent');
  }, [revoke, demo, viewer]);

  const summaries = useMemo(() => Object.fromEntries(mine.map(a => [a.id, recordedSummary(a)])), [mine]);

  return {
    now, opened: state.opened, openResult,
    screen, setScreen, referrals: shown, active, selected, openAppointment,
    consents, revoke, startRevoke, confirmRevoke,
    notes, unreadCount, seenAt, documents,
    booking, setBooking, toggleTest, book, confirmBooking, setReferredBy,
    summaries, acceptProposed, rebookElsewhere, rhu: RHU,
  };
}

export type Wallet = ReturnType<typeof useWallet>;
