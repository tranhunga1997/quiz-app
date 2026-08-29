# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin all 5 existing quiz-app screens with a new visual design language (colors, typography, radius, shadows, and a few small component patterns) inspired by a referenced Figma dashboard — no layout, navigation, logic, or animation-timing changes.

**Architecture:** Extend `tailwind.config.ts` with the spec's design tokens (colors, radius, shadow, font) and wire the font via `next/font/google` in the root layout. Then, file by file, replace each screen's Tailwind utility classes with the new tokens/patterns — every file's JSX structure, state, event handlers, and existing animation classes (`active:scale-[0.97]`, `transition`, the accordion's `grid-template-rows` transition, the question `animate-question-slide-in` keyframe, the progress bar's `transition-all`) stay exactly as they are. This is a pure `className`-level change plus one config file; no new components, no new routes, no schema/action changes.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS 3.4, `next/font/google` (Plus Jakarta Sans).

**Spec:** `docs/specs/2026-08-29-visual-redesign.md`

## Global Constraints

- Scope is visual only — no changes to layout, navigation, routes, Server Actions, Prisma schema, or the animation *timings* the app spec already fixed (color-fade feedback, horizontal slide, instant score reveal, `prefers-reduced-motion` support). Only the static colors/shapes those animations transition between are changing.
- Design tokens (exact values, from the spec): `accent` `#4F6EF7` / `accent-dark` `#6C7FF0`, `bg` `#EEF0FA`, `ink` `#1A1A2E` / `ink-soft` `#8A8FA3`, `success` `#22C55E` / `success-bg` `#E8F9EF`, `warning` `#F5A623` / `warning-bg` `#FEF3E2`, `danger` `#F4645A` / `danger-bg` `#FDECEC`. Radius: `card` `20px`, `control` `12px`, `badge` `8px`. Shadow: `card` `0 8px 24px rgba(27,37,89,0.08)`, `accent` `0 4px 12px rgba(79,110,247,0.35)`. Font: Plus Jakarta Sans.
- Plus Jakarta Sans **must** load with both `latin` and `vietnamese` subsets — every string of user-facing copy in this app is Vietnamese with diacritics (à, á, ạ, ả, ã, ă, â, đ, ê, ô, ơ, ư, …); a `latin`-only subset would silently fall back to the system font for every accented character.
- Every task's only verification is: `npx tsc --noEmit && npm run build` succeeds, and the existing test suite (`npm test`, `npm run test:e2e`) still passes **unchanged** — no test file is modified by this plan. If a task's className changes alter a button's accessible text or an option's DOM text content in a way that breaks an existing test assertion, that is a signal the change went further than "visual only" and needs to be reconsidered, not the test fixed.
- Stick to the 3 defined radius tokens (`card`/`control`/`badge`) and 2 shadow tokens (`card`/`accent`) everywhere — do not introduce new one-off radius or shadow values even where the source mockups' inline HTML used a slightly different pixel value for illustration.

---

## Task 1: Design tokens — Tailwind config, font, root layout

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind color keys `accent`/`accent-dark`, `bg`, `ink`/`ink-soft`, `success`/`success-bg`, `warning`/`warning-bg`, `danger`/`danger-bg`; radius keys `rounded-card`/`rounded-control`/`rounded-badge`; shadow keys `shadow-card`/`shadow-accent`; the default `font-sans` utility now resolves to Plus Jakarta Sans. Every later task (2–6) consumes these exact class names.

