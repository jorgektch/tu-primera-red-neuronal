# Customizing README to Slides

The **slide content** lives in [`README.md`](../README.md). The **presentation configuration** lives in [`presentation.config.json`](../presentation.config.json). The **visual rules** live in [`assets/theme.css`](../assets/theme.css).

## 1. Quick start

1. Click **Use this template** on GitHub and create your repository.
2. Edit `presentation.config.json` to set your talk title, presenter, contact details, theme, and timing. **`presentation.repositoryUrl` is optional** and defaults to `null`, so the first Actions run of a new copy works before you customize anything.
3. Replace the explanatory Markdown slides in `README.md` with your own talk. Keep `---` between horizontal slides and `--` for a vertical detail slide. Always put a **blank line before and after** each slide separator (`---` or `--`), including when the preceding content is a fenced code block. Without these blank lines, Markdown may interpret `---` as a heading underline instead of a new slide.
4. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, **main**, **/(root)**.
5. Wait for the Pages deployment, then open the URL shown in Settings.

Run locally using `python -m http.server 8000` and open `http://localhost:8000/`. Do not open `index.html` using `file://` because the Markdown and JSON are fetched via HTTP.

## Repository link in the slides and local development

The **Repo** toolbar button uses the current project automatically when the
presentation is served from `<owner>.github.io/<repository>/`. On a local server
(`localhost` / `127.0.0.1`), the browser cannot determine which GitHub repository
contains the files. If you want the **Repo** button in local previews, optionally set the canonical URL in `presentation.config.json`:

```json
{
  "presentation": {
    "repositoryUrl": "https://github.com/YOUR-USERNAME/YOUR-REPOSITORY"
  }
}
```

This is a partial example; retain the other configuration fields. The shipped
value is `null` so new copies do **not** inherit a misleading link to the
original README to Slides repository. On GitHub Pages, the repository is
resolved automatically; on localhost and custom domains, the Repo button is
hidden until you provide your own URL. A wrong *explicit* URL is still rejected
by the Actions static validation. You do not need to edit the JavaScript or
test files to customize the repository link.

When using `?url=` to present a public README from another repository, the
**Repo** button still points to the *remote README's repository*.

## 2. Author information

The repository deliberately includes the original creator's public information, so the template can be demonstrated immediately. Edit `presenter.name`, `presenter.role`, `presenter.email`, `presenter.handle`, and the three `social` URLs in JSON to update the **browser presentation**.

**Important distinction:** GitHub renders the literal HTML from `README.md` without executing the presentation JavaScript. If you want to change the visible presenter details in the **GitHub README page**, also replace the fallback text and links in the first and last README sections. These are intentionally left as the original author's defaults in this repository.

## 3. Presentation and layout settings

| Field | Type | Description |
|---|---|---|
| `presentation.title` | string | Static title shown on cover |
| `presentation.titleFromRepository` | boolean | If true, derive title from repository slug |
| `presentation.repositoryUrl` | GitHub HTTPS URL or `null` | Optional repo link for localhost/custom domains; GitHub Pages is detected automatically; `null` hides unknown local links |
| `presentation.subtitle` / `eyebrow` | string | Cover copy |
| `slides.markdown` | local `.md` path | Markdown file to display (default `README.md`) |
| `slides.width`, `height` | number | Virtual resolution, e.g., 1280 × 720 |
| `slides.margin` | 0–0.25 | Relative margin around slides |
| `slides.transition` | `none`, `fade`, `slide`, `convex`, `concave`, `zoom` | Reveal.js slide transition |
| `slides.transitionSpeed` | `default`, `fast`, `slow` | Transition speed |
| `slides.autoSlideMs` | 0–600000 | Automatic advance in milliseconds (0 disables) |
| `slides.autoSlideStoppable` | boolean | Stop auto-advance on interaction |
| `slides.loop` | boolean | Loop after last slide |
| `slides.center` | boolean | Vertically center slide contents |
| `slides.autoFitContent` | boolean | Try moderate font/padding adjustments on overflowing slides (default true) |
| `slides.fitSafeGapPx` | 0–100 virtual px | Keep a little clear space above slide bottom; default 18 |
| `slides.showCounter` | boolean | Toggle slide counter |
| `slides.showNavigation` | boolean | Toggle custom toolbar |
| `slides.navigationVisibility` | `auto`, `always`, `hidden` | Controls visibility behavior (default `auto`) |
| `slides.navigationHideDelayMs` | 500–15000 milliseconds | Idle delay before hiding toolbar (default 3000) |
| `slides.navigationRevealZonePx` | 50–240 pixels | Bottom-right mouse reveal zone height (default 90) |
| `slides.showRepositoryLink` | boolean | Toggle toolbar Repo button |
| `slides.allowRemoteReadme` | boolean | Allow `?url=` to load a public GitHub README |
| `theme.mode` | `dark`, `light`, `auto` | Initial color scheme |
| `theme.showToggle` | boolean | Show/hide the bottom toolbar theme button |
| `theme.lightColors` | hex color object | Light palette; `theme.colors` controls dark |
| `media.embedVideoLinks` | boolean | Embed recognized YouTube/Vimeo/direct video links |
| `media.autoplay` | boolean | Ask players to start on the active slide (browser-dependent) |
| `media.lazyLoad` | boolean | Defer media loading until slide navigation |
| `media.videoMaxWidthPx` | 320–1000 px | Max video width inside the virtual slide (default 640) |
| `media.videoMaxHeightPx` | 180–540 px | Max video height inside the virtual slide (default 350) |

For per-slide durations, Reveal.js also supports a Markdown directive such as:

```markdown
<!-- .slide: data-autoslide="12000" -->

## A slide with a twelve-second automatic interval
```

