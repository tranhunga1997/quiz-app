'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      return <p className="text-gray-500">Không có câu hỏi nào để làm.</p>;
    }
    return (
      <div>
        <h2 className="mb-3 text-lg font-medium">Bạn muốn làm bao nhiêu câu?</h2>
        <div className="flex flex-wrap gap-2">
          {countOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleStart(n)}
              className="rounded border border-gray-300 px-4 py-2 hover:border-blue-500"
            >
              {n} câu
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleStart('all')}
            className="rounded border border-gray-300 px-4 py-2 hover:border-blue-500"
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

  if (phase === 'loading') return <p className="text-gray-500">Đang tải câu hỏi...</p>;
  if (questions.length === 0) return <p className="text-gray-500">Không có câu hỏi nào để ôn tập.</p>;
  if (!current) return null;

  return (
    <div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{
            width: `${((index + (phase === 'feedback' || phase === 'transitioning' ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>
      <p className="mb-3 text-sm text-gray-500">
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
        <h2 className="mb-4 text-lg font-medium">{current.text}</h2>

        <div className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            const isCorrect = feedback?.correctOptionIds.includes(opt.id);
            let colorClass = 'border-gray-300';
            if (phase === 'feedback') {
              if (isCorrect) colorClass = 'border-green-600 bg-green-50';
              else if (isSelected) colorClass = 'border-red-600 bg-red-50';
            } else if (isSelected) {
              colorClass = 'border-blue-500 bg-blue-50';
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={phase === 'feedback'}
                onClick={() => toggleOption(opt.id)}
                className={`block w-full rounded border px-3 py-2 text-left transition-colors duration-300 ${colorClass}`}
              >
                {opt.text}
                {phase === 'feedback' && isCorrect && ' ✓'}
                {phase === 'feedback' && isSelected && !isCorrect && ' ✗'}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && feedback?.explanation && (
          <p className="mt-3 rounded bg-gray-100 p-3 text-sm text-gray-700">💡 {feedback.explanation}</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        {phase === 'answering' && (
          <button
            type="button"
            disabled={selected.length === 0 || isSubmittingAnswer}
            onClick={handleAnswer}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Kiểm tra
          </button>
        )}
        {phase === 'feedback' && (
          <button type="button" onClick={handleNext} className="rounded bg-blue-600 px-4 py-2 text-white">
            {index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  );
}
