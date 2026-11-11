import {
  normalizeConfig, resolveLocalRepository, resolveRemoteReadme,
  prepareRemoteMarkdown, titleFromSlug, safeHttpUrl
} from './config.mjs';
import {
  activeThemeName, nextThemeChoice, themeStorageKey, resolveThemePalette,
  cssThemeTokens, mermaidThemeVariables
} from './theme.mjs';
import {parseVideoUrl, videoEmbedUrl, videoLabel} from './media.mjs';
import {setupNavigationVisibility} from './navigation.mjs';
import {setupSlideFit} from './fit.mjs';
import {rewriteRemoteSlideAssets} from './remote-assets.mjs';

const config = await (async () => {
  try {
    const response = await fetch('./presentation.config.json', {cache: 'no-store'});
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return normalizeConfig(await response.json());
  } catch (error) {
    console.warn('Config missing or invalid; using defaults', error);
    return normalizeConfig();
  }
})();

// Limit media within the Reveal.js virtual slide, but allow template users to
// adjust the safe maximum dimensions without rewriting CSS.
document.documentElement.style.setProperty('--deck-video-max-width', `${config.media.videoMaxWidthPx}px`);
document.documentElement.style.setProperty('--deck-video-max-height', `${config.media.videoMaxHeightPx}px`);

// The repository is resolved before reading preferences because localStorage
// on github.io is shared by all project sites belonging to the same user.
const local = resolveLocalRepository(window.location, config.presentation.repositoryUrl);
// Do not migrate the old origin-wide key: that would import preferences from
// unrelated decks on the same hostname.
const THEME_STORAGE_KEY = themeStorageKey(local.repository);
// Mode: dark (default), light or OS preference. A visitor's manual choice is
// remembered per repository without changing JSON or README.
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let savedChoice = null;
try { savedChoice = window.localStorage.getItem(THEME_STORAGE_KEY); } catch { /* storage optional */ }
let themeChoice = ['dark','light','auto'].includes(savedChoice) ? savedChoice : config.theme.mode;
let currentThemeName = 'dark';
let resolvedColors = {};
function applyTheme() {
  currentThemeName = activeThemeName(themeChoice, systemTheme.matches);
  resolvedColors = resolveThemePalette(config.theme, currentThemeName);
  for (const [key, value] of Object.entries(cssThemeTokens(config.theme,currentThemeName))) {
    document.documentElement.style.setProperty(key,value);
  }
  document.documentElement.dataset.deckTheme = currentThemeName;
  document.documentElement.dataset.themeChoice = themeChoice;
  document.documentElement.style.colorScheme = currentThemeName;
}
applyTheme();
const fonts = config.theme.fonts;
for (const [key, font] of Object.entries(fonts)) {
  document.documentElement.style.setProperty(
    {heading: '--r-heading-font', body: '--r-main-font', code: '--r-code-font'}[key],
    `"${font}", ${key === 'code' ? 'monospace' : 'sans-serif'}`
  );
}
// Add fonts specified by configuration, rather than requiring a CSS edit.
const fontParams = Object.values(fonts).map(name =>
  `family=${name.trim().replace(/\s+/g, '+')}:wght@400;500;600;700`
).join('&');
const fontStylesheet = document.createElement('link');
fontStylesheet.rel = 'stylesheet';
fontStylesheet.href = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
document.head.append(fontStylesheet);

let slug = local.slug;
let repoUrl = local.repository;
let markdownSource = config.slides.markdown;
const remoteLink = new URLSearchParams(window.location.search).get('url');
let remoteMarkdownObjectUrl = null;
let remoteMarkdownSource = null;
if (remoteLink && config.slides.allowRemoteReadme) {
  try {
    const remote = resolveRemoteReadme(remoteLink);
    remoteMarkdownSource = remote;
    const response = await fetch(remote.rawUrl);
    if (!response.ok) throw Error(`Remote README HTTP ${response.status}`);
    const markdown = prepareRemoteMarkdown(await response.text());
    remoteMarkdownObjectUrl = URL.createObjectURL(new Blob([markdown], {type:'text/markdown'}));
    markdownSource = remoteMarkdownObjectUrl;
    slug = remote.slug;
    repoUrl = remote.repository;
  } catch (error) {
    remoteMarkdownSource = null;
    console.warn('Could not load external README; keeping local source', error);
  }
}
document.querySelector('.reveal .slides > section[data-deck-source="readme"]').setAttribute('data-markdown', markdownSource);

