import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Lock, Mail, TriangleAlert, UserRound, UserRoundCheck } from 'lucide-react';
import { BackButton, Button, Icon, Pills } from '../../components/ui';
import { PrototypeBar, PrototypeLabel } from '../../components/PortalChrome';
import { PinInput } from '../../components/PinInput';
import { useDemo } from '../../store/context';
import { EMAIL_DOMAINS, STAFF, capabilitiesOf, facility as facilityNamed, portalFor, staffOf } from '../../domain/reference';

type Screen = 's1' | 's2' | 's3' | 's4';
const SCREENS: { id: Screen; label: string }[] = [
  { id: 's1', label: 'S1 Staff login' },
  { id: 's2', label: 'S2 Accept invite' },
  { id: 's3', label: 'S3 Forgot password' },
  { id: 's4', label: 'S4 Quick switch' },
];

/* Where each facility's staff land. The portal comes from the facility, never a choice. */
function portalLink(facility: string): string {
  const base = portalFor(facility);
  return base === '/lab' ? `/lab?facility=${encodeURIComponent(facility)}` : base;
}
const DEFAULT_TERMINAL = 'Loon Heritage Clinical Lab';

/* Prototype only. */
const DEMO_PIN = '4021';
const EMPTY_PIN = ['', '', '', ''];
const isEmail = (v: string) => /.+@.+\..+/.test(v);

