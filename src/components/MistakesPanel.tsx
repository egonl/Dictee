import { charLabel } from "../utils/charLabel";
import type { MistakeEntry } from "../types";

type MistakesPanelProps = {
  entries: MistakeEntry[];
};

export default function MistakesPanel({ entries }: MistakesPanelProps) {
  return (
    <div className="mistakes-panel">
      {entries.map((mistake, index) => (
        <article key={`${mistake.word}-${index}`}>
          <h3>
            {mistake.word} ← {mistake.answer || "(leeg)"}
          </h3>
          <div className="letter-grid compact">
            {mistake.feedback.map((item, idx) => (
              <span
                key={`${item.expected ?? item.actual}-${idx}`}
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
        </article>
      ))}
      <p className="legend legend-inline">
        <span className="chip correct">Goed</span>
        <span className="chip wrong">Fout</span>
        <span className="chip missing">Mist</span>
        <span className="chip extra">Extra</span>
      </p>
    </div>
  );
}
