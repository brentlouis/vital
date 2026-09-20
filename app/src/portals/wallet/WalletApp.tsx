import { useEffect } from 'react';
import { Ms, Phone, PhoneStage } from '../../components/Phone';
import { SCREENS, useWallet, type Screen } from './useWallet';
import { ConsentList, Detail, Documents, Home, Notifications, Profile, Proposed, Revoke } from './screens';
import { BookFacility, BookTests, Booked } from './booking';

const TABS: { id: Screen; label: string; glyph: string; covers: Screen[] }[] = [
  { id: 'home', label: 'Home', glyph: 'home', covers: ['detail', 'bookTests', 'bookFacility', 'booked', 'proposed'] },
  { id: 'docs', label: 'Documents', glyph: 'description', covers: [] },
  { id: 'consent', label: 'Access', glyph: 'shield', covers: ['revoke'] },
  { id: 'profile', label: 'Details', glyph: 'person', covers: [] },
];

/* Patient health wallet — Android, comfortable density, serif titles. */
export function WalletApp() {
  const w = useWallet();
  const { screen, selected } = w;

  useEffect(() => { document.title = 'VITAL — Patient wallet'; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const bell = (
    <button type="button" className={screen === 'notifications' ? 'bell bell--on' : 'bell'}
      aria-label={w.unreadCount > 0 ? `Notifications, ${w.unreadCount} unread` : 'Notifications'}
      onClick={() => w.setScreen('notifications')}>
      <Ms glyph="notifications" />
      {w.unreadCount > 0 && <span className="pill-new">{w.unreadCount} new</span>}
    </button>
  );

  const tabbar = TABS.map(t => {
    const on = screen === t.id || t.covers.includes(screen);
    return (
      <button key={t.id} type="button" className="tab" aria-current={on ? 'page' : undefined} onClick={() => w.setScreen(t.id)}>
        <Ms glyph={t.glyph} />{t.label}
      </button>
    );
  });

  return (
    <PhoneStage screens={SCREENS} value={screen} onChange={w.setScreen} pillStyle="forest">
      <Phone headerEnd={bell} tabbar={tabbar}>
        {screen === 'home' && <Home w={w} />}
        {screen === 'detail' && selected && <Detail w={w} sel={selected} />}
        {screen === 'docs' && <Documents w={w} />}
        {screen === 'consent' && <ConsentList w={w} />}
        {screen === 'revoke' && <Revoke w={w} />}
        {screen === 'bookTests' && <BookTests w={w} />}
        {screen === 'bookFacility' && <BookFacility w={w} />}
        {screen === 'booked' && <Booked w={w} />}
        {screen === 'profile' && <Profile />}
        {screen === 'notifications' && <Notifications w={w} />}
        {screen === 'proposed' && selected && <Proposed w={w} sel={selected} />}
      </Phone>
    </PhoneStage>
  );
}
