import type { Minute } from './time';

/* Every status an event can write to the trail (brief §2.1). */
export type EventStatus =
  | 'Sent' | 'Booked' | 'Received' | 'Accepted' | 'Declined' | 'Reschedule proposed'
  | 'Patient arrived' | 'No-show' | 'Endorsed' | 'Completed' | 'Result voided' | 'Consent revoked';

/* Every status an appointment can show. Overdue is derived from the clock, never written
   (brief §2.2). */
export type Status = EventStatus | 'Overdue';

/* Referred: a provider books a test at another facility. Personal: the patient books it.
   Internal: a facility that refers and receives orders from its own laboratory. */
export type Origin = 'Referred' | 'Personal' | 'Internal';

export interface TrailEvent {
  status: EventStatus;
  at: Minute;
  actor: string;
  /** The actor's facility, or "Health wallet" for the patient. */
  facility: string;
  /** Why — a decline reason, what a void corrected. */
  note?: string;
  /** A slot this event proposes or agrees to. */
  slot?: Minute;
  /** This entry withdraws the step named in `status`, taken by mistake moments earlier by the
      same person. Both entries stay in the trail; the status is worked out as if the step had
      not been taken (brief §10.5). */
  withdraws?: true;
}

export interface Result {
  file: string;
  size: string;
  released: Minute;
  by: string;
  voidedAt?: Minute;
  voidedBy?: string;
  voidReason?: string;
}

/* The stored appointment. Status is never stored: it is the latest event in the trail. */
/* Who is seen first: an urgent clinical need, or the groups Philippine law gives priority
   lanes (senior citizens, persons with disability, pregnant women). */
export const PRIORITY_REASONS = ['Urgent clinical need', 'Senior citizen', 'Person with disability', 'Pregnant'] as const;
export type PriorityReason = typeof PRIORITY_REASONS[number];

export interface AppointmentRecord {
  id: string;
  patientId: string;
  origin: Origin;
  /** Which facility ordered it. Null when the patient booked it. */
  fromFacility: string | null;
  lab: string;
  tests: string[];
  note: string;
  /** Patient-entered, non-authoritative. Grants nothing. */
  referredBy: string | null;
  /** The slot currently booked. */
  slot: Minute;
  /** Requested tests left off because the receiving facility does not offer them. */
  notSent?: string[];
  /** Tests a patient asked for that this facility accepts only on a health-centre referral. */
  referralRequired?: string[];
  /** A doctor visit (a consultation) rather than a test. Closes when the doctor has seen the
      patient; it never carries a result document. Absent for tests. */
  kind?: 'Consultation';
  /** The doctor visit this appointment was ordered from, if any. */
  fromVisit?: string;
  /** Why the referring facility gave it priority: it goes to the top of the receiving queue.
      Set for the patient's sake only (clinical need or a priority-lane group), never by plan or
      payment. */
  priority?: PriorityReason;
  /** The patient (or referrer) let VITAL pick the time. The receiving facility then cannot set
      a time by hand: it accepts, or has VITAL pick again. */
  autoTime?: boolean;
  trail: TrailEvent[];
  /** Every result document ever released, voided ones included — never deleted. */
  results: Result[];
}

/* Someone looking at the system. Staff act for exactly one facility; a patient for themselves. */
export type Viewer =
  | { kind: 'staff'; facility: string; name: string; readOnly: boolean }
  | { kind: 'patient'; patientId: string; name: string };

/* A patient's standing permission for a referring facility to read the appointments and
   results it sends. Per-appointment access for the receiving facility is not stored: it is
   the appointment itself, and ends when the appointment closes or consent is revoked. */
export interface StandingGrant {
  patientId: string;
  facility: string;
  granted: Minute;
  revokedAt?: Minute;
}

export interface AuditEntry {
  at: Minute;
  actor: string;
  facility: string;
  patientId: string;
  action: 'Access denied' | 'History viewed';
}

/* The patient's earlier results and self-entered details, shared with one facility. Separate
   from appointment consent and off by default. Given at the counter with a referral (ends when
   that appointment closes) or from the wallet (until the patient stops it). */
export interface HistoryGrant {
  patientId: string;
  facility: string;
  granted: Minute;
  /** The appointment it was given with; null when given from the wallet. */
  appointmentId: string | null;
  /** Who recorded it: a staff member at the counter, or "Health wallet". */
  by: string;
  revokedAt?: Minute;
}

/* A problem a facility reports to the VITAL administrators. */
export interface Issue {
  id: string;
  facility: string;
  by: string;
  at: Minute;
  topic: 'Wrong or missing data' | 'Access or sign-in' | 'Something does not work' | 'Other';
  text: string;
  status: 'Open' | 'Resolved';
  resolvedAt?: Minute;
  resolution?: string;
}

export type RegistrationStatus = 'Pending' | 'Approved' | 'Rejected';
export interface Registration {
  reference: string;
  name: string; type: string; municipality: string; licence: string; submitted: Minute;
  address: string; admin: string; email: string; mobile: string;
  documents: { title: string; file: string; size: string; uploaded: Minute }[];
  status: RegistrationStatus;
  reason: string | null;
  decidedAt?: Minute;
}
