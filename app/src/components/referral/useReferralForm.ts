import { useCallback, useMemo, useState } from 'react';
import {
  PEOPLE, TEST_META, capabilitiesOf, facility as facilityNamed, rankFacilities,
  type Facility,
} from '../../domain/reference';
import type { AppointmentRecord, PriorityReason } from '../../domain/types';
import type { Minute } from '../../domain/time';

/* Every requested test is accounted for at the chosen laboratory: sent, or left out with its
   reason. A referred appointment is itself the health-centre referral, so tests a laboratory
   accepts only on referral are sent here — unlike a patient booking from the wallet. The one
   reason a test is left out is that the laboratory does not offer it. */
export interface ReferralSummary {
  lab: string;
  included: string[];
  /** Included tests this laboratory accepts only because a facility is referring. */
  referralOnly: string[];
  notOffered: string[];
  total: number;
}

export function referralSummary(f: Facility, picked: string[]): ReferralSummary {
  const included = picked.filter(t => f.coverage.includes(t));
  return {
    lab: f.name,
    included,
    referralOnly: included.filter(t => f.referralTests.includes(t)),
    notOffered: picked.filter(t => !f.coverage.includes(t)),
    total: picked.length,
  };
}

export interface ReferralFormState {
  /** Empty until someone picks the patient: a referral never starts with a person chosen. */
  patientId: string;
  lab: string;
  tests: string[];
  slot: Minute | null;
  note: string;
  /** The patient agreed, at the counter, to share this appointment with the receiving facility. */
  consent: boolean;
  /** The doctor visit these tests are ordered from, if any. */
  fromVisit: string | null;
  /** The patient also agreed to share their earlier results and details with the facility. */
  shareHistory: boolean;
  /** Why the patient is seen first, if they are. */
  priority: PriorityReason | null;
  /** VITAL picks the time; staff choose only the day. */
  autoTime: boolean;
}

const EMPTY: ReferralFormState = { patientId: '', lab: '', tests: [], slot: null, note: '', consent: false, fromVisit: null, shareHistory: false, priority: null, autoTime: true };

/* R2 / L9 — create an appointment on behalf of any facility with can_refer set: the RHU, or a
   clinic that both refers and receives. The partner list never includes the referrer. A
   facility that also receives gets its own laboratory as a separate choice: an internal
   order, which has no handoff to make. */
export function useReferralForm(referrer: string, now: Minute) {
  const [form, setFormState] = useState<ReferralFormState>(EMPTY);
  /* Consent names the receiving facility, so a new choice of facility asks for it again. */
  const setForm = useCallback((patch: Partial<ReferralFormState>) => setFormState(f => ({
    ...f, ...patch, ...('lab' in patch && patch.lab !== f.lab ? { consent: false, shareHistory: false } : {}),
    ...(patch.consent === false ? { shareHistory: false } : {}),
  })), []);

  /* Test filter and facility ranking, same band rule as the wallet (brief §3.2). */
  const create = useMemo(() => {
    const picked = form.tests;
    /* Nothing is chosen for the person: no laboratory until tests are picked, and no
       laboratory or time until someone picks one. */
    const ranked = picked.length ? rankFacilities(picked).filter(f => f.name !== referrer) : [];
    const ownFacility = picked.length && capabilitiesOf(referrer).canReceive ? facilityNamed(referrer) : undefined;
    const ownSummary = ownFacility ? referralSummary(ownFacility, picked) : null;
    const own = ownFacility && ownSummary?.included.length ? { facility: ownFacility, summary: ownSummary } : null;
    const valid = (name: string) => ranked.some(f => f.name === name) || (!!own && own.facility.name === name);
    const lab = valid(form.lab) ? form.lab : '';
    const internal = !!own && lab === referrer;
    /* Any future time: the receiving facility checks it against its own schedule. */
    const slot = form.slot !== null && form.slot > now ? form.slot : null;
    const chosen = internal ? own!.facility : ranked.find(f => f.name === lab);
    const summary = chosen ? referralSummary(chosen, picked) : null;
    /* What still stands between this form and sending it, in the order the form asks. */
    const missing = [
      !form.patientId && 'the patient',
      !picked.length && 'at least one test',
      !lab && 'a receiving facility',
      lab && slot === null && 'a time',
      !form.note.trim() && 'a clinical note',
      lab && !form.consent && "the patient's agreement to share",
    ].filter((x): x is string => !!x);
    return { picked, ranked, own, internal, lab, slot, tests: TEST_META, summary, missing, ready: !missing.length && !!summary?.included.length };
  }, [form, referrer, now]);

  const toggleTest = useCallback((name: string) => {
    setFormState(f => {
      return { ...f, lab: '', slot: null, consent: false, tests: f.tests.includes(name) ? f.tests.filter(x => x !== name) : [...f.tests, name] };
    });
  }, []);

  /* The appointment to create: only tests the laboratory offers are included; the rest are
     recorded so they are booked elsewhere. The store writes the first event — Sent for a
     referral, Accepted for an internal order. */
  const draft = useCallback((): Omit<AppointmentRecord, 'id' | 'trail' | 'results'> | null => {
    const included = create.summary?.included ?? [];
    if (!create.ready || !included.length || !create.lab || create.slot === null) return null;
    return {
      patientId: form.patientId,
      origin: create.internal ? 'Internal' : 'Referred',
      fromFacility: referrer,
      lab: create.lab,
      tests: included,
      note: form.note.trim(),
      referredBy: null,
      slot: create.slot,
      ...(create.summary?.notOffered.length ? { notSent: create.summary.notOffered } : {}),
      ...(form.fromVisit ? { fromVisit: form.fromVisit } : {}),
      ...(form.priority ? { priority: form.priority } : {}),
      ...(form.autoTime ? { autoTime: true } : {}),
    };
  }, [create, form, referrer]);

  const reset = useCallback(() => setFormState(EMPTY), []);
  /* Ordering tests at a doctor visit: the patient is the one just seen, so it is filled in. */
  const startFromVisit = useCallback((patientId: string, visitId: string) =>
    setFormState({ ...EMPTY, patientId, fromVisit: visitId }), []);
  const dirty = !!(form.patientId || form.tests.length || form.note.trim());

  /* Written on the first event, so the receiving facility sees how consent was given. */
  const consentNote = useCallback((staff: string) => {
    const p = PEOPLE.find(x => x.id === form.patientId);
    const who = p ? p.name : 'The patient';
    return `${who} agreed at the counter to share this appointment and its result with ${create.lab}. Recorded by ${staff}.`;
  }, [form.patientId, create.lab]);

  return { referrer, now, form, setForm, toggleTest, create, draft, reset, startFromVisit, dirty, consentNote };
}

export type ReferralForm = ReturnType<typeof useReferralForm>;
