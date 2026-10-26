export type Keep = "immediate" | "untilUsed" | "permanent";
export type Piece = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king" | "none";
export type Flow =
  | "opponentDraws" | "discardAllHands" | "stealKept" | "extortion" | "swapColors" | "royalDecree";
export interface Card {
  id: string; name: string; effect: string; keep: Keep; piece: Piece;
  flow?: Flow; reminder?: true;
}
export type Seat = "bottom" | "top";
export type Color = "white" | "black";
export interface DiscardEntry { cardId: string; seat: Seat; color: Color }
export type Pending =
  | { kind: "reveal"; cardId: string; seat: Seat }
  | { kind: "extortion"; cardId: string; drawer: Seat; holder: Seat };
export interface GameState {
  deck: string[];                      // deck[0] is the top card
  hands: Record<Seat, string[]>;       // kept cards
  reminders: Record<Seat, string[]>;   // reminder cards
  discard: DiscardEntry[];             // newest entry last
  colors: Record<Seat, Color>;
  pending: Pending | null;             // the open card or question
}
export interface History { version: 1; cardsKey: string; game: GameState; previous: GameState | null }
