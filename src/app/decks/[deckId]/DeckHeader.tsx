'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Pencil, Play, Shuffle, Trash2 } from 'lucide-react';
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
  const [shuffleQuestions, setShuffleQuestions] = useState(true);

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
          className="rounded-control bg-surface px-3 py-1.5 text-xl font-bold text-ink shadow-card"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      ) : (
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
          <BookOpen size={20} className="shrink-0 text-accent" />
          {name} — {questionCount} câu
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Đổi tên bộ đề"
            className="flex h-11 w-11 items-center justify-center rounded-control text-ink-soft transition active:scale-[0.97] hover:text-ink"
          >
            <Pencil size={16} />
          </button>
        </h1>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShuffleQuestions((s) => !s)}
          aria-pressed={shuffleQuestions}
          aria-label={shuffleQuestions ? 'Tắt trộn câu hỏi' : 'Bật trộn câu hỏi'}
          className={`flex h-11 w-11 items-center justify-center rounded-control transition active:scale-[0.97] ${
            shuffleQuestions
              ? 'bg-accent-solid text-white shadow-accent'
              : 'bg-surface text-ink-soft shadow-card hover:text-ink'
          }`}
        >
          <Shuffle size={16} />
        </button>
        <Link
          href={`/quiz/${deckId}?mode=normal${shuffleQuestions ? '' : '&shuffle=false'}`}
          className="flex items-center gap-2 rounded-control bg-accent-solid px-3 py-1.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          <Play size={16} />
          Làm bài
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-control bg-surface px-3 py-1.5 text-sm font-semibold text-danger-text shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          <Trash2 size={16} />
          Xoá bộ đề
        </button>
      </div>
    </div>
  );
}
