import { describe, it, expect } from "vitest";
import { reduce, shuffle, newGame, createHistory } from "./game";
import { testCtx, withGame } from "./testCards";

const ctx = testCtx();

describe("shuffle", () => {
  it("shuffle keeps all items and uses rng", () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, () => 0);
    expect([...out].sort()).toEqual([1, 2, 3, 4]);
    expect(out).not.toEqual([1, 2, 3, 4]);
    expect(input).toEqual([1, 2, 3, 4]);
  });
});

describe("newGame", () => {
  it("newGame shuffles all cards", () => {
    const g = newGame(ctx);
    expect(g.deck).toHaveLength(10);
    expect([...g.deck].sort()).toEqual(ctx.cards.map((c) => c.id).sort());
    expect(g.hands).toEqual({ bottom: [], top: [] });
    expect(g.discard).toEqual([]);
    expect(g.colors.bottom).toBe("white");
    expect(g.pending).toBeNull();
    expect(createHistory(ctx).previous).toBeNull();
  });
});

describe("reduce", () => {
  it("draw reveals the top card for the drawer", () => {
    const h = withGame({ deck: ["imm", "keep"] });
    const n = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    expect(n.game.deck).toEqual(["keep"]);
    expect(n.game.pending).toEqual({ kind: "reveal", cardId: "imm", seat: "bottom" });
    expect(n.previous).toBe(h.game);
  });

  it("draw is ignored while a card is open", () => {
    const h = reduce(withGame({ deck: ["imm", "keep"] }), { type: "draw", seat: "bottom" }, ctx);
    expect(reduce(h, { type: "draw", seat: "top" }, ctx)).toBe(h);
  });

  it("draw is ignored with an empty deck", () => {
    const h = withGame({ deck: [] });
    expect(reduce(h, { type: "draw", seat: "bottom" }, ctx)).toBe(h);
  });

  it("done discards an immediate card", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "imm", seat: "bottom" } });
    const n = reduce(h, { type: "done" }, ctx);
    expect(n.game.discard).toEqual([{ cardId: "imm", seat: "bottom", color: "white" }]);
    expect(n.game.pending).toBeNull();
  });

  it("done is not valid for keep and reminder cards", () => {
    for (const cardId of ["keep", "rem"]) {
      const h = withGame({ pending: { kind: "reveal", cardId, seat: "bottom" } });
      expect(reduce(h, { type: "done" }, ctx)).toBe(h);
    }
  });

  it("toHand puts a keep card in the hand", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "keep", seat: "bottom" } });
    const n = reduce(h, { type: "toHand" }, ctx);
    expect(n.game.hands.bottom).toEqual(["keep"]);
    expect(n.game.pending).toBeNull();
    const i = withGame({ pending: { kind: "reveal", cardId: "imm", seat: "bottom" } });
    expect(reduce(i, { type: "toHand" }, ctx)).toBe(i);
  });

  it("remind puts a reminder card in the reminder row", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "rem", seat: "top" } });
    const n = reduce(h, { type: "remind" }, ctx);
    expect(n.game.reminders.top).toEqual(["rem"]);
    expect(n.game.pending).toBeNull();
    const c = reduce(n, { type: "clearReminder", seat: "top", cardId: "rem" }, ctx);
    expect(c.game.reminders.top).toEqual([]);
    expect(c.game.discard).toEqual([{ cardId: "rem", seat: "top", color: "black" }]);
  });

  it("use discards a keep-until-used card", () => {
    const h = withGame({ hands: { bottom: ["keep", "perm"], top: [] } });
    const n = reduce(h, { type: "use", seat: "bottom", cardId: "keep" }, ctx);
    expect(n.game.hands.bottom).toEqual(["perm"]);
    expect(n.game.discard).toEqual([{ cardId: "keep", seat: "bottom", color: "white" }]);
    expect(reduce(h, { type: "use", seat: "bottom", cardId: "perm" }, ctx)).toBe(h);
  });

  it("undo reverts the last action only", () => {
    const h = withGame({ deck: ["imm"] });
    const d = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    const u = reduce(d, { type: "undo" }, ctx);
    expect(u.game.deck).toEqual(["imm"]);
    expect(u.game.pending).toBeNull();
    expect(reduce(u, { type: "undo" }, ctx)).toBe(u);
  });

  it("undo after newGame brings back the old game", () => {
    const h = withGame({ deck: ["imm"], discard: [{ cardId: "keep", seat: "top", color: "black" }] });
    const n = reduce(h, { type: "newGame" }, ctx);
    expect(n.game.deck).toHaveLength(10);
    expect(reduce(n, { type: "undo" }, ctx).game).toEqual(h.game);
  });
});
