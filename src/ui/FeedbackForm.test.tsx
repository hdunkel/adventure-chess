import { act, fireEvent, render, screen } from "@testing-library/react";
import { THANKS_MS } from "./feedback";
import { FeedbackForm } from "./FeedbackForm";

const fetchMock = vi.fn();

const sent = () => JSON.parse(fetchMock.mock.calls[0][1].body) as Record<string, string>;
const reply = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) });
const send = () => screen.getByRole("button", { name: "Send" });
const message = () => screen.getByRole("textbox", { name: "Message" });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("a start with a card selects the type Card and the card", () => {
  render(<FeedbackForm start={{ type: "card", cardId: "agamemnon" }} onDone={() => {}} />);
  expect(screen.getByRole("radio", { name: "Card" })).toBeChecked();
  expect(screen.getByRole("combobox", { name: "Card" })).toHaveValue("agamemnon");
});

test("a start without a type selects nothing, and send is disabled", () => {
  render(<FeedbackForm start={{ type: null }} onDone={() => {}} />);
  for (const name of ["Card", "Game rules", "App"]) {
    expect(screen.getByRole("radio", { name })).not.toBeChecked();
  }
  fireEvent.change(message(), { target: { value: "Text" } });
  expect(send()).toBeDisabled();
});

test("a start with Game rules selects Game rules and shows no card picker", () => {
  render(<FeedbackForm start={{ type: "rules" }} onDone={() => {}} />);
  expect(screen.getByRole("radio", { name: "Game rules" })).toBeChecked();
  expect(screen.queryByRole("combobox", { name: "Card" })).toBeNull();
});

test("the card picker shows all cards in alphabetical order", () => {
  render(<FeedbackForm start={{ type: "card" }} onDone={() => {}} />);
  const names = screen
    .getAllByRole("option")
    .map((o) => o.textContent ?? "")
    .filter((n) => n !== "Select a card");
  expect(names.length).toBe(57);
  expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
});

test("a rating enables send, and a second tap removes it", () => {
  render(<FeedbackForm start={{ type: "card", cardId: "agamemnon" }} onDone={() => {}} />);
  expect(send()).toBeDisabled();
  const strong = screen.getByRole("button", { name: "Too strong" });
  fireEvent.click(strong);
  expect(strong).toHaveAttribute("aria-pressed", "true");
  expect(send()).toBeEnabled();
  fireEvent.click(strong);
  expect(strong).toHaveAttribute("aria-pressed", "false");
  expect(send()).toBeDisabled();
});

test("only one rating is selected", () => {
  render(<FeedbackForm start={{ type: "card", cardId: "agamemnon" }} onDone={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Too strong" }));
  fireEvent.click(screen.getByRole("button", { name: "Great card" }));
  expect(screen.getByRole("button", { name: "Too strong" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: "Great card" })).toHaveAttribute("aria-pressed", "true");
});

test("app feedback needs a text that is not blank", () => {
  render(<FeedbackForm start={{ type: "app" }} onDone={() => {}} />);
  fireEvent.change(message(), { target: { value: "   " } });
  expect(send()).toBeDisabled();
  fireEvent.change(message(), { target: { value: "A bug" } });
  expect(send()).toBeEnabled();
});

test("a change from Card to App sends no card data", async () => {
  fetchMock.mockResolvedValue(reply({ success: "true" }));
  render(<FeedbackForm start={{ type: "card", cardId: "agamemnon" }} onDone={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Too strong" }));
  fireEvent.click(screen.getByRole("radio", { name: "App" }));
  fireEvent.change(message(), { target: { value: "A bug" } });
  fireEvent.click(send());
  await screen.findByText("Thank you");
  expect(sent().type).toBe("App");
  expect(sent()).not.toHaveProperty("card");
  expect(sent()).not.toHaveProperty("rating");
});

test("the request has the card, the rating, the name and the version", async () => {
  fetchMock.mockResolvedValue(reply({ success: "true" }));
  render(<FeedbackForm start={{ type: "card", cardId: "agamemnon" }} onDone={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Not fun" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Name (optional)" }), { target: { value: "Anna" } });
  fireEvent.click(send());
  await screen.findByText("Thank you");
  expect(sent()).toMatchObject({ type: "Card", card: "Agamemnon (agamemnon)", rating: "Not fun", name: "Anna" });
  expect(sent().version).toMatch(/^0\.5\.0 \(/);
  expect(sent().cardText).toContain("Queen");
});

test("send is disabled while the request is open", async () => {
  let finish: (v: unknown) => void = () => {};
  fetchMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  render(<FeedbackForm start={{ type: "app" }} onDone={() => {}} />);
  fireEvent.change(message(), { target: { value: "A bug" } });
  fireEvent.click(send());
  const busy = screen.getByRole("button", { name: "Sending…" });
  expect(busy).toBeDisabled();
  fireEvent.click(busy);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(async () => finish(reply({ success: "true" })));
});

test("a success shows Thank you and then closes", async () => {
  fetchMock.mockResolvedValue(reply({ success: "true" }));
  const onDone = vi.fn();
  render(<FeedbackForm start={{ type: "app" }} onDone={onDone} />);
  fireEvent.change(message(), { target: { value: "A bug" } });
  vi.useFakeTimers();
  fireEvent.click(send());
  await act(async () => {});
  expect(screen.getByText("Thank you")).toBeInTheDocument();
  expect(onDone).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(THANKS_MS));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test("a failure shows an error and an e-mail link, and keeps the text", async () => {
  fetchMock.mockRejectedValue(new TypeError("offline"));
  render(<FeedbackForm start={{ type: "app" }} onDone={() => {}} />);
  fireEvent.change(message(), { target: { value: "A bug" } });
  fireEvent.click(send());
  expect(await screen.findByRole("alert")).toHaveTextContent("not sent");
  const link = screen.getByRole("link", { name: "Send by e-mail" });
  expect(link.getAttribute("href")).toMatch(/^mailto:indiecardhouse@gmail\.com\?subject=/);
  expect(link.getAttribute("href")).toContain(encodeURIComponent("A bug"));
  expect(message()).toHaveValue("A bug");
  expect(send()).toBeEnabled();
});

test("cancel closes the form without a request", () => {
  const onDone = vi.fn();
  render(<FeedbackForm start={{ type: "app" }} onDone={onDone} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("the form waits for the timer only while it is open", async () => {
  fetchMock.mockResolvedValue(reply({ success: "true" }));
  const onDone = vi.fn();
  const { unmount } = render(<FeedbackForm start={{ type: "app" }} onDone={onDone} />);
  fireEvent.change(message(), { target: { value: "A bug" } });
  vi.useFakeTimers();
  fireEvent.click(send());
  await act(async () => {});
  expect(screen.getByText("Thank you")).toBeInTheDocument();
  unmount();
  vi.advanceTimersByTime(THANKS_MS);
  expect(onDone).not.toHaveBeenCalled();
});
