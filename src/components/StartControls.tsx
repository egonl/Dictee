type StartControlsProps = {
  listNames: string[];
  activeWordListKey: string;
  customQuestionCount: string;
  continueUntilCorrect: boolean;
  onListChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  onContinueUntilCorrectChange: (value: boolean) => void;
  onStart: () => void;
  onNewList: () => void;
  onEditList: () => void;
  onDeleteList: () => void;
  canDeleteList: boolean;
};

export default function StartControls({
  listNames,
  activeWordListKey,
  customQuestionCount,
  continueUntilCorrect,
  onListChange,
  onCustomChange,
  onContinueUntilCorrectChange,
  onStart,
  onNewList,
  onEditList,
  onDeleteList,
  canDeleteList,
}: StartControlsProps) {
  return (
    <div className="center-block">
      <div className="list-picker">
        <div className="list-picker-row">
          <select
            id="word-list-select"
            value={activeWordListKey}
            onChange={(event) => onListChange(event.target.value)}
          >
            {listNames.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <button className="btn secondary" type="button" onClick={onEditList}>
            Bewerken
          </button>
          <button className="btn secondary" type="button" onClick={onNewList}>
            Nieuw...
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={onDeleteList}
            disabled={!canDeleteList}
          >
            Verwijderen
          </button>
        </div>
      </div>
      <div className="custom-question-picker compact">
        <label htmlFor="custom-count">Vragen per ronde:</label>
        <input
          id="custom-count"
          type="number"
          min={1}
          max={100}
          value={customQuestionCount}
          onChange={(event) => onCustomChange(event.target.value)}
          placeholder="Bijv. 12"
          disabled={continueUntilCorrect}
        />
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={continueUntilCorrect}
          onChange={(event) =>
            onContinueUntilCorrectChange(event.target.checked)
          }
        />
        Of ga door tot alles ten minste één keer goed is
      </label>
      <button className="btn primary" onClick={onStart}>
        Start dictee
      </button>
    </div>
  );
}
