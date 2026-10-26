import { Screen } from "./Screen";

interface MenuProps {
  onNewGame: () => void;
  onTutorial: () => void;
  onClose: () => void;
}

/** The menu. "New game" asks first and calls `onNewGame` only after a yes. */
export function Menu({ onNewGame, onTutorial, onClose }: MenuProps) {
  const newGame = () => {
    if (window.confirm("Start a new game?")) onNewGame();
  };
  return (
    <Screen title="Menu" onClose={onClose}>
      <button type="button" className="action-button menu-button" onClick={newGame}>
        New game
      </button>
      <button type="button" className="action-button menu-button" onClick={onTutorial}>
        Tutorial
      </button>
    </Screen>
  );
}
