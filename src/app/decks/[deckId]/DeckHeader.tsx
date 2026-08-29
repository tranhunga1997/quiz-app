'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { renameDeck, deleteDeck } from '@/actions/deck-actions';

export function DeckHeader({
  deckId,
  name,
  questionCount,
}: {
  deckId: string;
  name: string;
  questionCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);

  async function handleRename() {
    if (draftName.trim() && draftName !== name) {
      await renameDeck(deckId, draftName.trim());
      router.refresh();
    }
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Xoá bộ đề "${name}" và toàn bộ ${questionCount} câu hỏi?`)) return;
    await deleteDeck(deckId);
    router.push('/');
  }

  return (
    <div className="mb-4 flex items-center justify-between">
      {editing ? (
        <input
          autoFocus
          className="rounded-control bg-white px-3 py-1.5 text-xl font-bold text-ink shadow-card"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      ) : (
        <h1 className="text-xl font-bold text-ink">
          📘 {name} — {questionCount} câu{' '}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-ink-soft transition active:scale-[0.97] hover:text-ink"
          >
            ✏️
          </button>
        </h1>
      )}
      <div className="flex gap-2">
        <Link
          href={`/quiz/${deckId}?mode=normal`}
          className="rounded-control bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          ▶ Làm bài
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-control bg-white px-3 py-1.5 text-sm font-semibold text-danger-text shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          🗑️ Xoá bộ đề
        </button>
      </div>
    </div>
  );
}
