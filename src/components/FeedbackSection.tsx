import { charLabel } from "../utils/charLabel";
import type { LetterFeedback } from "../types";

type FeedbackSectionProps = {
  lastResultCorrect: boolean;
  lastAttempt: string;
  lastCorrectWord: string;
  feedback: LetterFeedback[];
};

export default function FeedbackSection({
  lastResultCorrect,
  lastAttempt,
  lastCorrectWord,
  feedback,
}: FeedbackSectionProps) {
  return (
    <section className="feedback">
      <h2>
        {lastResultCorrect ? "Goed gedaan!" : "Bijna, probeer de volgende!"}
      </h2>
      {!lastResultCorrect && (
        <p className="word-compare">
          <strong>Jij typte:</strong> {lastAttempt || "(leeg)"}
          <br />
          <strong>Goed is:</strong> {lastCorrectWord}
        </p>
      )}
      <div className="letter-grid">
        {feedback.map((item, index) => (
          <span
            key={`${item.expected ?? item.actual}-${index}`}
            className={`letter ${item.state}`}
          >
            {item.state === "extra" && item.actual
              ? `+ ${charLabel(item.actual)}`
              : null}
            {item.state === "missing" && item.expected
              ? `? ${charLabel(item.expected)}`
              : null}
            {(item.state === "correct" || item.state === "wrong") &&
            item.expected
              ? charLabel(item.expected)
              : null}
          </span>
        ))}
      </div>
      <p className="legend">
        <span className="chip correct">Goed</span>
        <span className="chip wrong">Fout</span>
        <span className="chip missing">Mist</span>
        <span className="chip extra">Extra</span>
      </p>
    </section>
  );
}
