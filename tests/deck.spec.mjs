import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const markdown = name => readFileSync(new URL(`./fixtures/${name}`,import.meta.url),'utf8');
const originalConfig = JSON.parse(readFileSync(new URL('../presentation.config.json',import.meta.url),'utf8'));
const configForFixture = (options={}) => ({
  ...originalConfig,
  presentation:{...originalConfig.presentation,title:'Independent Fixture Deck',
    subtitle:'Portable test',repositoryUrl:'https://github.com/test-author/portable-deck'},
  theme:{...originalConfig.theme,mode:'dark',showToggle:true},
  slides:{...originalConfig.slides,navigationVisibility:'always',showCounter:true,
    showNavigation:true,allowRemoteReadme:true,...options},
  media:{...originalConfig.media,embedVideoLinks:true,autoplay:false}
});
async function fixture(page,file='compact-deck.md',options={}) {
  const config=configForFixture(options);
  await page.route('**/presentation.config.json',route => route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(config)
  }));
  await page.route('**/README.md',route => route.fulfill({
    status:200,contentType:'text/markdown',body:markdown(file)
  }));
  return config;
}
async function ready(page,url='/') {
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => window.slideReady === true,null,{timeout:60000});
}

test('the real customized README loads without relying on demo headings or author',async ({page})=>{
  await ready(page);
  const count=await page.evaluate(()=>Reveal.getSlides().length);
  expect(count).toBeGreaterThanOrEqual(1);
  const config=originalConfig;
  const deckTitle=await page.title();
  expect(deckTitle.length).toBeGreaterThan(0);
  if (config.presentation.repositoryUrl) {
    await expect(page.locator('#nav-repository')).toHaveAttribute('href',
      config.presentation.repositoryUrl.replace(/\/$/,''));
  } else {
    await expect(page.locator('#nav-repository')).toBeHidden();
    await expect(page.locator('#nav-repository')).not.toHaveAttribute('href',/./);
  }
  const diagrams=await page.evaluate(()=>window.slideDiagnostics);
  expect(diagrams.errors).toEqual([]);
  expect(diagrams.rendered).toBe(diagrams.detected);
});

test('a simple README with one slide works without Mermaid, images or tables',async ({page})=>{
  await fixture(page,'minimal-deck.md');
  await ready(page);
  expect(await page.evaluate(()=>Reveal.getSlides().length)).toBe(1);
  await expect(page.locator('#deck-counter')).toContainText('1 / 1');
  await expect(page.locator('#nav-prev')).toBeDisabled();
  await expect(page.locator('#nav-next')).toBeDisabled();
  await expect(page.locator('#nav-repository')).toHaveAttribute('href','https://github.com/test-author/portable-deck');
});

test('horizontal/vertical movement and F5 survive customized content',async ({page})=>{
  await fixture(page);
  await ready(page);
  const indices=await page.evaluate(()=>{
    const slide=Reveal.getSlides().find(s=>s.textContent.includes('Detail vertical'));
    const {h,v}=Reveal.getIndices(slide);Reveal.slide(h,v);return {h,v};
  });
  expect(indices.v).toBe(1);
  await expect.poll(()=>page.evaluate(()=>location.hash)).toMatch(/^#\/\d+\/1$/);
  const hash=await page.evaluate(()=>location.hash);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.slideReady===true,null,{timeout:60000});
  expect(await page.evaluate(()=>Reveal.getIndices().h)).toBe(indices.h);
  expect(await page.evaluate(()=>Reveal.getIndices().v)).toBe(1);
  expect(await page.evaluate(()=>location.hash)).toBe(hash);
  await page.locator('#nav-up').click();
  expect(await page.evaluate(()=>Reveal.getIndices().v)).toBe(0);
  await page.locator('#nav-next').click();
  expect(await page.evaluate(()=>Reveal.getIndices().h)).toBe(indices.h+1);
});

test('theme toggle retains dark/light/auto and persists per repository',async ({page})=>{
  await fixture(page);
  await ready(page);
  const toggle=page.locator('#nav-theme');
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice','dark');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-deck-theme','light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice','auto');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice','dark');
  await toggle.click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.slideReady===true,null,{timeout:60000});
  await expect(page.locator('html')).toHaveAttribute('data-theme-choice','light');
});

test('supported Markdown video link becomes a player',async ({page})=>{
  await fixture(page);
  await ready(page);
  const slide=page.locator('.reveal .slides section').filter({hasText:'Video link'});
  await expect(slide.locator('.slide-video video')).toHaveAttribute('controls','');
  await expect(slide.locator('.slide-video figcaption a')).toHaveAttribute('href',/flower\.mp4/);
});

test('toolbar hides and remains accessible by mouse and keyboard',async ({page})=>{
  await fixture(page,'compact-deck.md',{navigationVisibility:'auto',navigationHideDelayMs:550});
  await ready(page);
  const nav=page.locator('#deck-navigation');
  const counter=page.locator('#deck-counter');
  await page.mouse.move(50,65);
  await expect(nav).not.toHaveClass(/is-visible/,{timeout:3000});
  await expect(counter).toBeVisible();
  const {width,height}=page.viewportSize();
  await page.mouse.move(width-40,height-20);
  await expect(nav).toHaveClass(/is-visible/);
  await page.locator('#nav-next').focus();
  await page.mouse.move(50,65);
  await expect(nav).toHaveClass(/is-visible/);
});

