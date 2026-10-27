import { FileText, RotateCcw, Upload } from 'lucide-react';
import { BackButton, Button, Callout, Icon } from '../../../components/ui';
import type { Appointment } from '../../../domain/view';
import { resultFileName, type Lab } from '../useLab';

/* L3 — upload result. Two gates before anything commits: a document, and a spoken
   read-back of name and patient ID. A result on the wrong patient can only be voided. */
export function UploadResult({ lab, sel }: { lab: Lab; sel: Appointment }) {
  const { upload, setUpload } = lab;
  const blocked = !(upload.attached && upload.confirmed);
  const afterVoid = sel.status === 'Result voided' || sel.voided || !!sel.priorVoid;

  return (
    <div className="upload">
      <BackButton onClick={() => lab.setScreen('detail')}>Appointment</BackButton>
      <h1 className="page-title upload__title">Upload result</h1>
      <p className="page-sub">{sel.patient} · {sel.test} · {sel.id}</p>

      {afterVoid && (
        <Callout tone="amber" icon={RotateCcw} title="Previously voided — re-uploaded" className="callout--tight">
          <p>
            {sel.priorVoid
              ? `The earlier result was ${sel.priorVoid.reason} and was voided on ${sel.priorVoid.at} by ${sel.priorVoid.by}.`
              : 'The earlier result for this appointment was voided because it was attached to the wrong patient.'}
          </p>
          <p>Read the name and patient ID back before you attach the replacement. The voided document stays in the record either way.</p>
        </Callout>
      )}

      <div className="card upload__card">
        <div>
          <h2 className="upload__step">1. Attach the result document</h2>
          {upload.attached ? (
            <div className="tile">
              <span className="tile__icon"><Icon icon={FileText} /></span>
              <div className="tile__text">
                <span className="tile__name">{resultFileName(sel)}</span>
                <span className="tile__meta">152 KB · attached just now</span>
              </div>
              <Button variant="outline" className="tile__end" onClick={() => setUpload({ ...upload, attached: false })}>Remove</Button>
            </div>
          ) : (
            /* Prototype: no real file picker, a click stands in for choosing a file. */
            <button type="button" className="dropzone" onClick={() => setUpload({ ...upload, attached: true })}>
              <Icon icon={Upload} /> Choose a PDF or image from this machine
            </button>
          )}
        </div>

        <div>
          <h2 className="upload__step">2. Confirm the patient before it commits</h2>
          <p className="upload__text">Read the name and patient ID back to the person at the counter. A result attached to the wrong patient can only be voided, never deleted.</p>
          <div className="readback">
            <span className="readback__name">{sel.patient}</span>
            <span>Patient ID <span className="tabular">{sel.patientId}</span> · {sel.age} · {sel.sex} · {sel.municipality}</span>
          </div>
          <label className="confirm">
            <input type="checkbox" checked={upload.confirmed}
              onChange={e => setUpload({ ...upload, confirmed: e.target.checked })} />
            <span>I read this name and patient ID back to the patient and they confirmed it.</span>
          </label>
        </div>

        <div className="upload__commit">
          <Button size="lg" icon={Upload} className="upload__button" disabled={blocked}
            onClick={() => { if (!blocked) lab.commitUpload(sel); }}>
            Endorse result
          </Button>
          <span className="upload__hint">
            {blocked
              ? 'Attach the document and confirm the patient first.'
              : 'The referring health centre and the patient are told as soon as you endorse it.'}
          </span>
        </div>
      </div>
    </div>
  );
}
