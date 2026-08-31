# A11y Fixes, Icon Library, Dark Mode — Design Spec

**Status:** Approved via mockup review (2026-08-31) — see decisions below.

**Nguồn:** rà soát toàn app theo `docs/rules/website-ui-ux-rules.md`, trình bày qua 3 vòng mockup trực quan (visual brainstorming companion), người dùng chốt lựa chọn qua click trong browser + phản hồi terminal.

## Mục tiêu

Ba nhóm việc độc lập nhưng làm chung 1 đợt vì đều là lớp "hoàn thiện" trên UI hiện có, không đổi luồng nghiệp vụ:

1. **CRITICAL** — sửa các vi phạm accessibility/UX rõ ràng (contrast, touch target, label, aria).
2. **Icon library** — thay icon chức năng (emoji) bằng `lucide-react`, giữ emoji ở chỗ thuần cảm xúc/trang trí.
3. **Dark mode** — theme sáng/tối đầy đủ, có nút chuyển tay, lưu lựa chọn qua `localStorage`, mặc định theo `prefers-color-scheme` nếu chưa từng chọn.

**Không đổi:** cấu trúc route, data model, luồng nghiệp vụ (import/quiz/review), bố cục desktop/mobile hiện tại (grid, spacing, radius, shadow). Đây thuần là lớp màu sắc/icon/accessibility.

## Ngoài phạm vi (deferred)

- Nhóm MEDIUM/LOW từ bản rà soát trước (progress bar animate `width`→`transform`, `tabular-nums`, `min-h-screen`→`min-h-dvh`, skip-link) — **gộp vào batch CRITICAL này luôn** vì cùng loại sửa nhỏ, rủi ro thấp, không đáng tách plan riêng (xem mục A.6-A.8).
- Đổi bố cục/nav (đã làm ở đợt breadcrumb+header trước).
- Bottom nav, PWA, animation nâng cao khác.

---

## A. Nhóm CRITICAL (+ MEDIUM/LOW gộp)

### A.1 — aria-label cho nút icon-only
`src/app/decks/[deckId]/DeckHeader.tsx:54` — nút "✏️" đổi tên deck không có text. Thêm `aria-label="Đổi tên bộ đề"`.

### A.2 — Label thật cho input "Tên bộ đề"
`src/app/import/ImportForm.tsx:73-78` — hiện chỉ có `placeholder`. Thêm `<label htmlFor="deckName">Tên bộ đề</label>` hiển thị phía trên input (không sr-only — rule yêu cầu label hiển thị thật), input thêm `id="deckName"`.

### A.3 — Lỗi submit gắn với `aria-describedby`
`src/app/import/ImportForm.tsx:110` — `submitError` hiện là `<p>` rời rạc. Thêm `id="submit-error"` cho `<p>`, gắn `aria-describedby="submit-error"` vào nút submit khi có lỗi, thêm `role="alert"`.

### A.4 — Touch target ≥44px cho nút nhỏ
- `QuestionAccordion.tsx:213-216` (nút "🗑️ Xoá" trong accordion mở) — thêm `min-h-[44px]` và padding đủ, tăng gap với "Huỷ"/"Lưu" từ hiện tại lên `gap-2.5` (10px).
- `DeckHeader.tsx:54` (nút "✏️") — bọc trong `min-h-[44px] min-w-[44px] flex items-center justify-center`.

### A.5 — Contrast: sửa token màu, không sửa từng nơi dùng
Đo contrast thực tế (WCAG relative luminance), nền tính trên cả `bg (#EEF0FA)` và card trắng:

| Token | Giá trị hiện tại | Contrast (trên `bg`/trên trắng) | Đạt AA? |
|---|---|---|---|
| `ink.soft` | `#8A8FA3` | 2.86:1 / 3.26:1 | ❌ |
| `ink.muted` | `#6B7280` | 4.29:1 / 4.89:1 | ❌ trên `bg` (sát ngưỡng), ✅ trên trắng |
| `accent` dùng làm text | `#4F6EF7` | 3.76:1 / 4.28:1 | ❌ |
| `accent` dùng làm nền nút (chữ trắng đè lên) | `#4F6EF7` | — / 4.28:1 | ❌ (sát ngưỡng, chữ nút không đủ lớn để miễn) |

