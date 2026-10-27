# VITAL — Prototype Brief

> This file governs what screens exist, what they say, and which states can occur.
> How screens look is governed by the VITAL design system: tokens in
> `src/styles/tokens/`, rules in
> `../vital/project/_ds/vital-design-system-2895b579-f182-4106-810c-378d845697d9/readme.md`
> (which implements the original `DESIGN.md`).
>
> This is the current brief. The copies in `../vital/project/uploads/` are the
> Claude Design export and are no longer updated.

**Status:** v0.3.4. Supersedes v0.2. Adds §10 — access, onboarding and system
flow: how facilities, staff and patients get accounts, and how the three surfaces
resolve to one API. Patient identity matching is now decided, not open.

v0.3.4 hardens referral creation (§10.5): the form starts empty, the patient is found by
search and confirmed, the clinical note is required, and the RHU records the patient's
agreement at the counter before Sent is written. One-tap steps can be undone for 15
minutes by a further entry that withdraws them; nothing is removed from the trail
(§10.5). Every step is taken on the appointment, after reading the request — queue
rows carry no buttons.

v0.3.3 completes the events table with the steps the prototype already used —
Reschedule proposed, the patient accepting a new time, declining an unanswered
proposal, voiding after acknowledgement (§2.1) — and adds notifications (§2.5).

v0.3.2 removes **Created**: a referral's first event is Sent (§2.1). It also
settles who records a no-show (the receiving facility only, §2.1), stores Overdue
nowhere (§2.2), and limits a referring facility to its own referrals (§2.4).

v0.3.1 adds a third origin, **internal** (§1, §2): a facility that both refers and
receives orders a test from its own laboratory.

v0.2 added the Appointment model with two origins, facility matching by test
coverage, the patient profile, and `referred_by` as a non-authoritative note.
The referred flow from v0.1 is unchanged and is still the measured pilot scope.

---

## 1. The model

The tracked object is an **Appointment**: a booked slot at a receiving facility,
for one or more tests, for one patient. It has three origins.

**Referred appointment** — a provider at an RHU or clinic decides a test is
needed and books it on the patient's behalf. This is the v0.1 flow, unchanged.

The provider decision is what makes it a referral, and why the referring
facility receives the result: the clinician who ordered the test is the one who
acts on it. When the patient decides they want a test and RHU staff only help
them book it, that is a **personal** appointment made with assistance, not a
referral — the result goes to the patient alone and the patient closes it.

**Personal appointment** — the patient books directly, because no provider
decision was required. Vaccination, routine screening, a test they already know
they need.

**Internal appointment** — a facility with both `can_refer` and `can_receive` set
orders a test from its own laboratory. A clinic doctor decides a test is needed
and the clinic's own laboratory performs it. There is no handoff between
facilities, so nothing is sent and nothing is received.

All three produce the same object, the same status trail and the same consent
checks. Only the origin and the first events differ.

### 1.1 Why the rename is real, not cosmetic

v0.1 tracked a referral: a clinical decision with no time attached, where the
patient went "when they could" and the system's job was to find out whether they
went. An appointment has a slot. That is a genuine addition to the data model,
not a relabel — `Appointment` carries `scheduled_at`, and `Referral` never did.

**This resolves the project's riskiest open question.** v0.1 could not answer who
presses "Patient did not arrive": the laboratory had the knowledge and no
incentive, the RHU had the incentive and no knowledge. With a booked slot the
laboratory has both — a missed slot is a wasted slot and they know when it
passed. Overdue stops being a guess computed from elapsed time and becomes a
concrete missed appointment.

Worth saying out loud in the pitch. It is the single biggest improvement to the
weakest part of the design.

### 1.2 Scope of the measured claim

**The 30% turnaround claim covers referred appointments only.** A personal
appointment has no provider decision, so there is no clock start — the metric's
definition (start = provider decides a test is needed; stop = receiving facility
acknowledges) does not apply to it. The clock starts at the referral's **Sent**
event, which is written the moment the provider sends it.

