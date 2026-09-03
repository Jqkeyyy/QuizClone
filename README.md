# QuizClone

[![Security and quality](https://github.com/Jqkeyyy/QuizClone/actions/workflows/security.yml/badge.svg)](https://github.com/Jqkeyyy/QuizClone/actions/workflows/security.yml)

QuizClone is a personal flashcard and study application built with React, TypeScript, and Supabase. It supports creating study sets, adaptive review sessions, configurable practice tests, and portable backups while keeping every user's data protected by PostgreSQL row-level security.

The application is designed primarily for personal use. It currently provides sign-in for an existing Supabase account rather than public account registration.

> This is an independent project and is not affiliated with or endorsed by Quizlet.

## Features

### Study-set management

- Create, edit, and delete flashcard sets.
- Add optional descriptions and exam dates.
- Add, update, delete, and reorder individual cards.
- Bulk-import term/definition pairs with a preview and validation.
- Use tabs, commas, new lines, semicolons, or custom separators during bulk import.
- Download a set as a versioned `.quizclone.json` backup.
- Validate and restore previously exported backups.

### Flashcards

- Flip between terms and definitions.
- Choose which side appears first.
- Move through cards with buttons or keyboard shortcuts.
- Shuffle without reshuffling after unrelated state changes.
- Star cards and study only starred cards.

Keyboard shortcuts:

| Key | Action |
| --- | --- |
| `Space` | Flip the current card |
| `Left Arrow` | Previous card |
| `Right Arrow` | Next card |
| `S` | Star or unstar the current card |

### Learn mode

- Adaptive Leitner scheduling across boxes 0 through 5.
- Multiple-choice and written questions that become more challenging as cards advance.
- Incorrect cards are reintroduced later in the session.
- Override a result when a typed answer should have been accepted.
- Track accuracy, lapses, mastery, and due dates per card.
- Clamp review intervals around an optional exam date.
- Cram cards even when no scheduled reviews are due.
- Start a focused Learn session containing only questions missed on a test.

### Test mode

- Configure question count, direction, and question types.
- Multiple-choice, written, true/false, and matching questions.
- Mix term-to-definition and definition-to-term prompts.
- Prioritize weak or unseen cards.
- Grade written answers with normalization and typo tolerance.
- Review every answer after submission.
- Save test attempts and update card-learning progress.

## Technology

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 8 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Authentication and database | Supabase Auth and PostgreSQL |
| File storage foundation | Supabase Storage |
| Testing | Vitest 4 |
| Linting | Oxlint |
| Automation | GitHub Actions and Dependabot |

## Architecture

The browser communicates directly with Supabase through its publishable client key. Authorization is enforced in PostgreSQL rather than trusted to client-side route checks.

```text
React application
├── Supabase Auth        session and identity
├── Supabase Data API    sets, cards, progress, and attempts
└── PostgreSQL RLS       row-level authorization for every request
```

Important source directories:

```text
src/
├── components/          reusable cards, study, test, and layout UI
├── hooks/               authentication, queries, mutations, and sessions
├── lib/
│   ├── db/              Supabase data-access functions
│   ├── export/          backup generation and validation
│   ├── parse/           bulk-import parsing
│   └── study/           grading, scheduling, questions, and test logic
├── routes/              application screens
└── types/               generated-compatible database types

supabase/migrations/     schema, RLS policies, grants, and hardening
.github/workflows/       automated security and quality checks
```

## Database model

| Table | Purpose |
| --- | --- |
| `profiles` | Auth-linked user profile and display information |
| `sets` | Set metadata, ownership, description, and exam date |
| `cards` | Ordered term/definition pairs belonging to a set |
| `set_members` | Viewer/editor membership foundation for shared sets |
| `card_progress` | Leitner state, due dates, stars, and answer statistics |
| `study_sessions` | Foundation for study-session history |
| `test_attempts` | Saved test configuration, answers, and score |

Run every migration in order. Later migrations intentionally harden privileges and replace earlier helper functions.

## Security model

- All application tables have row-level security enabled.
- Anonymous clients have no direct table access.
- Authenticated users can access only their own sets, authorized shared sets, and their own progress/history.
- Set owners control membership; editors can modify cards only where explicitly authorized.
- Storage policies use the same set-level read and edit checks.
- Security-definer helpers live in a non-exposed schema with fixed search paths and restricted execution rights.
- Profile email addresses are synchronized from Supabase Auth and cannot be overwritten by the browser client.
- Local environment files, private keys, build output, local Supabase state, planning notes, and documentation are ignored by Git.
- CI installs the lockfile, audits dependencies, lints, tests, and performs a production build.

The Supabase publishable key is expected to be present in a browser application. Security depends on the RLS policies. Never place a Supabase `service_role` key or another administrative credential in a `VITE_` variable or client-side file.

## Prerequisites

- Node.js 24 (the version used by CI)
- npm
- A Supabase project
- Supabase CLI for database setup and migrations

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/Jqkeyyy/QuizClone.git
cd QuizClone
npm ci
```

### 2. Configure environment variables

Copy the redacted example:

```bash
cp .env.local.example .env.local
```

On PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

Fill in the values from the Supabase project settings:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not commit `.env.local`. It is already covered by `.gitignore`.

### 3. Apply the database migrations

Authenticate, link the intended project, preview the pending changes, and apply them:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --dry-run
supabase db push
```

On Windows, use `supabase.cmd` if PowerShell execution policy prevents the `supabase.ps1` wrapper from running.

### 4. Create the personal account

The current UI intentionally has no public registration form. Create the account that will use the application through Supabase Authentication, then sign in from `/login`.

For a private personal deployment, disable new-user registration in the Supabase Auth configuration after creating the account.

### 5. Start development

```bash
npm run dev
```

Open the local URL printed by Vite.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check` | Run lint, tests, and production build |
| `npm run security:audit` | Audit npm dependencies |
| `npm run types` | Regenerate TypeScript types from the configured Supabase project |

Before opening a pull request or pushing a release, run:

```bash
npm run check
npm run security:audit
```

## Backups

Use **Export backup** from a set overview to download its metadata and ordered card contents. Use **Import backup** from the dashboard to validate the file and recreate the set.

The current backup format includes text content, image references, positions, description, and exam date. Restoration recreates the set and card text, but it does not copy underlying image files or learning history.

Backups use a format marker and version number so future formats can be detected safely:

```json
{
  "format": "quizclone-set",
  "version": 1,
  "exported_at": "2026-09-03T12:00:00.000Z",
  "set": {
    "title": "Biology",
    "description": "Cell biology review",
    "exam_date": "2026-10-01"
  },
  "cards": []
}
```

## Deployment

Build the static application with:

```bash
npm run build
```

Deploy the generated `dist/` directory with any static host that supports single-page applications. Configure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build-time environment variables, and configure the host to route unknown application paths back to `index.html`.

After deployment:

1. Confirm `/login` loads directly.
2. Sign in with the personal account.
3. Create and edit a temporary set.
4. Run Flashcards, Learn, and Test modes.
5. Export and restore a backup.
6. Confirm anonymous Data API requests remain blocked.

## Current scope

Implemented and actively used:

- Personal authentication
- Set and card management
- Bulk card import
- Flashcards, Learn, and Test modes
- Persistent progress and test results
- Set export and restoration
- Database and repository security automation

Database foundations exist for set sharing, image storage, and study-session history, but their complete user interfaces are not currently part of the personal-use workflow.

## Contributing

Issues and pull requests are welcome after the repository becomes public. Keep changes focused, include tests for study or parsing logic, and ensure `npm run check` passes.

## License

QuizClone is available under the [MIT License](LICENSE).