/* S1–S4 — how staff get into a shared-terminal portal and hand it over without signing out. */
export function StaffAccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initial = params.get('screen');
  const [screen, setScreenRaw] = useState<Screen>(SCREENS.some(s => s.id === initial) ? initial as Screen : 's1');
  const [login, setLogin] = useState({ email: '', pw: '' });
  const [accept, setAccept] = useState({ pw: '', pw2: '', pin: EMPTY_PIN });
  const [reset, setReset] = useState({ email: '', sent: false });
  const demo = useDemo();
  /* The shared terminal S4 unlocks: the facility the portal sent us from, or the pilot lab. */
  const terminal = STAFF[params.get('facility') ?? ''] ? params.get('facility')! : DEFAULT_TERMINAL;
  const people = staffOf(terminal);
  const current = demo.staffViewer(terminal).name;
  const [switchSel, setSwitchSel] = useState(() => Math.max(0, people.findIndex(p => p.name !== current)));
  const [pin, setPin] = useState(EMPTY_PIN);
  const [pinError, setPinError] = useState(false);
  const [switched, setSwitched] = useState<string | null>(null);

  useEffect(() => { document.title = 'VITAL — Staff access'; }, []);

  const setScreen = (id: Screen) => { setPinError(false); setSwitched(null); setScreenRaw(id); };

  const email = login.email.trim();
  const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
  /* The email's domain names the facility; the address itself names the person. */
  const hitFacility = EMAIL_DOMAINS[domain];
  const member = hitFacility ? staffOf(hitFacility).find(p => p.email === email.toLowerCase()) : undefined;
  const f = hitFacility ? facilityNamed(hitFacility) : undefined;
  const hit = hitFacility ? {
    facility: hitFacility,
    meta: `${capabilitiesOf(hitFacility).type} · ${f?.municipality ?? 'Loon'}, Bohol · ${portalFor(hitFacility) === '/lab' ? 'laboratory' : 'clinic'} portal`,
  } : undefined;
  const lBlocked = !(member && login.pw.length > 0);
  /* Signing in makes this person the one every event on the terminal is written against. */
  const signIn = () => {
    if (lBlocked || !member || !hitFacility) return;
    demo.setStaff(hitFacility, member.name);
    navigate(portalLink(hitFacility));
  };

  const aPin = accept.pin.join('');
  const aBlocked = !(accept.pw.length >= 10 && accept.pw === accept.pw2 && aPin.length === 4);
  const rBlocked = !isEmail(reset.email);

  const uBlocked = pin.join('').length !== 4;
  const target = people[switchSel] ?? people[0];
  const unlock = () => {
    if (uBlocked) return;
    if (pin.join('') === DEMO_PIN) { demo.setStaff(terminal, target.name); setSwitched(target.name); setPinError(false); }
    else { setPinError(true); setSwitched(null); setPin(EMPTY_PIN); }
  };

  return (
    <div className="portal" data-density="compact">
      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={SCREENS} value={screen} onChange={setScreen} />
      </PrototypeBar>

      <main className="centered">
        {screen === 's1' && (
          <div className="auth">
            <span className="auth__brand">VITAL</span>
            <h1 className="page-title upload__title">Sign in</h1>
            <p className="page-sub">Use the work email your facility admin invited.</p>
            <form className="card form" onSubmit={e => { e.preventDefault(); signIn(); }}>
              <label className="field-sm">
                <span className="muted">Work email</span>
                <input type="email" className="input" autoComplete="username" value={login.email} placeholder="name@facility.ph"
                  onChange={e => setLogin(l => ({ ...l, email: e.target.value }))} />
              </label>
              {hit && (
                <div className="tile tile--top">
                  <span className="tile__icon pt2"><Icon icon={Building2} /></span>
                  <div className="tile__text small">
                    <span className="xs muted">You are signing in to</span>
                    <span className="bold">{hit.facility}</span>
                    <span>{hit.meta}</span>
                  </div>
                </div>
              )}
              {hit && isEmail(email) && !member && (
                <div className="note-amber">
                  <span className="amber pt2"><Icon icon={TriangleAlert} /></span>
                  <span>No one at {hit.facility} uses this email. Ask your facility admin to invite it, or check for a typo.</span>
                </div>
              )}
              {isEmail(email) && !hit && (
                <div className="note-amber">
                  <span className="amber pt2"><Icon icon={TriangleAlert} /></span>
                  <span>No VITAL account uses this email. Ask your facility admin to invite it, or check for a typo.</span>
                </div>
              )}
              <label className="field-sm">
                <span className="muted">Password</span>
                <input type="password" className="input" autoComplete="current-password" value={login.pw}
                  onChange={e => setLogin(l => ({ ...l, pw: e.target.value }))} />
              </label>
              <div className="inline-actions">
                <Button type="submit" size="md" disabled={lBlocked}>Sign in</Button>
                <button type="button" className="text-link" onClick={() => setScreen('s3')}>Forgot your password?</button>
              </div>
              <span className="xs muted">
                {!hit
                  ? 'Try ebughao@loonheritagelab.ph to see the facility resolve.'
                  : `You land on the ${hit.facility} portal. The portal comes from the facility type, not from a choice here.`}
              </span>
            </form>
            <p className="footnote">The portal you land on comes from your facility type. There is nothing to choose here.</p>
          </div>
        )}

        {screen === 's2' && (
          <div className="auth auth--460">
            <span className="auth__brand">VITAL</span>
            <h1 className="page-title upload__title">Set up your account</h1>
            <p className="page-sub">E. Bughao invited you to Loon Heritage Clinical Lab as Staff. This link expires 48 hours after it was sent.</p>
            <div className="card stack">
              <div className="readback readback--flat">
                <span className="bold">T. Salgarino</span>
                <span>tsalgarino@loonheritagelab.ph · Staff · Loon Heritage Clinical Lab</span>
              </div>
              <div className="form">
                <label className="field-sm">
                  <span className="muted">Set a password</span>
                  <input type="password" className="input" autoComplete="new-password" value={accept.pw} placeholder="At least 10 characters"
                    onChange={e => setAccept(a => ({ ...a, pw: e.target.value }))} />
                </label>
                <label className="field-sm">
                  <span className="muted">Repeat the password</span>
                  <input type="password" className="input" autoComplete="new-password" value={accept.pw2}
                    onChange={e => setAccept(a => ({ ...a, pw2: e.target.value }))} />
                </label>
              </div>
              <div>
                <h2 className="upload__step upload__step--tight">Choose a quick-switch PIN</h2>
                <p className="upload__text">Four digits. On a shared terminal you unlock with this PIN instead of your password, and every status event still records your name.</p>
                <PinInput label="PIN" value={accept.pin} onChange={p => setAccept(a => ({ ...a, pin: p }))} />
              </div>
              <div className="inline-actions">
                <Button size="md" disabled={aBlocked} onClick={() => setScreen('s4')}>Set password and PIN</Button>
                <span className="muted small">
                  {accept.pw.length < 10 ? 'Use at least 10 characters.'
                    : accept.pw !== accept.pw2 ? 'The two passwords do not match.'
                      : aPin.length !== 4 ? 'Enter four digits for your PIN.'
                        : 'You can sign in on any terminal at Loon Heritage Clinical Lab.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {screen === 's3' && (
          <div className="auth">
            <span className="auth__brand">VITAL</span>
            <BackButton onClick={() => setScreen('s1')}>Sign in</BackButton>
            <h1 className="page-title upload__title">Reset your password</h1>
            <p className="page-sub">A reset link is sent to your work email. It expires after one hour.</p>
            <div className="card form">
              {!reset.sent ? (
                <form className="form" onSubmit={e => { e.preventDefault(); if (!rBlocked) setReset(r => ({ ...r, sent: true })); }}>
                  <label className="field-sm">
                    <span className="muted">Work email</span>
                    <input type="email" className="input" value={reset.email} placeholder="name@facility.ph"
                      onChange={e => setReset(r => ({ ...r, email: e.target.value }))} />
                  </label>
                  <div className="inline-actions">
                    <Button type="submit" size="md" disabled={rBlocked}>Send reset link</Button>
                    <span className="muted small">{rBlocked ? 'Enter the email your facility admin invited.' : 'The link expires after one hour.'}</span>
                  </div>
                </form>
              ) : (
                <div className="stack-8">
                  <div className="tile tile--top">
                    <span className="tile__icon pt2"><Icon icon={Mail} /></span>
                    <span className="small">A reset link was sent to {reset.email}. Open it on this machine within the hour. If the email does not arrive, your facility admin can resend the invite.</span>
                  </div>
                  <Button size="md" variant="outline" className="self-start" onClick={() => { setReset({ email: '', sent: false }); setScreen('s1'); }}>Back to sign in</Button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 's4' && (
          <div className="auth auth--520">
            <div className="auth__locked">
              <span className="session__brand">VITAL</span>
              <span className="badge badge--attention"><Icon icon={Lock} size={14} /> Terminal locked</span>
            </div>
            <div className="card stack">
              <div className="readback readback--flat">
                <span className="xs muted">Facility session, open since 07:05</span>
                <span className="bold">{terminal}</span>
                <span>Signed in as {current} · {people.find(p => p.name === current)?.title ?? ''}</span>
              </div>
              <div>
                <h1 className="page-title upload__title">Switch user</h1>
                <p className="upload__text">Choose your name and enter your four-digit PIN. The facility session stays open; every status event you write records you, not the terminal.</p>
                <div className="stack-4">
                  {people.map((p, i) => (
                    <button key={p.name} type="button" className="option option--full" aria-pressed={i === switchSel}
                      onClick={() => { setSwitchSel(i); setPinError(false); setSwitched(null); }}>
                      <span className="option__radio"><Icon icon={p.name === current ? UserRound : UserRoundCheck} size={16} /></span>
                      <span className={i === switchSel ? 'bold' : undefined}>{p.name}</span>
                      <span className="muted small">{p.role}</span>
                      {p.name === current && <span className="option__end xs muted">Currently signed in</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="group-label">PIN</span>
                <PinInput label="PIN" value={pin} invalid={pinError} onEnter={unlock}
                  onChange={p => { setPin(p); setPinError(false); setSwitched(null); }} />
              </div>
              <div className="inline-actions">
                <Button size="lg" className="upload__button" disabled={uBlocked} onClick={unlock}>Unlock as {target.name}</Button>
                <Button size="lg" variant="danger-outline" className="btn--lg-14"
                  onClick={() => { setPin(EMPTY_PIN); setLogin({ email: '', pw: '' }); setScreen('s1'); }}>End the facility session</Button>
              </div>
              <span className={pinError ? 'xs clay' : 'xs muted'} role="status">
                {pinError
                  ? `That PIN does not match ${target.name}. Three wrong attempts lock the terminal until a facility admin signs in.`
                  : switched
                    ? `${switched} is now the active user. Everything recorded from here carries their name.`
                    : `Demo PIN is ${DEMO_PIN}. The facility session is not ended by switching users.`}
              </span>
              {switched && (
                <Button variant="outline" className="self-start" onClick={() => navigate(portalLink(terminal))}>Continue to the portal</Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