State this explicitly in the concept note. Personal appointments are a
demonstrated capability and a near-term roadmap item; they are not part of the
measured pilot. A panel reads a scoped claim as rigour and an unscoped one as a
metric that was quietly diluted.

**Internal appointments are outside the claim too.** The clock would stop at an
acknowledgement the ordering facility writes to itself, in the same moment it
places the order. Counting them would report a near-zero turnaround and flatter
the number.

### 1.3 Scheduling is UI-layer only

The prototype shows available slots. It does not implement laboratory capacity
management, conflict resolution, or facility-side slot configuration. Those are
real subsystems and are out of scope for the MVP.

The slots shown are static synthetic data. Do not build a booking engine.

---

## 2. State machine

Status is **always derived from the latest event** in the append-only
`AppointmentStatusEvent` trail. Never a stored, editable field.

### 2.1 Events

Every event has a status, a timestamp, and an **actor** — a named user at a named
facility, or the patient. No event is ever written by the system.

| Status | Actor | From | Origin | Terminal |
|---|---|---|---|---|
| Sent | Referring staff | — | referred | no |
| Booked | Patient | — | personal | no |
| Received | Facility staff | Sent, Booked | referred, personal | no |
| Accepted | Facility staff | Received *(referred, personal)* / — *(internal)* | all | no |
| Accepted | Patient | Reschedule proposed, inside the 48-hour window | all | no |
| Reschedule proposed | Facility staff | Received, Accepted | all | no |
| Declined | Facility staff | Received; Reschedule proposed once the window has passed | all | **yes** |
| Patient arrived | Facility staff | Accepted, Overdue | all | no |
| No-show | Facility staff | Overdue only (§2.2) | all | **yes** |
| Endorsed | Facility staff | Patient arrived, Result voided | all | no |
| Completed | Referring staff *(referred)* / Patient *(personal)* / Ordering staff *(internal)* | Endorsed | all | **yes**¹ |
| Result voided | Facility staff | Endorsed, Completed | all | no → the next step is Endorsed with the correct result |
| Consent revoked | Patient | any non-terminal | all | **yes** |

¹ Completed closes the loop, but a result found to be misfiled after it was
acknowledged can still be voided — a wrong result on the record is worse than
reopening one appointment.

**Staff with the Read-only role write nothing.** They read appointments and
results under consent (§10.3); no step in this table is open to them.

**This table is the prototype's code.** `src/domain/flow.ts` holds it as data;
every screen asks it which buttons to show, the store refuses any write it does
not allow, and the tests replay every seeded appointment against it. Change a row
here and there together.

"Referring staff" is staff at whichever facility created the referral: an RHU, or
a clinic with `can_refer` set. For an internal appointment the ordering and the
performing facility are the same, so "Ordering staff" and "Facility staff" are
staff at that one facility.

**One vocabulary for every origin.** Each origin starts with one event, written
when the appointment is made: a referral starts at **Sent**, a personal
appointment at **Booked**, and an internal appointment at **Accepted** — the slot
is one the facility published itself, so there is no one to send it to and
nothing to confirm. Everything downstream is identical. Resist inventing a
parallel set of words — "Ordered" for one origin and "Sent" for another, or
"Confirmed" and "Accepted", would double the vocabulary for no gain.

**There is no Created status.** Earlier versions wrote Created and then Sent, but
creating a referral and sending it are one action, so the two events always
carried the same timestamp and Created said nothing. There is no draft state: an
appointment exists from the moment it is sent. If drafts are ever needed they
belong outside the status trail, which records only what has been done.

**Completed has a different actor per origin.** For a referred appointment the
referring facility acknowledges the result, which is the loop closing. For a
personal appointment there is no referring provider, so the patient viewing the
result closes it, with the patient as the recorded actor. For an internal
appointment the ordering facility acknowledges its own result.

**An internal appointment is never declined for capability.** Declining because
a test cannot be done is a receiving facility's answer to a request from outside,
and a facility only offers itself for tests it performs: the order form lists its
own laboratory only when it performs at least one requested test, and a test it
does not perform is left off the order. A time it cannot keep is handled by
proposing a new one — and if the patient never answers, that proposal ends as
Declined like any other.

