import { describe, expect, it } from 'vitest';
import { STEPS, allowedSteps, canTake, checkTrail, shownStatus, OVERDUE_GRACE, RESPOND_WINDOW } from './flow';
import { SEED_APPOINTMENTS, SEED_GRANTS, roleForEvent, actorFor } from './seed';
import { RHU, facility, defaultStaff, WALLET_PATIENT, PEOPLE } from './reference';
import { accessTo } from './access';
import { noticesFor } from './notify';
import type { AppointmentRecord, Viewer } from './types';

const byId = (id: string) => {
  const a = SEED_APPOINTMENTS.find(x => x.id === id);
  if (!a) throw new Error(`missing ${id}`);
  return a;
};
const staff = (f: string, readOnly = false): Viewer => ({ kind: 'staff', facility: f, name: defaultStaff(f).name, readOnly });
const patient = (id: string): Viewer => ({ kind: 'patient', patientId: id, name: 'patient' });

const LH = 'Loon Heritage Clinical Lab';
const TDC = 'Tagbilaran Diagnostic Center';

describe('seed data follows the brief', () => {
  it.each(SEED_APPOINTMENTS.map(a => [a.id, a] as const))('%s replays against the flow table', (_id, a) => {
    expect(checkTrail(a, i => roleForEvent(a, i))).toBeNull();
  });

  it.each(SEED_APPOINTMENTS.map(a => [a.id, a] as const))('%s names the right actor for every event', (_id, a) => {
    a.trail.forEach((e, i) => {
      const who = actorFor(roleForEvent(a, i), a);
      expect({ actor: e.actor, facility: e.facility }).toEqual(who);
    });
  });

  it.each(SEED_APPOINTMENTS.map(a => [a.id, a] as const))('%s only asks for tests the laboratory offers', (_id, a) => {
    const f = facility(a.lab)!;
    expect(a.tests.filter(t => !f.coverage.includes(t))).toEqual([]);
    /* A patient cannot book a test the laboratory only accepts on referral. */
    if (a.origin === 'Personal') expect(a.tests.filter(t => f.referralTests.includes(t))).toEqual([]);
  });

  it('never refers a facility to itself', () => {
    expect(SEED_APPOINTMENTS.filter(a => a.origin === 'Referred' && a.fromFacility === a.lab)).toEqual([]);
  });

  it('keeps appointment IDs unique', () => {
    const ids = SEED_APPOINTMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shows every status in at least one laboratory queue', () => {
    const shown = new Set(SEED_APPOINTMENTS.map(a => shownStatus(a, 0)));
    for (const s of ['Sent', 'Booked', 'Received', 'Accepted', 'Overdue', 'Reschedule proposed', 'Patient arrived',
      'Endorsed', 'Completed', 'Declined', 'No-show', 'Consent revoked', 'Result voided']) {
      expect(shown, s).toContain(s);
    }
  });
});

describe('who may take which step', () => {
  it('lets only the receiving laboratory record a no-show, and only once overdue', () => {
    const overdue = byId('APT-417');
    expect(shownStatus(overdue, 0)).toBe('Overdue');
    expect(canTake(overdue, staff(TDC), 0, 'No-show')).toBe(true);
    expect(canTake(overdue, staff(RHU), 0, 'No-show')).toBe(false);

    const onTime = byId('APT-405');
    expect(shownStatus(onTime, 0)).toBe('Accepted');
    expect(canTake(onTime, staff(LH), 0, 'No-show')).toBe(false);
  });

  it('turns Accepted into Overdue only after the grace period', () => {
    const a = byId('APT-405');
    expect(shownStatus(a, a.slot + OVERDUE_GRACE)).toBe('Accepted');
    expect(shownStatus(a, a.slot + OVERDUE_GRACE + 1)).toBe('Overdue');
  });

  it('gives the referring facility nothing to do until a result is released', () => {
    for (const id of ['APT-401', 'APT-404', 'APT-405', 'APT-417']) {
      expect(allowedSteps(byId(id), staff(RHU), 0).map(s => s.to)).toEqual([]);
    }
    expect(allowedSteps(byId('APT-421'), staff(RHU), 0).map(s => s.to)).toEqual(['Completed']);
  });

  it('lets the patient close a personal appointment, but not a referred one', () => {
    expect(canTake(byId('APT-407'), patient(WALLET_PATIENT.id), 0, 'Completed')).toBe(true);
    expect(canTake(byId('APT-408'), patient(WALLET_PATIENT.id), 0, 'Completed')).toBe(false);
  });

  it('lets only the patient accept a proposed time, and only inside the window', () => {
    const a = byId('APT-416');
    expect(canTake(a, patient(WALLET_PATIENT.id), 0, 'Accepted')).toBe(true);
    expect(canTake(a, staff(TDC), 0, 'Accepted')).toBe(false);
    const proposedAt = a.trail[a.trail.length - 1].at;
    expect(canTake(a, patient(WALLET_PATIENT.id), proposedAt + RESPOND_WINDOW, 'Accepted')).toBe(false);
    expect(canTake(a, staff(TDC), proposedAt + RESPOND_WINDOW, 'Declined')).toBe(true);
  });

  it('gives read-only staff no steps at all', () => {
    const readOnly: Viewer = { kind: 'staff', facility: LH, name: 'L. Gantuangco', readOnly: true };
    for (const a of SEED_APPOINTMENTS.filter(x => x.lab === LH)) {
      expect(allowedSteps(a, readOnly, 0)).toEqual([]);
    }
  });

  it('lets a clinic run its own internal order end to end', () => {
    const internal = byId('APT-422');
    expect(allowedSteps(internal, staff(TDC), 0).map(s => s.to)).toContain('Patient arrived');
    const endorsed: AppointmentRecord = {
      ...internal,
      trail: [...internal.trail, { status: 'Patient arrived', at: 10, actor: 'R. Piezas', facility: TDC },
        { status: 'Endorsed', at: 20, actor: 'R. Piezas', facility: TDC }],
    };
    expect(canTake(endorsed, staff(TDC), 30, 'Completed')).toBe(true);
  });

  it('never lets another facility touch an appointment', () => {
    for (const a of SEED_APPOINTMENTS) {
      const outsider = ['Dauis Bayview Laboratory', 'Loboc Riverside Laboratory'].find(f => f !== a.lab && f !== a.fromFacility)!;
      expect(allowedSteps(a, staff(outsider), 0)).toEqual([]);
    }
  });

  it('every step names a role and at least one status it can follow', () => {
    for (const s of STEPS) expect(s.from.length).toBeGreaterThan(0);
  });
});

