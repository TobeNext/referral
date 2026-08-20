# API required checks

Protect `master` with pull requests, at least one approving reviewer, up-to-date branches, and these required checks:

- `api-quality-test-build`
- `api-e2e`
- `dependency-review`
- `codeql-javascript-typescript`
- `secret-scan`
- `api-container-build-scan`

Also disable direct pushes. If Merge Queue is enabled, keep the `merge_group` trigger in `api-ci.yml` so the quality and E2E gates run for queued merge commits.
