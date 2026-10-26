import type { Card } from "../game/types";
import type { TourTarget } from "./tutorial";

interface MiddleStripProps {
  deckCount: number;
  last: Card | null;
  canUndo: boolean;
  onUndo: () => void;
  /** Open the discard list, the rules screen and the menu. */
  onLast?: () => void;
  onRules?: () => void;
  onMenu?: () => void;
  /** The part that the tutorial flashes, and true while the tutorial is open (no taps). */
  flash?: TourTarget;
  inert?: boolean;
}

export function MiddleStrip(props: MiddleStripProps) {
  const { deckCount, last, canUndo, onUndo, onLast, onRules, onMenu, flash, inert } = props;
  return (
    <nav className={`strip${flash === "strip" ? " tour-flash" : ""}`} inert={inert}>
      <span className="strip-deck">Deck {deckCount}</span>
      <button type="button" className={`strip-button strip-last${flash === "last" ? " tour-flash" : ""}`} onClick={onLast}>
        Last: {last ? last.name : "—"}
      </button>
      <button type="button" className="strip-button" disabled={!canUndo} onClick={onUndo}>
        Undo
      </button>
      <button type="button" className="strip-button" title="Rules" onClick={onRules}>
        ?
      </button>
      <button type="button" className="strip-button" title="Menu" onClick={onMenu}>
        ⋯
      </button>
    </nav>
  );
}
