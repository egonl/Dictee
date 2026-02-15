type ListDialogProps = {
  show: boolean;
  mode: "new" | "edit";
  title: string;
  body: string;
  random: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onRandomChange: (value: boolean) => void;
};

export default function ListDialog({
  show,
  mode,
  title,
  body,
  random,
  error,
  onClose,
  onSave,
  onTitleChange,
  onBodyChange,
  onRandomChange,
}: ListDialogProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>{mode === "edit" ? "Bewerk lijst" : "Nieuwe lijst"}</h3>
        <label htmlFor="new-list-title">Titel</label>
        <input
          id="new-list-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Bijv. Avonturenboek"
        />
        <label htmlFor="new-list-body">
          Woorden/zinnen (een per regel)
        </label>
        <textarea
          id="new-list-body"
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          rows={6}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={random}
            onChange={(event) => onRandomChange(event.target.checked)}
          />
          Willekeurig afspelen
        </label>
        {error && <p className="warn">{error}</p>}
        <div className="dialog-actions">
          <button className="btn secondary" onClick={onClose} type="button">
            Annuleren
          </button>
          <button className="btn primary" onClick={onSave} type="button">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
