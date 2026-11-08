import { act, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { cards, cardsById } from "../data/cards";
import { createHistory } from "../game/game";
import { saveHistory } from "../game/storage";
import type { GameState } from "../game/types";
import { THANKS_MS } from "./feedback";
import { TUTORIAL_KEY } from "./tutorial";

const rng = () => 0.5;
const ICON = "Feedback about this card";
const fetchMock = vi.fn();

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

const half = (c: HTMLElement, seat: "top" | "bottom") =>
  c.querySelector(`[data-seat="${seat}"]`) as HTMLElement;
const form = () => screen.getByRole("dialog", { name: "Feedback" });
const queryForm = () => screen.queryByRole("dialog", { name: "Feedback" });

/** Check that the form is open with the type Card and the card `cardId`. */
function expectCardForm(cardId: string) {
  expect(within(form()).getByRole("radio", { name: "Card" })).toBeChecked();
  expect(within(form()).getByRole("combobox", { name: "Card" })).toHaveValue(cardId);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(TUTORIAL_KEY, "seen");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("the drawn card view opens the form with the card", () => {
  seed({ pending: { kind: "reveal", cardId: "siege", seat: "bottom" } });
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  expectCardForm("siege");
});

test("cancel goes back to the drawn card", () => {
  seed({ pending: { kind: "reveal", cardId: "siege", seat: "bottom" } });
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  fireEvent.click(within(form()).getByRole("button", { name: "Cancel" }));
  expect(queryForm()).toBeNull();
  expect(screen.getByText("White drew")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: ICON })).toBeInTheDocument();
});

test("a hand card of the top seat opens an upright form with the card", () => {
  const { container } = seed({ hands: { bottom: [], top: ["cavalry-charge"] } });
  fireEvent.click(within(half(container, "top")).getByRole("button", { name: "Cavalry Charge" }));
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  expectCardForm("cavalry-charge");
  expect(form()).not.toHaveClass("turned");
  expect(form().closest(".turned")).toBeNull();
});

test("a reminder card opens the form with the card", () => {
  const { container } = seed({ reminders: { bottom: ["siege"], top: [] } });
  fireEvent.click(within(half(container, "bottom")).getByRole("button", { name: /Siege/ }));
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  expectCardForm("siege");
});

test("a discard card opens the form, and cancel goes back to it", () => {
  seed({ discard: [{ cardId: "siege", seat: "bottom", color: "white" }] });
  fireEvent.click(screen.getByRole("button", { name: "Last: Siege" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Discard pile" })).getByRole("button", { name: /Siege/ }));
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  expectCardForm("siege");
  fireEvent.click(within(form()).getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("dialog", { name: "White drew" })).toBeInTheDocument();
});

test("the extortion holder panel has no feedback icon", () => {
  const { container } = seed({
    hands: { bottom: [], top: ["extortion"] },
    pending: { kind: "extortion", cardId: "cavalry-charge", drawer: "bottom", holder: "top" },
  });
  const holder = container.querySelector(".overlay-other") as HTMLElement;
  expect(within(holder).queryByRole("button", { name: ICON })).toBeNull();
  const drawer = container.querySelector(".overlay-own") as HTMLElement;
  expect(within(drawer).getByRole("button", { name: ICON })).toBeInTheDocument();
});

test("the menu opens the form with no type", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "⋯" }));
  fireEvent.click(screen.getByRole("button", { name: "Feedback" }));
  for (const name of ["Card", "Game rules", "App"]) {
    expect(within(form()).getByRole("radio", { name })).not.toBeChecked();
  }
});

test("the rules screen opens the form with Game rules", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "?" }));
  fireEvent.click(within(screen.getByRole("dialog", { name: "Rules" })).getByRole("button", { name: "Feedback" }));
  expect(within(form()).getByRole("radio", { name: "Game rules" })).toBeChecked();
});

test("after a send the app goes back to the hand card, and the game is the same", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: "true" }) });
  const { container } = seed({ hands: { bottom: ["cavalry-charge"], top: [] } });
  expect(screen.getByText("Deck 56")).toBeInTheDocument();
  fireEvent.click(within(half(container, "bottom")).getByRole("button", { name: "Cavalry Charge" }));
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  fireEvent.click(within(form()).getByRole("button", { name: "Too weak" }));
  vi.useFakeTimers();
  fireEvent.click(within(form()).getByRole("button", { name: "Send" }));
  await act(async () => {});
  expect(within(form()).getByText("Thank you")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(THANKS_MS));
  expect(queryForm()).toBeNull();
  expect(screen.getByRole("dialog", { name: "White · Hand" })).toBeInTheDocument();
  expect(screen.getByText("Deck 56")).toBeInTheDocument();
});

test("cancel after a failure keeps the game state", async () => {
  fetchMock.mockRejectedValue(new TypeError("offline"));
  seed({ pending: { kind: "reveal", cardId: "siege", seat: "bottom" } });
  const deckText = screen.getByText(/^Deck \d+$/).textContent;
  fireEvent.click(screen.getByRole("button", { name: ICON }));
  fireEvent.change(within(form()).getByRole("textbox", { name: "Message" }), { target: { value: "Hm" } });
  fireEvent.click(within(form()).getByRole("button", { name: "Send" }));
  await within(form()).findByRole("alert");
  fireEvent.click(within(form()).getByRole("button", { name: "Cancel" }));
  expect(queryForm()).toBeNull();
  expect(screen.getByText("White drew")).toBeInTheDocument();
  expect(screen.getByText(deckText ?? "")).toBeInTheDocument();
});
