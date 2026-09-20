/* Reference data — synthetic. Invented people, real Bohol geography. None of this changes
   while the demo runs; appointments, consents and notifications live in the store. */

import { at, dayIndex, fmtSlot, type Minute } from './time';

export const RHU = 'Loon Rural Health Unit';

export interface Capabilities {
  type: string;
  canRefer: boolean;
  canReceive: boolean;
}

/* Capability flags decide behaviour. Type is a display and licensing label only: a clinic
   may refer out, receive, or both. */
export const CAPABILITIES: Record<string, Capabilities> = {
  'Loon Rural Health Unit':       { type: 'RHU / health centre',   canRefer: true,  canReceive: false },
  'Tagbilaran Diagnostic Center': { type: 'Clinic',                canRefer: true,  canReceive: true  },
  'Dauis Bayview Laboratory':     { type: 'Standalone laboratory', canRefer: false, canReceive: true  },
  'Baclayon Parish Diagnostics':  { type: 'Clinic',                canRefer: false, canReceive: true  },
  'Panglao Island Medical Lab':   { type: 'Standalone laboratory', canRefer: false, canReceive: true  },
  'Loon Heritage Clinical Lab':   { type: 'Standalone laboratory', canRefer: false, canReceive: true  },
  'Loboc Riverside Laboratory':   { type: 'Standalone laboratory', canRefer: false, canReceive: true  },
};
export function capabilitiesOf(name: string): Capabilities {
  return CAPABILITIES[name] || { type: 'Standalone laboratory', canRefer: false, canReceive: true };
}

/* Staff accounts. A user belongs to exactly one facility; there is no cross-facility login.
   The first person listed is who is signed in when the demo opens. */
export type StaffRole = 'Facility admin' | 'Staff' | 'Read-only';
export interface StaffMember { name: string; title: string; role: StaffRole; email: string }

export const STAFF: Record<string, StaffMember[]> = {
  'Loon Rural Health Unit': [
    { name: 'J. Bacarro', title: 'Midwife', role: 'Facility admin', email: 'jbacarro@loonrhu.gov.ph' },
  ],
  'Tagbilaran Diagnostic Center': [
    { name: 'R. Piezas', title: 'Medical technologist', role: 'Facility admin', email: 'rpiezas@tagbilarandiagnostic.ph' },
  ],
  'Dauis Bayview Laboratory': [
    { name: 'C. Olaivar', title: 'Medical technologist', role: 'Facility admin', email: 'colaivar@dauisbayview.ph' },
  ],
  'Panglao Island Medical Lab': [
    { name: 'M. Sumampong', title: 'Medical technologist', role: 'Facility admin', email: 'msumampong@panglaomedlab.ph' },
  ],
  'Loon Heritage Clinical Lab': [
    { name: 'E. Bughao', title: 'Medical technologist', role: 'Facility admin', email: 'ebughao@loonheritagelab.ph' },
    { name: 'M. Cabahug', title: 'Medical technologist', role: 'Staff', email: 'mcabahug@loonheritagelab.ph' },
    { name: 'T. Salgarino', title: 'Medical technologist', role: 'Staff', email: 'tsalgarino@loonheritagelab.ph' },
    { name: 'L. Gantuangco', title: 'Records clerk', role: 'Read-only', email: 'lgantuangco@loonheritagelab.ph' },
  ],
  'Baclayon Parish Diagnostics': [
    { name: 'N. Talisic', title: 'Medical technologist', role: 'Facility admin', email: 'ntalisic@baclayondx.ph' },
  ],
  'Loboc Riverside Laboratory': [
    { name: 'V. Auxtero', title: 'Medical technologist', role: 'Facility admin', email: 'vauxtero@lobocriverside.ph' },
  ],
};
export function staffOf(facility: string): StaffMember[] { return STAFF[facility] || []; }
export function defaultStaff(facility: string): StaffMember { return staffOf(facility)[0]; }
export function findStaff(facility: string, name: string): StaffMember | undefined {
  return staffOf(facility).find(s => s.name === name);
}

