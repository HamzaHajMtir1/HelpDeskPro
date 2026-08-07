import { useState, useCallback } from "react";
import axios from "axios";

const API = "https://helpdesk.4d-gile.com/api/chatbot";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Bonjour !  Je suis votre assistant HelpDesk.\n\n" +
    "Décrivez-moi votre problème et je vais chercher une solution " +
    "dans notre base de connaissances avant de créer un ticket.",
};

export function useChatbot(userId, userEmail) {
  const [messages,      setMessages]      = useState([WELCOME_MESSAGE]);
  const [phase,         setPhase]         = useState("DISCOVERY");
  const [kbResults,     setKbResults]     = useState([]);
  const [draft,         setDraft]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [ticketCreated, setTicketCreated] = useState(null);
  const [notUsefulIds,  setNotUsefulIds]  = useState(new Set());

  const addMessage = useCallback((role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  }, []);

  const reset = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setPhase("DISCOVERY");
    setKbResults([]);
    setDraft(null);
    setLoading(false);
    setTicketCreated(null);
    setNotUsefulIds(new Set());
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].filter(
        m => m.content !== WELCOME_MESSAGE.content
      );

      const res = await axios.post(`${API}/message`, {
        messages: history,
        userId,
        userEmail,
        phase,
      });

      const data = res.data;
      console.log("📨 Backend response (phase:", data.phase, "):", data);

      setPhase(data.phase);

      if (data.phase === "KB_FOUND" && data.kbResults?.length) {
        setKbResults(data.kbResults);
        setNotUsefulIds(new Set());
        addMessage("assistant", data.reply);

      } else if (data.phase === "TICKET_READY") {
        if (data.draft) {
          setDraft(data.draft);
          // 1️⃣ Ajoute le message texte de confirmation
          if (data.reply) addMessage("assistant", data.reply);
          // 2️⃣ Ajoute un message spécial "draft" pour rendre la carte inline
          setMessages(prev => [...prev, { role: "draft", content: data.draft }]);
        } else {
          console.warn("⚠️ TICKET_READY reçu mais draft est null.", data);
          setPhase("COLLECT_INFO");
          addMessage(
            "assistant",
            "Je n'ai pas pu générer le récapitulatif. " +
            "Pourriez-vous me redonner la catégorie, la priorité et le type " +
            "séparément ? Par exemple :\n" +
            "- Catégorie : Logiciel\n" +
            "- Priorité : Haute\n" +
            "- Type : Incident"
          );
        }
      } else {
        addMessage("assistant", data.reply);
        if (data.phase !== "KB_FOUND") setKbResults([]);
      }

    } catch (err) {
      console.error("❌ ERREUR AXIOS:", err);
      addMessage(
        "assistant",
        `❌ Erreur: ${err.response?.status ? `HTTP ${err.response.status}` : err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, [messages, phase, userId, userEmail, loading, addMessage]);

  const kbSolved = useCallback(async (articleId) => {
    try { await axios.post(`${API}/kb-helpful`, { articleId }); } catch {}
    setKbResults([]);
    setNotUsefulIds(new Set());
    setPhase("DONE");
    addMessage("assistant",
      "Parfait ! Je suis ravi d'avoir pu vous aider. \n" +
      "N'hésitez pas à revenir si vous avez d'autres questions."
    );
  }, [addMessage]);

  const kbNotUsefulOne = useCallback(async (articleId) => {
    const updated = new Set(notUsefulIds);
    updated.add(articleId);
    setNotUsefulIds(updated);

    try { await axios.post(`${API}/kb-not-helpful`, { articleId }); } catch {}

    if (updated.size >= kbResults.length) {
      setKbResults([]);
      setNotUsefulIds(new Set());
      setLoading(true);

      try {
        const history = [...messages, {
          role: "user",
          content: "Aucune de ces solutions ne résout mon problème.",
        }].filter(m => m.content !== WELCOME_MESSAGE.content);

        addMessage("user", "Aucune de ces solutions ne résout mon problème.");

        const res = await axios.post(`${API}/message`, {
          messages: history,
          userId,
          userEmail,
          phase: "COLLECT_INFO",
        });
        setPhase(res.data.phase);
        addMessage("assistant", res.data.reply);
      } catch {
        addMessage("assistant", "❌ Erreur. Réessayez.");
      } finally {
        setLoading(false);
      }
    }
  }, [notUsefulIds, kbResults, messages, userId, userEmail, addMessage]);

  const confirmTicket = useCallback(async () => {
    if (!draft) {
      addMessage("assistant", "❌ Aucun ticket à confirmer. Veuillez recommencer.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/confirm`, { draft, userId, userEmail });
      setTicketCreated(res.data);
      setDraft(null);
      setPhase("DONE");
      // Retire la carte draft des messages
      setMessages(prev => prev.filter(m => m.role !== "draft"));
      addMessage("assistant",
        ` Votre ticket #${res.data.ticketId} a été créé avec succès !\n` +
        "Un technicien va prendre en charge votre demande. " +
        "Vous recevrez des notifications par email."
      );
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        "Erreur inconnue";
      addMessage("assistant", `❌ Erreur lors de la création du ticket : ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [draft, userId, addMessage]);

  const cancelDraft = useCallback(() => {
    setDraft(null);
    setPhase("COLLECT_INFO");
    // Retire la carte draft des messages
    setMessages(prev => prev.filter(m => m.role !== "draft"));
    addMessage("assistant", "D'accord, qu'est-ce que vous souhaitez modifier ?");
  }, [addMessage]);

  return {
    messages, phase, kbResults, draft,
    loading, ticketCreated,
    notUsefulIds,
    reset,
    sendMessage,
    kbSolved,
    kbNotUsefulOne,
    confirmTicket,
    cancelDraft,
  };
}