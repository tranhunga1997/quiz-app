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
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-600 text-lg font-bold">
        {scorePercent}%
      </div>
      <p className="mb-1">
        {attempt.correctCount}/{attempt.totalQuestions} đúng
      </p>
      {timeTaken && <p className="mb-1 text-sm text-gray-500">⏱ Thời gian: {timeTaken}</p>}

      <ResultDetails missed={missed} />

      <div className="mt-6 flex justify-center gap-2">
        <Link href={`/quiz/${attempt.deckId}?mode=normal`} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          🔁 Làm lại
        </Link>
        <Link href={`/quiz/${attempt.deckId}?mode=review`} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          🔥 Ôn câu sai
        </Link>
        <Link href="/" className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          🏠 Trang chủ
        </Link>
      </div>
    </main>
  );
}
