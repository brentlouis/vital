# DECISIONS

Why things are the way they are. Append-only. Never delete an entry — mark it
Superseded and write the new one.

**Where the references point (reconciled 2026-10-07).** Entries written in Claude
Design cite `docs/DESIGN.md` and brief **v0.4**. Neither is in this repo. The
spec here is `app/docs/PROTOTYPE_BRIEF.md` **v0.3.4**, which forked from v0.3.1
when work moved to Claude Code, so its section numbers differ from v0.4. The
design tokens live in `app/src/styles/tokens/`. Where a v0.4-only behaviour is
built in the app but not yet written into the repo brief, the entry says so.

---

## Project renamed to VITAL

**Decision:** The platform is VITAL. The name MedAccess is retired.

**Why:** Team decision. Recorded here because the name appears in every screen
header, the wordmark, the repo, the deck and the concept note, and a mismatch
between the note a panel is holding and the prototype on screen reads as scope
that hasn't been thought through.

**Also considered:** n/a.

**Open action:** ~~The concept note still says MedAccess~~ — done: the PSC XI
concept note draft (UnDecided_Concept-Note_PSCXI_Template-3) reads "VITAL: Virtual
Integrated Transfer and Access Link" throughout. Still open: check whether
"VITAL" is already in use in health tech (DTI/SEC business name search, domain
availability). The repo and the wordmark now carry it.

**Status:** Current

---

## Design system foundation

**Decision:** Adopt the Ease Health style reference (styles.refero.design) as
the VITAL visual foundation — palette, surface layering, shadowless approach,
serif/sans pairing. Extend it with a semantic status system, two density modes,
a renormalized 4px spacing scale, and the product components a marketing-site
extraction lacks. Recorded in `docs/DESIGN.md` (Claude Design; not in this repo —
the tokens are in `app/src/styles/tokens/`).

**Why:** Three surfaces (patient wallet, RHU portal, laboratory portal) are
judged by a panel in one sitting; without fixed tokens they diverge and read as
unfinished. Four source rules were overridden deliberately: no-new-hues (the
palette cannot express failure, and the status trail is the product),
no-colored-borders (status-bordered queue rows), no-shadows (scrims and dialogs
only), and generous-padding (staff tools need compact density). Commercial fonts
replaced with Cormorant Garamond and Inter at the outset so the prototype and
the build use the same type — prototyping in undeployable fonts shifts every
screen on swap. All body-text contrast pairs verified against WCAG AA and
recorded in the file; status is never carried by colour alone, because clay and
amber are exactly the pair red-green colour vision deficiency affects and the
deck may be printed in grayscale.

**Also considered:** Impilo (same gallery) — rejected as a dark-mode marketing
aesthetic unsuited to daylight shared terminals and to patient trust. Designing
tokens from scratch — rejected as slower with no gain at this stage.

**Open action:** Five judgment calls in the file are defaults, not settled:
serif banished from both portals, 12px radius, compact density figures, dropped
uppercase eyebrows, and the five-bucket status grouping. Revisit after the first
real queue screen exists. *Update 2026-10-07:* the serif is now gone everywhere
(see "Typography: Atkinson Hyperlegible"); the laboratory queue uses the five
buckets (New, Accepted, Awaiting patient, Reschedule proposed, Completed) and the
RHU uses four (All, In flight, Needs follow-up, Closed); 12px radius, compact
density and no eyebrows are in use and unchallenged.

**Status:** Current — the font choice is superseded by "Typography: Atkinson
Hyperlegible"

---

## Referral path, state machine, and prototype scope

**Decision:** The single referral story is RHU → laboratory, told identically in
the concept note, prototype and pitch. Overdue is derived from elapsed time and
never written as an event; No-show is a real event with a named actor. Endorsed
(laboratory releases the result) and Completed (RHU acknowledges it) remain
separate states with separate actors. A wrong-patient result is a document
incident — voided, never deleted — returning the referral to Patient arrived.
Prototype scope is fixed at 17 screens across the three MVP surfaces. Recorded
in `docs/PROTOTYPE_BRIEF.md`. *Superseded in part:* the prototype now has 44
screens across seven surfaces (the three MVP surfaces plus facility onboarding,
admin verification, staff access and patient onboarding).

**Why:** A laboratory referral terminates in a returnable artifact, so
"Completed" is definable and the referral clock has a measurable stop; a
hospital referral terminates in a care episode that cannot be closed or measured
inside a 4-6 week pilot. Overdue is the absence of an event and therefore has no
actor — writing a system-generated event would put unperformed entries in an
append-only legal artifact and force the audit log to name a cron job as the
actor. Splitting Endorsed from Completed preserves the evidence that the
referring provider learned the outcome, which is the loop the platform exists to
close. Voiding rather than deleting a misfiled result keeps the trail
append-only under correction, which is the case a privacy review will probe.

**Also considered:** RHU → hospital, matching the concept note's current
narrative — rejected as unmeasurable within the pilot. Merging Overdue and
No-show into one state — rejected; it forces either system-authored events or
storing status as an editable field, and both break the rule that status is
derived from the trail.

**Open action:** ~~Concept note narrative reads RHU → hospital~~ — done: the
concept note now focuses the pilot on "the referral and lab-result workflow
between RHUs, clinics, and laboratories". Still inconsistent: its status trail
(Section III item 5) and Objective 5 list "Created" and "Appointment Scheduled",
neither of which exists — see "Created removed: a referral starts at Sent".

**Status:** Current

---

## Open — not yet decided

These are recorded so they are not quietly answered by a screen.

- ~~Patient identity matching across facilities~~ — resolved, see "Patient
  identity: the wallet is the single source, matched on mobile number".
- **Legal sufficiency of patient-held consent** between two facilities under the
  Data Privacy Act. Can invalidate the architecture, not just a feature.
