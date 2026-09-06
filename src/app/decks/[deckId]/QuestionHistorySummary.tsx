import type { QuestionHistoryStats } from '@/lib/questionHistory';
import { formatVietnameseDate } from '@/lib/formatDate';

/** Per-question answer history: how many times it's been attempted, the
 * correct/wrong split, and a chronological dot timeline (oldest → newest)
 * so a student can see whether they're actually improving on this question. */
export function QuestionHistorySummary({ loading, stats }: { loading: boolean; stats: QuestionHistoryStats | null }) {
  if (loading) {
    return <p className="border-b border-bg bg-bg px-4 py-2 text-xs text-ink-muted">Đang tải lịch sử...</p>;
  }
  if (!stats || stats.totalAttempts === 0) {
    return <p className="border-b border-bg bg-bg px-4 py-2 text-xs text-ink-muted">Chưa từng làm câu này.</p>;
  }

  const recent = stats.entries.slice(-10);
  const last = stats.entries[stats.entries.length - 1];

  return (
    <div className="border-b border-bg bg-bg px-4 py-2 text-xs text-ink-muted">
      <p>
        Đã làm {stats.totalAttempts} lần · Đúng {stats.correctCount} · Sai {stats.wrongCount}
        {last && ` · Gần nhất: ${formatVietnameseDate(last.answeredAt)} (${last.isCorrect ? 'đúng' : 'sai'})`}
      </p>
      <div className="mt-1.5 flex gap-1">
        {recent.map((entry, i) => (
          <span
            key={i}
            title={`${formatVietnameseDate(entry.answeredAt)}: ${entry.isCorrect ? 'Đúng' : 'Sai'}`}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${
              entry.isCorrect ? 'bg-success' : 'bg-danger'
            }`}
          >
            {entry.isCorrect ? '✓' : '✗'}
          </span>
        ))}
      </div>
    </div>
  );
}
