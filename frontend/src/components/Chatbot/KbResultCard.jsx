// components/chatbot/KbResultCard.jsx
import { useState } from "react";

export default function KbResultCard({ result, onSolved, onNotSolved, isNotUseful }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: isNotUseful ? "#0f0f0f" : "#161616",
      border: "1px solid " + (open ? "#333" : isNotUseful ? "#1f1f1f" : "#252525"),
      borderRadius: "10px",
      overflow: "hidden",
      transition: "all .15s",
      opacity: isNotUseful ? 0.6 : 1,
    }}>

      {/* HEADER — toujours visible, clic pour toggle */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{
          flex: 1,
          color: isNotUseful ? "#6b7280" : "#e5e7eb",
          fontSize: "13px",
          fontWeight: 500,
          lineHeight: 1.3,
        }}>
          {result.titre}
        </span>

        <span style={{
          fontSize: "10px",
          background: "#1f1f1f",
          color: "#9ca3af",
          padding: "2px 7px",
          borderRadius: "5px",
          border: "1px solid #2a2a2a",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}>
          {result.category}
        </span>

        {isNotUseful && (
          <span style={{ fontSize: "10px", color: "#4b5563", flexShrink: 0 }}>✗ Non utile</span>
        )}

        <span style={{
          color: "#4b5563",
          fontSize: "11px",
          flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform .2s",
        }}>
          ▾
        </span>
      </div>

      {/* Indice fermé — masqué si déjà marqué inutile */}
      {!open && !isNotUseful && (
        <div style={{
          padding: "0 12px 8px",
          color: "#4b5563",
          fontSize: "11px",
        }}>
          Cliquez pour voir la solution →
        </div>
      )}

      {/* DÉTAIL */}
      {open && (
        <div style={{ borderTop: "1px solid #1f1f1f" }}>

          {/* Solution */}
          <div style={{
            padding: "10px 12px",
            color: "#d1d5db",
            fontSize: "12.5px",
            lineHeight: 1.65,
            background: "#0f0f0f",
          }}>
            {result.solution}
          </div>

          {/* Actions */}
          <div style={{
            padding: "8px 12px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            borderTop: "1px solid #1f1f1f",
          }}>
            {!isNotUseful ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onSolved(); }}
                  style={{
                    flex: 1,
                    background: "#14532d",
                    border: "1px solid #166534",
                    borderRadius: "7px",
                    padding: "6px 10px",
                    color: "#86efac",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  <span>✓</span> Problème résolu
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onNotSolved(); }}
                  style={{
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                    borderRadius: "7px",
                    padding: "6px 10px",
                    color: "#6b7280",
                    fontSize: "11px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Pas utile
                </button>
              </>
            ) : (
              <div style={{ fontSize: "11px", color: "#4b5563", padding: "4px 0" }}>
                ✗ Marqué comme non utile
              </div>
            )}
          </div>

          {/* Réduire — masqué si déjà marqué inutile */}
          {!isNotUseful && (
            <div
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              style={{
                padding: "5px 12px 8px",
                fontSize: "11px",
                color: "#4b5563",
                cursor: "pointer",
              }}
            >
              ← Réduire
            </div>
          )}
        </div>
      )}
    </div>
  );
}