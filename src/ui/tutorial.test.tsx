import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { cards, cardsById } from "../data/cards";
import { createHistory } from "../game/game";
import { saveHistory, STORAGE_KEY } from "../game/storage";
import type { GameState } from "../game/types";
import { TUTORIAL_KEY, tutorialSteps } from "./tutorial";

const rng = () => 0.5;

const ask = () => screen.getByRole("dialog", { name: "Tutorial?" });
const step = () => screen.getByRole("dialog", { name: /^Tutorial:/ });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

/** Go from the start dialog to step `n` (1-based). */
function goTo(n: number) {
  click("Show");
  for (let i = 1; i < n; i++) click("Next");
}

function seed(partial: Partial<GameState>) {
  const h = createHistory({ cards, byId: cardsById, rng });
  saveHistory({ ...h, game: { ...h.game, ...partial } });
}

beforeEach(() => {
  localStorage.clear();
});

test("the first visit asks for the tutorial", () => {
  render(<App rng={rng} />);
  expect(within(ask()).getByRole("button", { name: "Show" })).toBeInTheDocument();
  expect(within(ask()).getByRole("button", { name: "Skip" })).toBeInTheDocument();
});

test("skip closes the question and the app records it", () => {
  const { unmount } = render(<App rng={rng} />);
  click("Skip");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  unmount();
  render(<App rng={rng} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("show also records the answer", () => {
  const { unmount } = render(<App rng={rng} />);
  click("Show");
  unmount();
  expect(localStorage.getItem(TUTORIAL_KEY)).not.toBeNull();
});

test("the steps come in order and the last step closes with Got it", () => {
  render(<App rng={rng} />);
  click("Show");
  const titles = tutorialSteps.map((s) => s.title);
  expect(titles).toEqual([
    "Rules",
    "Phone",
    "Draw",
    "Hand",
    "Reminders",
    "Discard pile",
    "Middle strip",
  ]);
  titles.forEach((title, i) => {
    expect(step()).toHaveAccessibleName(`Tutorial: ${title}`);
    expect(within(step()).getByText(`${i + 1} / ${titles.length}`)).toBeInTheDocument();
    if (i < titles.length - 1) click("Next");
  });
  expect(within(step()).queryByRole("button", { name: "Next" })).toBeNull();
  click("Got it");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("skip tutorial closes a step", () => {
  render(<App rng={rng} />);
  goTo(3);
  click("Skip tutorial");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("the phone step shows the picture", () => {
  render(<App rng={rng} />);
  goTo(2);
  expect(within(step()).getByRole("img", { name: /phone next to the board/i })).toBeInTheDocument();
});

test("the draw step flashes only the bottom draw button", () => {
  const { container } = render(<App rng={rng} />);
  goTo(3);
  expect(within(step()).getByText("Press this button when your opponent captures your piece.")).toBeInTheDocument();
  const bottom = container.querySelector('[data-seat="bottom"] .draw-button');
  const top = container.querySelector('[data-seat="top"] .draw-button');
  expect(bottom).toHaveClass("tour-flash");
  expect(top).not.toHaveClass("tour-flash");
  expect(container.querySelectorAll(".tour-flash")).toHaveLength(1);
});

test("the hand, reminder, discard and strip steps flash their part", () => {
  const { container } = render(<App rng={rng} />);
  goTo(4);
  expect(container.querySelector('[data-seat="bottom"] .tour-flash')).toHaveClass("hand-row");
  click("Next");
  const reminder = container.querySelector('[data-seat="bottom"] .tour-flash');
  expect(reminder).toHaveClass("reminder-row");
  expect(container.querySelector('[data-seat="top"] .reminder-row')).toBeNull();
  click("Next");
  expect(container.querySelector(".tour-flash")).toHaveClass("strip-last");
  click("Next");
  expect(container.querySelector(".tour-flash")).toHaveClass("strip");
  click("Got it");
  expect(container.querySelector(".tour-flash")).toBeNull();
  expect(container.querySelector(".reminder-row")).toBeNull();
});

test("the game cannot be used while the tutorial is open", () => {
  const { container } = render(<App rng={rng} />);
  goTo(3);
  expect(container.querySelector('[data-seat="bottom"]')).toHaveAttribute("inert");
  expect(container.querySelector(".strip")).toHaveAttribute("inert");
});

test("the menu starts the tutorial at step 1 and the game does not change", () => {
  seed({
    hands: { bottom: ["cavalry-charge"], top: [] },
    pending: { kind: "reveal", cardId: "siege", seat: "bottom" },
  });
  localStorage.setItem(TUTORIAL_KEY, "seen");
  render(<App rng={rng} />);
  click("Remind");
  const before = localStorage.getItem(STORAGE_KEY);

  click("⋯");
  click("Tutorial");
  expect(step()).toHaveAccessibleName("Tutorial: Rules");
  for (let i = 1; i < tutorialSteps.length; i++) click("Next");
  click("Got it");

  expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("an open card hides during the tutorial and comes back after it", () => {
  seed({ pending: { kind: "reveal", cardId: "siege", seat: "bottom" } });
  render(<App rng={rng} />);
  expect(screen.queryByText("White drew")).not.toBeInTheDocument();
  click("Skip");
  expect(screen.getByText("White drew")).toBeInTheDocument();
});
