# Generated Outputs Policy

## Source vs Generated

**Source files (commit these)**:
- TypeScript types (`shared/types/poolLifecycle.ts` and re-exports)
- Read-only generation scripts (`scripts/generate-pool-lifecycle.ts`)
- Dune SQL documentation files
- Scoring formula documentation
- This policy document and DESIGN.md

**Generated outputs (do NOT commit by default)**:
- `data/generated/pegkeeper-pool-lifecycle.json`
- `data/generated/pegkeeper-pool-daily-snapshots.json` (especially large daily series)
- Full `docs/pool-analytics/RANKING.md` (unless explicitly reviewed as a small snapshot)
- Per-pool markdown reports in bulk

## Recommended Handling

1. **Local generation only** — Developers run the script locally for analysis.
2. **CI artifacts** — Generated files may be produced in CI for review but stored as artifacts, not committed.
3. **Small review samples** — Tiny mocked or hand-curated examples may be committed inside the PR for illustration only.
4. **Gitignore** — Add patterns such as:
   ```
   data/generated/
   docs/pool-analytics/RANKING.md
   docs/pool-analytics/*-lifecycle.md
   ```

## Script Behavior (PR A and beyond)

- Default run: print to stdout only. Demonstrate output shapes using mocks.
- `--write-temp` or similar flag: allowed to write **only** to temporary/ignored locations (e.g. `/tmp/pool-lifecycle-dryrun/`).
- Never write production or committed generated datasets in framework PRs.
- Always document the exact command and flag used.

## RANKING.md Policy

- Treated as **locally generated** by default.
- Commit only small, explicitly reviewed snapshots when they add value to a PR review.
- The canonical source of rankings is the script + data, not a committed markdown file.

## Why This Policy?

- Keeps the repo clean.
- Avoids merge conflicts on frequently regenerated data.
- Makes it clear what is code/framework vs output.
- Supports the "design + audit first, implement in small PRs" approach.