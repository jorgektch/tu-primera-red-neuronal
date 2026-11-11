"""Offline end-to-end updater tests: no GitHub credentials or network needed."""
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from build_engine_manifest import MANAGED_FILES,make_manifest
from update_engine import UpdateError,plan_update,run,validate_manifest


class EngineUpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)/'user-project'
        self.upstream=Path(self.tmp.name)/'upstream-vnext'
        for dest in [self.root,self.upstream]:
            dest.mkdir(parents=True)
            for name in MANAGED_FILES:
                (dest/name).parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(ROOT/name,dest/name)
        self.installed=make_manifest(self.root,'1.5.0')
        (self.root/'engine-release.json').write_text(json.dumps(self.installed),encoding='utf8')
        (self.root/'README.md').write_text('# Custom workshop\n',encoding='utf8')
        (self.root/'presentation.config.json').write_text('{"presenter":{"name":"Custom Speaker"}}',encoding='utf8')

    def make_next(self,version='1.5.1',config_schema=1,migration=False):
        target=self.upstream/'assets/theme.css'
        target.write_text(target.read_text()+'\n/* New upstream improvement */\n',encoding='utf8')
        manifest=make_manifest(self.upstream,version)
        manifest['configurationSchema']=config_schema
        manifest['requiresManualMigration']=migration
        file=self.upstream/'engine-release.json'
        file.write_text(json.dumps(manifest),encoding='utf8')
        return manifest,file

    def test_successful_update_only_changes_engine_and_lock(self):
        latest,manifest=self.make_next()
        status,version,n=run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((status,version,n),('updated','1.5.1',2))
        self.assertIn('New upstream improvement',(self.root/'assets/theme.css').read_text())
        self.assertEqual((self.root/'README.md').read_text(),'# Custom workshop\n')
        self.assertEqual(json.loads((self.root/'presentation.config.json').read_text())['presenter']['name'],'Custom Speaker')
        self.assertEqual(json.loads((self.root/'engine-release.json').read_text())['version'],'1.5.1')

    def test_modified_local_engine_file_is_not_overwritten(self):
        _,manifest=self.make_next()
        (self.root/'assets/theme.css').write_text('/* my personal CSS */')
        with self.assertRaisesRegex(UpdateError,'Customized or missing'):
            run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((self.root/'assets/theme.css').read_text(),'/* my personal CSS */')
        self.assertEqual(json.loads((self.root/'engine-release.json').read_text())['version'],'1.5.0')

    def test_corrupt_upstream_download_prevents_any_changes(self):
        latest,manifest=self.make_next()
        (self.upstream/'assets/theme.css').write_text('tampered after release manifest')
        original=(self.root/'assets/theme.css').read_bytes()
        with self.assertRaisesRegex(UpdateError,'SHA-256 mismatch'):
            run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((self.root/'assets/theme.css').read_bytes(),original)
        self.assertEqual(json.loads((self.root/'engine-release.json').read_text())['version'],'1.5.0')

    def test_major_bump_requires_manual_migration(self):
        _,manifest=self.make_next('2.0.0')
        status,version,n=run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((status,version,n),('breaking','2.0.0',0))

    def test_config_schema_change_requires_manual_migration(self):
        _,manifest=self.make_next('1.5.1',config_schema=2)
        status,version,n=run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((status,version,n),('migration','1.5.1',0))

    def test_release_marked_manual_migration_is_not_applied(self):
        _,manifest=self.make_next('1.5.1',migration=True)
        status,version,n=run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((status,version,n),('migration','1.5.1',0))

    def test_invalid_manifest_paths_are_rejected(self):
        _,manifest=self.make_next()
        bad=json.loads(manifest.read_text())
        bad['managedFiles']['README.md']='0'*64
        manifest.write_text(json.dumps(bad))
        with self.assertRaisesRegex(UpdateError,'allowlist'):
            run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)

    def test_equal_version_has_no_changes(self):
        _,manifest=self.make_next('1.5.0')
        status,version,n=run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)
        self.assertEqual((status,version,n),('current','1.5.0',0))

    def test_invalid_manifest_hash_is_rejected(self):
        _,manifest=self.make_next()
        bad=json.loads(manifest.read_text())
        bad['managedFiles']['assets/theme.css']='abc'
        manifest.write_text(json.dumps(bad))
        with self.assertRaisesRegex(UpdateError,'SHA-256'):
            run(self.root,fixture_manifest=manifest,fixture_root=self.upstream)

if __name__=='__main__':
    unittest.main()
