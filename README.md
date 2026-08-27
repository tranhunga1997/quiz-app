# Quiz App

A personal web app for self-authored quiz decks: import questions from CSV,
take quizzes with immediate feedback, and get smart prompts to re-study
questions you've gotten wrong before. See
`docs/superpowers/specs/2026-08-26-quiz-app-design.md` for the full design spec.

## Setup

```bash
npm install
npx prisma generate
npx prisma db push
```

`prisma db push` provisions the SQLite database file referenced by
`DATABASE_URL` in `.env` (defaults to `dev.db`). This file is gitignored —
run this once after cloning, or any time `dev.db` is missing.

## Development

```bash
npm run dev
```

Then open http://localhost:3000.

## Testing

Unit tests (Vitest):

```bash
npm test
```

End-to-end tests (Playwright) run against their own database, separate from
`dev.db`. Provision it once before the first run:

```bash
# bash
DATABASE_URL="file:./e2e.db" npx prisma db push
```

```powershell
# PowerShell
$env:DATABASE_URL = "file:./e2e.db"; npx prisma db push
```

(Adjust the env-var syntax for your shell if different from the two above.)
Then run the suite:

```bash
npm run test:e2e
```
