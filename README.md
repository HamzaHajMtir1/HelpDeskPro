# 🎫 HelpDesk — Application Full Stack & CI/CD

## 📌 Présentation

**HelpDesk** est une application web de gestion de support permettant de centraliser et de faciliter la gestion des demandes et des tickets.

Ce repository regroupe les deux parties principales du projet :

- **Frontend** : interface utilisateur de l'application.
- **Backend** : API REST et logique métier.
- **DevOps** : conteneurisation, automatisation des tests, build et déploiement à travers une pipeline CI/CD.

L'objectif est de disposer d'une architecture centralisée permettant de développer, tester, construire et déployer l'application de manière automatisée.

---

## 🏗️ Architecture du projet

```text
HelpDeskPro/
│
├── frontend/                     # React 19 + Vite 8
│   ├── src/
│   ├── public/
│   ├── nginx.conf                # config Nginx de l'image (SPA + proxy /api)
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile                # multi-stage : Node -> Nginx (non-root)
│   ├── .dockerignore
│   └── ...
│
├── backend/                      # Spring Boot 3.3.5 (Java 17, Maven)
│   ├── src/
│   ├── pom.xml                   # + jacoco-maven-plugin 0.8.15
│   ├── mvnw / mvnw.cmd
│   ├── Dockerfile                # multi-stage : Maven -> JRE (non-root)
│   ├── .dockerignore
│   └── ...
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # build, tests, SonarQube, sécurité
│       └── cd.yml                # publication GHCR + déploiement OVH
│
├── deploy/                       # production OVH — pull les images, ne build pas
│   ├── docker-compose.prod.yml
│   ├── .env.prod.example
│   ├── nginx/conf.d/             # reverse proxy + HTTPS
│   └── scripts/                  # deploy.sh, init-letsencrypt.sh
│
├── docs/
│   └── SECRETS.md                # tous les secrets GitHub requis
│
├── docker-compose.yml            # dev local : db + backend + frontend
├── sonar-project.properties      # configuration SonarQube (monorepo)
├── .env.example                  # modèle de variables (suivi par Git)
├── .env                          # valeurs réelles (JAMAIS commité)
├── .gitignore
└── README.md
```

---

## 🛡️ Architecture DevSecOps

Vue d'ensemble de la chaîne « code → image → scan → déploiement ».
Le tableau distingue ce qui est **en place** de ce qui reste **à implémenter**.

### Composants

