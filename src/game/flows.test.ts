import { describe, expect, it } from "vitest";
import { reduce } from "./game";
import { testCtx, withGame } from "./testCards";

const ctx = testCtx();

describe("card flows", () => {
  it("red herring makes the opponent draw", () => {
    const h = withGame({ deck: ["herring", "imm"] });
    const drawn = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    const r = reduce(drawn, { type: "done" }, ctx);
    expect(r.game.pending).toEqual({ kind: "reveal", cardId: "imm", seat: "top" });
    expect(r.game.discard.map((d) => d.cardId)).toEqual(["herring"]);
  });

  it("red herring with an empty deck does nothing more", () => {
    const h = withGame({ deck: ["herring"] });
    const r = reduce(reduce(h, { type: "draw", seat: "bottom" }, ctx), { type: "done" }, ctx);
    expect(r.game.pending).toBeNull();
  });

  it("toll discards both hands but not the reminders", () => {
    const h = withGame({
      hands: { bottom: ["keep"], top: ["perm"] },
      reminders: { bottom: ["rem"], top: [] },
      pending: { kind: "reveal", cardId: "toll", seat: "bottom" },
    });
    const r = reduce(h, { type: "done" }, ctx);
    expect(r.game.hands).toEqual({ bottom: [], top: [] });
    expect(r.game.reminders).toEqual({ bottom: ["rem"], top: [] });
    expect(r.game.discard.map((d) => d.cardId)).toEqual(["toll", "keep", "perm"]);
    expect(r.game.discard.map((d) => d.seat)).toEqual(["bottom", "bottom", "top"]);
  });

  it("burglar steals a kept card", () => {
    const h = withGame({
      hands: { bottom: [], top: ["perm"] },
      pending: { kind: "reveal", cardId: "burglar", seat: "bottom" },
    });
    expect(reduce(h, { type: "done" }, ctx)).toBe(h);
    expect(reduce(h, { type: "steal", cardId: "keep" }, ctx)).toBe(h);
    const s = reduce(h, { type: "steal", cardId: "perm" }, ctx);
    expect(s.game.hands.top).toEqual([]);
    expect(s.game.pending).toEqual({ kind: "reveal", cardId: "perm", seat: "bottom" });
    expect(s.game.discard).toEqual([{ cardId: "burglar", seat: "bottom", color: "white" }]);
    const t = reduce(s, { type: "toHand" }, ctx);
    expect(t.game.hands.bottom).toEqual(["perm"]);
  });

  it("burglar with an empty opponent hand is only done", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "burglar", seat: "bottom" } });
    expect(reduce(h, { type: "steal", cardId: "perm" }, ctx)).toBe(h);
    const r = reduce(h, { type: "done" }, ctx);
    expect(r.game.pending).toBeNull();
    expect(r.game.discard.map((d) => d.cardId)).toEqual(["burglar"]);
  });

  it("black magic swaps the colors", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "magic", seat: "bottom" } });
    const r = reduce(h, { type: "done" }, ctx);
    expect(r.game.colors).toEqual({ bottom: "black", top: "white" });
    expect(r.game.discard[0].color).toBe("white");
    const g2 = withGame({ ...r.game, hands: { bottom: ["keep"], top: [] } });
    const u = reduce(g2, { type: "use", seat: "bottom", cardId: "keep" }, ctx);
    expect(u.game.discard[1].color).toBe("black");
    expect(reduce(r, { type: "undo" }, ctx).game.colors).toEqual({ bottom: "white", top: "black" });
  });

  it("royal decree can draw for the owner", () => {
    const h = withGame({ deck: ["decree", "imm"] });
    const d = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    const r = reduce(d, { type: "royalDraw" }, ctx);
    expect(r.game.pending).toEqual({ kind: "reveal", cardId: "imm", seat: "bottom" });
    expect(r.game.discard.map((e) => e.cardId)).toEqual(["decree"]);
    expect(reduce(d, { type: "done" }, ctx).game.pending).toBeNull();
  });

  it("royalDraw is not valid for other cards", () => {
    const h = withGame({ pending: { kind: "reveal", cardId: "imm", seat: "bottom" } });
    expect(reduce(h, { type: "royalDraw" }, ctx)).toBe(h);
  });

  it("extortion asks the holder when the opponent draws", () => {
    const h = withGame({ deck: ["imm"], hands: { bottom: [], top: ["ext"] } });
    const q = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    expect(q.game.pending).toEqual({
      kind: "extortion", cardId: "imm", drawer: "bottom", holder: "top",
    });
    expect(reduce(q, { type: "draw", seat: "top" }, ctx)).toBe(q);
    expect(reduce(q, { type: "done" }, ctx)).toBe(q);
    const take = reduce(q, { type: "extortion", take: true }, ctx);
    expect(take.game.pending).toEqual({ kind: "reveal", cardId: "imm", seat: "top" });
    expect(take.game.hands.top).toEqual([]);
    expect(take.game.discard).toEqual([{ cardId: "ext", seat: "top", color: "black" }]);
    const leave = reduce(q, { type: "extortion", take: false }, ctx);
    expect(leave.game.pending).toEqual({ kind: "reveal", cardId: "imm", seat: "bottom" });
    expect(leave.game.hands.top).toEqual(["ext"]);
  });

  it("extortion does not ask when the holder draws", () => {
    const h = withGame({ deck: ["imm"], hands: { bottom: [], top: ["ext"] } });
    expect(reduce(h, { type: "draw", seat: "top" }, ctx).game.pending?.kind).toBe("reveal");
  });

  it("extortion is not valid without a question", () => {
    const h = withGame({ deck: ["imm"] });
    expect(reduce(h, { type: "extortion", take: true }, ctx)).toBe(h);
  });

  it("extortion asks on a red herring draw", () => {
    const h = withGame({ deck: ["herring", "imm"], hands: { bottom: ["ext"], top: [] } });
    const d = reduce(h, { type: "draw", seat: "bottom" }, ctx);
    expect(d.game.pending?.kind).toBe("reveal");
    const r = reduce(d, { type: "done" }, ctx);
    expect(r.game.pending).toEqual({
      kind: "extortion", cardId: "imm", drawer: "top", holder: "bottom",
    });
  });
});