await Reveal.initialize({
  hash: true,
  slideNumber: false,
  controls: false,
  navigationMode: 'default',
  controlsTutorial: false,
  width: config.slides.width,
  height: config.slides.height,
  margin: config.slides.margin,
  center: config.slides.center,
  transition: config.slides.transition,
  transitionSpeed: config.slides.transitionSpeed,
  autoSlide: config.slides.autoSlideMs,
  autoSlideStoppable: config.slides.autoSlideStoppable,
  autoPlayMedia: false, // video autoplay is managed only for the active slide
  loop: config.slides.loop,
  plugins: [RevealMarkdown, RevealHighlight, RevealNotes]
});

const isExternal = remoteMarkdownObjectUrl !== null;
if (isExternal) {
  const assetReport = rewriteRemoteSlideAssets(document.querySelector('.reveal .slides'), remoteMarkdownSource);
  console.info('Resolved remote README resources', assetReport);
}
const displayTitle = isExternal || config.presentation.titleFromRepository
  ? titleFromSlug(slug) : config.presentation.title;
document.title = `${displayTitle} · Presentation`;
const repoLink = document.getElementById('nav-repository');
if (repoUrl) repoLink.href = repoUrl;
else repoLink.removeAttribute('href');
repoLink.hidden = !config.slides.showRepositoryLink || !repoUrl;
const isUrlSafe = url => safeHttpUrl(url) !== null;

// All template personal information is stored in JSON. The README contains
// readable fallbacks for GitHub; the browser replaces those values in slides.
if (!isExternal) {
  const data = {
    title: displayTitle,
    subtitle: config.presentation.subtitle,
    eyebrow: config.presentation.eyebrow,
    name: config.presenter.name,
    role: config.presenter.role,
    email: config.presenter.email,
    handle: config.presenter.handle
  };
  for (const [key, value] of Object.entries(data)) {
    document.querySelectorAll(`[data-config="${key}"]`).forEach(el => {
      el.textContent = value;
      if (key === 'email' && el.tagName === 'A') {
        el.href = `mailto:${encodeURIComponent(value).replace(/%40/g, '@')}`;
      }
    });
  }
  for (const [name, url] of Object.entries(config.presenter.social)) {
    if (!isUrlSafe(url)) continue;
    document.querySelectorAll(`[data-social="${name}"]`).forEach(el => el.href = url);
  }
}

// Regular Markdown links stay readable on GitHub. In the browser, supported
// video URLs become interactive players; links in source code/README-only
// sections are never altered. Only YouTube, Vimeo and direct video files qualify.
const slideMedia = [];
if (config.media.embedVideoLinks) {
  document.querySelectorAll('.reveal .slides section a[href]').forEach(anchor => {
    if (anchor.closest('.readme-only,.contact-row,.closing-card,.slide-video') ||
        anchor.hasAttribute('data-no-video')) return;
    const media = parseVideoUrl(anchor.getAttribute('href'), window.location.href);
    if (!media) return;
    const title = videoLabel(anchor.textContent);
    const figure = document.createElement('figure');
    figure.className = 'slide-video';
    const frame = document.createElement('div');
    frame.className = 'slide-video__frame';
    let player;
    if (media.kind === 'file') {
      player = document.createElement('video');
      player.controls = true;
      player.playsInline = true;
      player.preload = config.media.lazyLoad ? 'none' : 'metadata';
      player.dataset.mediaSrc = videoEmbedUrl(media);
      player.setAttribute('aria-label', title);
    } else {
      player = document.createElement('iframe');
      player.dataset.mediaSrc = videoEmbedUrl(media, config.media.autoplay);
      player.title = title;
      player.loading = config.media.lazyLoad ? 'lazy' : 'eager';
      player.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share');
      player.setAttribute('allowfullscreen','');
      player.referrerPolicy = 'strict-origin-when-cross-origin';
    }
    frame.append(player);
    const caption = document.createElement('figcaption');
    const original = document.createElement('a');
    original.href = media.url;
    original.target = '_blank';
    original.rel = 'noopener noreferrer';
    original.textContent = `${title} · abrir original`;
    caption.append(original);
    figure.append(frame,caption);
    if (anchor.parentElement?.tagName === 'P' &&
        anchor.parentElement.children.length === 1 &&
        anchor.parentElement.textContent.trim() === anchor.textContent.trim()) {
      anchor.parentElement.replaceWith(figure);
    } else anchor.replaceWith(figure);
    slideMedia.push({player, media});
  });
}
function syncActiveMedia() {
  const current = Reveal.getCurrentSlide();
  const overview = Reveal.isOverview();
  for (const {player} of slideMedia) {
    const active = current?.contains(player) && !overview;
    if (player.tagName === 'IFRAME') {
      if (active && !player.hasAttribute('src')) player.src = player.dataset.mediaSrc;
      if (!active && player.hasAttribute('src')) player.removeAttribute('src');
    } else {
      if (active && !player.hasAttribute('src')) {
        player.src = player.dataset.mediaSrc;
        player.load();
      }
      if (active && config.media.autoplay && player.paused) {
        player.play().catch(() => { /* browser may block autoplay */ });
      }
      if (!active && !player.paused) player.pause();
    }
  }
}
Reveal.on('slidechanged',syncActiveMedia);
Reveal.on('overviewshown',syncActiveMedia);
Reveal.on('overviewhidden',syncActiveMedia);
syncActiveMedia();

