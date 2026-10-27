import { useState } from 'react';
import { TEST_META, type RankedFacility } from '../../domain/reference';
import { fmtSlot } from '../../domain/time';
import { AutoTimeField } from '../../components/AutoTimeField';
import { MBack, MBadge, MButton, MHead, Ms } from '../../components/Phone';
import { SummaryBlock } from './screens';
import type { Wallet } from './useWallet';

/* ---------- P6 Choose tests ---------- */

/* A real catalogue has hundreds of tests, so they are searched and added, not ticked from a
   list. Chosen tests sit on top as chips that can be removed. */
function TestSearch({ chosen, onToggle }: { chosen: string[]; onToggle: (name: string) => void }) {
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const hits = TEST_META.filter(m => !chosen.includes(m.name)
    && (!t || m.name.toLowerCase().includes(t) || m.long.toLowerCase().includes(t))).slice(0, t ? 8 : 4);
  return (
    <div className="mstack">
      {chosen.length > 0 && (
        <div className="mchips" aria-label="Your tests">
          {chosen.map(n => (
            <button key={n} type="button" className="mtestchip" onClick={() => onToggle(n)} aria-label={`Remove ${n}`}>
              {n}<Ms glyph="close" size={18} />
            </button>
          ))}
        </div>
      )}
      <label className="msearch" htmlFor="test-search">
        <Ms glyph="search" size={20} />
        <input id="test-search" type="search" value={q} placeholder="Search tests, e.g. CBC or urinalysis" onChange={e => setQ(e.target.value)} />
      </label>
      <span className="mday__label">{t ? 'Matching tests' : 'Common tests'}</span>
      {hits.length ? (
        <div className="mentries mentries--card">
          {hits.map(m => (
            <button key={m.name} type="button" className="mentry" onClick={() => { onToggle(m.name); setQ(''); }}>
              <span className="mentry__text">
                <span className="mentry__title">{m.name}</span>
                {m.long !== m.name && <span className="mentry__meta">{m.long}</span>}
              </span>
              <span className="mtestadd"><Ms glyph="add" size={20} />Add</span>
            </button>
          ))}
        </div>
      ) : <p className="mempty">No test matches “{q}”. Check the spelling on your request slip.</p>}
    </div>
  );
}

export function BookTests({ w }: { w: Wallet }) {
  const { tests } = w.booking;
  const needsReferral = tests.some(x => TEST_META.some(m => m.name === x && m.needsReferral));
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('bookStart')}>What do you need?</MBack>
      <MHead title="Which tests?">
        <p className="mlead">Choose the tests on your lab request. You can change this later.</p>
      </MHead>
      <TestSearch chosen={tests} onToggle={w.toggleTest} />
      {needsReferral && (
        <div className="mpanel mpanel--row">
          <Ms glyph="assignment" className="forest" />
          <span>Some facilities require a referral from your health centre for this test. You'll see which ones when you choose a facility.</span>
        </div>
      )}
      <MButton disabled={tests.length === 0} onClick={() => w.setScreen('bookFacility')}>Choose a facility</MButton>
    </div>
  );
}

/* ---------- P7 Choose facility and time ---------- */

function FacilityCard({ w, f }: { w: Wallet; f: RankedFacility }) {
  const { booking } = w;
  const n = booking.tests.length;
  return (
    <button type="button" className="mfacility" aria-pressed={booking.facility === f.name} aria-disabled={f.blocked}
      onClick={() => { if (!f.blocked) w.setBooking({ facility: f.name, slot: null }); }}>
      <span className="strong">{f.name}</span>
      <span className="muted">{f.municipality} · {f.travel}</span>
      <span>
        {f.blocked
          ? 'Nothing you chose can be booked here without a referral'
          : `Books ${f.bookable.length} of ${n} ${n === 1 ? 'test' : 'tests'}`}
      </span>
      {!f.full && f.missing.length > 0 && <span className="muted">Does not offer {f.missing.join(', ')}</span>}
      {f.referralOnly.length > 0 && (
        <span className="mfacility__warn">
          <Ms glyph="assignment_late" size={20} />Needs a referral from your health centre for {f.referralOnly.join(', ')}
        </span>
      )}
    </button>
  );
}

