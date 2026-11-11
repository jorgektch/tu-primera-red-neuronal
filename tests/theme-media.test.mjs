import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig} from '../assets/js/config.mjs';
import {
  activeThemeName, nextThemeChoice, resolveThemePalette,
  cssThemeTokens, mermaidThemeVariables
} from '../assets/js/theme.mjs';
import {parseVideoUrl, videoEmbedUrl, videoLabel} from '../assets/js/media.mjs';

test('mode dark is backward compatible and both palettes are valid', () => {
  const c = normalizeConfig();
  assert.equal(c.theme.mode,'dark');
  assert.equal(c.theme.colors.background,'#0B1020');
  assert.equal(c.theme.lightColors.background,'#F7FAFC');
  assert.equal(c.media.autoplay,false);
  assert.equal(c.media.embedVideoLinks,true);
  assert.equal(c.presenter.name,'Jorge Jesús Quispe Villaverde');
  assert.equal(activeThemeName('auto',false),'light');
  assert.equal(activeThemeName('auto',true),'dark');
  assert.equal(nextThemeChoice('dark'),'light');
  assert.equal(nextThemeChoice('light'),'auto');
  assert.equal(nextThemeChoice('auto'),'dark');
});

test('theme palettes customize separately; Mermaid tokens follow selected scheme', () => {
  const c=normalizeConfig({theme:{mode:'auto',lightColors:{accent:'#117766'},colors:{accent:'#32AABB'}}});
  assert.equal(c.theme.mode,'auto');
  assert.equal(resolveThemePalette(c.theme,'light').accent,'#117766');
  assert.equal(resolveThemePalette(c.theme,'dark').accent,'#32AABB');
  assert.equal(cssThemeTokens(c.theme,'light')['--code-bg'],'#EFF4F8');
  assert.equal(cssThemeTokens(c.theme,'dark')['--code-bg'],'#0A1320');
  assert.equal(cssThemeTokens(c.theme,'light')['--r-link-color'],'#117766');
  assert.equal(mermaidThemeVariables(resolveThemePalette(c.theme,'light'),'light','Lexend').primaryBorderColor,'#117766');
});

test('invalid theme mode, invalid light color and media booleans fall back', () => {
  const c=normalizeConfig({theme:{mode:'run-js',showToggle:false,lightColors:{heading:'red'}},media:{autoplay:'true',lazyLoad:false,embedVideoLinks:false}});
  assert.equal(c.theme.mode,'dark');
  assert.equal(c.theme.showToggle,false);
  assert.equal(c.theme.lightColors.heading,'#172334');
  assert.equal(c.media.autoplay,false);
  assert.equal(c.media.lazyLoad,false);
  assert.equal(c.media.embedVideoLinks,false);
});

test('YouTube links accept watch, short, embed, and shorts URL variants', () => {
  const id='jNQXAC9IVRw';
  for (const value of [
    `https://www.youtube.com/watch?v=${id}&t=30`,
    `https://youtu.be/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`
  ]) {
    const v=parseVideoUrl(value);
    assert.equal(v.kind,'youtube');
    assert.equal(v.id,id);
    assert.equal(videoEmbedUrl(v).includes(`youtube-nocookie.com/embed/${id}`),true);
    assert.equal(videoEmbedUrl(v).includes('autoplay=1'),false);
    assert.equal(videoEmbedUrl(v,true).includes('autoplay=1'),true);
  }
});

test('Vimeo and video files use safe embed/media URLs', () => {
  for(const url of ['https://vimeo.com/123456789','https://player.vimeo.com/video/123456789']) {
    const v=parseVideoUrl(url);
    assert.equal(v.kind,'vimeo');
    assert.equal(videoEmbedUrl(v).startsWith('https://player.vimeo.com/video/123456789'),true);
  }
  const local=parseVideoUrl('assets/videos/demo.mp4','https://example.org/deck/');
  assert.equal(local.kind,'file');
  assert.equal(local.mime,'video/mp4');
  assert.equal(local.url,'https://example.org/deck/assets/videos/demo.mp4');
  const webm=parseVideoUrl('https://cdn.example.com/clip.WEBM?version=3');
  assert.equal(webm.mime,'video/webm');
});

test('video URLs reject non-video links, spoofed hosts and unsafe protocols', () => {
  for(const input of [
    'javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
    'http://www.youtube.com/watch?v=jNQXAC9IVRw',
    'https://youtube.com.evil.test/watch?v=jNQXAC9IVRw',
    'https://youtu.be/invalidID',
    'https://vimeo.com/channels/',
    'https://evil.example/movie.html',
    'https://example.com/movie.mp4.exe',
    'mailto:test@example.com'
  ]) assert.equal(parseVideoUrl(input),null,input);
  assert.equal(videoLabel('▶ Video: Prueba de concepto'),'Prueba de concepto');
  assert.equal(videoLabel('Vídeo: Ejemplo'),'Ejemplo');
});
