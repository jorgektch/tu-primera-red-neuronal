# Using remote GitHub READMEs with relative assets

The public presentation viewer supports `?url=` with a **public** GitHub README:

```
https://jorgektch.github.io/readme-to-slides/?url=https%3A%2F%2Fgithub.com%2FOWNER%2FREPO%2Fblob%2Fmain%2Fdocs%2FREADME.md
```

## Example

Repository source `OWNER/REPO`:

```
REPO/
├── assets/
│   ├── logo.png
│   └── intro.mp4
└── docs/
    ├── README.md
    └── architecture.png
```

Markdown in `docs/README.md`:

```markdown
![Architecture](architecture.png)
![Brand](/assets/logo.png)
[Watch recording](../assets/intro.mp4)
[Workshop notes](../NOTES.md)
[Jump to section](#overview)
```

The viewer resolves the first three relative links to the original
`raw.githubusercontent.com/OWNER/REPO/main/...` paths, converts `.md` and
`.ipynb` links to ordinary `github.com/OWNER/REPO/blob/...` links, and keeps
absolute URLs, in-document anchors, mail and telephone links intact.

The Markdown plugin parses the README first; URL rewriting happens only on
actual rendered anchors/images/videos—not code fences or inline code.

## Security and limitations

- Only public GitHub sources and HTTPS raw README URLs are supported.
- Remote raw HTML is escaped before rendering, as in previous versions.
- `javascript:`, `data:`, `file:` URLs, control characters, and traversal
  outside the repository/ref are blocked and their attributes removed.
- Files with percent-encoded slashes or backslashes are blocked to avoid
  ambiguous path normalization.
- README links using branch names containing `/` are not guaranteed to resolve:
  GitHub's `/blob/BRANCH/PATH` URLs do not unambiguously separate these parts.
  Prefer a single-segment tag or commit SHA in such cases.
- GitHub does not guarantee CORS or inline rendering of every remote media type.
  External platforms may restrict embedding or playback.
- Relative links in Markdown documents opened on GitHub are handled by GitHub;
  this viewer only transforms resources inside the rendered slide deck.
