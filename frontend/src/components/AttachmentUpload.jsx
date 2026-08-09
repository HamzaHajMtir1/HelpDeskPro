import { useState, useRef } from "react";
 
const API_BASE = "/ai";
 
export default function AttachmentUpload({ incidentId, onAnalysisReady }) {
  const [uploading, setUploading] = useState(false);
  const [analyses, setAnalyses]   = useState([]);
  const fileRef = useRef(null);
 
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
 
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("incident_id", incidentId);
 
      try {
        const resp = await fetch(`${API_BASE}/agent2/chat/upload`, {
          method: "POST",
          body:   formData,
        });
        const data = await resp.json();
 
        if (data.success) {
          const newAnalysis = {
            filename: data.filename,
            preview:  data.preview,
            analysis: data.analysis,
          };
          setAnalyses((prev) => [...prev, newAnalysis]);
          // Notifier le composant parent que l'analyse est prête
          onAnalysisReady?.(newAnalysis);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setUploading(false);
  };
 
  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
 
  return (
    <div className="attachment-upload">
      {/* Zone drag & drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border:        "2px dashed #4a9eff",
          borderRadius:  "8px",
          padding:       "12px",
          textAlign:     "center",
          cursor:        "pointer",
          background:    "#1a2744",
          marginBottom:  "8px",
          fontSize:      "13px",
          color:         "#8bb8f0",
        }}
      >
        {uploading ? (
          <span>⏳ Analyse en cours...</span>
        ) : (
          <span>📎 Glisser-déposer ou cliquer pour joindre un fichier<br/>
            <small>(screenshot, PDF, log, DOCX, Excel)</small>
          </span>
        )}
      </div>
 
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.log,.txt,.csv"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
 
      {/* Affichage des analyses */}
      {analyses.map((a, i) => (
        <div
          key={i}
          style={{
            background:   "#0f1f3d",
            border:       "1px solid #2a4a80",
            borderRadius: "6px",
            padding:      "8px 12px",
            marginBottom: "6px",
            fontSize:     "12px",
          }}
        >
          <div style={{ color: "#4a9eff", marginBottom: "4px" }}>
            📄 {a.filename}
          </div>
          <div style={{ color: "#c8d8f0" }}>{a.preview}</div>
        </div>
      ))}
    </div>
  );
}
