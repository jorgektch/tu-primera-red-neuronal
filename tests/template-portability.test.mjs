import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig,resolveLocalRepository,resolveRemoteReadme,prepareRemoteMarkdown,safeHttpUrl} from '../assets/js/config.mjs';
import {themeStorageKey,activeThemeName,nextThemeChoice} from '../assets/js/theme.mjs';
import {parseVideoUrl} from '../assets/js/media.mjs';

test('copies at other github.io owners resolve their own repo',()=>{
  for(const [host,path,expected] of [
    ['example.github.io','/my-workshop/','https://github.com/example/my-workshop'],
    ['some-team.github.io','/data-science-talk/','https://github.com/some-team/data-science-talk']
  ]){
    assert.equal(resolveLocalRepository({hostname:host,pathname:path},'https://github.com/jorgektch/readme-to-slides').repository,expected);
  }
});
test('localhost and custom domains use configured repository, not demo slug',()=>{
  for(const host of ['localhost','127.0.0.1','slides.example.org']) {
    assert.deepEqual(resolveLocalRepository({hostname:host,pathname:'/'},'https://github.com/new-owner/my-new-talk'),
      {slug:'my-new-talk',repository:'https://github.com/new-owner/my-new-talk'});
  }
});
test('bad repository values cannot override repo button',()=>{
  for(const value of [null,'','ftp://github.com/o/r','http://github.com/o/r',
    'https://evil.example/o/r','https://github.com/o/r/issues',
    'https://github.com/o/r?x=1','javascript:alert(1)']){
    assert.equal(normalizeConfig({presentation:{repositoryUrl:value}}).presentation.repositoryUrl,null,String(value));
  }
});
test('different repository copies do not share localStorage theme preference',()=>{
  const a=themeStorageKey('https://github.com/speaker/talk-one');
  const b=themeStorageKey('https://github.com/speaker/talk-two');
  assert.notEqual(a,b);
  assert.equal(a,themeStorageKey('HTTPS://GITHUB.COM/SPEAKER/TALK-ONE'));
});
test('dark, light and auto all remain selectable',()=>{
  assert.deepEqual(['dark',nextThemeChoice('dark'),nextThemeChoice('light'),nextThemeChoice('auto')],
    ['dark','light','auto','dark']);
  assert.equal(activeThemeName('auto',true),'dark');
  assert.equal(activeThemeName('auto',false),'light');
});
test('remote repo is taken from remote README, not from template',()=>{
  const links=[
    'https://github.com/my-team/data-talk/blob/main/README.md',
    'https://raw.githubusercontent.com/my-team/data-talk/main/README.md'
  ];
  for (const source of links){
    const result=resolveRemoteReadme(source);
    assert.equal(result.repository,'https://github.com/my-team/data-talk');
  }
});
test('HTML and simple dangerous links in remote markdown are escaped',()=>{
  const source='# Demo\n<img src=x onerror="window.pwned=1">\n<a href="javascript:alert(1)">evil</a>\n[bad](javascript:alert(1))';
  const sanitized=prepareRemoteMarkdown(source);
  assert.match(sanitized,/&lt;img/);
  assert.match(sanitized,/&lt;a href/);
  assert.doesNotMatch(sanitized,/\]\(javascript:/);
});
test('media links reject unsafe schemes and spoofed sites',()=>{
  for(const url of ['data:video/mp4;base64,a','http://youtu.be/jNQXAC9IVRw',
    'https://youtube.com.evil.invalid/watch?v=jNQXAC9IVRw','javascript:alert(1)']){
    assert.equal(parseVideoUrl(url),null,url);
  }
  assert.equal(safeHttpUrl('javascript:alert(1)'),null);
});
test('custom presentation settings are not overwritten with template identity',()=>{
  const c=normalizeConfig({presentation:{title:'My own talk',repositoryUrl:'https://github.com/other-user/my-talk'},
    presenter:{name:'New Speaker',email:'test@example.org'},theme:{mode:'light'},slides:{showNavigation:false}});
  assert.equal(c.presentation.title,'My own talk');
  assert.equal(c.presenter.name,'New Speaker');
  assert.equal(c.presenter.email,'test@example.org');
  assert.equal(c.slides.showNavigation,false);
  assert.equal(c.theme.mode,'light');
});


test('new copies without explicit URLs never inherit a guessed upstream link',()=>{
  const config=normalizeConfig({presentation:{repositoryUrl:null}});
  for(const host of ['localhost','127.0.0.1','workshops.example.com']) {
    assert.equal(resolveLocalRepository({hostname:host,pathname:'/'},config.presentation.repositoryUrl).repository,null);
  }
  assert.equal(resolveLocalRepository({hostname:'new-speaker.github.io',pathname:'/talk/'},null).repository,
    'https://github.com/new-speaker/talk');
});
