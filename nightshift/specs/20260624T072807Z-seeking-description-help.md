# Spec — seeking-description-help

## Goal
On the "Post a Seeking Listing" form (`/partnerships/seeking/new`), help pilots write a
great "what I'm looking for" description by adding inline writing tips plus two concrete
example descriptions, so the Description field is no longer a blank-page barrier.

## Lane
[want] (last non-bug cycle `compare-faq-jsonld` pulled [goal]; last cycle PASS → no blocker →
[want] owed per the 1:1). Closes slice 2 of the **[P1][want] Post-a-Seeking form: make it
frictionless** item ("description help outside the box on how to write a great description,
with examples of good writing") — the explicit "Next" queued by the `post-seeking-frictionless`
cycle.

## Scope (small — one file)
- `src/components/PostSeekerListingForm.tsx` — in the existing **Listing Details** section,
  around the Description `<textarea>`:
  - A short writing-tips helper (3–4 concrete, plain-language bullets) shown **outside the box**.
  - A native `<details>` "See two example descriptions" disclosure with two genuine, distinct
    example descriptions (e.g. a first-time-buyer pilot and an experienced IFR/time-builder),
    so there is no client-side JS/state and it renders in the prerendered HTML.

## Acceptance criteria
- The Description field gains a visible "How to write a great description" tips block (≥3 tips)
  above/around the textarea, plus a collapsible block containing **two** example descriptions.
- Pure presentational/static content: no new client state, no new form fields, no schema change,
  no change to `createSeekerListing` or what's submitted.
- `npx next build` + `tsc --noEmit` pass (no new errors in the touched file).
- The page still prerenders (`○` static); the tips text + both examples are present in the
  built HTML.
- QA: at desktop 1280 + mobile 375 — HTTP behavior unchanged (auth-gated), zero horizontal
  overflow, zero app-origin console errors when rendering the form HTML; screenshots show the
  tips + examples reading cleanly and stacking at 375px.

## Out of scope
- Autosave / "Saving…/Saved" indicator (separate slice 3).
- "Generate with AI" title/description button (separate [P2][want] item).
- Any change to the partnership (supply-side) form, the seeking schema, or contact fields.
- Multiple base airports / drive-time (other slices of this item).
