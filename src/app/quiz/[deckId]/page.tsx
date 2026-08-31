import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getReviewCandidates } from '@/lib/review';
import { Breadcrumb } from '@/components/Breadcrumb';
import { QuizRunner } from './QuizRunner';

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { deckId: string };
  searchParams: { mode?: string };
}) {
  const mode = searchParams.mode === 'review' ? 'REVIEW' : 'NORMAL';

  const deck = await prisma.deck.findUnique({ where: { id: params.deckId }, select: { name: true } });
  if (!deck) notFound();

  const totalAvailable =
    mode === 'REVIEW'
      ? (await getReviewCandidates(prisma, params.deckId)).length
      : await prisma.question.count({ where: { deckId: params.deckId } });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: deck.name, href: `/decks/${params.deckId}` },
          { label: mode === 'REVIEW' ? 'Ôn tập' : 'Làm bài' },
        ]}
      />
      <QuizRunner deckId={params.deckId} mode={mode} totalAvailable={totalAvailable} />
    </main>
  );
}
