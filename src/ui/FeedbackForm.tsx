import { useEffect, useRef, useState } from "react";
import { cards, cardsById } from "../data/cards";
import {
  APP_VERSION,
  THANKS_MS,
  canSend,
  deviceInfo,
  feedbackFields,
  mailtoUrl,
  ratings,
  sendFeedback,
  typeLabels,
} from "./feedback";
import type { FeedbackDraft, FeedbackStart, FeedbackType } from "./feedback";
import { Screen } from "./Screen";

const types = Object.keys(typeLabels) as FeedbackType[];
const sortedCards = [...cards].sort((a, b) => a.name.localeCompare(b.name));

type Status = "edit" | "sending" | "sent" | "failed";

/**
 * The feedback form. It covers the screen and faces the bottom seat.
 * `onDone` closes the form: after "Cancel", or a short time after a successful send.
 */
export function FeedbackForm({ start, onDone }: { start: FeedbackStart; onDone: () => void }) {
  const [draft, setDraft] = useState<FeedbackDraft>({
    type: start.type,
    cardId: start.cardId ?? "",
    rating: null,
    message: "",
    name: "",
    honey: "",
  });
  const [status, setStatus] = useState<Status>("edit");
  const set = (partial: Partial<FeedbackDraft>) => setDraft((d) => ({ ...d, ...partial }));

  // A ref, so that a new `onDone` from a render of the parent does not start the timer again.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(() => done.current(), THANKS_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const fields = () => feedbackFields(draft, cardsById[draft.cardId], { version: APP_VERSION, device: deviceInfo() });

  const submit = async () => {
    setStatus("sending");
    setStatus((await sendFeedback(fields())) ? "sent" : "failed");
  };

  if (status === "sent") {
    return (
      <Screen title="Feedback" onClose={onDone}>
        <p className="feedback-thanks" role="status">
          Thank you
        </p>
      </Screen>
    );
  }

  const sending = status === "sending";
  const sendButton = (
    <button
      type="button"
      className="action-button"
      disabled={sending || !canSend(draft)}
      onClick={() => void submit()}
    >
      {sending ? "Sending…" : "Send"}
    </button>
  );

  return (
    <Screen title="Feedback" onClose={onDone} footer={sendButton} closeLabel="Cancel">
      <fieldset className="feedback-group">
        <legend className="screen-heading">Type</legend>
        <div className="feedback-choices">
          {types.map((t) => (
            <label key={t} className="feedback-choice">
              <input
                type="radio"
                name="feedback-type"
                checked={draft.type === t}
                onChange={() => set({ type: t })}
              />
              {typeLabels[t]}
            </label>
          ))}
        </div>
      </fieldset>

      {draft.type === "card" && (
        <>
          <label className="feedback-field">
            <span className="screen-heading">Card</span>
            <select value={draft.cardId} onChange={(e) => set({ cardId: e.target.value })}>
              <option value="">Select a card</option>
              {sortedCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="feedback-group">
            <legend className="screen-heading">Rating (optional)</legend>
            <div className="feedback-choices">
              {ratings.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="feedback-rating"
                  aria-pressed={draft.rating === r}
                  onClick={() => set({ rating: draft.rating === r ? null : r })}
                >
                  {r}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <label className="feedback-field">
        <span className="screen-heading">Message</span>
        <textarea rows={5} value={draft.message} onChange={(e) => set({ message: e.target.value })} />
      </label>
      <label className="feedback-field">
        <span className="screen-heading">Name (optional)</span>
        <input type="text" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
      </label>
      {/* A field for spam bots. People do not see it. FormSubmit drops a form with a value here. */}
      <input
        type="text"
        name="_honey"
        className="feedback-honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={draft.honey}
        onChange={(e) => set({ honey: e.target.value })}
      />

      {status === "failed" && (
        <div className="feedback-error">
          <p role="alert" className="screen-text">
            The feedback was not sent. Make sure that the device is online and try again. You can also send
            it by e-mail.
          </p>
          <a className="action-button feedback-mail" href={mailtoUrl(fields())}>
            Send by e-mail
          </a>
        </div>
      )}
    </Screen>
  );
}
