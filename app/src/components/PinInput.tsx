import { useRef } from 'react';

/* A row of single-digit boxes. Typing advances, Backspace on an empty box steps back, and
   pasting the whole code fills every box. */
export function PinInput({ value, onChange, onEnter, label, masked = true, invalid, className = 'pin' }: {
  value: string[];
  onChange: (next: string[]) => void;
  onEnter?: () => void;
  label: string;
  masked?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const n = value.length;

  const set = (i: number, raw: string) => {
    const d = raw.replace(/[^0-9]/g, '').slice(-1);
    onChange(value.map((q, j) => (j === i ? d : q)));
    if (d && i < n - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className={className} role="group" aria-label={label}>
      {value.map((v, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type={masked ? 'password' : 'tel'}
          inputMode="numeric"
          maxLength={1}
          value={v}
          aria-label={`${label} digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={invalid ? `${className}__box ${className}__box--error` : `${className}__box`}
          onChange={e => set(i, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !v && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'Enter') onEnter?.();
          }}
          onPaste={e => {
            const d = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, n).split('');
            if (d.length < 2) return;
            e.preventDefault();
            onChange(value.map((_, j) => d[j] || ''));
            refs.current[Math.min(d.length, n - 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
