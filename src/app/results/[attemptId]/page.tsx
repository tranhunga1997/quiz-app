import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateScorePercent } from '@/lib/scoring';
import { ResultDetails } from './ResultDetails';

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
        {attempt.correctCount} đúng / {attempt.totalQuestions - attempt.correctCount} sai
      </p>

      <ResultDetails missed={missed} />

      <div className="mt-6 flex justify-center gap-2">
        <Link href={`/quiz/${attempt.deckId}?mode=normal`} className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          🔁 Làm lại
        </Link>
        <Link href="/" className="rounded border border-gray-300 px-3 py-1.5 text-sm">
          🏠 Trang chủ
        </Link>
      </div>
    </main>
  );
}