**Consent is unchanged.** The patient's wallet still records an internal
appointment and asks them to grant the facility access to it and its result.
No other facility is asked for anything.

**No-show is now the facility's**, not the RHU's — the slot makes it theirs to
observe. This supersedes the v0.1 assignment. The receiving facility records it
("Patient did not arrive") once a row is Overdue (§2.2); before the slot passes
the patient may still come. The referring facility cannot record a no-show. It
sees the row go Overdue, can follow up with the patient, and is told when the
facility records the no-show.

### 2.2 Overdue — derived, not an event

```
Overdue = Accepted && now > scheduled_at + grace && no Patient arrived event
```

The prototype uses a grace of 60 minutes. The stored status stays Accepted; only
the row's displayed status becomes Overdue.

A property of the queue row, never an entry in the status trail. Overdue is the
absence of an event and has no actor; writing a system-generated event would put
unperformed entries in an append-only legal artifact and force the audit log to
name a scheduled job as the actor.

### 2.3 Result voided, consent revoked

Unchanged from v0.1. A misfiled result is **voided, never deleted** — the
document remains in the trail marked voided and remains readable to the audit
log. Consent revocation terminates the appointment; what the receiving facility
sees afterwards remains **OPEN** and must not be settled by a screen.

### 2.4 Who sees an appointment

A referring facility sees only the appointments it referred. A patient's
personal bookings and other facilities' referrals never appear in its queue or
its patient search — they are records the patient has not shared with it
(§10.5). So **Booked** never appears in a referring facility's portal: only a
patient writes it, and only the patient and the receiving facility see it.

A facility that both refers and receives sees what it referred (Outgoing) and
what it must perform, including its own internal orders (Incoming).

### 2.5 Notifications

Derived from the status trail, never stored or sent by the system: an event
either reaches a person or it does not. **Nobody is told about something they did
themselves.**

**The patient** hears about six transitions and one reminder:
Scheduled (a facility booked for them), New time proposed, Confirmed, Declined,
Result ready, Result withdrawn — and a reminder 24 hours before the slot.

**The ordering facility** hears how its referral is going: accepted, declined, a
new time proposed and whether the patient took it, the patient did not arrive,
result ready (with a prompt to acknowledge it), result withdrawn, consent
withdrawn.

**The receiving facility** hears when work arrives (a referral sent or a personal
booking made), when the patient accepts a proposed time, and when the patient
withdraws consent.

Staff portals show these under a bell in the session bar; the wallet has its own
notifications screen. Opening either marks everything read.

---

## 3. Facility matching

Where the patient or the RHU chooses a receiving facility.

### 3.1 Test filter

The user ticks the tests needed — CBC, fasting blood sugar, urinalysis, chest
X-ray, and so on. Multi-select. The facility list is filtered and ranked against
that selection.

### 3.2 Ranking

Two bands, in this order:

1. **Full match** — the facility offers every selected test.
2. **Partial match** — the facility offers some. Show which are missing.

**Tier never crosses a band.** A partner facility with a partial match never
outranks a non-partner with a full match. Tier orders facilities *within* a band
only. A patient must never see a worse clinical fit because a facility pays.

### 3.3 Partner disclosure — non-negotiable

A facility ranked up by its subscription carries a visible **"Partner facility"**
label **on the row in the list**, where the choice is made. Not in a tooltip, not
on a detail screen, not in a footnote.

Disclosed paid placement is a business model. Undisclosed paid placement is
steering patients on commercial grounds inside a health platform, and the
difference is entirely whether the label is where the decision happens.

### 3.4 Open — tier metering

Laboratory tiers are currently proposed to meter on **number of active
patients**. Decide what happens at the cap: refused, queued, or the facility
silently drops out of patient suggestions. All three mean a patient's access to a
test is bounded by their laboratory's billing plan — in a platform whose pitch is
closing referral gaps.

Recommended alternative: meter on **volume processed** (appointments handled in
the prior month) rather than a cap on concurrent patients. Same revenue logic, no
clinical ceiling. Raise with the team before it reaches the concept note.

