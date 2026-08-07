import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText, Download, Clock, CheckCircle, AlertTriangle,
  ShieldAlert, FileDown, Filter, X, Calendar, TrendingUp, TrendingDown
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAllTickets } from '../../api/ticketApi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function formatDuration(ms) {
  const totalMin = Math.round(Math.abs(ms) / 60000);
  const days  = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins  = totalMin % 60;
  if (days > 0)  return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  if (hours > 0) return mins  > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

// ── Animated counter hook (from second code) ──────────────────────
function useCountUp(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    const numeric = parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setValue(target); return; }
    const timer = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * numeric));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
}

// ── Animated KPI value component (from second code) ───────────────
function AnimatedKpiValue({ value, delay = 0 }) {
  const numericMatch = String(value).match(/^(\d+)(%?)$/);
  const counted = useCountUp(numericMatch ? parseInt(numericMatch[1]) : 0, 1200, delay);
  if (!numericMatch) return <span>{value}</span>;
  return (
    <span>
      {counted}{numericMatch[2]}
    </span>
  );
}

// ── Export PDF (HTML stylé dans nouvelle fenêtre) ──────────────────────
function exportPdf(tickets, kpis, parTechnicien, title) {
  const ticketRows = tickets.map(t => `
    <tr>
      <td>#TKT-${String(t.id).padStart(3, '0')}</td>
      <td>${t.title}</td>
      <td>${t.priority?.name ?? '—'}</td>
      <td>${t.status?.name ?? '—'}</td>
      <td>${t.category?.name ?? '—'}</td>
      <td>${t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Non assigné'}</td>
      <td>${t.slaBreached ? '⚠ Dépassé' : t.slaDeadline ? '✓ OK' : '—'}</td>
      <td>${new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
    </tr>`).join('');

  const techRows = parTechnicien.map(tech => `
    <tr>
      <td>${tech.name}</td>
      <td>${tech.assignes}</td>
      <td>${tech.resolus}</td>
      <td>${tech.slaBreached}</td>
      <td>${tech.escalades}</td>
      <td>${tech.tempsMoyen}</td>
      <td>${tech.tauxSla}%</td>
      <td>${tech.taux}%</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 20px; color: #E31E24; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #374151; margin: 20px 0 8px; border-bottom: 2px solid #E31E24; padding-bottom: 4px; }
  p.meta { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
  .kpis { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; min-width: 130px; }
  .kpi .val { font-size: 22px; font-weight: 700; color: #111; }
  .kpi .lbl { font-size: 10px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
  th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 10px;
       text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) td { background: #fafafa; }
  @media print { body { padding: 8px; } }
</style></head><body>
  <h1>${title}</h1>
  <p class="meta">Généré le ${new Date().toLocaleString('fr-FR')} · ${tickets.length} ticket(s)</p>

  <div class="kpis">
    ${kpis.map(k => `<div class="kpi"><div class="val">${k.value}</div><div class="lbl">${k.label}</div></div>`).join('')}
  </div>

  <h2>Liste des tickets</h2>
  <table><thead><tr>
    <th>ID</th><th>Titre</th><th>Priorité</th><th>Statut</th>
    <th>Catégorie</th><th>Technicien</th><th>SLA</th><th>Date création</th>
  </tr></thead><tbody>${ticketRows}</tbody></table>

  <h2>Charge par technicien</h2>
  <table><thead><tr>
    <th>Technicien</th><th>Assignés</th><th>Résolus</th>
    <th>SLA dépassés</th><th>Escalades</th><th>Tps moyen</th>
    <th>Taux SLA</th><th>Taux résolution</th>
  </tr></thead><tbody>${techRows}</tbody></table>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ── Export Excel ───────────────────────────────────────────────────
function exportExcel(tickets, parTechnicien, kpis, dateLabel) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 — KPIs
  const kpiData = [
    ['Indicateur', 'Valeur'],
    ...kpis.map(k => [k.label, k.value]),
    ['Période', dateLabel],
    ['Exporté le', new Date().toLocaleString('fr-FR')],
  ];
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs');

  // Feuille 2 — Tickets
  const ticketData = [
    ['ID', 'Titre', 'Priorité', 'Statut', 'Catégorie', 'Technicien', 'SLA', 'Date création'],
    ...tickets.map(t => [
      `#TKT-${String(t.id).padStart(3, '0')}`,
      t.title,
      t.priority?.name ?? '—',
      t.status?.name ?? '—',
      t.category?.name ?? '—',
      t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Non assigné',
      t.slaBreached ? 'Dépassé' : t.slaDeadline ? 'Respecté' : '—',
      new Date(t.createdAt).toLocaleDateString('fr-FR'),
    ]),
  ];
  const wsTickets = XLSX.utils.aoa_to_sheet(ticketData);
  XLSX.utils.book_append_sheet(wb, wsTickets, 'Tickets');

  // Feuille 3 — Techniciens
  const techData = [
    ['Technicien', 'Assignés', 'Résolus', 'SLA dépassés', 'Escalades', 'Temps moyen', 'Taux SLA %', 'Taux résolution %'],
    ...parTechnicien.map(t => [
      t.name, t.assignes, t.resolus, t.slaBreached,
      t.escalades, t.tempsMoyen, t.tauxSla, t.taux,
    ]),
  ];
  const wsTech = XLSX.utils.aoa_to_sheet(techData);
  XLSX.utils.book_append_sheet(wb, wsTech, 'Techniciens');

  XLSX.writeFile(wb, `rapport-helpdesk-${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ══════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════
const COLORS = ['#E31E24', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const PRIORITY_COLORS = {
  'Critique': '#E31E24', 'Haute': '#f59e0b',
  'Moyenne':  '#3b82f6', 'Basse': '#10b981',
};

const STATUS_COLORS = {
  'Nouveau':  '#6b7280', 'En cours': '#3b82f6',
  'Résolu':   '#10b981', 'Fermé':    '#E31E24',
};

// Raccourcis de période
const PERIOD_SHORTCUTS = [
  { label: 'Aujourd\'hui',    days: 0  },
  { label: 'Cette semaine',   days: 7  },
  { label: 'Ce mois',        days: 30 },
  { label: 'Cette année',    days: 365 },
  { label: 'Tout',           days: -1 },
];

export default function AdminReports() {
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [period,     setPeriod]     = useState('mois');
  const [exporting,  setExporting]  = useState(false);

  // ── Filtre par plage de dates ──────────────────────────────────
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [activeShortcut, setActiveShortcut] = useState('Tout');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    getAllTickets()
      .then(r => setTickets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Appliquer un raccourci de période ─────────────────────────
  const applyShortcut = (shortcut) => {
    setActiveShortcut(shortcut.label);
    setShowDatePicker(false);
    if (shortcut.days === -1) {
      setDateFrom('');
      setDateTo('');
      return;
    }
    const to   = new Date();
    const from = new Date();
    from.setDate(to.getDate() - shortcut.days);
    setDateTo(to.toISOString().slice(0, 10));
    setDateFrom(from.toISOString().slice(0, 10));
  };

  const resetDates = () => {
    setDateFrom('');
    setDateTo('');
    setActiveShortcut('Tout');
  };

  // ── Tickets filtrés par plage de dates ────────────────────────
  const ticketsFiltres = useMemo(() => {
    if (!dateFrom && !dateTo) return tickets;
    return tickets.filter(t => {
      const created = new Date(t.createdAt);
      if (dateFrom && created < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59);
        if (created > end) return false;
      }
      return true;
    });
  }, [tickets, dateFrom, dateTo]);

  // ── Label période pour l'export ───────────────────────────────
  const dateLabel = useMemo(() => {
    if (!dateFrom && !dateTo) return 'Toutes les données';
    if (dateFrom && dateTo) return `Du ${new Date(dateFrom).toLocaleDateString('fr-FR')} au ${new Date(dateTo).toLocaleDateString('fr-FR')}`;
    if (dateFrom) return `Depuis le ${new Date(dateFrom).toLocaleDateString('fr-FR')}`;
    return `Jusqu'au ${new Date(dateTo).toLocaleDateString('fr-FR')}`;
  }, [dateFrom, dateTo]);

  // ── KPIs ──────────────────────────────────────────────────────
  const total    = ticketsFiltres.length;
  const resolus  = ticketsFiltres.filter(t =>
    t.status.name === 'Résolu' || t.status.name === 'Fermé').length;
  const tauxResolution = total ? Math.round((resolus / total) * 100) : 0;

  const slaBreached  = ticketsFiltres.filter(t => t.slaBreached).length;
  const slaRespected = ticketsFiltres.filter(t =>
    t.slaDeadline && !t.slaBreached && t.status?.finalStatus).length;
  const tauxSla = (slaBreached + slaRespected) > 0
    ? Math.round((slaRespected / (slaBreached + slaRespected)) * 100) : 0;
  const slaWarning = ticketsFiltres.filter(t => {
    if (!t.slaDeadline || t.slaBreached || t.status?.finalStatus) return false;
    const diffMs  = new Date(t.slaDeadline) - new Date();
    const totalMs = (t.priority?.slaHours || 1) * 3600000;
    return diffMs > 0 && (1 - diffMs / totalMs) >= 0.8;
  }).length;

  const tempsMoyen = useMemo(() => {
    const resolved = ticketsFiltres.filter(t =>
      (t.status.name === 'Résolu' || t.status.name === 'Fermé') && t.updatedAt && t.createdAt);
    if (!resolved.length) return '—';
    const sum = resolved.reduce((acc, t) =>
      acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0);
    return formatDuration(sum / resolved.length);
  }, [ticketsFiltres]);

  const kpis = [
    { icon: FileText,   label: 'Total tickets',         value: total,            sub: `${activeShortcut}`,                    color: '#3b82f6', bg: '#eff6ff' },
    { icon: CheckCircle,label: 'Taux de résolution',    value: `${tauxResolution}%`, sub: `${resolus} résolus`,              color: '#10b981', bg: '#f0fdf4' },
    { icon: Clock,      label: 'Temps moyen résolution',value: tempsMoyen,        sub: 'par ticket résolu',                   color: '#f59e0b', bg: '#fffbeb' },
    { icon: slaBreached > 0 ? ShieldAlert : AlertTriangle,
                        label: 'SLA dépassés',          value: slaBreached,       sub: `${slaWarning} à risque · taux ${tauxSla}%`,
      color: slaBreached > 0 ? '#E31E24' : '#f59e0b',
      bg:    slaBreached > 0 ? '#fff1f1' : '#fffbeb' },
  ];

  // ── Tickets par période (graphique) ───────────────────────────
  const ticketsParPeriode = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => {
      const date = new Date(t.createdAt);
      let key;
      if (period === 'jour') {
        key = date.toLocaleDateString('fr-FR');
      } else if (period === 'semaine') {
        const s = new Date(date);
        s.setDate(date.getDate() - date.getDay());
        key = `Sem. ${s.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
      } else {
        key = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, tickets]) => ({ name, tickets })).slice(-12);
  }, [ticketsFiltres, period]);

  // ── Tendance temps moyen de résolution dans le temps ──────────
  const tendanceResolution = useMemo(() => {
    const map = {};
    ticketsFiltres
      .filter(t => (t.status.name === 'Résolu' || t.status.name === 'Fermé') && t.updatedAt)
      .forEach(t => {
        const date = new Date(t.createdAt);
        const key  = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (!map[key]) map[key] = { total: 0, count: 0 };
        map[key].total += (new Date(t.updatedAt) - new Date(t.createdAt)) / 3600000;
        map[key].count++;
      });
    return Object.entries(map)
      .map(([name, d]) => ({ name, heures: Math.round(d.total / d.count) }))
      .slice(-8);
  }, [ticketsFiltres]);

  // ── Répartitions ──────────────────────────────────────────────
  const parCategorie = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => { const n = t.category?.name || 'Autre'; map[n] = (map[n] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ticketsFiltres]);

  const parPriorite = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => { const n = t.priority?.name || 'Autre'; map[n] = (map[n] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ticketsFiltres]);

  const parStatut = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => { const n = t.status?.name || 'Autre'; map[n] = (map[n] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ticketsFiltres]);

  // ── SLA par priorité ──────────────────────────────────────────
  const slaParPriorite = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => {
      if (!t.slaDeadline) return;
      const name = t.priority?.name || 'Autre';
      if (!map[name]) map[name] = { total: 0, breached: 0, respected: 0 };
      map[name].total++;
      if (t.slaBreached) map[name].breached++;
      else if (t.status?.finalStatus) map[name].respected++;
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      dépassés:  d.breached,
      respectés: d.respected,
      enCours:   d.total - d.breached - d.respected,
    }));
  }, [ticketsFiltres]);

  // ── Charge par technicien ─────────────────────────────────────
  const parTechnicien = useMemo(() => {
    const map = {};
    ticketsFiltres.forEach(t => {
      if (!t.assignedTo) return;
      const name = `${t.assignedTo.firstName} ${t.assignedTo.lastName}`;
      if (!map[name]) map[name] = {
        assignes: 0, resolus: 0, slaBreached: 0,
        escalades: 0, dureeTotal: 0, dureeCount: 0,
        slaRespected: 0, slaTotal: 0,
      };
      map[name].assignes++;
      if (t.status.name === 'Résolu' || t.status.name === 'Fermé') {
        map[name].resolus++;
        if (t.updatedAt && t.createdAt) {
          map[name].dureeTotal += new Date(t.updatedAt) - new Date(t.createdAt);
          map[name].dureeCount++;
        }
      }
      if (t.slaBreached) map[name].slaBreached++;
      if (t.escaladeCount > 0 || (t.slaBreached && t.assignedTo)) {
        map[name].escalades += (t.escaladeCount || 0);
      }
      if (t.slaDeadline) {
        map[name].slaTotal++;
        if (!t.slaBreached && t.status?.finalStatus) map[name].slaRespected++;
      }
    });
    return Object.entries(map).map(([name, d]) => ({
      name,
      assignes:    d.assignes,
      resolus:     d.resolus,
      slaBreached: d.slaBreached,
      escalades:   d.escalades,
      tempsMoyen:  d.dureeCount > 0 ? formatDuration(d.dureeTotal / d.dureeCount) : '—',
      tauxSla:     d.slaTotal > 0 ? Math.round((d.slaRespected / d.slaTotal) * 100) : 100,
      taux:        d.assignes > 0 ? Math.round((d.resolus / d.assignes) * 100) : 0,
    }));
  }, [ticketsFiltres]);

  // ── Handlers export ───────────────────────────────────────────
  const handleExportPdf = () => {
    const kpiForExport = kpis.map(k => ({ label: k.label, value: k.value }));
    exportPdf(ticketsFiltres, kpiForExport, parTechnicien,
      `Rapport HelpDesk — ${dateLabel}`);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const kpiForExport = kpis.map(k => ({ label: k.label, value: k.value }));
      exportExcel(ticketsFiltres, parTechnicien, kpiForExport, dateLabel);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
             style={{ borderColor: '#E31E24', borderTopColor: 'transparent' }} />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-sm text-gray-500 mt-1">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200
                       text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <FileDown className="w-4 h-4 text-green-600" />
            {exporting ? 'Export…' : 'Excel'}
          </button>
          {/* Bouton Export PDF */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 text-white
                       rounded-xl text-sm font-medium transition"
            style={{ backgroundColor: '#E31E24' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b81519'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E31E24'}>
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* ── Filtre par plage de dates ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-600 mr-1">Période :</span>

          {/* Raccourcis */}
          {PERIOD_SHORTCUTS.map(s => (
            <button key={s.label} onClick={() => applyShortcut(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{
                backgroundColor: activeShortcut === s.label ? '#E31E24' : '#f3f4f6',
                color: activeShortcut === s.label ? '#fff' : '#6b7280',
              }}>
              {s.label}
            </button>
          ))}

          {/* Bouton dates personnalisées */}
          <button
            onClick={() => setShowDatePicker(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
            <Calendar className="w-3.5 h-3.5" />
            Personnalisé
          </button>

          {/* Reset */}
          {(dateFrom || dateTo) && activeShortcut !== 'Tout' && (
            <button onClick={resetDates}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition">
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          )}

          {/* Compteur tickets filtrés */}
          <span className="ml-auto text-xs text-gray-400">
            {ticketsFiltres.length} ticket{ticketsFiltres.length !== 1 ? 's' : ''} affiché{ticketsFiltres.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Sélecteurs de dates custom */}
        {showDatePicker && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Du</label>
              <input type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setActiveShortcut('Personnalisé'); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                onFocus={e => e.target.style.borderColor = '#E31E24'}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">au</label>
              <input type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setActiveShortcut('Personnalisé'); }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                onFocus={e => e.target.style.borderColor = '#E31E24'}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <button onClick={() => setShowDatePicker(false)}
              className="text-xs text-gray-400 hover:text-gray-700">
              Fermer
            </button>
          </div>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ icon: Icon, label, value, sub, color, bg }, i) => (
          <div key={label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                       flex items-center gap-4 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              {/* ── Animated number (only change from first code) ── */}
              <p className="text-2xl font-bold text-gray-900">
                <AnimatedKpiValue value={value} delay={i * 100} />
              </p>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── SLA par priorité ── */}
      {slaParPriorite.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Performance SLA par priorité</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={slaParPriorite}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="respectés" stackId="a" fill="#10b981" name="Respectés" />
              <Bar dataKey="enCours"   stackId="a" fill="#3b82f6" name="En cours" />
              <Bar dataKey="dépassés"  stackId="a" fill="#E31E24" radius={[6,6,0,0]} name="Dépassés" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3 justify-center">
            {[{ color: '#10b981', label: 'Respectés' }, { color: '#3b82f6', label: 'En cours' }, { color: '#E31E24', label: 'Dépassés' }]
              .map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Évolution tickets + Tendance résolution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Évolution tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Évolution des tickets</h2>
            <div className="flex gap-1">
              {['jour', 'semaine', 'mois'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition"
                  style={{
                    backgroundColor: period === p ? '#E31E24' : '#f3f4f6',
                    color: period === p ? '#fff' : '#6b7280',
                  }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ticketsParPeriode}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tickets" stroke="#E31E24"
                    strokeWidth={2} dot={{ fill: '#E31E24', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tendance temps de résolution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Tendance temps de résolution
          </h2>
          <p className="text-xs text-gray-400 mb-4">Temps moyen en heures par mois</p>
          {tendanceResolution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
              Pas encore de données
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tendanceResolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="h" />
                <Tooltip formatter={(v) => [`${v}h`, 'Tps moyen']} />
                <Line type="monotone" dataKey="heures" stroke="#10b981"
                      strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Catégorie + Priorité ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Par catégorie</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={parCategorie} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={80}
                   label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {parCategorie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Par priorité</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parPriorite} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {parPriorite.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] || COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Par statut ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Par statut</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={parStatut}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {parStatut.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Charge par technicien ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Charge par technicien</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Inclut : escalades, temps moyen de résolution, taux SLA
            </p>
          </div>
        </div>
        {parTechnicien.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun ticket assigné</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '860px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                  {[
                    'TECHNICIEN', 'ASSIGNÉS', 'RÉSOLUS',
                    'SLA DÉPASSÉS', 'ESCALADES',
                    'TPS MOYEN',
                    'TAUX SLA',
                    'TAUX RÉSOLUTION',
                  ].map(h => (
                    <th key={h}
                        className="py-3 px-3 text-xs font-semibold text-gray-500 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parTechnicien.map((tech, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition"
                      style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {/* Nom */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center
                                        text-white text-xs font-bold flex-shrink-0"
                             style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {tech.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{tech.name}</span>
                      </div>
                    </td>
                    {/* Assignés */}
                    <td className="py-3 px-3 font-semibold text-gray-700">{tech.assignes}</td>
                    {/* Résolus */}
                    <td className="py-3 px-3 font-semibold text-green-600">{tech.resolus}</td>
                    {/* SLA dépassés */}
                    <td className="py-3 px-3">
                      {tech.slaBreached > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          {tech.slaBreached}
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-semibold">✓ 0</span>
                      )}
                    </td>
                    {/* Escalades */}
                    <td className="py-3 px-3">
                      {tech.escalades > 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                          {tech.escalades}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    {/* Temps moyen */}
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {tech.tempsMoyen}
                      </span>
                    </td>
                    {/* Taux SLA */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full"
                               style={{
                                 width: `${tech.tauxSla}%`,
                                 backgroundColor: tech.tauxSla >= 80 ? '#10b981'
                                   : tech.tauxSla >= 50 ? '#f59e0b' : '#E31E24',
                               }} />
                        </div>
                        <span className="text-xs font-semibold"
                              style={{
                                color: tech.tauxSla >= 80 ? '#10b981'
                                  : tech.tauxSla >= 50 ? '#f59e0b' : '#E31E24',
                              }}>
                          {tech.tauxSla}%
                        </span>
                        {tech.tauxSla >= 80
                          ? <TrendingUp className="w-3 h-3 text-green-500" />
                          : <TrendingDown className="w-3 h-3" style={{ color: '#E31E24' }} />}
                      </div>
                    </td>
                    {/* Taux résolution */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2" style={{ minWidth: 60 }}>
                          <div className="h-2 rounded-full transition-all"
                               style={{
                                 width: `${tech.taux}%`,
                                 backgroundColor: tech.taux >= 70 ? '#10b981'
                                   : tech.taux >= 40 ? '#f59e0b' : '#E31E24',
                               }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-10">
                          {tech.taux}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </AdminLayout>
  );
}