const counter = document.getElementById('deck-counter');
const nav = document.getElementById('deck-navigation');
const themeButton = document.getElementById('nav-theme');
themeButton.hidden = !config.theme.showToggle;
let requestDiagramRender = () => Promise.resolve();
const themeLabels = {dark:'oscuro',light:'claro',auto:'automático'};
function updateThemeButton() {
  const next = nextThemeChoice(themeChoice);
  themeButton.innerHTML = `<i class="fa-solid ${themeChoice === 'dark' ? 'fa-moon' : themeChoice === 'light' ? 'fa-sun' : 'fa-circle-half-stroke'}" aria-hidden="true"></i>`;
  themeButton.title = `Tema ${themeLabels[themeChoice]} · cambiar a ${themeLabels[next]}`;
  themeButton.setAttribute('aria-label',themeButton.title);
  themeButton.setAttribute('data-mode',themeChoice);
}
updateThemeButton();
function changeTheme(choice, remember=true) {
  themeChoice=choice;
  applyTheme();
  updateThemeButton();
  if (remember) {
    try { window.localStorage.setItem(THEME_STORAGE_KEY,choice); } catch { /* storage optional */ }
  }
  requestDiagramRender().then(() => window.slideFitDiagnostics && window.slideFitController?.schedule());
  Reveal.layout();
}
themeButton.addEventListener('click',()=>changeTheme(nextThemeChoice(themeChoice)));
const onSystemThemeChanged = () => { if (themeChoice === 'auto') changeTheme('auto',false); };
if (systemTheme.addEventListener) systemTheme.addEventListener('change',onSystemThemeChanged);
else systemTheme.addListener(onSystemThemeChanged);
counter.hidden = !config.slides.showCounter;
setupNavigationVisibility({
  nav,
  trigger: document.getElementById('nav-reveal-trigger'),
  enabled: config.slides.showNavigation,
  mode: config.slides.navigationVisibility,
  hideDelayMs: config.slides.navigationHideDelayMs,
  revealZonePx: config.slides.navigationRevealZonePx
});
const buttons = Object.fromEntries(
  ['first','prev','up','down','next','last','overview'].map(k => [k, document.getElementById(`nav-${k}`)])
);
const allSlides = () => Reveal.getSlides();
const lastSlide = () => {
  const target = allSlides().at(-1);
  if (target) {
    const {h,v} = Reveal.getIndices(target);
    Reveal.slide(h,v);
  }
};
buttons.first.addEventListener('click', () => Reveal.slide(0,0));
buttons.prev.addEventListener('click', () => Reveal.left());
buttons.up.addEventListener('click', () => Reveal.up());
buttons.down.addEventListener('click', () => Reveal.down());
buttons.next.addEventListener('click', () => Reveal.right());
buttons.last.addEventListener('click', lastSlide);
buttons.overview.addEventListener('click', () => Reveal.toggleOverview());

function updateNavigation() {
  const slides = allSlides();
  const current = Reveal.getCurrentSlide();
  const index = Math.max(0,slides.indexOf(current));
  counter.textContent = `${index+1} / ${slides.length}`;
  const routes = Reveal.availableRoutes();
  buttons.first.disabled = index === 0;
  buttons.last.disabled = index === slides.length-1;
  buttons.prev.disabled = !routes.left;
  buttons.next.disabled = !routes.right;
  buttons.up.disabled = !routes.up;
  buttons.down.disabled = !routes.down;
  const isOverview = Reveal.isOverview();
  buttons.overview.setAttribute('aria-pressed', String(isOverview));
  buttons.overview.classList.toggle('is-active', isOverview);
}
['slidechanged', 'fragmentshown', 'fragmenthidden', 'overviewshown', 'overviewhidden']
  .forEach(event => Reveal.on(event, updateNavigation));
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey ||
      event.target?.closest?.('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'Home') { event.preventDefault(); Reveal.slide(0,0); }
  if (event.key === 'End') { event.preventDefault(); lastSlide(); }
});
updateNavigation();

