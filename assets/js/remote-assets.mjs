/**
 * Resolve parsed Markdown DOM resources relative to a GitHub README source.
 *
 * We rewrite rendered DOM attributes (not Markdown text) so fenced/inline code,
 * reference labels, and examples can never be accidentally rewritten.
 * Untrusted remote HTML is escaped independently by prepareRemoteMarkdown().
 */
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const BAD_ENCODING_RE = /%(?:00|2f|5c)/i;

/** Return an absolute public GitHub URL or null when the link must be blocked. */
export function resolveRemoteAssetUrl(value, remote, kind = 'link') {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || /[\\\u0000-\u001f\u007f]/.test(candidate) || BAD_ENCODING_RE.test(candidate)) return null;
  if (candidate.startsWith('#')) return candidate; // Keep in-slide anchors.

  if (SCHEME_RE.test(candidate) || candidate.startsWith('//')) {
    try {
      const url = new URL(candidate, 'https://example.test/');
      if (url.protocol === 'https:' || url.protocol === 'http:') return candidate;
      if (kind === 'link' && ['mailto:', 'tel:'].includes(url.protocol)) return candidate;
    } catch { /* reject invalid URLs */ }
    return null;
  }

  if (!remote || typeof remote.rawUrl !== 'string') return null;
  let source;
  try { source = new URL(remote.rawUrl); } catch { return null; }
  if (source.protocol !== 'https:' || source.hostname !== 'raw.githubusercontent.com' || source.port) return null;
  const parts = source.pathname.split('/').filter(Boolean);
  // GitHub raw URLs: /OWNER/REPO/REF/path/to/README.md.
  if (parts.length < 4 || parts.slice(0, 3).some(s => !s || s === '..')) return null;
  const root = `/${parts.slice(0, 3).join('/')}/`;

  try {
    // Leading / means repository root, not raw.githubusercontent.com root.
    const sourceBase = candidate.startsWith('/')
      ? new URL(`https://raw.githubusercontent.com${root}`)
      : source;
    const relative = candidate.startsWith('/') ? `.${candidate}` : candidate;
    const result = new URL(relative, sourceBase);
    if (result.origin !== 'https://raw.githubusercontent.com') return null;
    if (!result.pathname.startsWith(root)) return null; // Disallow leaving repo/ref.
    if (kind === 'link' && /\.(?:md|markdown|ipynb)$/i.test(result.pathname)) {
      const blobPath = result.pathname.slice(1);
      return `https://github.com/${parts[0]}/${parts[1]}/blob/${parts[2]}/${result.pathname.slice(root.length)}${result.search}${result.hash}`;
    }
    return result.href;
  } catch { return null; }
}

/** Rewrite only actual parsed href/src attributes, never code or raw Markdown. */
export function rewriteRemoteSlideAssets(deckRoot, remote) {
  let rewritten = 0;
  let blocked = 0;
  if (!deckRoot || !remote) return {rewritten, blocked};
  for (const [selector, attr, kind] of [
    ['a[href]', 'href', 'link'],
    ['img[src]', 'src', 'image'],
    ['video[src],source[src]', 'src', 'media']
  ]) {
    deckRoot.querySelectorAll(selector).forEach(el => {
      if (el.closest('pre,code,.readme-only')) return;
      const current = el.getAttribute(attr);
      const resolved = resolveRemoteAssetUrl(current, remote, kind);
      if (resolved === null) {
        el.removeAttribute(attr);
        el.dataset.blockedRemoteAsset = 'true';
        blocked++;
      } else if (resolved !== current) {
        el.setAttribute(attr, resolved);
        rewritten++;
      }
    });
  }
  return {rewritten, blocked};
}
