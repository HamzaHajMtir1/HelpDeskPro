#!/usr/bin/env bash
# =============================================================================
# HelpDeskPro — production deploy (runs ON the OVH VPS)
# =============================================================================
# Pulls the images named in .env, restarts the stack, and verifies health.
# If the new release is unhealthy it ROLLS BACK to the previous image tags
# instead of leaving a broken deployment running.
#
#   ./deploy.sh                      # deploy whatever .env currently pins
#   ./deploy.sh <backend> <frontend> # deploy specific image refs
#
# Never destroys volumes: no `down -v`, ever.
# =============================================================================
set -Eeuo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/helpdeskpro}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

cd "$DEPLOY_DIR"

log() { printf '[deploy] %s\n' "$*"; }
die() { printf '[deploy][ERROR] %s\n' "$*" >&2; exit 1; }

[[ -f "$ENV_FILE" ]]     || die "$DEPLOY_DIR/$ENV_FILE not found. Copy .env.prod.example and fill it in."
[[ -f "$COMPOSE_FILE" ]] || die "$DEPLOY_DIR/$COMPOSE_FILE not found."

compose() { docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"; }

# --- remember the currently deployed tags so we can roll back ---------------
PREV_BACKEND=$(grep -E '^BACKEND_IMAGE=' "$ENV_FILE" | cut -d= -f2- || true)
PREV_FRONTEND=$(grep -E '^FRONTEND_IMAGE=' "$ENV_FILE" | cut -d= -f2- || true)

# --- optionally pin new images ---------------------------------------------
if [[ $# -ge 2 ]]; then
  NEW_BACKEND="$1"; NEW_FRONTEND="$2"
  log "pinning backend  -> $NEW_BACKEND"
  log "pinning frontend -> $NEW_FRONTEND"
  # portable in-place edit (BSD/GNU sed differ on -i)
  tmp=$(mktemp)
  sed -e "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${NEW_BACKEND}|" \
      -e "s|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=${NEW_FRONTEND}|" "$ENV_FILE" > "$tmp"
  cat "$tmp" > "$ENV_FILE"      # preserve original ownership/permissions
  rm -f "$tmp"
fi

rollback() {
  log "!! deployment failed - rolling back"
  [[ -n "$PREV_BACKEND"  ]] || { log "no previous backend tag recorded; manual intervention needed"; return; }
  tmp=$(mktemp)
  sed -e "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${PREV_BACKEND}|" \
      -e "s|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=${PREV_FRONTEND}|" "$ENV_FILE" > "$tmp"
  cat "$tmp" > "$ENV_FILE"; rm -f "$tmp"
  compose up -d --no-build || true
  log "rolled back to: $PREV_BACKEND / $PREV_FRONTEND"
}

wait_healthy() {
  local svc="$1" cid deadline=$(( SECONDS + HEALTH_TIMEOUT )) state
  cid=$(compose ps -q "$svc") || true
  [[ -n "$cid" ]] || { log "$svc: no container"; return 1; }
  while (( SECONDS < deadline )); do
    state=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo unknown)
    case "$state" in
      healthy|running) log "$svc: $state"; return 0 ;;
      unhealthy)       log "$svc: unhealthy"; return 1 ;;
      *)               sleep 5 ;;
    esac
  done
  log "$svc: timed out after ${HEALTH_TIMEOUT}s"
  return 1
}

log "pulling images..."
compose pull

log "starting stack (volumes preserved)..."
compose up -d --remove-orphans --no-build

ok=true
for svc in db backend frontend nginx; do
  wait_healthy "$svc" || ok=false
done

# End-to-end check through the edge proxy, not just container state.
if $ok; then
  code=$(docker run --rm --network container:helpdeskpro-nginx curlimages/curl:latest \
           -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1/healthz || echo 000)
  log "edge /healthz -> HTTP $code"
  [[ "$code" == "200" ]] || ok=false
fi

if ! $ok; then
  compose logs --tail=80 backend || true
  rollback
  die "deployment failed health verification"
fi

log "pruning dangling images..."
docker image prune -f >/dev/null || true

log "deployment successful"
compose ps
