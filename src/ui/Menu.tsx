import { Screen } from "./Screen";

/** The menu. "New game" asks first and calls `onNewGame` only after a yes. */
export function Menu({ onNewGame, onClose }: { onNewGame: () => void; onClose: () => void }) {
  const newGame = () => {
    if (window.confirm("Start a new game?")) onNewGame();
  };
  return (
    <Screen title="Menu" onClose={onClose}>
      <button type="button" className="action-button menu-button" onClick={newGame}>
        New game
      </button>
    </Screen>
  );
}
