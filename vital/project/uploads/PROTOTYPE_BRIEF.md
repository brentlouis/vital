# VITAL — Prototype Brief

> Companion to `DESIGN.md`. That file governs how screens look; this one governs
> what screens exist, what they say, and which states can occur.
>
> Upload both together. Neither works alone: DESIGN.md without this produces
> on-brand screens for features that don't exist; this without DESIGN.md
> produces correct screens that look like three different products.

**Status:** v0.1. Governs the PSC XI prototype and the MVP build.

---

## 1. The one story

**RHU → laboratory.** One referral path, told identically in the concept note,
the prototype and the pitch.

A patient presents at a rural health unit. The attending provider decides a
laboratory test is needed. The referral is created in the RHU portal and sent to
a partner laboratory. The laboratory receives it, accepts it, and waits for the
patient. The patient arrives and is tested. The laboratory uploads the result
and endorses it back. The result becomes visible to the patient's wallet and to
the referring RHU — and to nobody else, because every read is checked against
an active consent grant.

**Why laboratory and not hospital:** a lab referral terminates in a returnable
artifact, so "Completed" is unambiguous and the referral clock has a definable
stop. A hospital referral terminates in a care episode, which cannot be closed
or measured inside a 4–6 week pilot. The MVP already names a laboratory portal;
this makes the note, the prototype and the pitch agree.

Hospitals, specialists and pharmacies remain network actors in the concept note.
They get no screens.

**Action required:** the concept note's narrative example currently reads
RHU → hospital. Change it to RHU → laboratory before submission.

---

## 2. Referral state machine

Status is **always derived from the latest event** in the append-only
`ReferralStatusEvent` trail. It is never a stored, editable field.

### 2.1 Events

Every event has a status, a timestamp, and an **actor** — a named user at a
named facility. No event is ever written by the system.

| Status | Actor | From | Terminal |
|---|---|---|---|
| Created | RHU staff | — | no |
| Sent | RHU staff | Created | no |
| Received | Lab staff | Sent | no |
| Accepted | Lab staff | Received | no |
| Declined | Lab staff | Received | **yes** |
| Patient Arrived | Lab staff | Accepted | no |
| No-show | RHU staff | Accepted | **yes** |
| Endorsed | Lab staff | Patient Arrived | no |
| Completed | RHU staff | Endorsed | **yes** |
| Result Voided | Lab staff | Endorsed | no → returns to Patient Arrived |
| Consent Revoked | Patient | any non-terminal | **yes** |

**Endorsed vs Completed.** Endorsed is the laboratory releasing the result.
Completed is the referring RHU acknowledging receipt of it. Two actors, two
events — and the gap between them is exactly the loop VITAL exists to close.
Collapsing them into one state would delete the evidence that the RHU ever
learned the outcome.

### 2.2 Overdue — derived, not an event

```
Overdue = Accepted && now > expected_by && no Patient Arrived event
```

Overdue is a **property of the queue row, never an entry in the status trail.**

The reason is structural, not cosmetic. Overdue is the *absence* of an event —
nobody performed it, so there is no actor to record. Writing a system-generated
event to make the status derivable would put entries in an append-only legal
artifact that no person performed, and the audit log would have to name a cron
job as the actor. The alternative — storing status as an editable field — breaks
the derivation rule outright.

No-show, by contrast, is an *assertion*: a named person has decided the patient
is not coming. It is a real event with a real actor and it does appear in the
trail.

### 2.3 Wrong-patient result

Handled as a **document incident, not a referral status.** The laboratory has
attached a result to the wrong patient or referral.

The document is **voided, never deleted** — a `Result Voided` event is written
with the acting lab user, the referral returns to `Patient Arrived`, and the
correct result is uploaded fresh. The voided document remains in the trail,
marked voided, and remains readable to the audit log.

This matters because the correction path is the one place a demo would quietly
delete a row, and deletion is precisely what an append-only audit artifact
forbids. A prototype that shows a delete button here has designed a system that
cannot pass a privacy review.

### 2.4 Consent revoked

The patient may revoke a facility's access at any non-terminal point. This
terminates the referral.

