import { useState } from 'react';
import {
  HelpCircle, X, ChevronRight, ChevronDown,
  PlusCircle, Ticket, BookOpen, User,
  MessageSquare, Paperclip, Clock, CheckCircle2,
  AlertCircle, Search, Bell, Lock, Eye
} from 'lucide-react';

const RED = '#E31E24';

const SECTIONS = [
  {
    id:    'compte',
    icon:  <User className="w-4 h-4" />,
    title: 'Mon compte',
    articles: [
      {
        id:    'compte-1',
        title: 'Première connexion',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Lors de votre première connexion, vous devrez définir un mot de passe
              personnel pour remplacer le mot de passe temporaire envoyé par email.
            </p>
            <div className="space-y-2">
              {[
                'Ouvrez l\'email reçu et copiez le mot de passe temporaire',
                'Connectez-vous sur la page de connexion',
                'Vous serez redirigé automatiquement vers la page de changement de mot de passe',
                'Choisissez un mot de passe sécurisé selon les règles affichées',
                'Vous accédez ensuite à votre tableau de bord',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white text-xs font-bold flex-shrink-0 mt-0.5"
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
        id:    'compte-2',
        title: 'Modifier mon profil',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Vous pouvez mettre à jour vos informations personnelles depuis la
              section <strong>Mon profil</strong> dans le menu de navigation.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Votre adresse email sert d'identifiant de connexion.
                Modifiez-la avec précaution.
              </p>
            </div>
          </div>
        ),
      },
      {
        id:    'compte-3',
        title: 'Mot de passe oublié',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Si vous avez oublié votre mot de passe, utilisez la procédure
              de réinitialisation depuis la page de connexion.
            </p>
            <div className="space-y-2">
              {[
                'Cliquez sur "Mot de passe oublié ?" sur la page de connexion',
                'Saisissez votre adresse email professionnelle',
                'Vérifiez votre boîte mail et copiez le code à 6 chiffres',
                'Entrez le code (valable 15 minutes)',
                'Définissez votre nouveau mot de passe',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center
                                   text-white text-xs font-bold flex-shrink-0 mt-0.5"
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
        title: 'Créer un ticket',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Un ticket représente une demande de support. Pour en créer un,
              cliquez sur <strong>Créer un ticket</strong> dans le menu latéral.
            </p>
            <div className="space-y-2">
              {[
                { label: 'Titre',        desc: 'Résumé court et précis de votre problème' },
                { label: 'Type',         desc: '"Incident" pour une panne, "Demande" pour une demande de service' },
                { label: 'Catégorie',    desc: 'Réseau, Logiciel, Matériel, Accès…' },
                { label: 'Priorité',     desc: 'Critique, Haute, Moyenne ou Basse selon l\'urgence' },
                { label: 'Description',  desc: 'Décrivez le problème en détail avec les étapes pour le reproduire' },
                { label: 'Pièces jointes', desc: 'Captures d\'écran, logs ou tout fichier utile (PDF, PNG, JPG, DOC)' },
              ].map(field => (
                <div key={field.label}
                     className="flex gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                       style={{ backgroundColor: RED }} />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">
                      {field.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">{field.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'tickets-2',
        title: 'Statuts d\'un ticket',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              Chaque ticket passe par plusieurs statuts au cours de son traitement :
            </p>
            {[
              { status: 'Nouveau',        color: '#6b7280', desc: 'Ticket reçu, en attente d\'assignation à un technicien' },
              { status: 'En cours',       color: '#3b82f6', desc: 'Un technicien traite activement votre demande' },
              { status: 'Info requise',   color: '#f59e0b', desc: 'Le technicien a besoin d\'informations supplémentaires de votre part' },
              { status: 'Résolu',         color: '#16a34a', desc: 'Solution appliquée, en attente de votre confirmation' },
              { status: 'Fermé',          color: '#374151', desc: 'Ticket clôturé définitivement' },
            ].map(s => (
              <div key={s.status}
                   className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold
                                 text-white flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: s.color }}>
                  {s.status}
                </span>
                <p className="text-xs text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        id:    'tickets-3',
        title: 'Communiquer avec le technicien',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Depuis le détail d'un ticket, vous pouvez échanger directement
              avec le technicien assigné via la messagerie intégrée.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5"
                               style={{ color: RED }} />
                <p className="text-xs text-gray-600">
                  Rédigez votre message dans la zone de texte en bas du ticket
                  et appuyez sur <kbd className="px-1 py-0.5 bg-gray-200
                  rounded text-xs">Envoyer</kbd> ou
                  <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs ml-1">
                    Ctrl+Entrée
                  </kbd>
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                <Paperclip className="w-4 h-4 flex-shrink-0 mt-0.5"
                           style={{ color: RED }} />
                <p className="text-xs text-gray-600">
                  Joignez des fichiers supplémentaires via l'icône trombone
                  (PDF, PNG, JPG, DOC — max 10 Mo)
                </p>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-amber-50
                              rounded-lg border border-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p className="text-xs text-amber-700">
                  Si le statut passe à <strong>Info requise</strong>, répondez
                  rapidement pour ne pas retarder la résolution.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id:    'tickets-4',
        title: 'Supprimer un ticket',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Vous pouvez supprimer un ticket uniquement s'il est au statut
              <strong> Nouveau</strong> (pas encore pris en charge).
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Une fois qu'un technicien a pris en charge votre ticket, la
                suppression n'est plus possible. Contactez le support si nécessaire.
              </p>
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
        id:    'knowledge-1',
        title: 'Qu\'est-ce que la base de connaissances ?',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              La base de connaissances regroupe les solutions aux problèmes
              les plus fréquents. Avant de créer un ticket, consultez-la —
              votre problème a peut-être déjà une solution documentée.
            </p>
            <div className="space-y-2">
              {[
                { icon: <Search className="w-4 h-4" />,       text: 'Recherchez par mots-clés dans la barre de recherche' },
                { icon: <BookOpen className="w-4 h-4" />,     text: 'Filtrez par catégorie pour affiner les résultats' },
                { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Les articles avec "Solution épinglée" ont une solution vérifiée' },
              ].map((item, i) => (
                <div key={i}
                     className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span style={{ color: RED }}>{item.icon}</span>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id:    'knowledge-2',
        title: 'Voter pour un article',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Après avoir lu un article, indiquez s'il vous a aidé via les
              boutons 👍 / 👎 en bas de l'article. Cela aide à améliorer la
              qualité de la documentation.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700">
                Votre vote est anonyme et ne peut être soumis qu'une seule fois
                par article.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id:    'notifications',
    icon:  <Bell className="w-4 h-4" />,
    title: 'Notifications',
    articles: [
      {
        id:    'notif-1',
        title: 'Types de notifications',
        content: (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              Vous recevez des notifications in-app (cloche en haut à droite)
              et des emails pour les événements suivants :
            </p>
            {[
              { event: 'Ticket créé',             desc: 'Confirmation de réception de votre demande' },
              { event: 'Technicien assigné',       desc: 'Un technicien prend en charge votre ticket' },
              { event: 'Nouveau message',          desc: 'Le technicien vous a répondu' },
              { event: 'Informations requises',    desc: 'Le technicien a besoin de précisions' },
              { event: 'Ticket résolu',            desc: 'Votre problème a été résolu' },
              { event: 'Ticket clôturé',           desc: 'Le ticket est définitivement fermé' },
            ].map(n => (
              <div key={n.event}
                   className="flex items-start gap-3 p-2 rounded-lg
                              border border-gray-100">
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
  {
    id:    'sla',
    icon:  <Clock className="w-4 h-4" />,
    title: 'Délais & SLA',
    articles: [
      {
        id:    'sla-1',
        title: 'Comprendre les délais de traitement',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Chaque ticket a un délai de traitement (SLA) défini selon
              sa priorité. Ce délai garantit une prise en charge dans les temps.
            </p>
            <div className="space-y-2">
              {[
                { prio: 'Critique', color: '#dc2626', delai: 'Prise en charge immédiate' },
                { prio: 'Haute',    color: '#ea580c', delai: 'Sous 4 heures' },
                { prio: 'Moyenne',  color: '#ca8a04', delai: 'Sous 24 heures' },
                { prio: 'Basse',    color: '#6b7280', delai: 'Sous 72 heures' },
              ].map(p => (
                <div key={p.prio}
                     className="flex items-center justify-between p-2.5
                                bg-gray-50 rounded-lg">
                  <span className="text-xs font-semibold px-2 py-0.5
                                   rounded-full text-white"
                        style={{ backgroundColor: p.color }}>
                    {p.prio}
                  </span>
                  <span className="text-xs text-gray-600">{p.delai}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Si un SLA est dépassé, le ticket est automatiquement escaladé
                vers un autre technicien disponible.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id:    'securite',
    icon:  <Lock className="w-4 h-4" />,
    title: 'Sécurité',
    articles: [
      {
        id:    'secu-1',
        title: 'Confidentialité de vos données',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Vos données et échanges sont protégés. Voici ce que vous devez savoir :
            </p>
            <div className="space-y-2">
              {[
                { icon: <Eye className="w-4 h-4" />,  text: 'Seul le technicien assigné et les admins peuvent voir vos tickets' },
                { icon: <Lock className="w-4 h-4" />, text: 'Les notes internes des techniciens ne sont pas visibles par les clients' },
                { icon: <Lock className="w-4 h-4" />, text: 'Votre mot de passe est chiffré — personne ne peut le lire, même les admins' },
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
        id:    'secu-2',
        title: 'Sécurité du compte',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Pour protéger votre compte contre les accès non autorisés :
            </p>
            <div className="space-y-2">
              {[
                'Utilisez un mot de passe unique que vous n\'utilisez pas ailleurs',
                'Ne partagez jamais vos identifiants avec quelqu\'un d\'autre',
                'Déconnectez-vous après chaque session sur un ordinateur partagé',
                'En cas de connexion suspecte, changez immédiatement votre mot de passe',
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
                Après {' '}<strong>5 tentatives</strong> de connexion incorrectes,
                votre compte est temporairement bloqué pendant 15 minutes.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
];

// ── Composant principal — accepte isOpen / onClose depuis le layout ──
export default function ClientHelpPanel({ isOpen, onClose }) {
  const [searchQuery,     setSearchQuery]     = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedArticle, setExpandedArticle] = useState(null);

  const filtered = searchQuery.trim()
    ? SECTIONS.map(section => ({
        ...section,
        articles: section.articles.filter(a =>
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
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panneau latéral — slide depuis la droite */}
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
              <h2 className="text-base font-bold text-white">Centre d'aide</h2>
              <p className="text-xs text-white/60">Manuel utilisateur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                       flex items-center justify-center text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dans l'aide…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200
                         rounded-xl outline-none bg-gray-50 transition"
              onFocus={e  => e.target.style.borderColor = RED}
              onBlur={e   => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Contenu scrollable */}
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
                        <div key={article.id} className="border-b border-gray-100 last:border-0">
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
            Besoin d'aide supplémentaire ? Créez un ticket depuis le menu.
          </p>
        </div>
      </div>
    </>
  );
}
