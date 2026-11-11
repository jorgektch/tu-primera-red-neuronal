# Context-aware navigation — v1.3

The toolbar is designed to disappear during a talk while leaving the **slide
counter permanently visible** at bottom left. It never changes the slide layout
or the position of either footer element.

## Interaction

| Device / action | Behavior |
| --- | --- |
| First load | Navigation shown briefly as an affordance |
| Idle (default 3000 ms) | Navigation fades out; counter stays visible |
| Mouse moves near bottom-right corner | Navigation reappears |
| Pointer is over the toolbar | Navigation remains visible |
| Keyboard `Tab` moves focus into toolbar | Navigation reappears and stays while focused |
| Touchscreen | Small `···` button toggles the toolbar above the counter |
| Tap elsewhere on touchscreen | Toolbar closes |
| Arrow keys | Reveal.js navigation works even with the toolbar visually hidden |
| Reduce Motion preference | No fade/translation animation |

The bottom-right reveal zone is transparent: there is no always-visible hover
hotspot on a desktop projector. The toolbar remains accessible via keyboard
focus for accessibility, including when transparent.

## Settings

Modify [`presentation.config.json`](../presentation.config.json):

```json
"slides": {
  "showCounter": true,
  "showNavigation": true,
  "navigationVisibility": "auto",
  "navigationHideDelayMs": 3000,
  "navigationRevealZonePx": 90
}
```

`navigationVisibility` accepts `auto`, `always`, `hidden`.

- `auto` is the recommended mode for presenting.
- `always` restores the v1.2 look.
- `hidden` removes the toolbar; keyboard/swipe navigation remains, but access
  to theme, overview and repository shortcuts is less discoverable.

`navigationHideDelayMs` accepts 500–15000 milliseconds; values outside that
range fall back to 3000. `navigationRevealZonePx` accepts 50–240 pixels (default
90) and controls how close to the bottom-right edge a mouse must move to
reveal the toolbar.

If you disable the counter with `showCounter: false`, it will disappear; the
auto-hide controller never changes that setting.

The floating touch reveal button is also hidden when `showNavigation: false` or
`navigationVisibility: "hidden"`.