---

## 4. Referred by — a note, not an actor

Personal appointments carry an optional free-text `referred_by` field, for a
patient already seen at a clinic who books the next step themselves.

**It grants nothing.** It is context for the receiving facility. It does not
appear in the status trail, it is never an actor in the audit log, it confers no
access to results, and no screen calls it a referral.

Granting access on this field would mean a patient could grant record access to a
person who never authenticated, never consented, and may not be a VITAL user at
all — a Data Privacy Act problem, not a UX detail. A real provider-to-provider
handoff is a referred appointment, which is authenticated end to end.

Label it **"Referred by (optional)"** with helper text: *"For the facility's
reference. This does not give them access to your records."*

---

## 5. Patient profile

The wallet holds patient-entered biographical data: age, sex, height, weight,
blood type, allergies.

**Guardrails, all three required:**

1. Every field is visibly labelled **patient-entered**, with a last-updated date.
2. Nothing in the system computes, suggests, flags or decides anything from it.
   VITAL does not interpret clinical data and must never appear to.
3. It is consent-scoped like any other record. A facility sees it only under an
   active grant.

**This is the non-goal boundary.** A patient-held biographical record is one step
from a patient health record, and "not a facility EMR" is a hard non-goal. The
profile exists because a receiving facility asks for these details on paper
today; it does not exist to become a medical history. Every future field added
here should have to argue for itself.

---

## 6. Content vocabulary

### 6.1 Status labels — exact strings

```
Sent · Booked · Received · Accepted · Declined · Patient arrived · No-show
Endorsed · Completed · Overdue · Consent revoked · Result voided
```

### 6.2 Actions

| Button | Produces | Variant | Surface |
|---|---|---|---|
| Send to facility | Sent | Primary | RHU |
| Book appointment | Booked | Primary | Wallet |
| Mark as received | Received | Primary | Facility |
| Accept appointment | Accepted | Primary | Facility |
| Decline appointment | Declined | Destructive | Facility |
| Mark patient arrived | Patient arrived | Primary | Facility |
| Patient did not arrive | No-show | Destructive | Facility |
| Upload result | — | Primary | Facility |
| Endorse result | Endorsed | Primary | Facility |
| Acknowledge result | Completed | Primary | RHU |
| Void result | Result voided | Destructive | Facility |
| Revoke access | Consent revoked | Destructive | Wallet |

Never "Submit", "Confirm", "OK" or "Save" alone. Every action names what it does,
in the dialog as well as on the screen.

### 6.3 Nouns

Appointment · Referred appointment · Personal appointment · Result ·
Health wallet · Consent · Facility · Rural health unit · Laboratory ·
Referring provider · Receiving facility · Status trail · Partner facility

Use **appointment**, not "booking" or "visit". Use **result**, not "lab result"
or "report". Use **status trail**, not "timeline" or "history".

### 6.4 The referral notice

On the wallet's new-appointment flow, when a selected test typically requires a
provider's decision, show an inline notice — not a block:

> *"This test usually needs a referral from your local health center. You can
> still book directly, but the facility may ask for one."*

Advisory, never enforced. VITAL does not decide whether a test is necessary.

---

## 7. Screen inventory

**The scope fence.** Nothing outside it gets drawn.

### 7.1 RHU / clinic portal — web, compact, sans only

| # | Screen | Change |
|---|---|---|
| R1 | Appointment queue | Patch: relabel, add scheduled-time column |
| R2 | Create referred appointment | Patch: add test filter, facility matching, slot pick |
| R3 | Appointment detail — in flight | Patch: relabel |
| R4 | Appointment detail — result received | Patch: relabel |
| R5 | Appointment detail — declined | Patch: relabel |
| R6 | Appointment detail — overdue | Patch: relabel, show missed slot. Follow-up only: the receiving facility records a no-show (§2.1) |
| R7 | Patient search | Unchanged |

### 7.2 Laboratory portal — web, compact, sans only

