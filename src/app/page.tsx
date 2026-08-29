import Link from 'next/link';
import { listDecksWithStats } from '@/lib/decks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const decks = await listDecksWithStats();
  const decksDue = decks.filter((d) => d.reviewDueCount > 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">📚 Quiz App</h1>
        <Link
          href="/import"
          className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97] hover:bg-accent-dark"
        >
          + Import CSV
        </Link>
      </div>

      {decksDue.length > 0 && (
        <section className="mb-8 space-y-3">
          {decksDue.map((deck) => (
            <Link
              key={deck.id}
              href={`/quiz/${deck.id}?mode=review`}
              className="flex items-center justify-between rounded-card bg-gradient-to-br from-accent to-accent-dark p-5 text-white shadow-card transition active:scale-[0.97]"
            >
              <div>
                <div className="text-sm font-bold">🔥 Ôn câu hay sai</div>
                <div className="mt-1 text-sm text-white/85">
                  {deck.name} · {deck.reviewDueCount} câu cần ôn
                </div>
              </div>
              <span className="rounded-control bg-white px-4 py-2 text-sm font-bold text-accent">Bắt đầu</span>
            </Link>
          ))}
        </section>
      )}

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Bộ đề của bạn</h2>
      {decks.length === 0 ? (
        <p className="text-ink-soft">Chưa có bộ đề nào. Import một file CSV để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {decks.map((deck, i) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="rounded-card bg-white p-4 shadow-card transition active:scale-[0.97]"
            >
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-control text-lg ${
                  i % 2 === 0 ? 'bg-success-bg' : 'bg-warning-bg'
                }`}
              >
                {i % 2 === 0 ? '📗' : '📘'}
              </div>
              <div className="font-bold text-ink">{deck.name}</div>
              <div className="mt-0.5 text-sm text-ink-soft">{deck.questionCount} câu</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
