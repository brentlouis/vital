/* The demo's starting data, written as stories: each appointment is the events that happened
   to it, in order. Actors, timestamps' facilities and result documents are filled in from the
   flow table, so a story cannot name the wrong person. No record is re-pointed or borrowed —
   every portal shows these same records. flow.test.ts replays every story against the rules. */

import { RHU, PEOPLE, WALLET_PATIENT, defaultStaff, givenFirst, person } from './reference';
import { START, STEPS, shownStatus, type Role } from './flow';
import { at, type Minute } from './time';
import type {
  AppointmentRecord, EventStatus, Origin, Registration, Result, StandingGrant, TrailEvent,
} from './types';

const TDC = 'Tagbilaran Diagnostic Center';
const LH = 'Loon Heritage Clinical Lab';
const DBL = 'Dauis Bayview Laboratory';
const BPD = 'Baclayon Parish Diagnostics';
const PIM = 'Panglao Island Medical Lab';
const LRL = 'Loboc Riverside Laboratory';

/* One event in a story: [status, minute, extra]. `+n` minutes relative to the slot is
   written as slot + n where it matters. */
type Beat = [EventStatus, Minute, { note?: string; slot?: Minute }?];

interface Story {
  id: string;
  patient: number;
  origin: Origin;
  from?: string;
  lab: string;
  tests: string[];
  note: string;
  referredBy?: string;
  slot: Minute;
  beats: Beat[];
}

/* Which role wrote each event: the start event's writer for the first, otherwise the only
   role the table allows for that step from the status before it. */
export function roleForEvent(a: AppointmentRecord, i: number): Role {
  if (i === 0) return START[a.origin].by;
  const before: AppointmentRecord = { ...a, trail: a.trail.slice(0, i) };
  const shown = shownStatus(before, a.trail[i].at);
  const step = STEPS.find(s => s.to === a.trail[i].status && s.from.includes(shown));
  if (!step) throw new Error(`${a.id}: no rule for ${a.trail[i].status} after ${shown}`);
  return step.by;
}

export function actorFor(role: Role, a: Pick<AppointmentRecord, 'lab' | 'fromFacility' | 'patientId' | 'origin'>) {
  if (role === 'patient' || (role === 'orderer' && a.origin === 'Personal')) {
    return { actor: givenFirst(person(a.patientId).name), facility: 'Health wallet' };
  }
  const facility = role === 'receiver' ? a.lab : a.fromFacility!;
  return { actor: defaultStaff(facility).name, facility };
}

function build(s: Story): AppointmentRecord {
  const p = PEOPLE[s.patient];
  const rec: AppointmentRecord = {
    id: s.id, patientId: p.id, origin: s.origin,
    fromFacility: s.origin === 'Personal' ? null : (s.from ?? RHU),
    lab: s.lab, tests: s.tests, note: s.note, referredBy: s.referredBy ?? null,
    slot: s.slot, trail: [], results: [],
  };
  let n = 0;
  s.beats.forEach(([status, minute, extra], i) => {
    const ev: TrailEvent = { status, at: minute, actor: '', facility: '', ...extra };
    if (i === 0) ev.slot = s.slot;
    rec.trail.push(ev);
    const who = actorFor(roleForEvent(rec, i), rec);
    ev.actor = who.actor;
    ev.facility = who.facility;
    if (status === 'Accepted' && extra?.slot !== undefined) rec.slot = extra.slot;
    if (status === 'Endorsed') {
      n += 1;
      rec.results.push({
        file: `result-${s.id.replace('APT-', '')}${n > 1 ? `-${n}` : ''}.pdf`,
        size: n > 1 ? '152 KB' : '148 KB', released: minute, by: who.actor,
      });
    }
    if (status === 'Result voided') {
      const r: Result = rec.results[rec.results.length - 1];
      Object.assign(r, { voidedAt: minute, voidedBy: who.actor, voidReason: extra?.note ?? 'attached to the wrong patient' });
    }
  });
  return rec;
}

const WRONG = { note: 'attached to the wrong patient' };