| # | Screen | Change |
|---|---|---|
| L1 | Incoming queue | Patch: relabel, origin badge, scheduled time |
| L2 | Appointment detail — new | Patch: relabel, show origin and `referred_by` |
| L3 | Upload result | Patch: relabel, add "Previously voided — re-uploaded" banner |
| L4 | Appointment detail — endorsed | Patch: relabel, add "Previously voided — re-uploaded" banner |
| L5 | Appointment detail — consent revoked | Patch: relabel |
| L6 | Day schedule | **New.** Appointments grouped by slot for one day. |
| L7 | Appointment detail — no-show | **New.** Terminal, amber. Missed slot and who recorded it. |
| L7a | Appointment detail — overdue | **New.** Amber banner; "Mark patient arrived" and "Patient did not arrive" |

### 7.3 Patient health wallet — mobile, comfortable, serif headers

| # | Screen | Change |
|---|---|---|
| P1 | Wallet home | Patch: relabel |
| P2 | Appointment detail | Patch: relabel, plain-language trail |
| P3 | Documents | Unchanged |
| P4 | Consent management | Unchanged |
| P5 | Revoke access — confirm | Unchanged |
| P6 | New appointment — tests | **New.** Test multi-select, referral notice. |
| P7 | New appointment — facility | **New.** Ranked list, partner labels, slot pick. |
| P8 | Appointment booked | **New.** Confirmation with slot and facility. |
| P9 | Profile | **New.** Patient-entered bio data with guardrails. |

**23 screens** in the three MVP surfaces, plus 17 access and onboarding screens
in §10 — **40 total**.

### 7.4 Explicitly not drawn

Hospital portal · specialist portal · pharmacy portal · prescription flow ·
billing · subscription management · PhilHealth · claims · analytics ·
facility capacity configuration · any geography outside Bohol.

The admin surface in §10.2 is the facility verification queue only. It is not a
general admin console and gets no other screens.

---

## 8. Surface briefs

As v0.1 §5, with two changes:

**Laboratory portal** — the critical constraint is stronger now, not weaker. The
facility gets no immediate benefit from entering status updates, and the slot
makes No-show theirs to press. If marking arrival or no-show takes more than one
obvious tap, it will happen at end of shift and the timestamps stop meaning what
the 30% claim needs them to mean.

**Patient wallet** — now has a creation flow, not just a reading flow. The
new-appointment path is the most complex thing a patient does in VITAL and the
audience is the least technical in the system. Fewest possible steps, one
decision per screen.

---

## 9. Open — do not design past these

- **Legal sufficiency of patient-held consent** between facilities under the DPA.
- **Patients sharing one mobile number, and patients with no phone** — §10.4.
  Both are real in rural Bohol and neither has a clean answer under
  phone-as-identifier.
- **Consent revocation on an in-flight appointment** — what the facility sees.
- **Tier metering** — §3.4. Active-patient caps create a clinical ceiling.
- **Baseline timing definition** — record before measuring. Referred only.
- **Tech stack.**

---

---

## 10. Access, onboarding and system flow

How the three surfaces become one system. The full flow ships in the
deliverable; the pilot runs a subset behind feature flags (§10.6).

### 10.1 Account model

| Entity | Belongs to | Created by |
|---|---|---|
| **Facility** | — | Self-registration, activated by VITAL admin |
| **Facility admin** | Facility | Created on facility activation |
| **Staff user** | Facility | Invited by facility admin |
| **Patient** | — | Self-registration, or claimed from an RHU-created placeholder |
| **VITAL admin** | Platform | Internal, not self-serve |

A Facility has a type (RHU, clinic, laboratory) which determines which portal its
staff see. One codebase, one API, three views — **the portal a user lands on is
derived from their facility type, never chosen at login.** This is what makes
"three clients, one API" true rather than aspirational.

### 10.2 Flow A — Facility onboarding

```
F1 Register → F2 Upload credentials → F3 Pending → [admin review] → F4 Activate
   → facility admin sets password → F5 Invite staff
```