| Couche | Détail | État |
|---|---|---|
| **Frontend** | React 19 + Vite 8, npm (`package-lock.json`), Node `^20.19 \|\| >=22.12`. Build statique servi par Nginx, jamais le serveur de dev. | ✅ |
| **Backend** | Spring Boot 3.3.5, Java 17, Maven (wrapper 3.9.12), API sur le port `8080`, contrôleurs montés sous `/api/**`. | ✅ |
| **Base de données** | PostgreSQL 16 (service interne `db`, non exposé à l'hôte), schéma géré par `spring.jpa.hibernate.ddl-auto=update`. | ✅ |
| **Docker** | Deux `Dockerfile` multi-stage, images finales sans sources ni outils de build, exécution en utilisateur non-root. | ✅ |
| **Orchestration** | `docker-compose.yml` racine, réseau bridge interne `helpdesk-net`, volumes nommés (`db-data`, `backend-uploads`), `restart: unless-stopped`. | ✅ |
| **Secrets** | Aucune valeur sensible dans le dépôt : tout passe par variables d'environnement (`.env` local, GitHub Actions Secrets en CI). | ✅ |
| **GitHub Actions** | `ci.yml`, `security.yml`, `deploy.yml` — squelettes valides en `workflow_dispatch`, contenu décrit en commentaires. | 🚧 placeholders |
| **Sécurité applicative** | SonarQube/SAST, scan de dépendances, Gitleaks, Trivy (image + IaC). | ⏳ à venir |
| **Déploiement** | Publication sur GHCR puis release SSH sur le VPS OVH. | ⏳ à venir |

### Topologie d'exécution

```text
                Internet
                   │
                   ▼  :80  (FRONTEND_HTTP_PORT)
        ┌──────────────────────────┐
        │  frontend  (Nginx :8080) │  bundle React + reverse proxy
        └───────────┬──────────────┘
                    │  /api/  →  http://backend:8080
                    ▼
        ┌──────────────────────────┐
        │  backend  (Spring :8080) │  interne — aucun port publié
        └───────────┬──────────────┘
                    │  jdbc:postgresql://db:5432
                    ▼
        ┌──────────────────────────┐
        │  db  (PostgreSQL :5432)  │  interne — aucun port publié
        └──────────────────────────┘

            réseau bridge « helpdesk-net »
```

Seul le service `frontend` est publié sur l'hôte. Le backend et la base ne sont
joignables que depuis le réseau interne Docker.

### Chaîne CI/CD visée

```text
 push / PR ──► ci.yml         lint + tests front, tests back, build des images
     │
     ├───────► security.yml   SonarQube (SAST) · scan de dépendances
     │                        Gitleaks (secrets) · Trivy (image + IaC)
     │
     └───────► deploy.yml     build ──► push GHCR ──► SSH VPS OVH
                              puis « docker compose pull && up -d »
```

### Sécurité — règles du dépôt

- `.env` et toute variante `.env.*` sont ignorés par Git ; seul `.env.example`
  (uniquement des placeholders vides) est suivi.
- Clés privées, certificats, keystores et fichiers de credentials sont bloqués
  par le `.gitignore` racine.
- Les images n'embarquent aucun secret : la configuration est injectée au
  démarrage via l'environnement.
- Les secrets de la pipeline seront stockés en **GitHub Actions Secrets**
  (`DB_PASSWORD`, `JWT_SECRET`, `SMTP_USER`, `SMTP_PASSWORD`, `GROQ_API_KEY`,
  `VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`).

### Démarrage avec Docker Compose

```bash
cp .env.example .env     # puis renseigner les valeurs
docker compose config    # validation
docker compose up -d --build
```

> TLS : l'image frontend sert du HTTP en clair sur `8080`. La terminaison
> HTTPS/Let's Encrypt est assurée en amont (reverse proxy de l'hôte) —
> `frontend/nginx.conf` conserve le vhost TLS historique à titre de référence.

---

## 🛠️ Technologies utilisées

### Frontend

- React / JavaScript
- HTML5
- CSS3
- Nginx
- Docker

### Backend

- Java
- Spring Boot
- Spring Security
- JWT
- Maven
- REST API
- Docker

### DevOps & CI/CD

- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose

---

## 🚀 Installation du projet

### 1. Cloner le repository

```bash
git clone https://github.com/4DGileApps/helpdesk.git
cd helpdesk
```

---

## 💻 Lancer le Frontend

Accéder au dossier :

```bash
cd frontend
```

Installer les dépendances :

```bash
npm install
```

Lancer l'application en développement :

```bash
npm run dev
```

ou selon la configuration du projet :

```bash
npm start
```

---

## ⚙️ Lancer le Backend

Accéder au dossier :

```bash
cd backend
```

Sous Linux/macOS :

```bash
./mvnw spring-boot:run
```

Sous Windows :

```powershell
.\mvnw.cmd spring-boot:run
```

Le backend Spring Boot démarre ensuite avec la configuration définie dans le projet.

---

## 🐳 Docker / Local Deployment

L'ensemble de la stack (frontend, backend, base de données) démarre avec une
seule commande depuis la racine du dépôt.

### 1. Prérequis

- **Docker Engine** 20.10+ (ou Docker Desktop)
- **Docker Compose v2** (`docker compose`, pas `docker-compose`)

```bash
docker --version
docker compose version
```

### 2. Configuration de l'environnement

```bash
cp .env.example .env
```

Sous **Windows PowerShell** :

```powershell
Copy-Item .env.example .env
```

