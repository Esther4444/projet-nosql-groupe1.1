import { useEffect, useState, useCallback } from "react";

// ── Contexte Toast ────────────────────────────────────────────────────────────
let _addToast = null;

export function toast(msg, type = "info", duration = 4000) {
  if (_addToast) _addToast(msg, type, duration);
}

export function Toast() {
  const [items, setItems] = useState([]);

  _addToast = useCallback((msg, type, duration) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const remove = (id) => setItems((prev) => prev.filter((t) => t.id !== id));

  const icons = { succes: "✓", erreur: "✕", info: "ℹ" };

  return (
    <div className="toast-container">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icons[t.type] ?? "ℹ"}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
