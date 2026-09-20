import { Clock, RotateCcw } from 'lucide-react';
import { useDemo } from '../store/context';
import { fmtSlot, HOUR, DAY } from '../domain/time';
import { Icon } from './ui';

/* Prototype-only: the demo clock, and a way to move it. Jumping forward shows what time does
   on its own — an accepted slot going overdue, a proposed time running out, a reminder
   arriving. "Reset demo" returns every surface to the seed. */
export function DemoClock() {
  const { now, tick, reset } = useDemo();
  return (
    <div className="democlock" role="group" aria-label="Demo clock">
      <span className="democlock__time tabular"><Icon icon={Clock} size={14} />{fmtSlot(now)}</span>
      <button type="button" className="pill" onClick={() => tick(HOUR)}>+1 hour</button>
      <button type="button" className="pill" onClick={() => tick(DAY)}>+1 day</button>
      <button type="button" className="pill" onClick={() => {
        if (window.confirm('Reset the demo? Every surface returns to its starting data.')) reset();
      }}><span className="democlock__reset"><Icon icon={RotateCcw} size={12} />Reset demo</span></button>
    </div>
  );
}
