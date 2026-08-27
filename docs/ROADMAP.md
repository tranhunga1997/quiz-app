# Quiz App — Feature Roadmap & Future Development Notes

This document tracks what's shipped, what's known to be incomplete, and what's
deliberately deferred — so a future session (or a future you) doesn't have to
re-derive this from the commit history. It complements, but doesn't replace,
the original design spec.

## Current State (v1 — shipped)

All P0 features from the original spec are implemented and covered by tests:

- **Import**: CSV import with per-row validation (valid rows import even when
  others fail), downloadable CSV template.
- **Decks**: list, view, rename, delete.
- **Questions**: add/edit/delete, 4-option multiple choice, single- or
  multi-correct-answer support.
- **Quiz session**: pick a deck → pick a session size (a number or "all") →
  answer questions one at a time, shuffled, with immediate right/wrong
  feedback and explanations.
- **Results**: score (%, correct/total, time taken), missed-question detail
  on demand, actions to retry / review mistakes / go home.
- **History & smart review**: every attempt is recorded; a "review your
  mistakes" mode prioritizes questions by how often and how recently they've
  been answered wrong (computed live from attempt history, not a cached
  counter).

Stack: Next.js 14 (App Router, TypeScript), Prisma + SQLite, Tailwind CSS,
Vitest (unit) + Playwright (E2E). 42 unit tests, 1 E2E test, all passing as
of the v1 merge.

## Known Gaps (found in the final review, deliberately left unfixed)

These were surfaced by the implementation's final whole-branch review and
consciously deferred rather than silently missed — see the PR description
for the review's full reasoning. Roughly ordered by how much they matter:

1. **CSV import: `,` instead of `;` can silently produce a wrong answer key.**
   The multi-correct-answer separator is `;` by design. A row is only
   flagged as an error when the stray comma has somewhere to overflow to
   (more raw fields than the header). Using the app's own downloadable
   template with no explanation text, a `correct` cell like `1,2` produces
   *exactly* the expected field count — no overflow, no error — and silently
   imports as a single-correct-answer question with a bogus `explanation`.
   **Fix sketch:** in `src/lib/csv.ts`, additionally reject a row when
   `explanation` matches something like `/^\s*[1-4](\s*;\s*[1-4])*\s*$/`
   (i.e. it looks like a stray answer-index list that spilled over).

2. **Home page can go stale after some actions.** `revalidatePath('/')` was
   added after finishing a quiz and after deleting a deck, but not after
   importing a deck, renaming a deck, or adding/deleting a question — all of
   which change what Home shows (deck list, question counts, review-due
   counts). Until a hard navigation, Home may briefly show pre-action state
   via Next.js's client Router Cache. **Fix sketch:** add the same
   `revalidatePath('/')` call to `submitImport`, `renameDeck`,
   `addQuestion`, and `deleteQuestion`'s `'use server'` wrappers.

3. **The review-mode priority-ordering test is weaker than it should be.**
   The fix that makes REVIEW-mode sessions actually pick the top-N
   most-missed questions (rather than a random N) is correct — verified by
   direct code reading — but its regression test seeds questions in an order
   that happens to match both rank order and Prisma's default row order, so
   it could pass even against a regression. **Fix sketch:** in
   `tests/unit/quiz-actions.test.ts`, reseed the test with questions created
   out of rank order and a larger pool, so a shuffle-instead-of-rank bug
   would reliably fail it.

4. **Editing a question can blank out old results' answer detail.**
   `updateQuestionCore` deletes and recreates all 4 `Option` rows with fresh
   ids on every edit. A past attempt's `AttemptAnswer.selectedOptionIds`
   still references the old ids, so viewing that old result's missed-answer
   detail after the question was edited shows "(không chọn)" instead of what
   was actually selected at the time. Current mitigation only avoids a blank
   string, it doesn't recover the real historical answer. **Real fix is an
   architecture question**: either snapshot option text onto
   `AttemptAnswer` at answer-time (denormalized but immune to later edits),
   or preserve `Option` ids across an edit (update in place instead of
   delete+recreate) when the option count doesn't change.

5. ~~Four of the spec's animation rules were never implemented~~ **Fixed.**
   Button press-down scale (`active:scale-[0.97]`, via Tailwind's default
   `transition` utility so it composes with existing color transitions) and
   the accordion's smooth height transition (a CSS `grid-template-rows`
   `0fr↔1fr` transition on an always-mounted wrapper) are now implemented
   app-wide, both respecting `prefers-reduced-motion`. Verified live via
   `getComputedStyle` in a real browser, not just read from source.

6. **Minor polish**: the results-screen action row (retry/review/home) has
   no `flex-wrap`, so it can wrap awkwardly on narrow phones; the progress
   bar still dips briefly during the final question's "finishing" transition
   (same class of bug as the fixed mid-quiz version, one more phase to
   include); `README.md` has two small inaccuracies (a relative path that's
   wrong from the README's actual location, and doesn't mention that Prisma
   resolves `file:./dev.db` relative to `prisma/schema.prisma`, not the
   project root, so the real file ends up at `prisma/dev.db`).

## P1 Features (from the original spec, not yet built)

Deferred at spec time as "nice to have, later" — still true:

- **Stats dashboard**: score trend over time, accuracy per deck.
- **Optional countdown timer** per quiz session.
- **Delete a single attempt** from history (currently attempts can only
  accumulate).
- **Export a deck back to CSV** (backup / share a deck you built in-app).
- **Search/filter questions** within a large deck (the question-management
  accordion has no search; fine for small decks, unwieldy for hundreds of
  questions).

## Explicitly Out of Scope (spec Non-Goals — revisit only if requirements change)

- Multi-user accounts / authentication.
- Multi-device sync / cloud storage.
- Formal spaced-repetition scheduling (SM-2 / Anki-style).
- Question types other than multiple choice (true/false, free text, etc.).
- Importing from Excel (.xlsx) or external APIs.

## A Spec-Level Design Question Worth Revisiting

The review-eligibility rule (`wrongCount > 0` makes a question show up in
"review your mistakes", forever) has no decay or retirement. A question
missed once and then answered correctly ten times in a row is still counted
as "needs review" — the review pool only grows, never shrinks, and will
eventually converge on "every question you've ever gotten wrong at least
once," at which point the feature stops discriminating between "still
struggling with this" and "got this ages ago." This isn't an implementation
bug — the code does exactly what the spec says — but it's worth reconsidering
the spec's eligibility rule itself before it becomes a real usability
problem. Cheapest fix, well short of full SM-2 (which is explicitly out of
scope): drop a question from the pool once its *most recent* answer was
correct, i.e. eligibility becomes "last answer was wrong" rather than "any
answer was ever wrong."

## Suggested Priority for the Next Iteration

If picking up this project again, roughly in order of value-per-effort:

1. Gap #1 (CSV comma silent-wrong-answer) and #2 (revalidatePath gaps) —
   both small, both real correctness/UX issues.
2. The review-pool decay question above — changes the headline feature's
   long-term usefulness more than anything else on this list.
3. P1: delete-a-single-attempt and search/filter (cheap, clear value).
4. P1: stats dashboard and CSV export (bigger, but no new architecture
   needed).
5. Gap #3 (test hardening), #6 (polish) — low urgency, fine to batch into a
   cleanup pass whenever convenient. (Gap #5, missing animations, is done.)
6. Gap #4 (option-id stability across edits) — the trickiest one
   architecturally; worth designing deliberately rather than bolting on,
   since the two real fixes (snapshotting vs. preserving ids) have different
   tradeoffs for the rest of the schema.
