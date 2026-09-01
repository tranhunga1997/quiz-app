import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getReviewCandidates } from '@/lib/review';
import { type QuizMode } from '@/actions/quiz-actions';
import { Breadcrumb } from '@/components/Breadcrumb';
import { QuizRunner } from './QuizRunner';

function parseMode(raw: string | undefined): QuizMode {
  if (raw === 'review') return 'REVIEW';
  if (raw === 'flagged') return 'FLAGGED';
  return 'NORMAL';
}

const MODE_LABEL: Record<QuizMode, string> = {
  NORMAL: 'Làm bài',
  REVIEW: 'Ôn tập',
  FLAGGED: 'Câu đã đánh dấu',
};

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { deckId: string };
  searchParams: { mode?: string; shuffle?: string };
}) {
  const mode = parseMode(searchParams.mode);
  // Absent or anything other than 'false' means shuffled — matches the
  // existing default-on behavior when the deck-detail toggle isn't touched.
  const shuffleQuestions = searchParams.shuffle !== 'false';

  const deck = await prisma.deck.findUnique({ where: { id: params.deckId }, select: { name: true } });
  if (!deck) notFound();

  const totalAvailable =
    mode === 'REVIEW'
      ? (await getReviewCandidates(prisma, params.deckId)).length
      : mode === 'FLAGGED'
        ? await prisma.question.count({ where: { deckId: params.deckId, flagged: true } })
        : await prisma.question.count({ where: { deckId: params.deckId } });

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: deck.name, href: `/decks/${params.deckId}` },
          { label: MODE_LABEL[mode] },
        ]}
      />
      <QuizRunner
        deckId={params.deckId}
        mode={mode}
        totalAvailable={totalAvailable}
        shuffleQuestions={shuffleQuestions}
      />
    </main>
  );
}
