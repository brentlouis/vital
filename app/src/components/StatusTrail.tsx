import type { ReactNode } from 'react';
import { FileText, Undo2 } from 'lucide-react';
import { Card, Icon } from './ui';
import type { TrailEventView } from '../domain/view';
import { STATUS_META, trailHue } from '../domain/status';

/* The append-only status trail. Every entry names the person and facility that wrote it. A
   step taken back by mistake stays, struck through, followed by the entry that withdrew it. */
export function StatusTrail({ trail, footnote }: { trail: TrailEventView[]; footnote?: ReactNode }) {
  return (
    <Card title="Status trail">
      <ol className="trail">
        {trail.map((e, i) => (
          <li key={i} className={e.withdrawal || e.withdrawn ? 'trail__item trail__item--withdrawn' : `trail__item hue--${trailHue(e.status)}`}>
            <span className="trail__icon"><Icon icon={e.withdrawal ? Undo2 : STATUS_META[e.status].icon} size={16} /></span>
            <div className="trail__text">
              {e.withdrawal
                ? <span className="trail__status">Withdrew “{e.status}” — taken by mistake</span>
                : <span className="trail__status">{e.withdrawn ? <><s>{e.status}</s> <span className="trail__tag">Withdrawn</span></> : e.status}</span>}
              <span className="trail__meta">{e.actor} · {e.facility}</span>
              <span className="trail__meta tabular">{e.at}</span>
            </div>
          </li>
        ))}
      </ol>
      {footnote && <p className="footnote">{footnote}</p>}
    </Card>
  );
}

/* A released result document, as a tinted row. The prototype has no document viewer, so
   it names the file rather than offering a link that would do nothing. */
export function ResultTile({ file, meta }: { file: string; meta: string }) {
  return (
    <div className="tile">
      <span className="tile__icon"><Icon icon={FileText} /></span>
      <div className="tile__text">
        <span className="tile__name">{file}</span>
        <span className="tile__meta">{meta}</span>
      </div>
    </div>
  );
}
