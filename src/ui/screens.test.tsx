/// <reference types="node" />
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import App from "../App";
import { cards, cardsById } from "../data/cards";
import { createHistory } from "../game/game";
import { saveHistory } from "../game/storage";
import type { GameState } from "../game/types";

const rng = () => 0.5;

/** Save a game that starts from a new game, with the changes in `partial`. Then render App. */
function seed(partial: Partial<GameState>) {
  const h = createHistory({ cards, byId: cardsById, rng });
  const used = [
    ...(partial.hands?.bottom ?? []),
    ...(partial.hands?.top ?? []),
    ...(partial.reminders?.bottom ?? []),
    ...(partial.reminders?.top ?? []),
    ...(partial.discard ?? []).map((d) => d.cardId),
    ...(partial.pending ? [partial.pending.cardId] : []),
  ];
  const deck = h.game.deck.filter((id) => !used.includes(id));
  saveHistory({ ...h, game: { ...h.game, deck, ...partial } });
  return render(<App rng={rng} />);
}

const bottomHalf = (c: HTMLElement) => c.querySelector('[data-seat="bottom"]') as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

test("use discards a hand card", () => {
  const { container } = seed({ hands: { bottom: ["cavalry-charge"], top: [] } });
  fireEvent.click(within(bottomHalf(container)).getByRole("button", { name: "Cavalry Charge" }));
  const view = screen.getByRole("dialog");
  expect(within(view).getByRole("button", { name: "Close" })).toBeInTheDocument();
  fireEvent.click(within(view).getByRole("button", { name: "Use" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(bottomHalf(container)).queryByRole("button", { name: "Cavalry Charge" })).toBeNull();
  expect(screen.getByRole("button", { name: "Last: Cavalry Charge" })).toBeInTheDocument();
});

test("a permanent card has no Use button", () => {
  const { container } = seed({ hands: { bottom: ["broken-chains"], top: [] } });
  fireEvent.click(within(bottomHalf(container)).getByRole("button", { name: "Broken Chains" }));
  const view = screen.getByRole("dialog");
  expect(within(view).queryByRole("button", { name: "Use" })).toBeNull();
  fireEvent.click(within(view).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(within(bottomHalf(container)).getByRole("button", { name: "Broken Chains" })).toBeInTheDocument();
});

test("the hand card view of the top seat is turned", () => {
  const { container } = seed({ hands: { bottom: [], top: ["cavalry-charge"] } });
  const top = container.querySelector('[data-seat="top"]') as HTMLElement;
  fireEvent.click(within(top).getByRole("button", { name: "Cavalry Charge" }));
  expect(screen.getByRole("dialog")).toHaveClass("turned");
});

test("a reminder card is done from the row", () => {
  const { container } = seed({ reminders: { bottom: ["siege"], top: [] } });
  fireEvent.click(within(bottomHalf(container)).getByRole("button", { name: /Siege/ }));
  const view = screen.getByRole("dialog");
  expect(within(view).getByRole("button", { name: "Close" })).toBeInTheDocument();
  fireEvent.click(within(view).getByRole("button", { name: "Done" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Last: Siege" })).toBeInTheDocument();
});

test("discard list shows newest first with the color", () => {
  seed({
    discard: [
      { cardId: "siege", seat: "bottom", color: "white" },
      { cardId: "cavalry-charge", seat: "top", color: "black" },
    ],
  });
  fireEvent.click(screen.getByRole("button", { name: "Last: Cavalry Charge" }));
  const list = screen.getByRole("dialog", { name: "Discard pile" });
  const rows = within(list).getAllByRole("button").filter((b) => b.textContent !== "Close");
  expect(rows.map((r) => r.textContent)).toEqual(["Cavalry Charge · B", "Siege · W"]);

  fireEvent.click(rows[1]);
  const view = screen.getByRole("dialog");
  expect(within(view).getByText("Siege")).toBeInTheDocument();
  expect(within(view).getAllByRole("button").map((b) => b.textContent)).toEqual(["Close"]);
  fireEvent.click(within(view).getByRole("button", { name: "Close" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Discard pile" })).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("rules screen shows the draw rule", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "?" }));
  const rules = screen.getByRole("dialog", { name: "Rules" });
  expect(
    within(rules).getByText(
      "After the first capture of a piece that is not a pawn, each capture causes a draw. " +
        "The player who lost the piece draws the card. A player in check (also in checkmate) " +
        "can draw a card instead of a different solution.",
    ),
  ).toBeInTheDocument();
  expect(within(rules).getByText("Keep until used: keep the card, use it one time.")).toBeInTheDocument();
  expect(
    within(rules).getByText("Chess pieces: Colin M.L. Burnett, CC BY-SA 3.0, via Wikimedia Commons."),
  ).toBeInTheDocument();
  fireEvent.click(within(rules).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("new game asks first", () => {
  seed({ hands: { bottom: ["cavalry-charge"], top: [] } });
  expect(screen.getByText("Deck 56")).toBeInTheDocument();

  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: "⋯" }));
  fireEvent.click(screen.getByRole("button", { name: "New game" }));
  expect(confirm).toHaveBeenCalledWith("Start a new game?");
  expect(screen.getByText("Deck 56")).toBeInTheDocument();

  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "New game" }));
  expect(screen.getByText("Deck 57")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("the royal decree draw is disabled when the deck is empty", () => {
  seed({ deck: [], pending: { kind: "reveal", cardId: "royal-decree", seat: "bottom" } });
  expect(screen.getByRole("button", { name: "Remove a Pawn and draw" })).toBeDisabled();
});

test("the extortion holder sees the card and decides", () => {
  const { container } = seed({
    hands: { bottom: [], top: ["extortion"] },
    pending: { kind: "extortion", cardId: "cavalry-charge", drawer: "bottom", holder: "top" },
  });
  const holder = container.querySelector(".overlay-other") as HTMLElement;
  expect(within(holder).getByText("Take Cavalry Charge?")).toBeInTheDocument();
  expect(within(holder).getByRole("heading", { name: "Cavalry Charge" })).toBeInTheDocument();
  expect(within(holder).getByText(cardsById["cavalry-charge"].effect)).toBeInTheDocument();
  expect(within(holder).getByRole("button", { name: "Yes" })).toBeInTheDocument();
  expect(within(holder).getByRole("button", { name: "No" })).toBeInTheDocument();
  const drawer = container.querySelector(".overlay-own") as HTMLElement;
  expect(within(drawer).getByText("Black decides")).toBeInTheDocument();
});

test("the card area of a half scrolls", () => {
  const appCss = readFileSync("src/ui/app.css", "utf8");
  const rule = /\.half-cards\s*\{[^}]*\}/.exec(appCss)?.[0] ?? "";
  expect(rule).toMatch(/overflow-y:\s*auto/);
});
