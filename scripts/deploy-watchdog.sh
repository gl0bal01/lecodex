#!/usr/bin/env bash
# Alert when lecodex.xyz stops tracking main.
#
# Watchtower can fail without saying so: it logged `failed=0 updated=0` every
# minute for 26 days while GHCR rejected every pull, and CI was green the whole
# time because publishing an image is not deploying it. Verifying from CI does
# not work either — Cloudflare's Bot Fight Mode answers 403 to GitHub runners
# and cannot be skipped per-path on the free plan.
#
# So the check runs here, on the host, against the container itself: no edge, no
# extra credential. It compares the commit the running site serves in
# /version.json with the head of main, and opens a GitHub issue if they stay
# apart longer than the time a build legitimately takes.
#
# Install: copy to /home/dev/docker/lecodex/ and run from cron every 15 minutes.
#   */15 * * * * /home/dev/docker/lecodex/deploy-watchdog.sh >> /home/dev/docker/lecodex/logs/watchdog.log 2>&1
set -uo pipefail

REPO="${LECODEX_REPO:-gl0bal01/lecodex}"
CONTAINER="${LECODEX_CONTAINER:-lecodex}"
# A cold build takes ~15 min, plus watchtower's 60s poll. Alert past 45.
STALE_MINUTES="${LECODEX_STALE_MINUTES:-45}"
STATE_FILE="${LECODEX_STATE_FILE:-/home/dev/docker/lecodex/.watchdog-state}"
DRY_RUN="${LECODEX_DRY_RUN:-0}"

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

raise() {
  local title="$1" body="$2"
  if [ "$DRY_RUN" = "1" ]; then
    log "DRY_RUN — would open issue: $title"
    printf '%s\n' "$body"
    return 0
  fi
  # One open issue at a time: a watchdog that files a duplicate every 15 minutes
  # trains you to ignore it.
  local existing
  existing=$(gh issue list --repo "$REPO" --state open --search "in:title deploy-watchdog" \
             --json number --jq '.[0].number' 2>/dev/null)
  if [ -n "$existing" ] && [ "$existing" != "null" ]; then
    log "issue #$existing already open, not filing another"
    return 0
  fi
  gh issue create --repo "$REPO" --title "$title" --body "$body" >/dev/null 2>&1 &&
    log "opened issue: $title" ||
    log "FAILED to open issue (check gh auth)"
}

clear_state() { rm -f "$STATE_FILE"; }

# --- what the site actually serves -------------------------------------------
if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  log "container '$CONTAINER' does not exist"
  raise "deploy-watchdog: lecodex container is gone" \
    "The container \`$CONTAINER\` is not present on the host. The site is down."
  exit 1
fi

running=$(docker inspect "$CONTAINER" --format '{{.State.Running}}' 2>/dev/null)
if [ "$running" != "true" ]; then
  log "container not running (state=$running)"
  raise "deploy-watchdog: lecodex container is not running" \
    "\`docker inspect $CONTAINER\` reports Running=$running. The site is down."
  exit 1
fi

ip=$(docker inspect "$CONTAINER" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
live=$(curl -sf --max-time 10 "http://${ip}:8080/version.json" 2>/dev/null | jq -r '.commit // empty')

# --- what it should be -------------------------------------------------------
expected=$(gh api "repos/$REPO/commits/main" --jq .sha 2>/dev/null)
if [ -z "$expected" ]; then
  # Not the site's problem — do not alarm on our own blindness.
  log "could not read head of main from GitHub; skipping this run"
  exit 0
fi

if [ -n "$live" ] && [ "$live" = "$expected" ]; then
  log "up to date (${live:0:12})"
  clear_state
  exit 0
fi

# --- mismatch: only alert once it has lasted ---------------------------------
now=$(date +%s)
if [ -f "$STATE_FILE" ]; then
  since=$(cat "$STATE_FILE" 2>/dev/null || echo "$now")
else
  since=$now
  printf '%s\n' "$now" > "$STATE_FILE"
fi

minutes=$(( (now - since) / 60 ))
log "behind: live=${live:-none} expected=${expected:0:12} for ${minutes}m"

if [ "$minutes" -lt "$STALE_MINUTES" ]; then
  exit 0
fi

wt_logs=$(docker logs --tail 15 lecodex-watchtower 2>&1 | tail -8)
raise "deploy-watchdog: lecodex.xyz is ${minutes} minutes behind main" \
"The running site does not serve the head of \`main\`, and has not for ${minutes} minutes.

| | commit |
|---|---|
| serving | \`${live:-none (no /version.json)}\` |
| expected | \`${expected}\` |

Publishing succeeded or this would not have been detected here — check the
deploy step, i.e. watchtower on the host. Its last lines:

\`\`\`
${wt_logs}
\`\`\`

Filed by \`deploy-watchdog.sh\`. Close once the site catches up; it will not
file another issue while this one is open."
