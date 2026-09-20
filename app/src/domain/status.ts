import {
  CalendarCheck, CalendarClock, Check, CheckCheck, CircleX, Clock, Inbox,
  OctagonAlert, Send, ShieldOff, Stamp, UserCheck, UserX, type LucideIcon,
} from 'lucide-react';
import type { Status } from './types';
import type { ResultView } from './view';

/* Status groups — DESIGN.md §6.1. Every badge carries an icon and a label; colour never
   carries state alone. */
export type StatusGroup = 'waiting' | 'progress' | 'done' | 'fail' | 'attention';

/* Which lab-queue tab a status sits under. */
export type Bucket = 'new' | 'accepted' | 'awaiting' | 'proposed' | 'completed';

export interface StatusMeta {
  icon: LucideIcon;
  group: StatusGroup;
  /** Queue rows in a failure or attention state take a 3px clay or amber left border. */
  accent: 'none' | 'clay' | 'amber';
  bucket: Bucket;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  Sent:                  { icon: Send,          group: 'waiting',   accent: 'none',  bucket: 'new' },
  Booked:                { icon: CalendarCheck, group: 'waiting',   accent: 'none',  bucket: 'new' },
  Received:              { icon: Inbox,         group: 'progress',  accent: 'none',  bucket: 'new' },
  Accepted:              { icon: Check,         group: 'progress',  accent: 'none',  bucket: 'accepted' },
  'Patient arrived':     { icon: UserCheck,     group: 'progress',  accent: 'none',  bucket: 'accepted' },
  Endorsed:              { icon: Stamp,         group: 'progress',  accent: 'none',  bucket: 'completed' },
  Completed:             { icon: CheckCheck,    group: 'done',      accent: 'none',  bucket: 'completed' },
  Declined:              { icon: CircleX,       group: 'fail',      accent: 'clay',  bucket: 'completed' },
  'No-show':             { icon: UserX,         group: 'attention', accent: 'amber', bucket: 'completed' },
  Overdue:               { icon: Clock,         group: 'attention', accent: 'amber', bucket: 'awaiting' },
  'Consent revoked':     { icon: ShieldOff,     group: 'attention', accent: 'amber', bucket: 'completed' },
  'Result voided':       { icon: OctagonAlert,  group: 'fail',      accent: 'clay',  bucket: 'accepted' },
  'Reschedule proposed': { icon: CalendarClock, group: 'attention', accent: 'amber', bucket: 'proposed' },
};

/* Status trail entries are tinted by meaning: clay for failure, amber for attention,
   forest for everything else. */
export function trailHue(status: Status): 'forest' | 'clay' | 'amber' {
  if (status === 'Declined' || status === 'Result voided') return 'clay';
  if (['Overdue', 'No-show', 'Consent revoked', 'Reschedule proposed'].includes(status)) return 'amber';
  return 'forest';
}

/* "148 KB · released 15 Sep · 09:12 by R. Piezas" */
export function resultMeta(r: ResultView): string {
  return `${r.size} · released ${r.released} by ${r.by}`;
}
