# HelpDesk — Frontend

Interface web de la plateforme HelpDesk intelligente, développée dans le cadre d'un Projet de Fin d'Études (PFE) à l'ISIMA, Université de Monastir, en collaboration avec **Sindibad Group**.

La plateforme est actuellement déployée en production et utilisée par l'entreprise

Backend : [helpdesk-pfe-backend](https://github.com/AmnaKrifa/helpdesk-pfe-backend)

## Stack technique
- React (Vite)
- Tailwind CSS
- Axios

## Fonctionnalités principales
- Trois espaces dédiés : Client, Technicien, Admin
- Chatbot intelligent avec assistance à la création de tickets
- Gestion des tickets, pièces jointes et base de connaissances
- Notifications en temps réel et rapports statistiques

## Déploiement
Servi en production via Nginx, avec proxy vers l'API backend et le microservice IA.

## Lancement en local
```bash
npm install
npm run dev
```
L'application démarre sur `http://localhost:5173`.
