/** Pure configuration and URL helpers; also exercised with Node's built-in test runner. */
export const DEFAULTS = Object.freeze({
  presentation: {
    title: 'README to Slides', subtitle: 'Write once. Document and present.',
    eyebrow: 'OPEN SOURCE · MARKDOWN PRESENTATIONS', titleFromRepository: false,
    repositoryUrl: null
  },
  presenter: {
    name: 'Jorge Jesús Quispe Villaverde',
    role: 'AI Engineer · Applied AI Researcher · AI Mentor',
    email: 'jorgektch@gmail.com', handle: '/jorgektch',
    social: { github: 'https://github.com/jorgektch',
      instagram: 'https://www.instagram.com/jorgektch',
      tiktok: 'https://www.tiktok.com/@jorgektch' }
  },
  theme: { mode:'dark', showToggle:true, colors: {
    background: '#0B1020', panel: '#10182A', heading: '#F5F7FF',
    accent: '#36E0C4', text: '#AAB9D0', muted: '#8799B2', border: '#30435B'
  }, lightColors: { background:'#F7FAFC', panel:'#FFFFFF', heading:'#172334',
    accent:'#007C70', text:'#344054', muted:'#667085', border:'#CBD5E1' },
    fonts: { heading: 'Poppins', body: 'Lexend', code: 'JetBrains Mono' } },
  media: { embedVideoLinks:true, autoplay:false, lazyLoad:true,
    videoMaxWidthPx:640, videoMaxHeightPx:350 },
  slides: { markdown: 'README.md', width: 1280, height: 720, margin: 0.06,
    transition: 'fade', transitionSpeed: 'default', autoSlideMs: 0,
    autoSlideStoppable: true, loop: false, center: true, showCounter: true,
    showNavigation: true, navigationVisibility: 'auto',
    navigationHideDelayMs: 3000, navigationRevealZonePx: 90, autoFitContent: true, fitSafeGapPx: 18,
    showRepositoryLink: true, allowRemoteReadme: true }
});

const HEX = /^#[\da-fA-F]{6}$/;
const FONT = /^[a-zA-Z][\w ]{1,45}$/;
const ACRONYMS = new Set(['ia','mcp','llm','rag','api','gcp','sdk','ai','readme','js','css','html']);
const CONNECTORS = new Set(['de','del','y','en','con','desde','para','por','a','to']);

export function titleFromSlug(slug) {
  return String(slug ?? '').split(/[-_]+/).filter(Boolean).map((token, i) => {
    const word = token.toLocaleLowerCase('es');
    if (ACRONYMS.has(word)) return word.toUpperCase();
    if (i > 0 && CONNECTORS.has(word)) return word;
    return i === 0 ? word[0].toLocaleUpperCase('es') + word.slice(1) : word;
  }).join(' ');
}

export function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

/** Converts GitHub links to raw content and provides the corresponding repository. */
export function resolveRemoteReadme(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password) {
    throw new Error('Remote README must use plain HTTPS without credentials or custom ports');
  }
  const parts = url.pathname.split('/').filter(Boolean);
  // Ref is a single path segment; slash-containing branch names are intentionally
  // not inferred from ambiguous GitHub /blob/<ref>/<path> URLs.
  const validSource = parts.length >= 4 && /^[a-zA-Z0-9-]+$/.test(parts[0]) &&
    /^[a-zA-Z0-9_.-]+$/.test(parts[1]) && /^[a-zA-Z0-9_.-]+$/.test(parts[2]) &&
    parts.slice(3).every(p => !/%(?:2f|5c|00)/i.test(p) && p !== '.' && p !== '..');
  if (url.hostname === 'github.com' && parts[2] === 'blob' && parts.length >= 5 &&
      /^[a-zA-Z0-9-]+$/.test(parts[0]) && /^[a-zA-Z0-9_.-]+$/.test(parts[1]) &&
      parts.slice(3).every(p => !/%(?:2f|5c|00)/i.test(p) && p !== '.' && p !== '..')) {
    return {
      slug: parts[1],
      repository: `https://github.com/${parts[0]}/${parts[1]}`,
      rawUrl: `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join('/')}`
    };
  }
  if (url.hostname === 'raw.githubusercontent.com' && validSource) {
    return {slug: parts[1], repository: `https://github.com/${parts[0]}/${parts[1]}`, rawUrl: url.href};
  }
  throw new Error('Use a public GitHub README URL with /blob/<branch>/<file>');
}