test('touch device can toggle toolbar while counter remains visible',async ({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try {
    await fixture(page,'compact-deck.md',{navigationVisibility:'auto',navigationHideDelayMs:15000});
    await ready(page);
    const trigger=page.locator('#nav-reveal-trigger');
    await expect(trigger).toBeVisible();
    // The toolbar starts visible for a brief hint; depending on loading time,
    // it may already be hidden when we reach this line. A touch toggle should
    // invert whichever state is current, rather than always "open".
    // Use the maximum hide delay to prevent a timer racing with either tap.
    const initial=await trigger.getAttribute('aria-expanded');
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded',initial==='true'?'false':'true');
    if(initial==='true') await expect(page.locator('#deck-navigation')).not.toHaveClass(/is-visible/);
    else await expect(page.locator('#deck-navigation')).toHaveClass(/is-visible/);
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded',initial);
    if(initial==='true') await expect(page.locator('#deck-navigation')).toHaveClass(/is-visible/);
    else await expect(page.locator('#deck-navigation')).not.toHaveClass(/is-visible/);
    await expect(page.locator('#deck-counter')).toBeVisible();
  } finally {await context.close();}
});

test('external README is escaped and repo link points to its own repository',async ({page})=>{
  await fixture(page);
  await page.route('https://raw.githubusercontent.com/another-owner/external-talk/main/README.md',route=>
    route.fulfill({status:200,contentType:'text/markdown',headers:{'access-control-allow-origin':'*'},body:markdown('remote-untrusted.md')})
  );
  await ready(page,'/?url=https%3A%2F%2Fgithub.com%2Fanother-owner%2Fexternal-talk%2Fblob%2Fmain%2FREADME.md');
  await expect(page.locator('#nav-repository')).toHaveAttribute('href','https://github.com/another-owner/external-talk');
  expect(await page.evaluate(()=>window.remoteAttacked)).toBeUndefined();
  expect(await page.evaluate(()=>document.querySelectorAll('.reveal .slides img[onerror]').length)).toBe(0);
});


test('toolbar visibility can be configured to hidden or always',async ({page})=>{
  await fixture(page,'minimal-deck.md',{navigationVisibility:'hidden'});
  await ready(page);
  await expect(page.locator('#deck-navigation')).toBeHidden();
  await expect(page.locator('#deck-counter')).toBeVisible();
  // Keyboard-based Reveal navigation still functions when no toolbar exists.
  expect(await page.evaluate(()=>Reveal.getSlides().length)).toBe(1);
});

test('remote README relative images, videos, nested links and anchors resolve against their source',async ({page})=>{
  await fixture(page,'minimal-deck.md');
  const url='https://github.com/example-user/remote-deck/blob/main/docs/README.md';
  await page.route('https://raw.githubusercontent.com/example-user/remote-deck/main/docs/README.md',route=>route.fulfill({
    status:200,contentType:'text/plain',
    body:[
      '# Remote workshop',
      '',
      '![Diagram](images/diagram.png)',
      '',
      '[Local video](../media/demo.mp4)',
      '',
      '[Documentation](../GUIDE.md#setup)',
      '',
      '[External](https://example.com)',
      '',
      '[Jump](#overview)',
      '',
      '```markdown',
      '[do not rewrite](../../../../secret)',
      '```',
      '',
      '---',
      '',
      '## Overview'
    ].join('\n')
  }));
  await ready(page,`/?url=${encodeURIComponent(url)}`);
  await expect(page.locator('.reveal .slides img').first()).toHaveAttribute('src',
    'https://raw.githubusercontent.com/example-user/remote-deck/main/docs/images/diagram.png');
  await expect(page.locator('.slide-video figcaption a')).toHaveAttribute('href',
    'https://raw.githubusercontent.com/example-user/remote-deck/main/media/demo.mp4');
  await expect(page.locator('.reveal .slides a').filter({hasText:'Documentation'})).toHaveAttribute('href',
    'https://github.com/example-user/remote-deck/blob/main/GUIDE.md#setup');
  await expect(page.locator('.reveal .slides a').filter({hasText:'Jump'})).toHaveAttribute('href','#overview');
  await expect(page.locator('#nav-repository')).toHaveAttribute('href','https://github.com/example-user/remote-deck');
  // With correctly separated slides, fenced Markdown must remain a code block,
  // not be interpreted as a live link or rewritten into a repository URL.
  expect(await page.evaluate(()=>Reveal.getSlides().length)).toBe(2);
  const code=page.locator('.reveal .slides pre code').filter({hasText:'[do not rewrite]'});
  await expect(code).toContainText('[do not rewrite](../../../../secret)');
  expect(await page.locator('.reveal .slides a[href*="secret"]').count()).toBe(0);
});
