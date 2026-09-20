# VITAL Design System

Clinical calm on paper. VITAL is a patient-controlled referral network for
rural health units, district hospitals and laboratories in the Philippines. A
referral has to feel safe to a patient, credible to a provider, and auditable
to a regulator — so the system's whole job is making the *state* of a referral
unmistakable, and making the record of who did what impossible to quietly edit.

**Theme: light only.** Dark mode is out of scope for the MVP.

## Source

The only source supplied for this system is `uploads/DESIGN.md` — VITAL's own
written design spec, v0.1, governing the PSC XI prototype screens and the MVP
build. No codebase, Figma file, screenshots, slide deck, logo or font binaries
were provided. Everything here is a direct implementation of that document;
where it is silent (component internals, screen composition), the choices are
noted below as additions.

That document is itself adapted from the **Ease Health** style reference
(`styles.refero.design`), extracted from a marketing website. Four of its rules
are deliberately overridden in VITAL (new accent hues, coloured borders on
status rows, narrow shadow exceptions, tighter portal padding) and two dropped
as extraction artifacts.

## Products

Three surfaces, and only three. A screen for a surface outside them is a
promise the team gets held to.

| Surface | Density | Type | Icons |
|---|---|---|---|
| **Patient wallet** (Android) | Comfortable — 24px padding, 16px body, 48dp targets | Serif titles, sans body | Material Symbols Rounded |
| **RHU / clinic portal** (desktop, shared terminal) | Compact — 16px padding, 40px rows, 14px body | Sans only | Lucide |
| **Laboratory portal** (desktop, shared terminal) | Compact | Sans only | Lucide |

A pitch deck is a fourth, non-product surface: serif slide titles, 1200px
max-width. No deck template was supplied, so none is built here.

---

## Content fundamentals

**Voice.** Plain, factual, unhurried. The system is handling someone's medical
record on a shared computer in a rural health unit; the copy's job is to remove
doubt, not to reassure with tone.

- **You, not we.** The wallet speaks to the patient directly: *"You decide who
  can see your record."* *"You do not need to do anything."* The product never
  refers to itself in the first person.
- **Name the consequence, not the confirmation.** Buttons say
  *"Decline referral"*, *"Stop sharing"*, *"Attach result"* — never *"Confirm"*,
  *"OK"*, *"Submit"*. A dialog body states what will happen and to whom before
  the action is offered.
- **Sentence case everywhere.** Uppercase appears in exactly one place: table
  column headers. No tracked-out eyebrow labels above section headings — the
  source had them; they are dropped as a visual tell of generated design work.
- **No exclamation marks, no emoji, no encouragement.** Nothing celebrates. A
  completed referral gets a badge, not praise.
- **Empty states invite, they do not apologise.** *"No incoming referrals
  today."* plus the action that fills the screen. Never *"Oops"*, never
  *"Nothing to see here"*.
- **Errors say what happened and what happens next.** *"Radiology unit closed
  for maintenance until 18 March. Your health centre has been told and will
  arrange another facility."* Cause, consequence, and whether the reader must
  act.
- **Patient-facing copy avoids clinical shorthand.** Staff screens say
  *"Wrong-patient result"*; the wallet says *"This referral was declined"* and
  explains in one sentence.
- **Localisation is a constraint on copy length, not a later concern.** Cebuano
  and Tagalog strings run materially longer than English. Labels wrap; they
  never truncate, and component widths are never fixed to an English string.
- **Never real patient data.** Every name, ID and facility in every mock is
  synthetic, and obviously so. A single real name in a commit is a Data Privacy
  Act problem.

---

## Visual foundations

**Colour.** One saturated dark — Forest Ink `#0f3e17` — carries every primary
action, heading, link and icon stroke. Everything else is a tint of it or a
neutral. Two semantic hues are added because the source palette cannot express
failure: Clay `#8c2f2a` (failure) and Amber `#8a5a12` (attention), both
desaturated so they read as sibling inks beside forest rather than as an alert
palette. No success colour exists; Forest Ink *is* success, and Completed is
the only inverted badge in the system.

**Depth is tint, not shadow.** Surfaces layer cream → keylime → mint → sage →
slate. The default elevation is flat, with three exceptions only: dialogs,
bottom sheets and dropdowns, and toasts, all at
`0 4px 16px rgba(12,47,16,0.12)`. The modal scrim is tinted forest
`rgba(15,62,23,0.32)`, never black. Cards therefore have **no shadow**: 12px
radius, a tint, and a 1px Border Strong outline only where the tint alone does
not separate them.

**Type.** Cormorant Garamond 300 for display (standing in for Faire Octave) and
Inter 400/500/600 for UI (standing in for Suisse Intl). The serif is scoped:
wallet titles and deck slides only, never a portal. The scale runs 12 / 14 / 16
/ 18 / 20 / 24 / 32 / 48 on a 4px rhythm, floor raised to 12px because the
wallet has elderly users on small phones. Every timestamp, ID and count uses
tabular figures.

**Backgrounds and imagery.** Flat colour only. No photography, no illustration,
no hand-drawn marks, no textures, no repeating patterns, and **no gradients** —
including in loading skeletons, which are solid Border Mist blocks rather than
shimmer sweeps. No imagery was supplied and none should be invented; where a
surface feels bare, the answer is a tinted panel, not a picture.

