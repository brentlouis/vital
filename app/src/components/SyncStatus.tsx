import { useEffect, useState } from 'react';
import { CloudCheck, CloudOff } from 'lucide-react';
import { Icon } from './ui';
import { fmt, type Minute } from '../domain/time';

/* Whether this terminal's updates are reaching everyone else, and as of when. RHUs and
   laboratories work on patchy connections, so a list that silently stops updating is worse
   than one that says it is out of date. In this prototype everything is kept in the browser,
   so offline only changes what the bar says. */
export function SyncStatus({ now }: { now: Minute }) {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return (
    <span className={online ? 'sync' : 'sync sync--offline'} role="status">
      <Icon icon={online ? CloudCheck : CloudOff} size={16} />
      {online
        ? <span>Up to date · <span className="tabular">{fmt(now)}</span></span>
        : <span>Offline · your updates are kept on this computer and sent when the connection returns</span>}
    </span>
  );
}
