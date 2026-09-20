import { useCallback, useMemo, useState } from 'react';
import {
  PEOPLE, TEST_META, capabilitiesOf, facility as facilityNamed, publishedSlots, rankFacilities,
  type Facility,
} from '../../domain/reference';
import type { AppointmentRecord } from '../../domain/types';
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
  patientId: string;
  lab: string;
  tests: string[];
  slot: Minute | null;
  note: string;
}

/* R2 / L9 — create an appointment on behalf of any facility with can_refer set: the RHU, or a
   clinic that both refers and receives. The partner list never includes the referrer. A
   facility that also receives gets its own laboratory as a separate choice: an internal
   order, which has no handoff to make. */
export function useReferralForm(referrer: string, now: Minute) {
  const [form, setFormState] = useState<ReferralFormState>({
    patientId: PEOPLE[1].id, lab: '', tests: ['CBC'], slot: null, note: '',
  });
  const setForm = useCallback((patch: Partial<ReferralFormState>) => setFormState(f => ({ ...f, ...patch })), []);

  /* Test filter and facility ranking, same band rule as the wallet (brief §3.2). */
  const create = useMemo(() => {
    const picked = form.tests.length ? form.tests : ['CBC'];
    const ranked = rankFacilities(picked).filter(f => f.name !== referrer);
    const ownFacility = capabilitiesOf(referrer).canReceive ? facilityNamed(referrer) : undefined;
    const ownSummary = ownFacility ? referralSummary(ownFacility, picked) : null;
    const own = ownFacility && ownSummary?.included.length ? { facility: ownFacility, summary: ownSummary } : null;
    const valid = (name: string) => ranked.some(f => f.name === name) || (!!own && own.facility.name === name);
    const lab = valid(form.lab) ? form.lab : (ranked[0]?.name ?? own?.facility.name ?? '');
    const internal = !!own && lab === referrer;
    /* The only slots this form may offer are the ones the receiving facility published (L6). */
    const slots = lab ? publishedSlots(lab, now) : [];
    const slot = form.slot !== null && slots.includes(form.slot) ? form.slot : (slots[0] ?? null);
    const chosen = internal ? own!.facility : ranked.find(f => f.name === lab);
    return {
      picked, ranked, own, internal, lab, slots, slot, tests: TEST_META,
      summary: chosen ? referralSummary(chosen, picked) : null,
    };
  }, [form, referrer, now]);

  const toggleTest = useCallback((name: string) => {
    setFormState(f => {
      const picked = f.tests.length ? f.tests : ['CBC'];
      return { ...f, lab: '', tests: picked.includes(name) ? picked.filter(x => x !== name) : [...picked, name] };
    });
  }, []);

  /* The appointment to create: only tests the laboratory offers are included; the rest are
     recorded so they are booked elsewhere. The store writes the first event — Sent for a
     referral, Accepted for an internal order. */
  const draft = useCallback((): Omit<AppointmentRecord, 'id' | 'trail' | 'results'> | null => {
    const included = create.summary?.included ?? [];
    if (!included.length || !create.lab || create.slot === null) return null;
    return {
      patientId: form.patientId,
      origin: create.internal ? 'Internal' : 'Referred',
      fromFacility: referrer,
      lab: create.lab,
      tests: included,
      note: form.note.trim() || 'No clinical note recorded.',
      referredBy: null,
      slot: create.slot,
      ...(create.summary?.notOffered.length ? { notSent: create.summary.notOffered } : {}),
    };
  }, [create, form, referrer]);

  const clearNote = useCallback(() => setForm({ note: '' }), [setForm]);

  return { referrer, form, setForm, toggleTest, create, draft, clearNote };
}

export type ReferralForm = ReturnType<typeof useReferralForm>;
