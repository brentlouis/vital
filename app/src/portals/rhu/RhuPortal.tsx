import { useEffect } from 'react';
import { ConfirmDialog, Pills } from '../../components/ui';
import { PrototypeBar, PrototypeLabel, SessionBar } from '../../components/PortalChrome';
import { AccessDenied } from '../../components/AccessDenied';
import { RHU, person } from '../../domain/reference';
import { FacilityBell } from '../../components/FacilityBell';
import { useRhu, type Screen } from './useRhu';
import { PatientSearch, RhuQueue } from './screens/RhuQueue';
import { ReferralForm } from '../../components/referral/ReferralForm';
import { RhuDetail } from './screens/RhuDetail';

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'queue', label: 'R1 Appointment queue' },
  { id: 'new', label: 'R2 Create appointment' },
  { id: 'detail', label: 'R3–R6 Appointment detail' },
  { id: 'search', label: 'R7 Patient search' },
  { id: 'denied', label: 'R8 Access denied' },
];

/* RHU / health-centre portal — the referring side. Desktop, shared terminal, compact. */
export function RhuPortal() {
  const rhu = useRhu();
  const { screen, selected } = rhu;

  useEffect(() => { document.title = 'VITAL — RHU portal'; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen, selected?.id]);

  return (
    <div className="portal" data-density="compact">
      <SessionBar name={rhu.viewer.name} line={`${rhu.title} · ${RHU}`} facility={RHU}
        bell={<FacilityBell facility={RHU} onOpen={rhu.openDetail} />} />
      <PrototypeBar>
        <PrototypeLabel>Prototype screens</PrototypeLabel>
        <Pills items={SCREENS} value={screen} onChange={rhu.setScreen} />
      </PrototypeBar>

      <main className="portal__main">
        {screen === 'queue' && <RhuQueue rhu={rhu} />}
        {screen === 'new' && <ReferralForm rf={rhu.referral} onSend={rhu.send} onDiscard={() => rhu.setScreen('queue')} />}
        {screen === 'detail' && selected && <RhuDetail rhu={rhu} sel={selected} />}
        {screen === 'search' && <PatientSearch rhu={rhu} />}
        {screen === 'denied' && <AccessDenied facility={RHU} backLabel="Appointment queue" onBack={() => rhu.setScreen('queue')}
          patient={rhu.deniedFor ? person(rhu.deniedFor).name : undefined} />}
      </main>

      <ConfirmDialog spec={rhu.dialog} onClose={() => rhu.setDialog(null)} />
    </div>
  );
}
