# Contributing to Agent Project Builder

## Development

```bash
npm ci                # install dependencies
npm test              # jest suite
node src/index.js --help   # CLI smoke check
npm run server        # web GUI on http://localhost:3000
```

Tests live in `tests/` (jest). Generated projects go to `generated/` — never
write generated output into the source tree.

## PR-flow discipline

- **Draft PR → CI green → owner merges.** No direct pushes to `main`, ever.
- Every PR adds its CHANGELOG entry under `## [Unreleased]` and bumps the
  version in `package.json` — patch for fixes/chores, minor for features.
- Merge commits reference the PR number (e.g. `Merge pull request #42 ...`).
- Releases are tagged `vX.Y.Z` after merge.
