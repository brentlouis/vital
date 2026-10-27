import { describe, expect, it } from 'vitest';
import { estimateFor, suggestTime } from './estimate';
import type { AppointmentRecord } from './types';
import { at, toDate } from './time';

const base = (lab: string, tests: string[], arrived?: number): AppointmentRecord => ({
  id: 'T-1', patientId: 'PH-0001', origin: 'Referred', fromFacility: 'Loon Rural Health Unit', lab, tests,
  note: '', referredBy: null, slot: at(0, '10:00'), results: [],
  trail: [
    { status: 'Sent', at: -60, actor: 'a', facility: 'f', slot: at(0, '10:00') },
    { status: 'Received', at: -50, actor: 'a', facility: 'f' },
    { status: 'Accepted', at: -40, actor: 'a', facility: 'f' },
    ...(arrived !== undefined ? [{ status: 'Patient arrived' as const, at: arrived, actor: 'a', facility: 'f' }] : []),
  ],
});

describe('estimates', () => {
  it('shows a queue wait only at a busy facility', () => {
    const busy = estimateFor(base('Tagbilaran Diagnostic Center', ['CBC']), [], 0);
    const quiet = estimateFor(base('Loon Heritage Clinical Lab', ['CBC']), [], 0);
    expect(busy?.wait?.ahead).toBeGreaterThanOrEqual(2);
    expect(quiet?.wait).toBeUndefined();
    expect(quiet?.result).toBeDefined();
  });
  it('gives a wider range where there is less history', () => {
    const width = (lab: string) => { const r = estimateFor(base(lab, ['Lipid profile']), [], 0)!.result!; return r.to - r.from; };
    expect(width('Loboc Riverside Laboratory')).toBeGreaterThan(width('Panglao Island Medical Lab'));
  });
  it('lets the slowest test set the result time, and gives nothing before acceptance', () => {
    const slow = estimateFor(base('Dauis Bayview Laboratory', ['CBC', 'Lipid profile']), [], 0)!.result!;
    const fast = estimateFor(base('Dauis Bayview Laboratory', ['CBC']), [], 0)!.result!;
    expect(slow.to).toBeGreaterThan(fast.to);
    const sent = { ...base('Dauis Bayview Laboratory', ['CBC']), trail: base('Dauis Bayview Laboratory', ['CBC']).trail.slice(0, 1) };
    expect(estimateFor(sent, [], 0)).toBeNull();
  });
});

describe('suggestTime', () => {
  const tomorrow = at(1, '12:00');
  it('avoids the morning queue at a busy laboratory and gives a window', () => {
    const s = suggestTime('Tagbilaran Diagnostic Center', ['CBC'], tomorrow, [], 0)!;
    expect(toDate(s.slot).getHours()).toBeGreaterThanOrEqual(11);
    expect(s.window).toBeDefined();
  });
  it('puts a fasting test early at a quiet laboratory', () => {
    const s = suggestTime('Loboc Riverside Laboratory', ['Fasting blood sugar'], tomorrow, [], 0)!;
    expect(toDate(s.slot).getHours()).toBe(7);
    expect(s.window).toBeUndefined();
  });
  it('never offers the excluded time', () => {
    const first = suggestTime('Loboc Riverside Laboratory', ['CBC'], tomorrow, [], 0)!;
    expect(suggestTime('Loboc Riverside Laboratory', ['CBC'], tomorrow, [], 0, first.slot)!.slot).not.toBe(first.slot);
  });
});
