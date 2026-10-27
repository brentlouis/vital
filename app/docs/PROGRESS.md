# PROGRESS

State only. No reasoning — point to the DECISIONS entry.

Last updated: 2026-10-07

---

## Done

- Project renamed to VITAL — see DECISIONS "Project renamed to VITAL".
- Design system v0.1 (Claude Design `docs/DESIGN.md`); tokens in
  `app/src/styles/tokens/` — see DECISIONS "Design system foundation".
- Prototype brief: v0.4 in Claude Design (not exported); the repo brief is
  `app/docs/PROTOTYPE_BRIEF.md` v0.3.4.
- 44-screen prototype across 7 surfaces, first in Claude Design, then rebuilt in
  Claude Code as the working app in `app/` (now the source of truth): patient
  wallet, RHU portal, laboratory portal, patient onboarding, facility onboarding,
  staff access, admin verification.
- Tech stack decided — see DECISIONS "Tech stack". Prototype stack — see
  "Prototype stack".
- R8 / L8 Access denied built — see DECISIONS "Access denied is a screen, not an
  empty state".
- Outgoing rows offer only the referring view's action — see DECISIONS "Outgoing
  rows open the referring view, never the receiving one".
- Receive-only portal configuration restored; Facility picker in the laboratory
  portal — see DECISIONS "Facility capabilities replace facility type".
- Internal orders — see DECISIONS "Internal orders: a third origin".
- Flow rules as one table, one shared store, 136 tests replaying the seed against
  the brief — see DECISIONS "Prototype stack".
- Design and feature audit (critique 24/40, technical audit 11/20; report in
  `.impeccable/critique/`) and its fixes: safety, typography, layout, wallet
  wording, accessibility, polish.
- Referral safety — see DECISIONS "Consent recorded at the counter when a referral
  is sent", "The referral form starts empty", "Undo: one-tap steps only, for 15
  minutes".
- Redesign — see DECISIONS "Typography: Atkinson Hyperlegible", "Staff portals:
  navigation rail, split workspace, request first", "Wallet: next step first,
  plain words", "Prototype controls hidden".
- Undo appends a withdrawal instead of removing the step; queue rows lose their
  step buttons — see DECISIONS "Undo appends a withdrawal", "Steps are taken on the
  appointment, not the queue row".
- Detail order: status buttons at the bottom, result steps in the Result card; three-line
  work list entries — see DECISIONS "Read first, act at the bottom".
- Wallet overhaul: notification-style home, Appointments tab, search and filters on long
  lists, patient ID card in Details — see DECISIONS "Wallet: home is the notifications,
  enlarged; five tabs".
- Doctor visits: booked from the wallet, received by the health centre and clinics, tests
  ordered from the visit — see DECISIONS "Doctor visits".
- Visits/tests split, visit rescheduling, test search, day-grouped times, quieter wallet —
  see DECISIONS "Visits and tests apart".
- Brand: logo, six logo files and the shared brand kit page — see DECISIONS
  "Brand: the four-circle mark".
- 42 screenshots of every screen (`screenshots/`, `VITAL-screenshots.zip`).
- Pitch screenshots by core function in `screenshots/pitch/core-functions/`, described in
  `screenshots/pitch/DESCRIPTIONS.md` (2026-10-08).
- Pilot measures, audit log, reported issues, plan and usage; fair ranking with Premium+ track
  records; doctor-visit rebooking fixed; day schedule lists bookings only.
- Phase 1 budget and concept note Section X — see DECISIONS "Phase 1 budget".
  Budget worksheet in `budget/VITAL_Budget_Worksheet.xlsx`.
- Prototype work moved to Claude Code.

- Priority appointments (form choice with reason, queue chip and order, wallet note) and wait/result estimates (`domain/estimate.ts`, wallet and lab request card), with tests. See DECISIONS "Priority appointments" and "Wait and result estimates".
- Suggested and automatic appointment times (Pick for me / Choose a time; lab re-pick for auto bookings; Let VITAL pick / Set manually when proposing). See DECISIONS "Appointment times".

## Next

- Write doctor visits (DECISIONS "Doctor visits") into the repo brief §1–§2.
- Write the v0.4-only behaviours into the repo brief: facility capabilities,
  booking eligibility and exclusion reasons, R8 / L8 Access denied.
- Re-run the design critique to measure the fixes (was 24/40).
- Wallet trail: order label; superseded entries carry no live actions — brief
  §6.5 (v0.4 numbering; check it still applies).
- Laboratory power features: search, sort, bulk receive-and-accept.
- Bisaya / English switch, with a native speaker translating.
- MVP build order: schema and append-only grants → auth → the one referred path
  → consent check on every read → status trail on all three surfaces →
  everything else.

## Blocked

- Any screen committing to post-revocation behaviour — blocked on the consent
  legal question.

## Open questions

- Concept note: status trail and Objective 5 still say "Created" and
  "Appointment Scheduled"; 30% claim scoped to referred appointments only;
  System Integration Layer is Phase 2.
- Data residency for Singapore hosting, and which host (Render/Railway vs the
  Lightsail pricing in the budget) — see DECISIONS "Tech stack".
- Offline and pending states specified in DESIGN.md §7.5: a sync status is drawn
  in the queues; a real offline queue is not.
- Audit log has no view — decide deliberately whether to defer.
- Tier metering on active-patient count creates a clinical ceiling.
- Hospitals need a terminal state for a care episode before they can be added.
- Patients sharing one mobile number, and patients with no phone.
- Check whether "VITAL" is already in use in health tech.
- Baseline timing definition — record before measuring. Referred only.
- Lawyer quotation and DICT/PSC XI allowable expenses for the budget.
