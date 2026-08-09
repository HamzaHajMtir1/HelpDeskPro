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
│   ├── nginx/default.conf        # config Nginx de l'image Docker
│   ├── nginx.conf                # vhost TLS historique (niveau hôte)
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile                # multi-stage : Node -> Nginx
│   ├── .dockerignore
│   └── ...
│
├── backend/                      # Spring Boot 3.3.5 (Java 17, Maven)
│   ├── src/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   ├── Dockerfile                # multi-stage : Maven -> JRE
│   ├── .dockerignore
│   └── ...
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # build & tests            (placeholder)
│       ├── security.yml          # SAST / SCA / secrets / images (placeholder)
│       └── deploy.yml            # GHCR + déploiement OVH    (placeholder)
│
├── docker-compose.yml            # orchestration : db + backend + frontend
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

## 🔄 Continuous Integration

L'intégration continue est assurée par **GitHub Actions**.

**Workflow :** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### Déclenchement

La CI s'exécute automatiquement sur :

- un **push** sur `main` ;
- une **pull request** ciblant `main`.

Les runs concurrents sur une même référence sont annulés
(`concurrency: ci-${{ github.ref }}`), et le workflow s'exécute en
`permissions: contents: read` — il ne publie et ne déploie **rien**.

```text
push / pull request  ──►  main
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        frontend-ci                backend-ci
              │                         │
        Checkout                   Checkout
        Setup Node 22              Setup Java 17 (temurin)
        Cache npm                  Cache Maven
        npm ci                     chmod +x mvnw
        npm run lint *             ./mvnw clean verify
        npm run build                 └─ service PostgreSQL 16
              │                         │
              └────────────┬────────────┘
                           ▼
                       CI SUCCESS
```

### Contrôles réellement implémentés

**Frontend** (`frontend-ci`)

| Étape | Commande | Bloquant |
|---|---|---|
| Installation | `npm ci` (depuis `package-lock.json`) | ✅ |
| Lint | `npm run lint` | ⚠️ non — voir ci-dessous |
| Build production | `npm run build` (Vite) | ✅ |
| Artefact | `frontend-dist` (7 jours) | — |

> ⚠️ **Lint non bloquant.** `npm run lint` remonte actuellement 70 erreurs
> préexistantes — principalement les règles `react-hooks/set-state-in-effect`
> et `react-hooks/immutability`, nouvelles dans `eslint-plugin-react-hooks` v7
> (déjà en dépendance), plus des `no-unused-vars` en position d'argument. Les
> corriger relève du code React, pas de la configuration CI. L'étape s'exécute
> et reste visible dans le run ; retirer `continue-on-error` une fois traitée.

> **Pas de tests frontend** : aucun script `test` ni runner (Vitest/Jest) n'est
> configuré dans `frontend/package.json`. Aucune étape de test n'est déclarée
> plutôt que d'en simuler une.
>
> **Pas de typecheck** : projet JavaScript, sans `tsconfig.json`.

**Backend** (`backend-ci`)

| Étape | Commande | Bloquant |
|---|---|---|
| Setup Java | `actions/setup-java` — temurin 17 | ✅ |
| Cache Maven | `cache: maven` | — |
| Tests + packaging | `./mvnw -B -ntp clean verify` | ✅ |
| Artefact | `backend-jar` (7 jours) | — |

`verify` enchaîne `compile → test → package → verify`. **Aucun `-DskipTests`** :
la CI échoue si un test échoue.

### PostgreSQL en CI

`HelpdeskApplicationTests` est un `@SpringBootTest` qui démarre le contexte
complet. Le projet n'a ni H2, ni Testcontainers, ni profil de test : une vraie
base est donc nécessaire. Le job déclare un **service container `postgres:16`**
avec healthcheck `pg_isready`, joignable sur `localhost:5432`.

### Variables d'environnement de CI

Les propriétés `app.jwt.secret`, `app.smtp.*` et `groq.api.key` n'ont **aucune
valeur par défaut** : sans elles le contexte Spring ne démarre pas. Le workflow
fournit donc des valeurs **factices, réservées à la CI** (`ci-only-...`).

> **Aucun secret GitHub n'est requis pour cette CI.** Aucune vraie
> crédential n'est utilisée : la CI n'envoie pas d'e-mail et n'appelle pas
> l'API Groq.

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