export function BookFacility({ w }: { w: Wallet }) {
  const { booking, book } = w;
  const full = book.ranked.filter(f => f.full);
  const partial = book.ranked.filter(f => !f.full);
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('bookTests')}>Tests</MBack>
      <MHead title="Where do you want to go?">
        <p className="mlead mlead--muted">{booking.tests.length ? booking.tests.join(' · ') : 'No tests chosen yet'}</p>
      </MHead>

      <div className="mstack">
        {full.length > 0 && <h2 className="mh2">Offers every test you chose</h2>}
        {booking.tests.length > 0 && full.length === 0 && (
          <p className="mlead mlead--muted">No facility near you offers all your selected tests. You may need more than one appointment.</p>
        )}
        {full.map(f => <FacilityCard key={f.name} w={w} f={f} />)}
      </div>

      {partial.length > 0 && (
        <div className="mstack">
          <h2 className="mh2">Offers some of your tests</h2>
          {partial.map(f => <FacilityCard key={f.name} w={w} f={f} />)}
        </div>
      )}

      <p className="mfine m0">Facilities that offer every test you chose are listed first, then the nearest. No facility can pay to be listed higher.</p>

      {book.hasBlocked && book.blockedTests.length > 0 && (
        <div className="mnotice mnotice--amber mnotice--row">
          <Ms glyph="assignment_late" className="amber" />
          <div className="mstack mstack--4">
            <span className="strong amber">{book.blockedTests.join(' and ')} needs a referral at some facilities</span>
            <span>The facilities marked above only accept that test when a health centre books it. Ask {w.rhu} to refer you, or choose a facility that accepts it directly.</span>
          </div>
        </div>
      )}

      <div className="mstack">
        <h2 className="mh2">Pick a time</h2>
        <p className="mlead mlead--muted">{booking.facility ? `Let VITAL pick the time with the shortest wait, or choose your own. ${booking.facility} checks it against its schedule.` : 'Choose a facility first.'}</p>
        {booking.facility
          ? <AutoTimeField key={booking.facility} id="booking-slot" mobile lab={booking.facility} tests={booking.tests} now={w.now}
              value={booking.slot} auto={booking.autoTime} onChange={(m, auto) => w.setBooking({ slot: m, autoTime: auto })} />
          : null}
      </div>

      {book.summary && <div className="mpanel mpanel--12"><SummaryBlock summary={book.summary} /></div>}

      <div className="mstack mstack--8">
        <label htmlFor="referredBy" className="strong">Referred by (optional)</label>
        <input id="referredBy" type="text" className="minput minput--48" value={booking.referredBy}
          onChange={e => w.setReferredBy(e.target.value)} placeholder="Name of the clinic or doctor who sent you" />
        <span className="mfine">For the facility's reference. This does not give them access to your records.</span>
      </div>

      <MButton disabled={!book.canBook} onClick={w.confirmBooking}>Book appointment</MButton>
    </div>
  );
}

/* ---------- P8 Booked ---------- */

export function Booked({ w }: { w: Wallet }) {
  const { booking, book } = w;
  return (
    <div className="screen">
      <div className="mhead">
        <h1 className="mtitle">Your appointment is booked</h1>
        <MBadge glyph="event_available" tone="waiting">Booked</MBadge>
        <p className="mlead">You do not need to do anything until then. Bring a valid ID.</p>
      </div>

      <div className="mpanel mpanel--16">
        <div className="mkv">
          <span className="mfield-label">Facility</span>
          <span className="strong">{booking.facility}</span>
          {book.chosen && <span className="muted">{book.chosen.municipality} · {book.chosen.travel}</span>}
        </div>
        {book.summary && (
          <div className="mstack">
            <span className="mfield-label">Tests</span>
            <SummaryBlock summary={book.summary} />
          </div>
        )}
        <div className="mkv"><span className="mfield-label">Time</span><span className="strong tabular">{booking.slot !== null ? fmtSlot(booking.slot) : ''}</span></div>
        {booking.referredBy.trim() && <div className="mkv"><span className="mfield-label">Referred by</span><span className="strong">{booking.referredBy}</span></div>}
        <div className="mkv"><span className="mfield-label">Reference</span><span className="strong tabular">{booking.id}</span></div>
      </div>

      <MButton onClick={() => w.setScreen('appointments')}>See my appointments</MButton>
    </div>
  );
}

