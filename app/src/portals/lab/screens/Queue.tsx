import { FilePlus } from 'lucide-react';
import { Button, Chip, OriginChip, Segmented, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { providerOf, sourceOf } from '../../../domain/view';
import { SyncStatus } from '../../../components/SyncStatus';
import { QUEUE_TABS, type Direction, type Lab } from '../useLab';
import { WorkList } from '../../../components/WorkList';
import { Detail } from './Detail';

/* L1 + L2 side by side on a wide screen: the queue as a list, the chosen appointment beside
   it with its actions. Staff work down the list without leaving it. */
export function LabWorkspace({ lab }: { lab: Lab }) {
  const { caps, merged, direction, filter, buckets, incoming, selected } = lab;
  const rows = buckets[filter];
  const current = rows.find(r => r.id === selected?.id) ?? rows[0] ?? null;
  const showingOutgoing = merged && direction === 'Outgoing';
  return (
    <div className="workspace">
      <div className="page-head workspace__head">
        <h1 className="page-title">{merged ? 'Appointment queue' : 'Incoming queue'}</h1>
        {merged ? (
          <Segmented<Direction> label="Show appointments" value={direction} onChange={lab.setDirection}
            items={lab.directions} />
        ) : (
          <span className="muted tabular">{incoming.length} appointments</span>
        )}
        <span className="page-head__end"><SyncStatus now={lab.now} /></span>
        {caps.canRefer && <Button size="md" icon={FilePlus} onClick={() => lab.setScreen('new')}>New appointment</Button>}
      </div>
      {/* Filters span both columns, so the list and the selected appointment start level. */}
      <div className="workspace__filters">
        <Tabs label="Status" value={filter} onChange={lab.setFilter}
          items={QUEUE_TABS.map(t => ({ id: t, label: t, count: buckets[t].length }))} />
      </div>
      <section className="workspace__list" aria-label="Queue">
        <WorkList rows={rows} selectedId={current?.id ?? null} onSelect={lab.openDetail}
          name={r => (lab.access(r) === 'withdrawn' ? <span className="muted">Details withdrawn</span> : r.patient)}
          line={r => <>{lab.access(r) === 'withdrawn' ? 'Withdrawn' : r.test} · <span className="tabular">{r.scheduledAt}</span></>}
          from={r => (showingOutgoing ? r.lab : sourceOf(r))}
          empty={<><span className="empty__title">Nothing here.</span><span className="empty__body">{showingOutgoing ? 'Appointments this facility refers out appear here.' : 'New appointments from partner facilities appear here.'}</span></>} />
      </section>
      <section className="workspace__detail" aria-label="Selected appointment">
        {current
          ? <Detail lab={lab} sel={current} embedded />
          : <div className="worklist__empty"><span className="empty__title">Choose an appointment</span><span className="empty__body">Its details and the next step appear here.</span></div>}
      </section>
    </div>
  );
}

/* L1 — incoming queue. One row per appointment; the row opens the detail, where every step
   is taken after reading the request. */
export function Queue({ lab }: { lab: Lab }) {
  const { caps, merged, direction, filter, buckets } = lab;
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
        {merged && (
          <Segmented<Direction> label="Show appointments" value={direction} onChange={lab.setDirection}
            items={lab.directions} />
        )}
        <span className="muted tabular">{rows.length} {rows.length === 1 ? 'appointment' : 'appointments'}</span>
        <Chip>{caps.type} · {capabilityLine}</Chip>
        <span className="page-head__end"><SyncStatus now={lab.now} /></span>
        {caps.canRefer && (
          <Button size="md" icon={FilePlus} onClick={() => lab.setScreen('new')}>New appointment</Button>
        )}
      </div>


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
            <col style={{ width: 130 }} />
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
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const open = () => lab.openDetail(r.id);
              return (
                <tr key={r.id} onClick={open} className={`queue__row accent--${STATUS_META[r.status].accent}`}>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="queue__patient">
                    <button type="button" className="row-link" onClick={e => { e.stopPropagation(); open(); }}>
                      {lab.access(r) === 'withdrawn' ? <span className="muted">Details withdrawn</span> : r.patient}
                    </button>
                    {r.priority && <span className="priority-chip queue__priority" title={r.priority}>Priority</span>}
                  </td>
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
