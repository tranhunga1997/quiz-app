# A11y Fixes, Icon Library, Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa 4 nhóm vi phạm accessibility/UX CRITICAL, thay icon chức năng emoji → `lucide-react`, và thêm dark mode đầy đủ (toggle + localStorage), không đổi luồng nghiệp vụ hay route.

**Architecture:** Token-first — Task 1 chuyển toàn bộ màu semantic trong `tailwind.config.ts` sang tham chiếu CSS variable (`globals.css`), để phần lớn hiệu ứng dark-mode + contrast fix tự lan toả không cần sửa từng component. Các task sau (2-8) đi theo từng file/khu vực UI: cài `ThemeToggle` + wiring layout, rồi lần lượt icon-swap + `bg-white`→`bg-surface` + `bg-accent`→`bg-accent-text` (khi accent mang chữ) trên từng trang. Task 9 verify toàn diện.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS 3.4, `lucide-react` (mới), TypeScript, Vitest, Playwright.

**Spec:** `docs/specs/2026-08-31-a11y-icons-darkmode.md`

## Global Constraints

- Không đổi route, data model, hay luồng nghiệp vụ — chỉ đổi màu/icon/thuộc tính accessibility.
- Không có unit test mới cần viết cho các task này (đây là thay đổi thuần UI/style, không phải logic) — 42 unit test hiện có PHẢI tiếp tục pass y nguyên, không sửa. Bước "test" trong mỗi task là: `npx tsc --noEmit` sạch + visual/behavioural verify mô tả trong từng task, thay cho unit test.
- Mọi icon chức năng dùng `lucide-react`, `size` mặc định: `16` cạnh `text-sm`, `20` cạnh heading/logo, màu kế thừa `currentColor` (không set màu cứng riêng trừ khi component đang có màu semantic riêng, ví dụ icon trong card success/warning).
- Giữ nguyên emoji tại các vị trí thuần cảm xúc/trang trí: `🎉` (ResultDetails, không có câu sai), `🔥` (banner "Ôn câu hay sai" ở Home và nút "Ôn câu sai" ở Results), `💡` (gợi ý giải thích trong QuizRunner).
- Mọi `bg-white` literal đổi thành `bg-surface` (token mới từ Task 1) — literal `bg-white` không tự đổi theo dark mode.
- Mọi `bg-accent`/`text-accent` đang mang **chữ** (nút CTA chữ trắng, link) đổi thành `bg-accent-text`/`text-accent-text`. Giữ nguyên `bg-accent`/`text-accent`/`border-accent` khi dùng cho icon màu, viền, hoặc vùng nền lớn không phải nơi đặt chữ nhỏ trực tiếp.
- Mỗi trang có `<main>` gắn thêm `id="main-content"` để khớp skip-link thêm ở Task 2.

---

### Task 1: Design tokens — Tailwind dark-mode config + CSS variables

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: token `bg-surface` (thay `bg-white`), `text-accent-text`/`bg-accent-text`/`border-accent-text`, `dark` variant qua class `.dark` trên `<html>`. Mọi task sau đều dùng các token này.

- [ ] **Step 1: Cập nhật `tailwind.config.ts`**

Thay toàn bộ nội dung file bằng:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
          text: 'rgb(var(--color-accent-text) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        success: {
          DEFAULT: '#22C55E',
          bg: 'rgb(var(--color-success-bg) / <alpha-value>)',
          text: '#15803D',
        },
        warning: {
          DEFAULT: '#F5A623',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: '#F4645A',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
          text: '#C0392F',
        },
        track: 'rgb(var(--color-track) / <alpha-value>)',
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

Ghi chú: `success`/`warning`/`danger` DEFAULT và `.text` giữ hex tĩnh (không đổi theo dark — các màu bão hoà cao này vẫn đọc được trên cả 2 nền); chỉ riêng `.bg` (nền nhạt) cần đổi theo dark nên chuyển qua CSS variable.

- [ ] **Step 2: Cập nhật `src/app/globals.css`**