**Thay đổi trong `tailwind.config.ts`:**

```ts
ink: {
  DEFAULT: '#1A1A2E',
  soft: '#4B5563',   // đổi từ #8A8FA3 — đạt 6.7:1/7.7:1
  muted: '#6B7280',  // giữ nguyên, dùng cho chữ trên card trắng
},
accent: {
  DEFAULT: '#4F6EF7',   // giữ nguyên — dùng cho border/icon/vùng lớn (chỉ cần 3:1)
  dark: '#6C7FF0',      // giữ nguyên — hover state hiện có, không đổi nghĩa
  text: '#3B57E0',      // MỚI — dùng khi accent là chữ hoặc nền nút có chữ trắng đè lên (5.1-5.8:1)
},
```

**Việc cần làm ở component:** đổi mọi `text-accent` dùng cho *link/chữ đọc được* (breadcrumb, "📥 Tải file mẫu") và mọi `bg-accent` dùng làm *nền nút chính có chữ trắng* (nút "Import CSV", "Kiểm tra", "Import N câu hợp lệ"...) sang `accent-text`. Giữ `accent` (không đổi) cho: icon màu, viền, dải màu nền lớn không mang chữ nhỏ trực tiếp (banner gradient "🔥 Ôn câu hay sai" — chữ trên đó là `font-bold`+trắng, cỡ tương đương text-sm, cũng nằm trong nhóm cần soát — banner này đổi `from-accent` → `from-accent-text` để nhất quán).

> Đây là thay đổi vượt ngoài mockup ban đầu (mockup A.5 chỉ minh hoạ đổi chữ phụ) — phát hiện thêm khi tính contrast chính xác cho nút chính. Nêu rõ ở đây để bạn duyệt cùng lúc: **nút CTA chính (Import CSV, Kiểm tra, Bắt đầu...) sẽ đổi từ `#4F6EF7` sang `#3B57E0` — đậm hơn một chút, cùng tông xanh, không đổi nhận diện thương hiệu.**

### A.6 — Progress bar: animate `transform` thay vì `width`
`src/app/quiz/[deckId]/QuizRunner.tsx:118-124` — đổi từ `width: ${percent}%` + `transition-all` sang `transform: scaleX(${percent/100})` với `transform-origin: left` trên track cố định 100% width.

### A.7 — `min-h-dvh` thay `min-h-screen`
`src/app/layout.tsx:19` — đổi `min-h-screen` → `min-h-dvh`.

### A.8 — Skip-link
`src/app/layout.tsx` — thêm link ẩn-đến-khi-focus `<a href="#main-content">Bỏ qua điều hướng</a>` ngay đầu `<body>`, trước `<header>`; mỗi trang gắn `id="main-content"` vào thẻ `<main>`.

---

## B. Icon library — lucide-react

**Quyết định (chọn qua mockup):** `lucide-react`. Áp dụng cho **toàn bộ icon chức năng** (nút, trạng thái, điều hướng). Giữ emoji cho phần **cảm xúc/trang trí thuần tuý**: `🎉` (không có câu sai), `🔥` (banner ôn tập — mang tính "hook" cảm xúc hơn là chức năng).

Cài đặt: `npm install lucide-react`.

### Bảng thay thế