/* Email domain → facility, for sign-in (S1). */
export const EMAIL_DOMAINS: Record<string, string> = {
  'loonheritagelab.ph': 'Loon Heritage Clinical Lab',
  'loonrhu.gov.ph': 'Loon Rural Health Unit',
  'tagbilarandiagnostic.ph': 'Tagbilaran Diagnostic Center',
};
export function portalFor(facility: string): '/rhu' | '/lab' {
  return capabilitiesOf(facility).canReceive ? '/lab' : '/rhu';
}

/* Whether a test typically needs a provider decision. The binding rule is per facility
   (referralTests below), declared by the facility at registration. */
export const TEST_META = [
  { name: 'CBC', long: 'Complete blood count', needsReferral: false },
  { name: 'Fasting blood sugar', long: 'Fasting blood sugar', needsReferral: false },
  { name: 'Urinalysis', long: 'Urinalysis', needsReferral: false },
  { name: 'Chest X-ray', long: 'Chest X-ray', needsReferral: true },
  { name: 'Rabies vaccination', long: 'Rabies vaccination', needsReferral: false },
  { name: 'Lipid profile', long: 'Lipid profile', needsReferral: false },
  { name: 'Sputum smear', long: 'Sputum smear', needsReferral: true },
  { name: 'Pregnancy test', long: 'Pregnancy test', needsReferral: false },
];
export const TESTS = TEST_META.map(t => t.name);

/* Test coverage per facility, plus disclosed subscription tier (brief §3). */
export interface Facility {
  name: string;
  municipality: string;
  travel: string;
  partner: boolean;
  coverage: string[];
  referralTests: string[];
}

export const FACILITIES: Facility[] = [
  { name: 'Tagbilaran Diagnostic Center', municipality: 'Tagbilaran', travel: '35 min by van', partner: true,
    coverage: ['CBC', 'Fasting blood sugar', 'Urinalysis', 'Chest X-ray', 'Lipid profile', 'Sputum smear', 'Pregnancy test'],
    referralTests: ['Chest X-ray', 'Sputum smear'] },
  { name: 'Dauis Bayview Laboratory', municipality: 'Dauis', travel: '40 min by van', partner: false,
    coverage: ['CBC', 'Fasting blood sugar', 'Urinalysis', 'Chest X-ray', 'Lipid profile'],
    referralTests: ['Chest X-ray'] },
  { name: 'Baclayon Parish Diagnostics', municipality: 'Baclayon', travel: '50 min by van', partner: false,
    coverage: ['CBC', 'Urinalysis', 'Chest X-ray', 'Sputum smear'],
    referralTests: ['Sputum smear'] },
  { name: 'Panglao Island Medical Lab', municipality: 'Panglao', travel: '1 hr 5 min by van', partner: true,
    coverage: ['CBC', 'Fasting blood sugar', 'Urinalysis', 'Rabies vaccination', 'Pregnancy test'],
    referralTests: [] },
  { name: 'Loon Heritage Clinical Lab', municipality: 'Loon', travel: '10 min on foot', partner: false,
    coverage: ['CBC', 'Fasting blood sugar', 'Urinalysis', 'Pregnancy test'],
    referralTests: [] },
  { name: 'Loboc Riverside Laboratory', municipality: 'Loboc', travel: '1 hr 20 min by van', partner: true,
    coverage: ['Fasting blood sugar', 'Urinalysis', 'Rabies vaccination'],
    referralTests: [] },
];
export function facility(name: string): Facility | undefined { return FACILITIES.find(f => f.name === name); }

/* Each receiving facility publishes its own schedule for the next three days: times for day
   1, 2 and 3 after today. This is the single source of slot data — L6 renders it, and P7, R2
   and L9 may only offer slots drawn from it. Static pattern, no capacity engine (brief §1.3). */
