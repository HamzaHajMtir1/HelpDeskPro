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
helpdesk/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   ├── Dockerfile
│   └── ...
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── docker-compose.yml
└── README.md
```

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

## 🐳 Docker

Le projet peut également être exécuté à l'aide de Docker.

### Construire les images

```bash
docker compose build
```

### Démarrer les services

```bash
docker compose up -d
```

### Vérifier les conteneurs

```bash
docker ps
```

### Consulter les logs

```bash
docker compose logs -f
```

### Arrêter les services

```bash
docker compose down
```

---

## 🔄 Pipeline CI/CD

Le projet utilise **GitHub Actions** afin d'automatiser le processus d'intégration et de déploiement.

La pipeline peut notamment effectuer les étapes suivantes :

```text
Push / Pull Request
        │
        ▼
┌─────────────────┐
│ Checkout du code│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tests Frontend  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tests Backend   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Frontend  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Backend   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Docker Build    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Déploiement   │
└─────────────────┘
```

Le workflow GitHub Actions se trouve dans :

```text
.github/workflows/
```

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
