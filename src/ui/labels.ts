import type { Color, Keep } from "../game/types";

/** "white" → "White". */
export function colorName(color: Color): string {
  return color === "white" ? "White" : "Black";
}

/** The keep label on a big card. An immediate card has no label. */
export const keepLabels: Record<Keep, string | null> = {
  immediate: null,
  untilUsed: "Keep until used",
  permanent: "Keep this card",
};