/**
 * On GitHub Pages the hostname and path identify the repository. On localhost,
 * a custom domain or other preview hosts, use the repository URL configured in
 * presentation.config.json instead of guessing from the local HTTP path.
 */
export function resolveLocalRepository(locationLike, configuredRepositoryUrl = null) {
  const path = locationLike.pathname.split('/').filter(Boolean);
  const hostname = String(locationLike.hostname).toLowerCase();
  if (hostname.endsWith('.github.io')) {
    const owner = hostname.slice(0, -'.github.io'.length);
    // A user/organization Pages site can also be served from the domain root.
    const slug = path[0] || `${owner}.github.io`;
    return {slug, repository: `https://github.com/${owner}/${slug}`};
  }
  const configured = normalizeRepositoryUrl(configuredRepositoryUrl);
  if (configured) return {
    slug: configured.split('/').at(-1), repository: configured
  };
  // The GitHub repository cannot be inferred from localhost or a custom
  // domain. A missing link is safer than pointing every copy to the template.
  return {slug: path[0] || 'local-presentation', repository: null};
}

/** Only permit an ordinary GitHub repository URL, not arbitrary redirects. */
function normalizeRepositoryUrl(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' ||
        url.search || url.hash || parts.length !== 2 ||
        !/^[a-zA-Z0-9-]+$/.test(parts[0]) ||
        !/^[a-zA-Z0-9_.-]+$/.test(parts[1])) return null;
    return `https://github.com/${parts[0]}/${parts[1]}`;
  } catch { return null; }
}

