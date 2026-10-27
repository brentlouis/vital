import { Undo2 } from 'lucide-react';
import { Icon } from './ui';
import { fmt, type Minute } from '../domain/time';
import type { EventStatus } from '../domain/types';

/* What the person just did, in their own words, for the undo row. */
const TOOK: Partial<Record<EventStatus, string>> = {
  Received: 'You marked this received',
  Accepted: 'You accepted this',
  'Patient arrived': 'You marked the patient arrived',
  Completed: 'You acknowledged this result',
};

/* A receipt for the step just taken, with a small Undo beside it. It sits under the status
   buttons, set apart by a hairline: a quiet correction, not a next step. */
export function UndoRow({ status, at, onUndo, visit }: { status: EventStatus; at: Minute; onUndo: () => void; visit?: boolean }) {
  const took = visit && status === 'Completed' ? 'You marked this seen by the doctor' : TOOK[status];
  return (
    <div className="undo">
      <div className="undo__text">
        <span>{took ?? `You recorded ${status}`} at <span className="tabular">{fmt(at)}</span></span>
        <span className="undo__hint">Undo available for 15 minutes</span>
      </div>
      <button type="button" className="btn btn--chip" aria-label={`Undo ${status}`} onClick={onUndo}>
        <Icon icon={Undo2} size={16} />Undo
      </button>
    </div>
  );
}
