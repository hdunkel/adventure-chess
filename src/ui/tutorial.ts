export const TUTORIAL_KEY = "adventure-chess/tutorial";

/** The part of the game screen that a step flashes. All parts are on the bottom half or the strip. */
export type TourTarget = "draw" | "hand" | "reminder" | "last" | "strip";

export interface TutorialStep {
  title: string;
  lines: string[];
  target?: TourTarget;
  /** True: the step shows the picture of the phone next to the board. */
  picture?: boolean;
}

export const tutorialSteps: TutorialStep[] = [
  {
    title: "Rules",
    lines: [
      "A capture causes a draw.",
      "This starts after the first capture of a piece that is not a pawn.",
      "The player who lost the piece draws a card.",
    ],
  },
  {
    title: "Phone",
    lines: ["Put the phone flat next to the board, in portrait.", "The top of the screen points to Black."],
    picture: true,
  },
  {
    title: "Draw",
    lines: ["Press this button when your opponent captures your piece."],
    target: "draw",
  },
  {
    title: "Hand",
    lines: [
      "Your kept cards are here. Tap a card to read it.",
      "Keep until used: tap “Use” when you use it.",
      "Keep this card: the card stays. Only a card effect removes it.",
    ],
    target: "hand",
  },
  {
    title: "Reminders",
    lines: ["A card with a timed effect stays here.", "When the effect stops, tap the card, then “Done”."],
    target: "reminder",
  },
  {
    title: "Discard pile",
    lines: ["A card without keep text goes here after “Done”.", "Tap here to see all used cards."],
    target: "last",
  },
  {
    title: "Middle strip",
    lines: ["Deck: the cards that are left.", "Undo: go back one step.", "?: the rules.", "⋯: the menu and this tutorial."],
    target: "strip",
  },
];

/** True if the player answered the "Tutorial?" question before. */
export function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) !== null;
  } catch {
    return false;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "seen");
  } catch {
    // Ignore the error. Then the question shows again on the next visit.
  }
}
