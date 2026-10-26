import type { ReactNode } from "react";

/** A full screen panel that faces the bottom seat. It has a title and a "Close" button. */
export function Screen({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label={title}>
      <h2 className="screen-title">{title}</h2>
      <div className="screen-body">{children}</div>
      <button type="button" className="action-button screen-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
