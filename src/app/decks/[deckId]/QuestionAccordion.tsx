'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Flag, Plus } from 'lucide-react';
import type { QuestionWithOptions } from '@/lib/decks';
import type { QuestionHistoryStats } from '@/lib/questionHistory';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  setQuestionFlag,
  getQuestionHistory,
} from '@/actions/question-actions';
import { QuestionEditForm, type EditState } from './QuestionEditForm';
import { QuestionHistorySummary } from './QuestionHistorySummary';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [history, setHistory] = useState<QuestionHistoryStats | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRequestRef = useRef(0);

  function openExisting(q: QuestionWithOptions) {
    setOpenId(q.id);
    setEdit(toEditState(q));
    setSaveError(null);
    setHistory(null);
    setHistoryLoading(true);
    const requestId = ++historyRequestRef.current;
    getQuestionHistory(q.id).then((stats) => {
      // A stale response (user already switched to another row) is ignored.
      if (historyRequestRef.current !== requestId) return;
      setHistoryLoading(false);
      setHistory(stats);
    });
  }

  function openNew() {
    setOpenId('new');
    setEdit(toEditState());
    setSaveError(null);
    setHistory(null);
    historyRequestRef.current += 1;
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
    try {
      if (openId === 'new') {
        await addQuestion(deckId, input);
      } else if (openId) {
        await updateQuestion(openId, input);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
      return;
    }
    setSaveError(null);
    setOpenId(null);
    router.refresh();
  }

  async function handleDelete(questionId: string) {
    await deleteQuestion(questionId);
    setOpenId(null);
    router.refresh();
  }

  async function handleToggleFlag(question: QuestionWithOptions) {
    await setQuestionFlag(question.id, !question.flagged);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={openNew}
        className="mb-3 flex items-center gap-2 rounded-control bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
      >
        <Plus size={16} />
        Thêm câu hỏi
      </button>

      {(initialQuestions.length > 0 || openId === 'new') && (
        <div className="rounded-card bg-surface shadow-card">
          {initialQuestions.map((q, i) => (
            <div key={q.id} className={`flex items-center border-b border-bg ${openId === q.id ? 'bg-bg' : ''}`}>
              <button
                type="button"
                onClick={() => (openId === q.id ? setOpenId(null) : openExisting(q))}
                className="flex flex-1 items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-bg active:scale-[0.97]"
              >
                <span>
                  {i + 1}. {q.text}
                </span>
                {openId === q.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button
                type="button"
                onClick={() => handleToggleFlag(q)}
                aria-pressed={q.flagged}
                aria-label={q.flagged ? 'Bỏ đánh dấu câu khó' : 'Đánh dấu câu khó'}
                className={`mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-control transition active:scale-[0.97] ${
                  q.flagged ? 'text-warning' : 'text-ink-soft hover:text-ink'
                }`}
              >
                <Flag size={16} fill={q.flagged ? 'currentColor' : 'none'} />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  openId === q.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  {openId === q.id && (
                    <>
                      <QuestionHistorySummary loading={historyLoading} stats={history} />
                      <QuestionEditForm
                        edit={edit}
                        setEdit={setEdit}
                        toggleCorrect={toggleCorrect}
                        onSave={handleSave}
                        onDelete={() => handleDelete(q.id)}
                        onCancel={() => setOpenId(null)}
                        error={saveError}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              openId === 'new' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              {openId === 'new' && (
                <QuestionEditForm
                  edit={edit}
                  setEdit={setEdit}
                  toggleCorrect={toggleCorrect}
                  onSave={handleSave}
                  onCancel={() => setOpenId(null)}
                  error={saveError}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
