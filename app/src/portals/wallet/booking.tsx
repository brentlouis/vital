import { TEST_META, type RankedFacility } from '../../domain/reference';
import { fmtSlot } from '../../domain/time';
import { MBack, MBadge, MButton, MHead, Ms } from '../../components/Phone';
import { SummaryBlock } from './screens';
import type { Wallet } from './useWallet';

/* ---------- P6 Choose tests ---------- */

export function BookTests({ w }: { w: Wallet }) {
  const { tests } = w.booking;
  const needsReferral = tests.some(x => TEST_META.some(m => m.name === x && m.needsReferral));
  return (
    <div className="screen">
      <MBack onClick={() => w.setScreen('home')}>Wallet home</MBack>
      <MHead title="What do you need?">
        <p className="mlead">Choose one or more tests. You can change this later.</p>
      </MHead>
      <div className="mstack mstack--8">
        {TEST_META.map(t => {
          const on = tests.includes(t.name);
          return (
            <button key={t.name} type="button" className="mchoice" aria-pressed={on} onClick={() => w.toggleTest(t.name)}>
              <Ms glyph={on ? 'check_box' : 'check_box_outline_blank'} />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>
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
      {f.partner && <span className="mchip"><Ms glyph="handshake" size={14} />Partner facility</span>}
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

      <p className="mfine m0">Facilities that offer every test you chose are always listed first, whether or not they pay for a partner listing.</p>

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
        <p className="mlead mlead--muted">{booking.facility ? `Times published by ${booking.facility}` : 'Pick a time'}</p>
        {book.slots.length > 0 ? (
          <div className="mwrap">
            {book.slots.map(m => (
              <button key={m} type="button" className="mslot" aria-pressed={book.slot === m}
                onClick={() => w.setBooking({ slot: m })}>{fmtSlot(m)}</button>
            ))}
          </div>
        ) : (
          <p className="mlead">
            {booking.facility
              ? 'This facility has not published any times for the coming days.'
              : 'Choose a facility above to see the times it has published.'}
          </p>
        )}
      </div>

      {book.summary && <div className="mpanel mpanel--12"><SummaryBlock summary={book.summary} /></div>}

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
        <div className="mkv"><span className="mfield-label">Reference</span><span className="strong tabular">{booking.id}</span></div>
      </div>

      <div className="mstack mstack--8">
        <label htmlFor="referredBy" className="strong">Referred by (optional)</label>
        <input id="referredBy" type="text" className="minput minput--48" value={booking.referredBy}
          onChange={e => w.setReferredBy(e.target.value)} placeholder="Name of the clinic or provider" />
        <span className="mfine">For the facility's reference. This does not give them access to your records.</span>
      </div>

      <MButton onClick={() => w.setScreen('home')}>Back to wallet home</MButton>
    </div>
  );
}

