import type { KeyboardEvent } from 'react';
import { FilePlus, Users } from 'lucide-react';
import { Button, Chip, Icon, StatusBadge, Tabs } from '../../../components/ui';
import { STATUS_META } from '../../../domain/status';
import { QUEUE_TABS, type Direction, type Rhu } from '../useRhu';

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
          <Button size="md" icon={FilePlus} onClick={() => rhu.setScreen('new')}>New appointment</Button>
        </div>
      </div>

      {rhu.merged && (
        <Tabs<Direction>
          label="Direction" value={rhu.direction} onChange={rhu.setDirection}
          items={[
            { id: 'Outgoing', label: 'Outgoing', count: rhu.outgoing.length },
            { id: 'Incoming', label: 'Incoming', count: rhu.incoming.length },
          ]}
        />
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
              const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
              return (
                <tr key={r.id} tabIndex={0} role="button" onClick={open} onKeyDown={onKey}
                  className={`queue__row accent--${STATUS_META[r.status].accent}`}>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="queue__patient">{rhu.access(r) === 'denied' ? <span className="muted">Access withdrawn</span> : r.patient}</td>
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
              <tr key={p.id} className="queue__row" tabIndex={0} role="button"
                onClick={() => p.latest && rhu.openDetail(p.latest)}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && p.latest) { e.preventDefault(); rhu.openDetail(p.latest); } }}>
                <td className="queue__patient">{p.name}{!p.consent && <span className="muted"> · consent withdrawn</span>}</td>
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
