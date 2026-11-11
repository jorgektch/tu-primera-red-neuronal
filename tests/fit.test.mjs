import test from 'node:test';
import assert from 'node:assert/strict';
import {fitSlide,measuredSlideHeight} from '../assets/js/fit.mjs';

function mockSlide(heights,base=800){
  const set=new Set();
  const slide={
    classList:{contains:v=>set.has(v),add:(...items)=>items.forEach(v=>set.add(v)),
      remove:(...items)=>items.forEach(v=>set.delete(v))},
    get scrollHeight(){return set.has('slide-content-tight')?heights[2]:
      set.has('slide-content-compact')?heights[1]:heights[0]},
    get offsetHeight(){return 0}
  };
  return slide;
}

test('content that fits stays unchanged',()=>{
  const slide=mockSlide([600,520,500]);
  assert.equal(fitSlide(slide,{height:720}).mode,'normal');
  assert.equal(slide.classList.contains('slide-content-compact'),false);
});
test('moderate overflow uses compact mode',()=>{
  const slide=mockSlide([750,680,650]);
  assert.equal(fitSlide(slide,{height:720}).mode,'compact');
});
test('bigger overflow uses tight mode',()=>{
  const slide=mockSlide([820,750,670]);
  assert.equal(fitSlide(slide,{height:720}).mode,'tight');
});
test('extreme overflow is reported, never clipped',()=>{
  const slide=mockSlide([1200,1050,900]);
  const r=fitSlide(slide,{height:720});
  assert.equal(r.mode,'overflow');
  assert.ok(r.height>r.limit);
});
test('cover and vertical-stack wrapper bypass fitting',()=>{
  const slide=mockSlide([1200,900,800]);slide.classList.add('cover');
  assert.equal(fitSlide(slide).mode,'skip');
  assert.equal(measuredSlideHeight(slide),1200);
});

import {normalizeConfig} from '../assets/js/config.mjs';
test('video size configuration is validated',()=>{
  assert.equal(normalizeConfig({media:{videoMaxWidthPx:640,videoMaxHeightPx:350}}).media.videoMaxHeightPx,350);
  assert.equal(normalizeConfig({media:{videoMaxHeightPx:9999}}).media.videoMaxHeightPx,350);
});
