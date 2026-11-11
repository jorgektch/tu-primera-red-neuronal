#!/usr/bin/env python3
"""Fail-closed, opt-in update client for README to Slides template copies.

Reads official GitHub Releases; downloads only allowlisted engine files from the
same immutable-looking release tag; verifies SHA-256 and local modification guards.
Changes are prepared for review through a Pull Request by the companion Action.
No README, presentation.config.json, docs, user datasets or tests are replaced.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

from build_engine_manifest import MANAGED_FILES

UPSTREAM = 'jorgektch/readme-to-slides'
MANIFEST = 'engine-release.json'
MAX_FILE_BYTES = 400_000
VERSION_RE = re.compile(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\Z')
SHA_RE = re.compile(r'[a-f0-9]{64}\Z')


class UpdateError(RuntimeError):
    pass


def parse_version(value):
    result = VERSION_RE.fullmatch(str(value))
    if not result:
        raise UpdateError(f'Invalid engine version: {value!r}; expected X.Y.Z')
    return tuple(int(group) for group in result.groups())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def validate_manifest(manifest):
    if not isinstance(manifest, dict) or type(manifest.get('schemaVersion')) is not int or manifest.get('schemaVersion') != 1:
        raise UpdateError('Invalid or unsupported engine-release.json schema')
    if manifest.get('engine') != 'readme-to-slides' or manifest.get('upstreamRepository') != UPSTREAM:
        raise UpdateError('Unexpected engine identity/upstream; refusing update')
    parse_version(manifest.get('version'))
    if type(manifest.get('configurationSchema')) is not int:
        raise UpdateError('Invalid configuration schema')
    if type(manifest.get('requiresManualMigration')) is not bool:
        raise UpdateError('Invalid migration flag')
    files = manifest.get('managedFiles')
    if not isinstance(files, dict) or set(files) != set(MANAGED_FILES):
        raise UpdateError('Manifest must contain exactly the known engine file allowlist')
    if not all(isinstance(v, str) and SHA_RE.fullmatch(v) for v in files.values()):
        raise UpdateError('Invalid SHA-256 hashes in release manifest')
    return manifest


def github_get_json(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.hostname != 'api.github.com' or parsed.port:
        raise UpdateError('Refusing untrusted GitHub API URL')
    req = Request(url, headers={'Accept':'application/vnd.github+json',
                                'User-Agent':'readme-to-slides-updater/1.5',
                                'X-GitHub-Api-Version':'2022-11-28'})
    # Public release information does not require a token. Do not grant the
    # updater write credentials; the workflow exposes its token only for PR.
    try:
        with urlopen(req, timeout=20) as response:
            if urlsplit(response.url).hostname != 'api.github.com':
                raise UpdateError('Unexpected API redirect')
            data=response.read(MAX_FILE_BYTES + 1)
    except HTTPError as e:
        if e.code == 404:
            return None
        raise UpdateError(f'GitHub release lookup failed with HTTP {e.code}') from e
    if len(data) > MAX_FILE_BYTES:
        raise UpdateError('GitHub API response too large')
    return json.loads(data)


def raw_download(tag, file_path):
    if not VERSION_RE.fullmatch(tag.removeprefix('v')):
        raise UpdateError('Invalid release tag')
    if file_path != MANIFEST and file_path not in MANAGED_FILES:
        raise UpdateError(f'File is not an allowlisted engine resource: {file_path}')
    url=f'https://raw.githubusercontent.com/{UPSTREAM}/{quote(tag)}/{file_path}'
    req=Request(url, headers={'User-Agent':'readme-to-slides-updater/1.5'})
    try:
        with urlopen(req,timeout=20) as response:
            parsed=urlsplit(response.url)
            if parsed.scheme!='https' or parsed.hostname != 'raw.githubusercontent.com' or parsed.port:
                raise UpdateError('Unexpected download redirect')
            result=response.read(MAX_FILE_BYTES + 1)
    except HTTPError as e:
        raise UpdateError(f'Cannot download {file_path} from release {tag}: HTTP {e.code}') from e
    if len(result) > MAX_FILE_BYTES:
        raise UpdateError(f'Engine file too large: {file_path}')
    return result


def plan_update(root, installed, latest, fetch):
    """Validate the entire update before writing any file (no partial changes)."""
    installed=validate_manifest(installed)
    latest=validate_manifest(latest)
    old_version=parse_version(installed['version'])
    new_version=parse_version(latest['version'])
    if new_version <= old_version:
        return {}, 'current', latest['version']
    if old_version[0] != new_version[0]:
        return {}, 'breaking', latest['version']
    if (installed['configurationSchema'] != latest['configurationSchema'] or
            latest['requiresManualMigration']):
        return {}, 'migration', latest['version']

    # Never overwrite files that have been manually customized by a speaker.
    for path, old_hash in installed['managedFiles'].items():
        location=root/path
        if not location.is_file() or sha(location.read_bytes()) != old_hash:
            raise UpdateError(f'Customized or missing engine file: {path}. Manual merge required; no changes made.')

    changes={}
    for path, desired_hash in latest['managedFiles'].items():
        raw=fetch(path)
        if len(raw)>MAX_FILE_BYTES or sha(raw)!=desired_hash:
            raise UpdateError(f'SHA-256 mismatch or oversized download: {path}; no files changed')
        if raw != (root/path).read_bytes():
            changes[path]=raw
    changes[MANIFEST]=(json.dumps(latest,indent=2,ensure_ascii=False)+'\n').encode('utf-8')
    return changes, 'updated', latest['version']


def run(root, *, fixture_manifest=None, fixture_root=None):
    installed_path=root/MANIFEST
    if not installed_path.is_file():
        raise UpdateError('Missing engine-release.json; install the supported updater/manifest first')
    installed=json.loads(installed_path.read_text(encoding='utf-8'))
    validate_manifest(installed)
    if fixture_manifest:
        latest=json.loads(Path(fixture_manifest).read_text(encoding='utf-8'))
        if fixture_root is None:
            raise UpdateError('--fixture-root required with --fixture-manifest')
        fetch=lambda name:(Path(fixture_root)/name).read_bytes()
    else:
        release=github_get_json(f'https://api.github.com/repos/{UPSTREAM}/releases/latest')
        if release is None:
            return 'no-release',None,0
        tag=release.get('tag_name')
        if not isinstance(tag,str) or not tag.startswith('v'):
            raise UpdateError('Latest GitHub release must have a vX.Y.Z tag')
        # Always read the release manifest and all resources from its exact tag.
        manifest_bytes=raw_download(tag,MANIFEST)
        latest=json.loads(manifest_bytes)
        if 'v'+latest.get('version','') != tag:
            raise UpdateError('Release tag and manifest version do not match')
        fetch=lambda name:raw_download(tag,name)
    changes,status,version=plan_update(root,installed,latest,fetch)
    for path,raw in changes.items():
        dest=root/path
        if not dest.parent.is_dir() or dest.is_symlink():
            raise UpdateError(f'Unsafe output path: {path}')
        dest.write_bytes(raw)
    return status,version,len(changes)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--report',type=Path)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--fixture-manifest',type=Path,help='For isolated tests only')
    parser.add_argument('--fixture-root',type=Path,help='For isolated tests only')
    args=parser.parse_args()
    try:
        status,version,count=run(args.root,fixture_manifest=args.fixture_manifest,fixture_root=args.fixture_root)
        message={
            'updated':f'Update to v{version} prepared: {count-1} engine files plus lock. Review the PR before merging.',
            'current':'Already at the latest compatible release.',
            'breaking':f'v{version} changes major engine version. Manual upgrade required.',
            'migration':f'v{version} requires config migration. Manual upgrade required.',
            'no-release':'No published upstream GitHub Release found; no changes made.',
        }[status]
        print(f'{status}: {message}')
    except (OSError,ValueError,UpdateError) as e:
        status,version,count='error',None,0
        message=str(e)
        print(f'UPDATE REFUSED: {message}',file=sys.stderr)
    if args.report:
        args.report.write_text(f'## README to Slides engine update\n\nStatus: **{status}**\n\n{message}\n',encoding='utf-8')
    if args.output:
        with args.output.open('a',encoding='utf-8') as handle:
            handle.write(f'updated={str(status=="updated").lower()}\n')
            handle.write(f'version={version or "none"}\n')
            handle.write(f'status={status}\n')
    if status=='error':
        raise SystemExit(2)


if __name__=='__main__':
    main()
