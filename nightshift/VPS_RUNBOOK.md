# Night Shift — VPS / Docker Deployment Runbook

Goal: run the ClubHanger Night Shift drain loop on an always-on Linux host
(the same VPS that runs **Juno**), so it can't be killed by the laptop sleeping
or the Claude desktop app auto-updating — the two things that killed the
2026-06-20 run (last good cycle `aircraft-browse-hub` @ 23:25, then the desktop
app released its keep-awake lock at 23:27 for a ShipIt update and never relaunched).

## Architecture decision

- **Same host as Juno, SEPARATE container.** Reuse the box (auth already solved
  there, one bill), but isolate the workload.
- **Why separate, not shared with Juno's container:**
  1. **Security / blast radius.** Night Shift runs `--dangerously-skip-permissions`
     (it must, to be unattended). That agent must NOT share a filesystem with
     Juno's Gmail / Trello / Affinity / Mercury credentials. One concern per container.
  2. **Dependency weight.** Night Shift = Chromium + Playwright + full Next app +
     node_modules, ~4 GB RAM build spikes. Juno = light CLI + MCP. Don't bloat one
     image or let a build starve the other.
  3. **Independent failure domains.** Separate logs, restart, resource caps. Night
     Shift wedging never touches Juno's daytime triage.
- **Shared, by design:** the host, and your Claude Max subscription (they contend
  for the same usage budget, but schedules barely overlap — Night Shift 23:00–07:00,
  Juno 7am/12pm/5pm). The task already handles usage-limit pauses gracefully.

## Scheduling pattern

**Ephemeral container per hourly fire**, driven by a host **systemd timer**:

- `systemd` timer fires hourly during the night window → runs a oneshot service →
  `docker run --rm` a fresh Night Shift container that executes ONE drain.
