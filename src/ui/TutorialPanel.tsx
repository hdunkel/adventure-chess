import type { TutorialStep } from "./tutorial";

/** The question on the first visit. */
export function TutorialAsk({ onShow, onSkip }: { onShow: () => void; onSkip: () => void }) {
  return (
    <div className="tour-backdrop">
      <div className="tour-panel tour-center" role="dialog" aria-modal="true" aria-label="Tutorial?">
        <h2 className="tour-title">Tutorial?</h2>
        <p className="tour-text">Learn the app in one minute.</p>
        <div className="tour-buttons">
          <button type="button" className="tour-button tour-quiet" onClick={onSkip}>
            Skip
          </button>
          <button type="button" className="tour-button" onClick={onShow}>
            Show
          </button>
        </div>
      </div>
    </div>
  );
}

interface TutorialProps {
  step: TutorialStep;
  index: number;
  count: number;
  onNext: () => void;
  onClose: () => void;
}

/** One step of the tutorial. A step with a target stays at the top, so the flashed part shows. */
export function Tutorial({ step, index, count, onNext, onClose }: TutorialProps) {
  const last = index === count - 1;
  const place = step.target ? "tour-top" : "tour-center";
  return (
    <div className="tour-backdrop">
      <div className={`tour-panel ${place}`} role="dialog" aria-modal="true" aria-label={`Tutorial: ${step.title}`}>
        <div className="tour-count">
          {index + 1} / {count}
        </div>
        <h2 className="tour-title">{step.title}</h2>
        {step.picture && <PhonePicture />}
        {step.lines.map((line) => (
          <p key={line} className="tour-text">
            {line}
          </p>
        ))}
        <div className="tour-buttons">
          {!last && (
            <button type="button" className="tour-button tour-quiet" onClick={onClose}>
              Skip tutorial
            </button>
          )}
          <button type="button" className="tour-button" onClick={last ? onClose : onNext}>
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The board and the phone, seen from the top. The phone is next to the board. Its top points to Black. */
function PhonePicture() {
  const cells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        cells.push(<rect key={`${row}-${col}`} x={20 + col * 12} y={22 + row * 12} width={12} height={12} />);
      }
    }
  }
  return (
    <svg className="tour-picture" viewBox="0 0 180 140" role="img" aria-label="The phone next to the board">
      <text x={68} y={14} className="tour-picture-label">
        Black
      </text>
      <rect x={20} y={22} width={96} height={96} className="tour-board-light" />
      <g className="tour-board-dark">{cells}</g>
      <rect x={20} y={22} width={96} height={96} className="tour-board-edge" />
      <text x={68} y={134} className="tour-picture-label">
        White
      </text>
      <g transform="translate(132 34)">
        <rect width={34} height={72} rx={6} className="tour-phone" />
        <rect x={3} y={6} width={28} height={28} className="tour-phone-black" />
        <rect x={3} y={34} width={28} height={4} className="tour-phone-strip" />
        <rect x={3} y={38} width={28} height={28} className="tour-phone-white" />
        <rect x={13} y={2} width={8} height={2} rx={1} className="tour-phone-strip" />
      </g>
    </svg>
  );
}