**OPEN — decide and document before this is coded.** What the receiving facility
sees after revocation: the referral disappearing, or remaining visible as
revoked with the clinical content removed. The second is almost certainly
correct — a facility that has already seen a patient cannot un-see them, and a
vanishing record is itself a data-integrity problem — but this is a legal
question, not a design one, and it belongs in DECISIONS.md before a screen
commits to an answer.

The prototype should draw the revoked state. It should not pretend the question
is settled.

---

## 3. Content vocabulary

Generative tools drift on copy faster than on color. Inconsistent verbs across
three surfaces is the fastest way a prototype reads as unfinished.

### 3.1 Status labels — exact strings

Sentence case. Never abbreviate, never pluralize, never reword per surface.

```
Created · Sent · Received · Accepted · Declined · Patient arrived
No-show · Endorsed · Completed · Overdue · Consent revoked · Result voided
```

### 3.2 Actions

The button and the resulting status share a stem. The button that says
"Decline referral" produces a status that says "Declined."

| Button | Produces | Variant |
|---|---|---|
| Send referral | Sent | Primary |
| Mark as received | Received | Primary |
| Accept referral | Accepted | Primary |
| Decline referral | Declined | Destructive |
| Mark patient arrived | Patient arrived | Primary |
| Patient did not arrive | No-show | Destructive |
| Upload result | — | Primary |
| Endorse result | Endorsed | Primary |
| Acknowledge result | Completed | Primary |
| Void result | Result voided | Destructive |
| Revoke access | Consent revoked | Destructive |

Never "Submit", "Confirm", "OK", or "Save" as a standalone label. Every action
names what it does, in the dialog as well as on the screen.

### 3.3 Nouns

Referral · Result · Health wallet · Consent · Facility · Rural health unit ·
Laboratory · Referring provider · Receiving facility · Status trail

Use **result**, not "lab result" or "report". Use **health wallet**, not
"wallet" or "patient app". Use **status trail**, not "timeline", "history" or
"activity".

### 3.4 Failure and empty copy

State what happened and what to do. No apologies, no vagueness.

- Denied read: *"You don't have access to this record. The patient has not
  granted your facility permission to view it."*
- Offline: *"You're offline. Referrals you create will send when the connection
  returns."*
- Empty queue: *"No incoming referrals. New referrals from partner facilities
  appear here."*
- Overdue: *"Expected 3 days ago. Follow up with the patient or mark as
  no-show."*

---

## 4. Screen inventory

**This list is the scope fence.** Nothing outside it gets drawn. A screen for a
feature that isn't being built is a promise the team gets held to.

### 4.1 RHU / clinic portal — web, compact density, sans only

| # | Screen | Notes |
|---|---|---|
| R1 | Referral queue | Default view. Filters: all / in flight / needs follow-up / closed. |
| R2 | Create referral | Patient select, laboratory select, test requested, clinical note. |
| R3 | Referral detail — in flight | Status trail, patient summary, no result yet. |
| R4 | Referral detail — result received | Result document, Acknowledge result action. |
| R5 | Referral detail — declined | **Hard state.** Decline reason from the lab, terminal. |
| R6 | Referral detail — overdue | **Hard state.** Amber, Patient did not arrive action. |
| R7 | Patient search | Identity matching across facilities — see §6. |

### 4.2 Laboratory portal — web, compact density, sans only

| # | Screen | Notes |
|---|---|---|
| L1 | Incoming queue | New / accepted / awaiting patient / completed. |
| L2 | Referral detail — new | Accept and Decline actions. Consent state visible. |
| L3 | Upload result | File attach, patient confirmation step before commit. |
| L4 | Referral detail — endorsed | Read-only, Void result available. |
| L5 | Referral detail — consent revoked | **Hard state.** See §2.4 — draw it as open. |

### 4.3 Patient health wallet — mobile, comfortable density, serif headers

| # | Screen | Notes |
|---|---|---|
| P1 | Wallet home | Active referrals, recent results. |
| P2 | Referral detail | Status trail in plain language, not system labels. |
| P3 | Documents | Results and prescriptions, chronological. |
| P4 | Consent management | Which facilities can see what, and until when. |
| P5 | Revoke access — confirm | **Hard state.** Names the consequence explicitly. |

