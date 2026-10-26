import type { Card } from "../game/types";
import data from "./cards.json";

export const cards: Card[] = data as Card[];

export const cardsById: Record<string, Card> = Object.fromEntries(
  cards.map((card) => [card.id, card]),
);
