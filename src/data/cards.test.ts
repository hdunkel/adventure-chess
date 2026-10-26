import { cards, cardsById } from "./cards";

const keeps = ["immediate", "untilUsed", "permanent"];
const pieces = ["pawn", "knight", "bishop", "rook", "queen", "king", "none"];
const reminderIds = [
  "eye-of-the-cyclops", "secret-passage", "open-the-stables", "burn-them-at-the-stake",
  "heavy-is-the-crown", "swords-to-plows", "penelope", "royal-banquet",
  "murder-in-the-courtyard", "agamemnon", "siege", "helen-of-troy", "nobody-is-left-behind",
];

describe("card data", () => {
  it("has 57 cards", () => {
    expect(cards).toHaveLength(57);
  });

  it("has unique ids that are slugs", () => {
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has valid values", () => {
    for (const c of cards) {
      expect(keeps).toContain(c.keep);
      expect(pieces).toContain(c.piece);
      expect(c.name.trim()).not.toBe("");
      expect(c.effect.trim()).not.toBe("");
    }
  });

  it("has the card-flow cards", () => {
    expect(cardsById["red-herring"].flow).toBe("opponentDraws");
    expect(cardsById["toll"].flow).toBe("discardAllHands");
    expect(cardsById["burglar"].flow).toBe("stealKept");
    expect(cardsById["extortion"].flow).toBe("extortion");
    expect(cardsById["black-magic"].flow).toBe("swapColors");
    expect(cardsById["royal-decree"].flow).toBe("royalDecree");
    expect(cards.filter((c) => c.flow !== undefined)).toHaveLength(6);
  });

  it("has the reminder cards", () => {
    const found = cards.filter((c) => c.reminder).map((c) => c.id);
    expect([...found].sort()).toEqual([...reminderIds].sort());
    for (const id of reminderIds) expect(cardsById[id].keep).toBe("immediate");
  });
});
