#!/usr/bin/env python3
"""Build the signed-by-tag / SHA-256 engine lock included in each release.

Release process: run this command on the upstream repo before tagging a release,
commit its output, then create a GitHub Release from the corresponding tag.
"""
import argparse
import hashlib
import json
from pathlib import Path

MANAGED_FILES = (
    'assets/js/app.mjs',
    'assets/js/config.mjs',
    'assets/js/fit.mjs',
    'assets/js/media.mjs',
    'assets/js/navigation.mjs',
    'assets/js/remote-assets.mjs',
    'assets/js/theme.mjs',
    'assets/theme.css',
)


def make_manifest(root, version):
    files = {}
    for path in MANAGED_FILES:
        raw = (root / path).read_bytes()
        files[path] = hashlib.sha256(raw).hexdigest()
    return {
        'schemaVersion': 1,
        'engine': 'readme-to-slides',
        'upstreamRepository': 'jorgektch/readme-to-slides',
        'version': version,
        'configurationSchema': 1,
        'requiresManualMigration': False,
        'managedFiles': files,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--version', default='1.5.0')
    args = parser.parse_args()
    import re
    if not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)',args.version):
        parser.error('Version must be SemVer: X.Y.Z')
    data = make_manifest(args.root, args.version)
    path = args.root / 'engine-release.json'
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Wrote {path}: {len(data["managedFiles"])} managed files')


if __name__ == '__main__':
    main()
