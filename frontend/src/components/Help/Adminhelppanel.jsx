import { useState } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronDown,
  Search, Users, Ticket, Clock, BarChart2,
  Settings, BookOpen, UserPlus, AlertCircle,
  CheckCircle2, Shield, Zap, ArrowUpCircle,
  Eye, Lock, Bell, Info, Star, Filter,
  TrendingUp, UserCheck, RefreshCw, Database,
  Mail, Hash, ToggleLeft, Layers
} from 'lucide-react';

const RED = '#E31E24';

const SECTIONS = [
  // ── 1. Vue d'ensemble ─────────────────────────────────────────
  {
    id:    'overview',
    icon:  <Shield className="w-4 h-4" />,
    title: 'Vue d\'ensemble admin',
    articles: [
      {
        id:    'overview-1',
        title: 'Votre rôle en tant qu\'administrateur',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              En tant qu'administrateur, vous avez un accès complet à toutes
              les fonctionnalités du HelpDesk. Vous êtes responsable de la
              configuration, de la supervision et de la gestion des utilisateurs.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Users className="w-4 h-4" />,       label: 'Utilisateurs',          desc: 'Créer, modifier, activer/désactiver tous les comptes' },
                { icon: <Ticket className="w-4 h-4" />,      label: 'Tickets',               desc: 'Voir et gérer tous les tickets, assigner manuellement' },
                { icon: <Clock className="w-4 h-4" />,       label: 'Gestion SLA',           desc: 'Superviser les délais, escalader manuellement' },
                { icon: <BarChart2 className="w-4 h-4" />,   label: 'Rapports',              desc: 'Analyses de performance, taux de résolution, SLA' },
                { icon: <Settings className="w-4 h-4" />,    label: 'Paramètres',            desc: 'Configurer le HelpDesk (nom, couleurs, préfixe tickets…)' },
                { icon: <UserPlus className="w-4 h-4" />,    label: 'Demandes de comptes',   desc: 'Approuver ou rejeter les demandes d\'inscription' },
              ].map(item => (
                <div key={item.label}
                     className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>
                    {item.icon}
                  </span>
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
        id:    'overview-2',
        title: 'Tableau de bord — lire les indicateurs',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Le tableau de bord vous offre une vue temps réel de l'activité
              du HelpDesk. Voici comment interpréter chaque indicateur :
            </p>
            <div className="space-y-2">
              {[
                { label: 'Total tickets',  desc: 'Tous les tickets créés — cliquez pour accéder à la liste complète' },
                { label: 'En cours',       desc: 'Tickets actuellement traités par un technicien' },
                { label: 'Tickets résolus',desc: 'Tickets fermés ou résolus — le taux de résolution est affiché en pourcentage' },
                { label: 'Utilisateurs',   desc: 'Total des comptes actifs, avec détail du nombre de techniciens' },
                { label: 'SLA ⚠',          desc: 'Tickets ayant dépassé leur délai SLA — nécessite une action immédiate' },
              ].map(item => (
                <div key={item.label}
                     className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                       style={{ backgroundColor: RED }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                La bannière d'alerte SLA en rouge/orange s'affiche automatiquement
                si des tickets ont dépassé ou approchent de leur délai.
                Cliquez sur "Voir les tickets" pour agir directement.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 2. Gestion des utilisateurs ───────────────────────────────
  {
    id:    'users',
    icon:  <Users className="w-4 h-4" />,
    title: 'Gestion des utilisateurs',
    articles: [
      {
        id:    'users-1',
        title: 'Créer un compte utilisateur',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis <strong>Utilisateurs → Créer un utilisateur</strong>,
              vous pouvez créer manuellement un compte client, technicien
              ou administrateur.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Prénom / Nom',    desc: 'Identité de l\'utilisateur' },
                { label: 'Email',           desc: 'Sert d\'identifiant de connexion — doit être unique' },
                { label: 'Rôle',            desc: 'CLIENT, TECHNICIEN ou ADMIN' },
                { label: 'Spécialité',      desc: 'Catégorie assignée (techniciens uniquement) — détermine les tickets visibles' },
                { label: 'Téléphone / Société', desc: 'Champs optionnels pour les clients' },
              ].map(f => (
                <div key={f.label}
                     className="flex gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                       style={{ backgroundColor: RED }} />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">{f.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 flex items-start gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Un email avec les identifiants temporaires est automatiquement
                envoyé à l'utilisateur. Il devra définir un nouveau mot de passe
                à sa première connexion.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'users-2',
        title: 'Modifier un compte existant',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Cliquez sur un utilisateur dans la liste pour accéder à son
              profil et modifier ses informations.
            </p>
            <div className="space-y-2">
              {[
                'Modifier prénom, nom, email, téléphone, société',
                'Changer le rôle (CLIENT ↔ TECHNICIEN ↔ ADMIN)',
                'Changer la spécialité d\'un technicien',
                'Réinitialiser le mot de passe — un nouveau mot de passe temporaire sera envoyé par email',
                'Activer / désactiver le compte (l\'utilisateur ne pourra plus se connecter)',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"
                                style={{ color: RED }} />
                  <p className="text-xs text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Changer la spécialité d'un technicien peut affecter
                les tickets qui lui sont assignés. Les tickets de l'ancienne
                catégorie restent assignés jusqu'à leur clôture.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'users-3',
        title: 'Activer / Désactiver un compte',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Vous pouvez bloquer temporairement l'accès d'un utilisateur
              sans supprimer son compte ni son historique.
            </p>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <ToggleLeft className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: RED }} />
              <div>
                <p className="text-xs font-semibold text-gray-800 mb-1">
                  Toggle Activer / Désactiver
                </p>
                <p className="text-xs text-gray-600">
                  Un compte désactivé ne peut plus se connecter.
                  Ses tickets et données sont conservés intacts.
                  Vous pouvez réactiver le compte à tout moment.
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Si vous désactivez un technicien, ses tickets actifs
                ne sont PAS réassignés automatiquement. Pensez à les
                réassigner manuellement depuis la gestion des tickets.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'users-4',
        title: 'Assigner une spécialité à un technicien',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La spécialité d'un technicien détermine quels tickets
              il peut voir et traiter. Un technicien sans spécialité
              ne voit aucun ticket.
            </p>
            <div className="space-y-2">
              {[
                'Ouvrez le profil du technicien',
                'Sélectionnez la catégorie dans le champ "Spécialité"',
                'Sauvegardez — le technicien verra désormais tous les tickets de cette catégorie',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Un technicien n'a qu'une seule spécialité à la fois.
                L'escalade automatique cherche d'abord les techniciens
                spécialisés dans la catégorie du ticket, puis fallback
                vers tous les techniciens actifs si aucun n'est disponible.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 3. Demandes de comptes ────────────────────────────────────
  {
    id:    'requests',
    icon:  <UserPlus className="w-4 h-4" />,
    title: 'Approbation des demandes',
    articles: [
      {
        id:    'req-1',
        title: 'Gérer les demandes d\'inscription',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Quand un utilisateur s'inscrit via la page de connexion,
              sa demande est mise en attente de votre validation.
              Accédez à <strong>Demandes de comptes</strong> dans le menu.
            </p>
            <div className="space-y-2">
              {[
                { badge: 'En attente', color: '#d97706', bg: '#fffbeb', desc: 'Nouvelle demande, non traitée' },
                { badge: 'Approuvée',  color: '#16a34a', bg: '#f0fdf4', desc: 'Compte créé, identifiants envoyés par email' },
                { badge: 'Rejetée',    color: '#E31E24', bg: '#fff1f1', desc: 'Demande refusée — l\'utilisateur est notifié par email' },
              ].map(item => (
                <div key={item.badge}
                     className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
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
        id:    'req-2',
        title: 'Approuver une demande',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Lors de l'approbation, vous définissez le rôle et la
              spécialité (si technicien) avant de confirmer.
            </p>
            <div className="space-y-2">
              {[
                'Cliquez sur la demande pour voir les informations fournies',
                'Sélectionnez le rôle à attribuer (CLIENT ou TECHNICIEN)',
                'Si TECHNICIEN : choisissez la catégorie de spécialité',
                'Cliquez sur "Approuver" — le compte est créé et les identifiants envoyés',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 flex items-start gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                L'utilisateur reçoit automatiquement un email avec ses
                identifiants temporaires. Il devra les changer à sa
                première connexion.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 4. Gestion des tickets ────────────────────────────────────
  {
    id:    'tickets',
    icon:  <Ticket className="w-4 h-4" />,
    title: 'Gestion des tickets',
    articles: [
      {
        id:    'tkt-1',
        title: 'Voir et filtrer tous les tickets',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Contrairement aux techniciens, vous voyez
              <strong> tous les tickets</strong> de toutes les catégories.
              Utilisez les filtres pour affiner l'affichage.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Filter className="w-4 h-4" />,     text: 'Filtrer par statut, priorité, catégorie, technicien assigné' },
                { icon: <Search className="w-4 h-4" />,     text: 'Rechercher par titre, référence (#TKT-001) ou client' },
                { icon: <TrendingUp className="w-4 h-4" />, text: 'Trier par date de création, priorité, SLA restant' },
              ].map((item, i) => (
                <div key={i}
                     className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span style={{ color: RED }}>{item.icon}</span>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Les tickets avec dépassement SLA sont mis en évidence
                avec un badge rouge. Traitez-les en priorité.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'tkt-2',
        title: 'Assigner un ticket manuellement',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis le détail d'un ticket, vous pouvez assigner ou
              réassigner manuellement n'importe quel technicien.
            </p>
            <div className="space-y-2">
              {[
                'Ouvrez le ticket depuis la liste',
                'Dans la colonne droite, cliquez sur "Assigner un technicien"',
                'Sélectionnez le technicien dans la liste (filtrée par spécialité)',
                'Confirmez — le SLA de traitement démarre immédiatement',
                'Le technicien reçoit une notification',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Vous ne pouvez pas assigner un technicien à un ticket
                hors de sa spécialité — le système bloque l'action avec
                un message d'erreur explicatif.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'tkt-3',
        title: 'Créer un ticket au nom d\'un client',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis <strong>Créer un ticket</strong>, vous pouvez soumettre
              une demande directement, notamment pour des incidents signalés
              par téléphone ou en présentiel.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Le ticket est créé en votre nom. Le client concerné
                peut être mentionné dans la description.
                Vous pouvez ensuite l'assigner à un technicien
                immédiatement depuis le détail.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 5. SLA & Escalade ─────────────────────────────────────────
  {
    id:    'sla',
    icon:  <Clock className="w-4 h-4" />,
    title: 'SLA & Escalades',
    articles: [
      {
        id:    'sla-1',
        title: 'Page Gestion SLA',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La page <strong>Gestion SLA</strong> est votre tableau de
              contrôle dédié aux délais. Elle affiche en temps réel tous
              les tickets avec leur état SLA.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Phase Prise en charge', color: '#d97706', desc: 'Tickets non assignés — délai avant escalade automatique' },
                { label: 'Phase Traitement',      color: '#3b82f6', desc: 'Tickets assignés — délai avant violation SLA' },
                { label: 'SLA Warning (80%)',     color: '#f59e0b', desc: 'Ticket approchant la deadline — email envoyé au technicien' },
                { label: 'SLA Breach (100%)',     color: '#E31E24', desc: 'Deadline dépassée — email envoyé au tech + tous les admins' },
              ].map(s => (
                <div key={s.label}
                     className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold
                                   text-white flex-shrink-0"
                        style={{ backgroundColor: s.color }}>
                    {s.label}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'sla-2',
        title: 'Escalade manuelle',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              En plus de l'escalade automatique (toutes les 5 min),
              vous pouvez escalader manuellement n'importe quel ticket
              vers le technicien le moins chargé.
            </p>
            <div className="space-y-2">
              {[
                'Ouvrez le ticket concerné',
                'Cliquez sur "Escalader" dans les actions rapides',
                'Le ticket est réassigné au technicien le moins chargé dans la catégorie',
                'Si aucun spécialiste dispo : fallback vers tous les techniciens actifs',
                'Le SLA de résolution est réinitialisé et le technicien notifié',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white font-bold flex-shrink-0 mt-0.5"
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
      {
        id:    'sla-3',
        title: 'Comprendre l\'escalade automatique',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Le scheduler vérifie toutes les <strong>5 minutes</strong> les
              tickets non pris en charge. Voici la logique complète :
            </p>
            <div className="space-y-2">
              {[
                'Ticket créé → SLA prise en charge démarre (délai selon priorité)',
                'Délai dépassé → email aux admins + escalade déclenchée',
                'Recherche du tech spécialisé avec le moins de tickets actifs',
                'Fallback vers tous les techs actifs si aucun spécialiste dispo',
                'Assignation + reset SLA résolution + flag anti-boucle activé',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: RED, fontSize: 10 }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 flex items-start gap-2">
                <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" />
                L'escalade n'est déclenchée qu'une seule fois par ticket
                (flag anti-boucle). Vous pouvez toujours escalader
                manuellement une deuxième fois si nécessaire.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 6. Rapports ───────────────────────────────────────────────
  {
    id:    'reports',
    icon:  <BarChart2 className="w-4 h-4" />,
    title: 'Tableaux de bord & Rapports',
    articles: [
      {
        id:    'rep-1',
        title: 'Métriques disponibles',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La page Rapports vous donne une vue analytique complète
              de l'activité du HelpDesk sur la période sélectionnée.
            </p>
            <div className="space-y-2">
              {[
                { icon: <TrendingUp className="w-4 h-4" />,   label: 'Taux de résolution',      desc: 'Pourcentage de tickets résolus vs créés sur la période' },
                { icon: <Clock className="w-4 h-4" />,        label: 'Temps moyen de résolution', desc: 'Durée moyenne entre la création et la clôture d\'un ticket' },
                { icon: <UserCheck className="w-4 h-4" />,    label: 'Performance techniciens',  desc: 'Nombre de tickets traités et taux de résolution par technicien' },
                { icon: <Layers className="w-4 h-4" />,       label: 'Répartition par catégorie', desc: 'Volume de tickets par catégorie' },
                { icon: <ArrowUpCircle className="w-4 h-4" />, label: 'Escalades',               desc: 'Nombre et taux d\'escalades sur la période' },
              ].map(item => (
                <div key={item.label}
                     className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>
                    {item.icon}
                  </span>
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
        id:    'rep-2',
        title: 'Top techniciens',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Le classement des techniciens est visible sur le tableau de bord
              et dans les rapports. Il est calculé automatiquement selon :
            </p>
            <div className="space-y-2">
              {[
                'Taux de résolution = tickets résolus / tickets assignés × 100',
                'En cas d\'égalité, le nombre absolu de tickets résolus départage',
                'Seuls les techniciens ayant au moins 1 ticket assigné apparaissent',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"
                                style={{ color: RED }} />
                  <p className="text-xs text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 7. Base de connaissances ──────────────────────────────────
  {
    id:    'knowledge',
    icon:  <BookOpen className="w-4 h-4" />,
    title: 'Base de connaissances',
    articles: [
      {
        id:    'kb-1',
        title: 'Génération automatique d\'articles',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Chaque ticket clôturé génère automatiquement un article
              dans la base de connaissances. Cet article est visible
              par les clients et les techniciens.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Star className="w-4 h-4" />,         text: 'La solution épinglée par le technicien devient la solution officielle de l\'article' },
                { icon: <Eye className="w-4 h-4" />,          text: 'Les clients peuvent consulter les articles pour résoudre leurs problèmes seuls' },
                { icon: <Database className="w-4 h-4" />,     text: 'Plus la base est riche, plus les techniciens et clients peuvent s\'auto-aider' },
              ].map((item, i) => (
                <div key={i}
                     className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: RED }}>
                    {item.icon}
                  </span>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'kb-2',
        title: 'Administrer la base de connaissances',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis <strong>Base de connaissances → Admin</strong>,
              vous pouvez modérer et gérer tous les articles.
            </p>
            <div className="space-y-2">
              {[
                'Voir tous les articles (y compris ceux sans solution épinglée)',
                'Modifier ou enrichir un article existant',
                'Supprimer un article obsolète ou incorrect',
                'Filtrer par catégorie, nombre de vues ou votes utiles',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"
                                style={{ color: RED }} />
                  <p className="text-xs text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 8. Paramètres ─────────────────────────────────────────────
  {
    id:    'settings',
    icon:  <Settings className="w-4 h-4" />,
    title: 'Paramètres système',
    articles: [
      {
        id:    'set-1',
        title: 'Configuration générale',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis <strong>Paramètres</strong>, vous personnalisez
              l'apparence et le comportement du HelpDesk pour toute
              l'organisation.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Nom de l\'organisation', desc: 'Affiché dans l\'interface et les emails' },
                { label: 'Slogan',                 desc: 'Sous-titre affiché dans la sidebar' },
                { label: 'Couleur principale',     desc: 'Couleur de l\'interface (rouge par défaut : #E31E24)' },
                { label: 'Préfixe des tickets',    desc: 'Exemple : "TKT" → les tickets s\'affichent comme #TKT-001' },
              ].map(f => (
                <div key={f.label}
                     className="flex gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                       style={{ backgroundColor: RED }} />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">{f.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'set-2',
        title: 'Catégories & Priorités',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Les catégories et priorités sont configurables depuis
              les paramètres. Elles déterminent le routage des tickets
              et les délais SLA.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-800 mb-1">Catégories</p>
                <p className="text-xs text-gray-600">
                  Réseau, Logiciel, Matériel, Accès… Chaque catégorie
                  est associée à un ou plusieurs techniciens via leur spécialité.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-800 mb-1">Priorités</p>
                <p className="text-xs text-gray-600">
                  Chaque priorité a un délai de prise en charge
                  (escaladeMinutes) et un délai de résolution (slaHours).
                  Ces valeurs définissent les SLA contractuels.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Modifier les SLA d'une priorité n'affecte pas les tickets
                déjà en cours — seuls les nouveaux tickets utilisent
                les nouvelles valeurs.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },

  // ── 9. Notifications ──────────────────────────────────────────
  {
    id:    'notifs',
    icon:  <Bell className="w-4 h-4" />,
    title: 'Notifications admin',
    articles: [
      {
        id:    'notif-1',
        title: 'Notifications reçues par l\'admin',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              En tant qu'admin, vous recevez des notifications critiques
              que les techniciens et clients ne reçoivent pas :
            </p>
            {[
              { event: 'SLA Breach (100%)',           desc: 'Email envoyé à TOUS les admins quand un ticket dépasse son délai de résolution' },
              { event: 'Ticket non assigné',           desc: 'Email quand un ticket dépasse son délai de prise en charge (escalade déclenchée)' },
              { event: 'Nouvelle demande de compte',   desc: 'Notification quand un utilisateur soumet une demande d\'inscription' },
              { event: 'Escalade effectuée',           desc: 'Notification quand l\'escalade automatique assigne un ticket' },
            ].map(n => (
              <div key={n.event}
                   className="flex items-start gap-3 p-2 rounded-lg border border-gray-100">
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

  // ── 10. Sécurité ──────────────────────────────────────────────
  {
    id:    'security',
    icon:  <Lock className="w-4 h-4" />,
    title: 'Sécurité & Accès',
    articles: [
      {
        id:    'sec-1',
        title: 'Bonnes pratiques administrateur',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Votre compte admin a accès à toutes les données de l'organisation.
              Appliquez ces bonnes pratiques de sécurité :
            </p>
            <div className="space-y-2">
              {[
                'Utilisez un mot de passe fort, unique et non partagé',
                'Déconnectez-vous systématiquement après chaque session',
                'Ne créez pas de comptes admin inutilement — le moindre privilège suffit',
                'En cas de départ d\'un admin, désactivez son compte immédiatement',
                'Réinitialisez les mots de passe compromis via le panneau utilisateur',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5"
                                style={{ color: RED }} />
                  <p className="text-xs text-gray-600">{tip}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Après <strong>5 tentatives</strong> de connexion incorrectes,
                tout compte est temporairement bloqué 15 minutes —
                y compris les comptes admin.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'sec-2',
        title: 'Visibilité des données',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              En tant qu'admin, voici ce que vous pouvez et ne pouvez
              pas voir :
            </p>
            <div className="space-y-2">
              {[
                { icon: <Eye className="w-4 h-4" />,  canSee: true,  text: 'Tous les tickets de toutes les catégories' },
                { icon: <Eye className="w-4 h-4" />,  canSee: true,  text: 'Les notes internes des techniciens' },
                { icon: <Eye className="w-4 h-4" />,  canSee: true,  text: 'L\'historique complet des actions sur chaque ticket' },
                { icon: <Lock className="w-4 h-4" />, canSee: false, text: 'Les mots de passe — ils sont chiffrés, personne ne peut les lire' },
              ].map((item, i) => (
                <div key={i}
                     className="flex items-start gap-3 p-2.5 rounded-lg"
                     style={{
                       backgroundColor: item.canSee ? '#f0fdf4' : '#fef2f2',
                       border: `1px solid ${item.canSee ? '#bbf7d0' : '#fecaca'}`,
                     }}>
                  <span className="flex-shrink-0 mt-0.5"
                        style={{ color: item.canSee ? '#16a34a' : '#E31E24' }}>
                    {item.icon}
                  </span>
                  <p className="text-xs"
                     style={{ color: item.canSee ? '#15803d' : '#b91c1c' }}>
                    {item.canSee ? '✓ ' : '✗ '}{item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
];

// ── Composant principal ────────────────────────────────────────────
export default function AdminHelpPanel({ isOpen, onClose }) {
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
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
             onClick={onClose} />
      )}

      {/* Panneau latéral */}
      <div className={`
        fixed top-0 right-0 h-full z-50 w-96 bg-white shadow-2xl
        flex flex-col transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
             style={{
               background: `linear-gradient(135deg, #1a1a1a 0%, ${RED} 100%)`,
             }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Guide administrateur</h2>
              <p className="text-xs text-white/60">Manuel de référence</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                       flex items-center justify-center text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recherche */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dans le guide…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200
                         rounded-xl outline-none bg-gray-50 transition"
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                Aucun résultat pour "{searchQuery}"
              </p>
              <p className="text-xs text-gray-400 mt-1">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(section => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between
                               px-5 py-3.5 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                           style={{ backgroundColor: RED + '15', color: RED }}>
                        {section.icon}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {section.title}
                      </span>
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
                        <div key={article.id}
                             className="border-b border-gray-100 last:border-0">
                          <button
                            onClick={() => toggleArticle(article.id)}
                            className="w-full flex items-center justify-between
                                       px-5 py-3 hover:bg-gray-100 transition">
                            <span className="text-sm text-gray-700 text-left">
                              {article.title}
                            </span>
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            Accès complet — Guide réservé aux administrateurs
          </p>
        </div>
      </div>
    </>
  );
}
