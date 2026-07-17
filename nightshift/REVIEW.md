## 2026-07-17T13:23:48Z — Night Shift run: 13 cycles (PASS 10 / FAIL 1) — night budget cap ($120)
- Models: cycles on sonnet; 1 escalated to opus; 3 quality-judged on opus
- Night spend so far: $120.0750 of $120 cap

- ABORT — none — plan needed`
- PASS — footer-alert-context — the site-wide footer email-alert box now derives page-specific context (e.g. Get email alerts for new Cessna 172 listings) from the URL on make/mo
- cycle produced no verdict (exit 124)
- PASS — aircraft-hub-sticky-alert-bar — mobile sticky Get alerts bar now on all 7 aircraft SEO hub pages, plus fixed a CompareProvider reveal bug that would have left it dead on
- PASS — partnership-hub-sticky-alert-bar — Added the mobile scroll-revealed Get alerts for this search sticky bar to the 3 partnership hub pages (`/partnerships/make/[make]`, `/
- PASS — compare-hub-alert-capture — Added an email alert-capture box to `/aircraft/compare` (the head-to-head comparison index), which previously had none while every child comp
- PASS — alert-zero-match-welcome — confirming a brand-new alert with zero live matches now sends an honest you're confirmed, we're watching welcome email (with an optional real 
- PASS — alert-manage-duplicate — Added a per-row Duplicate this alert button on /alerts/manage that pre-fills the new-alert form from an existing alert's criteria, frequency, an
- PASS — alert-unsubscribe-recover-all — combined-digest unsubscribe links now let a subscriber recover ALL covered alerts (not just the first) via the `/alerts/status` pause / s
- PASS — alert-price-drop-only-mode — added a 3-state alert control (New+drops / New only / Drops only) to `/alerts/manage` and `/searches`, closing out plan-pass batch #2 in the
- ABORT — none — plan needed`
- PASS — alert-resubscribe-after-unsubscribe — a subscriber who unsubscribes from an alert and later re-enters the same email now actually gets resubscribed (fresh confirm email 
- PASS — alert-confirm-deeplink — added an Open Gmail/Outlook/Yahoo/iCloud/AOL inbox deep link + spam-folder line to the `AlertSignup` pending-confirmation panel, shipped and mer

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 7.7 on 2 cores, sustained ~23 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 13 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-17T10:18:09Z — Night Shift run: 21 cycles (PASS 15 / FAIL 3) — backlog drained (planner cap 2)
- Models: cycles on sonnet; 3 escalated to opus; 4 quality-judged on opus
- Night spend so far: $69.1683 of $120 cap

- ABORT — none — plan needed
- cycle produced no verdict (exit 124)
- PASS — alert-any-listing-target — bare-`/` any new listing alerts now match, count, and fire (aircraft ∪ partnerships) across the site's 5 widest capture points
- PASS — match-alert-opt-out-toggle — added a per-listing pause these emails toggle on `/listings` next to the existing match-alert disclosure, so partnership/seeker owners can n
- cycle produced no verdict (exit 124)
- PASS — mobile-sticky-watch-bar-detail — aircraft listing detail pages now show a scroll-triggered Watch this listing price-drop bar on mobile, reusing the browse bar's one-tap 
- PASS — saved-page-watch-offers — /saved now offers a one-tap email me if the price drops alert on every saved aircraft/partnership row, live-verified end-to-end against the rea
- PASS — contactbar-watch-button — added a one-tap Watch (price-drop alert) button to /partnerships/[id]'s mobile ContactBar, closing the remaining partnerships slice of the mobi
- PASS — feedbackwidget-mobile-overlap — Fixed the tier-1 bug filed last cycle: the floating Feedback button now sits well above mobile sticky bottom bars (raised to `bottom-24` 
- PASS — footer-alert-capture-known-subscriber — the site-wide footer alert-signup box now shows a quiet you're getting alerts line (instead of re-asking) for a browser that alre
- PASS — homepage-known-subscriber-recap — added a Since your last visit module near the top of `/` that shows known alert subscribers real, live new-match counts for their own r
- ABORT — none — plan needed
- PASS — seeker-filter-alert-chip — added the one-tap Alert me for this search chip to /partnerships/seeking's filter toolbar, reusing AlertMeChip with a new distinct `filter_too
- PASS — seeker-sticky-alert-bar — added a mobile scroll-revealed Get alerts for new pilots sticky bar to `/partnerships/seeking` (reusing the existing `MobileStickyAlertBar`), f
- PASS — partnershiplaunchbanner-funnel-parity — added a one-shot impression event + known-subscriber you're on the list state to `PartnershipLaunchBanner` (live on 5 partnership
- cycle produced no verdict (exit 0)
- PASS — watch-offer-funnel-parity — finished an interrupted cycle: `SavedListingWatchButton` (`saved_page_watch`) and `SaveListingButton`'s save→watch cross-sell banner (`save
- PASS — alert-matchcount-bare-root — Threaded real N listings match right now live counts into the 4 widest bare-`/` alert boxes (homepage, /about, 404 page, /saved), and fixed 
- PASS — digest-edit-alert-link — combined alert-digest email sections now carry an Edit this alert link that deep-links straight into a pre-opened, pre-filled edit form on `/ale
- PASS — alert-manage-row-overflow — Fixed the filed P1 bug where `/alerts/manage`'s row action buttons overflowed at 375px, plus a second deeper instance of the same `shrink-0`/
- ABORT — none — plan needed

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.6 on 2 cores, sustained ~39 min — parallel drains are contending; consider more cores or lower --cpus per container
- 2 of 21 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-16T12:12:19Z — Night Shift run: 9 cycles (PASS 8 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 3 quality-judged on opus
- Night spend so far: $121.5590 of $120 cap

- ABORT — none — plan needed`
- PASS — sharecost-calc-model-link — threaded the aircraft listing's make/model into ShareCostPanel's Run your own numbers link so it lands on the model-aware cost-calculator ale
- PASS — aircraft-browse-hub-alert — added an alert-capture box to /aircraft/browse (the zero-capture navigation-index hub), and corrected the batch-#3 backlog item after finding
- PASS — footer-alert-capture — added a slim email-alert capture band to the site footer (renders on every page) so no page is missing an alert entry point, with a remembered-ema
- PASS — partnership-banner-alert-tracking — wired the missing `alert_subscribed` PostHog event into `PartnershipLaunchBanner` (renders on 5 partnerships pages), closing an analy
- PASS — listings-match-alert-disclosure — `/listings` now discloses the weekly automatic match-alert email (real send date or honest none sent yet) on each active partnership/se
- PASS — share-alert-chip-attribution — AlertMeChip (filter-toolbar chip) and MobileStickyAlertBar now detect `?share=alert`, tag conversions `source: 'shared_alert'`, and show t
- PASS — right-noun-capture-sweep — added an alert-signup box to the last 3 zero-capture pages (`/about`, `/post`, `/listing-quality`); build/typecheck/QA all green, live-verifie
- PASS — alertsignup-matchcount-sweep — Guide and tool-calculator pages' get alerts boxes now show an honest live match count (e.g. 23 partnerships match right now), closing out 

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.0 on 2 cores, sustained ~13 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-16T10:43:11Z — Night Shift run: 24 cycles (PASS 20 / FAIL 1) — backlog drained (planner cap 2)
- Models: cycles on sonnet; 1 escalated to opus; 2 quality-judged on opus
- Night spend so far: $95.1462 of $120 cap

- PASS — alert-edit-live-match-count — the alert-edit form on `/alerts/manage` now shows a live N listings match right now preview (with an honest 0-match warning) as a subscribe
- PASS — account-alerts-inline — Signed-in `/account` now shows real email-alert subscriptions inline (context, status, last-sent) instead of just linking away, retitled the misl
- PASS — overlapping-alert-nudge — Added a conservative already covered by your other alert nudge on /alerts/manage that lets subscribers one-click remove a redundant narrower al
- PASS — admin-alert-subscriber-lookup — added an email-based subscriber lookup + one-click manage-link resend to `/admin/alerts`, so the human has a support view for I can't fin
- PASS — alert-cron-run-log — added a Cron health panel on /admin/alerts (last-run counts + a red flag if no successful alert-digest cron run in >36h), backed by a new additive `
- ABORT — none — plan needed`
- PASS — alert-remembered-email-one-tap — returning signed-out alert subscribers now get a one-tap Alert me — you@x.com button (no retyping) on every capture surface (AlertSign
- PASS — alert-digest-per-alert-stop-link — combined alert-digest emails now let a subscriber stop just one alert instead of all of them, via a per-section link reusing the exist
- PASS — alert-watch-target-price — Added an optional target-price threshold to watch-a-listing price alerts (aircraft + partnership) so subscribers only get emailed once the pri
- PASS — alert-found-my-aircraft-exit — added a one-tap Found my aircraft 🎉 exit on the alert unsubscribe-recovery page, turning a success (bought the plane) into a distinguis
- PASS — nav-alert-new-since-pill — the returning-subscriber nav pill now shows an honest My alerts · N new count when a subscriber's saved searches have real new matches since 
- PASS — admin-email-template-gallery — new `/admin/alerts/emails` admin-gated read-only page renders all 11 `email.ts` builders (real live DB samples for confirm/digest/combined
- PASS — email-engagement-stats — Tagged every outgoing alert email by type and extended the Resend webhook to log `email.opened`/`email.clicked` into a new fail-soft table, roll
- ABORT — none — plan needed`
- PASS — tools-hub-alert-capture — Added email-alert signup boxes to `/tools/earnings-calculator` (demand-side notify me when a pilot starts seeking a partnership) and the `/tool
- PASS — guide-alert-right-noun — the 2 aircraft-buyer guide pages now offer the correct aircraft-scoped alert (not partnership), and all 8 guide pages got distinct source tags f
- PASS — alert-watch-target-price-edit — added set/edit/remove control for the target price on watch alerts at `/alerts/manage`, closing a management gap that previously required
- PASS — save-watch-crosssell — hearting an aircraft-for-sale or partnership listing (signed-in) now offers a one-tap alert me if the price drops banner right at the heart button
- PASS — digest-dedupe-crosssection — combined alert-digest emails no longer show the same matching listing's photo card twice when it matches two of a subscriber's overlapping a
- cycle produced no verdict (exit 124)
- PASS — alert-share-invite — per-row Share on /alerts/manage copies a co-buyer invite link; recipients see a shared with you note and set up their own alert, with the share mark
- PASS — alert-scoreboard-trend — Added an 8-week subscribed-vs-confirmed trend sparkline to `/admin/alerts` (pure, unit-tested bucketing helper; honestly omits an unsubscribed t
- PASS — cost-calc-model-alert — the cost calculator's alert-signup box now knows which aircraft you're pricing out when you arrived via a curated make/model page's Estimate your
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.7 on 2 cores, sustained ~20 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 24 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-14T12:23:32Z — Night Shift run: 7 cycles (PASS 6 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 2 quality-judged on opus
- Night spend so far: $124.0246 of $120 cap

- PASS — home-recently-viewed-alert-banner — Mounted the personalized you've been looking at X alert banner on the homepage, replacing the generic alert band when a returning vis
- PASS — alert-email-preheader — added hidden inbox-preview text (derived from real counts/prices, never fabricated) to all 4 alert email templates (confirm, digest, combined dig
- PASS — alert-avionics-match — Aircraft alerts now honor the avionics filter (glass panel/ADS-B/autopilot/WAAS/GPS) end-to-end instead of silently stripping it, so a glass-panel
- ABORT — none — plan needed`
- PASS — partnership-alert-model-match — partnership alerts now honor the `model` filter (previously silently matched every partnership of that make) end-to-end, including a seco
- PASS — partnership-filled-landing — closed/filled partnership URLs now show an honest filled or taken down page (200+noindex, similar-partnerships rail, alert signup) instead o
- PASS — alert-edit-hidden-criteria — /alerts/manage's Edit form now shows any advanced-search criteria (min_year/max_tt/avionics/grade/q, or a partnership's model) hiding on an 

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 5.0 on 2 cores, sustained ~9 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-14T10:51:18Z — Night Shift run: 25 cycles (PASS 20 / FAIL 2) — safety cap (25)
- Models: cycles on sonnet; 2 escalated to opus; 4 quality-judged on opus
- Night spend so far: $91.6780 of $120 cap

- PASS — deals-page-alert-capture — Added an email-only get alerts for good deals capture box to /aircraft/deals (the highest-intent browse page, previously with no alert entry p
- PASS — alert-local-subscriber-memory — Email-only alert subscribers now get a you're already getting alerts for this state on return visits (device-local memory, no account nee
- PASS — alert-vacation-mode — Added bulk Pause all / Resume all (vacation mode) to `/alerts/manage` so a subscriber with multiple alerts can pause or resume them all in one clic
- PASS — compare-page-alert-capture — Added alert-subscription boxes (one per compared model) to the curated `/aircraft/compare/[comparison]` pages, closing the last browse-famil
- PASS — alerts-sample-preview — Added a live what you'll get sample-listing preview (real photo/title/price/location, up to 3 per chip) to the /alerts landing page, honesty-gate
- PASS — alert-digest-market-pulse — Added an honest N Cessna 172s listed right now, median asking $89k market-context line to the aircraft alert digest email (single + combined 
- PASS — resend-bounce-webhook — Added `/api/webhooks/resend`, which auto-pauses a subscriber's alerts on a verified hard email bounce (distinct Bounced status + resume flow on `
- ABORT — none — plan needed`
- PASS — compare-tray-alert-capture — added deduped alert-signup boxes to the `/compare` tray page (previously zero alert capture), one box per distinct make/model family among t
- ABORT — alert-email-change — added Change the email these alerts go to on `/alerts/manage`, moving every alert an owner has to a new address via double-opt-in confirmation, and
- PASS — filter-toolbar-alert-chip — Added a one-tap 🔔 Alert me for this search chip to the active-filter toolbar on `/aircraft` and `/partnerships`, so filtered visitors can 
- PASS — partnership-digest-market-pulse — Partnership alert digest emails now show an honest N {Make} partnerships listed right now, median buy-in $X market-context line (make-l
- PASS — price-drop-market-pulse — the single-listing price-drop alert email now shows the same honest N Cessna 172s listed right now, median asking $X market-pulse line the aggr
- PASS — aircraft-make-pulse-line — Make-only aircraft alerts (e.g. any new Cessna) now get an honest market-pulse line (142 Cessnas listed right now, median asking $X) in digest
- cycle produced no verdict (exit 0)
- PASS — admin-alerts-scoreboard — new read-only /admin/alerts tab: alert status breakdown, weekly live-subscriber trend, and top converting page families (honest DB-backed, no f
- PASS — digest-feedback-vote — Added a one-click 👍/👎 Was this digest useful? footer link to alert digest emails, backed by a new token-authed vote route that logs into the
- ABORT — none — plan needed`
- PASS — alert-spam-complaint-unsubscribe — Resend webhook now auto-unsubscribes an address the instant it reports a spam complaint (terminal status, no auto-resume), mirroring t
- PASS — alert-digest-legacy-active-status — fixed a P0 bug where the alert digest cron only queried `status='confirmed'`, silently excluding real subscribers stuck on the legacy
- cycle produced no verdict (exit 124)
- PASS — alert-capture-impression-events — card price-drop bells and the Alert me for this search filter chip now fire view + open analytics events, giving those two tap-to-open 
- PASS — alert-source-column — Added an additive `alerts.source` DB column and threaded the already-known placement tag through all 9 alert-subscribe insert paths (with the stand
- PASS — admin-alerts-source-ranking — Added a Top placements ranking section to `/admin/alerts` showing live/pending counts and confirm-rate per alert-capture placement (card be
- PASS — admin-alerts-digest-vote-rollup — added a 👍/👎 digest-feedback rollup (totals, week-over-week, recent votes) to /admin/alerts, closing the flagged follow-up from di

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.6 on 2 cores, sustained ~18 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 25 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-13T12:16:30Z — Night Shift run: 11 cycles (PASS 8 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 3 quality-judged on opus
- Night spend so far: $120.6019 of $120 cap

- ABORT — none — plan needed
- PASS — alert-aircraft-filter-honesty — aircraft alerts now honor `min_tt`, `airport`, and `model_like` filters that the browse-page capture already promised but the digest cron
- PASS — alert-query-grade-honesty — aircraft alerts now honor the `q` (free-text) and `grade` filters they already promised in capture copy, shared grade-band logic extracted in
- PASS — alert-instant-first-digest — a confirmed alert with real matches now gets its first digest email sent immediately instead of waiting for the next cron pass, with honest 
- PASS — aircraft-card-watch-alert — Added a one-tap price-watch bell to every aircraft browse-grid card, reusing the existing detail-page `AlertSignup watchOnly` machinery (no f
- PASS — partnership-card-watch-alert — Added the same one-tap watch if the buy-in drops bell to `PartnershipCard` that aircraft cards got last cycle, closing the gap the prior c
- PASS — alert-status-matching-cta — added a See the N matching listings → / See this listing → CTA to the confirmed alert panel on `/alerts/status`, so the live match count 
- PASS — recently-viewed-alert-banner — Added a device-local you've been looking at X alert suggestion banner on /aircraft and /partnerships (>=3 clustered listing views, honesty
- ABORT — alert-digest-cross-sell — PASS — Added a one-click also want alerts for X? cross-sell suggestion to the alert digest emails (both the single and combined templates), 
- ABORT — none — plan needed`
- PASS — mission-alert-sourcepath-fix — Fixed alerts on all 10 browse by mission pages (glass cockpit, IFR, tailwheel, etc.) that were silently dead — they used to capture an u

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.0 on 2 cores, sustained ~12 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-13T10:12:56Z — Night Shift run: 22 cycles (PASS 17 / FAIL 2) — backlog drained (planner cap 2)
- Models: cycles on sonnet; 2 escalated to opus; 2 quality-judged on opus
- Night spend so far: $80.2738 of $120 cap

- PASS — alert-deal-only-edit-toggle — added a good deals only checkbox to the aircraft alert edit form on /alerts/manage so subscribers can flip that filter on an existing alert
- PASS — saved-alert-model-scoping — `/saved`'s get alerts box now offers a model-scoped alert (e.g. Cessna 172) instead of just make-level when a visitor's saves genuinely clust
- PASS — alert-snooze-pause-until — Added a Snooze 30 days option next to Pause on `/alerts/manage` and the unsubscribe-recovery box, with an honest auto-resume (real resume date
- ABORT — none — plan needed
- PASS — alerts-manage-watch-status — Watch-alert rows on /alerts/manage now show Watching: {aircraft} — ${price} today with a View link, or an honest No longer for sale messag
- PASS — alert-browse-matchcount — the get new-listing alerts box on /aircraft and /partnerships now shows the real, filter-aware N match right now count, closing the last flagge
- PASS — alert-confirm-email-matches — The double-opt-in alert confirmation email now shows up to 3 real currently-matching listings (Here's what you'd be watching) above the con
- PASS — partnership-watch-buyin-alert — added a watch this partnership buy-in-drop alert box on `/partnerships/[id]`, parity with the existing aircraft listing-watch alert, clos
- PASS — alerts-manage-last-sent-line — Added a Last email {date} · checks {daily
- PASS — alert-widen-nudge — Added a verified one-click widen suggestion (or honest nothing close yet fallback) to `/alerts/manage` for confirmed alerts with 0 live matches; caug
- PASS — alert-confirm-reminder — cron now sends one honest still want these alerts? reminder email to alert subscribers who signed up but never confirmed, closing the last open 
- ABORT — none — plan needed`
- cycle produced no verdict (exit 124)
- PASS — partnership-post-contact-alert-crosssell — a pilot who messages a partnership listing now gets a Message sent! panel offering family-scoped alerts (desktop form + mobile
- PASS — post-success-alert-crosssell — Added a family-scoped get alerts for new {Make} {Model} listings one-click signup inside the your listing is live! success banners on `/ai
- PASS — alerts-manage-partnership-watch-status — `/alerts/manage` now shows live status (Watching: 1/3 Share · Cessna 172S Skyhawk — $18,000 buy-in today · View listing) for
- cycle produced no verdict (exit 124)
- PASS — alert-status-funnel-events — /alerts/status now fires source-tagged `alert_confirmed`/`alert_unsubscribed` events so the alert conversion funnel no longer goes dark at c
- PASS — alert-email-utm-attribution — tagged listing/manage links in the confirm, weekly-digest, price-drop, and combined-digest alert emails with UTM params (`utm_source=alert_
- PASS — watch-alert-family-crosssell — confirming a watch-listing price-drop alert now offers a one-click alert me for the whole {Make} {Model} family cross-sell (honesty-gated,
- PASS — empty-state-widen-alternative — added a one-tap, server-verified widen the search alternative to the zero-match alert-capture boxes on /aircraft, /partnerships, and /par
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 5.9 on 2 cores, sustained ~32 min — parallel drains are contending; consider more cores or lower --cpus per container
- 2 of 22 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-12T12:24:16Z — Night Shift run: 15 cycles (PASS 12 / FAIL 1) — night budget cap ($120)
- Models: cycles on sonnet; 1 escalated to opus; 4 quality-judged on opus
- Night spend so far: $123.2147 of $120 cap

- ABORT — none — plan needed`
- PASS — alert-list-unsubscribe-header — Added RFC 8058 `List-Unsubscribe`/`List-Unsubscribe-Post` one-click headers to every alert email (confirm, resend, manage-link, digest, p
- PASS — alert-fewer-emails-footer — Daily-cadence alert emails (digest + price-drop) now carry a one-click Get fewer emails footer link that instantly switches the alert to week
- PASS — alert-match-count-expectation — added a live N listings match right now expectation line to `AlertSignup` on make/model and listing-detail pages, wired to real inventory
- PASS — alert-deal-only-filter — Added an Only email me good deals checkbox to aircraft alert signup boxes site-wide, so subscribers can opt into only getting emailed when a lis
- PASS — guides-alert-capture — added a partnership `AlertSignup` capture box to all 8 `/guides/*` guide pages plus the `/guides` index (previously zero alert entry points there)
- PASS — saved-page-alert-capture — Added a get new-listing alerts box to `/saved` (signed-in and logged-out device-saves views), naming the visitor's most-common saved make when
- PASS — alert-status-whats-next — `/alerts/status`'s confirmation panel now tells subscribers their real alert cadence and live match count (honest zero-case) instead of generic
- PASS — alert-sample-digest — Added a Send sample button on each confirmed alert row on `/alerts/manage` that emails the subscriber a real, honestly-labeled preview of their dig
- ABORT — none — plan needed
- PASS — alert-digest-combine — The alert-digest cron now sends one combined email per subscriber per pass (with a per-alert section) instead of a separate email for each due ale
- cycle produced no verdict (exit 124)
- PASS — listing-watch-price-alert — buyers can now set a watch this listing price-drop alert on a single aircraft listing page; sold/removed listings send one honest no longer a
- PASS — alert-capture-viewed-event — Added a fire-once-on-scroll-into-view `alert_capture_viewed` event to `AlertSignup` (used across ~24 alert placements) and `QuickStartSearch
- PASS — alert-matchcount-rollout — wired the live N match right now alert-box line into 6 more pages (aircraft make/state pages, partnership near/make/state/seeking pages) and h

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.1 on 2 cores, sustained ~15 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 15 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-12T09:37:58Z — Night Shift run: 21 cycles (PASS 16 / FAIL 2) — backlog drained (planner cap 2)
- Models: cycles on sonnet; 2 escalated to opus; 5 quality-judged on opus
- Night spend so far: $65.5754 of $120 cap

- PASS — auth-savesearch-concrete-copy — /auth now names the actual saved search (Your Cessna 172... search is saved...) instead of generic sign-in copy, fixing the follow-throug
- PASS — searches-inline-alert-settings — `/searches` rows with a confirmed alert now show inline Weekly/Daily + price-drop toggles and a Turn off alerts button (reusing `/alerts
- ABORT — none — plan needed
- PASS — partnership-alert-radius-match — partnership email alerts created from airport pages now honor their promised radius (e.g. 50mi around KPAO) instead of secretly matching
- PASS — alert-confirm-manage-link — Added a Manage alerts link to the alert double-opt-in confirmation email and the `/alerts/status` confirmed panel, closing the last email in 
- cycle produced no verdict (exit 0)
- PASS — alert-signup-already-subscribed — signed-in visitors who already have an alert for a page now see an honest You're already getting alerts for this — Manage alerts stat
- PASS/FAIL/ABORT line once it completes.
- PASS — footer-alerts-link — Added a Get email alerts link to the global footer's Explore column (the one piece of site-wide chrome with zero alert entry point) and audited `/al
- PASS — alerts-manage-cross-sell — Added the also want alerts for X? one-click cross-sell prompt to `/alerts/manage` (previously only on the one-time confirm page), so returning
- PASS — partnership-price-drop-cards — partnership alerts whose only news is a buy-in price drop now get rich photo/price preview cards in the digest email (parity with aircraft
- ABORT — none — plan needed
- PASS — alerts-manage-new-alert — Added a + New alert button on `/alerts/manage` that lets subscribers create a brand-new alert (type + criteria) right on the manage page instea
- PASS — alerts-manage-link-email — Added a self-serve email me my manage link option on the signed-out `/alerts/manage` page (plus a link from `/alerts`), so email-only alert su
- PASS — alerts-landing-popular-chips — `/alerts` landing page's popular alert chips (Cessna 172, Cirrus SR22, etc. + new Partnerships in California) are now honesty-gated agains
- cycle produced no verdict (exit 124)
- PASS — returning-subscriber-nav-state — the nav's Get alerts button now becomes My alerts → /alerts/manage for browsers that have set an alert (or visited the manage page), g
- PASS — unsubscribe-recovery-weekly — `/alerts/status`'s unsubscribe recovery box now offers a token-scoped Switch to weekly instead option (not just pause) plus a Manage all yo
- PASS — seeker-digest-sample-cards — the alert digest email's seeking a partnership alerts now show real preview cards (title, honest looking-for line, location) instead of a ba
- PASS — partnership-price-drop-email — Partnership alerts whose only news is a genuine buy-in-price drop now get the same rich single-listing price drop email (real photo, befor
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.1 on 2 cores, sustained ~15 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 21 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-11T13:18:56Z — Night Shift run: 5 cycles (PASS 5 / FAIL 0) — night ended
- Models: cycles on sonnet; 0 escalated to opus; 1 quality-judged on opus
- Night spend so far: $114.5929 of $120 cap

- PASS — price-drop-email-live — Wired the already-built rich single-listing price-drop email into the live daily/weekly alert-digest cron (picks the biggest genuine price cut am
- PASS — cost-calculator-alert-cta — added a get new-listing alerts capture point to `/tools/cost-calculator` (a new alert entry point where none existed), catching along the way
- PASS — seeker-alert-match-count-location — /alerts/manage's N pilots match right now count now respects a seeking alert's airport/state filter instead of ignoring location (mir
- PASS — partnership-digest-samples — the weekly alert-digest email now shows real preview cards (photo, share type, location, buy-in price) for partnership alerts, matching the 
- PASS — alert-cross-sell-nearby-state — the post-confirmation also want an alert? prompt on `/alerts/status` now offers a real, honesty-gated adjacent-state suggestion (e.g. Ces

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 5.1 on 2 cores, sustained ~19 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-11T12:32:04Z — Night Shift run: 25 cycles (PASS 22 / FAIL 1) — safety cap (25)
- Models: cycles on sonnet; 1 escalated to opus; 3 quality-judged on opus
- Night spend so far: $98.9692 of $120 cap

- PASS — partnership-detail-alert-cta — added a make/model-scoped Get alerts capture box to every /partnerships/[id] page sidebar, closing the last remaining listing-detail alert
- cycle produced no verdict (exit 124)
- PASS — alert-manage-edit-criteria — signed-in users can now edit an existing alert's make/model/state/price criteria inline on /alerts/manage instead of deleting and re-creatin
- PASS — aircraft-price-drop-alerts — weekly alert-digest email now notifies subscribers on genuine aircraft price drops (not just new listings), reusing existing `previous_price
- PASS — price-drop-email-template — Built a dedicated price-drop notification email (photo, struck-through old/bold new price, percent-off badge, CTA) plus a dev-only preview ro
- PASS — alert-price-drop-opt-in — Added a Also alert me when the price drops on a match checkbox (default on) to aircraft alert signup boxes and a matching On/Off toggle per ale
- PASS — alert-digest-frequency — added a Weekly/Daily digest cadence choice at alert capture (all listing types) and on `/alerts/manage`, scoped down from the backlog's instant 
- PASS — alert-digest-email-redesign — Rebuilt the weekly alert-digest email from a plain slate count-only notice into a warm-cream, on-brand email with real matching-listing pre
- PASS — airport-alert-cta — added the email-only Get alerts for new listings signup to every `/airports/[icao]` page (partnerships-scoped, matching the page's own search link), 
- PASS — alert-social-proof-count — added a live, honesty-gated N buyers get alerts for this line to the aircraft listing-detail and make/model alert-capture boxes, closing out t
- PASS — alert-cross-sell — Confirming an aircraft or partnerships alert now offers a one-click counterpart alert suggestion (e.g. Cessna aircraft → Cessna partnerships) on `/a
- PASS — seeker-share-metadata — pilot-seeking listing pages (`/partnerships/seeking/[id]`) now get real OG/Twitter share cards and a copy-link Share button, matching the pattern
- PASS — fix-double-site-suffix-title — fixed the doubled 
- ABORT — none — plan needed`
- PASS — sold-listing-alert-cta — Added an alert-signup box to the sold/removed aircraft listing page, the highest-intent alert moment on the site (buyer wanted this exact plane,
- PASS — branded-404-alert-catch — Replaced Next's bare default 404 with an on-brand ClubHanger not-found page (friendly copy, links to browse aircraft/partnerships, and a Get ne
- PASS — alert-live-match-count — Added an honest N listings match right now line to each alert on `/alerts/manage`, so subscribers can tell if an alert is well-scoped or dead.
- PASS — saved-search-alert-button — Added a one-click Get email alerts button to every row on `/searches` that turns a saved search into a real, working email alert, and fixed `
- PASS — alert-resend-confirmation — added a Resend confirmation email link on the alert signup form's post-submit state and a Resend button on pending alerts in /alerts/manage, 
- PASS — seeker-alert-airport-state — Pilot-seeking alerts saved with an airport/state filter on `/partnerships/seeking` no longer silently over-match on any new seeker anywhere;
- PASS — partnership-price-drop-alerts — partnership (buy-in) alerts now count genuine price drops in the weekly digest, labeled honestly as buy-in drop(s) distinct from new-list
- PASS — alert-cross-sell-sibling-model — the post-alert-confirmation cross-sell now suggests a curated sibling model (e.g. Cessna 172 → 182, SR20 → SR22) before falling back
- ABORT — none — plan needed`
- PASS — alert-manage-by-token — `/alerts/manage?token=<unsubscribe_token>` now lets email-only alert subscribers (no account) pause/resume/delete/edit/toggle their alerts from t
- PASS — alert-signin-one-click — Signed-in visitors now see a single Alert me — we'll email {their email} button instead of an email field on every alert signup box site-wide,

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 6.0 on 2 cores, sustained ~15 min — parallel drains are contending; consider more cores or lower --cpus per container
- 1 of 25 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-11T07:03:05Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $3.4049 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 1.1/2 cores, min free mem 4.8 GB, container peaked at 7% of its memory cap (6 samples)


## 2026-07-11T06:02:27Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $1.0219 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 1.1/2 cores, min free mem 4.8 GB, container peaked at 6% of its memory cap (5 samples)


## 2026-07-10T13:01:27Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $14.9585 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 0.5/2 cores, min free mem 4.5 GB, container peaked at 6% of its memory cap (3 samples)


## 2026-07-10T12:01:42Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $14.1866 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 1.1/2 cores, min free mem 4.9 GB, container peaked at 6% of its memory cap (4 samples)


## 2026-07-10T11:01:55Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $13.3540 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 1.0/2 cores, min free mem 4.9 GB, container peaked at 6% of its memory cap (4 samples)


## 2026-07-10T10:02:21Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $12.3805 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 1.3/2 cores, min free mem 4.6 GB, container peaked at 6% of its memory cap (5 samples)


## 2026-07-10T09:02:51Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $11.3686 of $120 cap

- ABORT — none — plan needed

### VPS headroom
- ✅ no headroom issues — peak load 2.5/2 cores, min free mem 4.3 GB, container peaked at 6% of its memory cap (6 samples)


## 2026-07-10T08:02:00Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $10.3308 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 0.6/2 cores, min free mem 5.0 GB, container peaked at 6% of its memory cap (4 samples)


## 2026-07-10T07:02:17Z — Night Shift run: 1 cycles (PASS 0 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $9.4469 of $120 cap

- ABORT — none — plan needed`

### VPS headroom
- ✅ no headroom issues — peak load 1.0/2 cores, min free mem 4.9 GB, container peaked at 6% of its memory cap (5 samples)


## 2026-07-10T06:21:21Z — Night Shift run: 3 cycles (PASS 2 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 1 quality-judged on opus
- Night spend so far: $8.2738 of $120 cap

- PASS — seeker-model-filter-make-scoped — /partnerships/seeking's Model Wanted filter now narrows its option list to models actually wanted by seekers who also want the selected
- PASS — seeker-model-variant-rollup — the `/partnerships/seeking` Model Wanted filter now groups near-duplicate variants (e.g. 172 + 172 G1000) under one 172 (all) checkbox with
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 4.6 on 2 cores, sustained ~4 min — parallel drains are contending; consider more cores or lower --cpus per container


## 2026-07-09T12:28:02Z — Night Shift run: 3 cycles (PASS 3 / FAIL 0) — night budget cap ($120)
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $120.9669 of $120 cap

- PASS — seller-upgrade-cta-post-listing — Added Feature this listing + Get it vetted fake-door CTAs to the owner-only post-listing success banner on aircraft and partnership det
- PASS — earnings-calculator-upfront-runway — the aircraft-partnership earnings calculator now shows owners how many months of their full aircraft costs the upfront partner buy-i
- PASS — admin-pilot-verify — Added a Verify Pilots admin tab (`/admin/pilots`) letting admins grant/revoke a pilot's public Verified badge, closing the last open slice of the pi

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 2.9 on 2 cores, sustained ~2 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~87s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles


## 2026-07-09T11:27:05Z — Night Shift run: 3 cycles (PASS 2 / FAIL 0) — backlog drained
- Models: cycles on sonnet; 0 escalated to opus; 0 quality-judged on opus
- Night spend so far: $110.6327 of $120 cap

- PASS — airport-facility-ratings — Added a 1-5 star rating widget for curated airport FBOs/flying clubs on `/airports/[icao]` (signed-in only, honesty-gated aggregate at ≥2 ra
- PASS — partnerships-crosssell-airport-aware — /partnerships' prefer to own outright? cross-sell box now respects the active airport filter (count + samples narrow to nearby air
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 2.4 on 2 cores, sustained ~2 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~67s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles


## 2026-07-09T11:05:07Z — Night Shift run: 12 cycles (PASS 9 / FAIL 2) — backlog drained
- Models: cycles on sonnet; 2 escalated to opus; 1 quality-judged on opus
- Night spend so far: $101.7701 of $120 cap

- PASS — member-profile-comp-verdict-parity — `/members/[id]` persona partnership cards now show the same real comp-verdict/deal-check/save-count chips every other listing card o
- PASS — cost-calculator-breakeven-hours — Added a break-even hours/month vs. renting figure to `/tools/cost-calculator`, the calculator-detail slice of the open `[P2][want]` too
- PASS — pilot-public-profile — shipped a public `/pilots/[id]` profile page for real signed-up pilots (avatar, home airport, verified badge, listings), linked from `/account` �
- PASS — profile-bio-edit — Signed-in pilots can now edit display name, mission, and bio on `/account`, which now render on their public `/pilots/[id]` profile page (slice 2 of P
- PASS — poster-attribution-links — Real user-posted aircraft/partnership listings now show a Posted by {name} link (avatar + home airport) to the poster's public /pilots/[id] pr
- cycle produced no verdict (exit 124)
- PASS — partnership-listing-reviews — /partnerships/[id] now has a Reviews section where signed-in non-owner pilots can leave a rating + written review, lighting up the previous
- PASS — aircraft-browse-broker-cta — Added the Work with a broker monetization fake-door CTA to the `/aircraft` browse results page (previously only on detail pages), closing a 
- PASS — seeker-crosssell-detail-pages — added a visitor-facing pilots looking cross-sell panel (real seeker demand) to both /aircraft/listing/[id] and /partnerships/[id], closin
- cycle produced no verdict (exit 124)
- PASS — quickstart-seeker-crosspost — /searches saved-search list now nudges partnerships searchers (with no seeker listing) to post themselves as looking for a share
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 3.7 on 2 cores, sustained ~3 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~479s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles
- 2 of 12 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


## 2026-07-09T08:51:05Z — Night Shift run: 12 cycles (PASS 9 / FAIL 2) — backlog drained
- Models: cycles on sonnet; 2 escalated to opus; 4 quality-judged on opus
- Night spend so far: $56.0011 of $120 cap

- PASS — airport-fbo-flying-clubs — Added a verified FBOs & flying clubs section to the 9 indexable airport hub pages (`/airports/kpao`, `/airports/khwd`, etc.), closing slice 1 
- cycle produced no verdict (exit 124)
- PASS — rail-card-rare-find-parity — compact homepage/similar rail cards now show the honesty-gated indigo Rare find chip (≤3 in family), closing the Real-social-proof backlog
- PASS — crosssell-detail-samples — Both marketplace detail-page cross-sell panels (`/aircraft/listing/[id]` and `/partnerships/[id]`) now show up to 3 real sample listing cards 
- PASS — alert-unsubscribe-recover — the alert email Unsubscribe link now lands on a page that offers a one-click Pause instead recovery (no sign-in needed), so a subscriber who 
- PASS — match-nudge-filtered-href — fixed the owner-only N matches nudge on partnership/seeker detail pages so the Browse them link carries airport/radius/hours/ratings/share-ty
- PASS
- cycle produced no verdict (exit 124)
- PASS — matches-view — new owner-gated /matches page aggregating each owner's real cross-listing matches, with count functions refactored behavior-identically and a View all you
- PASS — match-alert-digest — new `/api/cron/match-alert-digest` weekly cron emails partnership/seeker owners when a genuinely new compatible listing appears on the other side of
- PASS — alert-confirm-polish — Restyled the alert double-opt-in confirmation email and the `/alerts/status` landing page onto the site's warm cream Etsy×Airbnb tokens (was plai
- ABORT — none — plan needed`

### VPS headroom
- ⚠️ host CPU saturated: load peaked at 4.0 on 2 cores, sustained ~5 min — parallel drains are contending; consider more cores or lower --cpus per container
- ⚠️ container CPU-throttled ~494s total against its --cpus quota — cycles run slower than they should; consider raising --cpus or expect longer cycles
- 2 of 12 cycle(s) hit the hard timeout (exit 124) — likely related to the resource pressure above


# Overnight review — 2026-07-08

## 📊 Traffic (PostHog) — as of 2026-07-08

- **Visitors:** 40 all-time · 9 in the last 7 days
- **Pageviews:** 777 all-time · 84 in the last 7 days
- **Not from Oakland:** 38 visitors _(early on, most non-local hits are crawlers/bots, not real users)_

---

## 🧭 Visitors — day-over-day & week-over-week

_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._

- **Totals:** 0 yesterday _(vs 1 the day before)_ · 9 last 7 days _(vs 23 the prior 7)_

**Visitors by city**  ·  _Δ d/d = yesterday vs. the day before · Δ w/w = last 7 days vs. the prior 7_

| City | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| CA | 0 | — | 3 | ▲ +3 |
| Ashburn, VA | 0 | ▼ −1 | 1 | — |
| Boulder, CO | 0 | — | 1 | ▲ +1 |
| Canary Wharf, ENG | 0 | — | 1 | ▲ +1 |
| Gwangju, 41 | 0 | — | 1 | ▲ +1 |
| Naples, FL | 0 | — | 1 | ▲ +1 |
| The Bronx, NY | 0 | — | 1 | ▲ +1 |
| Arlington, VA | 0 | — | 0 | ▼ −1 |
| Bethel, ME | 0 | — | 0 | ▼ −1 |
| Cedar Park, TX | 0 | — | 0 | ▼ −1 |

**Top landing pages**

| Page | Yesterday | Δ d/d | Last 7d | Δ w/w |
|---|--:|:--|--:|:--|
| / | 0 | — | 3 | ▼ −4 |
| /aircraft/listing/b7f5200a-6b6f-4077-b4cc-3d3471bf5b27 | 0 | — | 2 | ▲ +2 |
| /aircraft/mooney/m20/florida | 0 | — | 1 | ▲ +1 |
| /partnerships/dcd64d61-0bce-4992-86c8-dc3bebfea2ed | 0 | — | 1 | ▲ +1 |
| /partnerships/make/cirrus | 0 | — | 1 | ▲ +1 |
| /partnerships/state/tx | 0 | ▼ −1 | 1 | — |
| /aircraft | 0 | — | 0 | ▼ −1 |
| /aircraft/for-sale/arkansas | 0 | — | 0 | ▼ −4 |
| /aircraft/listing/119eac1e-1ea0-4a77-8ef7-cf8417bc7f6a | 0 | — | 0 | ▼ −1 |
| /aircraft/listing/1350cd7e-6fa5-4c4d-bbb8-d5d6c1f77389 | 0 | — | 0 | ▼ −6 |

---

**22 cycles landed on staging across 16 pages.** Review the live staging site (you must be logged into Vercel), then tell Claude which pages to promote — or "promote everything."

Staging site: https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app

---

## /aircraft — Planes for Sale (marketplace)  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft)

- **`/aircraft` cards and map pins are now synced both ways, closing out the map search feature.** Click a pin's popup "↓ Show in list" and the matching card below smooth-scrolls into view and briefly highlights. Click a card's new "📍 Show on map" link and the map opens (if collapsed), pans/zooms straight to that listing's pin — spiderfying it out of a cluster if needed — and pops open its info window. _(cycle: aircraft-list-map-sync)_
- **The `/aircraft` map now has the same "Search this area" filter `/partnerships` already shipped.** Pan or zoom the map and a floating "Search this area" button appears; clicking it narrows the results list below to only the aircraft whose pin falls inside the current viewport. The results-count line reads "Showing M of N in this map area · Show all" while filtered, with a one-tap reset that also fires automatically when the map is collapsed. _(cycle: aircraft-map-search-area)_
- **`/aircraft` now has the same "View on map" feature `/partnerships` already fully shipped.** A collapsed-by-default "View on map (N)" toggle above the listings opens a Leaflet map with one clustered pin per aircraft whose location resolves. Clicking a pin's popup shows the aircraft's own make/model/asking-price/location text and a "View listing →" link. _(cycle: aircraft-map-view)_
- **Aircraft-for-sale cards on `/aircraft` now carry two more honest, never-fabricated trust signals.** The existing amber "New" badge now says **"New today"** when a listing appeared in the last 24 hours (same data as before, just a tighter, more honest window — "New" still covers the rest of the first week). And a brand-new indigo **"Rare find — only N like this"** chip appears on listings whose make+model is genuinely scarce right now (1–3 total active priced listings of that type on ClubHanger) — e.g. a Grumman AA-1, which today really does have only 2 for sale. Common types like the Cessna 172 never show it. _(cycle: aircraft-rare-find-chip)_
- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_

---

## /partnerships — Browse partnerships  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships)

- **`/partnerships` cards now have a "📍 Show on map" link that jumps you to that listing's pin.** Click it and the map opens (if it was collapsed), scrolls into view, and pans/zooms straight to the right pin — spiderfying it out of a cluster if needed — then pops open its info window. This completes the reverse direction of the map ↔ list sync (the map→list "↓ Show in list" direction shipped earlier tonight). _(cycle: partnerships-list-map-sync)_
- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_
- **The `/partnerships` map now lets you "Search this area."** Open the map, pan or zoom to the region you care about, and a floating **"Search this area"** button appears; tap it and the list below instantly narrows to only the partnerships whose pins are in view — exactly the Zillow/Redfin map-search move. The results line stays honest about it ("Showing 6 of 23 in this map area") and offers a one-tap **"Show all"** to go back to the full list; collapsing the map with "Hide map" also clears the filter automatically. This was the last missing slice of the partnerships Map-search feature — pins, clustering, and both directions of list↔map sync already shipped this week. _(cycle: partnerships-map-search-area)_
- **Clicking a pin's popup on the `/partnerships` map now jumps you straight to that listing's card in the list below** — the map and the list finally talk to each other. Previously the map (opt-in "View on map" toggle) was a dead end for browsing: you'd spot an interesting pin but had to scroll and hunt for the matching card yourself. Now the pin's popup has a "↓ Show in list" button (next to the existing "View listing →" link) that smooth-scrolls the page to the matching card and briefly rings it in blue for ~2s so it's unmistakable which one you were looking at. Clicking a different pin re-triggers the scroll/highlight for the new card. _(cycle: partnerships-map-list-sync)_

---

## (site-wide)

- **Signed-in pilots can now set their base airport and up to 3 favorite airports from `/account`.** A new "Your pilot profile" card (between the avatar picker and Email alerts) has a base-airport field (reusing the same `AirportFormInput` autocomplete + "use my location" as the post forms) plus 3 optional favorite-airport fields. Saving persists to `profiles.home_airport` (a column that already existed but was never settable) and — once the migration is applied — `favorite_airports`. This seeds the explicit prerequisite for the backlog's "Airport pages as community hubs → pilots-by-home-airport" slice. _(cycle: profile-base-favorite-airports)_
- **New admin-only "Revenue Signals" tab shows which "coming soon" revenue-path CTA pilots actually want.** Real opt-in counts per path (broker / financing / insurance / escrow / pre-buy / partnership formation / co-ownership management), sorted highest-first with a % share — clearly labeled as email opt-ins, not raw button-clicks, so nobody over-reads the numbers. _(cycle: monetization-tally-admin)_
- Fixed the broken QA smoke gate that was FAILing **every** cycle. The gate _(cycle: qa-playwright-1223-pin)_

---

## /saved — My saved listings  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/saved)

- **A logged-out visitor's device-saved listings on `/saved` now show the same real "Saved by N pilots," price-vs-market, and "Rare find" chips that a signed-in user sees for the identical listing** — previously the logged-out view rendered bare cards with none of that signal, a quiet gap versus the logged-in page. _(cycle: device-saves-social-proof-parity)_
- **A pilot's own `/saved` page now shows the same honest trust chips as every browse page.** `/saved` already rendered aircraft/partnership/seeker cards with real market-comparison data (Deal Check, ClubHanger Estimate), but never passed the "Saved by N pilots" chip (any listing type) or the "Rare find — only N like this" chip (aircraft) — so a pilot who saved a genuinely scarce plane, or a listing other pilots had also saved, never saw those same signals reflected back on their own saved-listings page. _(cycle: saved-page-social-proof-parity)_

---

## /partnerships/[id]

- **The owner-only "N matches" count on partnership and pilot-seeking pages now respects how far a pilot actually said they'd travel.** Before this, a seeker willing to commute 30 minutes from their home airport could count as a "match" for a partnership on the other side of the country, as long as the make/budget/hours/ratings/share-type all lined up. Now the count only includes matches within the seeker's own stated commute radius — no visible UI change, just a more honest number behind the existing feature. _(cycle: match-count-travel-radius)_
- **Partnership listing pages now have two more honest "coming soon" CTAs** — "Help me form a partnership" and "Manage my co-ownership" — in a "More ways we can help" card right after the "Interested?" contact box. Same fake-door pattern as the broker/financing/insurance/escrow/pre-buy CTAs already shipped on aircraft-for-sale listing pages this week: click one, a "Coming soon — want early access?" modal opens (the click itself is the real demand signal), and leaving an email is optional. _(cycle: monetization-partnership-cta)_

---

## /partnerships/seeking/[id]

- **The owner-only "N matches" count on partnership and pilot-seeking pages now respects how far a pilot actually said they'd travel.** Before this, a seeker willing to commute 30 minutes from their home airport could count as a "match" for a partnership on the other side of the country, as long as the make/budget/hours/ratings/share-type all lined up. Now the count only includes matches within the seeker's own stated commute radius — no visible UI change, just a more honest number behind the existing feature. _(cycle: match-count-travel-radius)_
- **Pilot-seeking profile pages now show a "Similar pilots also seeking" rail** — up to 12 other real, active pilots looking for a partnership share, ranked by shared aircraft preference, then state, then home airport, excluding the seeker whose page you're on. Each card (avatar, aircraft they want, home airport/city, stated budget) links straight to that pilot's own profile — the same "keep browsing" loop the aircraft-for-sale and partnership detail pages already offer, just built for the third listing type. If no other seeker is a sensible match, the section simply doesn't render — nothing fabricated, nothing empty-looking. _(cycle: seeker-similar-rail)_

---

## /aircraft/[make]/[model] — Make + Model "for sale" pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/aircraft/cessna/182)

- **The "Work with a broker" button on aircraft-for-sale listing pages now has 4 siblings** — Financing, Insurance quote, Escrow/title, and Pre-buy inspection — in a compact "More ways we can help" card right below it. Same honest pattern as the broker CTA: click any one, a "Coming soon — want early access?" modal opens (this is the real demand signal), and leaving an email is optional. Nothing claims to exist yet; nothing charges anyone. _(cycle: monetization-services-cta)_
- **A new honest "Work with a broker" button on aircraft-for-sale listing pages** — _(cycle: monetization-intent-cta)_

---

## / — Homepage  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/)

- The homepage now has a "Not ready to browse yet?" alert-signup band — a one-field _(cycle: homepage-alert-band)_

---

## /guides — Guides hub  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/guides)

- **The Guides hub and all 8 guide articles now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, `/tools`, airport pages) — previously they used the older, colder rounded-corner/border style left over from before that visual language existed. _(cycle: guides-token-sweep)_

---

## /guides/[guide] — Guide pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/guides/aircraft-co-ownership)

- **The Guides hub and all 8 guide articles now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, `/tools`, airport pages) — previously they used the older, colder rounded-corner/border style left over from before that visual language existed. _(cycle: guides-token-sweep)_

---

## /tools — Calculators  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /tools/cost-calculator  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools/cost-calculator)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /tools/earnings-calculator  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/tools/earnings-calculator)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /partnerships/new  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/new)

- **The Tools hub and both calculator pages now match the warm, rounded "Etsy × Airbnb" card look used everywhere else on the site** (`/aircraft`, `/partnerships`, airport pages) — previously they used an older, slightly colder rounded-corner/shadow style left over from before that visual language existed. _(cycle: tools-token-sweep)_

---

## /airports/[icao] — Airport pages  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/airports/khwd)

- **Airport pages now show a "Pilots based at {ICAO}" section** — real, signed-up pilots who set that airport as their base on `/account` (a feature shipped earlier tonight) now show up as a row of anonymous generated avatars, with a "Based here too? Set it in your pilot profile →" link back to `/account`. No name, bio, hours, or ratings are shown — just a real, honest presence signal. The section is invisible when nobody's set that airport yet (confirmed live: 0 real profiles have a base airport today, so it's dormant everywhere right now and will light up as pilots opt in). Also tightened `/account`'s copy, which previously only vaguely promised this "in the future" — it now says plainly that your base airport shows up as an anonymous avatar on that airport's public page. _(cycle: airport-pilots-based-here)_

---

## /partnerships/seeking — Pilots seeking shares  ·  [open ↗](https://aeromatch-git-staging-zealoustiger-7853s-projects.vercel.app/partnerships/seeking)

- **Aircraft, partnership, and seeker cards can now show a genuine "Saved by N pilots" chip** — a small heart-accent badge that appears in the existing badge row **only when a listing has been saved by 2+ different pilots**, using the real save data we already store. It is never fabricated or inflated: a listing saved by 0 or 1 person shows nothing at all (no "Saved by 1 pilot"), and anything that goes wrong just renders no chip. Because it reads real cross-user engagement (which is still very thin on today's cold-start data), the chip won't appear on most cards yet — it lights up automatically as real saves accumulate, so it's honest the moment it shows and never before. Only aggregate counts are read; who saved a listing is never exposed. _(cycle: listing-save-social-proof)_

---

## 🧪 Code-quality spot-checks — 8 judged, avg 4.0/5

- **homepage-alert-band — 4/5** — The wrapper adds its own `<h2>` + subcopy ("…we'll email you the moment it's listed") directly above `AlertSignup`, which renders its own `<h2>` ("Get new-listing alerts") + near-identical subcopy — two stacked h2s and duplicated messaging, slightly wordy and awkward heading semantics; not material.
- **aircraft-list-map-sync — 4/5** — The ~30-line focus-polling effect (markersRef/clusterRef/`__parent` poll) is now copy-pasted verbatim across AircraftLeafletMap and PartnershipsLeafletMap — a genuine drift risk if the leaflet-cluster timing hack ever needs a fix, though consistent with the codebase's per-page-component convention.
- **aircraft-map-search-area — 4/5** — Filtered line "Showing M of N in this map area" uses N = full DB total (page size 60) while the map only ever holds the current page's ≤60 pins, so with >60 results it reads e.g. "Showing 8 of 340" when 340 pins can never exist on that map — a semantic mismatch partnerships (radius-scoped) never surfaced.
- **match-count-travel-radius — 4/5** — haversineNm is now triple-duplicated (airports.ts, nearbyPartnerships.ts, matching.ts) — justified & documented (keeps matching.ts free of @/-alias value imports so its tests run under node strip-types) but still drift-prone; also deviates from spec (which said export from airports.ts, not duplicate) and the coord lookup uses `.toUpperCase()` without the `.trim()` that resolveAirportCoords applies, so a whitespaced airport code silently falls through the honesty gate (harmless, never over-counts).
- **profile-base-favorite-airports — 4/5** — The read-side fallback keys off `!profile` rather than an error, so it (a) always fires a second redundant query for brand-new users who simply have no profiles row, and (b) would silently mask a genuine non-column select error by re-querying — minor robustness smell, no user impact.
- **saved-page-social-proof-parity — 4/5** — Spec called for save-counts "in parallel with the existing comp-verdict fetches" but the Promise.all sits after three sequential comp-verdict awaits — a 4th serial DB barrier, minor added latency (only the 3 save-count calls parallelize among themselves).
- **aircraft-rare-find-chip — 4/5** — "Rare find — only 1 like this" reads slightly oddly when the count includes the listing itself (there are zero *others* like it); copy nuance only, tooltip clarifies, not material.
- **monetization-services-cta — 4/5** — The 20-token Tailwind className string is duplicated verbatim across all four buttons rather than hoisted to a local const — minor, matches the codebase's inline-className idiom; also the passed `title` prop only feeds the modal's aria-label (the `<h2>` is hardcoded in the component), so the per-button titles are effectively cosmetic — harmless, mirrors the broker CTA's own usage.

---

## To ship
Tell Claude "promote /aircraft" (or any pages above), or "promote everything." Claude merges the chosen work staging→main, which deploys to clubhanger.com.
