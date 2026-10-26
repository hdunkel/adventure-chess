import type { Color } from "../game/types";

/** "white" → "White". */
export function colorName(color: Color): string {
  return color === "white" ? "White" : "Black";
}
