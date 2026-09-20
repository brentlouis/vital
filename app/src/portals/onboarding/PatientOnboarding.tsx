import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MBack, MBadge, MButton, MHead, Ms, Phone, PhoneStage } from '../../components/Phone';

type Screen = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6' | 'done' | 'notme';
type Path = 'direct' | 'invited';

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'w1', label: 'W1 Welcome' },
  { id: 'w2', label: 'W2 Phone' },
  { id: 'w3', label: 'W3 OTP' },
  { id: 'w4', label: 'W4 Details' },
  { id: 'w5', label: 'W5 Privacy' },
  { id: 'w6', label: 'W6 Claim' },
];

/* Prototype only: the one code that verifies. */
const DEMO_CODE = '402118';
const EMPTY_OTP = ['', '', '', '', '', ''];

const WELCOME = [
  { icon: 'event_available', title: 'Your appointments in one place', body: 'See what a health centre booked for you, where to go and when.' },
  { icon: 'description', title: 'Results as soon as they are released', body: 'A laboratory releases a result to you and to the health centre that asked for it.' },
  { icon: 'lock', title: 'You decide who can read it', body: 'A facility sees your record only while you allow it, and you can stop at any time.' },
];

const PRIVACY = [
  { icon: 'inventory_2', body: 'VITAL stores your name, date of birth, sex, mobile number, your appointments, and the results a laboratory releases to you.' },
  { icon: 'visibility_off', body: 'No facility can read any of it unless you allow that facility. Allowing one health centre does not allow any other.' },
  { icon: 'history', body: 'Every time a facility opens your record it is written down, with the name of the person who opened it.' },
  { icon: 'lock_open', body: 'You can stop sharing at any time. Stopping does not delete what a facility has already read.' },
];

/* The appointment waiting on an invited number. */
const CLAIM = [
  { label: 'Test requested', value: 'Complete blood count' },
  { label: 'Laboratory', value: 'Loon Heritage Clinical Lab' },
  { label: 'Slot', value: 'Wed 16 Sep 2026 · 09:30' },
  { label: 'Booked by', value: 'J. Bacarro · Loon Rural Health Unit' },
  { label: 'Appointment', value: 'APT-398' },
];

/* W1–W6 — patient sign-up. Phone number is the identifier; an invited patient claims the
   appointment a health centre already booked for that number. */
