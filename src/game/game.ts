import type { Card, GameState, History, Seat } from "./types";

export type Action =
  | { type: "draw"; seat: Seat }
  | { type: "done" } | { type: "toHand" } | { type: "remind" } | { type: "royalDraw" }
  | { type: "steal"; cardId: string }
  | { type: "extortion"; take: boolean }
  | { type: "use"; seat: Seat; cardId: string }
  | { type: "clearReminder"; seat: Seat; cardId: string }
  | { type: "newGame" }
  | { type: "undo" };

export interface Ctx { cards: Card[]; byId: Record<string, Card>; rng: () => number }

export function opponent(seat: Seat): Seat {
  return seat === "bottom" ? "top" : "bottom";
}

/** Fisher-Yates shuffle. Returns a new array. The input does not change. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Key of the card list: id:keep:flow:reminder for each card, joined by "|". */
export function cardsKey(cards: readonly Card[]): string {
  return cards
    .map((c) => `${c.id}:${c.keep}:${c.flow ?? ""}:${c.reminder ? "r" : ""}`)
    .join("|");
}

export function newGame(ctx: Ctx): GameState {
  return {
    deck: shuffle(ctx.cards.map((c) => c.id), ctx.rng),
    hands: { bottom: [], top: [] },
    reminders: { bottom: [], top: [] },
    discard: [],
    colors: { bottom: "white", top: "black" },
    pending: null,
  };
}

export function createHistory(ctx: Ctx): History {
  return { version: 1, cardsKey: cardsKey(ctx.cards), game: newGame(ctx), previous: null };
}

/** Seat draws the top card. With an empty deck, the game gets no pending state. */
function drawFor(game: GameState, seat: Seat, ctx: Ctx): GameState {
  if (game.deck.length === 0) return { ...game, pending: null };
  const [cardId, ...deck] = game.deck;
  const holder = opponent(seat);
  if (game.hands[holder].some((id) => ctx.byId[id]?.flow === "extortion")) {
    return { ...game, deck, pending: { kind: "extortion", cardId, drawer: seat, holder } };
  }
  return { ...game, deck, pending: { kind: "reveal", cardId, seat } };
}

/** Apply the flow of a card that was just discarded by done. */
function applyFlow(game: GameState, card: Card, seat: Seat, ctx: Ctx): GameState {
  switch (card.flow) {
    case "opponentDraws":
      return drawFor(game, opponent(seat), ctx);
    case "discardAllHands": {
      let next = game;
      for (const owner of ["bottom", "top"] as const) {
        for (const id of game.hands[owner]) next = discardCard(next, id, owner);
      }
      return { ...next, hands: { bottom: [], top: [] } };
    }
    case "swapColors":
      return { ...game, colors: { bottom: game.colors.top, top: game.colors.bottom } };
    default:
      return game;
  }
}

function discardCard(game: GameState, cardId: string, seat: Seat): GameState {
  return { ...game, discard: [...game.discard, { cardId, seat, color: game.colors[seat] }] };
}

function without(list: readonly string[], cardId: string): string[] {
  const i = list.indexOf(cardId);
  return i < 0 ? [...list] : [...list.slice(0, i), ...list.slice(i + 1)];
}

/**
 * Apply one action to the history.
 *
 * - An action that is not valid now returns the same `h` object. No change, no new snapshot.
 * - A valid action returns `{ ...h, game: next, previous: h.game }`.
 *   A chain (Red Herring, Royal Decree, Burglar, Extortion) is one action.
 * - `undo`: if `previous` is not null, return `{ ...h, game: previous, previous: null }`.
 *   Else return `h`.
 * - `newGame` is always valid. The next game comes from `newGame(ctx)`.
 */
export function reduce(h: History, action: Action, ctx: Ctx): History {
  const g = h.game;
  const step = (next: GameState): History => ({ ...h, game: next, previous: g });
  const p = g.pending;

  switch (action.type) {
    case "undo":
      return h.previous ? { ...h, game: h.previous, previous: null } : h;
    case "newGame":
      return step(newGame(ctx));
    case "draw":
      if (p !== null || g.deck.length === 0) return h;
      return step(drawFor(g, action.seat, ctx));
    case "done": {
      if (p?.kind !== "reveal") return h;
      const card = ctx.byId[p.cardId];
      if (!card || card.keep !== "immediate" || card.reminder) return h;
      if (card.flow === "stealKept" && g.hands[opponent(p.seat)].length > 0) return h;
      const next = discardCard({ ...g, pending: null }, p.cardId, p.seat);
      return step(applyFlow(next, card, p.seat, ctx));
    }
    case "toHand": {
      if (p?.kind !== "reveal") return h;
      const card = ctx.byId[p.cardId];
      if (!card || card.keep === "immediate") return h;
      const hands = { ...g.hands, [p.seat]: [...g.hands[p.seat], p.cardId] };
      return step({ ...g, hands, pending: null });
    }
    case "remind": {
      if (p?.kind !== "reveal") return h;
      const card = ctx.byId[p.cardId];
      if (!card?.reminder) return h;
      const reminders = { ...g.reminders, [p.seat]: [...g.reminders[p.seat], p.cardId] };
      return step({ ...g, reminders, pending: null });
    }
    case "use": {
      if (p !== null) return h;
      const card = ctx.byId[action.cardId];
      if (!card || card.keep !== "untilUsed" || !g.hands[action.seat].includes(action.cardId)) return h;
      const hands = { ...g.hands, [action.seat]: without(g.hands[action.seat], action.cardId) };
      return step(discardCard({ ...g, hands }, action.cardId, action.seat));
    }
    case "clearReminder": {
      if (p !== null || !g.reminders[action.seat].includes(action.cardId)) return h;
      const reminders = { ...g.reminders, [action.seat]: without(g.reminders[action.seat], action.cardId) };
      return step(discardCard({ ...g, reminders }, action.cardId, action.seat));
    }
    case "royalDraw": {
      if (p?.kind !== "reveal" || ctx.byId[p.cardId]?.flow !== "royalDecree") return h;
      const next = discardCard({ ...g, pending: null }, p.cardId, p.seat);
      return step(drawFor(next, p.seat, ctx));
    }
    case "steal": {
      if (p?.kind !== "reveal" || ctx.byId[p.cardId]?.flow !== "stealKept") return h;
      const victim = opponent(p.seat);
      if (!g.hands[victim].includes(action.cardId)) return h;
      const hands = { ...g.hands, [victim]: without(g.hands[victim], action.cardId) };
      const next = discardCard({ ...g, hands }, p.cardId, p.seat);
      return step({ ...next, pending: { kind: "reveal", cardId: action.cardId, seat: p.seat } });
    }
    case "extortion": {
      if (p?.kind !== "extortion") return h;
      if (!action.take) {
        return step({ ...g, pending: { kind: "reveal", cardId: p.cardId, seat: p.drawer } });
      }
      const extId = g.hands[p.holder].find((id) => ctx.byId[id]?.flow === "extortion");
      if (extId === undefined) return h;
      const hands = { ...g.hands, [p.holder]: without(g.hands[p.holder], extId) };
      const next = discardCard({ ...g, hands }, extId, p.holder);
      return step({ ...next, pending: { kind: "reveal", cardId: p.cardId, seat: p.holder } });
    }
  }
}
