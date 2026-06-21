# Google Search Console → scoreboard (service-account setup)

One-time setup so the loop can read REAL Google search performance (clicks,
impressions, indexed-count, top queries) via `nightshift/bin/gsc.mjs`. ~15 min.
Everything below is in YOUR Google account — the code is already built and waiting.

## 1. Google Cloud project + API
1. Go to https://console.cloud.google.com → create (or pick) a project.
2. **APIs & Services → Library** → search **"Google Search Console API"** → **Enable**.

## 2. Service account + key
3. **APIs & Services → Credentials → Create credentials → Service account.**
   - Name it e.g. `clubhanger-gsc-reader`. No roles needed (GSC access is granted in step 3, not via IAM). Create.
4. Open the service account → **Keys → Add key → Create new key → JSON**. A JSON file downloads. Keep it safe — it's a secret.
   - Copy the `client_email` from that JSON (looks like `clubhanger-gsc-reader@<project>.iam.gserviceaccount.com`).

## 3. Grant it access to the property (the step people forget)
5. In **Search Console → Settings → Users and permissions → Add user**, paste the service account's `client_email`. Permission **Full** (or Restricted — read is enough). This is what lets the key read clubhanger.com.

## 4. Drop the creds in `.env.local` (gitignored — never commit)
Add these to `.env.local`:
```
# Service-account JSON as ONE line (paste the whole file contents), OR use GSC_SA_FILE instead
GSC_SA_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...",...}
# Property type: URL-prefix → keep the URL; Domain property → use sc-domain:clubhanger.com
GSC_SITE_URL=https://clubhanger.com/
```
Tip: if pasting the JSON inline is fiddly, instead save the file outside the repo and set
`GSC_SA_FILE=/absolute/path/to/key.json`.

**Which `GSC_SITE_URL`?** If you verified clubhanger.com as a **Domain** property, use
`GSC_SITE_URL=sc-domain:clubhanger.com`. If it's a **URL-prefix** property, keep
`https://clubhanger.com/`. (Wrong one → the API returns 403; just switch it.)

## 5. Verify
```
node nightshift/bin/gsc.mjs
```
You should see clicks/impressions/indexed-count + top queries/pages (numbers may be
near-zero at first — the site is freshly indexed). If you see a 403, re-check step 3
(service account added to the property) and the `GSC_SITE_URL` type.
