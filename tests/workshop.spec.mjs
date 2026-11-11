import {test, expect} from '@playwright/test';

test('43 educational slides, citations, diagrams and correct presenter',async ({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.slideReady===true,null,{timeout:60000});
  expect(await page.evaluate(()=>Reveal.getSlides().length)).toBe(43);
  await expect(page.locator('.cover-title')).toHaveText('Mi Primera Red Neuronal');
  await expect(page.locator('[data-config="email"]').first()).toHaveText('jorgektch@gmail.com');
  await expect(page.locator('#nav-repository')).toHaveAttribute('href','https://github.com/jorgektch/tu-primera-red-neuronal');
  const diagnostics=await page.evaluate(()=>window.slideDiagnostics);
  expect(diagnostics.detected).toBeGreaterThanOrEqual(5);
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.rendered).toBe(diagnostics.detected);
});

test('vertical slide and F5 keep same place',async ({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.slideReady===true,null,{timeout:60000});
  const indices=await page.evaluate(()=>{
    const slides=Reveal.getSlides();
    const slide=slides.find(x=>x.textContent.includes('Detalle vertical: formas'));
    if(!slide)throw new Error('Falta slide vertical');
    const {h,v}=Reveal.getIndices(slide); Reveal.slide(h,v);
    return {h,v};
  });
  expect(indices.v).toBe(1);
  await expect.poll(()=>page.evaluate(()=>location.hash)).toMatch(/^#\/\d+\/1$/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.slideReady===true,null,{timeout:60000});
  expect(await page.evaluate(()=>Reveal.getIndices().h)).toBe(indices.h);
  expect(await page.evaluate(()=>Reveal.getIndices().v)).toBe(1);
});

test('app loads model and classifies bundled drawings',async ({page})=>{
  await page.goto('/demo/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#model-status')).toContainText('Modelo NumPy cargado', {timeout:20000});
  await page.locator('#tab-upload').click();
  await page.locator('#upload').setInputFiles('data/samples/test_feliz_00.png');
  await expect(page.locator('#prediction')).toContainText('Carita feliz');
  await page.locator('#upload').setInputFiles('data/samples/test_triste_00.png');
  await expect(page.locator('#prediction')).toContainText('Carita triste');
});
