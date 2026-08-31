'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseQuizCsv, type CsvParseResult } from '@/lib/csv';
import { submitImport } from '@/actions/import-server-action';

export function ImportForm() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [deckName, setDeckName] = useState('');
  const [preview, setPreview] = useState<CsvParseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setCsvText(text);
    setDeckName(file.name.replace(/\.csv$/i, ''));
    setPreview(parseQuizCsv(text));
    setSubmitError(null);
  }

  async function handleConfirm() {
    if (!csvText || !fileName || !preview || preview.validRows.length === 0) return;
    setSubmitting(true);
    const result = await submitImport(deckName, fileName, csvText);
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    router.push(`/decks/${result.deckId}`);
  }

  return (
    <div>
      <div
        className="mb-4 rounded-card border-2 border-dashed border-accent/25 bg-surface p-8 text-center shadow-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <FileText size={26} className="mx-auto mb-2 text-accent" />
        <span className="text-ink">
          Kéo thả file .csv vào đây, hoặc{' '}
          <label className="cursor-pointer font-semibold text-accent-text underline hover:text-accent-dark">
            chọn file
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
        </span>
        {fileName && <div className="mt-2 text-sm text-ink-soft">{fileName}</div>}
      </div>

      <a
        href="/api/template"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline"
      >
        <Download size={16} />
        Tải file mẫu
      </a>

      {preview && (
        <div>
          <label htmlFor="deckName" className="mb-1.5 block text-xs font-bold text-ink">
            Tên bộ đề
          </label>
          <input
            id="deckName"
            className="mb-3 w-3/5 rounded-control bg-surface px-3 py-1.5 text-sm text-ink shadow-card"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />

          <div className="mb-3 flex gap-2 text-sm">
            <span className="flex items-center gap-1.5 rounded-badge bg-success-bg px-2 py-1 font-semibold text-success-text">
              <CheckCircle2 size={16} />
              {preview.validRows.length} dòng hợp lệ
            </span>
            {preview.errors.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-badge bg-danger-bg px-2 py-1 font-semibold text-danger-text">
                <AlertTriangle size={16} />
                {preview.errors.length} dòng lỗi
              </span>
            )}
          </div>

          <div className="mb-4 max-h-64 overflow-y-auto rounded-card bg-surface shadow-card">
            {preview.validRows.map((row) => (
              <div key={`ok-${row.rowNumber}`} className="flex justify-between border-b border-bg px-3 py-2 text-sm">
                <span className="text-ink">
                  {row.rowNumber}. {row.question}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-success-text">
                  <CheckCircle2 size={16} />
                  OK
                </span>
              </div>
            ))}
            {preview.errors.map((err) => (
              <div key={`err-${err.rowNumber}`} className="flex justify-between border-b border-bg bg-danger-bg px-3 py-2 text-sm">
                <span className="text-ink">
                  Dòng {err.rowNumber}: {err.reason}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-danger-text">
                  <AlertTriangle size={16} />
                  Lỗi
                </span>
              </div>
            ))}
          </div>

          {submitError && (
            <p id="submit-error" role="alert" className="mb-3 text-sm text-danger-text">
              {submitError}
            </p>
          )}

          <button
            type="button"
            disabled={preview.validRows.length === 0 || submitting || !deckName.trim()}
            onClick={handleConfirm}
            aria-describedby={submitError ? 'submit-error' : undefined}
            className="rounded-control bg-accent-solid px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97] disabled:opacity-50 disabled:hover:bg-accent-solid"
          >
            {submitting ? 'Đang import...' : `Import ${preview.validRows.length} câu hợp lệ`}
          </button>
        </div>
      )}
    </div>
  );
}
