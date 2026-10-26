import { useEffect, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";
import "./ui/app.css";
import { cards, cardsById } from "./data/cards";
import { opponent, reduce } from "./game/game";
import type { Action, Ctx } from "./game/game";
import { initialHistory, saveHistory } from "./game/storage";
import type { GameState, History, Seat } from "./game/types";
import { CardFace } from "./ui/CardFace";
import { CardOverlay } from "./ui/CardOverlay";
import type { OverlayAction } from "./ui/CardOverlay";
import { DiscardList } from "./ui/DiscardList";
import { Half } from "./ui/Half";
import type { HandKind } from "./ui/Half";
import { colorName } from "./ui/labels";
import { Menu } from "./ui/Menu";
import { MiddleStrip } from "./ui/MiddleStrip";
import { RulesScreen } from "./ui/RulesScreen";

interface OverlayModel {
  cardId: string;
  seat: Seat;
  actions: OverlayAction[];
  other?: ReactNode;
  /** Optional short text on the half of the owner, below the label. */
  note?: string;
}

/** The open screen. Only the UI uses it. The app does not save it. */
type View =
  | { kind: HandKind; seat: Seat; cardId: string }
  | { kind: "discard" }
  | { kind: "discardCard"; index: number }
  | { kind: "rules" }
  | { kind: "menu" };

/** Make the card view for the pending state, or null if no card is open. */
function overlayFor(g: GameState, send: (a: Action) => void): OverlayModel | null {
  const p = g.pending;
  if (p === null) return null;

  if (p.kind === "extortion") {
    const card = cardsById[p.cardId];
    const other = (
      <div className="other-panel other-card">
        <p className="other-text">Take {card.name}?</p>
        <CardFace card={card} size="big" />
        <div className="other-buttons">
          <button type="button" className="action-button" onClick={() => send({ type: "extortion", take: true })}>
            Yes
          </button>
          <button type="button" className="action-button" onClick={() => send({ type: "extortion", take: false })}>
            No
          </button>
        </div>
      </div>
    );
    const note = `${colorName(g.colors[p.holder])} decides`;
    return { cardId: p.cardId, seat: p.drawer, actions: [], other, note };
  }

  const card = cardsById[p.cardId];
  const victimHand = g.hands[opponent(p.seat)];
  if (card.flow === "stealKept" && victimHand.length > 0) {
    const other = (
      <div className="other-panel">
        <p className="other-text">Hand one card to {colorName(g.colors[p.seat])}</p>
        <div className="hand-row">
          {victimHand.map((id, i) => (
            <button
              key={`${id}-${i}`}
              type="button"
              className="mini-button"
              onClick={() => send({ type: "steal", cardId: id })}
            >
              <CardFace card={cardsById[id]} size="mini" />
            </button>
          ))}
        </div>
      </div>
    );
    return { cardId: p.cardId, seat: p.seat, actions: [], other };
  }

  const actions: OverlayAction[] = [];
  if (card.flow === "royalDecree") {
    actions.push({
      label: "Remove a Pawn and draw",
      onClick: () => send({ type: "royalDraw" }),
      disabled: g.deck.length === 0,
    });
  }
  if (card.reminder) {
    actions.push({ label: "Remind", onClick: () => send({ type: "remind" }) });
  } else if (card.keep === "immediate") {
    actions.push({ label: "Done", onClick: () => send({ type: "done" }) });
  } else {
    actions.push({ label: "To hand", onClick: () => send({ type: "toHand" }) });
  }
  return { cardId: p.cardId, seat: p.seat, actions };
}

/** Make the card view for a hand card or a reminder card. */
function handOverlayFor(
  g: GameState,
  view: { kind: HandKind; seat: Seat; cardId: string },
  send: (a: Action) => void,
  close: () => void,
): (OverlayModel & { label: string }) | null {
  const { kind, seat, cardId } = view;
  const list = kind === "hand" ? g.hands[seat] : g.reminders[seat];
  if (!list.includes(cardId)) return null;
  const sendAndClose = (a: Action) => () => {
    send(a);
    close();
  };
  const actions: OverlayAction[] = [];
  if (kind === "reminder") {
    actions.push({ label: "Done", onClick: sendAndClose({ type: "clearReminder", seat, cardId }) });
  } else if (cardsById[cardId].keep === "untilUsed") {
    actions.push({ label: "Use", onClick: sendAndClose({ type: "use", seat, cardId }) });
  }
  actions.push({ label: "Close", onClick: close });
  const label = `${colorName(g.colors[seat])} · ${kind === "reminder" ? "Reminder" : "Hand"}`;
  return { cardId, seat, actions, label };
}

function App({ rng = Math.random }: { rng?: () => number }) {
  const ctx = useMemo<Ctx>(() => ({ cards, byId: cardsById, rng }), [rng]);
  const [history, send] = useReducer(
    (h: History, action: Action) => reduce(h, action, ctx),
    ctx,
    initialHistory,
  );

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const g = history.game;
  const deckEmpty = g.deck.length === 0;
  const lastEntry = g.discard.at(-1);
  const [view, setView] = useState<View | null>(null);
  const close = () => setView(null);
  const overlay = overlayFor(g, send);
  const handOverlay =
    overlay === null && view !== null && (view.kind === "hand" || view.kind === "reminder")
      ? handOverlayFor(g, view, send, close)
      : null;
  const discardEntry = view?.kind === "discardCard" ? g.discard.at(view.index) : undefined;

  const half = (seat: Seat) => (
    <Half
      seat={seat}
      color={g.colors[seat]}
      hand={g.hands[seat].map((id) => cardsById[id])}
      reminders={g.reminders[seat].map((id) => cardsById[id])}
      deckEmpty={deckEmpty}
      onDraw={() => send({ type: "draw", seat })}
      onOpen={(cardId, kind) => setView({ kind, seat, cardId })}
    />
  );

  return (
    <div className="app">
      {half("top")}
      <MiddleStrip
        deckCount={g.deck.length}
        last={lastEntry ? cardsById[lastEntry.cardId] : null}
        canUndo={history.previous !== null}
        onUndo={() => send({ type: "undo" })}
        onLast={() => setView({ kind: "discard" })}
        onRules={() => setView({ kind: "rules" })}
        onMenu={() => setView({ kind: "menu" })}
      />
      {half("bottom")}
      {overlay && (
        <CardOverlay
          card={cardsById[overlay.cardId]}
          seat={overlay.seat}
          color={g.colors[overlay.seat]}
          label={`${colorName(g.colors[overlay.seat])} drew`}
          actions={overlay.actions}
          other={overlay.other}
          note={overlay.note}
          canUndo={history.previous !== null}
          onUndo={() => send({ type: "undo" })}
        />
      )}
      {handOverlay && (
        <CardOverlay
          card={cardsById[handOverlay.cardId]}
          seat={handOverlay.seat}
          color={g.colors[handOverlay.seat]}
          label={handOverlay.label}
          actions={handOverlay.actions}
        />
      )}
      {overlay === null && view?.kind === "discard" && (
        <DiscardList
          discard={g.discard}
          byId={cardsById}
          onOpen={(index) => setView({ kind: "discardCard", index })}
          onClose={close}
        />
      )}
      {overlay === null && discardEntry && (
        <CardOverlay
          card={cardsById[discardEntry.cardId]}
          seat="bottom"
          color={discardEntry.color}
          label={`${colorName(discardEntry.color)} drew`}
          actions={[{ label: "Close", onClick: () => setView({ kind: "discard" }) }]}
        />
      )}
      {overlay === null && view?.kind === "rules" && <RulesScreen onClose={close} />}
      {overlay === null && view?.kind === "menu" && (
        <Menu
          onNewGame={() => {
            send({ type: "newGame" });
            close();
          }}
          onClose={close}
        />
      )}
    </div>
  );
}

export default App;
