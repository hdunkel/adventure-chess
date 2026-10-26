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
      "A capture can give a player an Adventure Card.",
      "At the start, the players do not draw cards.",
      "After the first capture of a piece that is not a pawn, each capture gives a card.",
      "The player who lost the piece draws the card.",
      "A player in check can also draw a card as a solution.",
    ],
  },
  {
    title: "Phone",
    lines: [
      "Put the phone flat on the table, next to the board.",
      "Use portrait. The top of the screen points to Black, the bottom points to White.",
      "Each player can then read their half of the screen.",
    ],
    picture: true,
  },
  {
    title: "Draw",
    lines: [
      "Press this button when your opponent captures one of your pieces.",
      "The app then shows the new card to you.",
      "Black has the same button on the other half.",
    ],
    target: "draw",
  },
  {
    title: "Hand",
    lines: [
      "The cards that you keep go here. Tap a card to read it again.",
      "Keep until used: use the card one time. Then tap the card and “Use”.",
      "Keep this card: the effect continues while you have the card. Only a card effect removes it.",
    ],
    target: "hand",
  },
  {
    title: "Reminders",
    lines: [
      "Some cards have an effect for a time, for example for your next turn.",
      "These cards stay here, so that you do not forget them.",
      "When the effect stops, tap the card, then “Done”.",
    ],
    target: "reminder",
  },
  {
    title: "Discard pile",
    lines: [
      "A card without keep text has an effect only one time.",
      "After you tap “Done”, the card goes here.",
      "Tap here to see all cards that the players used.",
    ],
    target: "last",
  },
  {
    title: "Middle strip",
    lines: [
      "Deck: the number of cards that are left.",
      "Undo: go back one step, for example after a wrong tap.",
      "?: the rules.",
      "⋯: the menu, with “New game” and this tutorial.",
    ],
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
