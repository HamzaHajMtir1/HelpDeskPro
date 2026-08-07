// components/chatbot/TicketDraftCard.jsx

const PRIORITY_STYLES = {
  BASSE:    { color: "#86efac", bg: "#052e16", border: "#166534", label: "↓ Basse" },
  MOYENNE:  { color: "#fde68a", bg: "#1c1400", border: "#854d0e", label: "→ Moyenne" },
  HAUTE:    { color: "#fdba74", bg: "#1c0a00", border: "#9a3412", label: "↑ Haute" },
  CRITIQUE: { color: "#fca5a5", bg: "#1f0000", border: "#991b1b", label: "⚠ Critique" },
};

// Tolère les priorités en minuscule/majuscule mixtes venant du backend
function getPriorityStyle(priority) {
  if (!priority) return PRIORITY_STYLES.MOYENNE;
  return PRIORITY_STYLES[priority.toUpperCase()] || PRIORITY_STYLES.MOYENNE;
}

export default function TicketDraftCard({ draft, onConfirm, onCancel }) {
  const pStyle = getPriorityStyle(draft.priority);

  return (
    <div style={{
      background: "#161616",
      border: "1px solid #2a2a2a",
      borderRadius: "14px",
      overflow: "hidden",
      width: "100%",
    }}>

      {/* EN-TÊTE */}
      <div style={{
        padding: "11px 14px",
        borderBottom: "1px solid #1f1f1f",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <span style={{ fontSize: "16px" }}>🎫</span>
        <div>
          <div style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: 600 }}>
            Récapitulatif du ticket
          </div>
          <div style={{ fontSize: "11px", color: "#4b5563" }}>
            Vérifiez les informations avant de créer
          </div>
        </div>
      </div>

      {/* CHAMPS */}
      <div style={{ padding: "4px 14px 2px" }}>
        {[
          ["Titre",     draft.title],
          ["Catégorie", draft.category],
          ["Type",      draft.type],
        ].map(([label, value]) => (
          <div key={label} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #1f1f1f",
            gap: "12px",
          }}>
            <span style={{
              fontSize: "11px",
              color: "#4b5563",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}>
              {label}
            </span>
            <span style={{
              fontSize: "13px",
              color: "#e5e7eb",
              fontWeight: 500,
              textAlign: "right",
            }}>
              {value}
            </span>
          </div>
        ))}

        {/* Badge Priorité */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "7px 0",
          borderBottom: "1px solid #1f1f1f",
        }}>
          <span style={{
            fontSize: "11px",
            color: "#4b5563",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Priorité
          </span>
          <span style={{
            fontSize: "11px",
            fontWeight: 600,
            color: pStyle.color,
            background: pStyle.bg,
            border: `1px solid ${pStyle.border}`,
            padding: "3px 9px",
            borderRadius: "6px",
          }}>
            {pStyle.label}
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{
          fontSize: "11px",
          color: "#4b5563",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "6px",
        }}>
          Description
        </div>
        <div style={{
          background: "#0f0f0f",
          border: "1px solid #1f1f1f",
          borderRadius: "8px",
          padding: "10px 12px",
          color: "#9ca3af",
          fontSize: "12.5px",
          lineHeight: 1.6,
        }}>
          {draft.description}
        </div>
      </div>

      {/* BOUTONS */}
      <div style={{ padding: "0 14px 14px", display: "flex", gap: "8px" }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "9px",
            border: "1px solid #1d4ed8",
            background: "#1e3a8a",
            color: "#bfdbfe",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <span></span> Créer le ticket
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: "9px 14px",
            borderRadius: "9px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#6b7280",
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Modifier
        </button>
      </div>
    </div>
  );
}