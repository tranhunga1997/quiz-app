import { Trash2 } from 'lucide-react';

export type EditableOption = { text: string; isCorrect: boolean };
export type EditState = { text: string; explanation: string; options: EditableOption[] };

export function QuestionEditForm({
  edit,
  setEdit,
  toggleCorrect,
  onSave,
  onDelete,
  onCancel,
  error,
}: {
  edit: EditState;
  setEdit: (updater: (prev: EditState) => EditState) => void;
  toggleCorrect: (index: number) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-2 bg-bg p-4">
      <input
        className="w-full rounded-control bg-surface px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Nội dung câu hỏi"
        value={edit.text}
        onChange={(e) => setEdit((prev) => ({ ...prev, text: e.target.value }))}
      />
      {edit.options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-2 rounded-control px-3 py-2 ${
            opt.isCorrect ? 'border-2 border-success bg-success-bg' : 'border-2 border-transparent bg-surface shadow-card'
          }`}
        >
          <input type="checkbox" checked={opt.isCorrect} onChange={() => toggleCorrect(i)} />
          <input
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none focus:ring-2 focus:ring-accent/40 focus:rounded-badge"
            placeholder={`Lựa chọn ${i + 1}`}
            value={opt.text}
            onChange={(e) =>
              setEdit((prev) => ({
                ...prev,
                options: prev.options.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)),
              }))
            }
          />
        </label>
      ))}
      <input
        className="w-full rounded-control bg-surface px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Giải thích (tuỳ chọn)"
        value={edit.explanation}
        onChange={(e) => setEdit((prev) => ({ ...prev, explanation: e.target.value }))}
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <div className="flex justify-end gap-2.5 pt-1">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-[44px] items-center gap-1.5 rounded-badge px-3 text-sm font-semibold text-danger transition hover:bg-bg active:scale-[0.97]"
          >
            <Trash2 size={16} />
            Xoá
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-[44px] items-center rounded-badge px-3 text-sm font-semibold text-ink-soft transition hover:bg-bg active:scale-[0.97]"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex min-h-[44px] items-center rounded-badge bg-accent-solid px-3 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