| # | Screen | Contents |
|---|---|---|
| F1 | Facility registration | Name, type, municipality, address, DOH/LTO licence number, admin contact name, email, mobile |
| F2 | Credential upload | DOH licence or LTO permit, business permit. States that activation requires review. |
| F3 | Pending verification | Status, what happens next, expected timeframe. No portal access from here. |
| F4 | Activation | Reached from an emailed link. Facility admin sets password, accepts terms. |
| F5 | Staff management | Inside the portal. Staff table with role and status; invite by email; deactivate. |

**No facility touches patient data before activation.** F3 is a dead end by
design — an unverified facility cannot receive appointments, cannot appear in
patient facility search, and holds no consent grants.

Self-registration without verification would let anyone create a facility account
and become eligible to hold consent grants over real health records. "How do you
verify a laboratory is a real laboratory" is a question any self-serve model has
to answer, so the pending state and the review queue are load-bearing rather than
administrative decoration.

**Admin surface — minimal**

| # | Screen | Contents |
|---|---|---|
| A1 | Verification queue | Pending facilities: name, type, municipality, licence number, submitted date |
| A2 | Facility review | Submitted documents; approve, or reject with a reason |

Two screens. Not deck material; required so the flow has no hole.

### 10.3 Flow B — Staff access

| # | Screen | Contents |
|---|---|---|
| S1 | Staff login | Email + password. Facility name shown after email entry, so a user on a shared terminal sees which facility they are signing into. |
| S2 | Accept invite | Reached from emailed link. Set password, set quick-switch PIN. |
| S3 | Forgot password | Email reset. |
| S4 | Quick switch | PIN entry over a locked screen. Switches active user without ending the facility session. |

**S4 is what the session bar's switch-user control opens.** One staff member
signs the terminal in at the start of a shift; individual users switch by PIN.
Every status event still records the individual user as actor.

Without this the shared terminal becomes a shared identity and every event names
the terminal instead of a person — which makes the audit log useless for the
purpose that justifies keeping it. Full logout between users was rejected: it is
slow enough that staff would stay signed in as one user all shift, which is the
exact failure the PIN switch prevents.

**Roles**

| Role | Can |
|---|---|
| Facility admin | Everything below, plus F5 staff management |
| Staff | Create, send, receive, accept, decline appointments; upload and endorse results |
| Read-only | View appointments and results under an active consent grant. Writes no status events. |

### 10.4 Flow C — Patient onboarding

Two entry paths, one identity.

```
Direct:   W1 Welcome → W2 Phone → W3 OTP → W4 Details → W5 Consent → P1 Wallet
Invited:  SMS invite → W2 Phone → W3 OTP → W6 Claim  → W5 Consent → P1 Wallet
```

| # | Screen | Contents |
|---|---|---|
| W1 | Welcome | What VITAL is, in one screen. Get started / I have an invite. |
| W2 | Phone entry | Mobile number, Philippine format. Primary identifier. |
| W3 | OTP verify | Six-digit SMS code, resend timer. |
| W4 | Your details | Full name, date of birth, sex. Minimum to match a record. Feeds P9. |
| W5 | Privacy and consent | DPA notice: what VITAL stores, that only granted facilities can read it, that access is revocable at any time. Explicit accept — never a pre-ticked box. |
| W6 | Claim appointment | Shown when the verified number matches an RHU-created placeholder. Shows the pending appointment, facility and slot; confirms it is theirs. |

**The invited path is the identity-matching mechanism.** When an RHU creates a
referred appointment for a patient with no wallet, it creates a placeholder keyed
to the mobile number and sends an SMS invite. The patient installs the wallet,
verifies the same number, and the placeholder becomes their account — one
identity, created by whichever side reached the patient first.

The wallet is the single source of patient identity. Facilities hold no
independent patient records that must later be reconciled. General
cross-facility identity matching is a much harder problem and is explicitly not
being solved; at 50–100 patients across two or three facilities, mobile number
plus invite code is sufficient.

Mobile rather than email because it works without English literacy or an email
habit, and SMS OTP is already familiar in the Philippines.

**Open:** two patients sharing one mobile number, and patients with no phone.
Both are real in rural Bohol. Pilot workaround is RHU-assisted registration on
the facility's device; a general answer is not settled. Name this to the panel
before they name it.

