import { SyncStatus } from '../../../components/SyncStatus';
import { FilePlus, Users } from 'lucide-react';
import { Button, Chip, Icon, Segmented, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { QUEUE_TABS, type Direction, type Rhu } from '../useRhu';
import { WorkList } from '../../../components/WorkList';
import { RhuDetail } from './RhuDetail';

/* R1 + R3–R6 side by side on a wide screen: the referrals as a list, the chosen one beside it. */
export function RhuWorkspace({ rhu }: { rhu: Rhu }) {
  const rows = rhu.buckets[rhu.filter];
  const current = rows.find(r => r.id === rhu.selected?.id && rhu.access(r) !== 'denied') ?? rows.find(r => rhu.access(r) !== 'denied') ?? null;
  return (
    <div className="workspace">
      <div className="page-head workspace__head">
        <h1 className="page-title">Appointment queue</h1>
        {rhu.merged && (
          <Segmented<Direction> label="Show" value={rhu.direction} onChange={rhu.setDirection}
            items={[
              { id: 'Outgoing', label: 'Referrals sent', count: rhu.outgoing.length },
              { id: 'Incoming', label: 'Doctor visits', count: rhu.incoming.length },
            ]} />
        )}
        <div className="page-head__actions">
          <SyncStatus now={rhu.now} />
          <Button size="md" icon={FilePlus} onClick={() => rhu.setScreen('new')}>New appointment</Button>
        </div>
      </div>
      <div className="workspace__filters">
        <Tabs label="Queue filter" value={rhu.filter} onChange={rhu.setFilter}
          items={QUEUE_TABS.map(t => ({ id: t, label: t, count: rhu.buckets[t].length }))} />
      </div>
      <section className="workspace__list" aria-label="Queue">
        <WorkList rows={rows} selectedId={current?.id ?? null} onSelect={rhu.openDetail}
          name={r => (rhu.access(r) === 'denied' ? <span className="muted">Access withdrawn</span> : r.patient)}
          line={r => <>{rhu.access(r) === 'full' ? r.test : 'Withdrawn'} · <span className="tabular">{r.scheduledAt}</span></>}
          from={r => (r.visit ? 'Booked by the patient' : r.lab)}
          empty={<><span className="empty__title">Nothing here.</span><span className="empty__body">{rhu.direction === 'Incoming' ? 'Doctor visits patients book with this health centre appear here.' : 'Appointments you send appear here as the laboratory updates them.'}</span></>} />
      </section>
      <section className="workspace__detail" aria-label="Selected appointment">
        {current
          ? <RhuDetail rhu={rhu} sel={current} embedded />
          : <div className="worklist__empty"><span className="empty__title">Choose an appointment</span><span className="empty__body">Its details appear here.</span></div>}
      </section>
    </div>
  );
}

/* R1 — every appointment this health centre has sent, grouped by what it needs from here. */
export function RhuQueue({ rhu }: { rhu: Rhu }) {
  const rows = rhu.buckets[rhu.filter];
  const { caps } = rhu;
  const capabilityLine = caps.canRefer && caps.canReceive
    ? 'Refers out and receives'
    : caps.canRefer ? 'Refers out only' : 'Receives appointments';

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Appointment queue</h1>
        <span className="muted tabular">{rows.length} {rows.length === 1 ? 'appointment' : 'appointments'}</span>
        <Chip>{caps.type} · {capabilityLine}</Chip>
        <div className="page-head__actions">
          <SyncStatus now={rhu.now} />
          <Button size="md" icon={FilePlus} onClick={() => rhu.setScreen('new')}>New appointment</Button>
        </div>
      </div>

      {rhu.merged && (
        <Segmented<Direction> label="Show" value={rhu.direction} onChange={rhu.setDirection}
          items={[
            { id: 'Outgoing', label: 'Referrals sent', count: rhu.outgoing.length },
            { id: 'Incoming', label: 'Doctor visits', count: rhu.incoming.length },
          ]} />
      )}
      <Tabs label="Queue filter" value={rhu.filter} onChange={rhu.setFilter}
        items={QUEUE_TABS.map(t => ({ id: t, label: t, count: rhu.buckets[t].length }))} />

      <div className="table-card">
        <table className="queue">
          <colgroup>
            <col style={{ width: 170 }} /><col style={{ width: '18%' }} /><col style={{ width: '24%' }} />
            <col style={{ width: '18%' }} /><col style={{ width: 150 }} /><col style={{ width: 140 }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Patient name</th>
              <th scope="col">Receiving laboratory</th>
              <th scope="col">Test requested</th>
              <th scope="col">Scheduled</th>
              <th scope="col" className="num">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const open = () => rhu.openDetail(r.id);
              return (
                <tr key={r.id} onClick={open} className={`queue__row accent--${STATUS_META[r.status].accent}`}>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="queue__patient">
                    <button type="button" className="row-link" onClick={e => { e.stopPropagation(); open(); }}>
                      {rhu.access(r) === 'denied' ? <span className="muted">Access withdrawn</span> : r.patient}
                    </button>
                  </td>
                  <td>{r.lab}</td>
                  <td>{rhu.access(r) === 'full' ? r.test : <span className="muted">Withdrawn</span>}</td>
                  <td className="tabular nowrap">{r.scheduledAt}</td>
                  <td className="num muted tabular nowrap">{r.updated}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            <span className="empty__title">No appointments in this view.</span>
            <span className="empty__body">Appointments you send appear here as the laboratory updates them.</span>
          </div>
        )}
      </div>
      <p className="footnote">Synthetic records. Never place real patient data in a prototype.</p>
    </div>
  );
}

