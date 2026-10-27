import { useState, type ReactNode } from 'react';
import { PROFILE, WALLET_PATIENT, givenFirst, plainTests } from '../../domain/reference';
import { isTerminal } from '../../domain/flow';
import type { Appointment } from '../../domain/view';
import { fmtDay, fmtMonth, fmtTime, type Minute } from '../../domain/time';
import { MBadge, MButton, MHead, Ms } from '../../components/Phone';
import { plain, skin, type ConsentLine, type Wallet } from './useWallet';

/* The five tabs of the wallet: Home, Appointments, Documents, Access and Details. Home is the
   notifications enlarged — only what needs the patient or is new. The other tabs hold the
   full lists, each with a search and a filter so a long history stays easy to find. */

/* ---------- Shared pieces ---------- */

function StatusPill({ r }: { r: Appointment }) {
  const p = plain(r.status, r.lab, false, r);
  return <MBadge glyph={p.glyph} tone={skin(r.status).tone}>{p.badge}</MBadge>;
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="msection">
      <div className="msection__head">
        <h2 className="mh2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* One appointment as a list entry, each detail on its own line — what, where, when, how it
   stands — so a long facility name never pushes the date around. */
function AppointmentRow({ r, onOpen }: { r: Appointment; onOpen: () => void; past?: boolean }) {
  return (
    <button type="button" className="mentry" onClick={onOpen}>
      <span className="mentry__text">
        <span className="mentry__title">{plainTests(r.record.tests)}</span>
        <span className="mentry__line" title={r.lab}>{r.lab}</span>
        <span className="mentry__line mentry__line--muted tabular">{fmtDay(r.slot)} · {fmtTime(r.slot)}</span>
        <StatusPill r={r} />
      </span>
      <Ms glyph="chevron_right" className="mentry__chev" />
    </button>
  );
}

type Doc = Wallet['documents'][number];

function DocumentRow({ d, onOpen }: { d: Doc; onOpen: () => void }) {
  return (
    <button type="button" className={d.voided ? 'mentry mentry--voided' : 'mentry'} onClick={onOpen}>
      <span className={d.voided ? 'mfile mfile--voided' : 'mfile'}><Ms glyph={d.voided ? 'report' : 'description'} /></span>
      <span className="mentry__text">
        <span className="mentry__title">{d.name}</span>
        <span className="mentry__line" title={d.facility}>{d.facility}</span>
        <span className="mentry__line mentry__line--muted tabular">{d.date}</span>
        {d.voided && <span className="mentry__warn">Withdrawn by the laboratory: it was attached to the wrong person. Kept so the correction is visible.</span>}
      </span>
      {d.isNew && !d.voided && <span className="mnew">New</span>}
      <Ms glyph="chevron_right" className="mentry__chev" />
    </button>
  );
}

/* A search field and a row of filter chips. Each chip shows how many entries it holds. */
function Filters<T extends string>({ id, query, onQuery, placeholder, options, value, onChange }: {
  id: string;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  options: { id: T; label: string; count: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mfilters">
      <label className="msearch" htmlFor={id}>
        <Ms glyph="search" size={20} />
        <input id={id} type="search" value={query} placeholder={placeholder} onChange={e => onQuery(e.target.value)} />
      </label>
      <div className="mchips" role="group" aria-label="Show">
        {options.map(o => (
          <button key={o.id} type="button" className="mfilter" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}<span className="mfilter__n tabular">{o.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const matches = (q: string, ...fields: string[]) => {
  const t = q.trim().toLowerCase();
  return !t || fields.some(f => f.toLowerCase().includes(t));
};

/* Entries under month headings, in the order given. */
function ByMonth<T>({ items, at, render, empty }: {
  items: T[]; at: (x: T) => Minute; render: (x: T) => ReactNode; empty: ReactNode;
}) {
  if (!items.length) return <p className="mempty">{empty}</p>;
  const groups: { month: string; items: T[] }[] = [];
  for (const x of items) {
    const month = fmtMonth(at(x));
    const last = groups[groups.length - 1];
    if (last?.month === month) last.items.push(x);
    else groups.push({ month, items: [x] });
  }
  return (
    <div className="mgroups">
      {groups.map(g => (
        <div key={g.month} className="mgroup">
          <h2 className="mgroup__title">{g.month}</h2>
          <div className="mentries">{g.items.map(render)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- P1 Home ---------- */

/* What needs the patient, then what is coming, being worked on, and new. Nothing old. */
export function Home({ w }: { w: Wallet }) {
  const { needsYou, comingUp, awaitingResult, newResults } = w.home;
  const first = givenFirst(WALLET_PATIENT.name).split(' ')[0];
  const nothing = !needsYou.length && !comingUp.length && !awaitingResult.length && !newResults.length;
  const lead = needsYou.length === 1 ? 'One thing needs your answer.'
    : needsYou.length > 1 ? `${needsYou.length} things need your answer.`
      : nothing ? 'You are all caught up.' : 'Nothing needs your answer right now.';

  return (
    <div className="screen">
      <div className="mhead mhead--tight">
        <h1 className="mtitle">Hello, {first}</h1>
        <p className="mlead mlead--muted">{lead}</p>
      </div>

      {needsYou.length > 0 && (
        <Section title="Needs your answer">
          {needsYou.map(r => <NeedsYou key={r.id} r={r} w={w} />)}
        </Section>
      )}

      {comingUp.length > 0 && (
        <Section title="Coming up">
          <div className="mentries mentries--card">
            {comingUp.slice(0, 3).map(r => <AppointmentRow key={r.id} r={r} onOpen={() => w.openAppointment(r)} />)}
          </div>
        </Section>
      )}

      {awaitingResult.length > 0 && (
        <Section title="Waiting for your result">
          <div className="mentries mentries--card">
            {awaitingResult.map(r => <AppointmentRow key={r.id} r={r} onOpen={() => w.openAppointment(r)} />)}
          </div>
        </Section>
      )}

      {newResults.length > 0 && (
        <Section title={newResults.length === 1 ? 'New result' : 'New results'}>
          <div className="mentries mentries--card">
            {newResults.map((d, i) => <DocumentRow key={i} d={d} onOpen={() => w.openById(d.appointmentId)} />)}
          </div>
        </Section>
      )}

      {nothing && (
        <div className="mpanel">
          <span className="strong">Nothing new.</span>
          <span>Your appointments and results are in their tabs below.</span>
          <MButton className="mbtn--start" onClick={() => w.setScreen('bookStart')}><Ms glyph="add" />Book an appointment</MButton>
        </div>
      )}
    </div>
  );
}

/* One thing only the patient can act on, as a card with the one button that does it. */
function NeedsYou({ r, w }: { r: Appointment; w: Wallet }) {
  const tests = r.visit ? 'doctor visit' : plainTests(r.record.tests);
  if (r.status === 'Reschedule proposed') {
    return (
      <div className="mtask mtask--amber">
        <span className="mtask__eyebrow"><Ms glyph="hourglass_top" size={18} />{r.respondCountdown}</span>
        <span className="mtask__title">{r.lab} asked to move your {tests}</span>
        <MButton onClick={() => w.openAppointment(r)}>See the new time</MButton>
      </div>
    );
  }
  if (r.status === 'Overdue') {
    return (
      <div className="mtask mtask--amber">
        <span className="mtask__eyebrow"><Ms glyph="schedule" size={18} />Expected at <span className="tabular">{r.scheduledAt}</span></span>
        <span className="mtask__title">{r.lab} is still expecting you for your {tests}</span>
        <span>Go in during opening hours, or tell your health centre if you cannot.</span>
        <MButton variant="quiet" onClick={() => w.openAppointment(r)}>Open appointment</MButton>
      </div>
    );
  }
  return (
    <div className="mtask mtask--clay">
      <span className="mtask__eyebrow"><Ms glyph="cancel" size={18} />Could not be done</span>
      <span className="mtask__title">{r.lab} could not do your {tests}</span>
      <span>Choose another facility, or ask your health centre to arrange one.</span>
      <MButton variant="quiet" onClick={() => w.openAppointment(r)}>Open appointment</MButton>
    </div>
  );
}

/* ---------- P1b Appointments ---------- */

type When = 'all' | 'upcoming' | 'past';

export function Appointments({ w }: { w: Wallet }) {
  const [query, setQuery] = useState('');
  const [when, setWhen] = useState<When>('all');
  const found = w.referrals.filter(r => matches(query, plainTests(r.record.tests), r.test, r.lab));
  const upcoming = found.filter(r => !isTerminal(r.status)).sort((a, b) => a.slot - b.slot);
  const past = found.filter(r => isTerminal(r.status)).sort((a, b) => b.slot - a.slot);
  const shownUpcoming = when !== 'past' ? upcoming : [];
  const shownPast = when !== 'upcoming' ? past : [];

  return (
    <div className="screen">
      <MHead title="Appointments" />
      <MButton onClick={() => w.setScreen('bookStart')}><Ms glyph="add" />Book an appointment</MButton>
      <Filters id="appointments-search" query={query} onQuery={setQuery} placeholder="Search tests or facilities"
        value={when} onChange={setWhen}
        options={[
          { id: 'all', label: 'All', count: found.length },
          { id: 'upcoming', label: 'Not finished', count: upcoming.length },
          { id: 'past', label: 'Finished', count: past.length },
        ]} />
      {shownUpcoming.length > 0 && (
        <Section title="Not finished yet">
          <ByMonth items={shownUpcoming} at={r => r.slot} empty={null}
            render={r => <AppointmentRow key={r.id} r={r} onOpen={() => w.openAppointment(r)} />} />
        </Section>
      )}
      {shownPast.length > 0 && (
        <Section title="Finished">
          <ByMonth items={shownPast} at={r => r.slot} empty={null}
            render={r => <AppointmentRow key={r.id} r={r} past onOpen={() => w.openAppointment(r)} />} />
        </Section>
      )}
      {!shownUpcoming.length && !shownPast.length && (
        <p className="mempty">{query ? `No appointments match “${query}”.` : 'No appointments here yet.'}</p>
      )}
    </div>
  );
}

/* ---------- P3 Documents ---------- */

type DocFilter = 'all' | 'new' | 'withdrawn';

export function Documents({ w }: { w: Wallet }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DocFilter>('all');
  const found = w.documents.filter(d => matches(query, d.name, d.facility));
  const fresh = found.filter(d => d.isNew && !d.voided);
  const withdrawn = found.filter(d => d.voided);
  const list = filter === 'new' ? fresh : filter === 'withdrawn' ? withdrawn : found;

  return (
    <div className="screen">
      <MHead title="Documents">
        <p className="mlead mlead--muted">Your results, newest first. VITAL does not explain what a result means. Ask the provider who ordered it.</p>
      </MHead>
      <Filters id="documents-search" query={query} onQuery={setQuery} placeholder="Search tests or facilities"
        value={filter} onChange={setFilter}
        options={[
          { id: 'all', label: 'All', count: found.length },
          { id: 'new', label: 'New', count: fresh.length },
          ...(withdrawn.length ? [{ id: 'withdrawn' as const, label: 'Withdrawn', count: withdrawn.length }] : []),
        ]} />
      <ByMonth items={list} at={d => d.at}
        render={d => <DocumentRow key={`${d.appointmentId}-${d.at}`} d={d} onOpen={() => w.openById(d.appointmentId)} />}
        empty={query ? `No documents match “${query}”.` : filter === 'new' ? 'No new results. You have opened them all.' : 'No documents yet. Results appear here when a laboratory releases them.'} />
    </div>
  );
}

/* ---------- P4 Access ---------- */

type AccessFilter = 'active' | 'ended';

export function ConsentList({ w }: { w: Wallet }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AccessFilter>('active');
  const found = w.consents.filter(c => matches(query, c.facility, c.scope));
  const active = found.filter(c => c.active);
  const ended = found.filter(c => !c.active);
  const list = filter === 'active' ? active : ended;
  const sharingNow = w.consents.filter(c => c.active).length;

  return (
    <div className="screen">
      <MHead title="Who can see your record">
        <p className="mlead">You decide who can see your record. Stopping a facility does not delete anything they have already read.</p>
      </MHead>
      <div className="msummary">
        <Ms glyph="shield" className="forest" />
        <span><span className="strong">{sharingNow === 0 ? 'Not sharing with anyone' : `Sharing with ${sharingNow} ${sharingNow === 1 ? 'facility' : 'facilities'}`}</span> right now</span>
      </div>
      <Filters id="access-search" query={query} onQuery={setQuery} placeholder="Search facilities or tests"
        value={filter} onChange={setFilter}
        options={[
          { id: 'active', label: 'Sharing now', count: active.length },
          { id: 'ended', label: 'Ended', count: ended.length },
        ]} />
      {list.length ? (
        <div className="mentries mentries--card">
          {list.map(c => <AccessRow key={c.key} c={c} w={w} />)}
        </div>
      ) : (
        <p className="mempty">{query ? `No facilities match “${query}”.` : filter === 'active' ? 'You are not sharing with anyone right now.' : 'Nothing has ended yet.'}</p>
      )}
    </div>
  );
}

function AccessRow({ c, w }: { c: ConsentLine; w: Wallet }) {
  return (
    <div className={c.active ? 'maccess-row' : 'maccess-row maccess-row--ended'}>
      <span className="mfile"><Ms glyph={c.kind === 'Referring provider' ? 'local_hospital' : 'biotech'} /></span>
      <div className="mentry__text">
        <span className="mentry__title">{c.facility}</span>
        <span className="mentry__kind">{c.kind === 'Referring provider' ? 'Your health centre' : 'Doing your test'}</span>
        <span className="mentry__meta">{c.scope}</span>
        <span className="mfine">Since <span className="tabular">{c.granted}</span> · {c.until}</span>
        {c.active && (() => {
          const h = w.historyFor(c.facility);
          return (
            <div className="mhistory-share">
              <span className="mhistory-share__state">
                <Ms glyph={h ? 'history' : 'lock'} size={18} />
                {h ? 'Also sees your earlier results and details' : 'Sees only this, not your history'}
              </span>
              <div className="mrowbtns">
                <MButton variant="quiet" className="mbtn--small" onClick={() => w.toggleHistory(c)}>{h ? 'Stop sharing history' : 'Share my history too'}</MButton>
                <MButton variant="quiet" className="mbtn--small" onClick={() => w.startRevoke(c.key)}>Stop sharing…</MButton>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ---------- P9 Details ---------- */

const GROUPS: { title: string; labels: string[] }[] = [
  { title: 'About you', labels: ['Age', 'Sex'] },
  { title: 'Body', labels: ['Height', 'Weight', 'Blood type'] },
  { title: 'Allergies', labels: ['Allergies'] },
];

export function Profile() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(WALLET_PATIENT.id).then(() => setCopied(true), () => setCopied(false));
  };
  return (
    <div className="screen">
      <MHead title="Your details" />

      {/* The patient ID first: it is what staff ask for at the counter. */}
      <div className="mid">
        <span className="mid__name">{givenFirst(WALLET_PATIENT.name)}</span>
        <span className="mid__label">Patient ID</span>
        <span className="mid__value tabular">{WALLET_PATIENT.id}</span>
        <span className="mid__hint">Show this at the counter so staff find the right record. It is not a password.</span>
        <button type="button" className="mid__copy" onClick={copy}>
          <Ms glyph={copied ? 'check' : 'content_copy'} size={18} />{copied ? 'Copied' : 'Copy ID'}
        </button>
      </div>

      <div className="mstack mstack--16">
        <p className="mlead mlead--muted">You entered these yourself. A facility sees them only while you are sharing your record with them.</p>
        {GROUPS.map(g => (
          <section key={g.title} className="mcardlist">
            <h2 className="mcardlist__title">{g.title}</h2>
            <dl className="mprofile">
              {PROFILE.filter(p => g.labels.includes(p.label)).map(p => (
                <div key={p.label} className="mprofile__row">
                  <div className="mprofile__text">
                    <dt className="mprofile__label">{p.label}</dt>
                    <dd className="mprofile__value">{p.value}</dd>
                    <dd className="mprofile__meta">Updated <span className="tabular">{p.updated}</span></dd>
                  </div>
                  <button type="button" className="mlinkbtn">Change</button>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section className="mcardlist">
          <h2 className="mcardlist__title">Contact</h2>
          <dl className="mprofile">
            <div className="mprofile__row">
              <div className="mprofile__text">
                <dt className="mprofile__label">Mobile number</dt>
                <dd className="mprofile__value tabular">{WALLET_PATIENT.phone}</dd>
                <dd className="mprofile__meta">Texts about your appointments go here</dd>
              </div>
              <button type="button" className="mlinkbtn">Change</button>
            </div>
            <div className="mprofile__row">
              <div className="mprofile__text">
                <dt className="mprofile__label">Town</dt>
                <dd className="mprofile__value">{WALLET_PATIENT.municipality}</dd>
              </div>
              <button type="button" className="mlinkbtn">Change</button>
            </div>
          </dl>
        </section>
        <p className="mfine">VITAL does not read these details or decide anything from them. They are here because a facility often asks for them on paper.</p>
      </div>
    </div>
  );
}
