// Single source of truth for the SINGLE/MULTI question-type union — SQLite has no
// native enum support, so Question.type is a plain String column; this literal union
// previously got re-declared independently at 3 separate cast sites (lib/decks.ts,
// actions/quiz-actions.ts, actions/question-actions.ts).
export type QuestionType = 'SINGLE' | 'MULTI';
