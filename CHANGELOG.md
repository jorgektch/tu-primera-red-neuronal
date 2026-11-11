# Changelog

## 1.5.1 — First-run template portability

- New template copies no longer fail their first GitHub Actions run simply
  because `presentation.repositoryUrl` is not customized yet.
- Default `presentation.repositoryUrl` to `null` so GitHub Pages derives the
  correct repository from its actual owner and path.
- Hide the Repo toolbar button on localhost/custom domains unless a verified
  GitHub URL is configured; prevent misleading inherited template links.
- Preserve strict validation for incorrect **explicit** repository URLs.
- Add browser, Node and Python regression tests and update onboarding docs.
- Compatible with v1.5.0; no configuration schema change or manual migration.
  Existing copies with the old explicit URL should change it to `null` or their
  actual repository URL; the engine updater never overwrites user configuration.

## 1.5.0 — Remote Assets & Safe Engine Updates

- Resolve relative image, video and document paths for public remote GitHub
  READMEs; preserve links, anchors, inline code, and fenced examples.
- Block unsafe protocols and traversal beyond the source repository/ref.
- Introduce official engine release manifest with SHA-256 file hashes.
- Add opt-in Action that proposes compatible updates as Pull Requests only.
- Refuse updates when the engine was customized, integrity fails, or manual
  migration is needed.
- Improve portability and QA of template copies: minimal README fixtures,
  configuration validations, URL regression checks, isolated theme preferences.
- Preserve the original Dark/Light/Auto switch, presentation appearance,
  speaker details, and README-as-slides source architecture.

See the two related issues:
- https://github.com/jorgektch/readme-to-slides/issues/1
- https://github.com/jorgektch/readme-to-slides/issues/2

**Initial release action:** maintainer must publish GitHub Release `v1.5.0`
from the commit containing the matching `engine-release.json` before copies
can detect future releases.
