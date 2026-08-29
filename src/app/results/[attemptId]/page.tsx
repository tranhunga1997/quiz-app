import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateScorePercent } from '@/lib/scoring';
import { ResultDetails } from './ResultDetails';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  return `${minutes} phút ${seconds} giây`;
}

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: params.attemptId },
    include: {
      deck: true,
      answers: { include: { question: { include: { options: true } } } },
    },
  });
  if (!attempt) notFound();

  const scorePercent = calculateScorePercent(attempt.correctCount, attempt.totalQuestions);
  const timeTaken = attempt.finishedAt
    ? formatDuration(attempt.finishedAt.getTime() - attempt.startedAt.getTime())
    : null;
  const missed = attempt.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionText: a.question.text,
      yourAnswerText: (JSON.parse(a.selectedOptionIds) as string[]).map(
        (id) => a.question.options.find((o) => o.id === id)?.text ?? ''
      ),
      correctAnswerText: a.question.options.filter((o) => o.isCorrect).map((o) => o.text),
    }));

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div
        className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full shadow-card"
        style={{ background: `conic-gradient(#22C55E ${scorePercent}%, #E1E4F5 0)` }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-extrabold text-ink">
          {scorePercent}%
        </div>
      </div>
      <p className="mb-1 text-sm font-semibold text-ink">
        {attempt.correctCount}/{attempt.totalQuestions} đúng
      </p>
      {timeTaken && <p className="mb-1 text-sm text-ink-muted">⏱ Thời gian: {timeTaken}</p>}

      <ResultDetails missed={missed} />

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href={`/quiz/${attempt.deckId}?mode=normal`}
          className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          🔁 Làm lại
        </Link>
        <Link
          href={`/quiz/${attempt.deckId}?mode=review`}
          className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          🔥 Ôn câu sai
        </Link>
        <Link
          href="/"
          className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          🏠 Trang chủ
        </Link>
      </div>
    </main>
  );
}
