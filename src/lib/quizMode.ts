// Single source of truth for the 3 quiz modes and their Vietnamese labels — previously
// duplicated (a re-declared union type in lib/deckHistory.ts, and a copy-pasted
// MODE_LABEL map in both app/quiz/[deckId]/page.tsx and
// app/decks/[deckId]/history/page.tsx). Lives outside src/actions/quiz-actions.ts
// because that file has a `'use server'` directive, which only permits async-function
// exports — a plain object like MODE_LABEL can't live there.
export type QuizMode = 'NORMAL' | 'REVIEW' | 'FLAGGED';

export const MODE_LABEL: Record<QuizMode, string> = {
  NORMAL: 'Làm bài',
  REVIEW: 'Ôn tập',
  FLAGGED: 'Câu đã đánh dấu',
};
