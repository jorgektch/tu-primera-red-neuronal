# Contributing

Thanks for improving **README to Slides**!

1. Open an issue explaining the problem or improvement.
2. Create a branch, make focused changes, and keep `README.md` as the slide content source.
3. Run `node --test tests/*.test.mjs` and `python3 tests/check_deck.py`.
4. For UI changes, run `npm install`, `npx playwright install chromium`, start `python -m http.server 8765`, and run `npm run test:e2e`.
5. Open a pull request describing what changed and how to reproduce it.

Please avoid introducing API keys, private data, unlicensed imagery, or needless runtime dependencies. The template intentionally includes its original creator's public contact details; forks may replace these values in `presentation.config.json`.
