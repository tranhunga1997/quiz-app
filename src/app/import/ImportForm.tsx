'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        className="mb-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        📄 Kéo thả file .csv vào đây, hoặc{' '}
        <label className="cursor-pointer underline">
          chọn file
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {fileName && <div className="mt-2 text-sm text-gray-500">{fileName}</div>}
      </div>

      <a href="/api/template" className="mb-4 inline-block text-sm text-blue-600 underline">
        Tải file mẫu
      </a>

      {preview && (
        <div>
          <input
            className="mb-3 w-3/5 rounded border border-gray-300 px-3 py-1.5"
            placeholder="Tên bộ đề"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />

          <div className="mb-3 flex gap-2 text-sm">
            <span className="rounded border border-green-600 bg-green-50 px-2 py-1 text-green-700">
              ✅ {preview.validRows.length} dòng hợp lệ
            </span>
            {preview.errors.length > 0 && (
              <span className="rounded border border-red-600 bg-red-50 px-2 py-1 text-red-700">
                ⚠️ {preview.errors.length} dòng lỗi
              </span>
            )}
          </div>

          <div className="mb-4 max-h-64 overflow-y-auto rounded border border-gray-200 text-sm">
            {preview.validRows.map((row) => (
              <div key={`ok-${row.rowNumber}`} className="flex justify-between border-b px-3 py-2">
                <span>
                  {row.rowNumber}. {row.question}
                </span>
                <span className="text-green-600">✅ OK</span>
              </div>
            ))}
            {preview.errors.map((err) => (
              <div key={`err-${err.rowNumber}`} className="flex justify-between border-b bg-red-50 px-3 py-2">
                <span>
                  Dòng {err.rowNumber}: {err.reason}
                </span>
                <span className="text-red-600">⚠️ Lỗi</span>
              </div>
            ))}
          </div>

          {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}

          <button
            type="button"
            disabled={preview.validRows.length === 0 || submitting || !deckName.trim()}
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? 'Đang import...' : `Import ${preview.validRows.length} câu hợp lệ`}
          </button>
        </div>
      )}
    </div>
  );
}