The per-slide directive is useful if most slides should advance automatically but a diagram needs more reading time. Test timing on your actual device before a live talk.

## 4. Colors, themes and fonts

Choose `theme.mode` (`dark`, `light`, or `auto`) in `presentation.config.json`. Use `theme.showToggle` to show or hide the theme button. The visitor can cycle dark → light → auto without changing the repository; the choice is remembered locally. The light preset is configured in `theme.lightColors`, while the existing `theme.colors` remains the dark preset. Mermaid diagrams are redrawn when the theme changes. See [MEDIA_AND_THEMES.md](MEDIA_AND_THEMES.md) for examples and details.

Change color hex values in `theme.colors`; supported keys are `background`, `panel`, `heading`, `accent`, `text`, `muted`, and `border`. For example:

```json
"theme": {
  "colors": {
    "background": "#0B1020",
    "panel": "#10182A",
    "heading": "#F5F7FF",
    "accent": "#36E0C4",
    "text": "#AAB9D0",
    "muted": "#8799B2",
    "border": "#30435B"
  },
  "fonts": {
    "heading": "Poppins",
    "body": "Lexend",
    "code": "JetBrains Mono"
  }
}
```

Fonts are requested from Google Fonts; their availability and exact weight support depend on the chosen family. The template covers the main theme tokens; minor special-purpose decorations may still use fixed complementary shades in CSS.

## 5. Creating diagrams, images, tables and code

- A Mermaid diagram starts with a fenced `mermaid` block. The same source renders on GitHub and in Slides.
- A table uses normal GitHub Flavored Markdown.
- Use `![Alt text](assets/images/photo.png)` for local images. External images are supported but depend on connectivity.
- Use fenced `python`, `javascript`, `bash`, or another recognized code language for syntax highlighting.
- Notes start with `Note:`. Press `S` in the presentation to open speaker notes.
- Use `<!-- .element: class="fragment" -->` for progressive list items.

## 6. Videos in slides

Write `[▶ Video: Demo](https://www.youtube.com/watch?v=VIDEO_ID)` or point to a direct `.mp4`, `.webm` or `.ogg` URL. In GitHub you see the original link; in Reveal.js the video becomes a player. You can also write `[▶ Video: Local demo](assets/videos/demo.mp4)` after adding your own file. Use HTTPS for remote videos. See [MEDIA_AND_THEMES.md](MEDIA_AND_THEMES.md) for Vimeo, loading, autoplay, and safety details.

## 7. Reusing as a viewer for another README

Example:

```text
https://jorgektch.github.io/readme-to-slides/?url=https://github.com/OWNER/REPO/blob/main/README.md
```

Only public GitHub Markdown is supported. Embedded raw HTML in remote Markdown is escaped as a precaution, so custom HTML layouts from a remote source do not render as layouts. Relative asset URLs may not resolve correctly across repositories; prefer absolute links for remote slides.

The repo link in the toolbar follows the source repository. This mode is intended for publicly shared content you trust, not a production-grade HTML sandbox for arbitrary user submissions.

## Context-aware navigation (v1.3)

The slide counter remains in the bottom-left corner. The toolbar is independent
and uses these settings:

```json
"slides": {
  "showCounter": true,
  "showNavigation": true,
  "navigationVisibility": "auto",
  "navigationHideDelayMs": 3000,
  "navigationRevealZonePx": 90
}
```

- **auto:** show on initial load, hide after inactivity, reveal on mouse proximity
  to the bottom-right area or keyboard focus (`Tab`), and keep visible during
  interaction. Touch screens get a compact ellipsis button for opening and
  closing the toolbar. The counter is always visible if `showCounter` is true.
- **always:** keep the complete toolbar visible, as in v1.2.
- **hidden:** never show the toolbar. Reveal.js keyboard shortcuts and swipe
  gestures remain available. This option is best for experienced presenters.
- **showNavigation=false:** disables navigation controls even if the visibility
  mode is `always` or `auto`.

The toolbar uses a 200 ms fade, disabled when the visitor prefers reduced motion.
Touch controls open above the footer to avoid overlapping the page counter.
See [Navigation and accessibility](NAVIGATION.md) for more details.


## 8. Slide fitting, large media and reload position (v1.4)

- `README.md` is still the only content source. Each `---` starts a horizontal slide; `--` creates a vertical detail slide.
- The slide viewer now uses numeric Reveal.js URL hashes, e.g. `#/5/1`, so **F5 reloads the same horizontal/vertical slide**. Old `#/markdown-slides` links pointed ambiguously to many generated slides; replace those bookmarks with a freshly copied URL.
- Videos have a presentation-safe maximum width and height; their original links remain available. For a large demonstration, make it a slide on its own.
- `slides.autoFitContent` tests only the active slide. When content is a little too tall, it applies compact or tight typography with reduced spacing. It **does not clip content** or automatically split arbitrary Markdown.
- Use `window.slideFitDiagnostics` in the browser console to see any overflow warnings. If the warning persists, split long tables or paragraphs into new slides; do not simply decrease the global font size until it becomes unreadable.
- `slides.fitSafeGapPx` is measured in the virtual slide dimensions, not viewport pixels. It does not reserve space for overlay controls; those remain independent.
- Theme mode `auto` remains part of the three-state toolbar and follows the operating system's color preference.


## Quality and portable tests

After replacing the sample README, you do not need to keep the sample
Mermaid diagrams, video, tables, presenter details, or vertical stack.
The included tests now use separate `tests/fixtures/` content instead
of requiring the original demonstration.

See [QUALITY_ASSURANCE.md](QUALITY_ASSURANCE.md) for the pre-publication
checklist and the limits of automated checks.
