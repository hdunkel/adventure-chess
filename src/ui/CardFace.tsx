import type { Card, Keep } from "../game/types";
import { PieceIcon } from "./PieceIcon";

const keepLabels: Record<Keep, string | null> = {
  immediate: null,
  untilUsed: "Keep until used",
  permanent: "Keep this card",
};

/**
 * The face of a card. "mini" shows the silhouette and the name (it can go in a button).
 * "big" also shows the keep label and the effect text. The text area scrolls.
 */
export function CardFace({ card, size }: { card: Card; size: "mini" | "big" }) {
  if (size === "mini") {
    return (
      <span className="card card-mini">
        <PieceIcon piece={card.piece} className="card-icon" />
        <span className="card-name">{card.name}</span>
      </span>
    );
  }
  const keep = keepLabels[card.keep];
  return (
    <div className="card card-big">
      <h2 className="card-name">{card.name}</h2>
      <PieceIcon piece={card.piece} className="card-icon" />
      {keep && <div className="card-keep">{keep}</div>}
      <div className="card-text">{card.effect}</div>
    </div>
  );
}
