'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { searchDeckNames } from '@/actions/deck-actions';

export function DeckFilter({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live autocomplete dropdown only — does NOT touch the URL or the deck grid
  // below. The grid only re-filters on Enter or picking a suggestion (see
  // runSearch), per the confirmed design.
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDeckNames(value).then((results) => {
        setSuggestions(results);
        setOpen(results.length > 0);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function runSearch(query: string) {
    setOpen(false);
    const trimmed = query.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  }

  function selectSuggestion(name: string) {
    setValue(name);
    runSearch(name);
  }

  return (
    <div className="relative mb-3">
      <div className="flex items-center gap-2 rounded-control bg-surface px-3 py-2.5 shadow-card">
        <Search size={16} className="shrink-0 text-ink-soft" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSearch(value);
            if (e.key === 'Escape') setOpen(false);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Tìm bộ đề theo tên..."
          aria-label="Tìm bộ đề theo tên"
          className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-control bg-surface shadow-card">
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(s.name)}
              className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