| File | Emoji hiện tại | Icon Lucide | Ghi chú |
|---|---|---|---|
| `layout.tsx` | `📚` (logo) | `BookOpen` | size 20, màu accent |
| `page.tsx` (Home) | `+` (chữ, không phải emoji) | `Plus` | nút Import CSV |
| `page.tsx` (Home) | `📗`/`📘` (card bộ đề) | `BookOpen` | màu đổi theo success/warning như hiện tại |
| `page.tsx` (Home) | `🔥 Ôn câu hay sai` | *(giữ emoji)* | banner cảm xúc |
| `DeckHeader.tsx:48` | `📘` (tiêu đề) | `BookOpen` | |
| `DeckHeader.tsx:54` | `✏️` | `Pencil` | icon-only, giữ aria-label từ A.1 |
| `DeckHeader.tsx:63` | `▶ Làm bài` | `Play` | |
| `DeckHeader.tsx:70` | `🗑️ Xoá bộ đề` | `Trash2` | |
| `QuestionAccordion.tsx:108` | `▾`/`▸` | `ChevronDown`/`ChevronRight` | |
| `QuestionAccordion.tsx:215` | `🗑️ Xoá` | `Trash2` | |
| `ImportForm.tsx:50` | `📄` | `FileText` | |
| `ImportForm.tsx:68` | `📥 Tải file mẫu` | `Download` | |
| `ImportForm.tsx:82/97` | `✅` | `CheckCircle2` | màu success |
| `ImportForm.tsx:86/105` | `⚠️` | `AlertTriangle` | màu danger |
| `results/page.tsx:60` | `⏱ Thời gian` | `Clock` | |
| `results/page.tsx:69` | `🔁 Làm lại` | `RotateCcw` | |
| `results/page.tsx:75` | `🔥 Ôn câu sai` | *(giữ emoji)* | CTA cảm xúc, khớp banner Home |
| `results/page.tsx:81` | `🏠 Trang chủ` | `Home` | |
| `ResultDetails.tsx:11` | `🎉` | *(giữ emoji)* | |

Kích thước icon mặc định: `16px` cạnh text `text-sm`, `20px` cạnh heading/logo. Màu icon kế thừa `currentColor` (đồng bộ với màu chữ nút).

---

## C. Dark mode

**Quyết định (chọn qua mockup):** đầy đủ — nút toggle tay + lưu `localStorage`, mặc định theo `prefers-color-scheme` khi chưa có lựa chọn lưu.

### C.1 — Chiến lược kỹ thuật

Chuyển hệ màu hiện tại (Tailwind theme.extend.colors với hex tĩnh) sang **CSS custom properties**, để mọi class `bg-bg`, `text-ink`, `bg-accent`... tự đổi theo class `dark` trên `<html>` mà **không cần thêm `dark:` vào từng className** (tránh phải sửa tay hàng chục chỗ, giảm rủi ro sót).

`tailwind.config.ts`:
```ts
darkMode: 'class',
// mỗi màu semantic trỏ vào biến CSS, ví dụ:
colors: {
  bg: 'rgb(var(--color-bg) / <alpha-value>)',
  surface: 'rgb(var(--color-surface) / <alpha-value>)',
  ink: {
    DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
    soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
    muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
  },
  accent: {
    DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
    dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
    text: 'rgb(var(--color-accent-text) / <alpha-value>)',
  },
  success: { DEFAULT: '...', bg: 'rgb(var(--color-success-bg) / <alpha-value>)', text: '...' },
  warning: { DEFAULT: '...', bg: 'rgb(var(--color-warning-bg) / <alpha-value>)' },
  danger:  { DEFAULT: '...', bg: 'rgb(var(--color-danger-bg) / <alpha-value>)', text: '...' },
}
```

`globals.css`:
```css
:root {
  --color-bg: 238 240 250;          /* #EEF0FA */
  --color-surface: 255 255 255;     /* #FFFFFF — thay cho bg-white literal */
  --color-ink: 26 26 46;            /* #1A1A2E */
  --color-ink-soft: 75 85 99;       /* #4B5563 (đã sửa contrast ở A.5) */
  --color-ink-muted: 107 114 128;   /* #6B7280 */
  --color-accent: 79 110 247;       /* #4F6EF7 */
  --color-accent-dark: 108 127 240; /* #6C7FF0 */
  --color-accent-text: 59 87 224;   /* #3B57E0 */
  --color-success-bg: 232 249 239;  /* #E8F9EF */
  --color-warning-bg: 254 243 226;  /* #FEF3E2 */
  --color-danger-bg: 253 236 236;   /* #FDECEC */
  --color-track: 225 228 245;       /* #E1E4F5 — vòng tròn điểm số Results */
}
:root.dark {
  --color-bg: 18 20 43;             /* #12142B */
  --color-surface: 30 33 66;        /* #1E2142 */
  --color-ink: 241 242 250;         /* #F1F2FA */
  --color-ink-soft: 145 149 181;    /* #9195B5 */
  --color-ink-muted: 156 163 175;
  --color-accent: 108 127 240;      /* #6C7FF0 — sáng hơn để nổi trên nền tối */
  --color-accent-dark: 90 107 224;
  --color-accent-text: 143 163 255;
  --color-success-bg: 23 56 41;     /* #173829 */
  --color-warning-bg: 61 49 23;     /* #3D3117 */
  --color-danger-bg: 61 27 27;      /* #3D1B1B */
  --color-track: 42 45 82;          /* #2A2D52 */
}
```

