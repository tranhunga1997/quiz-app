'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Lightbulb } from 'lucide-react';
import {
  startQuizSession,
  submitAnswer,
  finishQuizSession,
  type QuizQuestion,
} from '@/actions/quiz-actions';

type Phase = 'config' | 'loading' | 'answering' | 'feedback' | 'transitioning' | 'finishing';

export function QuizRunner({
  deckId,
  mode,
  totalAvailable,
}: {
  deckId: string;
  mode: 'NORMAL' | 'REVIEW';
  totalAvailable: number;
}) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ correctOptionIds: string[]; explanation: string | null } | null>(null);
  const [phase, setPhase] = useState<Phase>('config');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const countOptions = [5, 10, 20].filter((n) => n < totalAvailable);

  async function handleStart(count: number | 'all') {
    setPhase('loading');
    const session = await startQuizSession(deckId, count, mode);
    setAttemptId(session.attemptId);
    setQuestions(session.questions);
    setPhase(session.questions.length > 0 ? 'answering' : 'finishing');
  }

  if (phase === 'config') {
    if (totalAvailable === 0) {
      return <p className="text-ink-muted">Không có câu hỏi nào để làm.</p>;
    }
    return (
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Bạn muốn làm bao nhiêu câu?</h2>
        <div className="flex flex-wrap gap-2">
          {countOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleStart(n)}
              className="rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
            >
              {n} câu
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleStart('all')}
            className="rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
          >
            Tất cả ({totalAvailable})
          </button>
        </div>
      </div>
    );
  }

  const current = questions[index];

  function toggleOption(optionId: string) {
    if (phase !== 'answering' || !current) return;
    if (current.type === 'SINGLE') {
      setSelected([optionId]);
    } else {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    }
  }

  async function handleAnswer() {
    if (!attemptId || !current || selected.length === 0 || isSubmittingAnswer) return;
    setIsSubmittingAnswer(true);
    try {
      const result = await submitAnswer(attemptId, current.id, selected);
      setFeedback({ correctOptionIds: result.correctOptionIds, explanation: result.explanation });
      setPhase('feedback');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  async function handleNext() {
    if (!attemptId) return;
    if (index + 1 >= questions.length) {
      setPhase('finishing');
      await finishQuizSession(attemptId);
      router.push(`/results/${attemptId}`);
      return;
    }
    setPhase('transitioning');
    setTimeout(() => {
      setIndex((i) => i + 1);
      setSelected([]);
      setFeedback(null);
      setPhase('answering');
    }, 200);
  }

  if (phase === 'loading') return <p className="text-ink-muted">Đang tải câu hỏi...</p>;
  if (questions.length === 0) return <p className="text-ink-muted">Không có câu hỏi nào để ôn tập.</p>;
  if (!current) return null;

  const progress = (index + (phase === 'feedback' || phase === 'transitioning' ? 1 : 0)) / questions.length;

  return (
    <div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-accent/10">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <p className="mb-3 text-sm font-medium text-ink-muted">
        Câu {index + 1}/{questions.length}
      </p>

      <div
        key={current.id}
        className={
          phase === 'transitioning'
            ? 'translate-x-[-16px] opacity-0 transition-all duration-200 ease-in'
            : 'translate-x-0 opacity-100 animate-question-slide-in'
        }
      >
        <h2 className="mb-4 text-lg font-bold text-ink">{current.text}</h2>

        <div className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            const isCorrect = feedback?.correctOptionIds.includes(opt.id);
            let stateClass = 'border-2 border-transparent bg-surface shadow-card';
            if (phase === 'feedback') {
              if (isCorrect) stateClass = 'border-2 border-success bg-success-bg';
              else if (isSelected) stateClass = 'border-2 border-danger bg-danger-bg';
            } else if (isSelected) {
              stateClass = 'border-2 border-accent bg-surface';
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={phase === 'feedback'}
                onClick={() => toggleOption(opt.id)}
                className={`flex w-full items-center justify-between rounded-control px-4 py-3 text-left text-sm font-medium text-ink transition duration-300 active:scale-[0.97] ${
                  phase !== 'feedback' ? 'hover:bg-bg' : ''
                } ${stateClass}`}
              >
                <span>{opt.text}</span>
                {phase === 'feedback' && isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check size={12} />
                  </span>
                )}
                {phase === 'feedback' && isSelected && !isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                    <X size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && feedback?.explanation && (
          <p className="mt-3 flex items-start gap-2 rounded-card bg-surface p-4 text-sm text-ink-muted shadow-card">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning-text" />
            {feedback.explanation}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        {phase === 'answering' && (
          <button
            type="button"
            disabled={selected.length === 0 || isSubmittingAnswer}
            onClick={handleAnswer}
            className="rounded-control bg-accent-solid px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97] disabled:opacity-50 disabled:hover:bg-accent-solid"
          >
            Kiểm tra
          </button>
        )}
        {phase === 'feedback' && (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-control bg-accent-solid px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
          >
            {index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  );
}
