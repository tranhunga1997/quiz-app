export function isAnswerCorrect(selectedOptionIds: string[], correctOptionIds: string[]): boolean {
  if (selectedOptionIds.length !== correctOptionIds.length) return false;
  const selected = new Set(selectedOptionIds);
  const correct = new Set(correctOptionIds);
  if (selected.size !== correct.size) return false;
  for (const id of selected) {
    if (!correct.has(id)) return false;
  }
  return true;
}

export function calculateScorePercent(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export type ScoreTier = 'success' | 'warning' | 'danger';

/** Single source of truth for the 80%/50% score-quality thresholds — previously only
 * defined on the deck-history page's score bars, while the results page always
 * rendered its score ring in the success color regardless of the actual score. Both
 * now classify a percent through this one function. */
export function getScoreTier(percent: number): ScoreTier {
  if (percent >= 80) return 'success';
  if (percent >= 50) return 'warning';
  return 'danger';
}
