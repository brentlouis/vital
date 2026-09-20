# VITAL — Prototype Brief

> Companion to `DESIGN.md`. That file governs how screens look; this one governs
> what screens exist, what they say, and which states can occur.
>
> Upload both together. Neither works alone.

**Status:** v0.2. Supersedes v0.1. Changes: the tracked object is now an
**Appointment** with two origins; facility matching by test coverage; a patient
profile; `referred_by` as a non-authoritative note. The referred flow described
in v0.1 is unchanged and is still the measured pilot scope.

---

## 1. The model

The tracked object is an **Appointment**: a booked slot at a receiving facility,
for one or more tests, for one patient. It has two origins.

**Referred appointment** — a provider at an RHU or clinic decides a test is
needed and books it on the patient's behalf. This is the v0.1 flow, unchanged.

**Personal appointment** — the patient books directly, because no provider
decision was required. Vaccination, routine screening, a test they already know
they need.

Both produce the same object, the same status trail and the same consent checks.
Only the origin and the first two events differ.

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
acknowledges) does not apply to it.

State this explicitly in the concept note. Personal appointments are a
demonstrated capability and a near-term roadmap item; they are not part of the
measured pilot. A panel reads a scoped claim as rigour and an unscoped one as a
metric that was quietly diluted.

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
| Created | RHU staff | — | referred | no |
| Sent | RHU staff | Created | referred | no |
| Booked | Patient | — | personal | no |
| Received | Facility staff | Sent, Booked | both | no |
| Accepted | Facility staff | Received | both | no |
| Declined | Facility staff | Received | both | **yes** |
| Patient arrived | Facility staff | Accepted | both | no |
| No-show | Facility staff | Accepted | both | **yes** |
| Endorsed | Facility staff | Patient arrived | both | no |
| Completed | RHU staff *(referred)* / Patient *(personal)* | Endorsed | both | **yes** |
| Result voided | Facility staff | Endorsed | both | no → returns to Patient arrived |
| Consent revoked | Patient | any non-terminal | both | **yes** |

**One vocabulary for both origins.** A personal appointment skips Created and
Sent and starts at Booked. Everything downstream is identical. Resist inventing a
parallel set of words — "Confirmed" for one origin and "Accepted" for the other
would double the vocabulary for no gain.

**Completed has a different actor per origin.** For a referred appointment the
RHU acknowledges the result, which is the loop closing. For a personal
appointment there is no referring provider, so the patient viewing the result
closes it, with the patient as the recorded actor.

**No-show is now the facility's**, not the RHU's — the slot makes it theirs to
observe. This supersedes the v0.1 assignment.

### 2.2 Overdue — derived, not an event

```
Overdue = Accepted && now > scheduled_at + grace && no Patient arrived event
```

A property of the queue row, never an entry in the status trail. Overdue is the
absence of an event and has no actor; writing a system-generated event would put
unperformed entries in an append-only legal artifact and force the audit log to
name a scheduled job as the actor.

### 2.3 Result voided, consent revoked

Unchanged from v0.1. A misfiled result is **voided, never deleted** — the
document remains in the trail marked voided and remains readable to the audit
log. Consent revocation terminates the appointment; what the receiving facility
sees afterwards remains **OPEN** and must not be settled by a screen.

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
Created · Sent · Booked · Received · Accepted · Declined · Patient arrived
No-show · Endorsed · Completed · Overdue · Consent revoked · Result voided
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
| R6 | Appointment detail — overdue | Patch: relabel, show missed slot |
| R7 | Patient search | Unchanged |

### 7.2 Laboratory portal — web, compact, sans only

| # | Screen | Change |
|---|---|---|
| L1 | Incoming queue | Patch: relabel, origin badge, scheduled time |
| L2 | Appointment detail — new | Patch: relabel, show origin and `referred_by` |
| L3 | Upload result | Patch: relabel |
| L4 | Appointment detail — endorsed | Patch: relabel |
| L5 | Appointment detail — consent revoked | Patch: relabel |
| L6 | Day schedule | **New.** Appointments grouped by slot for one day. |

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

**22 screens.** 5 new, 15 patched, 2 unchanged.

### 7.4 Explicitly not drawn

Hospital portal · specialist portal · pharmacy portal · prescription flow ·
billing · subscription management · PhilHealth · claims · analytics ·
admin console · facility capacity configuration · any geography outside Bohol.

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

- **Patient identity matching across facilities.** Blocks the schema.
- **Legal sufficiency of patient-held consent** between facilities under the DPA.
- **Consent revocation on an in-flight appointment** — what the facility sees.
- **Tier metering** — §3.4. Active-patient caps create a clinical ceiling.
- **Baseline timing definition** — record before measuring. Referred only.
- **Tech stack.**

---

## 10. Seed data

As v0.1 §7, extended: every appointment carries an origin (referred or personal),
a `scheduled_at`, and a facility test-coverage list so the ranking in P7 has
something real to sort. At least one appointment in every state in §2.1. At least
two partner facilities and two non-partners, including one case where a
non-partner full match correctly outranks a partner partial match — that case is
the proof §3.2 works.

**Invented people, real geography. No real patient data, ever.**
