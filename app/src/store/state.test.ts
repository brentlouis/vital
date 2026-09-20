import { describe, expect, it } from 'vitest';
import { prepareCreate, prepareTake, reducer, seedState, type DemoState } from './state';
import { RHU, WALLET_PATIENT, defaultStaff } from '../domain/reference';
import { shownStatus, storedStatus, checkTrail } from '../domain/flow';
import { roleForEvent } from '../domain/seed';
import { noticesFor } from '../domain/notify';
import { DAY } from '../domain/time';
import type { Viewer } from '../domain/types';

const LH = 'Loon Heritage Clinical Lab';
const staff = (f: string): Viewer => ({ kind: 'staff', facility: f, name: defaultStaff(f).name, readOnly: false });
const wallet: Viewer = { kind: 'patient', patientId: WALLET_PATIENT.id, name: 'Maricel Abdon' };

/* Applies a step through the same path the screens use, failing the test if it is refused. */
function step(s: DemoState, id: string, v: Viewer, to: Parameters<typeof prepareTake>[3], opts?: Parameters<typeof prepareTake>[4]) {
  const action = prepareTake(s, id, v, to, opts);
  if (typeof action === 'string') throw new Error(action);
  return reducer(s, action);
}

describe('the store refuses what the flow table refuses', () => {
  it('will not let the RHU record a laboratory step', () => {
    const s = seedState();
    expect(prepareTake(s, 'APT-401', staff(RHU), 'Received')).toMatch(/cannot move APT-401 from Sent to Received/);
  });

  it('will not let a read-only clerk write anything', () => {
    const s = seedState();
    const clerk: Viewer = { kind: 'staff', facility: LH, name: 'L. Gantuangco', readOnly: true };
    expect(typeof prepareTake(s, 'APT-401', clerk, 'Received')).toBe('string');
  });

  it('will not let a laboratory start a referral', () => {
    const s = seedState();
    const made = prepareCreate(s, {
      patientId: WALLET_PATIENT.id, origin: 'Referred', fromFacility: RHU, lab: LH, tests: ['CBC'],
      note: '', referredBy: null, slot: 1440,
    }, staff(LH));
    expect(made).toMatch(/cannot start a referred appointment/);
  });
});

describe('one referral, end to end', () => {
  it('travels from the RHU through the laboratory and back, with a valid trail', () => {
    let s = seedState();
    const made = prepareCreate(s, {
      patientId: WALLET_PATIENT.id, origin: 'Referred', fromFacility: RHU, lab: LH, tests: ['CBC'],
      note: 'Anaemia workup.', referredBy: null, slot: 1440,
    }, staff(RHU));
    if (typeof made === 'string' || made.type !== 'create') throw new Error(String(made));
    s = reducer(s, made);
    const id = made.record.id;

    s = step(s, id, staff(LH), 'Received');
    s = step(s, id, staff(LH), 'Accepted');
    s = reducer(s, { type: 'tick', minutes: DAY });
    s = step(s, id, staff(LH), 'Patient arrived');
    s = step(s, id, staff(LH), 'Endorsed', { result: { file: 'cbc.pdf', size: '150 KB' } });
    s = step(s, id, staff(RHU), 'Completed');

    const a = s.appointments.find(x => x.id === id)!;
    expect(a.trail.map(e => e.status)).toEqual(['Sent', 'Received', 'Accepted', 'Patient arrived', 'Endorsed', 'Completed']);
    expect(checkTrail(a, i => roleForEvent(a, i))).toBeNull();
    expect(a.results).toHaveLength(1);
    /* Every event has its own, later timestamp. */
    a.trail.slice(1).forEach((e, i) => expect(e.at).toBeGreaterThan(a.trail[i].at));
    /* The patient heard about it along the way. */
    const kinds = noticesFor(wallet, s.appointments, s.now).filter(n => n.appointmentId === id).map(n => n.kind);
    expect(kinds).toEqual(expect.arrayContaining(['Scheduled', 'Confirmed', 'Result ready']));
  });

  it('goes overdue on its own when the clock passes the slot', () => {
    let s = seedState();
    const a = s.appointments.find(x => x.id === 'APT-405')!;
    expect(shownStatus(a, s.now)).toBe('Accepted');
    s = reducer(s, { type: 'tick', minutes: DAY });
    expect(shownStatus(s.appointments.find(x => x.id === 'APT-405')!, s.now)).toBe('Overdue');
    s = step(s, 'APT-405', staff(LH), 'No-show');
    expect(storedStatus(s.appointments.find(x => x.id === 'APT-405')!)).toBe('No-show');
  });

  it('lets the patient accept a proposed time, and revoke consent on another appointment', () => {
    let s = seedState();
    const proposal = s.appointments.find(x => x.id === 'APT-416')!;
    const slot = proposal.trail[proposal.trail.length - 1].slot!;
    s = step(s, 'APT-416', wallet, 'Accepted', { slot });
    expect(s.appointments.find(x => x.id === 'APT-416')!.slot).toBe(slot);
    s = step(s, 'APT-427', wallet, 'Consent revoked');
    expect(storedStatus(s.appointments.find(x => x.id === 'APT-427')!)).toBe('Consent revoked');
  });

  it('keeps a voided result in the record and accepts a replacement', () => {
    let s = seedState();
    s = step(s, 'APT-415', staff(LH), 'Endorsed', { result: { file: 'fbs.pdf', size: '140 KB' } });
    const a = s.appointments.find(x => x.id === 'APT-415')!;
    expect(a.results).toHaveLength(2);
    expect(a.results[0].voidedAt).toBeDefined();
    expect(a.results[1].voidedAt).toBeUndefined();
  });
});
