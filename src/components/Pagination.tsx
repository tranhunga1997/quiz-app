import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function hrefFor(page: number, query: string): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export function Pagination({ page, totalPages, query }: { page: number; totalPages: number; query: string }) {
  if (totalPages <= 1) return null;

  const navClass =
    'flex items-center gap-1.5 rounded-control bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]';
  const disabledClass = 'flex items-center gap-1.5 rounded-control bg-surface px-3 py-2 text-sm font-semibold text-ink-soft opacity-50';

  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1, query)} className={navClass}>
          <ChevronLeft size={16} />
          Trang trước
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ChevronLeft size={16} />
          Trang trước
        </span>
      )}
      <span className="text-sm font-semibold text-ink-muted">
        Trang {page}/{totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1, query)} className={navClass}>
          Trang sau
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Trang sau
          <ChevronRight size={16} />
        </span>
      )}
    </div>
  );
}
