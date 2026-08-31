'use client';

import { useState } from 'react';
import { PartyPopper, ClipboardList } from 'lucide-react';

type Missed = { questionText: string; yourAnswerText: string[]; correctAnswerText: string[] };

export function ResultDetails({ missed }: { missed: Missed[] }) {
  const [open, setOpen] = useState(false);

  if (missed.length === 0) {
    return (
      <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-success-text">
        <PartyPopper size={16} />
        Không có câu nào sai!
      </p>
    );
  }

  return (
    <div className="mt-3 text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mx-auto flex items-center gap-1.5 rounded-control bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
      >
        <ClipboardList size={16} />
        {open ? 'Ẩn chi tiết' : 'Xem chi tiết từng câu'}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          {missed.map((m, i) => (
            <div key={i} className="rounded-card bg-danger-bg p-4 shadow-card">
              <p className="font-semibold text-ink">{m.questionText}</p>
              <p className="text-danger-text">Bạn chọn: {m.yourAnswerText.filter(Boolean).join(', ') || '(không chọn)'}</p>
              <p className="text-success-text">Đáp án đúng: {m.correctAnswerText.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
