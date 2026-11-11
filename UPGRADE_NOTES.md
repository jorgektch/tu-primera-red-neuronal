# Upgrade notes — README to Slides v1.2: Multimedia & Themes

This is a **differential package** built against `jorgektch/readme-to-slides` main at the v1.1 revision (README blob `3333c2b1`).

## Apply

1. Extract the ZIP.
2. Copy files and folders **preserving their paths** to the repository root; replace existing files where prompted.
3. Commit and push. No dependency installation or build step is needed for GitHub Pages.
4. Open `https://jorgektch.github.io/readme-to-slides/` and verify: a dark cover, video example, theme button cycling dark / light / auto, and readable Mermaid diagrams in both themes.
5. Inspect Actions to confirm the checks pass.

## Replaced files

- `README.md` — multimedia and theme demonstration slides and instructions
- `index.html` — theme toggle button
- `presentation.config.json` — theme presets and media settings
- `assets/js/config.mjs` — new config validation and defaults
- `assets/js/app.mjs` — theme state, video embedding, paused/unloaded players, Mermaid re-theming
- `assets/theme.css` — fully themed slide surfaces and responsive player
- `docs/CUSTOMIZATION.md`, `docs/ARCHITECTURE.md`, `UPGRADE_NOTES.md`
- `package.json`, `tests/check_deck.py`, `tests/deck.spec.mjs`

## New files

- `assets/js/theme.mjs`
- `assets/js/media.mjs`
- `docs/MEDIA_AND_THEMES.md`
- `tests/theme-media.test.mjs`

## Defaults and intentional limits

- Dark Mode remains default; original creator name, email, handle and social media stay unchanged.
- No video is set to autoplay by default. Video providers must allow embedding.
- The HTML from remote README mode is still escaped; video links themselves are converted only for recognized formats and hosts.
- Browser remembers a visitor's manually selected theme in localStorage; remove the localStorage key `readme-to-slides.theme-choice.v1` to honor the repository's configured default again.
- If you use a hardcoded `data-background-color` on custom slides, it intentionally overrides the theme for that slide.

## v1.3 — Contextual navigation

Replace the updated files preserving their relative paths. Add
`assets/js/navigation.mjs`, `docs/NAVIGATION.md` and
`tests/navigation.test.mjs`. New options are placed in
`presentation.config.json` under `slides`:

- `navigationVisibility: "auto"` (or `"always"` for the old v1.2 behavior)
- `navigationHideDelayMs: 3000`
- `navigationRevealZonePx: 90`

The bottom-left counter remains fixed, independent of the toolbar. In `auto`
mode, desktop users reveal controls by moving to the bottom-right corner, and
mobile users use a compact ellipsis button. Do not delete your existing contact
or theme settings when updating a customized configuration; merge these three
new fields instead.


## v1.4 — Slide Fit & Reload Recovery

This incremental ZIP is based on the current v1.3 `main` repository (file blobs verified). **Only the changed files are included**. Extract it into the repository root, preserving directories, and commit.

- Remove the shared `id="markdown-slides"` from the Markdown loader. Reveal.js 5.1 forwards this ID to every generated slide, creating duplicate URL hashes. The loader is now found by `data-deck-source="readme"` before Markdown parses. New slide hashes use indices; F5 should restore the current slide.
- Limit the size of video players to retain sufficient space for headings and explanations.
- Split the dense configuration table into two logically separate slides.
- Add a lightweight active-slide fitter with optional compact and tight modes; report overly dense slides in the console rather than cutting content.
- Add `slides.autoFitContent`, `slides.fitSafeGapPx`, `media.videoMaxWidthPx` and `media.videoMaxHeightPx` in `presentation.config.json`.
- Keep the original theme switcher **dark → light → auto → dark**, including the OS theme preference and saved visitor setting. No visual identity or contact changes.

### Quick verification after publishing

1. Navigate to the video slide and a later table slide; verify all headings, captions and rows remain visible.
2. Navigate to a horizontal and vertical slide and press F5. Confirm you stay on the same slide.
3. Toggle theme dark → light → auto, and verify the original controls and Mermaid diagrams remain functional.
4. Open the browser console: `window.slideFitDiagnostics`. If any slide is still too tall, split the content. The fitter is intentionally conservative.
5. Check GitHub Actions and the Pages deployment.


## v1.5 — Remote README resources and optional engine update PRs

- Issue #1: `assets/js/remote-assets.mjs` now resolves images, videos and
  relative Markdown document links based on the source README's directory.
  Unsafe schemes and traversal outside the source repository/ref are blocked.
- Issue #2: install `engine-release.json`, `tools/`, and
  `.github/workflows/engine-updates.yml` to support reviewable updates from
  official GitHub Releases, without overwriting your README or JSON config.
- The new opt-in updater **requires a published GitHub Release** (`v1.5.0`)
  and the repository's Actions PR permission; installing files alone does not
  create or run updates.
- The 1.4.1 quality fixes are bundled in this differential: tests no longer
  require the original demonstration content, malformed configs are checked,
  and theme preferences are scoped per repository.
- Do not use this upstream ZIP unchanged on an existing customized workshop:
  it contains the template README. To upgrade a workshop, copy only the
  engine-owned files and updater scaffolding after reviewing local modifications.

See [docs/ENGINE_UPDATES.md](docs/ENGINE_UPDATES.md) and
[docs/REMOTE_READMES.md](docs/REMOTE_READMES.md) for adoption, compatibility,
limitations, rollback and publishing instructions.
