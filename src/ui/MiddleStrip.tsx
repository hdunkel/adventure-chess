import type { Card } from "../game/types";

interface MiddleStripProps {
  deckCount: number;
  last: Card | null;
  canUndo: boolean;
  onUndo: () => void;
  /** Open the discard list, the rules screen and the menu. */
  onLast?: () => void;
  onRules?: () => void;
  onMenu?: () => void;
}

export function MiddleStrip(props: MiddleStripProps) {
  const { deckCount, last, canUndo, onUndo, onLast, onRules, onMenu } = props;
  return (
    <nav className="strip">
      <span className="strip-deck">Deck {deckCount}</span>
      <button type="button" className="strip-button strip-last" onClick={onLast}>
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
