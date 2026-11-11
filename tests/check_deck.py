"""Validate a repository created from README to Slides without assuming demo content.

Run: python tests/check_deck.py
Actions: compare presentation.repositoryUrl with GITHUB_REPOSITORY to catch
accidental links to the source template before publishing a cloned project.
"""
from pathlib import Path
import json
import os
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []
WARNINGS = []

def error(message):
    ERRORS.append(message)

def text(path):
    try:
        return (ROOT / path).read_text(encoding="utf-8")
    except OSError as exc:
        error(f"Missing/unreadable {path}: {exc}")
        return ""

def local_path(path):
    """Only validate simple local file references, never remote links."""
    url = urlsplit(path)
    if url.scheme or url.netloc or path.startswith(("#", "//", "mailto:", "data:")):
        return None
    if url.path.startswith("/"):
        return None
    raw = unquote(url.path).strip()
    if not raw:
        return None
    candidate = (ROOT / raw).resolve()
    if not candidate.is_relative_to(ROOT.resolve()):
        error(f"Local asset path escapes repository: {path}")
        return None
    return candidate

def without_fences(source):
    """Ignore fenced code examples when scanning for paths and slide separators."""
    lines = []
    opened = None
    for number, line in enumerate(source.splitlines(), 1):
        fence = re.match(r"^\s*(`{3,}|~{3,})", line)
        if fence:
            char = fence.group(1)[0]
            if opened is None:
                opened = (char, len(fence.group(1)))
            elif char == opened[0] and len(fence.group(1)) >= opened[1]:
                opened = None
            lines.append("")
        elif opened:
            # Separators inside code blocks can confuse Reveal's markdown plugin.
            if line.strip() in ("---", "--"):
                error(f"Markdown line {number}: separator inside fenced code may split a slide; escape or indent the separator")
            lines.append("")
        else:
            lines.append(line)
    if opened:
        error("README.md contains an unclosed fenced code block")
    return "\n".join(lines)

try:
    cfg = json.loads(text("presentation.config.json"))
except (ValueError, TypeError) as exc:
    error(f"Invalid presentation.config.json: {exc}")
    cfg = {}

if not isinstance(cfg, dict):
    error("presentation.config.json must be a JSON object")
    cfg = {}

pres = cfg.get("presentation") or {}
slide_cfg = cfg.get("slides") or {}
if not isinstance(pres, dict) or not isinstance(slide_cfg, dict):
    error("presentation and slides must be JSON objects")
    pres, slide_cfg = {}, {}

if not isinstance(pres.get("title"), str) or not pres.get("title", "").strip():
    error("presentation.title must be a nonempty string")

markdown_path = slide_cfg.get("markdown", "README.md")
if not isinstance(markdown_path, str) or not re.fullmatch(r"[\w./-]+\.md", markdown_path) or ".." in markdown_path:
    error("slides.markdown must point to a safe relative .md file")
    markdown_path = "README.md"
markdown = text(markdown_path)
if not markdown.strip():
    error(f"Slides source {markdown_path} is empty")
clean = without_fences(markdown)

# Protect against accidental collisions in Reveal URL hashes.
index = text("index.html")
if re.search(r'<section[^>]+id=["\']markdown-slides["\']', index):
    error("The markdown slide loader must not have a shared id (breaks F5/hash URLs)")
for tag in ('data-deck-source="readme"', 'data-markdown=', 'assets/js/app.mjs'):
    if tag not in index:
        error(f"index.html is missing {tag}")
for file in ("assets/js/app.mjs", "assets/js/config.mjs", "assets/js/fit.mjs", "assets/js/navigation.mjs", "assets/js/theme.mjs", "assets/js/media.mjs", "assets/theme.css", "LICENSE"):
    if not (ROOT / file).is_file():
        error(f"Missing presentation engine file: {file}")

