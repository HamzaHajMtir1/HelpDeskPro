import { useState } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronDown,
  Ticket, MessageSquare, Paperclip, Clock,
  CheckCircle2, AlertCircle, Search, Lock,
  Eye, Zap, BookOpen, Bot, Users, Shield,
  ArrowUpCircle, Bell, Star, Download, Info,
  RefreshCw, Globe, Image, FileText, RotateCcw,
  Cpu
} from 'lucide-react';

const RED = '#E31E24';

const SECTIONS = [
  {
    id:    'start',
    icon:  <Shield className="w-4 h-4" />,
    title: 'Prise en main',
    articles: [
      {
        id:    'start-1',
        title: 'Votre espace technicien',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Votre tableau de bord affiche uniquement les tickets de votre
              spécialité. Vous ne voyez pas les tickets d'autres catégories.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Ticket className="w-4 h-4" />,   label: 'Mes tickets',           desc: 'Tous les tickets de votre spécialité — libres, assignés à vous, ou assignés à un collègue' },
                { icon: <BookOpen className="w-4 h-4" />, label: 'Base de connaissances', desc: 'Articles générés automatiquement depuis les tickets clôturés' },
                { icon: <Bot className="w-4 h-4" />,      label: 'Assistant IA',          desc: 'Copilote intelligent qui vous propose des solutions depuis la KB interne et des sources externes' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'start-2',
        title: 'Première connexion',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Votre compte a été créé par un administrateur. Lors de votre
              première connexion, vous devrez définir un mot de passe personnel.
            </p>
            <div className="space-y-2">
              {[
                'Ouvrez l\'email reçu et copiez le mot de passe temporaire',
                'Connectez-vous — vous serez redirigé vers la page de changement',
                'Choisissez un mot de passe selon les règles affichées',
                'Accédez à votre tableau de bord technicien',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  {
    id:    'tickets',
    icon:  <Ticket className="w-4 h-4" />,
    title: 'Gestion des tickets',
    articles: [
      {
        id:    'tickets-1',
        title: 'Prendre en charge un ticket',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Dans la liste des tickets, vous verrez trois types de tickets :
            </p>
            <div className="space-y-2">
              {[
                { badge: 'Traiter',           color: RED,       bg: '#fff1f1', desc: 'Ticket libre — personne ne l\'a pris en charge. Cliquez pour l\'assigner à vous-même et commencer.' },
                { badge: 'Continuer',         color: '#16a34a', bg: '#f0fdf4', desc: 'Ticket déjà assigné à vous — continuez le traitement.' },
                { badge: 'Traité par Prénom', color: '#d97706', bg: '#fff7ed', desc: 'Ticket pris en charge par un collègue — consultation en lecture seule.' },
              ].map(item => (
                <div key={item.badge} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: item.bg, color: item.color }}>
                    {item.badge}
                  </span>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'tickets-2',
        title: 'Statuts et transitions',
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              {[
                { status: 'Nouveau',      color: '#6b7280', desc: 'Ticket créé, pas encore pris en charge' },
                { status: 'En cours',     color: '#3b82f6', desc: 'Vous traitez activement le ticket' },
                { status: 'Info requise', color: '#f59e0b', desc: 'Vous attendez une réponse du client — le SLA est réinitialisé' },
                { status: 'Résolu',       color: '#16a34a', desc: 'Solution appliquée, ticket résolu côté technique' },
                { status: 'Fermé',        color: '#374151', desc: 'Clôture définitive — génère automatiquement un article KB' },
              ].map(s => (
                <div key={s.status} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: s.color }}>
                    {s.status}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Quand vous passez en <strong>Info requise</strong>, le client
                reçoit une notification et le SLA de traitement est remis à zéro.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'tickets-3',
        title: 'Clôturer un ticket',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La clôture est irréversible. Le ticket passe en lecture seule
              et un article est automatiquement créé dans la base de connaissances.
            </p>
            <div className="space-y-2">
              {[
                'Cliquez sur "Clôturer le ticket" en haut à droite',
                'Une fenêtre de confirmation s\'affiche',
                'Confirmez — le ticket passe au statut Fermé',
                'Un article est créé dans la KB avec la solution épinglée',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 flex items-start gap-2">
                <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Pensez à épingler votre solution avant de clôturer pour
                enrichir la base de connaissances.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  {
    id:    'messaging',
    icon:  <MessageSquare className="w-4 h-4" />,
    title: 'Messagerie & Notes internes',
    articles: [
      {
        id:    'msg-1',
        title: 'Répondre au client',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis le détail du ticket, onglet <strong>Échanges</strong>,
              communiquez directement avec le client.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
                <p className="text-xs text-gray-600">
                  Sélectionnez <strong>"Répondre au client"</strong> — visible par le client.
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                <Paperclip className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
                <p className="text-xs text-gray-600">
                  Joignez des fichiers via l'icône trombone. Formats : PDF, PNG, JPG, DOC, DOCX.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id:    'msg-2',
        title: 'Notes internes',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Les notes internes sont invisibles pour le client.
              Visibles uniquement par vous et les autres techniciens.
            </p>
            <div className="flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
              <p className="text-xs text-yellow-800">
                Sélectionnez <strong>"Note interne"</strong> avant d'envoyer.
                Les notes apparaissent avec un fond jaune et le badge 🔐.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'msg-3',
        title: 'Épingler une solution',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Marquez un message comme solution officielle pour le mettre en
              avant et l'utiliser dans l'article KB à la clôture.
            </p>
            <div className="space-y-2">
              {[
                'Envoyez votre message de solution au client',
                'Sous le message, cliquez sur "📌 Marquer comme solution"',
                'Le message passe en vert avec le badge "Solution officielle épinglée"',
                'Pour changer d\'avis, cliquez sur "✕ Désépingler"',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  {
    id:    'sla',
    icon:  <Clock className="w-4 h-4" />,
    title: 'SLA & Délais',
    articles: [
      {
        id:    'sla-1',
        title: 'Comprendre les deux phases SLA',
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-800 mb-1">Phase 1 — Prise en charge</p>
                <p className="text-xs text-gray-600">
                  Délai entre la création et votre prise en charge.
                  Si dépassé, escalade automatique.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-800 mb-1">Phase 2 — Traitement</p>
                <p className="text-xs text-gray-600">
                  Délai entre prise en charge et clôture. À 80% : email d'alerte.
                  À 100% : email à vous + tous les admins.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id:    'sla-2',
        title: 'Alertes SLA que vous recevrez',
        content: (
          <div className="space-y-2">
            {[
              { type: 'Avertissement (80%)',      color: '#d97706', bg: '#fff7ed', desc: 'Email quand 80% du délai est écoulé. Vous seul le recevez.' },
              { type: 'Dépassement (100%)',        color: '#E31E24', bg: '#fff1f1', desc: 'Email à vous ET aux admins. Priorisez immédiatement.' },
              { type: 'Ticket escaladé vers vous', color: '#3b82f6', bg: '#eff6ff', desc: 'Notification quand un ticket non pris en charge vous est assigné.' },
            ].map(a => (
              <div key={a.type} className="p-3 rounded-lg border"
                   style={{ backgroundColor: a.bg, borderColor: a.color + '40' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: a.color }}>{a.type}</p>
                <p className="text-xs text-gray-600">{a.desc}</p>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  {
    id:    'escalade',
    icon:  <ArrowUpCircle className="w-4 h-4" />,
    title: 'Escalade automatique',
    articles: [
      {
        id:    'esc-1',
        title: 'Comment fonctionne l\'escalade',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              L'escalade garantit qu'aucun ticket ne reste sans technicien.
              Elle se déclenche toutes les 5 minutes via un scheduler.
            </p>
            <div className="space-y-2">
              {[
                'Ticket non pris en charge au-delà du délai',
                'Scheduler identifie le tech de la même spécialité le moins chargé',
                'Fallback vers tous les techs actifs si aucun spécialiste dispo',
                'Assignation automatique + SLA résolution démarre',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  {
    id:    'knowledge',
    icon:  <BookOpen className="w-4 h-4" />,
    title: 'Base de connaissances',
    articles: [
      {
        id:    'kb-1',
        title: 'Articles générés automatiquement',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              À chaque clôture, un article est créé avec le titre, la
              description et la solution épinglée.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Star className="w-4 h-4" />,         text: 'La solution épinglée devient la solution officielle de l\'article' },
                { icon: <Eye className="w-4 h-4" />,          text: 'Les clients peuvent consulter ces articles pour s\'auto-aider' },
                { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Plus vos solutions sont précises, plus la KB est utile' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>{item.icon}</span>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  // ── SECTION AGENT IA ──────────────────────────────────────────
  {
    id:    'ai',
    icon:  <Bot className="w-4 h-4" />,
    title: 'Assistant IA — Agent 2',
    articles: [
      {
        id:    'ai-1',
        title: 'Ce que fait l\'assistant IA',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              L'assistant IA est un copilote intégré directement dans la page
              du ticket. Il vous aide à trouver des solutions sans quitter
              votre espace de travail.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" style={{ color: RED }} />
                  Recherche dans la KB interne
                </p>
                <p className="text-xs text-gray-600">
                  L'agent cherche d'abord dans vos articles de base de
                  connaissances et vous propose les résultats les plus
                  pertinents, avec le score de pertinence.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" style={{ color: RED }} />
                  Sources externes (sur demande)
                </p>
                <p className="text-xs text-gray-600">
                  Si la KB interne ne suffit pas, vous pouvez lancer une
                  recherche sur Microsoft Docs, Stack Overflow et Super User
                  en un clic.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" style={{ color: RED }} />
                  Mémoire persistante
                </p>
                <p className="text-xs text-gray-600">
                  L'agent se souvient des échanges précédents sur ce ticket
                  et n'propose jamais deux fois la même solution déjà tentée.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id:    'ai-2',
        title: 'Guide complet d\'utilisation',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Toutes les fonctionnalités disponibles dans l'interface de l'agent :
            </p>
            <div className="space-y-2">
              {[
                {
                  icon: <Zap className="w-4 h-4" />,
                  label: 'Suggestions rapides',
                  desc: 'Quatre boutons pré-remplis en bas de l\'interface : "Causes possibles ?", "Diagnostic étape par étape", "Commandes de diagnostic", "Solution rapide ?". Cliquez pour envoyer directement.',
                },
                {
                  icon: <Image className="w-4 h-4" />,
                  label: 'Joindre une image',
                  desc: 'Cliquez sur le bouton + puis "Joindre une image". L\'agent lit automatiquement le contenu via OCR et l\'intègre dans sa réponse. Formats : PNG, JPG, GIF, WebP.',
                },
                {
                  icon: <FileText className="w-4 h-4" />,
                  label: 'Joindre un fichier',
                  desc: 'Cliquez sur le bouton + puis "Joindre un fichier". Formats supportés : PDF, Word (DOCX), Excel (XLSX), CSV, JSON, logs. L\'agent extrait et analyse le contenu.',
                },
                {
                  icon: <Globe className="w-4 h-4" />,
                  label: 'Recherche externe',
                  desc: 'Un bouton "Insatisfait ? Chercher en externe" apparaît après chaque réponse. Cliquez pour lancer une recherche automatique sur Microsoft Docs, Stack Overflow et Super User.',
                },
                {
                  icon: <RotateCcw className="w-4 h-4" />,
                  label: 'Réinitialiser la conversation',
                  desc: 'Le bouton "Reset" en haut à droite efface l\'historique de la conversation et repart d\'un contexte propre. La mémoire du ticket est supprimée. Action irréversible.',
                },
                {
                  icon: <Download className="w-4 h-4" />,
                  label: 'Copier une réponse',
                  desc: 'Un bouton "Copier la réponse" apparaît sous chaque réponse de l\'agent. Pratique pour coller la solution dans un message au client.',
                },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'ai-3',
        title: 'Mode lecture seule',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Quand vous consultez un ticket traité par un collègue,
              l'assistant IA s'affiche en mode lecture seule.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Messagerie désactivée
                </p>
                <p className="text-xs text-amber-700">
                  Vous ne pouvez pas envoyer de messages ni joindre de fichiers.
                  La zone de saisie affiche : "Ce ticket n'est pas assigné à vous".
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Historique consultable
                </p>
                <p className="text-xs text-blue-700">
                  L'historique des échanges avec l'agent reste visible.
                  Vous pouvez lire les suggestions proposées à votre collègue.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id:    'ai-4',
        title: 'Conseils pour de meilleures réponses',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La qualité de la réponse dépend directement de la précision
              de votre question.
            </p>
            <div className="space-y-2">
              {[
                { label: '✓ Bon exemple', color: '#16a34a', bg: '#f0fdf4',
                  text: '"Erreur 0x80070005 accès refusé lors de l\'installation de Windows Update sur Windows 10 Pro, version 22H2, sur un poste en domaine Active Directory."' },
                { label: '✗ Mauvais exemple', color: '#E31E24', bg: '#fff1f1',
                  text: '"Windows ne marche pas"' },
              ].map(ex => (
                <div key={ex.label} className="p-3 rounded-lg border"
                     style={{ backgroundColor: ex.bg, borderColor: ex.color + '40' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: ex.color }}>{ex.label}</p>
                  <p className="text-xs text-gray-600 italic">{ex.text}</p>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-700">Checklist d'une bonne question :</p>
            <div className="space-y-1">
              {[
                'Mentionnez le système d\'exploitation et sa version',
                'Incluez le code d\'erreur exact si disponible',
                'Décrivez ce qui fonctionnait avant le problème',
                'Précisez si le problème touche un seul poste ou plusieurs',
                'Joignez une capture d\'écran si l\'erreur est visuelle',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: RED }} />
                  <p className="text-xs text-gray-600">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'ai-5',
        title: 'L\'agent et la clôture du ticket',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Quand un ticket est clôturé, l'assistant IA se comporte
              différemment pour préserver l'historique.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-800 mb-1">Interface archivée</p>
                <p className="text-xs text-gray-600">
                  L'agent affiche la bannière "Ticket clôturé — conversation
                  archivée en lecture seule". La messagerie est désactivée.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-semibold text-green-800 mb-1">Historique préservé</p>
                <p className="text-xs text-green-700">
                  Tous les échanges avec l'agent restent consultables.
                  Utile pour retrouver une solution documentée lors d'un
                  incident similaire futur.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-semibold text-blue-800 mb-1">Mémoire conservée</p>
                <p className="text-xs text-blue-700">
                  La mémoire de la conversation (solutions tentées, état du
                  problème) reste en base de données. Elle peut être consultée
                  par l'administrateur pour alimenter la base de connaissances.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },

  {
    id:    'notifs',
    icon:  <Bell className="w-4 h-4" />,
    title: 'Notifications',
    articles: [
      {
        id:    'notif-1',
        title: 'Notifications reçues',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              Vous recevez des notifications in-app et emails pour :
            </p>
            {[
              { event: 'Ticket assigné',           desc: 'Un ticket vous a été assigné par un admin ou escaladé' },
              { event: 'Nouveau message client',    desc: 'Le client a répondu dans un de vos tickets' },
              { event: 'SLA à 80%',                desc: 'Email d\'alerte — vous seul' },
              { event: 'SLA dépassé',              desc: 'Email — vous + tous les admins' },
              { event: 'Ticket escaladé vers vous', desc: 'Un ticket non pris en charge vous a été automatiquement assigné' },
            ].map(n => (
              <div key={n.event} className="flex items-start gap-3 p-2 rounded-lg border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                     style={{ backgroundColor: RED }} />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{n.event}</p>
                  <p className="text-xs text-gray-500">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
];

export default function TechHelpPanel({ isOpen, onClose }) {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedArticle, setExpandedArticle] = useState(null);

  const filtered = searchQuery.trim()
    ? SECTIONS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(s => s.articles.length > 0)
    : SECTIONS;

  const toggleSection = (id) => {
    setExpandedSection(prev => prev === id ? null : id);
    setExpandedArticle(null);
  };
  const toggleArticle = (id) =>
    setExpandedArticle(prev => prev === id ? null : id);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
             onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full z-50 w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
             style={{ background: `linear-gradient(135deg, #1a1a1a 0%, ${RED} 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Guide technicien</h2>
              <p className="text-xs text-white/60">Manuel de référence</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Rechercher dans le guide…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none bg-gray-50 transition"
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Aucun résultat pour "{searchQuery}"</p>
              <p className="text-xs text-gray-400 mt-1">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(section => (
                <div key={section.id}>
                  <button onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                           style={{ backgroundColor: RED + '15', color: RED }}>
                        {section.icon}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {section.articles.length}
                      </span>
                    </div>
                    {expandedSection === section.id
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedSection === section.id && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {section.articles.map(article => (
                        <div key={article.id} className="border-b border-gray-100 last:border-0">
                          <button onClick={() => toggleArticle(article.id)}
                            className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-100 transition">
                            <span className="text-sm text-gray-700 text-left">{article.title}</span>
                            {expandedArticle === article.id
                              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                          </button>
                          {expandedArticle === article.id && (
                            <div className="px-5 pb-4 bg-white border-t border-gray-100">
                              <div className="pt-3">{article.content}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            Un problème non documenté ? Créez un ticket interne.
          </p>
        </div>
      </div>
    </>
  );
}
