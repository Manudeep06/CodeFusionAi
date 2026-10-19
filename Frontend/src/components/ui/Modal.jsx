import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Controlled modal built on <dialog>: focus trap, Esc and backdrop close for free. */
export default function Modal({ open, onClose, title, description, children, footer, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={`cf-dialog ${className}`} onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="cf-dialog-body">
          <div className="cf-dialog-head">
            <div>
              <h2>{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button type="button" className="app-icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
          {children}
          {footer && <div className="cf-dialog-actions">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
