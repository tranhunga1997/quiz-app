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
