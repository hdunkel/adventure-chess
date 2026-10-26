import { Screen } from "./Screen";

/** The short rules: the draw rule, the three card types, and the credit for the silhouettes. */
export function RulesScreen({ onClose }: { onClose: () => void }) {
  return (
    <Screen title="Rules" onClose={onClose}>
      <h3 className="screen-heading">Draw rule</h3>
      <p className="screen-text">
        After the first capture of a piece that is not a pawn, each capture causes a draw. The player
        who lost the piece draws the card. A player in check (also in checkmate) can draw a card
        instead of a different solution.
      </p>
      <h3 className="screen-heading">Card types</h3>
      <ul className="screen-list">
        <li>No keep text: apply the effect now.</li>
        <li>Keep until used: keep the card, use it one time.</li>
        <li>Keep this card: the effect continues while you have the card.</li>
      </ul>
      <h3 className="screen-heading">Credit</h3>
      <p className="screen-text">Chess pieces: Colin M.L. Burnett, CC BY-SA 3.0, via Wikimedia Commons.</p>
    </Screen>
  );
}