export function PatientOnboarding() {
  const [screen, setScreen] = useState<Screen>('w1');
  const [path, setPath] = useState<Path>('direct');
  const [phone, setPhone] = useState('9174028815');
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [otpError, setOtpError] = useState(false);
  const [resendIn, setResendIn] = useState(45);
  const [details, setDetails] = useState({ name: '', dob: '', sex: '' });
  const [consentTicked, setConsentTicked] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { document.title = 'VITAL — Patient onboarding'; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  /* The resend countdown only runs while the code screen is open. */
  useEffect(() => {
    if (screen !== 'w3' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, resendIn]);

  const digits = phone.replace(/[^0-9]/g, '');
  const phoneText = digits.replace(/^(\d{3})(\d{0,3})(\d{0,4}).*$/, (_m, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  const phoneValid = /^9\d{9}$/.test(digits);
  const phonePretty = '+63 ' + phoneText;
  const code = otp.join('');

  const order: Screen[] = path === 'invited' ? ['w2', 'w3', 'w6', 'w5'] : ['w2', 'w3', 'w4', 'w5'];
  const idx = order.indexOf(screen);
  const detailsOk = details.name.trim().length > 2 && !!details.dob && !!details.sex;

  const go = (id: Screen) => {
    setOtpError(false);
    if (id === 'w6') setPath('invited');
    if (id === 'w3') setResendIn(45);
    setScreen(id);
  };
  const back = () => { setOtpError(false); setScreen(idx > 0 ? order[idx - 1] : 'w1'); };
  const sendCode = () => {
    if (!phoneValid) return;
    setOtp(EMPTY_OTP); setOtpError(false); setResendIn(45); setScreen('w3');
  };
  const setDigit = (i: number, raw: string) => {
    const d = raw.replace(/[^0-9]/g, '').slice(-1);
    setOtp(o => o.map((q, j) => (j === i ? d : q)));
    setOtpError(false);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const onOtpKey = (i: number, key: string) => {
    if (key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  /* Pasting the whole code fills every box. */
  const onOtpPaste = (text: string) => {
    const d = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (d.length < 2) return false;
    setOtp(EMPTY_OTP.map((_, i) => d[i] || ''));
    otpRefs.current[Math.min(d.length, 5)]?.focus();
    return true;
  };
  const verify = () => {
    if (code.length !== 6) return;
    if (code === DEMO_CODE) { setOtpError(false); setScreen(path === 'invited' ? 'w6' : 'w4'); }
    else { setOtpError(true); setOtp(EMPTY_OTP); otpRefs.current[0]?.focus(); }
  };
  const restart = () => {
    setScreen('w1'); setPath('direct'); setOtp(EMPTY_OTP);
    setDetails({ name: '', dob: '', sex: '' }); setConsentTicked(false); setClaimed(false);
  };

  const step = idx >= 0 ? <span className="phone__step">Step {idx + 1} of {order.length}</span> : null;

  return (
    <PhoneStage screens={SCREENS} value={screen} onChange={go}>
      <Phone headerEnd={step}>
        {screen === 'w1' && (
          <div className="screen screen--fill">
            <MHead title="Your health record, in your hands">
              <p className="mlead">VITAL keeps your appointments and results in one place on your phone, and lets you decide which health centres and laboratories can read them.</p>
            </MHead>
            <div className="mstack mstack--16">
              {WELCOME.map(p => (
                <div key={p.title} className="mpoint">
                  <Ms glyph={p.icon} className="forest" />
                  <div className="mstack mstack--2">
                    <span className="bold">{p.title}</span>
                    <span>{p.body}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="screen__foot">
              <MButton onClick={() => { setPath('direct'); setScreen('w2'); }}>Get started</MButton>
              <MButton variant="outline" onClick={() => { setPath('invited'); setScreen('w2'); }}>I have an invite</MButton>
              <span className="mfine mfine--center">You need a mobile number that can receive a text message.</span>
            </div>
          </div>
        )}

        {screen === 'w2' && (
          <div className="screen screen--fill">
            <MBack onClick={back} glyph="chevron_left">Back</MBack>
            <MHead title="What is your mobile number?">
              <p className="mlead">
                {path === 'invited'
                  ? 'Enter the number your health centre has for you. The invite was sent to that number.'
                  : 'VITAL uses your mobile number to find your record and to text you a code.'}
              </p>
            </MHead>
            <div className="mstack mstack--8">
              <label htmlFor="phone" className="msmall">Mobile number</label>
              <div className="phone-input">
                <span className="tabular">+63</span>
                <input id="phone" type="tel" inputMode="numeric" value={phoneText} placeholder="9XX XXX XXXX"
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  onKeyDown={e => { if (e.key === 'Enter') sendCode(); }} />
              </div>
              <span className={digits.length > 0 && !phoneValid ? 'msmall amber' : 'msmall'}>
                {digits.length === 0 ? 'Start with 9. Ten digits after +63.'
                  : phoneValid ? 'We will text a six-digit code to this number.'
                    : 'That is not a complete Philippine mobile number yet.'}
              </span>
            </div>
            <div className="screen__foot">
              <MButton disabled={!phoneValid} onClick={sendCode}>Send me a code</MButton>
              <span className="mfine">Your number is how VITAL knows the record is yours. It is not shown to other patients.</span>
            </div>
          </div>
        )}

        {screen === 'w3' && (
          <div className="screen screen--fill">
            <MBack onClick={back} glyph="chevron_left">Change number</MBack>
            <MHead title="Enter the code we texted you">
              <p className="mlead">Sent to {phonePretty}. It is six digits.</p>
            </MHead>
            <div className="mstack">
              <div className="otp">
                {otp.map((v, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el; }} type="tel" inputMode="numeric" maxLength={1}
                    className={otpError ? 'otp__box otp__box--error' : 'otp__box'} value={v} aria-label={`Code digit ${i + 1}`}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    onChange={e => setDigit(i, e.target.value)}
                    onKeyDown={e => { onOtpKey(i, e.key); if (e.key === 'Enter') verify(); }}
                    onPaste={e => { if (onOtpPaste(e.clipboardData.getData('text'))) e.preventDefault(); }} />
                ))}
              </div>
              <span className={otpError ? 'msmall clay' : 'msmall'}>
                {otpError
                  ? 'That code does not match. Check the text message or ask for a new code.'
                  : `The demo code is ${DEMO_CODE}.`}
              </span>
            </div>
            <div className="screen__foot">
              <MButton disabled={code.length !== 6} onClick={verify}>Verify my number</MButton>
              {resendIn <= 0 ? (
                <MButton variant="outline" onClick={() => { setResendIn(45); setOtp(EMPTY_OTP); setOtpError(false); }}>Send a new code</MButton>
              ) : (
                <span className="msmall mfine--center tabular">You can ask for a new code in 0:{String(resendIn).padStart(2, '0')}</span>
              )}
            </div>
          </div>
        )}

        {screen === 'w4' && (
          <div className="screen screen--fill">
            <MHead title="Your details">
              <p className="mlead">A health centre uses these to be sure a record belongs to you. You can change them later.</p>
            </MHead>
            <div className="mstack mstack--16">
              <label className="mlabel">
                <span className="msmall">Full name</span>
                <input type="text" className="minput" value={details.name} placeholder="First name and family name"
                  onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} />
              </label>
              <label className="mlabel">
                <span className="msmall">Date of birth</span>
                <input type="date" className="minput tabular" value={details.dob}
                  onChange={e => setDetails(d => ({ ...d, dob: e.target.value }))} />
              </label>
              <div className="mstack mstack--8">
                <span className="msmall" id="sex-label">Sex</span>
                <div className="seg" role="group" aria-labelledby="sex-label">
                  {['Female', 'Male'].map(label => (
                    <button key={label} type="button" className="seg__option" aria-pressed={details.sex === label}
                      onClick={() => setDetails(d => ({ ...d, sex: label }))}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="screen__foot">
              <MButton disabled={!detailsOk} onClick={() => setScreen('w5')}>Continue</MButton>
              <span className="mfine">
                {detailsOk
                  ? 'You can add height, weight, blood type and allergies later, in your wallet.'
                  : 'Fill in your name, date of birth and sex to continue.'}
              </span>
            </div>
          </div>
        )}

        {screen === 'w5' && (
          <div className="screen screen--fill">
            <MHead title="Before you start">
              <p className="mlead">Read this and accept it if you agree. Nothing is ticked for you.</p>
            </MHead>
            <div className="mpanel mpanel--16">
              {PRIVACY.map(p => (
                <div key={p.icon} className="mpoint">
                  <Ms glyph={p.icon} className="forest" />
                  <span>{p.body}</span>
                </div>
              ))}
              <span className="msmall">This notice is given under the Data Privacy Act of 2012. You can read the full notice at any time from your wallet settings.</span>
            </div>
            <label className="mcheck">
              <input type="checkbox" checked={consentTicked} onChange={e => setConsentTicked(e.target.checked)} />
              <span>I have read this notice and I agree that VITAL may store my appointments, results and the details I enter, and share them only with the facilities I allow.</span>
            </label>
            <div className="screen__foot">
              <MButton disabled={!consentTicked} onClick={() => setScreen('done')}>Accept and open my wallet</MButton>
              <span className="mfine">{consentTicked ? 'You can review this notice again from your wallet.' : 'Tick the box above if you agree.'}</span>
            </div>
          </div>
        )}

        {screen === 'w6' && (
          <div className="screen screen--fill">
            <MHead title="An appointment is waiting for you">
              <p className="mlead">Loon Rural Health Unit booked this for the number you just verified, {phonePretty}.</p>
            </MHead>
            <div className="mcard mcard--16">
              <MBadge glyph="send" tone="waiting">Sent to the laboratory</MBadge>
              <div className="mstack">
                {CLAIM.map(c => (
                  <div key={c.label} className="mkv">
                    <span className="msmall">{c.label}</span>
                    <span className="tabular">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mlead">If this is you, claiming it links the appointment to your wallet and lets you follow its progress. If it is not you, nothing is shared.</p>
            <div className="screen__foot">
              <MButton onClick={() => { setClaimed(true); setScreen('w5'); }}>This is me — claim the appointment</MButton>
              <MButton variant="danger-outline" onClick={() => setScreen('notme')}>This is not me</MButton>
            </div>
          </div>
        )}

        {screen === 'done' && (
          <div className="screen screen--fill">
            <MHead title="Your wallet is ready">
              <p className="mlead">
                {claimed
                  ? 'Appointment APT-398 is now in your wallet. Loon Heritage Clinical Lab can read that one appointment, and nothing else.'
                  : 'You have not shared anything with a facility yet. Your wallet is empty until a health centre books for you, or you book an appointment yourself.'}
              </p>
            </MHead>
            <div className="mpanel">
              <span className="mserif20">You decide who can see your record</span>
              <span>No facility can read anything until you allow it. You can stop sharing at any time.</span>
            </div>
            <div className="screen__foot">
              <Link to="/wallet" className="mbtn mbtn--primary">Open my health wallet</Link>
              <MButton variant="primary" className="mbtn--link" onClick={restart}>Start the flow again</MButton>
            </div>
          </div>
        )}

        {screen === 'notme' && (
          <div className="screen screen--fill">
            <MHead title="Nothing was shared">
              <p className="mlead">The appointment stays with Loon Rural Health Unit and no details were added to your wallet. The health centre has been told the number may be wrong, and will contact the patient another way.</p>
            </MHead>
            <div className="screen__foot">
              <MButton onClick={() => { setPath('direct'); setScreen('w4'); }}>Continue setting up my wallet</MButton>
            </div>
          </div>
        )}
      </Phone>
    </PhoneStage>
  );
}
