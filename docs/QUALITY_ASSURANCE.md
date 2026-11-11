# Quality assurance for template adopters

These checks work after replacing the demonstration README with your own talk.

## Before publishing

1. New copies pass the first Actions run with `presentation.repositoryUrl: null`.
   GitHub Pages detects the repository automatically. If you need the Repo link
   on localhost or a custom domain, set it to your GitHub URL; the static
   checker rejects an explicitly mismatched value in GitHub Actions.
2. Edit `presentation.title`, other presenter fields and the README itself. The
   README is literal HTML/Markdown on GitHub, so changes to JSON alone cannot
   change its fallback author labels.
3. Use working asset paths relative to the README. The static check verifies
   local `![image](path)`, HTML image/video sources, document links and direct video links.
4. Keep a nonempty Markdown file at `slides.markdown`.
5. Enable **Settings → Pages → Deploy from a branch → main / (root)**.

## Automated checks

```bash
npm test
python tests/check_deck.py
python -m unittest discover -s tests -p test_engine_update.py
npm install
npx playwright install chromium
npm run test:e2e
```

- **Unit tests:** the actual JSON configuration contract, repository URL selection, remote Markdown
  escaping, theme isolation, video URL validation, navigation and slide fitting.
- **Static checks:** JSON, engine resources, slide source, missing local assets,
  duplicate slide IDs, and explicitly incorrect `repositoryUrl` values on CI.
  Low text contrast and copied source links generate advisory warnings.
- **Browser tests:** the actual customized deck loads, plus isolated test decks
  for minimal READMEs, vertical routes, F5, video, themes, touch navigation,
  and escaping remote HTML. The fixture slides are *only used in tests*.

A template user may remove all Mermaid diagrams, videos, tables and vertical
slides from their own README without breaking tests.

## Important limitations

- A green CI check is **not** a proof that every possible README renders without
  overflow. Inspect your own longest slides on desktop, projector and mobile.
- Remote README sanitization is defense-in-depth, not a security sandbox or
  permission to display untrusted content in a privileged authenticated context.
- `?url=` resolves Markdown images, video links and document paths against the
  source GitHub repository. See [Remote READMEs](REMOTE_READMES.md). Untrusted
  raw HTML remains escaped; unsupported ref names containing slashes are documented.
- External fonts, Mermaid, Reveal.js and embeds require access to their CDNs.
- Videos may fail because a provider disallows embedding or a browser blocks
  autoplay. This is not necessarily a viewer bug.
- The browser theme preference is stored **per repository** so several
  `OWNER.github.io/PROJECT/` decks do not affect each other's settings.
- The old origin-wide theme preference is intentionally not migrated; viewers
  may need to select their theme once after this update.

## Quick portability test

Try creating a new repository from this template and replace its README with:

```markdown
# My workshop

This is a one-slide presentation.
```

Optionally update `presentation.title` and `presentation.repositoryUrl`, or
leave the latter as `null`; both states must pass the checks.
They should pass without requiring the original demonstration's content.
