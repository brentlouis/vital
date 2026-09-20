import { useEffect } from 'react';
import { ConfirmDialog, Pills } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { FacilityBell } from '../../components/FacilityBell';
import { CONFIGS, useLab, type Screen } from './useLab';
import { Queue } from './screens/Queue';
import { Detail } from './screens/Detail';
import { UploadResult } from './screens/UploadResult';
import { DaySchedule } from './screens/DaySchedule';
import { AccessDenied } from '../../components/AccessDenied';
import { ReferralForm } from '../../components/referral/ReferralForm';

type ScreenPill = Screen | 'noshow';

const SCREENS: { id: ScreenPill; label: string }[] = [
  { id: 'queue', label: 'L1 Incoming queue' },
  { id: 'detail', label: 'L2 / L4 / L5 Appointment detail' },
  { id: 'upload', label: 'L3 Upload result' },
  { id: 'day', label: 'L6 Day schedule' },
  { id: 'noshow', label: 'L7 Detail — no-show' },
  { id: 'denied', label: 'L8 Access denied' },
];

/* Only a facility with can_refer set creates outgoing appointments. */
const REFER_SCREENS: { id: ScreenPill; label: string }[] = [
  { id: 'new', label: 'L9 Create appointment' },
];

/* Laboratory portal — the receiving side. Desktop, shared terminal, compact density. */
export function LabPortal() {
  const lab = useLab();
  const { screen, selected } = lab;

  useEffect(() => { document.title = 'VITAL — Laboratory portal'; }, []);
  /* Each screen change starts at the top, as a page navigation would. */
  useEffect(() => { window.scrollTo(0, 0); }, [screen, selected?.id]);

  const activePill: ScreenPill = screen === 'detail' && selected?.status === 'No-show' ? 'noshow' : screen;
  const goPill = (id: ScreenPill) => (id === 'noshow' ? lab.openFirst('No-show') : lab.setScreen(id));

  return (
    <div className="portal" data-density="compact">
      <SessionBar name={lab.staff} line={`${lab.title} · ${lab.signedIn}`} facility={lab.signedIn}
        bell={<FacilityBell facility={lab.signedIn} onOpen={lab.openDetail} />} />

      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={lab.merged ? [...SCREENS, ...REFER_SCREENS] : SCREENS} value={activePill} onChange={goPill} />
        <PrototypeLabel spaced>Facility</PrototypeLabel>
        <Pills items={[...CONFIGS]} value={lab.signedIn} onChange={lab.pickConfig} />
      </PrototypeBar>

      <main className="portal__main">
        {screen === 'queue' && <Queue lab={lab} />}
        {screen === 'detail' && selected && <Detail lab={lab} sel={selected} />}
        {screen === 'upload' && selected && <UploadResult lab={lab} sel={selected} />}
        {screen === 'day' && <DaySchedule lab={lab} />}
        {screen === 'new' && lab.merged && (
          <ReferralForm rf={lab.referral} onSend={lab.sendReferral} onDiscard={() => lab.setScreen('queue')} backLabel="Appointment queue" />
        )}
        {screen === 'denied' && <AccessDenied facility={lab.signedIn} backLabel="Queue" onBack={() => lab.setScreen('queue')} />}
      </main>

      <ConfirmDialog spec={lab.dialog} onClose={() => lab.setDialog(null)} />
    </div>
  );
}
