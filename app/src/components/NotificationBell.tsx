import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Icon } from './ui';
import { ago, type Minute } from '../domain/time';
import type { Notice } from '../domain/notify';

/* A facility's notifications, as a dropdown from the session bar (a dropdown is one of the
   three surfaces the design system lets cast a shadow). Opening it marks everything read. */
export function NotificationBell({ notices, seenAt, now, onOpen, onSeen }: {
  notices: Notice[];
  seenAt: Minute;
  now: Minute;
  onOpen: (appointmentId: string) => void;
  onSeen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const unread = notices.filter(n => n.at > seenAt).length;

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('.bellbox__item')?.focus();
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') { setOpen(false); bellRef.current?.focus(); }
        return;
      }
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', close); };
  }, [open]);

  return (
    <div className="bellbox" ref={ref}>
      <button ref={bellRef} type="button" className="btn btn--outline btn--md" aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => { if (!open) onSeen(); setOpen(o => !o); }}>
        <Icon icon={Bell} size={16} />
        {unread > 0 && <span className="bellbox__count tabular">{unread}</span>}
      </button>
      {open && (
        <div className="bellbox__panel" role="dialog" aria-label="Notifications">
          <span className="bellbox__title">Notifications</span>
          {notices.length === 0 && <span className="muted small">Nothing yet.</span>}
          <ul className="bellbox__list">
            {notices.slice(0, 12).map((n, i) => (
              <li key={`${n.appointmentId}-${n.at}-${i}`}>
                <button type="button" className={`bellbox__item tone--${n.tone}`} onClick={() => { setOpen(false); onOpen(n.appointmentId); }}>
                  <span className="bellbox__kind">{n.kind}{n.at > seenAt && <span className="bellbox__new">New</span>}</span>
                  <span className="bellbox__msg">{n.message}</span>
                  <span className="bellbox__at tabular">{n.appointmentId} · {ago(now, n.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
