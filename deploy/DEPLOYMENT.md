# HelpDeskPro — Deployment Runbook (OVH VPS)

Live: **https://helpdesk.4d-gile.com** · Host: `ubuntu@135.125.191.162` · Dir: `/opt/helpdeskpro`

## Architecture (as deployed)

```
Internet :80/:443
   │  (Let's Encrypt TLS, HTTP→HTTPS 301)
   ▼
helpdeskpro-frontend   ← the edge: serves the React build AND terminates TLS
   │  (nginx.prod.conf mounted over the image's default.conf)
   ├── /            React SPA
   ├── /api/   ───► helpdeskpro-backend:8080   (Spring Boot)
   └── /ai/    ───► agent2-api:5002            (existing Flask service)
                         │
                       postgres:5432  (existing container, alias `db`)
```

All four containers share the Docker network **`helpdesk-net`**. `postgres` and
`agent2-api` are pre-existing containers attached to it by alias; the two
`helpdeskpro-*` containers are pulled from GHCR — **nothing is built on the VPS**.

## Files on the server (`/opt/helpdeskpro/`)

| File | Purpose | In git? |
|---|---|---|
| `.env` | all secrets (mode 600) | never |
| `docker-compose.live.yml` | the production stack (pulls GHCR images) | — |
| `nginx.prod.conf` | TLS + `/api` + `/ai` + SPA + `/healthz` | `deploy/vps/nginx.prod.conf` |
| `uploads/` | attachments, owned by uid 100:101 (image `spring` user) | never |
| `pre-cutover-*.dump` | pg_dump -Fc backups | never |

---

## A. Normal deploy (shipping a new version)

CI publishes `ghcr.io/hamzahajmtir1/helpdeskpro-{backend,frontend}:latest` on every
green merge to `main`. To roll that onto the server:

```bash
ssh ubuntu@135.125.191.162
cd /opt/helpdeskpro
docker compose --env-file .env -f docker-compose.live.yml pull
docker compose --env-file .env -f docker-compose.live.yml up -d
docker compose --env-file .env -f docker-compose.live.yml ps
curl -sk -o /dev/null -w '%{http_code}\n' https://helpdesk.4d-gile.com/     # expect 200
```

`restart: unless-stopped` means both containers also come back on reboot.

> The GitHub Actions **CD** workflow automates exactly this over SSH once the
> `OVH_HOST` / `OVH_USER` / `OVH_SSH_PRIVATE_KEY` repository secrets are set.
> Until then it self-skips and you deploy manually with the block above.

## B. Change a secret / config

```bash
ssh ubuntu@135.125.191.162
nano /opt/helpdeskpro/.env          # e.g. SMTP_PASSWORD after rotating it in OVH
cd /opt/helpdeskpro
docker compose --env-file .env -f docker-compose.live.yml up -d backend
```

Verify a `.env` without printing secrets: `sed -E 's/=.+/=<set>/' .env`

## C. Logs & health

```bash
docker compose --env-file .env -f docker-compose.live.yml logs -f backend
docker logs helpdeskpro-frontend --tail 50
docker ps --filter name=helpdeskpro
```

## D. Rollback

```bash
cd /opt/helpdeskpro
docker compose --env-file .env -f docker-compose.live.yml down
docker start helpdeskadmin-frontend-1        # the previous frontend, kept 7 days
curl -sk -o /dev/null -w '%{http_code}\n' https://helpdesk.4d-gile.com/
```

Restore the database from a dump (only if data was damaged):

```bash
docker exec -i postgres pg_restore -U postgres -d helpdesk_db --clean --if-exists \
  < /opt/helpdeskpro/pre-cutover-<date>.dump
```

---

## E. First-time setup (what the initial cutover did — reference)

Prerequisites: Docker + Compose on the VPS; the deploy SSH key installed; a
Let's Encrypt cert already present at
`/etc/letsencrypt/live/helpdesk.4d-gile.com/`; images published to GHCR by CI.

```bash
# 1. Layout + config
sudo mkdir -p /opt/helpdeskpro && sudo chown $USER /opt/helpdeskpro
cd /opt/helpdeskpro
git clone https://github.com/HamzaHajMtir1/HelpDeskPro repo
cp repo/deploy/vps/nginx.prod.conf nginx.prod.conf
mkdir -p certbot-www uploads

# 2. Migrate existing attachments to the image's runtime uid
sudo cp -a /home/helpdeskadmin/uploads/. uploads/ 2>/dev/null || true
sudo chown -R 100:101 uploads         # 100:101 = spring:spring in the image

# 3. Build .env (mode 600). Generate strong values:
#      DB_PASSWORD=$(openssl rand -hex 24)   JWT_SECRET=$(openssl rand -hex 32)
#    Set SMTP_USER/SMTP_PASSWORD, GROQ_API_KEY, FRONTEND_BASE_URL=https://helpdesk.4d-gile.com,
#    AGENT2_URL=http://agent2:5002, ADMIN_EMAIL=admin@helpdesk.com (EXISTING account),
#    ADMIN_PASSWORD=<any, unused when the account exists>,
#    BACKEND_IMAGE / FRONTEND_IMAGE = the ghcr.io …:latest refs.
chmod 600 .env

# 4. Network: create it, attach the EXISTING postgres and agent2 by alias
docker network create helpdesk-net
docker network connect --alias db     helpdesk-net postgres
docker network connect --alias agent2 helpdesk-net agent2-api

# 5. Copy docker-compose.live.yml into place, validate, back up the DB
docker compose --env-file .env -f docker-compose.live.yml config --quiet
docker exec postgres pg_dump -U postgres -Fc helpdesk_db > pre-cutover-$(date +%F).dump

# 6. Validate nginx against the real certs BEFORE the switch
docker run --rm \
  -v $PWD/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /etc/letsencrypt/live/helpdesk.4d-gile.com:/etc/letsencrypt/live/helpdesk.4d-gile.com:ro \
  -v /etc/letsencrypt/archive/helpdesk.4d-gile.com:/etc/letsencrypt/archive/helpdesk.4d-gile.com:ro \
  --user root ghcr.io/hamzahajmtir1/helpdeskpro-frontend:latest nginx -t

# 7. Rotate the DB password to match .env (postgres is HelpDeskPro-only)
DBPW=$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)
printf "ALTER USER postgres WITH PASSWORD %s;\n" "'$DBPW'" | docker exec -i postgres psql -U postgres -q

# 8. CUTOVER (brief outage): free 80/443, then start the stack
docker stop helpdeskadmin-frontend-1
docker compose --env-file .env -f docker-compose.live.yml up -d

# 9. Verify within 60s (else run section D rollback)
curl -sk -o /dev/null -w '%{http_code}\n' https://helpdesk.4d-gile.com/          # 200
curl -sk -o /dev/null -w '%{http_code}\n' https://helpdesk.4d-gile.com/api/knowledge  # 401/403 (auth)
```

---

## Outstanding / hardening

- **Cert auto-renewal is not wired.** The cert is valid to 2026-10-29 but will not
  self-renew. Fix: change the host renewal to `authenticator = webroot`
  (`webroot_path = /opt/helpdeskpro/certbot-www`) and add a deploy hook that runs
  `docker exec helpdeskpro-frontend nginx -s reload`. See `deploy/scripts/init-letsencrypt.sh`.
- **`postgres` has `RestartPolicy=no`** — it does not come back on reboot. Set it to
  `unless-stopped` so the DB restarts automatically.
- **Rotate the SMTP mailbox password** — it appeared in public git history.
- Old `helpdeskadmin-frontend-1` (stopped) is the rollback target; keep ≥7 days.
