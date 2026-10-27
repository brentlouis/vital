import { describe, expect, it } from 'vitest';
import { prepareCreate, prepareTake, prepareUndo, reducer, seedState, undoableStep, type DemoState } from './state';
import { RHU, WALLET_PATIENT, defaultStaff } from '../domain/reference';
import { shownStatus, storedStatus, checkTrail } from '../domain/flow';
import { roleForEvent } from '../domain/seed';
import { noticesFor } from '../domain/notify';
import { historyGrant } from '../domain/access';
import { DAY } from '../domain/time';
import type { Viewer } from '../domain/types';

const LH = 'Loon Heritage Clinical Lab';
const staff = (f: string): Viewer => ({ kind: 'staff', facility: f, name: defaultStaff(f).name, readOnly: false });
const wallet: Viewer = { kind: 'patient', patientId: WALLET_PATIENT.id, name: 'Maria Dela Cruz' };

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

describe('undo takes back only what nobody has acted on since', () => {
  it('withdraws a one-tap step the same person just took, keeping both entries', () => {
    let s = seedState();
    const before = s.appointments.find(x => x.id === 'APT-401')!.trail.length;
    s = step(s, 'APT-401', staff(LH), 'Received');
    const action = prepareUndo(s, 'APT-401', staff(LH), 'Received');
    if (typeof action === 'string') throw new Error(action);
    s = reducer(s, action);
    const a = s.appointments.find(x => x.id === 'APT-401')!;
    expect(a.trail).toHaveLength(before + 2);
    expect(a.trail[a.trail.length - 1]).toMatchObject({ status: 'Received', withdraws: true, actor: staff(LH).name });
    expect(storedStatus(a)).toBe('Sent');
    expect(checkTrail(a, () => null)).toBeNull();
    /* The step can be taken again, and the withdrawal itself cannot be undone. */
    expect(undoableStep(s, 'APT-401', staff(LH))).toBeNull();
    s = step(s, 'APT-401', staff(LH), 'Received');
    expect(storedStatus(s.appointments.find(x => x.id === 'APT-401')!)).toBe('Received');
  });

  it('tells whoever heard about a withdrawn acceptance, without repeating it', () => {
    let s = seedState();
    s = step(s, 'APT-401', staff(LH), 'Received');
    s = step(s, 'APT-401', staff(LH), 'Accepted');
    const action = prepareUndo(s, 'APT-401', staff(LH), 'Accepted');
    if (typeof action === 'string') throw new Error(action);
    s = reducer(s, action);
    const orderer = s.appointments.find(x => x.id === 'APT-401')!.fromFacility!;
    const kinds = noticesFor(staff(orderer), s.appointments, s.now).filter(n => n.appointmentId === 'APT-401').map(n => n.kind);
    expect(kinds.filter(k => k === 'Accepted')).toHaveLength(1);
    expect(kinds).toContain('Acceptance withdrawn');
  });

  it('refuses once another step has been written, or for someone else', () => {
    let s = seedState();
    s = step(s, 'APT-401', staff(LH), 'Received');
    expect(typeof prepareUndo(s, 'APT-401', staff(RHU), 'Received')).toBe('string');
    s = step(s, 'APT-401', staff(LH), 'Accepted');
    expect(typeof prepareUndo(s, 'APT-401', staff(LH), 'Received')).toBe('string');
  });

  it('stays available for 15 minutes, then closes', () => {
    let s = seedState();
    s = step(s, 'APT-401', staff(LH), 'Received');
    expect(undoableStep(s, 'APT-401', staff(LH))?.status).toBe('Received');
    s = reducer(s, { type: 'tick', minutes: 16 });
    expect(undoableStep(s, 'APT-401', staff(LH))).toBeNull();
    expect(prepareUndo(s, 'APT-401', staff(LH), 'Received')).toMatch(/15 minutes/);
  });

  it('never undoes a step that confirms first', () => {
    let s = seedState();
    s = reducer(s, { type: 'tick', minutes: DAY });
    s = step(s, 'APT-405', staff(LH), 'No-show');
    expect(typeof prepareUndo(s, 'APT-405', staff(LH), 'No-show')).toBe('string');
  });
});

describe('a referral records how consent was given', () => {
  it('writes the counter consent on the first event', () => {
    const s = seedState();
    const made = prepareCreate(s, {
      patientId: WALLET_PATIENT.id, origin: 'Referred', fromFacility: RHU, lab: LH, tests: ['CBC'],
      note: 'Anaemia workup.', referredBy: null, slot: 1440,
    }, staff(RHU), 'Maria Dela Cruz agreed at the counter to share this appointment and its result.');
    if (typeof made === 'string' || made.type !== 'create') throw new Error(String(made));
    expect(made.record.trail[0].note).toMatch(/agreed at the counter/);
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

describe('a doctor visit closes when the doctor has seen the patient', () => {
  it('is marked seen by the facility, and can never carry a result', () => {
    let s = seedState();
    const RHU_STAFF = staff(RHU);
    s = step(s, 'APT-437', RHU_STAFF, 'Patient arrived');
    expect(typeof prepareTake(s, 'APT-437', RHU_STAFF, 'Endorsed')).toBe('string');
    s = step(s, 'APT-437', RHU_STAFF, 'Completed');
    expect(storedStatus(s.appointments.find(x => x.id === 'APT-437')!)).toBe('Completed');
  });
});

describe('history is shared separately, and only when the patient chose to', () => {
  const LH_LAB = 'Loon Heritage Clinical Lab';
  it('is off by default, and on for the health centre the patient shared it with', () => {
    const s = seedState();
    expect(historyGrant(s.historyGrants, s.appointments, WALLET_PATIENT.id, LH_LAB, s.now)).toBeUndefined();
    expect(historyGrant(s.historyGrants, s.appointments, WALLET_PATIENT.id, RHU, s.now)).toBeDefined();
  });

  it('given with an appointment, ends when that appointment closes; stopping ends it at once', () => {
    let s = seedState();
    s = reducer(s, { type: 'grantHistory', grant: { patientId: WALLET_PATIENT.id, facility: LH_LAB, appointmentId: 'APT-407', by: 'Health wallet', granted: 0 } });
    expect(historyGrant(s.historyGrants, s.appointments, WALLET_PATIENT.id, LH_LAB, s.now)).toBeDefined();
    s = reducer(s, { type: 'revokeHistory', patientId: WALLET_PATIENT.id, facility: LH_LAB });
    expect(historyGrant(s.historyGrants, s.appointments, WALLET_PATIENT.id, LH_LAB, s.now)).toBeUndefined();
    /* APT-434 is closed, so a grant tied to it never counts. */
    s = reducer(s, { type: 'grantHistory', grant: { patientId: WALLET_PATIENT.id, facility: 'Tagbilaran Diagnostic Center', appointmentId: 'APT-434', by: 'Health wallet', granted: 0 } });
    expect(historyGrant(s.historyGrants, s.appointments, WALLET_PATIENT.id, 'Tagbilaran Diagnostic Center', s.now)).toBeUndefined();
  });
});