- [ ] **Step 1: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#4F6EF7',
          dark: '#6C7FF0',
        },
        bg: '#EEF0FA',
        ink: {
          DEFAULT: '#1A1A2E',
          soft: '#8A8FA3',
        },
        success: {
          DEFAULT: '#22C55E',
          bg: '#E8F9EF',
        },
        warning: {
          DEFAULT: '#F5A623',
          bg: '#FEF3E2',
        },
        danger: {
          DEFAULT: '#F4645A',
          bg: '#FDECEC',
        },
      },
      borderRadius: {
        card: '20px',
        control: '12px',
        badge: '8px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(27,37,89,0.08)',
        accent: '0 4px 12px rgba(79,110,247,0.35)',
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Personal quiz & flashcard app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it builds and Vietnamese text renders correctly**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds with zero errors. Then run `npm run dev`, open `http://localhost:3000`, and visually confirm the "📚 Quiz App" heading and any Vietnamese copy on the (still old-styled) Home page render in Plus Jakarta Sans with all diacritics intact (no tofu boxes, no visible fallback-font mismatch) — the font is now applied app-wide via `font-sans` on `<body>` even though no screen's own classes have changed yet.

- [ ] **Step 4: Run the existing test suite to confirm no regression**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all existing unit tests still pass (42/42 as of the last plan), build clean. (E2E suite is unaffected by a font/token-only config change and doesn't need re-running per task, only in the final Task 7 verification.)

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/app/layout.tsx
git commit -m "feat: add visual-redesign design tokens (colors, radius, shadow, font)"
```

---

## Task 2: Home screen redesign

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: design tokens from Task 1.
- No interface changes — `listDecksWithStats()`'s shape and every link's `href` are unchanged.

- [ ] **Step 1: Replace `src/app/page.tsx`**

```tsx
import Link from 'next/link';
import { listDecksWithStats } from '@/lib/decks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const decks = await listDecksWithStats();
  const decksDue = decks.filter((d) => d.reviewDueCount > 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">📚 Quiz App</h1>
        <Link
          href="/import"
          className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97] hover:bg-accent-dark"
        >
          + Import CSV
        </Link>
      </div>

      {decksDue.length > 0 && (
        <section className="mb-8 space-y-3">
          {decksDue.map((deck) => (
            <Link
              key={deck.id}
              href={`/quiz/${deck.id}?mode=review`}
              className="flex items-center justify-between rounded-card bg-gradient-to-br from-accent to-accent-dark p-5 text-white shadow-card transition active:scale-[0.97]"
            >
              <div>
                <div className="text-sm font-bold">🔥 Ôn câu hay sai</div>
                <div className="mt-1 text-sm text-white/85">
                  {deck.name} · {deck.reviewDueCount} câu cần ôn
                </div>
              </div>
              <span className="rounded-control bg-white px-4 py-2 text-sm font-bold text-accent">Bắt đầu</span>
            </Link>
          ))}
        </section>
      )}

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Bộ đề của bạn</h2>
      {decks.length === 0 ? (
        <p className="text-ink-soft">Chưa có bộ đề nào. Import một file CSV để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {decks.map((deck, i) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="rounded-card bg-white p-4 shadow-card transition active:scale-[0.97]"
            >
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-control text-lg ${
                  i % 2 === 0 ? 'bg-success-bg' : 'bg-warning-bg'
                }`}
              >
                {i % 2 === 0 ? '📗' : '📘'}
              </div>
              <div className="font-bold text-ink">{deck.name}</div>
              <div className="mt-0.5 text-sm text-ink-soft">{deck.questionCount} câu</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

(The alternating `success-bg`/`warning-bg` deck-icon tile by index is purely a visual variety touch, matching the mockup — it carries no semantic meaning, so alternating by array index is fine.)

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm the route summary still shows `/` as `ƒ` (Dynamic) — the `export const dynamic = 'force-dynamic'` line must still be present.

- [ ] **Step 3: Manually verify against the approved mockup**

Run `npm run dev`, open `http://localhost:3000` with at least one imported deck and one with `reviewDueCount > 0` present (import a test CSV if the dev database is empty). Confirm: the review-due banner renders as a blue gradient card with a white "Bắt đầu" pill, deck tiles render as white shadowed cards with a colored icon tile, and the whole page background is the light `bg` tone (not white).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: apply visual redesign to Home screen"
```

---

## Task 3: Quiz session screen redesign

**Files:**
- Modify: `src/app/quiz/[deckId]/QuizRunner.tsx`

**Interfaces:**
- Consumes: design tokens from Task 1.
- No interface changes — the `Phase` state machine, `QuizRunner`'s props, and every function (`handleStart`, `toggleOption`, `handleAnswer`, `handleNext`) are byte-for-byte unchanged. Only `className` values and the options' internal JSX layout (text + a separate badge span instead of concatenated text) change.

- [ ] **Step 1: Replace `src/app/quiz/[deckId]/QuizRunner.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  startQuizSession,
  submitAnswer,
  finishQuizSession,
  type QuizQuestion,
} from '@/actions/quiz-actions';

type Phase = 'config' | 'loading' | 'answering' | 'feedback' | 'transitioning' | 'finishing';

export function QuizRunner({
  deckId,
  mode,
  totalAvailable,
}: {
  deckId: string;
  mode: 'NORMAL' | 'REVIEW';
  totalAvailable: number;
}) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ correctOptionIds: string[]; explanation: string | null } | null>(null);
  const [phase, setPhase] = useState<Phase>('config');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const countOptions = [5, 10, 20].filter((n) => n < totalAvailable);

  async function handleStart(count: number | 'all') {
    setPhase('loading');
    const session = await startQuizSession(deckId, count, mode);
    setAttemptId(session.attemptId);
    setQuestions(session.questions);
    setPhase(session.questions.length > 0 ? 'answering' : 'finishing');
  }

  if (phase === 'config') {
    if (totalAvailable === 0) {
      return <p className="text-ink-soft">Không có câu hỏi nào để làm.</p>;
    }
    return (
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Bạn muốn làm bao nhiêu câu?</h2>
        <div className="flex flex-wrap gap-2">
          {countOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleStart(n)}
              className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
            >
              {n} câu
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleStart('all')}
            className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
          >
            Tất cả ({totalAvailable})
          </button>
        </div>
      </div>
    );
  }

  const current = questions[index];

  function toggleOption(optionId: string) {
    if (phase !== 'answering' || !current) return;
    if (current.type === 'SINGLE') {
      setSelected([optionId]);
    } else {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    }
  }

  async function handleAnswer() {
    if (!attemptId || !current || selected.length === 0 || isSubmittingAnswer) return;
    setIsSubmittingAnswer(true);
    try {
      const result = await submitAnswer(attemptId, current.id, selected);
      setFeedback({ correctOptionIds: result.correctOptionIds, explanation: result.explanation });
      setPhase('feedback');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  async function handleNext() {
    if (!attemptId) return;
    if (index + 1 >= questions.length) {
      setPhase('finishing');
      await finishQuizSession(attemptId);
      router.push(`/results/${attemptId}`);
      return;
    }
    setPhase('transitioning');
    setTimeout(() => {
      setIndex((i) => i + 1);
      setSelected([]);
      setFeedback(null);
      setPhase('answering');
    }, 200);
  }

  if (phase === 'loading') return <p className="text-ink-soft">Đang tải câu hỏi...</p>;
  if (questions.length === 0) return <p className="text-ink-soft">Không có câu hỏi nào để ôn tập.</p>;
  if (!current) return null;

  return (
    <div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-accent/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
          style={{
            width: `${((index + (phase === 'feedback' || phase === 'transitioning' ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>
      <p className="mb-3 text-sm font-medium text-ink-soft">
        Câu {index + 1}/{questions.length}
      </p>

      <div
        key={current.id}
        className={
          phase === 'transitioning'
            ? 'translate-x-[-16px] opacity-0 transition-all duration-200 ease-in'
            : 'translate-x-0 opacity-100 animate-question-slide-in'
        }
      >
        <h2 className="mb-4 text-lg font-bold text-ink">{current.text}</h2>

        <div className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            const isCorrect = feedback?.correctOptionIds.includes(opt.id);
            let stateClass = 'bg-white shadow-card';
            if (phase === 'feedback') {
              if (isCorrect) stateClass = 'border-2 border-success bg-success-bg';
              else if (isSelected) stateClass = 'border-2 border-danger bg-danger-bg';
            } else if (isSelected) {
              stateClass = 'border-2 border-accent bg-white';
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={phase === 'feedback'}
                onClick={() => toggleOption(opt.id)}
                className={`flex w-full items-center justify-between rounded-control px-4 py-3 text-left text-sm font-medium text-ink transition duration-300 active:scale-[0.97] ${stateClass}`}
              >
                <span>{opt.text}</span>
                {phase === 'feedback' && isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-xs text-white">
                    ✓
                  </span>
                )}
                {phase === 'feedback' && isSelected && !isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-xs text-white">
                    ✗
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && feedback?.explanation && (
          <p className="mt-3 rounded-card bg-white p-4 text-sm text-ink-soft shadow-card">💡 {feedback.explanation}</p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        {phase === 'answering' && (
          <button
            type="button"
            disabled={selected.length === 0 || isSubmittingAnswer}
            onClick={handleAnswer}
            className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97] disabled:opacity-50"
          >
            Kiểm tra
          </button>
        )}
        {phase === 'feedback' && (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97]"
          >
            {index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm `/quiz/[deckId]` still shows as `ƒ` (Dynamic).

- [ ] **Step 3: Run the E2E test — this is the real regression check for this file**

Run: `npm run test:e2e` (provision `e2e.db` first if missing: `DATABASE_URL="file:./e2e.db" npx prisma db push`)
Expected: 1 passed. The E2E test drives this exact screen (session-size picker, answer selection, "Kiểm tra"/"Câu tiếp theo" buttons) — if the restructured option JSX (text + separate badge span instead of concatenated text) broke anything the test's selectors depend on, it will fail here. If it fails, read the failure carefully before changing anything — compare what selector it expected against what the new markup actually renders, and fix the markup (not the test) to preserve the same clickable text/role.

- [ ] **Step 4: Commit**

```bash
git add "src/app/quiz/[deckId]/QuizRunner.tsx"
git commit -m "feat: apply visual redesign to Quiz session screen"
```

---

## Task 4: Results screen redesign

**Files:**
- Modify: `src/app/results/[attemptId]/page.tsx`
- Modify: `src/app/results/[attemptId]/ResultDetails.tsx`

**Interfaces:**
- Consumes: design tokens from Task 1.
- No interface changes — `formatDuration`, the Prisma query, `calculateScorePercent`, and `ResultDetails`'s `missed` prop shape are all unchanged.

- [ ] **Step 1: Replace `src/app/results/[attemptId]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { calculateScorePercent } from '@/lib/scoring';
import { ResultDetails } from './ResultDetails';

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  return `${minutes} phút ${seconds} giây`;
}

export default async function ResultsPage({ params }: { params: { attemptId: string } }) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: params.attemptId },
    include: {
      deck: true,
      answers: { include: { question: { include: { options: true } } } },
    },
  });
  if (!attempt) notFound();

  const scorePercent = calculateScorePercent(attempt.correctCount, attempt.totalQuestions);
  const timeTaken = attempt.finishedAt
    ? formatDuration(attempt.finishedAt.getTime() - attempt.startedAt.getTime())
    : null;
  const missed = attempt.answers
    .filter((a) => !a.isCorrect)
    .map((a) => ({
      questionText: a.question.text,
      yourAnswerText: (JSON.parse(a.selectedOptionIds) as string[]).map(
        (id) => a.question.options.find((o) => o.id === id)?.text ?? ''
      ),
      correctAnswerText: a.question.options.filter((o) => o.isCorrect).map((o) => o.text),
    }));

  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <div
        className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full shadow-card"
        style={{ background: `conic-gradient(#22C55E ${scorePercent}%, #E1E4F5 0)` }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-extrabold text-ink">
          {scorePercent}%
        </div>
      </div>
      <p className="mb-1 text-sm font-semibold text-ink">
        {attempt.correctCount}/{attempt.totalQuestions} đúng
      </p>
      {timeTaken && <p className="mb-1 text-sm text-ink-soft">⏱ Thời gian: {timeTaken}</p>}

      <ResultDetails missed={missed} />

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href={`/quiz/${attempt.deckId}?mode=normal`}
          className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
        >
          🔁 Làm lại
        </Link>
        <Link
          href={`/quiz/${attempt.deckId}?mode=review`}
          className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97]"
        >
          🔥 Ôn câu sai
        </Link>
        <Link
          href="/"
          className="rounded-control bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
        >
          🏠 Trang chủ
        </Link>
      </div>
    </main>
  );
}
```

(The score ring uses the raw hex values `#22C55E`/`#E1E4F5` in an inline `style`, not Tailwind classes — the conic-gradient's stop position depends on the dynamic `scorePercent`, which can't be expressed as a static Tailwind utility. `#22C55E` matches the `success` token exactly; `#E1E4F5` is the ring's unfilled-track color, a light neutral not otherwise in the token table, used only here.)

- [ ] **Step 2: Replace `src/app/results/[attemptId]/ResultDetails.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify it builds**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm `/results/[attemptId]` still shows as `ƒ` (Dynamic).

- [ ] **Step 4: Run the E2E test**

Run: `npm run test:e2e`
Expected: 1 passed — the test asserts on the score `%` text and the "Xem chi tiết từng câu" button, both unchanged in content, only re-styled.

- [ ] **Step 5: Commit**

```bash
git add "src/app/results/[attemptId]/page.tsx" "src/app/results/[attemptId]/ResultDetails.tsx"
git commit -m "feat: apply visual redesign to Results screen"
```

---

## Task 5: Deck detail (question accordion) screen redesign

**Files:**
- Modify: `src/app/decks/[deckId]/DeckHeader.tsx`
- Modify: `src/app/decks/[deckId]/QuestionAccordion.tsx`

**Interfaces:**
- Consumes: design tokens from Task 1.
- No interface changes — every handler, state variable, and prop in both files is unchanged; only `className` values and the correct-answer checkbox row's wrapping markup change (still a native `<input type="checkbox">`, just wrapped in a styled `<label>`).

- [ ] **Step 1: Replace `src/app/decks/[deckId]/DeckHeader.tsx`**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
          className="rounded-control bg-white px-3 py-1.5 text-xl font-bold text-ink shadow-card"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      ) : (
        <h1 className="text-xl font-bold text-ink">
          📘 {name} — {questionCount} câu{' '}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-ink-soft transition active:scale-[0.97] hover:text-ink"
          >
            ✏️
          </button>
        </h1>
      )}
      <div className="flex gap-2">
        <Link
          href={`/quiz/${deckId}?mode=normal`}
          className="rounded-control bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97]"
        >
          ▶ Làm bài
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-control bg-white px-3 py-1.5 text-sm font-semibold text-danger shadow-card transition active:scale-[0.97]"
        >
          🗑️ Xoá bộ đề
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/app/decks/[deckId]/QuestionAccordion.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuestionWithOptions } from '@/lib/decks';
import { addQuestion, updateQuestion, deleteQuestion } from '@/actions/question-actions';

type EditableOption = { text: string; isCorrect: boolean };
type EditState = { text: string; explanation: string; options: EditableOption[] };

function toEditState(q?: QuestionWithOptions): EditState {
  return {
    text: q?.text ?? '',
    explanation: q?.explanation ?? '',
    options: q
      ? q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
  };
}

export function QuestionAccordion({
  deckId,
  initialQuestions,
}: {
  deckId: string;
  initialQuestions: QuestionWithOptions[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | 'new' | null>(null);
  const [edit, setEdit] = useState<EditState>(toEditState());
  const [saveError, setSaveError] = useState<string | null>(null);

  function openExisting(q: QuestionWithOptions) {
    setOpenId(q.id);
    setEdit(toEditState(q));
    setSaveError(null);
  }

  function openNew() {
    setOpenId('new');
    setEdit(toEditState());
    setSaveError(null);
  }

  function toggleCorrect(index: number) {
    setEdit((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, isCorrect: !o.isCorrect } : o)),
    }));
  }

  async function handleSave() {
    const input = {
      text: edit.text,
      explanation: edit.explanation.trim() === '' ? null : edit.explanation,
      options: edit.options,
    };
    try {
      if (openId === 'new') {
        await addQuestion(deckId, input);
      } else if (openId) {
        await updateQuestion(openId, input);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
      return;
    }
    setSaveError(null);
    setOpenId(null);
    router.refresh();
  }

  async function handleDelete(questionId: string) {
    await deleteQuestion(questionId);
    setOpenId(null);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={openNew}
        className="mb-3 rounded-control bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
      >
        + Thêm câu hỏi
      </button>

      <div className="rounded-card bg-white shadow-card">
        {initialQuestions.map((q, i) => (
          <div key={q.id} className="border-b border-bg last:border-b-0">
            <button
              type="button"
              onClick={() => (openId === q.id ? setOpenId(null) : openExisting(q))}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink transition active:scale-[0.97] ${
                openId === q.id ? 'bg-bg' : ''
              }`}
            >
              <span>
                {i + 1}. {q.text}
              </span>
              <span>{openId === q.id ? '▾' : '▸'}</span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                openId === q.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                {openId === q.id && (
                  <QuestionEditForm
                    edit={edit}
                    setEdit={setEdit}
                    toggleCorrect={toggleCorrect}
                    onSave={handleSave}
                    onDelete={() => handleDelete(q.id)}
                    onCancel={() => setOpenId(null)}
                    error={saveError}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            openId === 'new' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            {openId === 'new' && (
              <QuestionEditForm
                edit={edit}
                setEdit={setEdit}
                toggleCorrect={toggleCorrect}
                onSave={handleSave}
                onCancel={() => setOpenId(null)}
                error={saveError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionEditForm({
  edit,
  setEdit,
  toggleCorrect,
  onSave,
  onDelete,
  onCancel,
  error,
}: {
  edit: EditState;
  setEdit: (updater: (prev: EditState) => EditState) => void;
  toggleCorrect: (index: number) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel: () => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-2 bg-bg p-4">
      <input
        className="w-full rounded-control bg-white px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Nội dung câu hỏi"
        value={edit.text}
        onChange={(e) => setEdit((prev) => ({ ...prev, text: e.target.value }))}
      />
      {edit.options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-2 rounded-control px-3 py-2 ${
            opt.isCorrect ? 'border-2 border-success bg-success-bg' : 'border-2 border-transparent bg-white shadow-card'
          }`}
        >
          <input type="checkbox" checked={opt.isCorrect} onChange={() => toggleCorrect(i)} />
          <input
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none"
            placeholder={`Lựa chọn ${i + 1}`}
            value={opt.text}
            onChange={(e) =>
              setEdit((prev) => ({
                ...prev,
                options: prev.options.map((o, idx) => (idx === i ? { ...o, text: e.target.value } : o)),
              }))
            }
          />
        </label>
      ))}
      <input
        className="w-full rounded-control bg-white px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Giải thích (tuỳ chọn)"
        value={edit.explanation}
        onChange={(e) => setEdit((prev) => ({ ...prev, explanation: e.target.value }))}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-badge px-3 py-1.5 text-sm font-semibold text-danger transition active:scale-[0.97]"
          >
            🗑️ Xoá
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-badge px-3 py-1.5 text-sm font-semibold text-ink-soft transition active:scale-[0.97]"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-badge bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97]"
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm `/decks/[deckId]` still shows as `ƒ` (Dynamic).

- [ ] **Step 4: Manually verify the accordion still opens/closes/saves correctly**

Run `npm run dev`, open a deck's detail page, click a question row to expand it, confirm the checkbox pills correctly show green when checked, edit a question's text and click Lưu, confirm it saves and the row collapses. Click "+ Thêm câu hỏi", add a question with zero correct answers checked, click Lưu, confirm the inline error still appears (this exercises the try/catch error path added in an earlier fix — must still work with the new markup).

- [ ] **Step 5: Commit**

```bash
git add "src/app/decks/[deckId]/DeckHeader.tsx" "src/app/decks/[deckId]/QuestionAccordion.tsx"
git commit -m "feat: apply visual redesign to Deck detail screen"
```

---

## Task 6: Import screen redesign

**Files:**
- Modify: `src/app/import/ImportForm.tsx`

**Interfaces:**
- Consumes: design tokens from Task 1.
- No interface changes — `handleFile`, `handleConfirm`, and all state are unchanged.

- [ ] **Step 1: Replace `src/app/import/ImportForm.tsx`**

```tsx
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
        className="mb-4 rounded-card border-2 border-dashed border-accent/25 bg-white p-8 text-center shadow-card"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <span className="text-ink">
          📄 Kéo thả file .csv vào đây, hoặc{' '}
          <label className="cursor-pointer font-semibold text-accent underline">
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
        </span>
        {fileName && <div className="mt-2 text-sm text-ink-soft">{fileName}</div>}
      </div>

      <a href="/api/template" className="mb-4 inline-block text-sm font-semibold text-accent">
        📥 Tải file mẫu
      </a>

      {preview && (
        <div>
          <input
            className="mb-3 w-3/5 rounded-control bg-white px-3 py-1.5 text-sm text-ink shadow-card"
            placeholder="Tên bộ đề"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />

          <div className="mb-3 flex gap-2 text-sm">
            <span className="rounded-badge bg-success-bg px-2 py-1 font-semibold text-success">
              ✅ {preview.validRows.length} dòng hợp lệ
            </span>
            {preview.errors.length > 0 && (
              <span className="rounded-badge bg-danger-bg px-2 py-1 font-semibold text-danger">
                ⚠️ {preview.errors.length} dòng lỗi
              </span>
            )}
          </div>

          <div className="mb-4 max-h-64 overflow-y-auto rounded-card bg-white shadow-card">
            {preview.validRows.map((row) => (
              <div key={`ok-${row.rowNumber}`} className="flex justify-between border-b border-bg px-3 py-2 text-sm">
                <span className="text-ink">
                  {row.rowNumber}. {row.question}
                </span>
                <span className="font-semibold text-success">✅ OK</span>
              </div>
            ))}
            {preview.errors.map((err) => (
              <div key={`err-${err.rowNumber}`} className="flex justify-between border-b border-bg px-3 py-2 text-sm">
                <span className="text-ink">
                  Dòng {err.rowNumber}: {err.reason}
                </span>
                <span className="font-semibold text-danger">⚠️ Lỗi</span>
              </div>
            ))}
          </div>

          {submitError && <p className="mb-3 text-sm text-danger">{submitError}</p>}

          <button
            type="button"
            disabled={preview.validRows.length === 0 || submitting || !deckName.trim()}
            onClick={handleConfirm}
            className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97] disabled:opacity-50"
          >
            {submitting ? 'Đang import...' : `Import ${preview.validRows.length} câu hợp lệ`}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm `/import` still shows as `○` (Static) — this page has no server-side data fetch and shouldn't have become dynamic.

- [ ] **Step 3: Run the E2E test — this is the real regression check for this file**

Run: `npm run test:e2e`
Expected: 1 passed. The E2E test uploads a CSV, checks for the `input[type="file"]`, fills the deck-name field via `getByPlaceholder('Tên bộ đề')`, and clicks the `Import N câu hợp lệ` button — all of these selectors must still resolve against the restyled markup.

- [ ] **Step 4: Commit**

```bash
git add src/app/import/ImportForm.tsx
git commit -m "feat: apply visual redesign to Import screen"
```

---

## Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite**

Run: `npm test`
Expected: all tests pass, same count as before this plan (42/42 as of the last recorded run) — this plan adds no new tests and should change no existing one.

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e` (re-provision `e2e.db` first if it's missing: `DATABASE_URL="file:./e2e.db" npx prisma db push`)
Expected: 1 passed.

- [ ] **Step 3: Full clean build**

Run: `rm -rf .next && npx tsc --noEmit && npm run build`
Expected: zero errors. Confirm the route summary matches the pre-redesign shape exactly: `/` `ƒ`, `/decks/[deckId]` `ƒ`, `/quiz/[deckId]` `ƒ`, `/results/[attemptId]` `ƒ`, `/import` `○`, `/api/template` `○`.

- [ ] **Step 4: Manual walkthrough against the approved mockups**

Run `npm run dev`, and walk through all 5 screens in a real browser: Home (with at least one deck that has `reviewDueCount > 0`), Import, Deck detail (open/edit/save a question), Quiz session (answer a question right and one wrong, watch the feedback colors and slide transition), Results (view score, expand missed-question detail, click "Ôn câu sai"). Compare each against its approved mockup direction from the brainstorming session. Confirm Vietnamese diacritics render correctly everywhere (this is the one thing a screenshot-only review can miss if the font's `vietnamese` subset were ever dropped).

- [ ] **Step 5: Commit any final fixups, or confirm nothing further to commit**

If the manual walkthrough finds nothing wrong, there's nothing to commit at this step — Task 7 is verification-only. If it does find something, fix it in the relevant screen's own file and commit with a message like `fix: <what was wrong>`, scoped to that one file.
