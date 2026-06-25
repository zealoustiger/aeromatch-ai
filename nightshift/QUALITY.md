# Night Shift — Code Quality Log

Newest first. The drain spot-checks ~25% of PASSed cycles on the strong model
(Opus) to grade code quality the automated gate can't see. Scores 1-5.

## 2026-06-25T10:03:39Z — seeking-drive-time — score 4/5
- Strengths: Tight, on-spec diff; new `travelLabel` helper matches utils.ts conventions/doc style, is the single source of truth across both display sites, and gracefully clamps legacy nm values (150/200) into the top bucket so no schema change is needed.
- Weaknesses / risks: none material — spec asked for "~2+ hr drive" but ships "~2 hr drive", so legacy 150/200 nm listings read as a flat "~2 hr drive" (understated); detail-page copy "willing to commute ~30 min drive" doubles up commute+drive and reads slightly awkward.
- Follow-up: none

## 2026-06-25T08:58:18Z — saved-listing-note — score 4/5
- Strengths: All 7 acceptance criteria met; owner-scoped action, dual char-cap, ⌘/Ctrl+Enter & Esc, a11y labels, and a real graceful-degradation path when the note column is unmigrated.
- Weaknesses / risks: none material — `displayNote` comment mislabels post-confirm update as "optimistic"; redundant `?? []` on an always-array `savedRows`.
- Follow-up: none