/* R7 — patient search. Cross-facility identity matching is still an open decision. */
export function PatientSearch({ rhu }: { rhu: Rhu }) {
  return (
    <div className="search">
      <h1 className="page-title page-title--spaced">Patient search</h1>
      <div className="search__bar">
        <input className="input input--grow" value={rhu.query} onChange={e => rhu.setQuery(e.target.value)}
          placeholder="Surname, given name or patient ID" aria-label="Search patients" />
      </div>
      <div className="note-panel">
        <span className="note-panel__icon"><Icon icon={Users} /></span>
        <span>Matching across facilities is not decided yet. These results come from records this health centre has seen. A match found at another facility will need the patient to confirm identity before their record opens — the mechanism is still open.</span>
      </div>
      <div className="table-card">
        <table className="queue">
          <colgroup>
            <col style={{ width: '28%' }} /><col style={{ width: 150 }} /><col style={{ width: 80 }} />
            <col style={{ width: '18%' }} /><col /><col style={{ width: 130 }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Patient name</th>
              <th scope="col">Patient ID</th>
              <th scope="col">Age</th>
              <th scope="col">Municipality</th>
              <th scope="col">Appointments here</th>
              <th scope="col" className="num">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rhu.people.map(p => (
              <tr key={p.id} className="queue__row" onClick={() => p.latest && rhu.openDetail(p.latest)}>
                <td className="queue__patient">
                  <button type="button" className="row-link" onClick={e => { e.stopPropagation(); if (p.latest) rhu.openDetail(p.latest); }}>
                    {p.name}
                  </button>
                  {!p.consent && <span className="muted"> · consent withdrawn</span>}
                </td>
                <td className="tabular">{p.id}</td>
                <td className="tabular">{p.age}</td>
                <td>{p.municipality}</td>
                <td className="tabular">{p.count}</td>
                <td className="num muted tabular nowrap">{p.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rhu.people.length === 0 && (
          <div className="empty">
            <span className="empty__title">No patient matches that search.</span>
            <span className="empty__body">Check the spelling of the surname, or create the appointment with a new patient record.</span>
          </div>
        )}
      </div>
    </div>
  );
}
