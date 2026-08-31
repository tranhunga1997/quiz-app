// tests/e2e/core-loop.spec.ts
import { test, expect } from '@playwright/test';
import path from 'node:path';

test('import a deck, take the quiz, see results, then review a mistake', async ({ page }) => {
  await page.goto('/import');

  await page.setInputFiles('input[type="file"]', path.join(__dirname, 'fixtures/sample-deck.csv'));
  await expect(page.getByText('2 dòng hợp lệ')).toBeVisible();

  await page.getByLabel('Tên bộ đề').fill('E2E Sample Deck');
  await page.getByRole('button', { name: /Import \d+ câu hợp lệ/ }).click();

  await expect(page).toHaveURL(/\/decks\//);
  // Match the deck-name heading specifically — the new breadcrumb also renders
  // the deck name as plain text on this page, so a loose getByText is ambiguous.
  await expect(page.getByRole('heading', { name: /E2E Sample Deck/ })).toBeVisible();

  await page.getByRole('link', { name: 'Làm bài' }).click();
  await expect(page).toHaveURL(/\/quiz\//);

  await page.getByRole('button', { name: /Tất cả/ }).click();

  // Answer question 1 correctly if it's the capital question, otherwise deliberately wrong,
  // to guarantee at least one miss for the review-mode assertion below.
  for (let i = 0; i < 2; i++) {
    // QuizRunner fades the previous question out for 200ms before swapping in the next
    // one (see .animate-question-slide-in / phase: 'transitioning' in QuizRunner.tsx), and
    // the old <h2> stays mounted (same node, stale text) throughout that window. Wait for
    // the "Kiểm tra" button — only rendered once the new question has fully swapped in — so
    // we don't race the transition and read a stale heading.
    await expect(page.getByRole('button', { name: 'Kiểm tra' })).toBeVisible();
    const heading = await page.locator('h2').first().textContent();
    if (heading?.includes('Thu do')) {
      await page.getByText('Ha Noi', { exact: true }).click();
    } else {
      await page.getByText('3', { exact: true }).click(); // deliberately wrong (correct is 4)
    }
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await page.getByRole('button', { name: /Câu tiếp theo|Xem kết quả/ }).click();
  }

  await expect(page).toHaveURL(/\/results\//);
  await expect(page.getByText(/\d+%/)).toBeVisible();
  await page.getByRole('button', { name: 'Xem chi tiết từng câu' }).click();
  await expect(page.getByText('2 + 2 = ?')).toBeVisible();

  await page.goto('/');
  await expect(page.getByText(/Ôn câu hay sai/)).toBeVisible();
  await page.getByText(/Ôn câu hay sai/).click();
  await expect(page).toHaveURL(/mode=review/);
  await page.getByRole('button', { name: /Tất cả/ }).click();
  await expect(page.getByText('2 + 2 = ?')).toBeVisible();
});
