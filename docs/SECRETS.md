# Required GitHub Secrets

No secret value belongs in this repository. Everything below is configured in
**GitHub → Settings → Secrets and variables → Actions**.

CI runs entirely on throwaway values, so **no secret is required to make CI
green**. Secrets only unlock optional stages (SonarQube) and deployment.

## CI

| Secret | Purpose | Where to obtain it | Required? |
|---|---|---|---|
| `SONAR_TOKEN` | Authenticates the SonarQube scanner and lets CI enforce the Quality Gate | SonarQube → your project → *Project Settings → Analysis Method → Locally → Generate* | Optional — the Sonar step self-skips when absent |
| `SONAR_HOST_URL` | SonarQube base URL, e.g. `https://sonar.example.com` | Your SonarQube instance | Optional — required together with `SONAR_TOKEN` |
| `GITHUB_TOKEN` | CodeQL/Gitleaks SARIF upload, and GHCR login | Injected automatically by Actions | Automatic — never create it |

> **A SonarQube on `http://localhost:9000` is not reachable from a GitHub-hosted
> runner.** To run the gate in CI you need one of: a publicly reachable
> SonarQube (behind HTTPS), a self-hosted runner on the same network, or
> SonarCloud. Until then CI logs a warning and skips the step.

## CD

| Secret | Purpose | Where to obtain it | Required? |
|---|---|---|---|
| `OVH_HOST` | VPS hostname or IP | OVH control panel | Required to deploy |
| `OVH_USER` | SSH user for deployment (non-root, in the `docker` group) | Created by you on the VPS | Required to deploy |
| `OVH_SSH_PRIVATE_KEY` | Private half of a **dedicated** deploy key (full PEM, including header/footer) | `ssh-keygen -t ed25519 -C "github-actions-helpdeskpro"`; put the **public** half in the VPS's `~/.ssh/authorized_keys` | Required to deploy |
| `OVH_SSH_PORT` | SSH port if not 22 | Your VPS config | Optional (defaults to 22) |
| `PUBLIC_HEALTH_URL` | URL CD curls after deploying, e.g. `https://helpdesk.example.com/healthz` | Your domain | Optional — post-deploy verification is skipped without it |

The deploy job **self-skips** while `OVH_HOST` / `OVH_USER` /
`OVH_SSH_PRIVATE_KEY` are unset, so merging to `main` publishes images without
attempting a deployment.

## Not GitHub Secrets

These live only in `/opt/helpdeskpro/.env` on the VPS (`chmod 600`) and are
never uploaded by CI/CD: `DB_PASSWORD`, `JWT_SECRET`, `SMTP_USER`,
`SMTP_PASSWORD`, `GROQ_API_KEY`. See `deploy/.env.prod.example`.

## Rotation

Rotate immediately if a value is ever printed in a log, committed, or shared:

| Credential | How to rotate |
|---|---|
| `DB_PASSWORD` | `docker exec -u postgres helpdeskpro-db psql -c "ALTER USER <user> WITH PASSWORD '<new>';"` then update `.env` and restart. Editing `.env` alone does **not** change an already-initialised volume. |
| `JWT_SECRET` | `openssl rand -base64 48` → update `.env` → restart backend. Invalidates all sessions. Must be ≥ 32 characters. |
| `SMTP_PASSWORD` | Change the mailbox password in the OVH panel, then update `.env`. |
| `GROQ_API_KEY` | Revoke and reissue in the Groq console. |
| `OVH_SSH_PRIVATE_KEY` | Generate a new keypair, replace `authorized_keys` on the VPS, update the secret, delete the old key. |
| `SONAR_TOKEN` | Revoke in SonarQube → *Account/Project → Security*, generate a new one. |
