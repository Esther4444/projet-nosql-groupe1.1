import { useEffect } from "react";

/**
 * Modal générique avec overlay, fermeture par Échap et clic extérieur.
 * Props: open, onClose, title, children, footer, size ("" | "lg")
 */
export default function Modal({ open, onClose, title, children, footer, size = "" }) {
  // Fermeture par touche Échap
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`modal ${size === "lg" ? "modal-lg" : ""}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer"><span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
