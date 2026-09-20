import {
  CalendarClock, Check, CheckCheck, CircleX, Inbox, OctagonAlert, Upload, UserCheck, UserX, type LucideIcon,
} from 'lucide-react';
import type { EventStatus } from '../domain/types';
import type { Appointment } from '../domain/view';

/* How each step of the flow appears as a button on a staff portal (brief §6.2). Which steps
   appear is never decided here — that is flow.ts. This only says what they look like. */
export interface StepUi {
  label: string;
  icon: LucideIcon;
  variant: 'primary' | 'outline' | 'danger-outline';
  /** Opens a screen instead of writing straight away. */
  opens?: 'upload' | 'propose';
  /** Destructive steps confirm first, naming the consequence. */
  confirm?: (a: Appointment, told: string) => { title: string; body: string; action: string; cancel: string; note?: string };
  /** Safe to offer as a one-tap button on a queue row. */
  quick?: boolean;
}

export const STEP_UI: Partial<Record<EventStatus, StepUi>> = {
  Received: { label: 'Mark as received', icon: Inbox, variant: 'primary', quick: true },
  Accepted: { label: 'Accept appointment', icon: Check, variant: 'primary', quick: true },
  'Reschedule proposed': { label: 'Propose new time', icon: CalendarClock, variant: 'outline', opens: 'propose' },
  'Patient arrived': { label: 'Mark patient arrived', icon: UserCheck, variant: 'primary', quick: true },
  Endorsed: { label: 'Upload result', icon: Upload, variant: 'primary', opens: 'upload' },
  Completed: { label: 'Acknowledge result', icon: CheckCheck, variant: 'primary', quick: true },
  Declined: {
    label: 'Decline appointment', icon: CircleX, variant: 'danger-outline',
    confirm: (a, told) => {
      const expired = a.respondMinsLeft !== null && a.respondMinsLeft <= 0;
      return {
        title: 'Decline this appointment?',
        body: expired
          ? `The patient did not answer the proposed time within 48 hours. ${told} This closes the appointment — it cannot be reopened. Your name is written to the status trail.`
          : `${a.patient} will not be tested here. ${told} This closes the appointment — it cannot be reopened. Your name is written to the status trail.`,
        action: 'Decline appointment', cancel: 'Keep the appointment',
        note: expired
          ? 'No response to proposed time.'
          : 'This laboratory cannot perform the test for this patient at present. Refer the patient to another partner laboratory.',
      };
    },
  },
  'No-show': {
    label: 'Patient did not arrive', icon: UserX, variant: 'danger-outline',
    confirm: (a, told) => ({
      title: 'Mark the patient as not arrived?',
      body: `This records that ${a.patient} did not arrive for the ${a.scheduledAt} slot. The appointment closes and no result can be attached. ${told} Your name is written to the status trail.`,
      action: 'Patient did not arrive', cancel: 'Keep waiting',
    }),
  },
  'Result voided': {
    label: 'Void result', icon: OctagonAlert, variant: 'danger-outline',
    confirm: (_a, told) => ({
      title: 'Void this result?',
      body: `The document stays in the record, marked voided, and remains readable to the audit log. ${told} The appointment returns to patient arrived so the correct result can be uploaded.`,
      action: 'Void result', cancel: 'Keep the result', note: 'attached to the wrong patient',
    }),
  },
};

const ORDER: StepUi['variant'][] = ['primary', 'outline', 'danger-outline'];
export function byVariant(a: { ui: StepUi }, b: { ui: StepUi }) {
  return ORDER.indexOf(a.ui.variant) - ORDER.indexOf(b.ui.variant);
}

/* Who hears about a step: whoever ordered the test, and always the patient. */
export function toldLine(a: Appointment, actingFacility: string): string {
  const orderer = a.origin === 'Personal' ? null : a.fromFacility;
  return orderer && orderer !== actingFacility ? `${orderer} and the patient are told.` : 'The patient is told.';
}
