# VITAL prototype

Front-end-only proof of concept for the VITAL referral network, built from the Claude Design
bundle in `../vital/project`. There is no backend: all data is synthetic and lives in this
browser.

```bash
npm install
npm run dev     # the app, at http://localhost:5173
npm test        # the flow rules and the seed, checked against the brief
```

Open http://localhost:5173 for an index of every surface.

## Surfaces

Listed in walkthrough order: facilities join and are verified, staff sign in, a patient
signs up, then an appointment travels from the RHU to the patient and the lab.

| Surface | Route | Screens |
|---|---|---|
| Facility onboarding | `/onboarding/facility` | F1–F5 |
| Admin verification | `/admin` | A1–A2 |
| Staff access | `/staff` | S1–S4 (sign in as e.g. `mcabahug@loonheritagelab.ph` with any password; demo PIN 4021) |
| Patient onboarding | `/onboarding/patient` | W1–W6 (demo code 402118) |
| RHU portal | `/rhu` | R1–R8 |
| Patient wallet | `/wallet` | P1–P11 |
| Laboratory portal | `/lab` | L1–L8, plus L9 Create appointment (referral or internal order) for a clinic that refers and receives |

**Every surface shares one set of records.** A referral sent from the RHU portal arrives in
the laboratory's queue and the patient's wallet; a patient revoking access in the wallet shows
as withdrawn in the laboratory. State is saved in this browser's localStorage, so a reload keeps
it, and two tabs — say the RHU in one and the laboratory in another — stay in sync live.

Every surface looks like the finished product: the prototype's own controls are hidden. Add
`?demo` to any address to show them for that browser tab (`?demo=off` hides them again). They
are a screen switcher and a **demo clock** — "+1 hour" and "+1 day" move time forward so slots
go overdue, proposed times run out and reminders arrive on their own. The start page has
**Reset demo data**, which returns every surface to the seed, and a link to the laboratory
portal as a clinic that refers and receives.

## Spec

[`docs/PROTOTYPE_BRIEF.md`](docs/PROTOTYPE_BRIEF.md) is the product brief: the appointment model, the
state machine, facility matching and every screen. Change it together with the code.

[`docs/DECISIONS.md`](docs/DECISIONS.md) records why things are the way they are (append-only), and
[`docs/PROGRESS.md`](docs/PROGRESS.md) what is done, next, blocked and open.

## Layout

- `src/domain/` — the rules, with no React in them.
  - `flow.ts`: the brief's §2.1 events table as data. Every screen asks it which buttons to
    show, and the store refuses any write it does not allow.
  - `seed.ts`: the starting data, written as one story per appointment.
  - `reference.ts`: facilities, staff, tests, published schedules, patients.
  - `view.ts`, `access.ts`, `notify.ts`: how an appointment reads on screen, who may read it
    (consent), and who is told about each event.
  - `time.ts`: the demo clock and date formatting.
  - `flow.test.ts`: replays every seeded appointment against the rules.
- `src/store/` — the shared state (`state.ts`, with `state.test.ts`), and the React provider
  that saves it and syncs tabs.
- `src/components/` — shared React pieces: portal chrome, notification bell, demo clock, phone
  frame, status trail, referral form, and `steps.ts` (how each step looks as a button).
- `src/portals/<surface>/` — one folder per surface.
- `src/styles/` — design tokens (copied unchanged from `vital/project/vital/tokens`), shared
  components, compact desktop surfaces (`portal.css`) and phone surfaces (`mobile.css`).

The prototype bar (shown with `?demo`) is a demo aid for jumping between screens,
configurations and time. It is not product UI.
