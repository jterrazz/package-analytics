# Operating

This repository ships one thing: the npm package `@jterrazz/analytics`, published to the public registry. There is no service and no infrastructure — operating this repository means the release, and what triggers one.

## What a merge to `main` does

Nothing that reaches a consumer. `.github/workflows/validate.yaml` runs on every push and pull request to `main` and calls the shared `jterrazz-actions` validation workflow (install, lint, test). A green `main` is a publishable tree, not a published one — merging never publishes.

## What publishes

`.github/workflows/release.yaml` fires only on `release: created` and calls the shared `release-npm.yaml` workflow from `jterrazz-actions`, with npm provenance (`id-token: write`). So exactly one gesture publishes, and a human makes it: cutting a GitHub Release.

The version published is whatever `package.json` declares at that commit. This tree shows that field bumped by a direct commit on `main` (`git log -p -- package.json`: `1.0.0` → `1.0.1`), not by an automated bump step — there is no version-bump or changelog workflow in `.github/workflows/`. A contributor changing the public surface does not bump `version` in a feature branch: that is the owner's gesture, made once, right before the tag and the Release that names it.

## Related

- [Testing](03-testing.md) — what `validate.yaml` runs before a merge is considered green.
- [Developing](02-developing.md) — the commands `validate.yaml` and `release-npm.yaml` both wrap.
