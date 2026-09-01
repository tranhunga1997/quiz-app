import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getDeckAttemptHistory, type DeckAttemptSummary } from '@/lib/deckHistory';
import { Breadcrumb } from '@/components/Breadcrumb';

const MODE_LABEL: Record<DeckAttemptSummary['mode'], string> = {
  NORMAL: 'Làm bài',
  REVIEW: 'Ôn tập',
  FLAGGED: 'Câu đã đánh dấu',
};

function formatDate(value: Date): string {
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function scoreBarColor(percent: number): string {
  if (percent >= 80) return 'bg-success';
  if (percent >= 50) return 'bg-warning-text';
  return 'bg-danger';
}

export default async function DeckHistoryPage({ params }: { params: { deckId: string } }) {
  const deck = await prisma.deck.findUnique({ where: { id: params.deckId }, select: { name: true } });
  if (!deck) notFound();

  const attempts = await getDeckAttemptHistory(prisma, params.deckId);

  const average =
    attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length) : null;
  const best = attempts.length > 0 ? Math.max(...attempts.map((a) => a.scorePercent)) : null;
  const latest = attempts.length > 0 ? attempts[attempts.length - 1].scorePercent : null;

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl p-6">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: deck.name, href: `/decks/${params.deckId}` },
          { label: 'Lịch sử làm bài' },
        ]}
      />
      <h1 className="mb-4 text-xl font-bold text-ink">Lịch sử làm bài — {deck.name}</h1>

      {attempts.length === 0 ? (
        <div className="rounded-card bg-surface p-6 text-center shadow-card">
          <p className="mb-4 text-ink-muted">Chưa có lượt làm bài nào đã hoàn thành cho bộ đề này.</p>
          <Link
            href={`/quiz/${params.deckId}?mode=normal`}
            className="inline-flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
          >
            Làm bài ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-card bg-surface p-3 text-center shadow-card">
              <p className="text-xs text-ink-muted">Số lượt</p>
              <p className="text-lg font-bold text-ink">{attempts.length}</p>
            </div>
            <div className="rounded-card bg-surface p-3 text-center shadow-card">
              <p className="text-xs text-ink-muted">Trung bình</p>
              <p className="text-lg font-bold text-ink">{average}%</p>
            </div>
            <div className="rounded-card bg-surface p-3 text-center shadow-card">
              <p className="text-xs text-ink-muted">Cao nhất</p>
              <p className="text-lg font-bold text-ink">{best}%</p>
            </div>
          </div>

          <div className="rounded-card bg-surface shadow-card">
            {attempts.map((attempt, i) => (
              <Link
                key={attempt.id}
                href={`/results/${attempt.id}`}
                className="flex items-center gap-3 border-b border-bg px-4 py-3 transition hover:bg-bg active:scale-[0.99] last:border-b-0"
              >
                <span className="w-6 shrink-0 text-xs font-semibold text-ink-muted">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {formatDate(attempt.finishedAt)} · {MODE_LABEL[attempt.mode]}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-track">
                    <div
                      className={`h-full rounded-full ${scoreBarColor(attempt.scorePercent)}`}
                      style={{ width: `${attempt.scorePercent}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">
                  {attempt.correctCount}/{attempt.totalQuestions}
                </span>
                <span className="w-11 shrink-0 text-right text-sm font-semibold text-ink-muted">
                  {attempt.scorePercent}%
                </span>
              </Link>
            ))}
          </div>

          {latest !== null && best !== null && (
            <p className="mt-3 text-center text-sm text-ink-muted">
              {latest >= best
                ? 'Lượt gần nhất là điểm số cao nhất của bạn cho bộ đề này 🎉'
                : `Lượt gần nhất: ${latest}% · Cao nhất từng đạt: ${best}%`}
            </p>
          )}
        </>
      )}
    </main>
  );
}