### 10.5 Runtime — how the three surfaces connect

One API. Every surface is a view of the same objects.

```
RHU staff creates referred appointment (R2)
  → Appointment{ patient, from_facility, to_facility, tests, scheduled_at }
  → the patient agrees at the counter; RHU user ticks it (R2 cannot send without it)
  → ConsentGrant created: patient → to_facility, scoped to this appointment
  → AppointmentStatusEvent: Sent, actor = RHU user, note = how consent was recorded
        ↓ routed by to_facility
Laboratory queue (L1) shows it
  → Received, Accepted → events, actor = lab user
  → Patient arrived → Endorsed, result Document attached
        ↓
Visible to: patient wallet (owner) + referring RHU (origin facility)
Not visible to: anyone else, ever
  → Completed, actor = RHU user
```

**Every read is checked against an active ConsentGrant, never against facility
identity.** A denied read returns denied and writes an AuditLogEntry — not empty,
not a crash.

**Undo is narrow.** A one-tap step (Received, Accepted, Patient arrived,
Completed) can be taken back with an Undo button on the appointment, where the
step was taken, for up to 15 minutes, and only while it is still the latest entry
and was written by the same person. **Undo appends; it never removes.** It writes
a further entry, by the same person, that withdraws the step. Both entries stay in
the trail — the step struck through and marked withdrawn, then "Withdrew … — taken
by mistake" — and the status is worked out as if the step had not been taken. A
withdrawal cannot itself be undone; the step is simply taken again. Whoever was
told about the step is told it was withdrawn (only Accepted reaches anyone: the
patient and the ordering facility). The patient's wallet shows only the steps that
stand. Steps that confirm first, move a slot or attach a document (Declined,
No-show, Endorsed, Result voided, Reschedule proposed) are never undone: they are
corrected with a further step.

Undo is a quiet footer under the status buttons, not one of them: a hairline, then
"You accepted this at 09:43 · Undo available for 15 minutes" with a small Undo
button on the right. Queue rows
carry no step buttons: choosing a row shows the appointment, where the request is
read before any step is taken.

A personal appointment is identical from `Received` onward. The patient creates
the ConsentGrant at booking instead of the RHU creating it at referral.

### 10.6 Pilot configuration

Built in full, reduced by flags. Nothing is deleted.

| Feature | Deliverable | Pilot |
|---|---|---|
| Facility self-registration (F1–F3) | On | **Off** — 3 partner facilities provisioned by hand |
| Admin verification queue (A1–A2) | On | On, unused |
| Staff invite (F5, S2) | On | On |
| Patient direct signup (W1–W5) | On | On |
| Patient invited path (W6) | On | On |
| Quick-switch PIN (S4) | On | On |
| Read-only role | On | **Off** |
| Personal appointments | On | **Off** — measured claim covers referred only |

Flags, not deleted code. A flag flipped back on for a demo is a configuration
change; a feature removed and re-added is a rebuild.

### 10.7 Screens added by this section

| Group | Screens | Count |
|---|---|---|
| Facility onboarding | F1–F5 | 5 |
| Admin | A1–A2 | 2 |
| Staff access | S1–S4 | 4 |
| Patient onboarding | W1–W6 | 6 |

**17 screens.** Generate these plain and fast — none are deck screens, since a
panel judges the referral loop rather than a login form. But Claude Code needs
them specified or it will invent an auth flow that was never designed.

---

## 11. Seed data

As v0.1 §7, extended: every appointment carries an origin (referred or personal),
a `scheduled_at`, and a facility test-coverage list so the ranking in P7 has
something real to sort. At least one appointment in every state in §2.1. At least
two partner facilities and two non-partners, including one case where a
non-partner full match correctly outranks a partner partial match — that case is
the proof §3.2 works.

The prototype's seed lives in `src/domain/seed.ts`, written as stories — each
appointment is the events that happened to it — and replayed against §2.1 by the
tests, so a seed that breaks the rules fails the build.

**Invented people, real geography. No real patient data, ever.**
