import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHistory } from "./game";
import { initialHistory, loadHistory, saveHistory, STORAGE_KEY } from "./storage";
import { testCtx, withGame } from "./testCards";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round trip", () => {
    const ctx = testCtx();
    const h = withGame({ deck: ["imm", "keep"], hands: { bottom: ["perm"], top: [] } });
    saveHistory(h);
    expect(loadHistory(ctx)).toEqual(h);
  });

  it("missing key -> null", () => {
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("broken JSON -> null", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("other cardsKey -> null", () => {
    saveHistory({ ...withGame({ deck: ["imm"] }), cardsKey: "other" });
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("other version -> null", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...withGame({}), version: 2 }));
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("unknown card id -> null", () => {
    saveHistory(withGame({ deck: ["imm", "ghost"] }));
    expect(loadHistory(testCtx())).toBeNull();
    saveHistory(withGame({ pending: { kind: "reveal", cardId: "ghost", seat: "bottom" } }));
    expect(loadHistory(testCtx())).toBeNull();
    saveHistory(withGame({ discard: [{ cardId: "ghost", seat: "top", color: "black" }] }));
    expect(loadHistory(testCtx())).toBeNull();
    const h = withGame({});
    saveHistory({ ...h, previous: { ...h.game, hands: { bottom: ["ghost"], top: [] } } });
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("initialHistory makes a new game when the saved state is stale", () => {
    const ctx = testCtx();
    saveHistory({ ...withGame({ deck: ["imm"] }), cardsKey: "other" });
    const h = initialHistory(ctx);
    expect(h).toEqual(createHistory(ctx));
  });

  it("saveHistory does not throw when setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(() => saveHistory(withGame({}))).not.toThrow();
  });
});

describe("storage shape guard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const saveRaw = (game: unknown) => {
    const h = withGame({});
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...h, game }));
  };

  it("missing colors -> null", () => {
    const { colors: _colors, ...game } = withGame({}).game;
    saveRaw(game);
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("bad color -> null", () => {
    saveRaw({ ...withGame({}).game, colors: { bottom: "red", top: "black" } });
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("hand or reminder list that is not an array -> null", () => {
    saveRaw({ ...withGame({}).game, hands: { bottom: "imm", top: [] } });
    expect(loadHistory(testCtx())).toBeNull();
    saveRaw({ ...withGame({}).game, reminders: { bottom: [] } });
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("unknown pending kind -> null", () => {
    saveRaw({ ...withGame({}).game, pending: { kind: "other", cardId: "imm", seat: "bottom" } });
    expect(loadHistory(testCtx())).toBeNull();
  });

  it("pending extortion is valid", () => {
    const h = withGame({ pending: { kind: "extortion", cardId: "imm", drawer: "bottom", holder: "top" } });
    saveHistory(h);
    expect(loadHistory(testCtx())).toEqual(h);
  });
});
