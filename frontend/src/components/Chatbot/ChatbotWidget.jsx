// components/chatbot/ChatbotWidget.jsx
import { useState, useEffect } from "react";
import ChatbotModal from "./ChatbotModal";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  // Affiche la bulle après 2s au chargement, une seule fois
  useEffect(() => {
    if (bubbleDismissed) return;
    const showTimer = setTimeout(() => setShowBubble(true), 2000);
    // Auto-masquage après 8s
    const hideTimer = setTimeout(() => setShowBubble(false), 10000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [bubbleDismissed]);

  const handleToggle = () => {
    setShowBubble(false);
    setBubbleDismissed(true);
    setOpen(o => !o);
  };

  const handleDismissBubble = (e) => {
    e.stopPropagation();
    setShowBubble(false);
    setBubbleDismissed(true);
  };

  return (
    <>
      {open && <ChatbotModal onClose={() => setOpen(false)} />}

      {/* BULLE DE NOTIFICATION */}
      {showBubble && !open && (
        <div
          style={{
            position: "fixed",
            bottom: "110px",
            right: "24px",
            background: "#fff",
            color: "#111",
            borderRadius: "16px",
            padding: "12px 16px",
            maxWidth: "240px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            zIndex: 1001,
            fontSize: "13px",
            lineHeight: 1.5,
            animation: "slideUp 0.3s ease",
            cursor: "pointer",
          }}
          onClick={handleToggle}
        >
          {/* Flèche vers le bas pointant sur l'icône */}
          <div style={{
            position: "absolute",
            bottom: "-8px",
            right: "28px",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid #fff",
          }} />

          {/* Bouton fermer la bulle */}
          <button
            onClick={handleDismissBubble}
            style={{
              position: "absolute",
              top: "6px",
              right: "8px",
              background: "none",
              border: "none",
              color: "#999",
              fontSize: "14px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "2px 4px",
            }}
          >
            ✕
          </button>

          <div style={{ paddingRight: "16px" }}>
            👋 <strong>Vous avez un problème ?</strong>
            <br />
            N'hésitez pas à me contacter, je suis là pour vous aider !
          </div>
        </div>
      )}

      {/* BOUTON PRINCIPAL */}
      <button
        onClick={handleToggle}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#dc2626,#7f1d1d)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "28px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 0 0 rgba(220,38,38,0.7)",
          animation: "pulse 2s infinite",
        }}
      >
        {open ? "✕" : "🤖"}

        {/* Badge rouge tant que la bulle n'a pas été vue */}
        {!open && !bubbleDismissed && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "14px",
            height: "14px",
            background: "#facc15",
            borderRadius: "50%",
            border: "2px solid #111",
            animation: "pulseBadge 1.5s infinite",
          }} />
        )}

        <style>{`
          @keyframes pulse {
            0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
            70%  { box-shadow: 0 0 0 20px rgba(220,38,38,0); }
            100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseBadge {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.3); }
          }
        `}</style>
      </button>
    </>
  );
}