- **Consent revocation on an in-flight referral** — what the receiving facility
  sees afterwards. Leaning toward: referral remains visible as revoked with
  clinical content removed, since a facility that has seen a patient cannot
  un-see them and a vanishing record is itself a data-integrity problem. Legal
  question, not a design one. The prototype draws the leaning answer ("Details
  withdrawn" rows) without committing to it.
- ~~Who presses "Patient did not arrive."~~ — resolved by the appointment model;
  the facility owns it. See "Tracked object becomes an Appointment with two
  origins".
- **Baseline timing definition.** Proposed: clock start = provider decides a
  referral is needed; clock stop = receiving facility acknowledges receipt.
  Record as a decision before anyone holds a stopwatch.
- ~~Tech stack~~ — resolved, see "Tech stack".

---

## Tracked object becomes an Appointment with two origins

**Decision:** The tracked object is an Appointment — a booked slot at a receiving
facility — with two origins. A **referred appointment** is created by a provider
at an RHU or clinic; a **personal appointment** is booked by the patient
directly. Both share one status trail, one vocabulary and one consent model; a
personal appointment skips Created and Sent and starts at Booked. Completed takes
a different actor per origin: the RHU for referred, the patient for personal.
No-show moves from the RHU to the receiving facility. Scheduling is UI-layer
only — no capacity management, conflict resolution or facility-side slot
configuration in the MVP. Recorded in docs/PROTOTYPE_BRIEF.md v0.2.

**Why:** Some services need a provider's clinical decision and some do not —
vaccination and routine screening are walk-in by nature, so a model that requires
an RHU step for every encounter does not describe how patients actually seek
care. The rename is not cosmetic: an Appointment carries scheduled_at and a
Referral never did. That field resolves the project's riskiest open question.
Under v0.1 nobody could reliably press "Patient did not arrive" — the laboratory
had the knowledge and no incentive, the RHU had the incentive and no knowledge.
A booked slot gives the facility both, because a missed slot is a wasted slot and
they know when it passed. Overdue stops being a guess computed from elapsed time
and becomes a concrete missed appointment.

**Also considered:** Keeping Referral as the object and treating walk-ins as out
of scope — rejected; the instructor's rabies-clinic example is a real and common
encounter type and excluding it makes the platform describe a narrower slice of
care than it claims. Collapsing the RHU portal into the wallet — rejected; the
portal is not redundant for referred appointments, and a personal appointment has
no RHU step to collapse because no provider decision occurred.

**Open action:** The 30% turnaround claim covers referred appointments only —
a personal appointment has no provider decision and therefore no clock start.
State the scoping explicitly in the concept note.

**Status:** Current — supersedes the No-show assignment in "Referral path, state
machine, and prototype scope". Two details superseded later: there is no Created
status any more ("Created removed: a referral starts at Sent"), and there are now
three origins ("Internal orders: a third origin").

---

## Facility ranking and partner disclosure

**Decision:** Facilities are filtered by a multi-select test filter and ranked in
two bands: full match (offers every selected test) above partial match. Tier
orders facilities within a band and never across one — a partner facility with a
partial match never outranks a non-partner with a full match. Any facility ranked
up by its subscription carries a visible "Partner facility" label on the row in
the list, where the choice is made. Recorded in docs/PROTOTYPE_BRIEF.md v0.2 §3.

**Why:** Ranking on test coverage is a factual capability match and is
defensible. Ranking on who pays is paid placement inside a health platform, and
undisclosed paid placement steers patients toward facilities on commercial rather
than clinical grounds. Disclosure at the point of choice is what separates a
legitimate business model from steering; a label in a tooltip or on a detail
screen is not disclosure, because the decision has already been made by then.
Band separation is the harder guarantee: it means a patient can never receive a
worse clinical fit because a facility subscribes.

**Also considered:** Tier as a free-floating rank multiplier across all results —
rejected, it allows a partner partial match to outrank a non-partner full match.
No commercial ranking at all — rejected as unnecessary; disclosed within-band
ordering carries no clinical cost.

**Open action:** Laboratory tiers are proposed to meter on number of active
patients. Every behaviour at the cap — refuse, queue, or drop out of patient
suggestions — bounds a patient's access to a test by their laboratory's billing
plan. Recommended alternative: meter on volume processed in the prior month.
Raise with the team before it reaches the concept note.

**Status:** Current

---

## referred_by is a note, not an actor

**Decision:** Personal appointments carry an optional free-text referred_by
field. It grants no access, never appears in the status trail, is never an actor
in the audit log, and no screen calls it a referral. Labelled "Referred by
(optional)" with helper text stating that it does not give access to records.
Recorded in docs/PROTOTYPE_BRIEF.md v0.2 §4.

**Why:** A referral is authoritative because an authenticated provider at a known
facility created it and that act wrote a verifiable actor into an append-only
audit trail. A patient-typed name has none of that behind it. If the field
granted access, a patient could grant record access to a person who never
authenticated, never consented and may not be a VITAL user at all — a Data
Privacy Act problem rather than a UX detail. Implementing it safely would require
person-scoped rather than facility-scoped consent grants and an authenticated
identity for the named provider, neither of which exists.

**Also considered:** Granting the named provider read access to the result —
rejected on the above. Omitting the field entirely — rejected; a patient already
seen at a clinic has real context the receiving facility wants, and a plain note
carries it at no architectural cost.

**Status:** Current

---

## Patient profile in the wallet

**Decision:** The wallet holds patient-entered biographical data — age, sex,
height, weight, blood type, allergies — under three required guardrails: every
field visibly labelled patient-entered with a last-updated date; nothing in the
system computes, suggests, flags or decides anything from it; and it is
consent-scoped like any other record. Recorded in docs/PROTOTYPE_BRIEF.md v0.2
section 5.

**Why:** Receiving facilities ask for these details on paper today, so carrying
them in the wallet removes a real step. The guardrails exist because the data is
self-reported and unverified while looking exactly like clinical fact on screen,
and because a patient-held biographical record is one step from a patient health
record — "not a facility EMR" is a hard non-goal. Every field added here in
future should have to argue for itself.

**Status:** Current

---

## Patient identity: the wallet is the single source, matched on mobile number

**Decision:** Patient identity lives in the wallet and nowhere else. The mobile
number is the primary identifier. Two entry paths converge on one account: a
patient signs up directly (phone → SMS OTP → details → DPA consent), or an RHU
creates a referred appointment for a patient with no wallet, which creates a
placeholder keyed to the mobile number and sends an SMS invite; the patient
verifies the same number and the placeholder becomes their account. Facilities
hold no independent patient records to reconcile later. Recorded in
docs/PROTOTYPE_BRIEF.md v0.3 section 11.4 — in the repo brief this is §10.4
"Flow C — Patient onboarding".

**Why:** This was the OPEN item blocking the schema. General cross-facility
identity matching is a much harder problem than the pilot needs and is not being
solved — instead the referral flow doubles as onboarding, so whichever side
reaches the patient first creates the one identity the other side then attaches
to. Mobile number rather than email because it works without English literacy or
an email habit, and SMS OTP is already familiar in the Philippines. At 50-100
patients across two or three facilities this is sufficient; it is explicitly not
a national identity solution.

**Also considered:** Facility-local patient records reconciled by name and date
of birth — rejected; that recreates the fragmentation VITAL exists to remove and
makes duplicate resolution a permanent operational cost. Email as identifier —
rejected on the literacy and adoption grounds above. PhilHealth number as
identifier — rejected; not universally held, and it drags PhilHealth integration
into scope, which is a stated non-goal.

**Open action:** Two patients sharing one mobile number, and patients with no
phone. Both are real in rural Bohol and neither has a clean answer under
phone-as-identifier. Pilot workaround is RHU-assisted registration on the
facility's device. Name this to the panel before they name it.

**Status:** Current

---

## Facility onboarding, roles, and shared-terminal sessions

**Decision:** Facilities self-register (name, type, municipality, DOH/LTO licence
number, credential upload), sit in a pending state with no data access, and are
activated only after review by a VITAL admin through a two-screen verification
queue. Facility admins then invite staff by email; there is no self-serve staff
signup. Three roles: facility admin, staff, read-only. Which portal a user sees
is derived from their facility's type and is never chosen at login. Shared
terminals sign in once per shift, and individual users switch by PIN over a
locked screen; every status event records the individual user as actor. The full
flow ships in the deliverable, and the pilot disables facility self-registration
and the read-only role by feature flag rather than by removing code. Recorded in
docs/PROTOTYPE_BRIEF.md v0.3 section 11 — in the repo brief §10.1–10.3 and §10.6.

**Why:** Self-registration without verification would let anyone create a
facility account and become eligible to receive appointments and hold consent
grants over real health records, so the pending state and the admin queue are
load-bearing rather than administrative decoration — and "how do you verify a
laboratory is a real laboratory" is a question a panel will ask of any
self-serve model. Deriving the portal from facility type is what makes "three
clients, one API" true rather than aspirational. The PIN switch exists because
the audit log is a legal artifact: without it a shared terminal becomes a shared
identity and every event names the terminal instead of a person, which makes the
log useless for the purpose that justifies keeping it.

**Also considered:** Hand-provisioning all facilities and drawing no
registration flow — correct for pilot scale and rejected anyway, because the
deliverable is judged as a platform and a missing onboarding path reads as an
unfinished system. Full logout between users on a shared terminal — rejected;
it is slow enough that staff would stay signed in as one user all shift, which
is the exact failure the PIN switch prevents.

**Status:** Current

---

## Facility capabilities replace facility type as the behaviour driver

**Decision:** A Facility declares two independent capability flags at
registration — can_refer (originates referred appointments) and can_receive
(accepts appointments, offers tests) — and the portal view is assembled from
those, not from the facility's type. RHU declares refer-only, a standalone
laboratory receive-only, a clinic either or both. A facility with both gets one
merged queue with Outgoing / Incoming filter tabs. Type remains as a display and
licensing label with no behavioural effect. Recorded in docs/PROTOTYPE_BRIEF.md
v0.4 section 10.1. *Repo:* built (merged queue, now with an Incoming/Outgoing
switch, and a Facility picker in the laboratory portal), but the repo brief does
not yet describe capabilities — add it.

**Why:** Type cannot describe what a facility actually does. Clinics commonly
both refer out and run their own laboratory, so a model where type selects the
portal has no correct answer for them. The same seam made "we can just add
hospitals later" untrue, since a hospital both receives referrals and refers
onward. Capabilities cost nothing now and make the extension real rather than
asserted.

**Also considered:** Adding "clinic-with-lab" as a fourth type — rejected; it
multiplies types for every combination and still fails the next facility that
does not fit one. Two separate portal views with a mode toggle for dual-capability
facilities — rejected; a merged queue with filter tabs reuses an existing pattern
and adds no screens.

**Open action:** Hospitals need a terminal state for a care episode before they
can be added — Endorsed means a result document was released, and an admission
produces no such document. Onboarding, verification, roles and sessions are
already capability-agnostic and need no change.

**Status:** Current — supersedes the type-derived portal rule in "Facility
onboarding, roles, and shared-terminal sessions"

---

## Facility-published slots and the Reschedule proposed state

**Decision:** Every time slot offered in P7 and R2 comes from the receiving
facility's own published day schedule (L6) — one source of slot data rather than
three unrelated lists. A new non-terminal status, Reschedule proposed, lets a
facility offer an alternative slot from that schedule instead of declining. The
patient accepts it or chooses another facility; on referred appointments the
referring RHU is notified but only the patient confirms. A proposal unanswered
for 48 hours returns to the facility as Declined, reason "No response to proposed
time". Recorded in docs/PROTOTYPE_BRIEF.md v0.4 sections 1.3 and 2.1 — the repo
brief has the same rule in §1.3 and §2.1.

**Why:** The facility owned its capacity but had no say over when appointments
landed on it — Accept was a yes/no on a time someone else invented, and Decline
was the only escape from a time it could not serve. Because Decline is terminal,
"we cannot do 9am Thursday" and "we cannot do this test at all" produced the same
dead appointment and the patient could not tell which had happened. Sourcing
slots from the facility's own schedule makes Accept honest by construction; the
new state gives the facility a non-terminal alternative and leaves Decline meaning
only that the facility cannot perform the test. 48 hours is long enough for a
patient who checks their phone daily and short enough not to hold a published
slot indefinitely. This remains UI-layer only — no capacity engine, no conflict
resolution.

**Also considered:** Letting the facility edit the appointment time directly —
rejected; the patient is the one travelling and must confirm. Leaving a proposal
open indefinitely — rejected; it holds a published slot with no resolution path.

**Status:** Current

---

## Booking eligibility counts bookable tests, and every excluded test states why

**Decision:** A facility declares, per test it offers, whether that test requires
a referral from the patient's health centre. A facility row is bookable if at
least one selected test is bookable there — offered, and not referral-required.
A referral requirement never disables a row on its own; it disables only when it
is the reason the count reaches zero. Ineligible facilities stay visible, disabled
and badged, never hidden. Before confirming and again on the appointment detail,
the wallet states "Booking N of M tests" and lists every excluded test with its
reason, keeping "not offered here" and "referral required" as separate lines.
Recorded in docs/PROTOTYPE_BRIEF.md v0.4 sections 3.4 and 3.5. *Repo:* built in
the wallet (P6–P8) and mirrored on the referral form, where the only exclusion
reason is "not offered here" because the health centre is the referrer. Not yet
in the repo brief, whose §3.4 is the tier-metering question.

**Why:** The first implementation disabled a row if any selected test required a
referral, which blocked patients from tests they were fully eligible for at that
facility. Counting bookable tests is the only rule that handles the mixed case —
a facility offering some tests freely and others by referral. Per-test declaration
is the facility's own intake policy, not a clinical judgement by VITAL, which
keeps it inside the no-clinical-decisions non-goal: the same category as
publishing opening hours. The booking summary exists because a test that
disappears silently produces exactly the wasted trip VITAL is meant to remove —
a patient travelling an hour to find three of five tests cannot be done. The two
exclusion reasons stay separate because they imply different actions: go
elsewhere, versus get a referral and come back.

**Also considered:** Hiding ineligible facilities — rejected; a patient who sees
an empty list concludes the app is broken, and the facility's existence is
useful information. Blocking the whole booking when any test requires a referral —
rejected as the bug this decision fixes.

**Status:** Current

---

## Access denied is a screen, not an empty state

**Decision:** A read without an active ConsentGrant renders a clay-treated
Access denied panel in both portals (R8 / L8), naming the facility, stating that
permission was not granted or has been withdrawn, and stating that the attempt
has been recorded in the audit log. One action: back to queue. No retry, no
request-access. Recorded in docs/PROTOTYPE_BRIEF.md v0.4 section 7.4. *Repo:*
built (R8 / L8); the repo brief's §7.4 is "Explicitly not drawn" — add it.

**Why:** The project baseline names this as the test that matters most — a denied
read must return denied, not empty and not a crash, and must write an audit
entry. Until now the behaviour existed in the architecture and nowhere on screen,
which meant the consent model could be claimed but not demonstrated. It is also
the behaviour a panel is most likely to ask to see. The audit-log line is part of
the deterrent: staff should know the attempt is recorded.

**Status:** Current

---

## Outgoing rows open the referring view, never the receiving one

**Decision:** In a dual-capability facility's merged queue, rows in the Outgoing
list open the referring detail view (the R3/R4 pattern — status trail, and
Acknowledge result when one arrives). They never open the receiving view, which
carries Accept, Decline, Mark patient arrived and Upload result. Recorded in
docs/PROTOTYPE_BRIEF.md v0.4 section 7.2. *Repo:* built — the flow table only
offers the ordering facility Acknowledge result on its outgoing appointments.

**Why:** Those intake actions belong to the receiving facility. Exposing them on
an appointment this facility sent lets staff write status events attributing
their own facility as the actor for another facility's action — a false entry in
an append-only audit log, which is the one thing that log cannot contain and
still be worth keeping.

**Status:** Current

---

## Tech stack

**Decision:** FastAPI (Python 3.12) with Uvicorn, PostgreSQL 16 and Alembic for
the API and data layer. One React + Vite + TypeScript + Tailwind codebase for all
three surfaces, with the patient wallet shipped as an installable PWA. Result
documents in S3-compatible object storage (Cloudflare R2), private, served only
through short-lived signed URLs issued after a consent check. Argon2 password
hashing and JWT for staff auth; SMS OTP through a Philippine provider for
patients. Hosted on Render or Railway, Singapore region. pytest for tests.
TypeScript client types generated from FastAPI's OpenAPI schema.

**Why:** Python is the team's strongest language; the frontend already adds React
and TypeScript as new material, and keeping the backend on familiar ground avoids
concentrating two learning curves in one deadline-bound project. Pydantic rejects
malformed requests before application code runs, which is the right default for
an API taking health data. PostgreSQL permissions enforce the append-only rule at
the database — REVOKE UPDATE, DELETE on the status event and audit log tables,
applied as a migration — which turns append-only from a convention into a
guarantee that application bugs cannot breach. One React codebase matches the
capability model, where a portal is assembled from flags rather than being a
separate application, and lets one developer maintain one set of bugs rather than
three. DESIGN.md already ships its tokens as a Tailwind v4 @theme block, so the
design system becomes the actual class names. A PWA avoids app-store review,
which matters because fixes will ship during the pilot; its service worker carries
the offline behaviour rural connectivity requires; and the same code wraps into
Capacitor later if a store listing is needed. The PIN quick-switch must issue a
new JWT rather than relabel the screen, or the token still identifies the previous
user and the audit log records the wrong actor.

**Also considered:** Node + TypeScript backend — the strongest alternative, and
its advantage is real: one language across the whole stack, with domain types
defined once and imported by the API and all three clients with no generation
step. Rejected on familiarity and validation rather than capability; OpenAPI type
generation closes most of the type-sharing gap at the cost of one build step.
Django + DRF — rejected; its admin reads the database directly and would bypass
the ConsentGrant layer, a second unaudited door into patient records. Two custom
admin screens cost less than that hole. React Native / Expo — heavier than a
wallet that is mostly a read surface plus one booking flow. Native Android —
rejected despite team experience; it splits the codebase and adds store-review
latency during a 4-6 week pilot. SQLite — no role separation and no
permission-level append-only enforcement. Twilio — per-message cost to
Philippine numbers at pilot volume.

**Open action:** Data residency. The pilot handles real patient records under the
Data Privacy Act and Singapore hosting is a cross-border transfer — permitted with
safeguards, but it needs a decision and probably a line in the patient consent
notice. Resolve alongside the legal sufficiency of patient-held consent. Also
reconcile the host: this entry says Render or Railway, while the Phase 1 budget is
priced on AWS Lightsail (Singapore) — see "Phase 1 budget". The prototype does not
use Tailwind; see "Prototype stack".

**Status:** Current

---

## Created removed: a referral starts at Sent

**Decision:** There is no Created status. A referred appointment's first event is
Sent; a personal one starts at Booked; an internal order at Accepted. Booked is
never shown in the RHU portal, which only lists appointments it referred. The
receiving facility records No-show, and only once the slot is Overdue. Recorded in
the repo brief v0.3.2 and §2.1.

**Why:** Created and Sent were written by the same person in the same second, so
the trail recorded the same act twice. Booked leaked into the RHU portal although
the RHU never sees personal appointments. No-show offered from Accepted let staff
close an appointment before its slot had passed.

**Open action:** The concept note's status trail and Objective 5 still say
"Created … Appointment Scheduled". Correct before submission.

**Status:** Current

---

## Internal orders: a third origin

**Decision:** A facility that both refers and receives can order a test from its
own laboratory. An internal order starts at Accepted (no Sent or Received), is
never declined for capability, can still get a proposed new time, is acknowledged
by the ordering staff, and is outside the 30% turnaround claim. Recorded in the
repo brief §1, §1.2 and §2.1.

**Why:** A clinic doctor ordering a test from the clinic's own lab had no way to
do it in VITAL. Treating it as a self-referral would have the clinic confirm
itself in the trail and flatter the turnaround metric.

**Also considered:** Excluding self-referral entirely — rejected; a real, common
case would sit outside the platform.

**Status:** Current

---

## Consent recorded at the counter when a referral is sent

**Decision:** The referral form cannot send until the staff member ticks that the
patient agreed, at the counter, to share this appointment and its result with the
named laboratory. The agreement and the staff member's name are written on the
Sent event, and the laboratory's consent card shows who recorded it. Recorded in
the repo brief v0.3.4 and §10.5.

**Why:** The form previously claimed the laboratory could not open the record
until the patient approved in the wallet, while the laboratory screen already
showed consent as active — the UI contradicted itself, and a patient who never
opens the wallet would stall the referral with nobody seeing it. The patient is
physically present when an RHU refers them, so recording consent there is both
true to the workflow and covers patients without smartphones.

**Also considered:** A "waiting for the patient to share" state with in-wallet
approval — rejected for the pilot; it adds a stall point exactly where rural
patients are least likely to act.

**Open action:** Legal sufficiency of staff-recorded consent is part of the
existing open question on patient-held consent.

**Status:** Current

---

## The referral form starts empty

**Decision:** No patient, test, laboratory or time is pre-selected. The patient is
found by typing a name or patient ID and confirmed on a card (ID, age, sex, town)
before the rest of the form unlocks. The clinical note is required. The form is
four numbered steps with a summary panel holding the only Send button and a
"Still needed" line.

**Why:** The form opened with a patient and CBC already chosen, so a rushed
midwife on a shared terminal could send a referral for the wrong person in one
click — the worst error in a health record.

**Status:** Current

---

## Undo: one-tap steps only, for 15 minutes

**Decision:** Received, Accepted, Patient arrived and Completed can be undone with
an "Undo" button on the appointment, where the step was taken, by the same person,
while it is still the latest event and for up to 15 minutes. Undo removes that
event. Steps that confirm first, move a slot or attach a document (Declined,
No-show, Endorsed, Result voided, Reschedule proposed) are never undone; they are
corrected with a further event. Recorded in the repo brief §10.5.

**Why:** One-tap steps are easy to mis-tap on a busy queue. A short window covers
the honest mistake before anyone else relies on the step.

**Also considered:** An 8-second undo in the confirmation message — replaced; it
vanished before staff noticed the mistake. Confirming every one-tap step —
rejected as friction on the commonest actions.

**Open action:** ~~Undo is a deliberate exception to the append-only trail~~ —
resolved by "Undo appends a withdrawal".

**Status:** Superseded in part by "Undo appends a withdrawal" — the steps, the
15 minutes and the same-person rule still stand; removing the event does not.

---

## Typography: Atkinson Hyperlegible

**Decision:** One superfamily replaces Inter and Cormorant Garamond: Atkinson
Hyperlegible Next for all text and Atkinson Hyperlegible Mono for data (patient
IDs, appointment IDs, times, counts). No serif anywhere. Patient-facing secondary
text is at least 14px; staff captions 13px.

**Why:** The thin light serif in the wallet was the wrong choice for low-literacy
patients on budget Android screens, and Inter read as generic. Atkinson was
designed for low-vision readers and keeps I, l and 1, and 0 and O, apart — which
matters for identifiers like PH-3318-0924 read aloud at a counter.

**Status:** Current — supersedes the font choice in "Design system foundation"

---

## Staff portals: navigation rail, split workspace, request first

**Decision:** The RHU and laboratory portals have a left navigation rail. At 1100px
and wider the queue is a list beside the selected appointment, each scrolling in
its own column. The appointment detail reads request first (who sent it, the test,
the time, the note), then the status actions, then consent and result; in a wide
panel the status trail has the right-hand column to itself. Incoming / Outgoing is
a separate switch in the page header, not tabs beside the status filters. The RHU
queue opens on "Needs follow-up".

**Why:** Staff work down a list all day; moving between list and detail screens
for each referral is the main cost for a laboratory handling dozens a day. Staff
must read what was asked for before deciding, so the request sits above the
buttons. Two Incoming/Outgoing tabs beside five status tabs read as seven filters
of one kind.

**Status:** Current

---

## Wallet: next step first, plain words

**Decision:** Wallet home leads with anything waiting on the patient, then their
next appointment, then appointments and results as plain lists; who can see the
record is one row (it has its own tab). Tests show their full names ("Complete
blood count (CBC)"). Consent entries are named by test and date, never by
appointment ID. "Stop sharing" is a calm outline button; the red confirmation is
on the next screen. Results open their appointment, which says what happens next.

**Why:** The audit found the core wallet user — a patient with low tech literacy —
was the one it failed most: a buried deadline, internal IDs, five red buttons that
read as alarms, and result rows that did nothing.

**Open action:** A Bisaya / English switch needs a native speaker to translate
health and consent wording.

**Status:** Current

---

## Prototype controls hidden

**Decision:** The prototype's screen switcher and demo clock are hidden on every
surface. Adding `?demo` to an address shows them for that browser tab. The start
page carries Reset demo data and a link to the laboratory portal as a clinic.

**Why:** They made a finished-looking prototype read as a mock-up in a pitch.

**Status:** Current

---

## Brand: the four-circle mark

**Decision:** The logo is three matching circles for the facilities in the network
and one solid circle for the patient, with a solid centre where they all overlap,
beside a geometric VITAL wordmark (version 10C). It ships in six versions —
primary horizontal, reversed, stacked, symbol, one-colour and app icon — in
`brand/logo/` and the shared brand kit artifact. The everyday colours are forest
ink, sage mist, key lime wash and cream paper.

**Why:** It tells the product's story — facilities connected around the patient —
and reduces to a recognisable app icon. The circles stand for kinds of facility
generally, so adding a facility type later does not break the meaning.

**Also considered:** Minimal heartbeat-V wordmarks — rejected after several rounds
as generic. Three equal circles — rejected because three-way symmetry reads as the
biohazard symbol, which labs see on every waste bin.

**Status:** Current

---

## Prototype stack

**Decision:** The prototype is Vite + React 19 + TypeScript with plain CSS on the
design tokens (no Tailwind), front end only, with synthetic data in one shared
store saved in the browser. The flow rules live in one table (`app/src/domain/
flow.ts`); every screen asks it which buttons to show and the store refuses any
step it does not allow.

**Why:** A proof-of-concept UI, not the MVP build. One rules table keeps seven
surfaces consistent and is what the tests check against the brief.

**Status:** Current — the production stack is "Tech stack"

---

## Phase 1 budget

**Decision:** The concept note asks for about ₱165,000 for Phase 1 only — building
the MVP in-house and a 4–6 week pilot with 1–2 RHUs or clinics, one laboratory and
50–100 patients — priced bottom-up from published rates (cloud hosting, SMS,
devices, data plans, Bohol transport, provincial legal fees). Deployment to more
facilities is Phase 2 and not in the request. Hosting is rented cloud, not a
self-built server.

**Why:** The earlier ₱150,000 was a placeholder. A total built from real costs is
easier to defend. Building a local server for data residency was rejected: it
costs more once backups, power and security are counted, and makes a small team
responsible for uptime with health data.

**Open action:** The concept note's recovery estimate (about month 18) counts
subscription income only, before running costs. A break-even framing (5 clinics
cover infrastructure, 12 cover all running costs) was drafted but left to the
teammate who owns that section. Lawyer fees need one real quotation. The
DICT/PSC XI rules on allowable expenses (stipends, equipment) are unknown.

**Status:** Current

---

## Undo appends a withdrawal

**Decision:** Undo no longer removes the step. It writes a further entry, by the
same person, withdrawing it; the status trail shows the step struck through and
marked withdrawn, then the withdrawal. Status is worked out from the steps that
stand. A withdrawal cannot be undone — the step is taken again. A withdrawn
acceptance is told to the patient and the ordering facility; the wallet's history
shows only the steps that stand. Undo sits in a footer under the status buttons:
what you just did and when, with a small rounded Undo button on the right (layout
B of five compared). Recorded in the repo brief §10.5.

**Why:** The brief (§2) makes the status trail append-only, and every staff trail
says entries cannot be edited or removed. Removing an event contradicted both, in
the one record meant to stand as evidence.

**Also considered:** Keeping removal as a narrow exception — rejected; it breaks the
promise the screen makes. Dropping undo for confirmations on every one-tap step —
rejected as friction on the commonest actions.

**Status:** Current

---

## Steps are taken on the appointment, not the queue row

**Decision:** Queue rows (the workspace list and the full-width table) carry no
step buttons. Choosing a row shows the appointment, with its status buttons below
the request.

**Why:** Selecting a row already shows the same buttons beside the list, so the row
button only added a second way to act — one that skipped reading the request. The
list reads cleaner with one action per row: open it.

**Also considered:** Keeping one-tap Mark as received on rows for speed — deferred
to the bulk receive-and-accept idea in PROGRESS.

**Status:** Current

---

## Read first, act at the bottom; result steps in the Result card

**Decision:** In the laboratory portal's appointment detail, the Update status card moves
to the bottom of the reading column, after the request, consent and result. Steps about
the result itself (Acknowledge result, Void result) sit inside the Result card, under the
document. The status trail keeps the right-hand column. Work list entries are three
lines: patient, test and time, then the facility on its own line (cut with "…" if too
long); the staff name is shown only in the detail. The Request card is unchanged.

**Why:** Acknowledge result sat two cards above the document it acknowledged. Long
health centre names wrapped the list's one-line summary in a different place on each
row, so rows had different heights.

**Also considered:** Update status at the bottom with Acknowledge kept in it — rejected,
the button would still be apart from the document. Splitting the Request card's
"Referring provider" into facility and person — not needed.

**Status:** Current — refines the order in "Staff portals: navigation rail, split
workspace, request first"

---

## Wallet: home is the notifications, enlarged; five tabs

**Decision:** Wallet home shows only what is current, under plain headings: "Needs your
answer" (a proposed time, an overdue slot, a recent decline — each a card with one
button), "Coming up", "Waiting for your result" and "New result(s)" (unopened, released
in the last week). No history, no patient ID, no access row. A new Appointments tab holds
every appointment, with Book a test, a search, filter chips (All / Not finished /
Finished) and month headings. Documents and Access get the same search and chips
(Documents: All / New / Withdrawn; Access: Sharing now / Ended, now listing every ended
grant). Details opens with a patient ID card (copy button) and groups the rest: About
you, Body, Allergies, Contact. An appointment opened from a tab goes back to that tab.
Tab labels are 13px so five fit.

**Why:** Home stacked six blocks and listed the same result twice; nothing said what
mattered. Long histories made Documents and Access an endless scroll, and the ID patients
read out at the counter sat under the greeting.

**Also considered:** One grouped list on home, and a card with big tile buttons — see the
"VITAL Wallet Home" artifact.

**Status:** Current — supersedes the home layout in "Wallet: next step first, plain words"

---

## Doctor visits: patients book a visit, the doctor orders the tests

**Decision:** A patient can book a doctor visit (a consultation) from the wallet as well as
tests. "Book an appointment" asks "See a doctor" or "I have a lab request". A visit is a
personal appointment of kind Consultation, booked with a facility that refers (a referral
is a doctor's decision, so referring means having doctors — no new onboarding option; the
"Refers appointments out" help text now says patients can book visits there). It runs
Booked → Received → Accepted → Patient arrived → Completed ("Seen by the doctor", written
by the facility) and never carries a result. Tests the doctor orders are created from the
visit through the referral form, with the patient filled in, and link back to it
(`fromVisit`); the wallet lists them under the visit. The health centre portal gains a
"Referrals sent / Doctor visits" switch; clinics see visits in their incoming queue.
Proposing a new time for a visit is not drawn in the health centre portal.

**Why:** Personal booking assumed patients know which tests they need. Most do not, and many
laboratories want a doctor's request anyway. Consult first, then tests, is how care works,
and it feeds the referral path the pilot measures. A visit closes when the patient is seen,
so the unmeasurable-care-episode objection to hospital referrals does not apply.

**Also considered:** Leaving consultations to Phase 2 — rejected; the booking flow was
wrong without it. Hospitals and specialists stay out of scope.

**Open action:** The concept note's turnaround claim stays scoped to referred laboratory
appointments; doctor visits are outside it, like internal orders.

**Status:** Current

---

## Visits and tests apart; tests searched, not ticked; quieter wallet

**Decision:** A facility that has doctors and a laboratory switches between "Tests received
· Doctor visits · Referrals sent", so visits never mix with laboratory work. The health
centre can propose a new time for a visit, picked from its own published times inside the
status card (clinics already could, through the day schedule). Doctor-visit facilities are
listed partner (Premium+) first, then nearest, with "Your health centre" / "Partner
facility" tags — the test rule within one band. Tests are searched and added (chips to remove) in the wallet and
the referral form, since a real catalogue has hundreds; test booking starts empty. Wallet
times are grouped by day in three columns. The wallet keeps the new section wording but
returns to plain rows: no date blocks, filters and "New" tags in light tint, a light
patient ID card, and a Material-style bottom bar (a pill behind the active icon, not a
filled cell).

**Why:** Mixed queues, a missing "propose" step for visits, tick-lists that cannot scale,
and a wallet that had become too heavy in dark green.

**Status:** Current — the wallet styling refines "Wallet: home is the notifications, enlarged"


---

## Times are a date and a time; "Referred by" before booking

**Decision:** Every place a time is chosen — wallet test and doctor-visit booking, the
staff referral form, and proposing a new time in the laboratory and health centre
portals — is a date field and a time list. *Superseded the same day:* the date and time
are now chosen freely (any future time, 15-minute steps) — see "Free date and time; the
receiving staff check it". In the laboratory's propose
mode the day schedule stays below the fields to show how full each time is. The wallet's
optional "Referred by" field is part of the booking form, before Book appointment; the
confirmation only shows what was entered. Wallet list entries put each detail (facility,
date and time) on its own line.

**Why:** Rows of time buttons read as a puzzle and grew with every published slot; a
"Referred by" field after booking asked for something the booking should already carry.

**Status:** Current

---

## Free date and time; the receiving staff check it

**Decision:** Patients and referrers choose any future date and time. VITAL keeps no live
facility timetable. The receiving staff check the time against their own schedule: they
accept it if it fits, or propose a new time (also free), which only the patient can
accept. The laboratory's day view still lists appointments by time for reference.

**Why:** Tracking every facility's real-time availability inside VITAL adds a scheduling
system the pilot does not need. Proposing a new time is the step that reconciles a free
choice with a real schedule, so it stays.

**Status:** Current — supersedes the published-slot rule (brief §1.3) for the prototype


---

## Filters follow the platform

**Decision:** Each platform keeps one filter pattern. Web portals (laboratory, health
centre, facility onboarding, admin): a search field plus the underlined tabs with counts
used by the queues. Patient wallet (mobile): a search pill plus rounded chips with
counts. Whole-list switches stay a segmented control (Tests received / Doctor visits /
Referrals sent). Toggle buttons are for form answers only — they change what is saved,
filters change what is shown. Facility onboarding's test-type filter now uses the web tabs.

**Why:** Onboarding's test filter used form toggles, so it read as a question. Mixing the
mobile chip style into the web portals would trade one inconsistency for another; users
of each surface only see that surface's pattern.

**Status:** Current

---

## Patient history: a second consent, off by default

**Decision:** A facility can see the patient's earlier results and self-entered details
(allergies, blood type, height, weight) in a "Patient history" card on the appointment —
only with a separate history consent. It is given at the counter as an optional second tick
on the referral form (ends when that appointment closes), or from the wallet's Access tab
per facility ("Share my history too" / "Stop sharing history"; tied to the appointment for a
receiving facility, open-ended for the health centre). Without it the card says "Not shared
with this facility" and shows nothing. Every view writes a "History viewed" audit entry. In
the seed, the wallet patient shares her history with her health centre only.

**Why:** The concept note (function 4) promises the receiving facility can see the patient's
history before they arrive, and a doctor needs allergies and earlier results. Appointment
consent alone gives one appointment, by design; a second, explicit consent keeps the default
minimal and makes widening it the patient's choice.

**Status:** Current

---

## Pilot measures, audit log, reported issues, plan and usage

**Decision:** The admin portal gains a navigation rail: Verification, **Pilot measures**,
**Audit log** and **Reported issues**. Pilot measures are derived from the records (never
typed in): median referral-to-result time against each site's manual baseline (a sample 72 h
until sites record their own) with the 30% goal, referrals sent and completed, arrivals
confirmed, results delivered digitally, wallet patients, provider reports. The audit log
merges every status written to any trail with every access check (refused, history viewed),
with search and Status updates / Access tabs. Facilities (laboratory and health centre
portals) gain **Plan and usage** — their plan, bracket, price and active-patient count; nothing
is billed in the pilot — and **Report a problem**, which reaches the admin's Reported issues,
where a reply resolves it and shows back to the facility.

