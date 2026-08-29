'use client';

import { useState } from 'react';

type Missed = { questionText: string; yourAnswerText: string[]; correctAnswerText: string[] };

export function ResultDetails({ missed }: { missed: Missed[] }) {
  const [open, setOpen] = useState(false);

  if (missed.length === 0) {
    return <p className="mt-3 text-sm font-medium text-success">🎉 Không có câu nào sai!</p>;
  }

  return (
    <div className="mt-3 text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mx-auto block rounded-control bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
      >
        📋 {open ? 'Ẩn chi tiết' : 'Xem chi tiết từng câu'}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          {missed.map((m, i) => (
            <div key={i} className="rounded-card bg-danger-bg p-4 shadow-card">
              <p className="font-semibold text-ink">{m.questionText}</p>
              <p className="text-danger">Bạn chọn: {m.yourAnswerText.filter(Boolean).join(', ') || '(không chọn)'}</p>
              <p className="text-success">Đáp án đúng: {m.correctAnswerText.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
