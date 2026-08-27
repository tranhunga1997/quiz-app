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
          className="rounded border border-gray-300 px-2 py-1 text-xl font-semibold"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      ) : (
        <h1 className="text-xl font-semibold">
          📘 {name} — {questionCount} câu{' '}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-gray-400 transition active:scale-[0.97] hover:text-gray-700"
          >
            ✏️
          </button>
        </h1>
      )}
      <div className="flex gap-2">
        <Link
          href={`/quiz/${deckId}?mode=normal`}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          ▶ Làm bài
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-red-600 transition active:scale-[0.97] hover:bg-red-50"
        >
          🗑️ Xoá bộ đề
        </button>
      </div>
    </div>
  );
}
