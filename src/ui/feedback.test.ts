import { cardsById } from "../data/cards";
import {
  APP_VERSION,
  canSend,
  cardText,
  feedbackFields,
  mailtoUrl,
  sendFeedback,
} from "./feedback";
import type { FeedbackDraft } from "./feedback";

const draft = (partial: Partial<FeedbackDraft>): FeedbackDraft => ({
  type: null,
  cardId: "",
  rating: null,
  message: "",
  name: "",
  honey: "",
  ...partial,
});

const env = { version: "0.5.0 (abc1234)", device: "TestBrowser · 400x800" };

const answer = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }) as unknown as typeof fetch;

test("no type: send is not possible", () => {
  expect(canSend(draft({ message: "Hello" }))).toBe(false);
});

test("card feedback needs a card and a rating or a text", () => {
  expect(canSend(draft({ type: "card", rating: "Too strong" }))).toBe(false);
  expect(canSend(draft({ type: "card", cardId: "agamemnon" }))).toBe(false);
  expect(canSend(draft({ type: "card", cardId: "agamemnon", rating: "Too strong" }))).toBe(true);
  expect(canSend(draft({ type: "card", cardId: "agamemnon", message: "Unclear" }))).toBe(true);
  expect(canSend(draft({ type: "card", cardId: "agamemnon", message: "   " }))).toBe(false);
});

test("rules and app feedback need a text that is not blank", () => {
  for (const type of ["rules", "app"] as const) {
    expect(canSend(draft({ type, message: "" }))).toBe(false);
    expect(canSend(draft({ type, message: "  \n " }))).toBe(false);
    expect(canSend(draft({ type, message: "Text" }))).toBe(true);
  }
});

test("the card text has the keep label and then the effect", () => {
  const card = cardsById["cavalry-charge"];
  expect(card.keep).toBe("untilUsed");
  expect(cardText(card)).toBe(`Keep until used\n${card.effect}`);
  const immediate = cardsById["agamemnon"];
  expect(cardText(immediate)).toBe(immediate.effect);
});

test("the fields for card feedback", () => {
  const card = cardsById["agamemnon"];
  const fields = feedbackFields(
    draft({ type: "card", cardId: card.id, rating: "Too strong", message: "Hm", name: "Anna" }),
    card,
    env,
  );
  expect(fields).toEqual({
    _subject: "Adventure Chess feedback: Card: Agamemnon",
    _template: "table",
    _captcha: "false",
    _honey: "",
    type: "Card",
    card: "Agamemnon (agamemnon)",
    cardText: cardText(card),
    rating: "Too strong",
    message: "Hm",
    name: "Anna",
    version: "0.5.0 (abc1234)",
    device: "TestBrowser · 400x800",
  });
});

test("the fields for app feedback have no card data", () => {
  const fields = feedbackFields(
    draft({ type: "app", cardId: "agamemnon", rating: "Too strong", message: "Bug" }),
    cardsById["agamemnon"],
    env,
  );
  expect(fields._subject).toBe("Adventure Chess feedback: App");
  expect(fields.type).toBe("App");
  expect(fields).not.toHaveProperty("card");
  expect(fields).not.toHaveProperty("cardText");
  expect(fields).not.toHaveProperty("rating");
  expect(fields.name).toBe("");
});

test("the fields for rules feedback", () => {
  const fields = feedbackFields(draft({ type: "rules", message: "Draw rule" }), undefined, env);
  expect(fields._subject).toBe("Adventure Chess feedback: Game rules");
  expect(fields.type).toBe("Game rules");
});

test("send posts JSON to FormSubmit and accepts only success true", async () => {
  const fetchFn = answer({ success: "true" });
  expect(await sendFeedback({ message: "Hi" }, fetchFn)).toBe(true);
  const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
  expect(url).toMatch(/^https:\/\/formsubmit\.co\/ajax\//);
  expect(init.method).toBe("POST");
  expect(init.headers).toEqual({ "Content-Type": "application/json", Accept: "application/json" });
  expect(JSON.parse(init.body)).toEqual({ message: "Hi" });
});

test("send fails for success false, an HTTP error, and no network", async () => {
  expect(await sendFeedback({}, answer({ success: "false" }))).toBe(false);
  expect(await sendFeedback({}, answer({ success: "true" }, false))).toBe(false);
  const offline = vi.fn().mockRejectedValue(new TypeError("offline")) as unknown as typeof fetch;
  expect(await sendFeedback({}, offline)).toBe(false);
});

test("the mailto link has the subject and the fields", () => {
  const url = mailtoUrl({
    _subject: "Adventure Chess feedback: App",
    _template: "table",
    type: "App",
    message: "Bug & more",
  });
  expect(url.startsWith("mailto:indiecardhouse@gmail.com?subject=")).toBe(true);
  const params = new URLSearchParams(url.slice(url.indexOf("?") + 1).replace(/\+/g, "%2B"));
  expect(params.get("subject")).toBe("Adventure Chess feedback: App");
  expect(params.get("body")).toBe("type: App\nmessage: Bug & more");
});

test("the app version has the package version and the commit", () => {
  expect(APP_VERSION).toMatch(/^0\.5\.0 \(.+\)$/);
});