Puis renseigner les variables. Celles **sans valeur par défaut** sont
obligatoires — Compose refuse de démarrer tant qu'elles sont vides :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DB_PASSWORD` | ✅ | Mot de passe PostgreSQL **et** `spring.datasource.password` |
| `JWT_SECRET` | ✅ | Clé de signature JWT (HS256 → ≥ 32 octets aléatoires) |
| `SMTP_USER` | ✅ | Login de la boîte mail OVH ; sert aussi d'expéditeur et d'`admin.email` |
| `SMTP_PASSWORD` | ✅ | Mot de passe SMTP |
| `GROQ_API_KEY` | ✅ | Clé API Groq (chatbot / assistant) |
| `POSTGRES_DB` | — | Défaut : `helpdesk_db` |
| `POSTGRES_USER` | — | Défaut : `postgres` |
| `SPRING_PROFILES_ACTIVE` | — | Défaut : `prod` |
| `FRONTEND_BASE_URL` | — | Défaut : `http://localhost:3000` (CORS + liens e-mail) |
| `FRONTEND_PORT` | — | Défaut : `3000` |
| `BACKEND_PORT` | — | Défaut : `8080` |
| `AGENT2_URL` | — | Service Flask externe optionnel (absent de ce dépôt) |

> `.env` est ignoré par Git. Ne jamais y committer de vraies valeurs.

### 3. Build et démarrage

```bash
docker compose up -d --build
```

### 4. Vérifier l'état des services

```bash
docker compose ps
```

Les trois services doivent être `running`, `db` et `backend` en `(healthy)`.

### 5. Consulter les logs

```bash
docker compose logs -f
```

Service par service :

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

### 6. Arrêter

```bash
docker compose down
```

Pour supprimer aussi les données PostgreSQL et les pièces jointes :

```bash
docker compose down -v
```

### 7. Reconstruire après modification du code

```bash
docker compose up -d --build
```

### 8. URLs locales

| URL | Description |
|---|---|
| <http://localhost:3000> | Application (React servi par Nginx) — **point d'entrée** |
| <http://localhost:3000/api/...> | API, relayée par Nginx vers le backend |
| <http://localhost:8080/api/...> | API en accès direct, pour tests curl/Postman |
| — | PostgreSQL n'est **pas** publié sur l'hôte |

Vérification rapide :

```bash
curl -i http://localhost:3000/healthz
curl -i http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}'
```

### 9. Communication frontend → backend

Le code React appelle l'API en **chemins relatifs** (`/api/...`). Le navigateur
s'adresse donc uniquement à Nginx, qui relaie vers `http://backend:8080` sur le
réseau interne Docker.

```text
navigateur ──► localhost:3000 ──► Nginx ──► backend:8080 ──► db:5432
```

Le nom d'hôte `backend` n'est résolvable qu'à l'intérieur du réseau Docker : il
n'apparaît jamais dans une requête émise par le navigateur. Le préfixe `/api`
est **conservé** lors du proxy, car les 15 contrôleurs Spring sont montés sous
`/api/**` et aucun `server.servlet.context-path` n'est défini.

> **Port backend `8080`** : publié uniquement par confort de test. En
> production il peut être retiré du bloc `ports:` — Nginx accède au backend par
> le réseau interne, aucune exposition publique n'est nécessaire.

### 10. Développement hors Docker

`npm run dev` reste fonctionnel : `vite.config.js` proxifie `/api` vers
`http://localhost:8080` et `/ai` vers `http://localhost:5002`. Cibles
surchargeables via `VITE_DEV_API_TARGET` / `VITE_DEV_AI_TARGET`.

---

## 🔄 CI/CD — GitHub Actions

Deux workflows, strictement séparés :

| Workflow | Fichier | Déclenchement | Rôle |
|---|---|---|---|
| **CI** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | push sur `main`, PR vers `main` | build, tests, qualité, sécurité. **Ne publie et ne déploie rien.** |
| **CD** | [`.github/workflows/cd.yml`](.github/workflows/cd.yml) | uniquement après une CI **réussie** sur `main` | publie les images sur GHCR, puis déploie sur le VPS OVH |

La CD utilise `workflow_run` : elle ne peut donc pas démarrer depuis une pull
request, et jamais depuis un commit qui n'a pas passé la CI.

