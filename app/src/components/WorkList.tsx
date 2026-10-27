import type { ReactNode } from 'react';
import { StatusBadge } from './ui';
import type { Appointment } from '../domain/view';

/* The list half of the split workspace: one entry per appointment, the selected one marked.
   Choosing an entry shows it beside the list, so staff work down the list without leaving
   it. Entries carry no buttons of their own: every step is taken on the selected appointment,
   where the request can be read first. */
export function WorkList({ rows, selectedId, onSelect, name, line, from, empty }: {
  rows: Appointment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The entry's title: the patient, or why it cannot be shown. */
  name: (r: Appointment) => ReactNode;
  /** One line under the name: test and time. */
  line: (r: Appointment) => ReactNode;
  /** Where it came from or went to, on its own line, cut short if it does not fit — so every
      entry is three lines however long the facility's name. */
  from: (r: Appointment) => string;
  empty: ReactNode;
}) {
  if (!rows.length) return <div className="worklist__empty">{empty}</div>;
  return (
    <ul className="worklist" aria-label="Appointments">
      {rows.map(r => {
        const on = r.id === selectedId;
        return (
          <li key={r.id} className={on ? 'worklist__item is-selected' : 'worklist__item'}>
            <button type="button" className="worklist__open" aria-current={on ? 'true' : undefined} onClick={() => onSelect(r.id)}>
              <span className="worklist__top">
                <span className="worklist__name">{name(r)}</span>
                {r.priority && <span className="priority-chip" title={r.priority}>Priority</span>}
                <StatusBadge status={r.status} />
              </span>
              <span className="worklist__line">{line(r)}</span>
              <span className="worklist__from" title={from(r)}>{from(r)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
