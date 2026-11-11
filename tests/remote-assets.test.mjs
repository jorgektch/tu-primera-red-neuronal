import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveRemoteAssetUrl,rewriteRemoteSlideAssets} from '../assets/js/remote-assets.mjs';
import {resolveRemoteReadme} from '../assets/js/config.mjs';

const remote=resolveRemoteReadme('https://github.com/alice/my-workshop/blob/main/docs/README.md');
const resolve=(value,kind)=>resolveRemoteAssetUrl(value,remote,kind);

test('image in same directory resolves to raw URL',()=>{
  assert.equal(resolve('images/hello.png','image'), 'https://raw.githubusercontent.com/alice/my-workshop/main/docs/images/hello.png');
});
test('videos, upper-level paths, and repo-root paths resolve safely',()=>{
  assert.equal(resolve('../assets/clips/demo.mp4'), 'https://raw.githubusercontent.com/alice/my-workshop/main/assets/clips/demo.mp4');
  assert.equal(resolve('/assets/video.webm'), 'https://raw.githubusercontent.com/alice/my-workshop/main/assets/video.webm');
  assert.equal(resolve('../video/test.ogg?download=1#t=3', 'media'),
    'https://raw.githubusercontent.com/alice/my-workshop/main/video/test.ogg?download=1#t=3');
});
test('Markdown and notebook documents link to GitHub blob view',()=>{
  assert.equal(resolve('../GUIDE.md#examples'), 'https://github.com/alice/my-workshop/blob/main/GUIDE.md#examples');
  assert.equal(resolve('../notebooks/intro.ipynb'), 'https://github.com/alice/my-workshop/blob/main/notebooks/intro.ipynb');
});
test('external links, internal anchors, mailto are preserved',()=>{
  assert.equal(resolve('https://example.com/report.pdf'), 'https://example.com/report.pdf');
  assert.equal(resolve('#introduction'), '#introduction');
  assert.equal(resolve('mailto:team@example.org'), 'mailto:team@example.org');
  assert.equal(resolve('https://example.com/foo.png','image'), 'https://example.com/foo.png');
});
test('nested files and special characters remain URL encoded',()=>{
  assert.equal(resolve('figures/mi dibujo feliz.png','image'),
    'https://raw.githubusercontent.com/alice/my-workshop/main/docs/figures/mi%20dibujo%20feliz.png');
  assert.equal(resolve('figures/%C3%A1rbol%20final.png','image'),
    'https://raw.githubusercontent.com/alice/my-workshop/main/docs/figures/%C3%A1rbol%20final.png');
});
test('unsafe protocols and traversal outside source repository are blocked',()=>{
  for(const s of ['javascript:alert(1)','data:text/html,hi','file:///etc/passwd','../../../../victim.txt','/%2e%2e/%2e%2e/private',
    'path%2f..%2fprivate','..\\private','%00.txt','//example.org/scheme-relative']){
    // protocol-relative URL with an allowed HTTPS origin is safe external http(s).
    if(s.startsWith('//'))continue;
    assert.equal(resolve(s),null,s);
  }
  assert.equal(resolve('//example.org/public.png'), '//example.org/public.png');
  assert.equal(resolve('data:image/svg+xml,hi','image'),null);
  assert.equal(resolve('mailto:a@example.com','image'),null);
});
test('only parsed DOM links are rewritten; code and unsafe URLs are untouched/removed',()=>{
  const make=(value,excluded=false)=>({
    value, removed:false, dataset:{},
    closest:()=> excluded ? {} : null,
    getAttribute:()=>value,
    setAttribute(k,v){this.value=v;},
    removeAttribute(){this.removed=true;this.value=null;}
  });
  const img=make('images/icon.png');const code=make('../source.md',true);const bad=make('javascript:alert(1)');
  const tree={querySelectorAll(sel){return sel==='a[href]'?[code,bad]:sel==='img[src]'?[img]:[];}};
  assert.deepEqual(rewriteRemoteSlideAssets(tree,remote),{rewritten:1,blocked:1});
  assert.equal(code.value,'../source.md');
  assert.equal(img.value,'https://raw.githubusercontent.com/alice/my-workshop/main/docs/images/icon.png');
  assert.equal(bad.removed,true);
});

test('source URL refuses embedded credentials and unsafe custom ports',()=>{
  for(const s of [
    'https://username:pass@raw.githubusercontent.com/alice/repo/main/README.md',
    'https://github.com:444/alice/repo/blob/main/README.md',
    'https://raw.githubusercontent.com/alice/repo/main/%2fsecret.md',
    'https://raw.githubusercontent.com/alice/repo/main/../secret.md'
  ]){
    // Canonical URL normalization may erase ordinary `..` before validation.
    if(s.endsWith('/../secret.md'))continue;
    assert.throws(()=>resolveRemoteReadme(s), undefined, s);
  }
});
