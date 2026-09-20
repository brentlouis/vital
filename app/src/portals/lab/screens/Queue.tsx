import type { KeyboardEvent } from 'react';
import { FilePlus } from 'lucide-react';
import { Button, Chip, OriginChip, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { providerOf } from '../../../domain/view';
import { QUEUE_TABS, type Direction, type Lab } from '../useLab';

/* L1 — incoming queue. One row per appointment; the row opens the detail, the button on
   the row takes the single next step without leaving the queue. */
export function Queue({ lab }: { lab: Lab }) {
  const { caps, merged, direction, filter, buckets, incoming, outgoing } = lab;
  const rows = buckets[filter];
  /* Outgoing rows were all referred by this facility, so the useful column is where they went. */
  const showingOutgoing = merged && direction === 'Outgoing';
  const title = merged ? 'Appointment queue' : 'Incoming queue';
  const capabilityLine = caps.canRefer && caps.canReceive
    ? 'Refers out and receives'
    : caps.canReceive ? 'Receives appointments' : 'Refers out only';

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
        <span className="muted tabular">{rows.length} {rows.length === 1 ? 'appointment' : 'appointments'}</span>
        <Chip>{caps.type} · {capabilityLine}</Chip>
        <span className="page-head__end">Updated 15 Sep · 09:41</span>
        {caps.canRefer && (
          <Button size="md" icon={FilePlus} onClick={() => lab.setScreen('new')}>New appointment</Button>
        )}
      </div>

      {merged && (
        <Tabs<Direction>
          label="Direction"
          value={direction}
          onChange={lab.setDirection}
          items={[
            { id: 'Incoming', label: 'Incoming', count: incoming.length },
            { id: 'Outgoing', label: 'Outgoing', count: outgoing.length },
          ]}
        />
      )}

      <Tabs
        label="Queue filter"
        value={filter}
        onChange={lab.setFilter}
        items={QUEUE_TABS.map(t => ({ id: t, label: t, count: buckets[t].length }))}
      />

      <div className="table-card">
        <table className="queue">
          <colgroup>
            <col style={{ width: 170 }} /><col style={{ width: '18%' }} /><col style={{ width: 112 }} />
            <col style={{ width: '18%' }} /><col style={{ width: '16%' }} /><col style={{ width: 140 }} />
            <col style={{ width: 130 }} /><col style={{ width: 170 }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Patient name</th>
              <th scope="col">Origin</th>
              <th scope="col">{showingOutgoing ? 'Receiving laboratory' : 'Referring provider'}</th>
              <th scope="col">Test requested</th>
              <th scope="col">Scheduled</th>
              <th scope="col" className="num">Last updated</th>
              <th scope="col" className="num">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              /* The one-tap step for this row, if the flow allows one: the first quick step
                 the signed-in person may take. Everything else happens on the detail. */
              const quick = lab.actionsFor(r).find(x => x.ui.quick);
              const open = () => lab.openDetail(r.id);
              const onKey = (e: KeyboardEvent) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
              };
              return (
                <tr key={r.id} tabIndex={0} role="button" onClick={open} onKeyDown={onKey}
                  className={`queue__row accent--${STATUS_META[r.status].accent}`}>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="queue__patient">{lab.access(r) === 'withdrawn' ? <span className="muted">Details withdrawn</span> : r.patient}</td>
                  <td><OriginChip origin={r.origin} /></td>
                  <td>{showingOutgoing ? r.lab : providerOf(r)}</td>
                  <td>{lab.access(r) === 'withdrawn' ? <span className="muted">Withdrawn</span> : r.test}</td>
                  <td className="tabular nowrap">
                    {r.scheduledAt}
                    {r.status === 'Reschedule proposed' && r.respondCountdown && (
                      <span className="queue__respond">{r.respondCountdown}</span>
                    )}
                  </td>
                  <td className="num muted tabular nowrap">{r.updated}</td>
                  <td className="num queue__action">
                    {quick && (
                      <button type="button" className="btn btn--primary btn--sm"
                        onClick={e => { e.stopPropagation(); lab.run(r, quick); }}>
                        {quick.ui.label}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            <span className="empty__title">{showingOutgoing ? 'No outgoing appointments here.' : 'No incoming appointments.'}</span>
            <span className="empty__body">
              {showingOutgoing ? 'Appointments this facility refers out appear here.' : 'New appointments from partner facilities appear here.'}
            </span>
          </div>
        )}
      </div>
      <p className="footnote">Synthetic records. Never place real patient data in a prototype.</p>
    </div>
  );
}