**Spacing, shape, layout.** 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96. Radius
12 card / 8 control / 999 badge / 4 icon container. Portals run full width with
24px gutters — a referral table should use the monitor it is on — while the
wallet is a single 16px-gutter column and marketing surfaces cap at 1200px. The
session bar is the only fixed portal element; the wallet's tab bar is the only
fixed mobile one.

**States.** Hover is a Keylime Wash fill on rows, ghost buttons and nav items;
primary buttons darken to Forest Shadow. There is no shrink, lift or scale on
press — the system does not bounce. Transitions are 120ms colour-only eases;
nothing slides, fades in on scroll, or animates on load. Disabled is a Border
Mist fill with Disabled Ink text and no border. Focus is a 2px Forest Ink ring
at 2px offset, on every interactive element, on every surface, always.

**Borders.** Border Strong `#c2bfb6` divides table rows and outlines cards.
Border Input `#8f8c84` outlines controls at 3.33:1. Border Mist `#efeeeb` is
decorative hairline only — at 1.15:1 on cream it is invisible and must never
carry a functional division. Queue rows in a failure or attention state take a
3px left border in clay or amber: border, not fill, because thirty tinted rows
become noise.

**Transparency and blur.** Used once, for the modal scrim. No frosted panels,
no translucent headers, no blurred backdrops anywhere else. Protection
gradients do not exist because there is no imagery to protect text against.

---

## Iconography

- **Web portals: Lucide**, 1.5px stroke, 20px default, 16px inside badges and
  buttons, coloured Forest Ink unless the icon sits in a clay or amber context,
  where it takes that hue.
- **Wallet (Android): Material Symbols Rounded**, loaded as a webfont in the
  wallet kit.
- **Every status badge carries an icon *and* a text label.** Colour never
  carries state alone: roughly 8% of men have red-green colour vision
  deficiency, clay and amber are exactly the pair they struggle with, and decks
  get printed in grayscale.
- **No emoji, ever.** No unicode characters used as icons. No hand-drawn SVG
  substitutes.

**Substitution flagged:** no icon assets were supplied, so both sets are loaded
from CDN — Lucide `0.460.0` via unpkg inside `components/core/Icon.jsx`, and
Material Symbols Rounded via Google Fonts in the wallet kit. If VITAL has (or
licenses) its own glyph set, replace `Icon.jsx`'s loader and drop the binaries
into `assets/`.

**Logo:** none was supplied. The brand name is set in plain type wherever a
mark would go — Cormorant Garamond 300 at 0.1em tracking on Forest Ink, or Inter
600 at 0.14em in portal chrome (see the Wordmark card). No mark has been drawn
or reconstructed.

**Fonts:** Faire Octave and Suisse Intl are commercially licensed and were not
supplied. Cormorant Garamond and Inter are the authoritative substitutes per
DESIGN.md §2.1 and are loaded from Google Fonts in `tokens/fonts.css`.

---

## Index

| Path | What it is |
|---|---|
| `styles.css` | The single entry point consumers link. `@import` list only. |
| `tokens/colors.css` | Palette, neutrals, semantic hues, status-group aliases |
| `tokens/typography.css` | Families, scale, tracking, `.tabular`, `.column-header` |
| `tokens/spacing.css` | 4px scale, radius, density scopes, targets, layout |
| `tokens/elevation.css` | The three shadow exceptions, scrim, focus ring |
| `tokens/fonts.css` | Webfont loading and the substitution note |
| `tokens/base.css` | Body, heading and link defaults |
| `guidelines/*.card.html` | 19 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `components/` | Reusable primitives, grouped by concern |
| `ui_kits/rhu-portal/` | RHU / clinic portal recreation |
| `ui_kits/lab-portal/` | Laboratory portal recreation |
| `ui_kits/patient-wallet/` | Patient wallet (Android) recreation |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent Skills wrapper for use outside this project |
| `uploads/DESIGN.md` | The source spec. Authoritative over anything here. |

### Components

DESIGN.md §6 and §7 define the inventory; these are exactly those families.

**Core** — `Button`, `IconButton`, `Card`, `Icon`
**Forms** — `Input`, `Select`, `Checkbox`
**Status** — `StatusBadge`, `StatusTrail`, `QueueRow`
**Data** — `DataTable`
**Feedback** — `Dialog`, `EmptyState`, `Skeleton`, `OfflineBanner`, `Toast`
**Navigation** — `SessionBar`

Each directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` and one
`@dsCard` preview page.

**Intentional additions.** `Icon` — a wrapper for the Lucide set the spec names
but does not componentise. `IconButton` — §3.4 specifies a 32px icon-only
portal target, which implies the control. `Select` and `Checkbox` — §7.1
specifies input behaviour generally; the referral form and the consent grant
both need them. `QueueRow` — §6.4's status-bordered row as a standalone
primitive for non-tabular lists. `Card` — the surface-layering rule of §4
expressed as a component. Nothing else was invented.

### Open questions carried from the spec

No-show vs Overdue as one state or two; the wallet treatment of an active
consent grant; whether wrong-patient-result is a state or an incident path.
All three affect the status system and are unresolved.
