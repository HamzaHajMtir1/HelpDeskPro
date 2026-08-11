#!/usr/bin/env bash
# =============================================================================
# HelpDeskPro — issue the FIRST Let's Encrypt certificate (run once, on the VPS)
# =============================================================================
# PREREQUISITES — verify all three before running, or you will burn rate limits:
#   1. DNS A/AAAA record for $DOMAIN points at this VPS's public IP
#        dig +short <domain>
#   2. Ports 80 and 443 are open (OVH firewall + ufw)
#   3. The stack is up and Nginx answers on :80
#        docker compose -f docker-compose.prod.yml up -d
#
#   DOMAIN=helpdesk.example.com EMAIL=admin@example.com ./init-letsencrypt.sh
#
# Let's Encrypt allows only 5 failed attempts per hour per domain, so this
# script runs a --dry-run first and refuses to continue if it fails.
# =============================================================================
set -Eeuo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/helpdeskpro}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

cd "$DEPLOY_DIR"
log() { printf '[certbot] %s\n' "$*"; }
die() { printf '[certbot][ERROR] %s\n' "$*" >&2; exit 1; }

[[ -n "$DOMAIN" ]] || die "DOMAIN is required, e.g. DOMAIN=helpdesk.example.com ./init-letsencrypt.sh"
[[ -n "$EMAIL"  ]] || die "EMAIL is required (used for expiry notices)"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

log "checking that $DOMAIN resolves..."
resolved=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)
[[ -n "$resolved" ]] || die "$DOMAIN does not resolve. Configure DNS first."
log "  resolves to $resolved"

log "checking that the ACME challenge path is reachable over HTTP..."
compose up -d nginx
mkdir -p ./certbot-www 2>/dev/null || true
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  "http://${DOMAIN}/.well-known/acme-challenge/probe" || echo 000)
# 404 is fine: it proves Nginx is answering on :80 for this host.
[[ "$code" == "404" || "$code" == "200" ]] \
  || die "http://${DOMAIN}/.well-known/acme-challenge/ returned $code — port 80 is not reaching Nginx."
log "  reachable (HTTP $code)"

log "dry run (does not count against rate limits)..."
compose run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" \
  --agree-tos --no-eff-email --non-interactive --dry-run \
  || die "dry run failed — fix the errors above before retrying"

log "dry run OK — requesting the real certificate..."
compose run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" \
  --agree-tos --no-eff-email --non-interactive

cat <<EOF

[certbot] Certificate issued for ${DOMAIN}.

Next, enable HTTPS:
  1. Edit deploy/nginx/conf.d/helpdeskpro.conf
       - replace every helpdesk.example.com with ${DOMAIN}
       - uncomment the 'return 301 https://...' redirect in the :80 block
       - remove the stage-1 'include ... helpdeskpro.locations;' from the :80 block
       - uncomment the whole :443 server block
  2. docker compose -f ${COMPOSE_FILE} exec nginx nginx -t
  3. docker compose -f ${COMPOSE_FILE} exec nginx nginx -s reload

Renewal is automatic: the certbot service retries twice a day.
EOF
