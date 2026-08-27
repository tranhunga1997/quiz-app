'use client';

import { useState } from 'react';

type Missed = { questionText: string; yourAnswerText: string[]; correctAnswerText: string[] };

export function ResultDetails({ missed }: { missed: Missed[] }) {
  const [open, setOpen] = useState(false);

  if (missed.length === 0) {
    return <p className="mt-3 text-sm text-green-600">🎉 Không có câu nào sai!</p>;
  }

  return (
    <div className="mt-3 text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mx-auto block rounded border border-gray-300 px-3 py-1.5 text-sm transition active:scale-[0.97]"
      >
        📋 {open ? 'Ẩn chi tiết' : 'Xem chi tiết từng câu'}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          {missed.map((m, i) => (
            <div key={i} className="rounded border border-red-200 bg-red-50 p-3">
              <p className="font-medium">{m.questionText}</p>
              <p className="text-red-700">Bạn chọn: {m.yourAnswerText.filter(Boolean).join(', ') || '(không chọn)'}</p>
              <p className="text-green-700">Đáp án đúng: {m.correctAnswerText.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