```text
push / PR ──► CI
              ├── frontend        npm ci → lint* → vite build
              ├── backend         mvnw clean verify (service PostgreSQL 16)
              │                     └── JaCoCo → SonarQube → Quality Gate
              ├── codeql          SAST Java + JavaScript
              ├── secret-scan     Gitleaks (historique complet)
              ├── dependency-scan Trivy fs (Maven + npm) + Trivy config (IaC)
              └── docker          build des images → Trivy image → SBOM Syft
                        │
                    ci-success  (statut unique pour la protection de branche)
                        │
                        ▼  (push sur main uniquement)
                       CD
              ├── publish   → ghcr.io/<owner>/helpdeskpro-{backend,frontend}
              └── deploy    → SSH OVH → deploy.sh → healthcheck → rollback si KO
```

\* Le lint est **non bloquant** : 70 erreurs préexistantes (règles
`react-hooks/set-state-in-effect` et `react-hooks/immutability`, nouvelles dans
`eslint-plugin-react-hooks` v7). Les corriger relève du code React. Retirer
`continue-on-error` une fois traité.

> **Pas de tests frontend** : `frontend/package.json` ne déclare aucun script
> `test` et aucun runner n'est installé. Aucune étape n'est simulée.

### SonarQube

L'analyse tourne dans le job `backend`, après `mvnw clean verify` (qui produit
`backend/target/classes` et `jacoco.xml`, tous deux requis). La configuration
vient de [`sonar-project.properties`](sonar-project.properties) — elle n'est
pas dupliquée dans le workflow.

`-Dsonar.qualitygate.wait=true` fait échouer la CI quand le Quality Gate échoue.

L'étape **s'auto-désactive** si `SONAR_TOKEN` / `SONAR_HOST_URL` sont absents,
pour que la CI reste utilisable avant la mise en place de SonarQube.

> ⚠️ Un SonarQube sur `http://localhost:9000` **n'est pas joignable** depuis un
> runner GitHub. Il faut soit l'exposer publiquement en HTTPS, soit un runner
> self-hosted, soit SonarCloud.

### Quality Gate recommandé

`Quality Gates → Create`, conditions **sur le New Code uniquement** :

| Condition | Valeur |
|---|---|
| New reliability rating | A |
| New security rating | A |
| New maintainability rating | A |
| New coverage | ≥ 80 % |
| New duplicated lines | ≤ 3 % |

Ne pas verrouiller sur la couverture globale : le legacy est à ~7 %, tout serait bloqué.

---

## 🛡️ Sécurité — contrôles automatisés

Chaîne volontairement sans redondance (pas d'OWASP Dependency-Check ni de
`npm audit` : Trivy `fs` couvre déjà Maven **et** npm).

| Contrôle | Outil | Portée | Bloquant ? |
|---|---|---|---|
| SAST | **CodeQL** | Java + JavaScript | ✅ |
| Qualité / SAST | **SonarQube** | monorepo + couverture | ✅ via Quality Gate |
| Dépendances | **Trivy `fs`** | `pom.xml`, `package-lock.json` | ✅ HIGH/CRITICAL **corrigeables** |
| Secrets | **Gitleaks** | historique Git complet | ✅ |
| Image conteneur | **Trivy `image`** | images frontend + backend | rapport (SARIF) |
| IaC / Dockerfile | **Trivy `config`** | Dockerfiles, compose | rapport |
| SBOM | **Syft** | SPDX JSON par image | artefact (30 j) |

`ignore-unfixed: true` + seuil HIGH/CRITICAL : le bruit non corrigeable ne bloque
jamais une merge. Les résultats SARIF remontent dans l'onglet **Security**.

---

## 🚀 Déploiement en production (OVH VPS)

> Rien n'est déployé automatiquement tant que les secrets OVH ne sont pas
> configurés — le job `deploy` s'auto-ignore.

```text
Internet :443
   │  HTTPS (Let's Encrypt)
   ▼
 nginx (reverse proxy, seul service publié)
   ├── /      → frontend (React/Nginx, interne)
   └── /api/  → backend  (Spring Boot, interne)
                    │
                  db  (PostgreSQL — jamais exposé)
```

Fichiers : [`deploy/`](deploy/)

