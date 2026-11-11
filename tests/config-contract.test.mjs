/** Integration checks of *this repository's actual JSON*, not just the defaults. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeConfig} from '../assets/js/config.mjs';
const config=JSON.parse(readFileSync(new URL('../presentation.config.json',import.meta.url),'utf8'));
const normalized=normalizeConfig(config);

function isBooleanFields(group, fields) {
  for(const key of fields) {
    if (key in (config[group] || {})) {
      assert.equal(typeof config[group][key],'boolean',`${group}.${key} must be boolean, not a string`);
    }
  }
}
function range(group,key,lo,hi){
  if (!(key in (config[group]||{}))) return;
  const value=config[group][key];
  assert.equal(typeof value,'number',`${group}.${key} must be a number`);
  assert.ok(Number.isFinite(value)&&value>=lo&&value<=hi,
    `${group}.${key} must be in ${lo}..${hi}`);
}

test('published JSON is valid and the presentation title is not empty',()=>{
  assert.ok(config && typeof config==='object' && !Array.isArray(config));
  assert.equal(typeof config.presentation.title,'string');
  assert.ok(config.presentation.title.trim().length>0);
  assert.equal(normalized.presentation.title,config.presentation.title);
});
test('theme modes and transition values use supported identifiers',()=>{
  assert.ok(['dark','light','auto'].includes(config.theme?.mode),
    'theme.mode must be dark, light or auto');
  assert.ok(['none','fade','slide','convex','concave','zoom'].includes(config.slides?.transition),
    'slides.transition is unsupported');
  assert.ok(['default','fast','slow'].includes(config.slides?.transitionSpeed),
    'slides.transitionSpeed is unsupported');
  assert.ok(['auto','always','hidden'].includes(config.slides?.navigationVisibility),
    'slides.navigationVisibility is unsupported');
});
test('booleans are actual booleans, not misleading string values',()=>{
  isBooleanFields('slides',['loop','center','showNavigation','showCounter',
    'showRepositoryLink','allowRemoteReadme','autoFitContent','autoSlideStoppable']);
  isBooleanFields('media',['embedVideoLinks','autoplay','lazyLoad']);
  isBooleanFields('theme',['showToggle']);
  isBooleanFields('presentation',['titleFromRepository']);
});
test('colors and fonts are valid CSS token values',()=>{
  for(const group of ['colors','lightColors']) {
    for(const [name,color] of Object.entries(config.theme?.[group] || {})) {
      assert.match(color,/^#[0-9a-fA-F]{6}$/,`theme.${group}.${name} must be #RRGGBB`);
    }
  }
  for(const [key,font] of Object.entries(config.theme?.fonts || {})) {
    assert.match(font,/^[a-zA-Z][\w ]{1,45}$/,
      `theme.fonts.${key} contains unsupported characters`);
  }
});
test('numeric presentation, navigation and video dimensions are within supported ranges',()=>{
  for(const [key,a,b] of [
    ['width',640,2560],['height',360,1440],['margin',0,0.25],
    ['autoSlideMs',0,600000],['navigationHideDelayMs',500,15000],
    ['navigationRevealZonePx',50,240],['fitSafeGapPx',0,100]]) range('slides',key,a,b);
  for(const [key,a,b] of [['videoMaxWidthPx',320,1000],['videoMaxHeightPx',180,540]])
    range('media',key,a,b);
});
test('configured repository URL survives normalization without silent fallback',()=>{
  if(config.presentation?.repositoryUrl) {
    assert.equal(normalized.presentation.repositoryUrl,
      config.presentation.repositoryUrl.replace(/\/$/,''),
      'presentation.repositoryUrl is invalid; expected https://github.com/OWNER/REPO');
  }
});
