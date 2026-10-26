import type { GameState, History } from "./types";
import { cardsKey, createHistory } from "./game";
import type { Ctx } from "./game";

export const STORAGE_KEY = "adventure-chess/game";

export function saveHistory(h: History): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
  } catch {
    // Ignore the error. The game works without saved state.
  }
}

function idsOf(g: GameState): string[] {
  return [
    ...g.deck,
    ...g.hands.bottom,
    ...g.hands.top,
    ...g.reminders.bottom,
    ...g.reminders.top,
    ...g.discard.map((d) => d.cardId),
    ...(g.pending ? [g.pending.cardId] : []),
  ];
}

const isColor = (c: unknown): boolean => c === "white" || c === "black";

/** True if both seats have an array. */
const isSeatLists = (r: unknown): boolean => {
  const s = r as Record<string, unknown> | null;
  return !!s && Array.isArray(s.bottom) && Array.isArray(s.top);
};

/** True if the saved game has the correct shape and only known card ids. */
function isKnown(g: unknown, ctx: Ctx): boolean {
  const s = g as GameState;
  if (!s || !Array.isArray(s.deck) || !Array.isArray(s.discard)) return false;
  if (!isSeatLists(s.hands) || !isSeatLists(s.reminders)) return false;
  if (!s.colors || !isColor(s.colors.bottom) || !isColor(s.colors.top)) return false;
  if (s.pending !== null && s.pending?.kind !== "reveal" && s.pending?.kind !== "extortion") {
    return false;
  }
  return idsOf(s).every((id) => Object.hasOwn(ctx.byId, id));
}

export function loadHistory(ctx: Ctx): History | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const h = JSON.parse(raw) as History;
    if (!h || h.version !== 1) return null;
    if (h.cardsKey !== cardsKey(ctx.cards)) return null;
    if (!isKnown(h.game, ctx)) return null;
    if (h.previous !== null && !isKnown(h.previous, ctx)) return null;
    return h;
  } catch {
    return null;
  }
}

export function initialHistory(ctx: Ctx): History {
  return loadHistory(ctx) ?? createHistory(ctx);
}
