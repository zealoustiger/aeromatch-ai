# Spec: auth-context-headline

**Goal:** Replace the generic "Sign in to ClubHanger" headline on `/auth` with a context-specific headline and sub-copy derived from the `?next=` redirect parameter, so users arriving mid-flow know exactly why they're being asked to sign in.

**Scope:**
- `src/app/auth/page.tsx` — derive auth context from `next` param; update heading + subtext

**Acceptance criteria:**
1. `/auth?next=/aircraft/new` → heading "Sign in to post your aircraft listing", sub "We'll email you a magic link — then you're right back on the form."
2. `/auth?next=/partnerships/new` → heading "Sign in to post your partnership", same sub
3. `/auth?next=/partnerships/seeking/new` → heading "Sign in to post your seeking listing", same sub
4. `/auth?next=<path containing /aircraft/listing/>` → heading "Sign in to contact the seller", sub "We'll email you a magic link — takes 30 seconds."
5. `/auth?next=<path containing /partnerships/ (not /new)>` → heading "Sign in to contact the owner", same sub
6. `/auth?next=/saved` → heading "Sign in to sync your saved listings", sub "We'll email you a magic link — your saves come with you."
7. All other / default cases → existing "Sign in to ClubHanger" + "We'll email you a magic link — no password needed."
8. The sent-confirmation state retains the same copy as now ("Check your email").
9. `npx next build` passes; smoke exit 0 on `/auth`.

**Out of scope:**
- No change to the email input, Google button, or form logic
- No new URL params beyond `?next=`
- No change to the callback route
- Not adding custom per-context icons (keep the existing Plane logo)