| Fichier | Rôle |
|---|---|
| `docker-compose.prod.yml` | stack de prod — **pull** des images validées, aucun build sur le VPS |
| `.env.prod.example` | modèle de variables (placeholders uniquement) |
| `nginx/conf.d/helpdeskpro.conf` | vhost — HTTP d'abord, bloc HTTPS commenté |
| `nginx/conf.d/helpdeskpro.locations` | routes partagées HTTP/HTTPS + en-têtes de sécurité |
| `scripts/deploy.sh` | pull → up → vérification santé → **rollback** si échec |
| `scripts/init-letsencrypt.sh` | première émission du certificat (dry-run d'abord) |

### Mise en place initiale sur le VPS

```bash
sudo mkdir -p /opt/helpdeskpro && sudo chown "$USER" /opt/helpdeskpro
cd /opt/helpdeskpro
# copier deploy/ depuis le dépôt
cp .env.prod.example .env && nano .env && chmod 600 .env
chmod +x scripts/*.sh
docker compose -f docker-compose.prod.yml up -d
```

Puis, une fois le DNS en place :

```bash
DOMAIN=helpdesk.example.com EMAIL=admin@example.com ./scripts/init-letsencrypt.sh
```

Le script vérifie la résolution DNS et l'accessibilité du challenge ACME, puis
fait un `--dry-run` avant la vraie demande (Let's Encrypt limite à 5 échecs/heure).

### Sécurité de la base

PostgreSQL n'a **aucun** mapping de port : il n'est joignable que par le réseau
Docker interne. Ne jamais ajouter `ports: 5432` en production.

> ⚠️ `POSTGRES_PASSWORD` n'est appliqué qu'à la **première** création du volume.
> Changer `.env` ensuite ne suffit pas — il faut `ALTER USER` (voir
> [`docs/SECRETS.md`](docs/SECRETS.md)).

---

## 🔑 Secrets GitHub requis

Tableau complet : **[`docs/SECRETS.md`](docs/SECRETS.md)**.

Résumé : `SONAR_TOKEN` et `SONAR_HOST_URL` (CI, optionnels) ; `OVH_HOST`,
`OVH_USER`, `OVH_SSH_PRIVATE_KEY` (CD, requis pour déployer) ; `OVH_SSH_PORT` et
`PUBLIC_HEALTH_URL` (CD, optionnels). `GITHUB_TOKEN` est fourni automatiquement.

---

## 🔐 Variables d'environnement

Les informations sensibles ne doivent jamais être ajoutées directement dans le repository.

Exemples :

```env
DB_HOST=
DB_PORT=
DB_NAME=
DB_USERNAME=
DB_PASSWORD=

JWT_SECRET=
```

Pour la pipeline CI/CD, les informations sensibles doivent être configurées avec **GitHub Actions Secrets**.

Exemples :

```text
DOCKER_USERNAME
DOCKER_PASSWORD
SERVER_HOST
SERVER_USER
SSH_PRIVATE_KEY
```

> ⚠️ Les mots de passe, tokens, clés privées et autres secrets ne doivent jamais être commités dans Git.

---

## 🌿 Stratégie Git

Branche principale :

```text
main
```

Exemple de workflow :

```text
feature/*
    │
    ▼
develop
    │
    ▼
main
    │
    ▼
CI/CD
    │
    ▼
Production
```

---

## 📦 Organisation

| Composant | Description |
|---|---|
| `frontend/` | Interface utilisateur |
| `backend/` | API et logique métier |
| `.github/workflows/` | Pipelines GitHub Actions |
| `docker-compose.yml` | Orchestration des conteneurs |
| `README.md` | Documentation principale |

---

## 🎯 Objectifs DevOps

L'intégration DevOps du projet vise à :

- automatiser les builds ;
- automatiser les tests ;
- détecter les erreurs avant le déploiement ;
- conteneuriser le frontend et le backend ;
- centraliser l'application avec Docker Compose ;
- automatiser les déploiements ;
- sécuriser les secrets et variables sensibles ;
- garantir un processus de livraison reproductible.

---

## 👨‍💻 Projet

**HelpDesk**

Repository :

```text
4DGileApps/helpdesk
```

Projet Full Stack avec mise en place d'une architecture **DevOps et CI/CD**.
