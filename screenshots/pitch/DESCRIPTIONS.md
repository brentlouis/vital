# VITAL pitch screenshots

The images are in `core-functions/`, named in the order of the concept note's 11 core
functions; `a` and `b` mean two images for one function, and each image has a `-full`
version beside it showing the whole screen. All data is synthetic.

## Which version to use

- **`-phone`** (wallet screens 01, 02a, 06a, 06b, 08): exactly one iPhone screen
  (1170 × 2532), no frame of its own. Drop it into a Canva phone mockup and it fills the screen;
  the status bar leaves the middle clear for the camera cutout.
- **`-laptop`** (staff screens): exactly one 16:10 laptop screen (2880 × 1800) for laptop mockups.
- **No suffix:** a tight crop of the part that proves the feature, for use without a device frame.
- **`-full`:** the whole screen as it appears in the prototype.

## Features section — four slides

| Slide | Screenshots |
|---|---|
| Health Wallet | 01, 08 |
| Consent & Access Control | 02a, 02b, 04b, 11a |
| Digital Referral Network | 03, 04a, 05, 07a, 07b, 09 |
| Appointments & Scheduling Notifications | 06a, 06b, 08 |

## The 11 core functions

| # | Core function | Screenshot |
|---|---|---|
| 1 | Health Wallet | 01-health-wallet |
| 2 | Consent and Access Controls | 02a-consent-who-can-see, 02b-consent-at-the-counter |
| 3 | Digital Referral Creation | 03-referral-creation |
| 4 | Referral Routing and Receiving | 04a-referral-receiving-queue, 04b-receiving-patient-history |
| 5 | Referral Status Trail | 05-status-trail |
| 6 | Appointment Scheduling | 06a-scheduling-see-a-doctor, 06b-scheduling-new-time-proposed |
| 7 | Laboratory Results Delivery | 07a-results-upload, 07b-results-acknowledged |
| 8 | Notifications and Reminders | 08-notifications |
| 9 | Standard and Priority Referral Recommendation | 09-referral-recommendation |
| 10 | System Integration Layer | No screen: a later phase. Use a simple diagram. |
| 11 | Security, Audit Logs and Administration | 11a-audit-log, 11b-reported-issues |

## What each screenshot shows

**01 — Health wallet** (patient)
The patient's phone shows only what matters now: anything that needs their answer, their next
appointment, and new results, in plain words like "Ready for you" instead of system terms.

**02a — Who can see your record** (patient)
Every facility that can open the record, and why. The patient can stop sharing with any of
them, and choose separately whether each one also sees their earlier results and details.

**02b — Consent at the counter** (health centre)
Before a referral can be sent, staff tick that the patient agreed, there at the counter, to
share this appointment and its result with the named laboratory. A second, optional tick
shares the patient's earlier results and details (such as allergies), only if they say yes.

**03 — Referral creation** (health centre)
A midwife refers a patient in one form: the patient, the tests, the laboratory and a time,
replacing the handwritten referral slip. The summary on the right is what gets sent.

**04a — Receiving queue** (laboratory)
The laboratory sees every incoming referral in one list, with the selected one beside it.
Staff read the request, then accept it, propose a new time, or decline it.

**04b — Patient history on arrival** (health centre doctor)
When the patient has chosen to share it, the facility sees their allergies, blood type and
earlier results before seeing them. Without that consent the card stays locked, and every
view is written to the audit log.

**05 — Status trail** (laboratory)
Each step is recorded with the person, the facility and the time (Sent, Received, Accepted,
Patient arrived, Endorsed, Completed), and entries can never be edited or removed.

**06a — See a doctor** (patient)
Patients who don't know which tests they need book a doctor visit first, at their health
centre or a clinic, nearest first. Any tests the doctor orders appear under the visit.

**06b — New time proposed** (patient)
When a facility can't keep the chosen time, it proposes another instead of turning the
patient away. Only the patient can accept it, or choose another facility, within 48 hours.

**07a — Upload result** (laboratory)
The laboratory attaches the result to the appointment and reads the patient's name and ID
back first. A result attached to the wrong patient can only be voided, never deleted.

**07b — Result acknowledged** (health centre)
The result comes back to the health centre that referred the patient, which confirms it has
read it. That closes the loop VITAL exists to fix.

**08 — Notifications** (patient)
The patient is told when a facility acts on their appointment (confirmed, new time proposed,
result ready) and is reminded the day before.

**09 — Referral recommendation** (clinic on Premium+)
Laboratories that offer every requested test come first, then the nearest; no facility can pay
to move up. Premium+ adds each laboratory's results time and acceptance rate, and sorting by
them. The provider makes the final choice.

**11a — Audit log** (administrator)
Every status written and every access check, refused or allowed, in one searchable list.
Nothing in it can be edited or removed.

**11b — Reported issues** (administrator)
Facilities report problems from their own portal; the VITAL team replies and marks them
resolved, and the facility sees the reply.
