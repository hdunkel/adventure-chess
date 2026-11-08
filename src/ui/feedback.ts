import type { Card } from "../game/types";
import { keepLabels } from "./labels";

/**
 * The FormSubmit endpoint. It must use the alias, not the plain address (spam bots read the code).
 * Replace the placeholder with the alias from Julian before the release.
 */
export const FEEDBACK_ENDPOINT = "https://formsubmit.co/ajax/ALIAS-NOT-SET";

/** The inbox for the feedback. Only the mailto fallback uses it. */
export const FEEDBACK_EMAIL = "indiecardhouse@gmail.com";

/** The time that "Thank you" shows before the form closes. */
export const THANKS_MS = 2000;

/** The package version and the short git commit, from the build (vite.config.ts). */
export const APP_VERSION: string = __APP_VERSION__;

export type FeedbackType = "card" | "rules" | "app";

export const typeLabels: Record<FeedbackType, string> = {
  card: "Card",
  rules: "Game rules",
  app: "App",
};

export const ratings = ["Text unclear", "Too strong", "Too weak", "Not fun", "Great card"] as const;
export type Rating = (typeof ratings)[number];

/** The values in the form. `honey` is the hidden field for spam bots. */
export interface FeedbackDraft {
  type: FeedbackType | null;
  cardId: string;
  rating: Rating | null;
  message: string;
  name: string;
  honey: string;
}

/** The pre-selection when the form opens. */
export interface FeedbackStart {
  type: FeedbackType | null;
  cardId?: string;
}

/** True if the form has the minimum content for its type. */
export function canSend(d: FeedbackDraft): boolean {
  const hasText = d.message.trim() !== "";
  if (d.type === "card") return d.cardId !== "" && (d.rating !== null || hasText);
  if (d.type === "rules" || d.type === "app") return hasText;
  return false;
}

/** The card text as the big card shows it: the keep label (if there is one), then the effect. */
export function cardText(card: Card): string {
  const keep = keepLabels[card.keep];
  return keep ? `${keep}\n${card.effect}` : card.effect;
}

/** The fields of the request. Only card feedback has card data. */
export function feedbackFields(
  d: FeedbackDraft,
  card: Card | undefined,
  env: { version: string; device: string },
): Record<string, string> {
  const type = d.type === null ? "" : typeLabels[d.type];
  const forCard = d.type === "card" && card !== undefined;
  const fields: Record<string, string> = {
    _subject: `Adventure Chess feedback: ${type}${forCard ? `: ${card.name}` : ""}`,
    _template: "table",
    _captcha: "false",
    _honey: d.honey,
    type,
  };
  if (forCard) {
    fields.card = `${card.name} (${card.id})`;
    fields.cardText = cardText(card);
    if (d.rating !== null) fields.rating = d.rating;
  }
  fields.message = d.message;
  fields.name = d.name;
  fields.version = env.version;
  fields.device = env.device;
  return fields;
}

/** Send the fields to FormSubmit. True only if FormSubmit accepted them. */
export async function sendFeedback(
  fields: Record<string, string>,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchFn(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(fields),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { success?: unknown };
    return body.success === "true" || body.success === true;
  } catch {
    return false;
  }
}

/** A mailto link with the same content, for when the send fails. */
export function mailtoUrl(fields: Record<string, string>): string {
  const body = Object.entries(fields)
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  const subject = encodeURIComponent(fields._subject ?? "Adventure Chess feedback");
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
}

/** The browser and the screen size in CSS pixels. */
export function deviceInfo(): string {
  return `${navigator.userAgent} · ${window.screen.width}x${window.screen.height}`;
}
