import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { Card, Icon } from './ui';
import type { TrailEventView } from '../domain/view';
import { STATUS_META, trailHue } from '../domain/status';

/* The append-only status trail. Every entry names the person and facility that wrote it. */
export function StatusTrail({ trail, footnote }: { trail: TrailEventView[]; footnote?: ReactNode }) {
  return (
    <Card title="Status trail">
      <ol className="trail">
        {trail.map((e, i) => (
          <li key={i} className={`trail__item hue--${trailHue(e.status)}`}>
            <span className="trail__icon"><Icon icon={STATUS_META[e.status].icon} size={16} /></span>
            <div className="trail__text">
              <span className="trail__status">{e.status}</span>
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

/* A released result document, as a tinted row with an open link. */
export function ResultTile({ file, meta }: { file: string; meta: string }) {
  return (
    <div className="tile">
      <span className="tile__icon"><Icon icon={FileText} /></span>
      <div className="tile__text">
        <span className="tile__name">{file}</span>
        <span className="tile__meta">{meta}</span>
      </div>
      <a href="#" className="tile__end small" onClick={e => e.preventDefault()}>Open result</a>
    </div>
  );
}