- A fresh container per fire mirrors the loop's own "fresh worker context"
  philosophy and leaves no drift. systemd will not start a second run while one is
  still active, so drains never overlap (replacing the in-container `/tmp` lock's job).
- Mutable state (the repo, `~/.claude` creds, `.env`, screenshots) lives in **mounted
  volumes** so it persists across runs and builds stay incremental.

---

## Committed artifacts (in this repo — the box just clones & builds)

| File | Purpose |
|---|---|
| `Dockerfile.nightshift` | the runner image (Node 22 + Chromium + jq + Claude Code CLI) |
| `nightshift/DRAIN_TASK.md` | the drain instructions `run-drain.sh` feeds to `claude -p` (auto-derived from the scheduled-task `SKILL.md`, container paths) |
| `nightshift/bin/run-drain.sh` | entrypoint: runs one drain, writes the token ledger + status (container) |
| `nightshift/bin/nightshift-status.sh` | host CLI: is-it-running + today's tokens/cost + recent runs |
| `nightshift/bin/nightshift-alert.sh` | host cron: pings a webhook on failure / silent death |
| `nightshift/deploy/nightshift-drain.service` + `.timer` | systemd units (copy to `/etc/systemd/system/`) |

Measured build footprint (on the Mac, clean `next build`): **peak ~2.3 GB RSS**, ~10 s.
Plan for **~3 GB** during a cycle (build + headless Chrome QA + the claude process).

---

## Part 0 — Confirm on the Juno host first

```bash
# RAM: need real headroom for ~4GB build spikes ON TOP of Juno. Want >= 8GB total,
# or set a hard --memory cap and accept slower builds. 2GB droplet => size up first.
free -h
nproc                      # 2+ vCPU ideal
df -h /                    # need ~40GB free (repo + node_modules + Chromium + branches)
docker --version           # Juno already uses Docker
# How does Juno auth Claude? Mirror that exactly:
docker inspect <juno-container> --format '{{json .Mounts}}' | python3 -m json.tool
#   -> note where its ~/.claude credentials volume lives; we reuse the SAME login token.
```

If RAM is tight, decide now: bigger droplet, or `--memory=5g --memory-swap=6g` on the
Night Shift container (slower, but won't OOM-kill Juno).

---

## Part 1 — The image (`Dockerfile.nightshift`)

Debian base so Playwright system libs install cleanly. Tooling in the image;
secrets and code mounted at runtime.

```dockerfile
FROM node:22-bookworm

# System deps for headless Chromium + git + fonts (so QA screenshots render)
RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates fonts-liberation fonts-noto-color-emoji \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI (subscription auth, NOT an API key)
RUN npm install -g @anthropic-ai/claude-code

# Playwright Chromium for the gstack /browse QA step
RUN npx -y playwright@latest install --with-deps chromium

# TODO: install gstack the SAME way it's installed on the Mac / Juno's box.
#   gstack ships the /browse skill the QA step depends on. Confirm `/browse`
#   drives headless Chromium against http://localhost:3000 before trusting overnight.
#   (See the /gstack-upgrade skill for the install/upgrade mechanism.)

# Non-root runtime user; app code is mounted at /app at runtime
RUN useradd -m -u 10001 night
WORKDIR /app
USER night

ENTRYPOINT ["/app/nightshift/bin/run-drain.sh"]
```

Build it:

```bash
docker build -f Dockerfile.nightshift -t clubhanger-nightshift:latest .
```

---

## Part 2 — Volumes & secrets (mounted, never baked)

Lay these out on the host once:

```bash
sudo mkdir -p /srv/nightshift/{repo,claude,state}
# 1) The repo (clone once; persists branches, node_modules, screenshots)
git clone git@github.com:zealoustiger/aeromatch-ai.git /srv/nightshift/repo
cd /srv/nightshift/repo && git checkout staging && npm ci

# 2) Claude credentials — reuse the SAME Max login token Juno uses.
#    Either copy Juno's ~/.claude creds dir into /srv/nightshift/claude,
#    or do the one-time login in Part 3 to populate it.

# 3) .env (Supabase etc.) — required for `next build` + to fetch real listings in QA.
#    Get it onto the box securely (scp / secrets manager), 600 perms, NEVER in the image.
cp /secure/path/aeromatch.env /srv/nightshift/repo/.env
chmod 600 /srv/nightshift/repo/.env

# 4) GitHub push creds — a deploy key OR fine-grained PAT scoped to push `staging`
#    on aeromatch-ai ONLY. Configure the repo remote to use it.
```

Note: deploy is **Vercel-on-push** — the container only builds/QAs/pushes git; Vercel
auto-deploys `staging`. No web server, no inbound ports on this box.

---

## Part 3 — One-time Claude auth (the fragile step)

If reusing Juno's credentials volume, skip this. Otherwise log in once, interactively,
persisting into the mounted creds volume:

```bash
docker run --rm -it \
  -v /srv/nightshift/claude:/home/night/.claude \
  --entrypoint claude clubhanger-nightshift:latest
#   -> follow the OAuth/login flow (do the browser step from your laptop, paste back).
#   Credentials persist in /srv/nightshift/claude and auto-refresh while valid.
```

**Operational risk to monitor:** if Claude ever logs out, the loop dies silently
until re-auth. Alert on "0 cycles for N nights" (Part 6).

---

## Part 4 — The drain entrypoint (`nightshift/bin/run-drain.sh`)

Runs ONE drain headlessly, then exits. The task's own lock + night-window +
usage-limit logic lives in the task prompt; this just invokes it.

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /app
git fetch --quiet && git checkout staging && git pull --quiet

# Run one drain. --dangerously-skip-permissions is REQUIRED for unattended ops and
# is acceptable ONLY because this container is isolated (no other apps' secrets here).
claude --dangerously-skip-permissions -p "$(cat /app/nightshift/DRAIN_TASK.md)"
```

Put the existing scheduled-task instructions (the `SKILL.md` body from
`~/.claude/scheduled-tasks/clubhanger-nightshift/`) into `nightshift/DRAIN_TASK.md`
in the repo so it ships with the container and is version-controlled. `chmod +x` the script.

---

## Part 5 — Host scheduling (systemd timer → docker run)

`/etc/systemd/system/nightshift-drain.service`:

```ini
[Unit]
Description=ClubHanger Night Shift drain (one cycle batch)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
# systemd will not start a second run while this one is active => no overlap.
TimeoutStartSec=3600
ExecStart=/usr/bin/docker run --rm \
  --name clubhanger-nightshift \
  --memory=5g --memory-swap=6g \
  -v /srv/nightshift/repo:/app \
  -v /srv/nightshift/claude:/home/night/.claude \
  -v /srv/nightshift/state:/home/night/state \
  clubhanger-nightshift:latest
```

`/etc/systemd/system/nightshift-drain.timer`:

```ini
[Unit]
Description=Fire Night Shift drain hourly during the night window

[Timer]
# Hourly, 23:00–06:00 local. Set the host TZ (timedatectl set-timezone America/Los_Angeles).
OnCalendar=*-*-* 23,00,01,02,03,04,05,06:00:00
Persistent=false

[Install]
WantedBy=timers.target
```

Enable:

```bash
sudo timedatectl set-timezone America/Los_Angeles   # match the night window to local time
sudo systemctl daemon-reload
sudo systemctl enable --now nightshift-drain.timer
systemctl list-timers nightshift-drain.timer        # confirm next fire
```

The first hourly fire each night starts the drain; if it pauses on a usage limit,
the next hour's fire is the retry — exactly as the task is written, but now the
"retry" actually happens because the host never sleeps.

---

## Part 6 — Smoke test before trusting it overnight

```bash
# Run one drain by hand and watch the whole pipeline (build -> headless QA -> push):
sudo systemctl start nightshift-drain.service
journalctl -u nightshift-drain.service -f
```

Verify in order: (1) `npx next build` + typecheck pass in-container; (2) gstack
`/browse` actually drives **headless** Chromium against `localhost:3000` and writes
screenshots under `nightshift/screenshots/`; (3) a clean cycle merges to `staging`
and `git push` succeeds; (4) Vercel shows the new staging deploy. Step 2 is where
Linux-vs-macOS friction usually hides (fonts, Chromium libs) — debug it here, not at 2am.

---

## Part 7 — Observability

- **Logs:** `journalctl -u nightshift-drain.service --since "yesterday"`.
- **Did it run?** The drain appends a summary to `nightshift/CHANGELOG.md` and pushes.
  No new entries overnight = something broke (likely auth logout or a build wedge).
- **Recommended alert:** a tiny morning check (cron) that greps the CHANGELOG for a
  dated entry from last night and emails/Slacks you if there is none. Closes the
  "silently dead" failure mode that hid last night's stall until you checked manually.

---

## Part 8 — Monitoring (token usage + liveness)

**Design: two layers + one alert.** The source of truth is a plain file on the VPS;
everything else reads it. Don't build a new standalone UI, and don't make Night Shift
*depend* on Juno.

**Layer 1 — canonical ledger (already wired in `run-drain.sh`).** Every drain runs
`claude -p ... --output-format json`, then appends one line to
`/srv/nightshift/state/usage.jsonl` with `input_tokens`, `output_tokens`,
`cache_read_tokens`, `total_cost_usd`, `duration_ms`, `exit`, and `outcome`
(`ok | error | timeout | auth_expired | rate_limited`). It also writes
`status.json` (running/idle + last outcome). These fields come straight from the
CLI's JSON result — confirmed present under subscription auth (`total_cost_usd` is
populated even though it doesn't bill; treat it as a usage proxy).

**Layer 2 — where you look: reuse Juno's dashboard.** Point Juno's dashboard at
`usage.jsonl` / `status.json` (read-only, one-directional) and render a Night Shift
panel — today's tokens/cost, last outcome, next fire. Reuses the cockpit you already
check daily; no second URL to maintain. Quick CLI in the meantime:
```bash
NS_STATE_DIR=/srv/nightshift/state nightshift/bin/nightshift-status.sh
```

**The alert (highest value — catches the exact 2026-06-20 silent death).** Cron the
alerter on the host so you don't have to *look* to learn it's stuck:
```cron
# every 30 min during the active window; pings on failure or >3h with no drain
*/30 23,0-7 * * *  NS_STATE_DIR=/srv/nightshift/state \
  NS_ALERT_WEBHOOK="https://ntfy.sh/clubhanger-nightshift" \
  /srv/nightshift/repo/nightshift/bin/nightshift-alert.sh
```
`ntfy.sh` is the zero-setup option (subscribe on your phone); a Slack/Discord webhook
works the same way. Use your phone for this — **not** Claude Desktop, which isn't always
open (the whole reason we left it).

**Optional Layer 3 — real-time graphs (only if you already run Prometheus/Grafana).**
Claude Code exports OpenTelemetry metrics. Set in the container env:
```bash
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_METRICS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://<collector>:4317
OTEL_METRIC_EXPORT_INTERVAL=30000
```
It emits per-run token counters (`input_tokens`, `output_tokens`, `cache_read_tokens`,
`cache_creation_tokens`) you can graph + alert on. Overkill unless a collector already
exists — the JSONL ledger + ntfy alert covers the need.

---

## Part 9 — Running 24/7 vs night-only

Now that it's off the laptop, all-day is *possible*. It's a two-part change:
1. Timer: swap the night-window `OnCalendar` for `OnCalendar=hourly` (commented in
   `nightshift-drain.timer`).
2. Task: remove the **"06:50 night's end"** stop condition in `nightshift/DRAIN_TASK.md`,
   or daytime fires will bail immediately.

**The real cost isn't the box — it's your one Max subscription.** Night Shift, Juno,
*and your own interactive Claude use* all draw from the same Max rate-limit budget.
The night window exists precisely to use off-hours when you aren't. Run 24/7 and a busy
drain can throttle **you** (or Juno) during the workday. It fails safe — the task pauses
on usage limits — but it can spend budget before you do.

**Recommendation:** ship **night-only first** (the default units), let Part 8's ledger
run for a few days, and read actual daily token consumption. *Then* widen the window
with data in hand — e.g. extend into the early morning, or go 24/7 with a daytime lull,
rather than flipping to all-day blind. Also keep a drain from firing right at 06:50–07:10
so the 07:00 digest gets a clean tree.

---

## Downsides to accept (honest list)

- **Shared subscription usage** with Juno — occasional contention if a Juno loop runs
  late; the task pauses cleanly on limits but may get fewer cycles those nights.
- **Auth fragility** — headless re-auth is fiddly; monitor for logout (Part 6/7).
- **Toolchain drift / screenshot rendering** — Linux fonts differ from macOS, so
  morning-review screenshots look slightly different (functionally fine).
- **Secrets on a server** — `.env` lives on the box; harden it (key-only SSH,
  firewall, 600 perms). Separate container limits exposure vs. sharing Juno's.
- **Host RAM** — Night Shift build spikes on top of Juno; size the box or cap memory.