**Why:** The concept note promises measured pilot objectives (4, 5, 7), that every access is
logged (functions 2, 11), administrators handling reported issues (function 11), and tiered
plans (business model). Each now has a screen.

**Status:** Current

---

## Fair ranking; Premium+ adds track records, not position

**Decision:** No facility can pay to be listed higher. Laboratories are ranked by whether they
offer every requested test, then by how many, then nearest first; doctor-visit facilities
nearest first. The "Partner facility" tag is removed — every facility listed is on the VITAL
network, so it separated nothing. Premium+ follows the concept note: the **referring** facility
gets priority referral recommendations — in the pilot, each laboratory's typical
referral-to-result time and acceptance rate (from VITAL's own records, with counts) on the
referral form, and sorting by best match, fastest results or closest. Specialist matching is
the later phase. The Plan and usage screen says so.

**Why:** The business model charges RHUs and clinics, not laboratories, so selling placement
to receiving facilities contradicted it, and paid placement in health referrals is a conflict
of interest. A better tool for the doctor keeps the ranking fair.

**Status:** Current — supersedes the partner priority in "Visits and tests apart" and the
partner-listing ranking in the wallet booking flow

---

## Priority appointments

**Decision:** The referring facility can give a referral **Priority** and must say why: an urgent
clinical need, a senior citizen, a person with disability, or a pregnant patient (the groups
Philippine law gives priority lanes). A priority appointment carries a Priority chip in the
receiving queue and request, and a note in the patient's wallet, and sorts to the top of each
queue tab. It is for the patient's sake only and has nothing to do with a facility's plan, so it
does not touch the fair ranking above. Seeded example: APT-418 (sputum smear, suspected
tuberculosis, urgent clinical need) at Tagbilaran Diagnostic Center.

**Why:** Requested for the pitch ("a priority option for referred appointments"). First built as
"Urgent"; renamed because seeing a senior citizen or a PWD first is priority, not urgency. Premium+'s
"priority referral recommendations" wording (concept note) now shares the word; the pitch should
call that feature something else, such as referral insights.

**Status:** Current

---

## Wait and result estimates

**Decision:** VITAL shows two estimates learned from the status trail's own timestamps:
**results expected** (a time range) at every laboratory, once a test is accepted, and a
**queue wait** ("about 25 min · 4 ahead of you") only at busy facilities with enough history.
Both appear in the wallet appointment and the laboratory's request card, with a line on what
the estimate rests on. The prototype has no model: `domain/estimate.ts` stands in for one shared
model across facilities, pulling a quiet facility's pace toward the network average until it has
enough records (partial pooling), widening the range where history is thin, and starting from
each test's typical turnaround declared at onboarding. Facility history figures are synthetic.

**Why:** The pitch's AI feature. Per-facility models fail at laboratories with five requests a
day; pooling and ranges keep the estimate honest there, and a queue wait only means something
where people queue. The pilot itself is too small to train on, so the pitch presents the pilot as
collecting the data and the model as trained as the network grows.

**Status:** Current — the model, its features and its error measure are for the real build

## Appointment times: VITAL picks by default
- Booking (wallet) and referral (RHU, clinics) default to **Pick for me**: the person chooses the day, VITAL picks the time. **Choose a time** stays, with VITAL's suggestion one tap away.
- One model for every laboratory (`suggestTime` in domain/estimate.ts). At busy labs it avoids the forecast queue and gives a 30-minute arrival window. At quiet labs the wait is near zero, so test prep (fasting early) and same-day results decide. A quiet lab that builds history behaves like a busy one, with no switch.
- Proposing a new time: **Let VITAL pick** (default) or **Set manually**.
- When the patient chose Pick for me, staff never set a time by hand. A new appointment gets **Accept**, **Re-pick automatically** (accepted at VITAL's new time, and the patient is told) or **Decline**. Declining is for real reasons only. Rejecting a time would send the patient back to rebook, so the lab re-picks instead.