# Assets embedded in Markdown/HTML must be present, but a user is free to
# delete the demonstration's preview, tables, video, diagrams and vertical slides.
assets = []
for match in re.finditer(r'!\[[^\]]*\]\(([^\s)]+)', clean):
    assets.append(match.group(1))
for match in re.finditer(r'<(?:img|video|source)\b[^>]*\bsrc\s*=\s*["\']([^"\']+)', clean, re.I):
    assets.append(match.group(1))
for match in re.finditer(r'\[[^\]]+\]\(([^\s)]+\.(?:mp4|webm|ogg|ogv)(?:\?[^\s)]*)?)', clean, re.I):
    assets.append(match.group(1))
# Check locally referenced docs as well as image/video resources.
for match in re.finditer(r'\[[^\]]+\]\(([^\s)]+\.(?:md|html|pdf|ipynb)(?:[?#][^\s)]*)?)', clean, re.I):
    assets.append(match.group(1))
for match in re.finditer(r'<a\b[^>]*\bhref\s*=\s*["\']([^"\']+)', clean, re.I):
    href = match.group(1)
    if re.search(r'\.(?:md|html|pdf|ipynb)(?:$|[?#])', href, re.I):
        assets.append(href)
for path in assets:
    candidate = local_path(path)
    if candidate is not None and not candidate.is_file():
        error(f"Missing local asset referenced by {markdown_path}: {path}")

# Configuration errors after copying a template must be actionable, not a
# mysterious Playwright timeout or a misleading 'Repo' button.
repo_url = pres.get("repositoryUrl")
if repo_url:
    parsed = urlsplit(str(repo_url))
    segments = [seg for seg in parsed.path.strip("/").split("/") if seg]
    if (parsed.scheme != "https" or parsed.netloc != "github.com" or len(segments) != 2 or
            parsed.query or parsed.fragment):
        error("presentation.repositoryUrl must be https://github.com/OWNER/REPO")
actions_repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
if actions_repo and repo_url and str(repo_url).rstrip("/").lower() != f"https://github.com/{actions_repo}".lower():
    error(f"Template copy detected: presentation.repositoryUrl is '{repo_url}', but this Actions run is '{actions_repo}'. Update the JSON to https://github.com/{actions_repo}")

# Warnings do not block custom branding, but alert speakers to common
# copied-template mistakes and unreadable color combinations.
if actions_repo and actions_repo.lower() != 'jorgektch/readme-to-slides':
    if 'https://github.com/jorgektch/readme-to-slides' in markdown:
        WARNINGS.append('README links still point to the template original; review intentional and copied references')

def contrast_ratio(foreground, background):
    def luminance(value):
        rgb = [int(value[i:i+2], 16) / 255 for i in (1, 3, 5)]
        linear = [x/12.92 if x <= 0.04045 else ((x + 0.055)/1.055)**2.4 for x in rgb]
        return 0.2126*linear[0] + 0.7152*linear[1] + 0.0722*linear[2]
    bright, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (bright + 0.05) / (dark + 0.05)

for palette_name in ('colors','lightColors'):
    colors = (cfg.get('theme') or {}).get(palette_name, {})
    if not isinstance(colors, dict):
        continue
    background = colors.get('background')
    for role in ('heading','text'):
        fg = colors.get(role)
        if isinstance(fg,str) and isinstance(background,str) and re.fullmatch(r'#[0-9a-fA-F]{6}',fg) and re.fullmatch(r'#[0-9a-fA-F]{6}',background):
            ratio = contrast_ratio(fg,background)
            if ratio < 4.5:
                WARNINGS.append(f'Low contrast: theme.{palette_name}.{role} vs background ({ratio:.2f}:1; recommended 4.5:1 or higher)')

for warning in WARNINGS:
    print("WARNING:", warning)
if ERRORS:
    for item in ERRORS:
        print("ERROR:", item, file=sys.stderr)
    sys.exit(1)
print(f"OK: configurable deck; {len(re.findall(r'^---$', clean, re.M)) + 1} horizontal sections; {len(assets)} assets checked")
