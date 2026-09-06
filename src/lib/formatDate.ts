// Single shared date formatter — previously duplicated with two different output
// formats (a full explicit format in the deck-history page, a bare locale-default
// format in the per-question history summary) for what a user perceives as the same
// kind of "when did this happen" data.
export function formatVietnameseDate(value: Date): string {
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
