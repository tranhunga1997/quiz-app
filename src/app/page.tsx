import Link from 'next/link';
import { listDecksWithStats } from '@/lib/decks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const decks = await listDecksWithStats();
  const decksDue = decks.filter((d) => d.reviewDueCount > 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">📚 Quiz App</h1>
        <Link href="/import" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
          + Import CSV
        </Link>
      </div>

      {decksDue.length > 0 && (
        <section className="mb-8 space-y-2">
          {decksDue.map((deck) => (
            <Link
              key={deck.id}
              href={`/quiz/${deck.id}?mode=review`}
              className="block rounded-lg border border-orange-300 bg-orange-50 p-4 hover:bg-orange-100"
            >
              🔥 Ôn câu hay sai — {deck.name} ({deck.reviewDueCount} câu cần ôn)
            </Link>
          ))}
        </section>
      )}

      <h2 className="mb-3 text-sm font-medium uppercase text-gray-500">Bộ đề của bạn</h2>
      {decks.length === 0 ? (
        <p className="text-gray-500">Chưa có bộ đề nào. Import một file CSV để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="rounded-lg border border-gray-200 p-4 hover:border-gray-400"
            >
              <div className="font-medium">{deck.name}</div>
              <div className="text-sm text-gray-500">{deck.questionCount} câu</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