const STORIES: Story[] = [
  /* ---------- Loon Heritage Clinical Lab — the standalone laboratory ---------- */
  { id: 'APT-401', patient: 6, origin: 'Referred', lab: LH, tests: ['Fasting blood sugar'],
    note: 'Known diabetic, no reading since March.', slot: at(1, '07:30'),
    beats: [['Sent', -50]] },
  { id: 'APT-402', patient: 19, origin: 'Referred', lab: LH, tests: ['CBC'],
    note: 'Fatigue for two months. Rule out anaemia.', slot: at(1, '08:00'),
    beats: [['Sent', -130]] },
  { id: 'APT-403', patient: 15, origin: 'Personal', lab: LH, tests: ['Pregnancy test'],
    note: 'Booked directly from the health wallet.', referredBy: 'Dr. Ofelia Carcallas, Loon district clinic',
    slot: at(1, '10:00'), beats: [['Booked', -240]] },
  { id: 'APT-404', patient: 25, origin: 'Referred', lab: LH, tests: ['Urinalysis'],
    note: 'Follow-up after antibiotic course.', slot: at(2, '08:30'),
    beats: [['Sent', -1000], ['Received', -900]] },
  { id: 'APT-405', patient: 12, origin: 'Referred', lab: LH, tests: ['CBC'],
    note: 'Pre-operative clearance.', slot: at(1, '07:00'),
    beats: [['Sent', -2000], ['Received', -1900], ['Accepted', -1880]] },
  { id: 'APT-406', patient: 17, origin: 'Referred', lab: LH, tests: ['Fasting blood sugar'],
    note: 'Known diabetic, quarterly monitoring.', slot: at(-1, '08:00'),
    beats: [['Sent', -4000], ['Received', -3900], ['Accepted', -3850]] },
  { id: 'APT-407', patient: 0, origin: 'Personal', lab: LH, tests: ['CBC'],
    note: 'Booked directly from the health wallet.', slot: at(-1, '07:30'),
    beats: [['Booked', -3000], ['Received', -2950], ['Accepted', -2940],
      ['Patient arrived', at(-1, '07:36')], ['Endorsed', -540]] },
  { id: 'APT-408', patient: 0, origin: 'Referred', lab: LH, tests: ['Urinalysis'],
    note: 'Dysuria, two days. Suspected urinary tract infection.', slot: at(-3, '08:00'),
    beats: [['Sent', -5800], ['Received', -5700], ['Accepted', -5690],
      ['Patient arrived', at(-3, '08:05')], ['Endorsed', -3000], ['Result voided', -2900, WRONG],
      ['Endorsed', -2700]] },
  { id: 'APT-409', patient: 9, origin: 'Referred', lab: LH, tests: ['Fasting blood sugar'],
    note: 'Gestational diabetes screening.', slot: at(-2, '09:00'),
    beats: [['Sent', -6000], ['Received', -5900], ['Accepted', -5880],
      ['Patient arrived', at(-2, '09:10')], ['Endorsed', at(-2, '14:00')], ['Completed', at(-1, '09:15')]] },
  { id: 'APT-410', patient: 2, origin: 'Referred', lab: LH, tests: ['Urinalysis'],
    note: 'Haematuria on urine dipstick.', slot: at(0, '08:00'),
    beats: [['Sent', -3000], ['Received', -2900], ['Accepted', -2880], ['Patient arrived', at(0, '08:06')]] },
  { id: 'APT-411', patient: 16, origin: 'Referred', lab: LH, tests: ['CBC'],
    note: 'Suspected recurrent infection.', slot: at(-3, '09:00'),
    beats: [['Sent', -7000], ['Received', -6900], ['Accepted', -6880], ['No-show', at(-3, '13:00')]] },
  { id: 'APT-412', patient: 8, origin: 'Referred', lab: LH, tests: ['CBC'],
    note: 'Routine screening.', slot: at(2, '07:00'),
    beats: [['Sent', -1500], ['Received', -1400], ['Consent revoked', -420]] },
  { id: 'APT-413', patient: 26, origin: 'Referred', lab: LH, tests: ['Urinalysis'],
    note: 'Dysuria with frequency.', slot: at(1, '08:30'),
    beats: [['Sent', -800], ['Received', -700],
      ['Declined', -600, { note: 'Urinalysis analyser down for service until 18 September. Refer the patient to another partner laboratory.' }]] },
  { id: 'APT-414', patient: 20, origin: 'Referred', lab: LH, tests: ['CBC'],
    note: 'Follow-up after iron supplementation.', slot: at(1, '07:30'),
    beats: [['Sent', -600], ['Received', -500], ['Reschedule proposed', -300, { slot: at(2, '08:30') }]] },
  { id: 'APT-415', patient: 27, origin: 'Referred', lab: LH, tests: ['Fasting blood sugar'],
    note: 'Diabetic foot ulcer, baseline glucose.', slot: at(-1, '09:00'),
    beats: [['Sent', -4500], ['Received', -4400], ['Accepted', -4390],
      ['Patient arrived', at(-1, '09:05')], ['Endorsed', at(-1, '12:20')], ['Result voided', -120, WRONG]] },

  /* ---------- Tagbilaran Diagnostic Center — a clinic that refers and receives ---------- */
  { id: 'APT-416', patient: 0, origin: 'Personal', lab: TDC, tests: ['CBC', 'Lipid profile'],
    note: 'Booked directly from the health wallet.', slot: at(1, '09:30'),
    beats: [['Booked', -1500], ['Received', -1400], ['Reschedule proposed', -120, { slot: at(2, '10:00') }]] },
  { id: 'APT-417', patient: 3, origin: 'Referred', lab: TDC, tests: ['Chest X-ray'],
    note: 'Persistent cough, three weeks. Rule out pulmonary tuberculosis.', slot: at(-4, '07:30'),
    beats: [['Sent', -7400], ['Received', -7300], ['Accepted', -7280]] },
  { id: 'APT-418', patient: 1, origin: 'Referred', lab: TDC, tests: ['Sputum smear'],
    note: 'Cough and night sweats.', slot: at(1, '08:00'),
    beats: [['Sent', -90]] },
  { id: 'APT-419', patient: 7, origin: 'Personal', lab: TDC, tests: ['Fasting blood sugar', 'Lipid profile'],
    note: 'Annual check, no provider decision needed.', slot: at(2, '07:30'),
    beats: [['Booked', -1300], ['Received', -1250]] },
  { id: 'APT-420', patient: 13, origin: 'Referred', lab: TDC, tests: ['CBC'],
    note: 'Pre-employment screening, barangay requirement.', slot: at(1, '13:00'),
    beats: [['Sent', -900], ['Received', -850], ['Accepted', -840]] },
  { id: 'APT-421', patient: 11, origin: 'Referred', lab: TDC, tests: ['Chest X-ray'],
    note: 'Chest pain, atypical. Imaging requested.', slot: at(-1, '09:30'),
    beats: [['Sent', -4000], ['Received', -3950], ['Accepted', -3940],
      ['Patient arrived', at(-1, '09:35')], ['Endorsed', at(-1, '13:40')]] },
  { id: 'APT-422', patient: 4, origin: 'Internal', from: TDC, lab: TDC, tests: ['Urinalysis'],
    note: 'Dysuria reported at this morning’s consult.', slot: at(1, '14:30'),
    beats: [['Accepted', -60]] },
  { id: 'APT-423', patient: 29, origin: 'Referred', lab: TDC, tests: ['Pregnancy test'],
    note: 'Amenorrhoea, eight weeks.', slot: at(-2, '08:00'),
    beats: [['Sent', -5000], ['Received', -4950], ['Accepted', -4940],
      ['Patient arrived', at(-2, '08:04')], ['Endorsed', at(-2, '10:00')], ['Completed', at(-2, '15:30')]] },
  /* Referred out by Tagbilaran to laboratories that run what it does not. */
  { id: 'APT-424', patient: 18, origin: 'Referred', from: TDC, lab: PIM, tests: ['Rabies vaccination'],
    note: 'Dog bite on the right hand. Rabies vaccine not stocked here.', slot: at(-1, '08:30'),
    beats: [['Sent', -3000], ['Received', -2900], ['Accepted', -2890],
      ['Patient arrived', at(-1, '08:35')], ['Endorsed', at(-1, '09:40')]] },
  { id: 'APT-425', patient: 24, origin: 'Referred', from: TDC, lab: LRL, tests: ['Fasting blood sugar'],
    note: 'Fasting glucose. Our analyser is down for service.', slot: at(2, '09:00'),
    beats: [['Sent', -150]] },
  { id: 'APT-426', patient: 22, origin: 'Referred', from: TDC, lab: LH, tests: ['Urinalysis'],
    note: 'Urinalysis. Analyser down for service.', slot: at(-3, '07:30'),
    beats: [['Sent', -6500], ['Received', -6400], ['Accepted', -6390],
      ['Patient arrived', at(-3, '07:40')], ['Endorsed', at(-3, '11:00')], ['Completed', at(-3, '16:10')]] },

  /* ---------- Loon RHU referrals to the other laboratories ---------- */
  { id: 'APT-427', patient: 0, origin: 'Referred', lab: PIM, tests: ['CBC'],
    note: 'Pallor and fatigue since July. Anaemia workup.', slot: at(1, '08:30'),
    beats: [['Sent', -1700], ['Received', -1650], ['Accepted', -1640]] },
  { id: 'APT-428', patient: 5, origin: 'Referred', lab: LRL, tests: ['Fasting blood sugar'],
    note: 'Known diabetic, no reading since March.', slot: at(-2, '09:00'),
    beats: [['Sent', -6200], ['Received', -6100], ['Accepted', -6090]] },
  { id: 'APT-429', patient: 10, origin: 'Referred', lab: BPD, tests: ['Urinalysis'],
    note: 'Follow-up after antibiotic course.', slot: at(2, '09:00'),
    beats: [['Sent', -1021], ['Received', -900]] },
  { id: 'APT-430', patient: 14, origin: 'Referred', lab: PIM, tests: ['Urinalysis'],
    note: 'Haematuria on urine dipstick.', slot: at(-4, '08:30'),
    beats: [['Sent', -8000], ['Received', -7900], ['Accepted', -7890],
      ['Patient arrived', at(-4, '08:40')], ['Endorsed', at(-4, '13:00')], ['Completed', at(-3, '08:20')]] },
  { id: 'APT-431', patient: 21, origin: 'Referred', lab: DBL, tests: ['Chest X-ray'],
    note: 'Cough with fever. Referring for plain film.', slot: at(1, '09:00'),
    beats: [['Sent', -1101], ['Received', -1000],
      ['Declined', -960, { note: 'Radiology unit closed for maintenance until 18 September. Your health centre has been told and will arrange another facility.' }]] },
  { id: 'APT-432', patient: 23, origin: 'Referred', lab: DBL, tests: ['Fasting blood sugar'],
    note: 'Routine glucose check.', slot: at(1, '08:00'),
    beats: [['Sent', -1400], ['Received', -1300], ['Reschedule proposed', -210, { slot: at(2, '13:30') }]] },
  { id: 'APT-433', patient: 28, origin: 'Referred', lab: BPD, tests: ['Sputum smear'],
    note: 'Cough and night sweats, three weeks.', slot: at(0, '08:30'),
    beats: [['Sent', -2900], ['Received', -2800], ['Accepted', -2790], ['Patient arrived', at(0, '08:40')]] },

  /* ---------- The wallet patient's history ---------- */
  { id: 'APT-434', patient: 0, origin: 'Personal', lab: TDC, tests: ['Pregnancy test'],
    note: 'Booked directly from the health wallet.', slot: at(-18, '09:00'),
    beats: [['Booked', at(-20, '19:12')], ['Received', at(-19, '08:10')], ['Accepted', at(-19, '08:12')],
      ['Patient arrived', at(-18, '09:02')], ['Endorsed', at(-18, '11:41')], ['Completed', at(-18, '15:09')]] },
];