const PATTERN: Record<string, [string[], string[], string[]]> = {
  'Tagbilaran Diagnostic Center': [['07:30', '08:00', '09:30', '13:00', '14:30'], ['07:30', '10:00', '11:00', '15:00'], ['08:30', '09:00', '13:30']],
  'Dauis Bayview Laboratory':     [['08:00', '09:00', '10:30'], ['08:00', '13:30', '14:00'], ['09:30', '11:00']],
  'Baclayon Parish Diagnostics':  [[], ['09:00', '10:00'], ['08:00', '08:30', '13:00']],
  'Panglao Island Medical Lab':   [['08:30', '11:30'], ['07:00', '09:30', '14:00', '15:30'], ['10:00', '13:00']],
  'Loon Heritage Clinical Lab':   [['07:00', '07:30', '08:00', '10:00'], ['07:00', '08:30', '13:00'], ['07:30', '09:00', '14:00']],
  'Loboc Riverside Laboratory':   [[], ['09:00', '13:30'], ['08:00', '10:30', '15:00']],
};

export interface PublishedDay { day: Minute; slots: Minute[] }

/** The days and slot minutes a facility publishes, counted from the clock's current day. */
export function publishedDays(name: string, now: Minute): PublishedDay[] {
  const pattern = PATTERN[name];
  if (!pattern) return [];
  const today = dayIndex(now);
  return pattern
    .map((times, i) => ({ day: at(today + i + 1, '00:00'), slots: times.map(t => at(today + i + 1, t)) }))
    .filter(d => d.slots.length > 0);
}
export function publishedSlots(name: string, now: Minute): Minute[] {
  return publishedDays(name, now).flatMap(d => d.slots);
}
export { fmtSlot };

export interface Person {
  name: string;
  id: string;
  age: number;
  sex: 'F' | 'M';
  municipality: string;
  phone: string;
}

export const PEOPLE: Person[] = ([
  ['Abdon, Maricel', 'PH-4409-1182', 34, 'F', 'Loon', '+63 917 402 8815'],
  ['Bagatsing, Lorenzo', 'PH-3318-0924', 61, 'M', 'Tagbilaran', '+63 918 220 1147'],
  ['Cadapan, Reynaldo', 'PH-7712-4408', 58, 'M', 'Baclayon', '+63 906 553 0918'],
  ['Lumandas, Imelda', 'PH-1180-6631', 47, 'F', 'Dauis', '+63 917 118 6630'],
  ['Espuerta, Nolan', 'PH-6620-3390', 29, 'M', 'Panglao', '+63 995 662 3390'],
  ['Fuentebella, Rosalie', 'PH-2204-7751', 66, 'F', 'Loboc', '+63 918 220 7751'],
  ['Hinlo, Teofilo', 'PH-9931-2205', 72, 'M', 'Loon', '+63 917 993 2205'],
  ['Inting, Marivic', 'PH-5540-8817', 41, 'F', 'Tagbilaran', '+63 906 554 8817'],
  ['Jamisola, Ariel', 'PH-8812-0031', 36, 'M', 'Panglao', '+63 918 881 0031'],
  ['Kabiling, Perla', 'PH-3390-6614', 55, 'F', 'Baclayon', '+63 917 339 6614'],
  ['Labunog, Efren', 'PH-7743-2298', 63, 'M', 'Loboc', '+63 995 774 2298'],
  ['Magallanes, Cristina', 'PH-1129-5583', 38, 'F', 'Dauis', '+63 917 112 5583'],
  ['Nazareno, Bienvenido', 'PH-4471-9920', 70, 'M', 'Loon', '+63 906 447 9920'],
  ['Oclarit, Jasmin', 'PH-6638-1174', 26, 'F', 'Tagbilaran', '+63 918 663 1174'],
  ['Pagulayan, Rodel', 'PH-2285-4406', 49, 'M', 'Panglao', '+63 917 228 4406'],
  ['Quirante, Lorna', 'PH-9903-7718', 52, 'F', 'Loon', '+63 995 990 7718'],
  ['Racoma, Alfredo', 'PH-5517-3384', 68, 'M', 'Baclayon', '+63 906 551 3384'],
  ['Sarabia, Nenita', 'PH-1174-8829', 59, 'F', 'Loboc', '+63 917 117 8829'],
  ['Tirambulo, Glenda', 'PH-7796-2241', 44, 'F', 'Dauis', '+63 918 779 2241'],
  ['Umbao, Fidel', 'PH-3342-6650', 31, 'M', 'Loon', '+63 917 334 6650'],
  ['Valeroso, Marissa', 'PH-8829-1107', 37, 'F', 'Tagbilaran', '+63 995 882 1107'],
  ['Wenceslao, Dante', 'PH-4408-5573', 64, 'M', 'Panglao', '+63 906 440 5573'],
  ['Ybanez, Corazon', 'PH-6651-9938', 74, 'F', 'Baclayon', '+63 917 665 9938'],
  ['Zafra, Melchor', 'PH-2217-4485', 45, 'M', 'Loboc', '+63 918 221 4485'],
  ['Amodia, Felisa', 'PH-9938-3306', 57, 'F', 'Dauis', '+63 917 993 3306'],
  ['Boteros, Ruben', 'PH-5573-1129', 33, 'M', 'Loon', '+63 995 557 1129'],
  ['Casiple, Elvira', 'PH-1107-6642', 48, 'F', 'Tagbilaran', '+63 906 110 6642'],
  ['Dumaluan, Arnel', 'PH-7718-2295', 62, 'M', 'Panglao', '+63 917 771 2295'],
  ['Empuerto, Luzviminda', 'PH-3384-8816', 51, 'F', 'Baclayon', '+63 918 338 8816'],
  ['Garcia-Amper, Dina', 'PH-6614-4471', 39, 'F', 'Loboc', '+63 917 661 4471'],
] as const).map(([name, id, age, sex, municipality, phone]) => ({ name, id, age, sex, municipality, phone }));

