import { describe, expect, it } from "vitest";
import { cards, cardsById } from "../data/cards";
import { cardsKey, reduce } from "./game";
import type { Action, Ctx } from "./game";
import type { GameState, History, Seat } from "./types";

const ctx: Ctx = { cards, byId: cardsById, rng: () => 0.5 };

function revealOf(cardId: string, topHand: string[] = []): History {
  const game: GameState = {
    deck: cards.map((c) => c.id).filter((id) => id !== cardId && !topHand.includes(id)),
    hands: { bottom: [], top: topHand },
    reminders: { bottom: [], top: [] },
    discard: [],
    colors: { bottom: "white", top: "black" },
    pending: { kind: "reveal", cardId, seat: "bottom" as Seat },
  };
  return { version: 1, cardsKey: cardsKey(cards), game, previous: null };
}

const closeActions: Action[] = [{ type: "done" }, { type: "toHand" }, { type: "remind" }, { type: "royalDraw" }];

describe("each real card", () => {
  it.each(cards.map((c) => [c.id]))("%s has a valid action on reveal", (cardId) => {
    const h = revealOf(cardId);
    expect(closeActions.some((a) => reduce(h, a, ctx) !== h)).toBe(true);
  });

  it("burglar can steal a hand card of the opponent", () => {
    const burglar = cards.find((c) => c.flow === "stealKept");
    const kept = cards.find((c) => c.keep !== "immediate" && c.flow !== "extortion");
    expect(burglar).toBeDefined();
    expect(kept).toBeDefined();
    const h = revealOf(burglar!.id, [kept!.id]);
    const next = reduce(h, { type: "steal", cardId: kept!.id }, ctx);
    expect(next).not.toBe(h);
    expect(next.game.pending).toEqual({ kind: "reveal", cardId: kept!.id, seat: "bottom" });
    expect(next.game.hands.top).toEqual([]);
  });
});
