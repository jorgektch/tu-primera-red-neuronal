# Engine updates for template-based repositories

README to Slides repositories created with **Use this template** are independent.
GitHub does **not** propagate changes to those repositories automatically. The
opt-in workflow can propose **reviewable Pull Requests** from stable upstream
GitHub Releases. It will never merge a PR or push directly to your `main` branch.

## What remains yours

The engine updater handles **only** these files:

- `assets/js/app.mjs`, `config.mjs`, `fit.mjs`, `media.mjs`, `navigation.mjs`, `remote-assets.mjs`, `theme.mjs`
- `assets/theme.css`
- `engine-release.json` (the installed engine version and SHA-256 lock)

**Never updated by this workflow:** `README.md`, `presentation.config.json`,
`index.html`, dataset files, notebooks, your speaker information, media,
application code, tests, documentation, and your own GitHub workflows.

Some engine releases might require an HTML, CSS, or configuration migration.
Those releases must be declared as `requiresManualMigration: true` (or increment
the configuration schema/major version), and the updater **refuses** to apply
them automatically. Follow the upstream release notes manually instead.

## Enable in an existing copy (opt-in)

1. Copy `.github/workflows/engine-updates.yml`, `tools/update_engine.py`,
   `tools/build_engine_manifest.py`, and `engine-release.json` into the copy.
   Old copies missing `assets/js/remote-assets.mjs` must first update their
   **engine baseline** to the compatible v1.5.0 files.
2. In the copy, open **Settings → Actions → General → Workflow permissions**.
   Enable **Allow GitHub Actions to create and approve pull requests**. This is
   required for the `GITHUB_TOKEN` to open PRs, though our workflow never approves.
3. To check once, use **Actions → Propose README to Slides engine update → Run workflow**.
4. For a weekly check, add the repository **Actions variable**
   `ENABLE_ENGINE_UPDATE_PRS` = `true` in **Settings → Secrets and variables → Actions → Variables**.
5. When a compatible upstream release exists, review the generated PR and CI
   before merging. If you dislike it, simply close the PR. To roll back, revert
   the merge commit or restore the previous engine version.

The workflow stays disabled on the upstream template itself. New copies do not
need to turn it on until they want to receive upstream updates.

## Release compatibility and guarantees

The published `engine-release.json` records:

- the installed semantic version `X.Y.Z`;
- the official upstream repository `jorgektch/readme-to-slides`;
- the configuration schema version;
- a fixed allowlist of engine files and their SHA-256 hashes;
- whether manual migration is required.

The update workflow checks the *latest published, non-prerelease* GitHub Release.
It reads the release manifest and source files **from the exact release tag**,
verifies every downloaded SHA-256, and checks that each local engine file still
matches its installed lock. If you edited any managed engine file locally, the
check stops and asks for a manual merge. It never blindly overwrites it.

Only compatible releases within the same major version and configuration schema
are eligible. Never auto-merge update PRs: review diffs and run tests first.

**Limitations:** updates to `index.html`, custom styles, or workflows are manual.
SHA-256 proves release assets match the manifest at the release tag, not that a
compromised upstream account is trustworthy. GitHub tags can move unless the
maintainer configures release immutability and protection. The updater relies
on GitHub Releases existing; without a release it reports `no-release`.

## Publishing the next release (maintainers only)

1. Edit source and unit tests, and increment the version in `package.json`.
2. Regenerate the engine manifest: `python tools/build_engine_manifest.py --version 1.5.0`.
3. Run `npm test`, `python tests/check_deck.py`,
   `python tests/test_quality_checker.py`,
   and `python -m unittest discover -s tests -p 'test_engine_update.py'`.
4. Merge into the source template, create and push a matching `v1.5.0` tag at
   that exact commit, then **publish a GitHub Release** for that tag. A tag alone
   is not enough: the updater calls the GitHub Releases latest endpoint.
5. Prefer immutable releases / protected tags; include release notes and any
   necessary manual migration steps.

## Safety checklist

- Do not include user README, JSON configuration, or slide deck content in the
  `managedFiles` allowlist.
- New engine module names require a reviewed updater allowlist change.
- Do not publish a release that needs new `index.html` elements without
  marking it as a manual migration.
- Ensure `README.md` and all personalized assets still work with the updated
  engine in a separate test repository.
