import type { Card, GameState, History } from "./types";
import { cardsKey } from "./game";
import type { Ctx } from "./game";

export const testCards: Card[] = [
  { id: "imm", name: "Imm", effect: "Test.", keep: "immediate", piece: "none" },
  { id: "keep", name: "Keep", effect: "Test.", keep: "untilUsed", piece: "none" },
  { id: "perm", name: "Perm", effect: "Test.", keep: "permanent", piece: "none" },
  { id: "rem", name: "Rem", effect: "Test.", keep: "immediate", piece: "none", reminder: true },
  { id: "herring", name: "Herring", effect: "Test.", keep: "immediate", piece: "none", flow: "opponentDraws" },
  { id: "toll", name: "Toll", effect: "Test.", keep: "immediate", piece: "none", flow: "discardAllHands" },
  { id: "burglar", name: "Burglar", effect: "Test.", keep: "immediate", piece: "none", flow: "stealKept" },
  { id: "ext", name: "Ext", effect: "Test.", keep: "untilUsed", piece: "none", flow: "extortion" },
  { id: "magic", name: "Magic", effect: "Test.", keep: "immediate", piece: "none", flow: "swapColors" },
  { id: "decree", name: "Decree", effect: "Test.", keep: "immediate", piece: "none", flow: "royalDecree" },
];

export function testCtx(rng: () => number = () => 0): Ctx {
  return {
    cards: testCards,
    byId: Object.fromEntries(testCards.map((c) => [c.id, c])),
    rng,
  };
}

export function withGame(partial: Partial<GameState>): History {
  const game: GameState = {
    deck: [],
    hands: { bottom: [], top: [] },
    reminders: { bottom: [], top: [] },
    discard: [],
    colors: { bottom: "white", top: "black" },
    pending: null,
    ...partial,
  };
  return { version: 1, cardsKey: cardsKey(testCards), game, previous: null };
}
