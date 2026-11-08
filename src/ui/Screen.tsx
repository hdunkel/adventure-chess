import type { ReactNode } from "react";

interface ScreenProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional buttons before the close button, in the same row. */
  footer?: ReactNode;
  /** The text of the close button. The default is "Close". */
  closeLabel?: string;
}

/** A full screen panel that faces the bottom seat. It has a title and a "Close" button. */
export function Screen({ title, onClose, children, footer, closeLabel = "Close" }: ScreenProps) {
  const close = (
    <button type="button" className="action-button screen-close" onClick={onClose}>
      {closeLabel}
    </button>
  );
  return (
    <div className="screen" role="dialog" aria-modal="true" aria-label={title}>
      <h2 className="screen-title">{title}</h2>
      <div className="screen-body">{children}</div>
      {footer ? (
        <div className="screen-footer">
          {footer}
          {close}
        </div>
      ) : (
        close
      )}
    </div>
  );
}