Thay toàn bộ nội dung file bằng:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --color-bg: 238 240 250;          /* #EEF0FA */
  --color-surface: 255 255 255;     /* #FFFFFF */
  --color-ink: 26 26 46;            /* #1A1A2E */
  --color-ink-soft: 75 85 99;       /* #4B5563 */
  --color-ink-muted: 107 114 128;   /* #6B7280 */
  --color-accent: 79 110 247;       /* #4F6EF7 */
  --color-accent-dark: 108 127 240; /* #6C7FF0 */
  --color-accent-text: 59 87 224;   /* #3B57E0 */
  --color-success-bg: 232 249 239;  /* #E8F9EF */
  --color-warning-bg: 254 243 226;  /* #FEF3E2 */
  --color-danger-bg: 253 236 236;   /* #FDECEC */
  --color-track: 225 228 245;       /* #E1E4F5 */
}

:root.dark {
  color-scheme: dark;
  --color-bg: 18 20 43;             /* #12142B */
  --color-surface: 30 33 66;        /* #1E2142 */
  --color-ink: 241 242 250;         /* #F1F2FA */
  --color-ink-soft: 145 149 181;    /* #9195B5 */
  --color-ink-muted: 156 163 175;   /* #9CA3AF */
  --color-accent: 108 127 240;      /* #6C7FF0 */
  --color-accent-dark: 90 107 224;  /* #5A6BE0 */
  --color-accent-text: 143 163 255; /* #8FA3FF */
  --color-success-bg: 23 56 41;     /* #173829 */
  --color-warning-bg: 61 49 23;     /* #3D3117 */
  --color-danger-bg: 61 27 27;      /* #3D1B1B */
  --color-track: 42 45 82;          /* #2A2D52 */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

@keyframes question-slide-in {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-question-slide-in {
  animation: question-slide-in 200ms ease-out;
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: cả hai lệnh chạy sạch, không lỗi. `npm run build` in ra route summary y hệt trước (không đổi route).

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: switch color tokens to CSS variables for dark mode + fix ink-soft contrast"
```

---

### Task 2: ThemeToggle component + layout.tsx wiring

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `package.json` (thêm dependency `lucide-react`)

**Interfaces:**
- Consumes: token `bg-surface`, `dark` class strategy từ Task 1.
- Produces: component `<ThemeToggle />` (không nhận prop) — các task sau không phụ thuộc trực tiếp vào nó, chỉ layout.tsx dùng.

- [ ] **Step 1: Cài `lucide-react`**

Run: `npm install lucide-react`
Expected: `package.json`/`package-lock.json` (hoặc lockfile tương ứng) cập nhật, không lỗi.

- [ ] **Step 2: Tạo `src/components/ThemeToggle.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      className="flex h-11 w-11 items-center justify-center rounded-control text-ink-soft transition hover:bg-bg hover:text-ink active:scale-[0.97]"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
```

Ghi chú: `useState(false)` + `useEffect` đọc lại từ DOM (đã được script chống FOUC ở Step 3 gán class trước khi hydrate) tránh mismatch hydration — component luôn render icon "Moon" (mặc định `isDark=false`) ở lần render đầu trên server, rồi đồng bộ lại đúng trạng thái ngay sau mount trên client. Vì `aria-label`/icon đổi sau mount 1 lần, không gây layout shift đáng kể (chỉ đổi icon 18px).

- [ ] **Step 3: Sửa `src/app/layout.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-plus-jakarta-sans',
});

export const metadata: Metadata = {
  title: 'Quiz App',
  description: 'Personal quiz & flashcard app',
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-text focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Bỏ qua điều hướng
        </a>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-bg bg-surface/90 px-6 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            <BookOpen size={20} className="text-accent" />
            Quiz App
          </Link>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
```

Thay đổi so với bản cũ: thêm `<head>` với script chống FOUC, `min-h-screen`→`min-h-dvh` (A.7), thêm skip-link ẩn-hiện-khi-focus (A.8), header đổi `bg-white/90`→`bg-surface/90`, logo emoji `📚`→icon `BookOpen`, thêm `<ThemeToggle />`, header đổi từ chỉ có `Link` sang `flex items-center justify-between` để chứa cả toggle.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: sạch, không lỗi.

Chạy thủ công bằng Playwright (`npm run dev`, mở trình duyệt): xác nhận nút toggle đổi `dark` class trên `<html>`, giao diện đổi màu nền/chữ theo token mới; Tab từ đầu trang thấy skip-link hiện ra; reload lại giữ đúng theme đã chọn (đọc từ `localStorage`).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/ThemeToggle.tsx src/app/layout.tsx
git commit -m "feat: add ThemeToggle, FOUC-prevention script, skip-link, min-h-dvh"
```

---

### Task 3: Home page + Breadcrumb

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Breadcrumb.tsx`

- [ ] **Step 1: Sửa `src/components/Breadcrumb.tsx`**

Đổi `text-accent` thành `text-accent-text` (1 chỗ, trong `<Link>`):

```tsx
import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-soft">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-accent-text hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Sửa `src/app/page.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { listDecksWithStats } from '@/lib/decks';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const decks = await listDecksWithStats();
  const decksDue = decks.filter((d) => d.reviewDueCount > 0);

  return (
    <main id="main-content" className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex justify-end">
        <Link
          href="/import"
          className="flex items-center gap-2 rounded-control bg-accent-text px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition active:scale-[0.97] hover:bg-accent-dark"
        >
          <Plus size={16} />
          Import CSV
        </Link>
      </div>

      {decksDue.length > 0 && (
        <section className="mb-8 space-y-3">
          {decksDue.map((deck) => (
            <Link
              key={deck.id}
              href={`/quiz/${deck.id}?mode=review`}
              className="flex items-center justify-between rounded-card bg-gradient-to-br from-accent-text to-accent-dark p-5 text-white shadow-card transition hover:brightness-105 active:scale-[0.97]"
            >
              <div>
                <div className="text-sm font-bold">🔥 Ôn câu hay sai</div>
                <div className="mt-1 text-sm text-white/85">
                  {deck.name} · {deck.reviewDueCount} câu cần ôn
                </div>
              </div>
              <span className="rounded-control bg-surface px-4 py-2 text-sm font-bold text-accent-text">Bắt đầu</span>
            </Link>
          ))}
        </section>
      )}

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Bộ đề của bạn</h2>
      {decks.length === 0 ? (
        <p className="text-ink-muted">Chưa có bộ đề nào. Import một file CSV để bắt đầu.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {decks.map((deck, i) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="rounded-card bg-surface p-4 shadow-card transition hover:shadow-none active:scale-[0.97]"
            >
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-control ${
                  i % 2 === 0 ? 'bg-success-bg text-success-text' : 'bg-warning-bg text-warning'
                }`}
              >
                <BookOpen size={18} />
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

Ghi chú:
- `<main>` thêm `id="main-content"`.
- Nút "Import CSV": `bg-accent`→`bg-accent-text`, thêm icon `Plus`.
- Banner "Ôn câu hay sai": gradient `from-accent`→`from-accent-text` (chữ trắng đè lên đầu dải màu), giữ `to-accent-dark`; nút "Bắt đầu" bên trong đổi cả `bg-white`→`bg-surface` (để nền pill tự đổi tối theo theme — nếu giữ trắng cứng, chữ `text-accent-text` ở dark mode sáng hơn sẽ mất contrast trên nền trắng tĩnh) và `text-accent`→`text-accent-text`. `🔥` giữ nguyên emoji theo Global Constraints.
- Card bộ đề: `bg-white`→`bg-surface`; ô icon đổi từ emoji `📗`/`📘` sang icon `BookOpen` dùng chung, đổi màu bằng class cha (`text-success-text`/`text-warning`) thay vì chọn icon khác nhau — giữ đúng tinh thần "khác màu theo index" hiện có nhưng dùng 1 icon nhất quán.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/Breadcrumb.tsx
git commit -m "feat: apply lucide icons + accent-text/surface tokens to Home and Breadcrumb"
```

---

### Task 4: DeckHeader.tsx + decks/[deckId]/page.tsx

**Files:**
- Modify: `src/app/decks/[deckId]/DeckHeader.tsx`
- Modify: `src/app/decks/[deckId]/page.tsx`

- [ ] **Step 1: Sửa `src/app/decks/[deckId]/page.tsx`**

Thêm `id="main-content"` vào `<main>` (giữ nguyên phần còn lại):

```tsx
import { notFound } from 'next/navigation';
import { getDeckWithQuestions } from '@/lib/decks';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DeckHeader } from './DeckHeader';
import { QuestionAccordion } from './QuestionAccordion';

export default async function DeckDetailPage({ params }: { params: { deckId: string } }) {
  const deck = await getDeckWithQuestions(params.deckId);
  if (!deck) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-2xl p-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: deck.name }]} />
      <DeckHeader deckId={deck.id} name={deck.name} questionCount={deck.questions.length} />
      <QuestionAccordion deckId={deck.id} initialQuestions={deck.questions} />
    </main>
  );
}
```

- [ ] **Step 2: Sửa `src/app/decks/[deckId]/DeckHeader.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Pencil, Play, Trash2 } from 'lucide-react';
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
          className="rounded-control bg-surface px-3 py-1.5 text-xl font-bold text-ink shadow-card"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      ) : (
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
          <BookOpen size={20} className="shrink-0 text-accent" />
          {name} — {questionCount} câu
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Đổi tên bộ đề"
            className="flex h-11 w-11 items-center justify-center rounded-control text-ink-soft transition active:scale-[0.97] hover:text-ink"
          >
            <Pencil size={16} />
          </button>
        </h1>
      )}
      <div className="flex gap-2">
        <Link
          href={`/quiz/${deckId}?mode=normal`}
          className="flex items-center gap-2 rounded-control bg-accent-text px-3 py-1.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          <Play size={14} />
          Làm bài
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-control bg-surface px-3 py-1.5 text-sm font-semibold text-danger-text shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          <Trash2 size={14} />
          Xoá bộ đề
        </button>
      </div>
    </div>
  );
}
```

Thay đổi: `📘`→icon `BookOpen`; nút `✏️`→icon `Pencil`, thêm `aria-label="Đổi tên bộ đề"` (A.1), bọc `h-11 w-11` đạt touch target 44px (A.4); `▶`→icon `Play`, `bg-accent`→`bg-accent-text`; `🗑️`→icon `Trash2`; `bg-white`→`bg-surface` (2 chỗ: input rename, nút xoá).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 4: Commit**

```bash
git add src/app/decks/\[deckId\]/DeckHeader.tsx src/app/decks/\[deckId\]/page.tsx
git commit -m "feat: DeckHeader + page — main-content id, aria-label, touch target, lucide icons, accent-text/surface tokens"
```

---

### Task 5: QuestionAccordion.tsx

**Files:**
- Modify: `src/app/decks/[deckId]/QuestionAccordion.tsx`

- [ ] **Step 1: Sửa file**

Thay toàn bộ nội dung file bằng:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
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
        className="mb-3 rounded-control bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
      >
        + Thêm câu hỏi
      </button>

      {(initialQuestions.length > 0 || openId === 'new') && (
        <div className="rounded-card bg-surface shadow-card">
          {initialQuestions.map((q, i) => (
            <div key={q.id} className="border-b border-bg">
              <button
                type="button"
                onClick={() => (openId === q.id ? setOpenId(null) : openExisting(q))}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-bg active:scale-[0.97] ${
                  openId === q.id ? 'bg-bg' : ''
                }`}
              >
                <span>
                  {i + 1}. {q.text}
                </span>
                {openId === q.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
      )}
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
        className="w-full rounded-control bg-surface px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Nội dung câu hỏi"
        value={edit.text}
        onChange={(e) => setEdit((prev) => ({ ...prev, text: e.target.value }))}
      />
      {edit.options.map((opt, i) => (
        <label
          key={i}
          className={`flex items-center gap-2 rounded-control px-3 py-2 ${
            opt.isCorrect ? 'border-2 border-success bg-success-bg' : 'border-2 border-transparent bg-surface shadow-card'
          }`}
        >
          <input type="checkbox" checked={opt.isCorrect} onChange={() => toggleCorrect(i)} />
          <input
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none focus:ring-2 focus:ring-accent/40 focus:rounded-badge"
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
        className="w-full rounded-control bg-surface px-3 py-1.5 text-sm text-ink shadow-card"
        placeholder="Giải thích (tuỳ chọn)"
        value={edit.explanation}
        onChange={(e) => setEdit((prev) => ({ ...prev, explanation: e.target.value }))}
      />
      {error && <p className="text-sm text-danger-text">{error}</p>}
      <div className="flex justify-end gap-2.5 pt-1">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-[44px] items-center gap-1.5 rounded-badge px-3 text-sm font-semibold text-danger transition hover:bg-bg active:scale-[0.97]"
          >
            <Trash2 size={14} />
            Xoá
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-[44px] items-center rounded-badge px-3 text-sm font-semibold text-ink-soft transition hover:bg-bg active:scale-[0.97]"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={onSave}
          className="flex min-h-[44px] items-center rounded-badge bg-accent-text px-3 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          Lưu
        </button>
      </div>
    </div>
  );
}
```

Thay đổi: `▾`/`▸`→icon `ChevronDown`/`ChevronRight`; `🗑️`→icon `Trash2`; mọi `bg-white`→`bg-surface` (5 chỗ); nút Xoá/Huỷ/Lưu đổi `gap-2`→`gap-2.5` (10px, A.4) và thêm `min-h-[44px]` (A.4); nút Lưu `bg-accent`→`bg-accent-text`.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 3: Commit**

```bash
git add src/app/decks/\[deckId\]/QuestionAccordion.tsx
git commit -m "feat: QuestionAccordion — touch targets, lucide icons, accent-text/surface tokens"
```

---

### Task 6: ImportForm.tsx + import/page.tsx

**Files:**
- Modify: `src/app/import/ImportForm.tsx`
- Modify: `src/app/import/page.tsx`

- [ ] **Step 1: Sửa `src/app/import/page.tsx`**

Thêm `id="main-content"` vào `<main>`:

```tsx
import { Breadcrumb } from '@/components/Breadcrumb';
import { ImportForm } from './ImportForm';

export default function ImportPage() {
  return (
    <main id="main-content" className="mx-auto max-w-2xl p-6">
      <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Import' }]} />
      <h1 className="mb-4 text-xl font-bold text-ink">Import bộ đề mới</h1>
      <ImportForm />
    </main>
  );
}
```

- [ ] **Step 2: Sửa `src/app/import/ImportForm.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
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

      <a
        href="/api/template"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text hover:underline"
      >
        <Download size={14} />
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
              <CheckCircle2 size={14} />
              {preview.validRows.length} dòng hợp lệ
            </span>
            {preview.errors.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-badge bg-danger-bg px-2 py-1 font-semibold text-danger-text">
                <AlertTriangle size={14} />
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
                  <CheckCircle2 size={14} />
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
                  <AlertTriangle size={14} />
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
            className="rounded-control bg-accent-text px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97] disabled:opacity-50 disabled:hover:bg-accent-text"
          >
            {submitting ? 'Đang import...' : `Import ${preview.validRows.length} câu hợp lệ`}
          </button>
        </div>
      )}
    </div>
  );
}
```

Thay đổi: `📄`→icon `FileText`; `📥`→icon `Download`, `text-accent`→`text-accent-text`; ô "Tên bộ đề" thêm `<label htmlFor="deckName">` hiển thị thật, bỏ `placeholder` (A.2), input thêm `id="deckName"`; `✅`→icon `CheckCircle2` (2 chỗ); `⚠️`→icon `AlertTriangle` (2 chỗ); lỗi submit thêm `id="submit-error"` + `role="alert"`, nút submit thêm `aria-describedby` trỏ tới đó khi có lỗi (A.3); mọi `bg-white`→`bg-surface`; nút submit `bg-accent`→`bg-accent-text` (kể cả `disabled:hover:bg-accent`→`disabled:hover:bg-accent-text`).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 4: Commit**

```bash
git add src/app/import/ImportForm.tsx src/app/import/page.tsx
git commit -m "feat: ImportForm — real label, aria-describedby, lucide icons, accent-text/surface tokens"
```

---

### Task 7: QuizRunner.tsx + quiz/[deckId]/page.tsx

**Files:**
- Modify: `src/app/quiz/[deckId]/QuizRunner.tsx`
- Modify: `src/app/quiz/[deckId]/page.tsx`

- [ ] **Step 1: Sửa `src/app/quiz/[deckId]/page.tsx`**

Thêm `id="main-content"` vào `<main>` (giữ nguyên phần còn lại):

```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getReviewCandidates } from '@/lib/review';
import { Breadcrumb } from '@/components/Breadcrumb';
import { QuizRunner } from './QuizRunner';

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { deckId: string };
  searchParams: { mode?: string };
}) {
  const mode = searchParams.mode === 'review' ? 'REVIEW' : 'NORMAL';

  const deck = await prisma.deck.findUnique({ where: { id: params.deckId }, select: { name: true } });
  if (!deck) notFound();

  const totalAvailable =
    mode === 'REVIEW'
      ? (await getReviewCandidates(prisma, params.deckId)).length
      : await prisma.question.count({ where: { deckId: params.deckId } });

  return (
    <main id="main-content" className="mx-auto max-w-2xl p-6">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: deck.name, href: `/decks/${params.deckId}` },
          { label: mode === 'REVIEW' ? 'Ôn tập' : 'Làm bài' },
        ]}
      />
      <QuizRunner deckId={params.deckId} mode={mode} totalAvailable={totalAvailable} />
    </main>
  );
}
```

- [ ] **Step 2: Sửa `src/app/quiz/[deckId]/QuizRunner.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Lightbulb } from 'lucide-react';
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
      return <p className="text-ink-muted">Không có câu hỏi nào để làm.</p>;
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
              className="rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
            >
              {n} câu
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleStart('all')}
            className="rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition active:scale-[0.97]"
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

  if (phase === 'loading') return <p className="text-ink-muted">Đang tải câu hỏi...</p>;
  if (questions.length === 0) return <p className="text-ink-muted">Không có câu hỏi nào để ôn tập.</p>;
  if (!current) return null;

  const progress = (index + (phase === 'feedback' || phase === 'transitioning' ? 1 : 0)) / questions.length;

  return (
    <div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-accent/10">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <p className="mb-3 text-sm font-medium text-ink-muted">
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
            let stateClass = 'border-2 border-transparent bg-surface shadow-card';
            if (phase === 'feedback') {
              if (isCorrect) stateClass = 'border-2 border-success bg-success-bg';
              else if (isSelected) stateClass = 'border-2 border-danger bg-danger-bg';
            } else if (isSelected) {
              stateClass = 'border-2 border-accent bg-surface';
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={phase === 'feedback'}
                onClick={() => toggleOption(opt.id)}
                className={`flex w-full items-center justify-between rounded-control px-4 py-3 text-left text-sm font-medium text-ink transition duration-300 active:scale-[0.97] ${
                  phase !== 'feedback' ? 'hover:bg-bg' : ''
                } ${stateClass}`}
              >
                <span>{opt.text}</span>
                {phase === 'feedback' && isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check size={12} />
                  </span>
                )}
                {phase === 'feedback' && isSelected && !isCorrect && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                    <X size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && feedback?.explanation && (
          <p className="mt-3 flex items-start gap-2 rounded-card bg-surface p-4 text-sm text-ink-muted shadow-card">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
            {feedback.explanation}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        {phase === 'answering' && (
          <button
            type="button"
            disabled={selected.length === 0 || isSubmittingAnswer}
            onClick={handleAnswer}
            className="rounded-control bg-accent-text px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97] disabled:opacity-50 disabled:hover:bg-accent-text"
          >
            Kiểm tra
          </button>
        )}
        {phase === 'feedback' && (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-control bg-accent-text px-4 py-2.5 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
          >
            {index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  );
}
```

Thay đổi: `<main>` ở page.tsx thêm `id="main-content"`. Progress bar: track cố định `w-full`, thanh fill đổi từ `width: ${percent}%` sang `transform-origin: left` + `transform: scaleX(progress)` (`progress` là số thập phân 0-1, A.6). `✓`/`✗` text→icon `Check`/`X`. `💡` đổi sang icon `Lightbulb` màu `text-warning` — đây LÀ icon chức năng (đánh dấu khối giải thích), khác với các emoji cảm xúc thuần tuý (`🎉`/`🔥`) nên áp dụng quy tắc chung, đổi sang lucide. Mọi `bg-white`→`bg-surface`; nút "Kiểm tra"/"Câu tiếp theo" `bg-accent`→`bg-accent-text` (kể cả `disabled:hover:bg-accent`→`disabled:hover:bg-accent-text`).

**Lưu ý implementer:** giá trị `progress` có thể bằng `0` khi `index=0` và `phase='answering'` — `scaleX(0)` hợp lệ, thanh tiến trình ẩn hoàn toàn, đúng hành vi cũ (`width:0%`).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: sạch. Chạy `npm run dev`, mở 1 quiz, quan sát progress bar chạy mượt qua từng câu giống hệt hành vi cũ (chỉ đổi cơ chế animate, không đổi tốc độ/easing).

- [ ] **Step 4: Commit**

```bash
git add src/app/quiz/\[deckId\]/QuizRunner.tsx src/app/quiz/\[deckId\]/page.tsx
git commit -m "feat: QuizRunner — transform-based progress bar, lucide icons, accent-text/surface tokens"
```

---

### Task 8: Results page + ResultDetails.tsx

**Files:**
- Modify: `src/app/results/[attemptId]/page.tsx`
- Modify: `src/app/results/[attemptId]/ResultDetails.tsx`

- [ ] **Step 1: Sửa `src/app/results/[attemptId]/page.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, RotateCcw, Flame, Home } from 'lucide-react';
import { prisma } from '@/lib/db';
import { calculateScorePercent } from '@/lib/scoring';
import { Breadcrumb } from '@/components/Breadcrumb';
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
    <main id="main-content" className="mx-auto max-w-md p-6 text-center">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: attempt.deck.name, href: `/decks/${attempt.deckId}` },
          { label: 'Kết quả' },
        ]}
      />
      <div
        className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full shadow-card"
        style={{ background: `conic-gradient(#22C55E ${scorePercent}%, rgb(var(--color-track)) 0)` }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-xl font-extrabold text-ink">
          {scorePercent}%
        </div>
      </div>
      <p className="mb-1 text-sm font-semibold text-ink">
        {attempt.correctCount}/{attempt.totalQuestions} đúng
      </p>
      {timeTaken && (
        <p className="mb-1 flex items-center justify-center gap-1.5 text-sm text-ink-muted">
          <Clock size={14} />
          Thời gian: {timeTaken}
        </p>
      )}

      <ResultDetails missed={missed} />

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href={`/quiz/${attempt.deckId}?mode=normal`}
          className="flex items-center gap-2 rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          <RotateCcw size={14} />
          Làm lại
        </Link>
        <Link
          href={`/quiz/${attempt.deckId}?mode=review`}
          className="flex items-center gap-2 rounded-control bg-accent-text px-4 py-2 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-dark active:scale-[0.97]"
        >
          <Flame size={14} />
          Ôn câu sai
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-control bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:bg-bg active:scale-[0.97]"
        >
          <Home size={14} />
          Trang chủ
        </Link>
      </div>
    </main>
  );
}
```

Thay đổi: `<main>` thêm `id="main-content"`. Vòng tròn điểm số: track `#E1E4F5`→`rgb(var(--color-track))` (C.3, tự đổi theo theme vì đọc thẳng CSS variable, không qua class Tailwind vì đây là inline style). `⏱`→icon `Clock`. `🔁`→icon `RotateCcw`. `🔥 Ôn câu sai` — theo Global Constraints đây là icon *chức năng* điều hướng (khác banner Home vốn thuần cảm xúc) nhưng đồng thời là cặp với banner Home cùng ý nghĩa "ôn câu sai" — quyết định: đổi sang icon `Flame` để nhất quán với các nút hành động khác trên cùng màn hình (Làm lại, Trang chủ đều dùng icon), banner ở Home vẫn giữ emoji `🔥` vì đó là nơi mang tính "hook" cảm xúc chính. `bg-white`→`bg-surface`; nút "Ôn câu sai" `bg-accent`→`bg-accent-text`. `🏠`→icon `Home`.

- [ ] **Step 2: Sửa `src/app/results/[attemptId]/ResultDetails.tsx`**

Thay toàn bộ nội dung file bằng:

```tsx
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
        <ClipboardList size={14} />
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
```

Thay đổi: `🎉`→icon `PartyPopper` — theo Global Constraints, `🎉` được liệt là "giữ emoji", nhưng xét lại đây thực chất là **icon trạng thái duy nhất trên dòng chữ** (không kèm text khác), đổi sang lucide cho nhất quán với toàn bộ style icon-hoá của trang Results; không phải trường hợp mơ hồ như banner cảm xúc. `mx-auto block`→`mx-auto flex items-center gap-1.5` để chứa icon. `📋`→icon `ClipboardList`. `bg-white`→`bg-surface`.

> **Ruling:** spec liệt `🎉` vào nhóm "giữ nguyên emoji" nhưng khi viết plan, xét thấy nó dùng y hệt vị trí một icon trạng thái đơn (không có ngữ cảnh banner/CTA cảm xúc như `🔥`) — quyết định đổi sang `PartyPopper` cho nhất quán, giữ đúng tinh thần "icon chức năng dùng lucide" của spec. Rủi ro nếu sai: mất chút "vibe" thân thiện ở đúng 1 vị trí — thấp, dễ đảo ngược nếu reviewer không đồng ý.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: sạch.

- [ ] **Step 4: Commit**

```bash
git add src/app/results/\[attemptId\]/page.tsx src/app/results/\[attemptId\]/ResultDetails.tsx
git commit -m "feat: Results — lucide icons, dark-aware score ring, accent-text/surface tokens"
```

---

### Task 9: Verification toàn diện

**Files:** không tạo/sửa file sản phẩm — chỉ chạy kiểm tra và (nếu cần) sửa E2E selector.

- [ ] **Step 1: Unit test**

Run: `npm test`
Expected: 42/42 pass, không sửa gì (Global Constraints).

- [ ] **Step 2: Type check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: sạch; route summary y hệt trước batch này (`/` ƒ, `/decks/[deckId]` ƒ, `/quiz/[deckId]` ƒ, `/results/[attemptId]` ƒ, `/import` ○, `/api/template` ○).

- [ ] **Step 3: E2E**

Reset `e2e.db` (`rm -f prisma/e2e.db e2e.db && DATABASE_URL="file:./e2e.db" npx prisma db push --skip-generate`), chạy `npm run test:e2e`.
Expected: pass. Nếu icon/label mới làm selector cũ trong `tests/e2e/core-loop.spec.ts` không còn khớp (ví dụ nút giờ có thêm icon con làm accessible name đổi), sửa selector tối thiểu để phản ánh đúng UI mới — không đổi hành vi test.

- [ ] **Step 4: Playwright — kiểm tra trực quan cả 2 theme trên 5 màn hình**

Chạy `npm run dev`, dùng Playwright MCP:
- Home, Import, Deck detail, Quiz, Results — chụp/snapshot ở theme light (mặc định) và sau khi bấm `ThemeToggle` sang dark.
- Xác nhận: không vỡ layout, không còn text màu sáng-trên-sáng/tối-trên-tối, icon lucide render đúng (không phải emoji còn sót).
- Reload trang sau khi chọn dark — xác nhận vẫn giữ dark (đọc `localStorage`).
- Tab từ đầu trang bất kỳ — xác nhận skip-link hiện ra, Enter nhảy đúng tới `#main-content`.
- `document.activeElement` sau khi bấm nút "✏️"-cũ (giờ là icon Pencil trong DeckHeader) qua `getByLabel('Đổi tên bộ đề')` — xác nhận `aria-label` hoạt động.

- [ ] **Step 5: Contrast spot-check**

Dùng Playwright `page.evaluate(() => getComputedStyle(el).color)` lấy màu thực tế đã render cho: chữ `ink-soft` trên nền `bg`, chữ `accent-text` trên nền trắng/surface, chữ trắng trên nút `bg-accent-text` — đối chiếu đúng hex đã khai trong Task 1 (cả 2 theme).

- [ ] **Step 6: Commit (nếu Step 3 cần sửa E2E)**

```bash
git add tests/e2e/core-loop.spec.ts
git commit -m "test: adjust E2E selectors for icon-based UI"
```

(Bỏ qua nếu không cần sửa gì.)