describe('consent', () => {
  it('refuses the RHU a patient who withdrew their standing grant', () => {
    const ariel = byId('APT-412');
    expect(ariel.patientId).toBe(PEOPLE[8].id);
    expect(accessTo(ariel, staff(RHU), SEED_GRANTS, 0)).toBe('denied');
  });

  it('keeps a revoked appointment visible but withdrawn for the laboratory', () => {
    expect(accessTo(byId('APT-412'), staff(LH), SEED_GRANTS, 0)).toBe('withdrawn');
  });

  it('never shows a personal booking to a referring facility', () => {
    expect(accessTo(byId('APT-403'), staff(RHU), SEED_GRANTS, 0)).toBe('denied');
  });
});

describe('notifications', () => {
  it('tells the referring facility when a patient did not arrive', () => {
    const rhu = noticesFor(staff(RHU), SEED_APPOINTMENTS, 0);
    expect(rhu.some(n => n.appointmentId === 'APT-411' && n.kind === 'Did not arrive')).toBe(true);
  });

  it('does not tell a facility about what it did itself', () => {
    const lh = noticesFor(staff(LH), SEED_APPOINTMENTS, 0);
    expect(lh.some(n => n.kind === 'Did not arrive')).toBe(false);
  });

  it('never tells the patient about their own actions', () => {
    const own = noticesFor(patient(WALLET_PATIENT.id), SEED_APPOINTMENTS, 0);
    expect(own.every(n => n.appointmentId)).toBe(true);
    expect(own.some(n => n.appointmentId === 'APT-434' && n.kind === 'Scheduled')).toBe(false);
  });
});

describe('the trail checker catches broken histories', () => {
  const base = byId('APT-405');
  const role = (a: AppointmentRecord) => (i: number) => { try { return roleForEvent(a, i); } catch { return null; } };

  it('rejects a step out of order', () => {
    const bad: AppointmentRecord = { ...base, trail: [base.trail[0], { ...base.trail[2] }] };
    expect(checkTrail(bad, role(bad))).toMatch(/Accepted cannot follow Sent/);
  });

  it('rejects a no-show before the slot has passed', () => {
    const bad: AppointmentRecord = { ...base, trail: [...base.trail, { status: 'No-show', at: -10, actor: 'E. Bughao', facility: LH }] };
    expect(checkTrail(bad, role(bad))).toMatch(/No-show cannot follow Accepted/);
  });

  it('rejects the wrong first event for an origin', () => {
    const bad: AppointmentRecord = { ...base, origin: 'Personal' };
    expect(checkTrail(bad, role(bad))).toMatch(/must start at Booked/);
  });

  it('rejects the referrer writing a laboratory step', () => {
    const bad: AppointmentRecord = { ...base, trail: [base.trail[0], { ...base.trail[1], actor: 'J. Bacarro', facility: RHU }] };
    expect(checkTrail(bad, () => 'orderer')).toMatch(/Received cannot follow Sent when written by the orderer/);
  });
});
