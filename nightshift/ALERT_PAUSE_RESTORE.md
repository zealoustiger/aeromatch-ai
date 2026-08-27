# Alert pause — restore snapshot (2026-08-27)

Alert email was paused for everyone except zealoustiger@gmail.com. Two layers:

1. **Code gate** (`EMAIL_ALLOWLIST` in `src/lib/email.ts` + `scraper/send-alerts.mjs`).
   Lift with `EMAIL_ALLOWLIST=""`.
2. **Data-layer pause** (below) — applied because the production deploy of the
   code gate was blocked. Every sender selects only `active`/`confirmed`, so
   `paused` rows are skipped. Prod has no `paused_until` column yet, so nothing
   auto-resumes these.

## To restore, run:

```sql
update alerts set status = 'confirmed' where id in (
  'aa4a0fcf-4612-4543-bd41-70d5529dcaa4', -- go-bigred@live.com      /partnerships/state/tx
  'bd4d2d9e-68e1-4113-9119-2b93487d9ece', -- pgill7034@gmail.com     /partnerships?make=Cessna&model=172S+Skyhawk
  'c145593b-a3cc-42c8-934c-db6225967de4', -- pgill7034@gmail.com     /partnerships/<id>?watch=price
  'a96e1aa0-bb21-4c85-86ec-8a79fb448998', -- phenompilot022@gmail.com /partnerships
  'f0411a42-3268-4994-80d7-720f85897c08'  -- sknight2@gmail.com      /partnerships/state/ok
);
```

All five were `status='confirmed'` before the pause. Rows left untouched:
zealoustiger@gmail.com (allowlisted) and all `pending` rows (never emailable
until confirmed, and the code gate covers them once deployed).
