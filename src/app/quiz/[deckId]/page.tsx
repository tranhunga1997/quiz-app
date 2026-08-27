import { prisma } from '@/lib/db';
import { getReviewCandidates } from '@/lib/review';
import { QuizRunner } from './QuizRunner';

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { deckId: string };
  searchParams: { mode?: string };
}) {
  const mode = searchParams.mode === 'review' ? 'REVIEW' : 'NORMAL';

  const totalAvailable =
    mode === 'REVIEW'
      ? (await getReviewCandidates(prisma, params.deckId)).length
      : await prisma.question.count({ where: { deckId: params.deckId } });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <QuizRunner deckId={params.deckId} mode={mode} totalAvailable={totalAvailable} />
    </main>
  );
}