Toàn bộ dark-token trên đã tự kiểm contrast ở mức xấp xỉ tương đương bản light (chữ chính/phụ trên nền tối đều ≥4.5:1) — mức chính xác pixel-perfect sẽ verify lại bằng Playwright + tính tay ở review cuối task, không tính lại thủ công trong spec để tránh phình tài liệu.

### C.2 — Việc cơ học: `bg-white` → `bg-surface`
33 chỗ dùng `bg-white`/`text-accent`/`text-ink-soft`/style inline trên 9 file (`Breadcrumb.tsx`, `page.tsx`, `layout.tsx`, `ImportForm.tsx`, `ResultDetails.tsx`, `results/page.tsx`, `DeckHeader.tsx`, `QuizRunner.tsx`, `QuestionAccordion.tsx`) — đổi `bg-white` (literal, không tự đổi theo dark) sang `bg-surface` (token mới, tự đổi). `text-accent`/`text-ink-soft` đã là token nên tự động ăn theo A.5 + C.1, không cần sửa thêm ở bước này.

### C.3 — Vùng cần xử lý riêng (không phải Tailwind class)
- `results/[attemptId]/page.tsx` — vòng tròn điểm số dùng `style={{ background: conic-gradient(#22C55E ${percent}%, #E1E4F5 0) }}`. Đổi phần track từ hex cứng `#E1E4F5` sang `var(--color-track)` trong style string.

### C.4 — `ThemeToggle` component mới
`src/components/ThemeToggle.tsx` (client component):
- Nút icon `Sun`/`Moon` (lucide) đặt trong header, cạnh logo.
- Đọc `localStorage.theme` lúc mount; nếu chưa có, dùng `window.matchMedia('(prefers-color-scheme: dark)')`.
- Click: toggle class `dark` trên `document.documentElement`, ghi lại `localStorage.theme`.
- **Chống FOUC:** thêm 1 `<script>` inline (không dùng `next/script`, phải chạy đồng bộ trước paint) ngay đầu `<head>` trong `layout.tsx`, đọc `localStorage.theme`/`matchMedia` và gán class trước khi React hydrate — pattern chuẩn cho Next.js App Router dark mode.

### C.5 — Vị trí đặt trong layout
`src/app/layout.tsx` — header hiện có `Link` logo; thêm `<ThemeToggle />` bên phải, cùng hàng, dùng `flex justify-between`.

---

## Testing & Verification

- Không đổi logic nghiệp vụ → 42 unit test hiện có giữ nguyên, không cần sửa.
- E2E (`core-loop.spec.ts`) chạy lại nguyên trạng trên theme mặc định (light); không cần thêm test riêng cho dark mode ở phạm vi này (kiểm tra bằng Playwright thủ công + screenshot, không đưa vào CI).
- Sau khi implement: verify lại bằng Playwright `getComputedStyle`/screenshot cho: (a) contrast các cặp màu ở bảng A.5 và các token dark ở C.1, (b) toggle dark mode giữ được sau reload (localStorage), (c) 5 màn hình ở cả 2 theme không vỡ layout.
- Chạy `npx tsc --noEmit`, `npm run build` xác nhận route summary không đổi.

## Rủi ro & quyết định đã chốt (ruling)

- Đổi màu nút CTA chính từ `#4F6EF7`→`#3B57E0` (mục A.5) là phát hiện mới ngoài mockup ban đầu — nêu rõ trong spec, coi như đã trình bày cùng lúc với các quyết định khác để duyệt.
- Dark mode dùng CSS variables thay vì thêm `dark:` theo từng className — chọn vì ít điểm sửa hơn, khó sót, và là pattern khuyến nghị chính thức của Tailwind cho theme có toggle tay.
