import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const node = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative w-[min(95vw,640px)] rounded-2xl border border-secondary/40 bg-background shadow-xl p-4">
        {title && (
          <h3 className="text-lg font-semibold text-base-fg mb-3">{title}</h3>
        )}
        <div className="text-base-fg">{children}</div>
        {actions && (
          <div className="mt-4 flex text-base-fg justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
  // Render into body to avoid clipping/stacking from parents
  if (typeof document !== "undefined" && document.body) {
    return createPortal(node, document.body);
  }
  return node;
}