export const SEED_APPOINTMENTS: AppointmentRecord[] = STORIES.map(build);

/* Standing grants: each referred patient allowed the facility that refers them to read what it
   sends. Ariel Jamisola withdrew his from the RHU along with APT-412, so the RHU is refused his
   record — the patient search shows access denied for him. */
export const SEED_GRANTS: StandingGrant[] = (() => {
  const out: StandingGrant[] = [];
  for (const a of SEED_APPOINTMENTS) {
    if (a.origin !== 'Referred' || !a.fromFacility) continue;
    if (out.some(g => g.patientId === a.patientId && g.facility === a.fromFacility)) continue;
    out.push({ patientId: a.patientId, facility: a.fromFacility, granted: a.trail[0].at });
  }
  const wallet = out.find(g => g.patientId === WALLET_PATIENT.id && g.facility === RHU);
  if (wallet) wallet.granted = at(-225, '09:14');
  const ariel = out.find(g => g.patientId === PEOPLE[8].id && g.facility === RHU);
  if (ariel) ariel.revokedAt = -420;
  return out;
})();

/* Facilities waiting for platform verification (A1). A registration submitted from facility
   onboarding (F2) joins this list. */
export const SEED_REGISTRATIONS: Registration[] = [
  { reference: 'REG-2026-0141', name: 'Cortes Community Diagnostics', type: 'Laboratory', municipality: 'Cortes',
    licence: 'LTO-BOH-2026-0881', submitted: at(-3, '14:02'),
    address: 'Barangay Poblacion, Cortes, Bohol', admin: 'Ronaldo Sarmiento', email: 'radmin@cortesdiagnostics.ph', mobile: '+63 918 551 0294',
    documents: [
      { title: 'LTO permit', file: 'lto-permit-0881.pdf', size: '412 KB', uploaded: at(-3, '14:02') },
      { title: 'Business permit', file: 'cortes-business-permit-2026.pdf', size: '265 KB', uploaded: at(-3, '14:03') },
    ], status: 'Pending', reason: null },
  { reference: 'REG-2026-0143', name: 'Antequera Rural Health Unit', type: 'Rural health unit', municipality: 'Antequera',
    licence: 'DOH-RHU-07-2211', submitted: at(-2, '08:36'),
    address: 'Municipal Health Office, Antequera, Bohol', admin: 'Evelyn Pahang', email: 'mho@antequera-rhu.gov.ph', mobile: '+63 917 228 7740',
    documents: [
      { title: 'DOH licence to operate', file: 'doh-rhu-2211.pdf', size: '520 KB', uploaded: at(-2, '08:36') },
      { title: 'Business permit', file: 'antequera-lgu-clearance.pdf', size: '198 KB', uploaded: at(-2, '08:41') },
    ], status: 'Pending', reason: null },
  { reference: 'REG-2026-0146', name: 'Maribojoc Family Clinic', type: 'Clinic', municipality: 'Maribojoc',
    licence: 'DOH-CLI-07-4490', submitted: at(-1, '11:19'),
    address: 'Barangay Punta Cruz, Maribojoc, Bohol', admin: 'Jose Ravanes', email: 'clinic@maribojocfamily.ph', mobile: '+63 995 118 3367',
    documents: [
      { title: 'DOH clinic licence', file: 'doh-cli-4490-scan.jpg', size: '1.2 MB', uploaded: at(-1, '11:19') },
      { title: 'Business permit', file: 'maribojoc-permit-2026.pdf', size: '241 KB', uploaded: at(-1, '11:20') },
    ], status: 'Pending', reason: null },
  { reference: 'REG-2026-0147', name: 'Calape Bayside Laboratory', type: 'Laboratory', municipality: 'Calape',
    licence: 'LTO-BOH-2026-0913', submitted: at(0, '07:54'),
    address: 'Barangay Tultugan, Calape, Bohol', admin: 'Nerissa Bantugan', email: 'admin@calapebayside.ph', mobile: '+63 906 774 2218',
    documents: [
      { title: 'LTO permit', file: 'lto-permit-0913.pdf', size: '388 KB', uploaded: at(0, '07:54') },
      { title: 'Business permit', file: 'calape-business-permit.pdf', size: '277 KB', uploaded: at(0, '07:55') },
    ], status: 'Pending', reason: null },
];

/* The next number each new appointment takes. */
export const FIRST_NEW_ID = 435;
