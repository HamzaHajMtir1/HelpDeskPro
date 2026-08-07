# HelpDesk — Backend

API backend de la plateforme HelpDesk intelligente, développée dans le cadre d'un Projet de Fin d'Études (PFE) à l'ISIMA, Université de Monastir, en collaboration avec **Sindibad Group**.

La plateforme est actuellement déployée en production et utilisée par l'entreprise 

Frontend : [helpdesk-pfe-frontend](https://github.com/AmnaKrifa/helpdesk-pfe-frontend)

## Stack technique
- Java 17 / Spring Boot
- Spring Security (authentification JWT)
- PostgreSQL
- Docker

## Fonctionnalités principales
- Authentification et gestion des rôles (Client, Technicien, Admin)
- Gestion des tickets avec suivi SLA et escalade automatique
- Deux agents IA : assistance à la qualification des demandes côté client, et aide à la résolution côté technicien
- Notifications in-app et base de connaissances

## Déploiement
Déployé via Docker sur un serveur VPS (OVH Cloud, Ubuntu), derrière un reverse proxy Nginx, en HTTPS.

## Lancement en local
Le projet nécessite une base PostgreSQL et un fichier de configuration avec les identifiants du projet (base de données, service mail, service IA). Ces identifiants ne sont pas inclus dans ce dépôt pour des raisons de sécurité.

```bash
./mvnw spring-boot:run
```

Ou avec Docker :
```bash
docker-compose up --build
```
