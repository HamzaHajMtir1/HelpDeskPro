// components/chatbot/ChatbotModal.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useChatbot } from "../../hooks/useChatbot";
import KbResultCard from "./KbResultCard";
import TicketDraftCard from "./TicketDraftCard";

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function FormatMessage({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} style={{
        margin: "4px 0",
        paddingLeft: 0,
        listStyle: "none",
      }}>
        {listItems.map((item, i) => (
          <li key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "4px",
            fontSize: "13px",
            lineHeight: 1.5,
          }}>
            <span style={{
              marginTop: "7px",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "#dc2626",
              flexShrink: 0,
            }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listItems.push(trimmed.replace(/^[-•]\s+/, ""));
    } else {
      flushList();
      if (trimmed !== "") {
        elements.push(
          <span key={i} style={{ display: "block", marginBottom: "3px" }}>
            {trimmed}
          </span>
        );
      } else if (elements.length > 0) {
        elements.push(<br key={`br-${i}`} />);
      }
    }
  });
  flushList();

  return <>{elements}</>;
}

export default function ChatbotModal({ onClose }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  const token = localStorage.getItem("token")
    || localStorage.getItem("accessToken")
    || localStorage.getItem("jwt");

  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  const decoded = token ? decodeJWT(token) : null;
  const userId    = decoded?.id ?? decoded?.userId ?? decoded?.sub ?? null;
  const userEmail = decoded?.sub ?? null;

  const {
    messages, phase, kbResults, draft,
    loading, ticketCreated,
    notUsefulIds,
    reset,
    sendMessage,
    kbSolved, kbNotUsefulOne,
    confirmTicket, cancelDraft,
  } = useChatbot(userId, userEmail);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, kbResults, draft, loading]);

  const handleChange = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isInputDisabled) return;
    sendMessage(trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "42px";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ FIX : on bloque l'input sur kbResults OU phase DONE
  // draft est maintenant rendu inline dans messages → plus besoin de bloquer sur !!draft
  const isInputDisabled = loading || kbResults.length > 0 || phase === "DONE";

  return (
    <div style={{
      position: "fixed",
      bottom: "90px",
      right: "24px",
      width: "400px",
      maxHeight: "620px",
      background: "#111",
      borderRadius: "20px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      border: "1px solid #222",
    }}>

      {/* HEADER */}
      <div style={{
        background: "#1a1a1a",
        borderBottom: "1px solid #222",
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "17px",
            flexShrink: 0,
          }}>
            🤖
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>
              Assistant HelpDesk
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#22c55e", display: "inline-block",
              }} />
              En ligne
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "#222", border: "1px solid #333",
          color: "#9ca3af", fontSize: "14px",
          width: "30px", height: "30px", borderRadius: "8px",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          ✕
        </button>
      </div>

      {/* MESSAGES */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "16px",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>
        {messages.map((msg, i) => {

          // ✅ Rendu inline de la carte draft dans le flux de messages
          if (msg.role === "draft") {
            return (
              <div key={i} style={{ width: "100%", alignSelf: "flex-start" }}>
                <div style={{
                  fontSize: "10px", color: "#4b5563",
                  marginBottom: "4px", paddingLeft: "4px",
                }}>
                  Agent
                </div>
                <TicketDraftCard
                  draft={msg.content}
                  onConfirm={confirmTicket}
                  onCancel={cancelDraft}
                />
              </div>
            );
          }

          return (
            <div key={i} style={{
              maxWidth: "88%",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  fontSize: "10px", color: "#4b5563",
                  marginBottom: "4px", paddingLeft: "4px",
                }}>
                  Agent
                </div>
              )}
              <div style={{
                background: msg.role === "user" ? "#dc2626" : "#1c1c1c",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: msg.role === "user"
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                fontSize: "13px",
                lineHeight: 1.6,
                border: msg.role === "user" ? "none" : "1px solid #2a2a2a",
              }}>
                {msg.role === "assistant"
                  ? <FormatMessage content={msg.content} />
                  : msg.content
                }
              </div>
            </div>
          );
        })}

        {/* Indicateur de frappe */}
        {loading && (
          <div style={{
            alignSelf: "flex-start", display: "flex", gap: "4px",
            padding: "12px 16px", background: "#1c1c1c",
            borderRadius: "16px 16px 16px 4px", border: "1px solid #2a2a2a",
          }}>
            {[0, 1, 2].map(n => (
              <span key={n} style={{
                width: "6px", height: "6px", background: "#4b5563",
                borderRadius: "50%", display: "inline-block",
                animation: `blink 1.2s ${n * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}

        {/* Résultats KB */}
        {kbResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div style={{ fontSize: "11px", color: "#4b5563", paddingLeft: "4px" }}>
              Solutions trouvées ({kbResults.length})
            </div>
            {kbResults.map((r, i) => (
              <KbResultCard
                key={r.articleId || i}
                result={r}
                isNotUseful={notUsefulIds.has(r.articleId)}
                onSolved={() => kbSolved(r.articleId)}
                onNotSolved={() => kbNotUsefulOne(r.articleId)}
              />
            ))}
            {notUsefulIds.size > 0 && notUsefulIds.size < kbResults.length && (
              <div style={{
                fontSize: "11px", color: "#6b7280", textAlign: "center",
                padding: "4px", background: "#1a1a1a", borderRadius: "8px",
                border: "1px solid #2a2a2a",
              }}>
                {notUsefulIds.size}/{kbResults.length} articles marqués comme non utiles
                — marquez tous pour créer un ticket
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={{
        padding: "12px",
        background: "#0d0d0d",
        borderTop: "1px solid #1f1f1f",
        display: "flex",
        gap: "8px",
        alignItems: "flex-end",
        flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            isInputDisabled
              ? "En attente de votre choix…"
              : "Décrivez votre problème… (Entrée pour envoyer)"
          }
          disabled={isInputDisabled}
          style={{
            flex: 1,
            resize: "none",
            overflow: "hidden",
            border: "1px solid #2a2a2a",
            borderRadius: "12px",
            padding: "10px 12px",
            fontSize: "13px",
            background: isInputDisabled ? "#0d0d0d" : "#1a1a1a",
            color: isInputDisabled ? "#4b5563" : "#fff",
            outline: "none",
            minHeight: "42px",
            maxHeight: "120px",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isInputDisabled}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: !input.trim() || isInputDisabled ? "#1f1f1f" : "#dc2626",
            color: !input.trim() || isInputDisabled ? "#4b5563" : "#fff",
            border: "1px solid " + (!input.trim() || isInputDisabled ? "#2a2a2a" : "#dc2626"),
            cursor: !input.trim() || isInputDisabled ? "not-allowed" : "pointer",
            fontSize: "16px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}