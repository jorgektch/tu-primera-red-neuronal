# Multimedia and themes — README to Slides v1.2

The public `README.md` is still **the source of slide content**. Configuration is stored in [`presentation.config.json`](../presentation.config.json).

## Video: plain Markdown becomes an embedded player

Paste a normal Markdown hyperlink inside a slide:

```markdown
## Product demonstration

[▶ Video: Watch the demo](https://www.youtube.com/watch?v=VIDEO_ID)
```

The link **stays a clickable link in GitHub**; inside the browser presentation the JavaScript recognizes the video host and creates a player. Use a real 11-character YouTube video ID. The player may refuse to load if the owner disables embedding, if network policies block the provider, or if the device is offline.

Supported inputs:

```markdown
[▶ Video: YouTube](https://youtu.be/VIDEO_ID)
[▶ Video: Vimeo](https://vimeo.com/123456789)
[▶ Video: MP4](https://example.com/path/demo.mp4)
[▶ Video: file in your repository](assets/videos/demo.mp4)
```

Direct video files are supported for **MP4, WebM and Ogg**, served over HTTPS or as a relative file from your own GitHub Pages repository. The browser must support the codec and the remote host must allow loading it. YouTube and Vimeo URLs are converted to the providers' official embed endpoints. Unrecognized links remain ordinary links. To keep a recognized link as text in the slides, use custom HTML `<a data-no-video href="...">Open video</a>` in a trusted local README.

**Remote README mode (`?url=`):** raw HTML from third-party Markdown is escaped. Video links can still be recognized, but relative media paths resolve against the viewer rather than the original repository. Use absolute URLs when loading another repository's content.

### Video settings

```json
"media": {
  "embedVideoLinks": true,
  "autoplay": false,
  "lazyLoad": true
}
```

- `embedVideoLinks`: enables automatic conversion of recognized video links.
- `autoplay`: requests playback when opening the slide. Browser autoplay restrictions, particularly on sound, may prevent it. Default `false` is better for talks and workshops.
- `lazyLoad`: delays downloading media until needed, particularly useful for decks with many videos. Iframes are unloaded on leaving their slide to stop playback; files are paused.

When a video is shown, a link to its original location stays below the player as a fallback. Provider cookies, analytics, and embedding policies are controlled by those sites, not by this project. YouTube uses the `youtube-nocookie.com` embed endpoint; Vimeo uses the `dnt=1` player parameter, but neither guarantees zero third-party data processing.

## Themes: dark, light and auto

Choose the initial mode in the JSON:

```json
"theme": {
  "mode": "auto",
  "showToggle": true,
  "colors": {
    "background":"#0B1020", "panel":"#10182A", "heading":"#F5F7FF",
    "accent":"#36E0C4", "text":"#AAB9D0", "muted":"#8799B2", "border":"#30435B"
  },
  "lightColors": {
    "background":"#F7FAFC", "panel":"#FFFFFF", "heading":"#172334",
    "accent":"#007C70", "text":"#344054", "muted":"#667085", "border":"#CBD5E1"
  }
}
```

- `dark` starts with the original midnight-blue design and turquoise accents.
- `light` uses a matching light background, surfaces, diagrams and code blocks.
- `auto` follows the browser's `prefers-color-scheme` setting, including changes made while the presentation is open.

The new toolbar button cycles `dark → light → auto → dark`. A user's choice is saved using localStorage for the site origin, without changing the repository configuration; this means the same browser remembers its preferred appearance on reload. Clear the key `readme-to-slides.theme-choice.v1` in site storage to return to the default from JSON.

The theme switch also **rerenders Mermaid diagrams** with the selected colors. The original README contents and Mermaid source code do not change. Fonts and base colors remain editable through `presentation.config.json`.

### Special backgrounds

Avoid hardcoding `data-background-color="#0B1020"` in Markdown if you want your slides to follow Light Mode. The built-in example has removed this override from the cover. An explicitly chosen background color on a particular slide is still respected as an intentional design choice.

### Limitations

- Mermaid diagrams need the Mermaid CDN to render on the presentation; GitHub renders Mermaid on its own.
- Videos depend on the provider, network, browser codecs and embedding permissions.
- YouTube/Vimeo frames are not guaranteed to work in every privacy setting or network.
- Light Mode uses token-based colors, but custom HTML with manually hardcoded colors needs its own adjustments.
- Neither video URL recognition nor Markdown escaping is a complete HTML security sandbox. Never insert untrusted HTML into your local README.