// Mermaid code fence detection is independent of syntax highlighting classes.
const syntax = /^(?:flowchart\s|graph\s|sequenceDiagram\b|classDiagram\b|stateDiagram(?:-v2)?\b|erDiagram\b|gantt\b|pie\b|journey\b|mindmap\b|timeline\b|gitGraph\b|quadrantChart\b|xychart-beta\b|block-beta\b|sankey-beta\b|requirementDiagram\b|C4Context\b|C4Container\b|C4Component\b)/i;
const blocks = [...document.querySelectorAll('.reveal .slides pre')]
  .map(pre => ({pre, code: pre.querySelector('code')}))
  .filter(({code}) => code !== null)
  .map(({pre, code}) => {
    const source = code.textContent.replace(/\u00a0/g,' ').replace(/^\uFEFF/,'').trim();
    const names = `${code.className} ${pre.className}`.toLowerCase();
    return {pre, source, isMermaid: /(?:language|lang)[-_]mermaid\b/.test(names) || syntax.test(source)};
  }).filter(b => b.isMermaid);

window.slideDiagnostics = {detected:blocks.length, rendered:0, errors:[]};
const panels = blocks.map(({pre,source},index) => {
  const panel = document.createElement('div');
  panel.className = 'diagram-panel';
  panel.setAttribute('role','img');
  panel.setAttribute('aria-label',`Mermaid diagram ${index+1}`);
  pre.replaceWith(panel);
  return {panel,source,index};
});
function reportDiagramError({panel,source,index},error) {
  const detail = error?.message || String(error);
  window.slideDiagnostics.errors.push({diagram:index+1,message:detail});
  console.error(`Mermaid diagram ${index+1}:`,detail,source);
  panel.replaceChildren();
  const box=document.createElement('div'); box.className='diagram-error';
  const heading=document.createElement('h4'); heading.textContent=`Diagram ${index+1} unavailable`;
  const description=document.createElement('p'); description.textContent=detail;
  box.append(heading,description);
  panel.append(box);
}
let mermaidModule = null;
let renderSequence = 0;
let renderQueue = Promise.resolve();
async function renderDiagrams() {
  if (!mermaidModule || !panels.length) return;
  const sequence = ++renderSequence;
  mermaidModule.initialize({
    startOnLoad:false,securityLevel:'strict',theme:'base',
    themeVariables:mermaidThemeVariables(resolvedColors,currentThemeName,fonts.body),
    flowchart:{htmlLabels:false,useMaxWidth:true}
  });
  window.slideDiagnostics.errors=[];
  window.slideDiagnostics.rendered=0;
  for (const info of panels) {
    try {
      await mermaidModule.parse(info.source);
      // Fresh IDs prevent stale SVG marker/clipPath collisions after re-theme.
      const {svg,bindFunctions} = await mermaidModule.render(
        `deck-diagram-${sequence}-${info.index}`, info.source);
      if (!svg.includes('<svg')) throw Error('Mermaid did not return SVG');
      info.panel.innerHTML=svg;
      if (bindFunctions) bindFunctions(info.panel);
      window.slideDiagnostics.rendered++;
    } catch(error) { reportDiagramError(info,error); }
  }
  Reveal.layout();
}
requestDiagramRender = () => {
  renderQueue = renderQueue.then(renderDiagrams).catch(error => {
    console.error('Could not update diagrams for the selected theme:',error);
  });
  return renderQueue;
};
if (panels.length) {
  try {
    const {default:mermaid}=await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.2/dist/mermaid.esm.min.mjs');
    mermaidModule=mermaid;
    await requestDiagramRender();
  } catch(error) {
    panels.forEach(p => reportDiagramError(p,error));
  }
}
// Reflow after Mermaid SVGs and the selected theme are rendered.
const slideFit = setupSlideFit({reveal:Reveal,enabled:config.slides.autoFitContent,
  safeGap:config.slides.fitSafeGapPx});
window.slideFitController = slideFit;
Reveal.layout();
slideFit.schedule();
window.slideReady = true;
