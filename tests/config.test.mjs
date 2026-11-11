import test from 'node:test';
import assert from 'node:assert/strict';
import {
  titleFromSlug, normalizeConfig, resolveRemoteReadme,
  resolveLocalRepository, prepareRemoteMarkdown, safeHttpUrl
} from '../assets/js/config.mjs';

test('repo slugs produce readable titles', () => {
  assert.equal(titleFromSlug('mi-primer-mcp-desde-cero'), 'Mi primer MCP desde cero');
  assert.equal(titleFromSlug('readme-to-slides'), 'README to slides');
});

test('theme customization merges with defaults', () => {
  const config = normalizeConfig({theme:{colors:{accent:'#112233'}}, slides:{width:1440,autoSlideMs:12000}});
  assert.equal(config.theme.colors.accent, '#112233');
  assert.equal(config.theme.colors.background, '#0B1020');
  assert.equal(config.slides.width, 1440);
  assert.equal(config.slides.autoSlideMs, 12000);
  assert.equal(config.presenter.name, 'Jorge Jesús Quispe Villaverde');
});

test('invalid CSS values and slide dimensions fall back safely', () => {
  const config = normalizeConfig({
    theme:{colors:{accent:'url(javascript:alert(1))'}, fonts:{heading:'Poppins;display:none'}},
    slides:{width:-100, height:100000, transition:'rotate', markdown:'../private.md'}
  });
  assert.equal(config.theme.colors.accent, '#36E0C4');
  assert.equal(config.theme.fonts.heading, 'Poppins');
  assert.equal(config.slides.width, 1280);
  assert.equal(config.slides.transition, 'fade');
  assert.equal(config.slides.markdown, 'README.md');
});

test('GitHub blob links become raw README URLs', () => {
  const remote = resolveRemoteReadme('https://github.com/owner/repo/blob/main/README.md');
  assert.equal(remote.rawUrl, 'https://raw.githubusercontent.com/owner/repo/main/README.md');
  assert.equal(remote.repository, 'https://github.com/owner/repo');
  assert.equal(remote.slug, 'repo');
});

test('remote links reject non-GitHub sources and insecure protocols', () => {
  assert.throws(() => resolveRemoteReadme('http://github.com/a/b/blob/main/README.md'));
  assert.throws(() => resolveRemoteReadme('https://evil.test/repo/blob/main/README.md'));
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
});

test('local owner and repository derive from github.io hostname', () => {
  const actual = resolveLocalRepository({hostname:'someone.github.io',pathname:'/my-presentation/'});
  assert.equal(actual.repository, 'https://github.com/someone/my-presentation');
});

test('remote Markdown escapes HTML outside code fences', () => {
  const m = '# Demo\n<img src=x onerror=alert(1)>\n```html\n<b>code</b>\n```\n[unsafe](javascript:alert(1))';
  const sanitized = prepareRemoteMarkdown(m);
  assert.match(sanitized,/&lt;img/);
  assert.match(sanitized, /<b>code<\/b>/);
  assert.doesNotMatch(sanitized,/\]\(javascript:/);
});

test('navigation visibility configuration is validated and defaults to auto', () => {
  const defaults = normalizeConfig();
  assert.equal(defaults.slides.navigationVisibility, 'auto');
  assert.equal(defaults.slides.navigationHideDelayMs, 3000);
  assert.equal(defaults.slides.navigationRevealZonePx, 90);
  const custom = normalizeConfig({slides:{
    navigationVisibility:'always',navigationHideDelayMs:5000,navigationRevealZonePx:110
  }});
  assert.equal(custom.slides.navigationVisibility,'always');
  assert.equal(custom.slides.navigationHideDelayMs,5000);
  assert.equal(custom.slides.navigationRevealZonePx,110);
  const invalid = normalizeConfig({slides:{
    navigationVisibility:'hover', navigationHideDelayMs:1,
    navigationRevealZonePx:900
  }});
  assert.equal(invalid.slides.navigationVisibility,'auto');
  assert.equal(invalid.slides.navigationHideDelayMs,3000);
  assert.equal(invalid.slides.navigationRevealZonePx,90);
});

// Regression: a template copy must not use the original template's repository
// as the local presentation URL after the adopter configures their own URL.
test('custom repository URL is used on localhost, but GitHub Pages URL takes priority', () => {
  const project = 'https://github.com/new-owner/my-workshop';
  const settings = normalizeConfig({presentation:{repositoryUrl:project}});
  assert.equal(settings.presentation.repositoryUrl, project);
  const preview = resolveLocalRepository({hostname:'localhost',pathname:'/'},settings.presentation.repositoryUrl);
  assert.deepEqual(preview,{slug:'my-workshop',repository:project});
  const pages = resolveLocalRepository({hostname:'new-owner.github.io',pathname:'/my-workshop/'},
    'https://github.com/jorgektch/readme-to-slides');
  assert.equal(pages.repository, project);
});

test('reject unsupported repository URLs and preserve remote README links', () => {
  for (const url of ['javascript:alert(1)','https://evil.example/a/b',
    'https://github.com/owner/repo/issues','https://github.com/a/b?bad=1']) {
    const settings = normalizeConfig({presentation:{repositoryUrl:url}});
    assert.equal(settings.presentation.repositoryUrl, null);
  }
  const remote = resolveRemoteReadme('https://github.com/another-owner/some-other-talk/blob/main/README.md');
  assert.equal(remote.repository,'https://github.com/another-owner/some-other-talk');
});


test('a brand-new template copy needs no repository URL to render safely', () => {
  const settings = normalizeConfig({presentation:{repositoryUrl:null}});
  assert.equal(settings.presentation.repositoryUrl, null);
  for (const host of ['localhost','127.0.0.1','custom.example.org']) {
    const actual = resolveLocalRepository({hostname:host,pathname:'/'},settings.presentation.repositoryUrl);
    assert.equal(actual.repository, null, host);
  }
  const pages = resolveLocalRepository({hostname:'new-owner.github.io',pathname:'/fresh-copy/'},null);
  assert.equal(pages.repository,'https://github.com/new-owner/fresh-copy');
  const homepage = resolveLocalRepository({hostname:'new-owner.github.io',pathname:'/'},null);
  assert.equal(homepage.repository,'https://github.com/new-owner/new-owner.github.io');
});
