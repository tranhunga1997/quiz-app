# Visual Redesign — Design Spec

**Date:** 2026-08-29
**Status:** Approved for planning

## Overview

A visual-language refresh of the existing quiz-app UI, inspired by a
referenced Figma dashboard design
([source](https://www.figma.com/design/QczdbBhik8uMm85S3y1sWt/Dashboard-for-E-Learning--Community-?node-id=1-412)).

**Scope is explicitly visual, not structural.** All 5 existing screens keep
their current layout, navigation, and information architecture exactly as
they are (no sidebar, no new screens, no changed user flows) — confirmed
with the user, who chose "chỉ lấy ngôn ngữ thiết kế" (design language only)
over adopting the reference's sidebar navigation structure. What changes is
purely the visual treatment: color palette, typography, spacing, corner
radius, shadows, and small component patterns (badges, icon tiles, pills).

All 5 screens' redesigned direction were validated with the user via the
visual brainstorming companion (before/after mockups for Home, Quiz session,
Results, Deck detail, and Import) and approved as-is, no revisions
requested.

## Design Tokens

Extracted from the reference design (eyeballed from a high-resolution
screenshot — the Figma file's `get_design_context` API was unavailable in
this environment, so exact hex/token values were estimated visually rather
than pulled programmatically; close enough for a "design language"
reference, not a pixel-exact port).

| Token | Value | Usage |
|---|---|---|
| `accent` | `#4F6EF7` | Primary buttons, active/selected states, links, gradient banner |
| `accent` (gradient end) | `#6C7FF0` | Second stop for the accent gradient banner (Home's review-due callout) |
| `bg` | `#EEF0FA` | Page background (replaces plain white) |
| `card` | `#FFFFFF` | Card/surface background |
| `text-primary` | `#1A1A2E` | Headings, primary body text |
| `text-secondary` | `#8A8FA3` | Meta text, captions, secondary labels |
| `success` | `#22C55E` | Correct-answer state, success accents |
| `success-bg` | `#E8F9EF` | Tinted background for success badges/icon tiles |
| `warning` | `#F5A623` | Secondary accent (e.g. deck icon tiles), warning badges |
| `warning-bg` | `#FEF3E2` | Tinted background for warning badges/icon tiles |
| `danger` | `#F4645A` | Wrong-answer state, error accents |
| `danger-bg` | `#FDECEC` | Tinted background for danger badges |
| `radius-card` | `20px` | Cards, banners, drop zones, the accordion's outer container |
| `radius-control` | `12px` | Buttons, inputs, primary/secondary action pills, icon tiles |
| `radius-badge` | `8px` | Small status badges/pills (CSV row status, "Lưu"/"Huỷ"/"Xoá" mini-buttons) |
| `shadow-card` | `0 8px 24px rgba(27,37,89,0.08)` | The one soft shadow used on every card/surface — no other shadow values |
| Font | **Plus Jakarta Sans** (Google Fonts) | Replaces the current default system sans-serif app-wide |
| Heading weight | 700–800 | `h1`/`h2` and emphasized numbers (score %, counts) |
| Body weight | 500–600 | Card titles, button labels, list item text |
| Body weight (secondary) | 400 | Captions, meta text, placeholders |

These map onto `tailwind.config.ts` as an extended theme (custom colors,
`borderRadius`, `boxShadow`, `fontFamily`) rather than one-off inline
styles, so every screen pulls from the same source instead of repeating
hex values.

## Component Patterns

A few small, reusable visual patterns recur across the mockups and should
become shared conventions (not necessarily extracted into new React
components unless the implementation plan decides that's warranted — see
Implementation Notes):

- **Card surface**: white background, `radius-card`, `shadow-card`, no
  border. Every card-like container (deck tiles, question list, import
  drop zone, quiz option buttons when unselected, result action buttons)
  uses this same treatment instead of a plain border.
- **Icon tile**: a small rounded-square tile (~40×40px, `radius-control`)
  with a tinted background (`success-bg`/`warning-bg`) containing an emoji
  or icon — used for deck cards and could extend to other icon+label
  pairings later.
- **Status pill**: small `radius-badge` badge with tinted background +
  matching text color (`success`/`danger`) — used for CSV-import row
  status and could extend to other status indicators.
- **Primary button**: `accent` background, white text, `radius-control`,
  a colored soft shadow (`0 4px 12px rgba(79,110,247,0.35)`) instead of a
  flat fill — reserved for the one primary action per screen.
- **Secondary button**: white background, `shadow-card` (no border),
  `text-primary` or a semantic color for the label — used for
  everything that isn't the primary action.
- **Answer feedback (quiz)**: correct/wrong options get a 2px colored
  border + tinted background + a small circular ✓/✗ badge, replacing the
  current thin-border-only treatment. Unselected options get the card
  surface treatment instead of a plain border. This changes visual weight
  only — the underlying interaction, phase state machine, and animation
  timing (color-fade, no shake/bounce, per the original app spec) are
  unchanged.

## Per-Screen Notes

- **Home**: review-due callout becomes a gradient `accent` banner (replaces
  the orange-bordered box); deck tiles become cards with an icon tile;
  heading typography goes bold/larger.
- **Quiz session**: progress bar becomes thicker and fully rounded;
  options use the card-surface / answer-feedback patterns above; buttons
  use the primary-button pattern.
- **Results**: score indicator becomes a thicker conic-gradient ring
  (still renders instantly, no reveal animation — unchanged from the
  original app spec); action buttons become pills, with "review mistakes"
  promoted to the primary-button treatment since it's the most actionable
  next step after a session with misses.
- **Deck detail (question accordion)**: the question list becomes one
  card containing all rows; the open row gets a subtle background tint to
  separate it from collapsed rows; the correct-answer checkbox becomes a
  pill-style toggle; Lưu/Huỷ/Xoá become small pill buttons.
- **Import**: the drop zone becomes a card with more padding; the deck-name
  input and validation badges adopt the pill/card treatment; the confirm
  button uses the primary-button pattern.

## Out of Scope

- Any change to layout, navigation, or information architecture (no
  sidebar, no new pages, no changed user flows).
- Any change to animation behavior — the color-fade/slide/instant-score
  timings from the original app spec are untouched; only the static
  colors/shapes those animations transition between are changing.
- Any change to application logic, data model, or Server Actions — this
  is a styling-only pass.
- Pixel-exact reproduction of the referenced Figma file — it was used as
  visual inspiration for a design language, not a literal port (confirmed
  with the user; the reference includes screens/widgets — grades, groups,
  messages — that don't exist in quiz-app at all).

## Implementation Notes (for the plan)

- Extend `tailwind.config.ts` with the token table above (`theme.extend`:
  custom `colors`, `borderRadius`, `boxShadow`; add the Google Font via
  `globals.css` `@import` or a `<link>` in the root layout, plus a
  `fontFamily` extension).
- Apply the new tokens/patterns file-by-file across the 5 screens'
  existing components — no new routes, no new Server Actions, no schema
  changes. Each file keeps its current structure; only `className` values
  change (plus the shared Tailwind config).
- No new automated tests are needed for a pure styling change beyond the
  existing suite continuing to pass unchanged (component structure,
  `data-*`/text content, and interactive behavior are not changing) — the
  existing unit + E2E suite is the regression safety net.