export function normalizeConfig(user = {}) {
  const merged = {
    presentation: {...DEFAULTS.presentation, ...(user.presentation ?? {})},
    presenter: {...DEFAULTS.presenter, ...(user.presenter ?? {}),
      social: {...DEFAULTS.presenter.social, ...(user.presenter?.social ?? {})}},
    theme: { mode:user.theme?.mode ?? DEFAULTS.theme.mode,
      showToggle:user.theme?.showToggle ?? DEFAULTS.theme.showToggle,
      colors: {...DEFAULTS.theme.colors, ...(user.theme?.colors ?? {})},
      lightColors: {...DEFAULTS.theme.lightColors, ...(user.theme?.lightColors ?? {})},
      fonts: {...DEFAULTS.theme.fonts, ...(user.theme?.fonts ?? {})}},
    media: {...DEFAULTS.media, ...(user.media ?? {})},
    slides: {...DEFAULTS.slides, ...(user.slides ?? {})}
  };
  for (const [key, color] of Object.entries(merged.theme.colors)) {
    if (!HEX.test(color)) merged.theme.colors[key] = DEFAULTS.theme.colors[key];
  }
  for (const [key, color] of Object.entries(merged.theme.lightColors)) {
    if (!HEX.test(color)) merged.theme.lightColors[key] = DEFAULTS.theme.lightColors[key];
  }
  if (!['dark','light','auto'].includes(merged.theme.mode)) merged.theme.mode = 'dark';
  merged.theme.showToggle = merged.theme.showToggle !== false;
  merged.media.embedVideoLinks = merged.media.embedVideoLinks !== false;
  merged.media.autoplay = merged.media.autoplay === true;
  merged.media.lazyLoad = merged.media.lazyLoad !== false;
  const maxValue = (value,min,max,fallback) =>
    Number.isFinite(Number(value)) && Number(value)>=min && Number(value)<=max
      ? Number(value) : fallback;
  merged.media.videoMaxWidthPx = maxValue(
    merged.media.videoMaxWidthPx, 320, 1000, DEFAULTS.media.videoMaxWidthPx
  );
  merged.media.videoMaxHeightPx = maxValue(
    merged.media.videoMaxHeightPx, 180, 540, DEFAULTS.media.videoMaxHeightPx
  );
  for (const [key, font] of Object.entries(merged.theme.fonts)) {
    if (!FONT.test(font)) merged.theme.fonts[key] = DEFAULTS.theme.fonts[key];
  }
  for (const [name, url] of Object.entries(merged.presenter.social)) {
    merged.presenter.social[name] = safeHttpUrl(url) || DEFAULTS.presenter.social[name];
  }
  const numeric = (value, min, max, fallback) =>
    Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max
      ? Number(value) : fallback;
  merged.slides.width = numeric(merged.slides.width, 640, 2560, DEFAULTS.slides.width);
  merged.slides.height = numeric(merged.slides.height, 360, 1440, DEFAULTS.slides.height);
  merged.slides.margin = numeric(merged.slides.margin, 0, 0.25, DEFAULTS.slides.margin);
  if (!['none', 'fade', 'slide', 'convex', 'concave', 'zoom'].includes(merged.slides.transition)) {
    merged.slides.transition = DEFAULTS.slides.transition;
  }
  if (!['default', 'fast', 'slow'].includes(merged.slides.transitionSpeed)) {
    merged.slides.transitionSpeed = DEFAULTS.slides.transitionSpeed;
  }
  merged.slides.autoSlideMs = numeric(merged.slides.autoSlideMs, 0, 600000, 0);
  if (!['auto', 'always', 'hidden'].includes(merged.slides.navigationVisibility)) {
    merged.slides.navigationVisibility = DEFAULTS.slides.navigationVisibility;
  }
  merged.slides.navigationHideDelayMs = numeric(
    merged.slides.navigationHideDelayMs, 500, 15000, DEFAULTS.slides.navigationHideDelayMs
  );
  merged.slides.navigationRevealZonePx = numeric(
    merged.slides.navigationRevealZonePx, 50, 240, DEFAULTS.slides.navigationRevealZonePx
  );
  merged.slides.autoFitContent = merged.slides.autoFitContent !== false;
  merged.slides.fitSafeGapPx = numeric(
    merged.slides.fitSafeGapPx, 0, 100, DEFAULTS.slides.fitSafeGapPx
  );
  merged.slides.loop = merged.slides.loop === true;
  merged.slides.autoSlideStoppable = merged.slides.autoSlideStoppable !== false;
  if (!/^[\w./-]+\.md$/i.test(merged.slides.markdown) || merged.slides.markdown.includes('..')) {
    merged.slides.markdown = DEFAULTS.slides.markdown;
  }
  for (const key of ['center', 'showCounter', 'showNavigation', 'showRepositoryLink', 'allowRemoteReadme']) {
    merged.slides[key] = merged.slides[key] !== false;
  }
  merged.presentation.repositoryUrl = normalizeRepositoryUrl(merged.presentation.repositoryUrl);
  merged.presentation.titleFromRepository = merged.presentation.titleFromRepository === true;
  return merged;
}

/**
 * Escape raw HTML in a remote Markdown file before handing it to RevealMarkdown.
 * Fenced code is kept untouched. This is defense in depth, not a full sanitizer.
 */
export function prepareRemoteMarkdown(markdown) {
  let inFence = false;
  let fenceMarker = '';
  return markdown.split(/\r?\n/).map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      const current = marker[1][0];
      if (!inFence) { inFence = true; fenceMarker = current; }
      else if (current === fenceMarker) inFence = false;
      return line;
    }
    if (inFence) return line;
    return line.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\]\(\s*(?:javascript|data|vbscript):[^)]*\)/gi, '](#)');
  }).join('\n');
}
