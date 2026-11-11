"""Regression checks against a *copied* template, using stdlib only."""
from pathlib import Path
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1]
REQUIRED = [
    'tests/check_deck.py', 'index.html', 'presentation.config.json', 'LICENSE',
    'assets/theme.css', 'assets/js/app.mjs', 'assets/js/config.mjs',
    'assets/js/media.mjs', 'assets/js/navigation.mjs',
    'assets/js/fit.mjs', 'assets/js/theme.mjs',
]

class TemplateCopyValidationTests(unittest.TestCase):
    def setUp(self):
        self.work = tempfile.TemporaryDirectory(prefix='deck-copy-test-')
        self.root = Path(self.work.name)
        for rel in REQUIRED:
            target = self.root / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(SOURCE / rel, target)
        (self.root / 'README.md').write_text('# Mi taller\n\nUn slide mínimo.\n', encoding='utf-8')
        self.config = json.loads((self.root / 'presentation.config.json').read_text(encoding='utf-8'))
        self.config['presentation'].update(
            title='Mi charla real', repositoryUrl='https://github.com/example-person/my-talk')
        self.save()

    def tearDown(self):
        self.work.cleanup()

    def save(self):
        (self.root / 'presentation.config.json').write_text(
            json.dumps(self.config, ensure_ascii=False, indent=2), encoding='utf-8')

    def run_check(self):
        env = os.environ.copy()
        env['GITHUB_REPOSITORY'] = 'example-person/my-talk'
        return subprocess.run([sys.executable, 'tests/check_deck.py'], cwd=self.root,
            env=env, capture_output=True, text=True, check=False)

    def test_minimal_deck_not_requiring_demo_content(self):
        r = self.run_check()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('OK: configurable deck', r.stdout)

    def test_fresh_unconfigured_template_copy_passes_initial_actions(self):
        self.config['presentation']['repositoryUrl'] = None
        self.save()
        r = self.run_check()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertNotIn('Set presentation.repositoryUrl', r.stdout)
        self.assertNotIn('Template copy detected', r.stderr)

    def test_original_template_repo_url_fails_with_helpful_message(self):
        self.config['presentation']['repositoryUrl'] = 'https://github.com/jorgektch/readme-to-slides'
        self.save()
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('Template copy detected', r.stderr)
        self.assertIn('example-person/my-talk', r.stderr)

    def test_missing_relative_image_fails_clearly(self):
        (self.root / 'README.md').write_text('# Demo\n\n![Broken](assets/missing.png)\n', encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('Missing local asset', r.stderr)

    def test_image_reference_succeeds_when_file_exists(self):
        (self.root / 'assets' / 'sample.png').write_bytes(b'PNG-SAMPLE')
        (self.root / 'README.md').write_text('# Demo\n\n![Okay](assets/sample.png)\n', encoding='utf-8')
        self.assertEqual(self.run_check().returncode, 0)

    def test_unclosed_markdown_fence_fails(self):
        (self.root / 'README.md').write_text('# Example\n\n```python\nprint(1)', encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('unclosed fenced', r.stderr)

    def test_separator_inside_code_fence_is_reported(self):
        (self.root / 'README.md').write_text('# Example\n\n```markdown\n---\n```', encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('separator inside fenced code', r.stderr)

    def test_duplicate_loader_id_is_rejected(self):
        file = self.root / 'index.html'
        file.write_text(file.read_text(encoding='utf-8').replace(
            'data-deck-source="readme"', 'id="markdown-slides" data-deck-source="readme"'), encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('shared id', r.stderr)

    def test_invalid_json_fails_gracefully(self):
        (self.root / 'presentation.config.json').write_text('{oops', encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('Invalid presentation.config.json', r.stderr)

    def test_invalid_local_docs_link_is_detected(self):
        (self.root / 'README.md').write_text('# Talk\n\n[Slides](docs/missing.md)\n', encoding='utf-8')
        r = self.run_check()
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('Missing local asset', r.stderr)

    def test_unreadable_palette_is_reported_as_warning(self):
        self.config['theme']['lightColors'].update(background='#FFFFFF',text='#FFFFFF')
        self.save()
        r = self.run_check()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn('Low contrast', r.stdout)

    def test_a_different_speaker_and_theme_are_allowed(self):
        self.config['presenter']['name'] = 'Someone Else'
        self.config['theme']['mode'] = 'light'
        self.config['slides']['showNavigation'] = False
        self.save()
        self.assertEqual(self.run_check().returncode, 0)

if __name__ == '__main__':
    unittest.main(verbosity=2)
