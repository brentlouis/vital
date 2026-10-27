import { describe, expect, it } from 'vitest';
import { activePatients, auditRows, labTrackRecord, pilotMeasures, turnaroundHours } from './measures';
import { reducer, seedState } from '../store/state';
import { RHU, MANUAL_BASELINE_HOURS, rankFacilities, travelMinutes } from './reference';

describe('pilot measures come from the records', () => {
  it('counts referrals, results and turnaround against the baseline', () => {
    const s = seedState();
    const m = pilotMeasures(s, s.now);
    expect(m.referrals).toBeGreaterThan(0);
    expect(m.resultsDelivered).toBeGreaterThan(0);
    expect(m.medianHours).not.toBeNull();
    expect(m.reduction).toBe(Math.round((1 - m.medianHours! / MANUAL_BASELINE_HOURS) * 100));
    expect(m.arrivalsConfirmed).toBeLessThanOrEqual(m.arrivalsDue);
    /* Doctor visits and personal bookings never count as referrals. */
    expect(s.appointments.filter(a => a.kind === 'Consultation').every(a => turnaroundHours(a) === null)).toBe(true);
  });
});

describe('the audit log', () => {
  it('lists every status written, newest first, and access checks', () => {
    let s = seedState();
    const trailCount = s.appointments.reduce((n, a) => n + a.trail.length, 0);
    s = reducer(s, { type: 'audit', entry: { at: s.now, actor: 'J. Bacarro', facility: RHU, patientId: 'PH-4409-1182', action: 'History viewed' } });
    const rows = auditRows(s);
    expect(rows).toHaveLength(trailCount + s.audit.length);
    expect(rows.some(r => r.kind === 'Access' && r.what === 'Viewed patient history')).toBe(true);
    rows.slice(1).forEach((r, i) => expect(r.at).toBeLessThanOrEqual(rows[i].at));
  });
});

describe('reported issues and plans', () => {
  it('a report arrives open and is closed with a reply', () => {
    let s = seedState();
    const before = s.issues.length;
    s = reducer(s, { type: 'reportIssue', issue: { facility: RHU, by: 'J. Bacarro', topic: 'Other', text: 'Test.' } });
    expect(s.issues).toHaveLength(before + 1);
    const id = s.issues[0].id;
    expect(s.issues[0].status).toBe('Open');
    s = reducer(s, { type: 'resolveIssue', id, resolution: 'Done.' });
    expect(s.issues.find(i => i.id === id)).toMatchObject({ status: 'Resolved', resolution: 'Done.' });
  });

  it('counts a facility’s active patients', () => {
    const s = seedState();
    expect(activePatients(s, RHU, s.now)).toBeGreaterThan(0);
  });
});

describe('recommendations stay fair; Premium+ only adds information', () => {
  it('ranks by tests offered, then distance — never by plan', () => {
    const ranked = rankFacilities(['CBC', 'Urinalysis']);
    for (let i = 1; i < ranked.length; i++) {
      const a = ranked[i - 1], b = ranked[i];
      if (a.full === b.full && a.have === b.have) expect(travelMinutes(a.travel)).toBeLessThanOrEqual(travelMinutes(b.travel));
      else expect(a.full && !b.full || a.have >= b.have).toBe(true);
    }
  });

  it('gives each laboratory a track record from its own referrals', () => {
    const s = seedState();
    const r = labTrackRecord(s, 'Loon Heritage Clinical Lab', s.now);
    expect(r.decided).toBeGreaterThan(0);
    expect(r.rate).toBeGreaterThan(0);
    expect(r.rate).toBeLessThanOrEqual(1);
  });
});
