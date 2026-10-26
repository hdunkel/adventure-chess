import type { ReactNode } from "react";
import type { Card, Color, Seat } from "../game/types";
import { CardFace } from "./CardFace";

export interface OverlayAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface CardOverlayProps {
  card: Card;
  /** The owner of the card. The view turns 180° for the top seat. */
  seat: Seat;
  /** The color of the owner. It sets the background: light for White, dark for Black. */
  color: Color;
  /** The text above the card, for example "White drew". */
  label: string;
  actions: OverlayAction[];
  /** Optional content on the half of the opponent, turned to the opponent. */
  other?: ReactNode;
  /** Optional short text below the label, for example "Black decides". */
  note?: string;
  /** If given, the card view shows "Undo" next to the buttons. */
  onUndo?: () => void;
  canUndo?: boolean;
}

/** The big card. It covers the screen. The buttons stay below the text area. */
export function CardOverlay(props: CardOverlayProps) {
  const { card, seat, color, label, actions, other, note, onUndo, canUndo = false } = props;
  const turned = seat === "top" ? " turned" : "";
  const otherColor: Color = color === "white" ? "black" : "white";
  return (
    <div
      className={`overlay overlay-${color}${turned}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {other && <div className={`overlay-other overlay-${otherColor} turned`}>{other}</div>}
      <div className="overlay-own">
        <div className="overlay-label">{label}</div>
        {note && <p className="overlay-note">{note}</p>}
        <div className="big-wrap">
          <CardFace card={card} size="big" />
          {(actions.length > 0 || onUndo) && (
            <div className="card-actions">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="action-button"
                  disabled={a.disabled}
                  onClick={a.onClick}
                >
                  {a.label}
                </button>
              ))}
              {onUndo && (
                <button
                  type="button"
                  className="action-button undo-button"
                  disabled={!canUndo}
                  onClick={onUndo}
                >
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