**17 screens.** Roughly 8 carry the deck; the rest exist as spec. The four hard
states (R5, R6, L5, P5) are what turn a prototype into a usable specification —
they are also the first thing a panel probes, because a demo never has them.

### 4.4 Explicitly not drawn

Hospital portal · specialist portal · pharmacy portal · prescription flow ·
billing · PhilHealth · claims · analytics dashboard · admin console ·
subscription or pricing screens · any geography outside Bohol.

If a generated screen matches this list, delete it rather than keeping it "for
the deck."

---

## 5. Surface briefs

Paste the relevant one into any generation prompt.

### 5.1 RHU / clinic portal

**Goal** — let a primary-care provider send a patient onward and learn what
happened, without phoning around.

**Audience** — RHU staff on a shared desktop terminal in a rural health unit.
Used continuously through a shift by several people. Keyboard-heavy. Variable
connectivity. Mixed computer literacy. Not a design audience; they need to find
a referral in a list of thirty in under five seconds.

**Layout** — full-width, 24px gutters, no max-width. Persistent session bar
showing the signed-in user and facility with an always-visible switch control.
Queue is a dense table, 40px rows, status badge in a fixed left column.

**Content** — real Bohol municipalities, invented patients, plausible test names.

**Tone** — plain, direct, no marketing voice. This is a tool, not a product page.

### 5.2 Laboratory portal

**Goal** — receive referrals, acknowledge them, and return results to the
referring provider and the patient.

**Audience** — laboratory staff on a shared desk machine. The critical design
constraint: **this user gets no immediate benefit from entering status updates.**
If marking "Received" takes more than one obvious tap, it won't happen, the
referring RHU learns nothing, and the platform is a slower fax.

**Layout** — as the RHU portal. Status actions are the largest, most obvious
controls on every screen. Never buried in a menu, never more than one click from
the queue.

**Tone** — as the RHU portal.

### 5.3 Patient health wallet

**Goal** — one portable record the patient controls, and a clear answer to "who
can see my information."

**Audience** — patients across a wide age range, many on small, inexpensive
Android phones, some encountering a digital health record for the first time.
Some will be anxious about what they're looking at.

**Layout** — single column, 16px gutters, 48dp touch targets, 16px body minimum.
Serif headers. Generous spacing — this is the comfortable-density surface.

**Content** — status in plain language, not system labels. The trail says
"Tagbilaran Diagnostic Center received your referral", not "Received".

**Tone** — calm and factual. Never cheerful, never clinical-cold, never
reassuring about medical content — VITAL does not interpret results and must
never appear to.

---

## 6. Open — do not design past these

- **Patient identity matching across facilities.** The technical core of the
  idea and it blocks the schema. P3 and R7 both depend on it. Draw them with
  the matching mechanism deliberately vague.
- **Legal sufficiency of patient-held consent** between two facilities under the
  Data Privacy Act. Can invalidate the architecture, not just a feature.
- **Consent revocation on an in-flight referral** — §2.4.
- **Who presses "Patient did not arrive."** The laboratory has the knowledge and
  no incentive; the RHU has the incentive and not the knowledge. Currently
  assigned to the RHU, prompted by the Overdue state — which is the product
  working as pitched. Test this on paper with a real RHU and a real laboratory
  before it is built.
- **Baseline timing definition.** Clock start = provider decides a referral is
  needed. Clock stop = receiving facility acknowledges receipt. Record in
  DECISIONS.md before anyone holds a stopwatch.

---

## 7. Seed data

Generate once as a JSON fixture, reuse for prototype screens and MVP tests.

- ~20 patients: invented Filipino names, plausible ages, no real person.
- Real Bohol municipalities: Tagbilaran, Dauis, Panglao, Loon, Baclayon, Loboc.
- Invented facility names that read as local, not as "Acme Medical Center".
- Referral IDs in the project's actual format.
- Realistic test names: CBC, fasting blood sugar, urinalysis, chest X-ray.
- At least one referral in **every** state in §2.1, including the hard ones.

**Invented people, real geography.** A Bohol panel will notice placeholder names
instantly; they will also notice a municipality that doesn't exist.

**No real patient data, ever** — not in a prompt, a mockup, a screenshot, a
fixture or a commit. A single real name in git history is permanent and is a
Data Privacy Act problem, not a tidiness problem.
