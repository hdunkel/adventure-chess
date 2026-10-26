import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { TUTORIAL_KEY } from "./ui/tutorial";

const rng = () => 0.5;
const cardButton = /^(Done|To hand|Remind)$/;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(TUTORIAL_KEY, "seen");
});

test("shows both draw buttons and the deck counter", () => {
  render(<App rng={rng} />);
  expect(screen.getByRole("button", { name: "White draws" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Black draws" })).toBeInTheDocument();
  expect(screen.getByText("Deck 57")).toBeInTheDocument();
});

test("a draw opens the card with a button", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "White draws" }));
  expect(screen.getByText("White drew")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: cardButton }).length).toBeGreaterThan(0);
  expect(screen.getByText("Deck 56")).toBeInTheDocument();
});

test("the open card closes with its button", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "White draws" }));
  fireEvent.click(screen.getAllByRole("button", { name: cardButton })[0]);
  expect(screen.queryByText("White drew")).not.toBeInTheDocument();
});

test("undo brings the card back", () => {
  render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "White draws" }));
  const overlay = screen.getByRole("dialog");
  fireEvent.click(within(overlay).getByRole("button", { name: "Undo" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText("Deck 57")).toBeInTheDocument();
});

test("the game stays after a remount", () => {
  const { unmount } = render(<App rng={rng} />);
  fireEvent.click(screen.getByRole("button", { name: "White draws" }));
  unmount();
  render(<App rng={rng} />);
  expect(screen.getByText("Deck 56")).toBeInTheDocument();
});

test("the top half is turned", () => {
  const { container } = render(<App rng={rng} />);
  expect(container.querySelector('[data-seat="top"]')).toHaveClass("turned");
});
