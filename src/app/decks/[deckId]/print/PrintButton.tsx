'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-control bg-accent-solid px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
    >
      <Printer size={16} />
      In / Lưu PDF
    </button>
  );
}
