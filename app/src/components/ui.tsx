import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Building2, ChevronLeft, CircleCheck, Hospital, Smartphone, X, type LucideIcon } from 'lucide-react';
import type { Origin, Status } from '../domain/types';
import { STATUS_META } from '../domain/status';

/* Lucide at the system stroke: 1.5px, 20px default, 16px inside badges and buttons. */
export function Icon({ icon: I, size = 20 }: { icon: LucideIcon; size?: number }) {
  return <I size={size} strokeWidth={1.5} absoluteStrokeWidth={false} aria-hidden="true" className="icon" />;
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={`badge badge--${m.group}`}>
      <Icon icon={m.icon} size={16} />
      {status}
    </span>
  );
}

export function Chip({ icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <span className="chip">
      {icon && <Icon icon={icon} size={14} />}
      {children}
    </span>
  );
}

export function OriginChip({ origin, children }: { origin: Origin; children?: ReactNode }) {
  const icon = origin === 'Personal' ? Smartphone : origin === 'Internal' ? Hospital : Building2;
  return <Chip icon={icon}>{children ?? origin}</Chip>;
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger-outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary', size = 'sm', block, icon, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize; block?: boolean; icon?: LucideIcon;
}) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon icon={icon} size={size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
}

export function BackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      <Icon icon={ChevronLeft} size={16} />
      {children}
    </button>
  );
}

/* Tinted panel with an icon and a hairline outline in its own hue. Amber is attention, clay
   is failure, keylime is informational. The 3px left stripe is reserved for queue rows,
   where it marks status down a long table. */
export function Callout({
  tone, icon, title, children, className,
}: { tone: 'amber' | 'clay' | 'keylime'; icon: LucideIcon; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={['callout', `callout--${tone}`, className].filter(Boolean).join(' ')}>
      <span className="callout__icon"><Icon icon={icon} /></span>
      <div className="callout__body">
        {title && <span className="callout__title">{title}</span>}
        {children}
      </div>
    </div>
  );
}

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={['card', className].filter(Boolean).join(' ')}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </section>
  );
}

/* Label/value grid used on detail screens. */
export function Facts({ rows, inset, wide }: { rows: [ReactNode, ReactNode, boolean?][]; inset?: boolean; wide?: boolean }) {
  return (
    <dl className={['facts', inset && 'facts--inset', wide && 'facts--wide'].filter(Boolean).join(' ')}>
      {rows.map(([k, v, tabular], i) => (
        <div key={i} className="facts__row">
          <dt>{k}</dt>
          <dd className={tabular ? 'tabular' : undefined}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface TabItem<T extends string> { id: T; label: string; count?: number }

export function Tabs<T extends string>({ items, value, onChange, label }: {
  items: TabItem<T>[]; value: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="tabs" onKeyDown={e => {
      /* Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern). */
      const i = items.findIndex(t => t.id === value);
      const next = e.key === 'ArrowRight' ? (i + 1) % items.length
        : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length
          : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      onChange(items[next].id);
      const tabs = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs[next]?.focus();
    }}>
      {items.map(t => (
        <button
          key={t.id} type="button" role="tab" aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className="tabs__tab" onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="tabs__count tabular">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* Segmented pill switcher used by the prototype chrome. */
/* A two- or three-way switch for which set of records a page shows (Incoming / Outgoing).
   Deliberately unlike the status tabs, so the two kinds of choice never read as one row. */
export function Segmented<T extends string>({ items, value, onChange, label }: {
  items: { id: T; label: string; count?: number }[]; value: T; onChange: (id: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {items.map(it => (
        <button key={it.id} type="button" className="segmented__item" aria-pressed={it.id === value} onClick={() => onChange(it.id)}>
          {it.label}
          {it.count !== undefined && <span className="segmented__count tabular">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string>({ items, value, onChange }: {
  items: { id: T; label: string }[]; value: T | null; onChange: (id: T) => void;
}) {
  return (
    <div className="pills">
      {items.map(p => (
        <button key={p.id} type="button" className="pill" aria-pressed={p.id === value} onClick={() => onChange(p.id)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* Destructive confirmation. Names the consequence before the action is offered. */
export interface DialogSpec {
  title: string;
  body: string;
  action: string;
  cancel: string;
  onConfirm: () => void;
}

export interface ToastSpec {
  message: string;
  /** Offered only for a step that can still be taken back. */
  undo?: () => void;
  /** Distinguishes two toasts with the same words, so the timer restarts. */
  key: number;
}

/* Confirms that a step was written, and for a one-tap step offers to take it back. The live
   region is always mounted so a screen reader announces each new message. */
export function Toast({ toast, onClose }: { toast: ToastSpec | null; onClose: () => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => closeRef.current(), 8000);
    return () => window.clearTimeout(t);
  }, [toast]);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.key}>
          <span className="toast__icon"><Icon icon={CircleCheck} size={18} /></span>
          <span className="toast__message">{toast.message}</span>
          {toast.undo && (
            <button type="button" className="toast__undo" onClick={() => { toast.undo!(); onClose(); }}>Undo</button>
          )}
          <button type="button" className="toast__close" aria-label="Dismiss" onClick={onClose}><Icon icon={X} size={16} /></button>
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({ spec, onClose }: { spec: DialogSpec | null; onClose: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  /* Focus lands on the safe choice when the dialog opens; Escape always closes. */
  useEffect(() => {
    if (!spec) return;
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeRef.current(); return; }
      /* Keep Tab inside the dialog: the page behind it is not reachable until it closes. */
      if (e.key !== 'Tab' || !boxRef.current) return;
      const items = [...boxRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')];
      if (!items.length) return;
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      else if (!boxRef.current.contains(document.activeElement)) { e.preventDefault(); firstEl.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [spec]);
  if (!spec) return null;
  return (
    <div className="scrim">
      <div ref={boxRef} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-body" className="dialog">
        <h2 id="dialog-title" className="dialog__title">{spec.title}</h2>
        <p id="dialog-body" className="dialog__body">{spec.body}</p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="btn btn--ghost btn--md" onClick={onClose}>{spec.cancel}</button>
          <button type="button" className="btn btn--danger btn--md" onClick={spec.onConfirm}>{spec.action}</button>
        </div>
      </div>
    </div>
  );
}
