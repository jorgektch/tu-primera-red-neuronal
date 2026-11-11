# Workshop + presentation engine

This repository combines the educational content originally developed in
[`jorgektch/mi-primera-red-neuronal`](https://github.com/jorgektch/mi-primera-red-neuronal)
with the more recent [README to Slides](https://github.com/jorgektch/readme-to-slides)
engine in `jorgektch/tu-primera-red-neuronal`.

- **Workshop version:** `1.0.0` in `package.json`.
- **Presentation engine version:** `1.5.1` in `engine-release.json`.
- The engine-managed files under `assets/js/`, `assets/theme.css` and the
  version lock **must remain unchanged** by importing workshop files.
- Future engine updates are opt-in PRs; `README.md`, `presentation.config.json`,
  the dataset, notebook, model, and `demo/` remain user-owned.
- `docs/ESTRUCTURA.md` describes workshop files; `docs/ARCHITECTURE.md`
  preserves the upstream presentation engine architecture.

## Execute locally

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s tests -p test_workshop.py -v
node --test tests/*.test.mjs
python tests/check_deck.py
python tests/check_workshop.py
npm run test:e2e
```

The camera requires HTTPS or localhost and device permission. The model classifies
smiley **drawings**, not human emotions. Synthetic test accuracy is not evidence
of performance on photographs of hand-drawn artwork.
