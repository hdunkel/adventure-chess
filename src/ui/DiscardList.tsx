import type { Card, DiscardEntry } from "../game/types";
import { Screen } from "./Screen";

interface DiscardListProps {
  discard: DiscardEntry[];
  byId: Record<string, Card>;
  /** Gets the index of the entry in `discard`. */
  onOpen: (index: number) => void;
  onClose: () => void;
}

/** The discard pile, newest card first. Each row shows the name and the color of the drawer. */
export function DiscardList({ discard, byId, onOpen, onClose }: DiscardListProps) {
  const rows = discard.map((entry, index) => ({ entry, index })).reverse();
  return (
    <Screen title="Discard pile" onClose={onClose}>
      {rows.length === 0 && <p className="screen-text">No cards yet.</p>}
      <ul className="discard-list">
        {rows.map(({ entry, index }) => (
          <li key={index}>
            <button type="button" className="discard-row" onClick={() => onOpen(index)}>
              {byId[entry.cardId].name} · {entry.color === "white" ? "W" : "B"}
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
