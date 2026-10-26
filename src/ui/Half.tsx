import type { Card, Color, Seat } from "../game/types";
import { CardFace } from "./CardFace";
import { colorName } from "./labels";
import type { TourTarget } from "./tutorial";

export type HandKind = "hand" | "reminder";

interface HalfProps {
  seat: Seat;
  color: Color;
  hand: Card[];
  reminders: Card[];
  deckEmpty: boolean;
  onDraw: () => void;
  /** Opens the card view for a hand card or a reminder card. */
  onOpen?: (cardId: string, kind: HandKind) => void;
  /** The part that the tutorial flashes. The reminder row then shows also when it is empty. */
  flash?: TourTarget;
  /** True while the tutorial is open: the half does not accept taps. */
  inert?: boolean;
}

/** The half of one player. The top half is turned 180° to the player on the far side. */
export function Half({ seat, color, hand, reminders, deckEmpty, onDraw, onOpen, flash, inert }: HalfProps) {
  const turned = seat === "top" ? " turned" : "";
  const lit = (target: TourTarget) => (flash === target ? " tour-flash" : "");
  return (
    <section className={`half half-${color}${turned}`} data-seat={seat} inert={inert}>
      <div className="half-cards">
        <div className="half-label">{color.toUpperCase()} · HAND</div>
        <div className={`hand-row${lit("hand")}`} data-empty="Your cards">
          {hand.map((card, i) => (
            <button
              key={`${card.id}-${i}`}
              type="button"
              className="mini-button"
              onClick={() => onOpen?.(card.id, "hand")}
            >
              <CardFace card={card} size="mini" />
            </button>
          ))}
        </div>
        {(reminders.length > 0 || flash === "reminder") && (
          <div className={`hand-row reminder-row${lit("reminder")}`} data-empty="Reminders">
            {reminders.map((card, i) => (
              <button
                key={`${card.id}-${i}`}
                type="button"
                className="mini-button mini-reminder"
                onClick={() => onOpen?.(card.id, "reminder")}
              >
                <span className="reminder-marker">Reminder</span>
                <CardFace card={card} size="mini" />
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className={`draw-button${lit("draw")}`} disabled={deckEmpty} onClick={onDraw}>
        {deckEmpty ? "No more cards" : `${colorName(color)} draws`}
      </button>
    </section>
  );
}