export function person(id: string): Person {
  const p = PEOPLE.find(x => x.id === id);
  if (!p) throw new Error(`Unknown patient ${id}`);
  return p;
}

/** "Abdon, Maricel" → "Maricel Abdon" */
export function givenFirst(name: string): string {
  return name.split(', ').reverse().join(' ');
}

/* The patient whose phone the wallet demo runs on. */
export const WALLET_PATIENT = PEOPLE[0];

/* Patient-entered, never computed or interpreted by VITAL (brief §5). */
export const PROFILE = [
  { label: 'Age', value: '34 years', updated: '02 Feb 2026' },
  { label: 'Sex', value: 'Female', updated: '02 Feb 2026' },
  { label: 'Height', value: '1.55 m', updated: '02 Feb 2026' },
  { label: 'Weight', value: '58 kg', updated: '04 Aug 2026' },
  { label: 'Blood type', value: 'O+', updated: '02 Feb 2026' },
  { label: 'Allergies', value: 'Penicillin', updated: '11 Jun 2026' },
];

export interface RankedFacility extends Facility {
  missing: string[];
  referralOnly: string[];
  bookable: string[];
  blocked: boolean;
  full: boolean;
  have: number;
}

/* Two bands, tier orders within a band only — never across it (brief §3.2).
   A test is bookable at a facility when the facility offers it and does not require a
   referral for it. One or more bookable tests and the row books; zero and it is disabled.
   A referral requirement therefore never disables a row on its own. */
export function rankFacilities(selected: string[]): RankedFacility[] {
  const picked = selected || [];
  return FACILITIES
    .map(f => {
      const missing = picked.filter(t => !f.coverage.includes(t));
      const referralOnly = picked.filter(t => f.coverage.includes(t) && f.referralTests.includes(t));
      const bookable = picked.filter(t => f.coverage.includes(t) && !f.referralTests.includes(t));
      return {
        ...f, missing, referralOnly, bookable,
        blocked: picked.length > 0 && bookable.length === 0,
        full: missing.length === 0,
        have: picked.length - missing.length,
      };
    })
    .filter(f => picked.length === 0 || f.have > 0)
    .sort((a, b) =>
      (a.full === b.full ? 0 : a.full ? -1 : 1) ||
      (b.have - a.have) ||
      (a.partner === b.partner ? 0 : a.partner ? -1 : 1));
}
