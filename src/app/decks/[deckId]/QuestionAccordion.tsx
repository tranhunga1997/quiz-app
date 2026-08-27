'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionWithOptions } from '@/lib/decks';
import { addQuestion, updateQuestion, deleteQuestion } from '@/actions/question-actions';

type EditableOption = { text: string; isCorrect: boolean };
type EditState = { text: string; explanation: string; options: EditableOption[] };

function toEditState(q?: QuestionWithOptions): EditState {
  return {
    text: q?.text ?? '',
    explanation: q?.explanation ?? '',
    options: q
      ? q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
  };
}

export function QuestionAccordion({
  deckId,
  initialQuestions,
}: {
  deckId: string;
  initialQuestions: QuestionWithOptions[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | 'new' | null>(null);
  const [edit, setEdit] = useState<EditState>(toEditState());

  function openExisting(q: QuestionWithOptions) {
    setOpenId(q.id);
    setEdit(toEditState(q));
  }

  function openNew() {
    setOpenId('new');
    setEdit(toEditState());
  }

  function toggleCorrect(index: number) {
    setEdit((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, isCorrect: !o.isCorrect } : o)),
    }));
  }

  async function handleSave() {
    const input = {
      text: edit.text,
      explanation: edit.explanation.trim() === '' ? null : edit.explanation,
      options: edit.options,
    };
    if (openId === 'new') {
      await addQuestion(deckId, input);
    } else if (openId) {
      await updateQuestion(openId, input);
    }
    setOpenId(null);
    router.refresh();
  }

  async function handleDelete(questionId: string) {
    await deleteQuestion(questionId);
    setOpenId(null);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={openNew}
        className="mb-3 rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        + Thêm câu hỏi
      </button>

      <div className="rounded border border-gray-200">
        {initialQuestions.map((q, i) => (
          <div key={q.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => (openId === q.id ? setOpenId(null) : openExisting(q))}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
            >
              <span>
                {i + 1}. {q.text}
              </span>
              <span>{openId === q.id ? '▾' : '▸'}</span>
            </button>
            {openId === q.id && (
              <QuestionEditForm
                edit={edit}
                setEdit={setEdit}
                toggleCorrect={toggleCorrect}
                onSave={handleSave}
                onDelete={() => handleDelete(q.id)}
                onCancel={() => setOpenId(null)}
              />
            )}
          </div>
        ))}
        {openId === 'new' && (
          <div className="border-t">
            <QuestionEditForm
              edit={edit}
              setEdit={setEdit}
              toggleCorrect={toggleCorrect}
              onSave={handleSave}
              onCancel={() => setOpenId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionEditForm({
  edit,
  setEdit,
  toggleCorrect,
  onSave,
  onDelete,
  onCancel,
}: {
  edit: EditState;
  setEdit: (updater: (prev: EditState) => EditState) => void;
  toggleCorrect: (index: number) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2 bg-gray-50 p-4">
      <input
        className="w-full rounded border border-gray-300 px-3 py-1.5"
        placeholder="Nội dung câu hỏi"
        value={edit.text}
        onChange={(e) => setEdit((prev) => ({ ...prev, text: e.target.value }))}
      />
      {edit.options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="checkbox" checked={opt.isCorrect} onChange={() => toggleCorrect(i)} />
          <input
            className="flex-1 rounded border border-gray-300 px-3 py-1.5"
            placeholder={`Lựa chọn ${i + 1}`}
            value={opt.text}
            onChange={(e) =>
              setEdit((prev) => ({
                ...prev,
                options: prev.options.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)),
              }))
            }
          />
        </div>
      ))}
      <input
        className="w-full rounded border border-gray-300 px-3 py-1.5"
        placeholder="Giải thích (tuỳ chọn)"
        value={edit.explanation}
        onChange={(e) => setEdit((prev) => ({ ...prev, explanation: e.target.value }))}
      />
      <div className="flex justify-end gap-2 pt-1">
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded px-3 py-1.5 text-sm text-red-600">
            🗑️ Xoá
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded px-3 py-1.5 text-sm text-gray-600">
          Huỷ
        </button>
        <button type="button" onClick={onSave} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
          Lưu
        </button>
      </div>
    </div>
  );
}
