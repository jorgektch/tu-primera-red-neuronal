import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {predictProbability,predictLabel,validateModel} from '../demo/inference.mjs';
import {preprocessRGBA} from '../demo/preprocess.mjs';
const model=JSON.parse(readFileSync(new URL('../demo/model.json',import.meta.url),'utf8'));
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/predictions.json',import.meta.url),'utf8'));
test('model schema and weights are valid',()=>{assert.equal(validateModel(model),model);assert.equal(model.inputSize,784);});
test('JavaScript inference matches Python for held-out samples',()=>{
  for(const item of fixtures){const score=predictProbability(item.pixels,model);assert.ok(Math.abs(score-item.python_probability)<2e-4,`drift ${score-item.python_probability}`);}
});
test('classification includes uncertain band',()=>{
  assert.equal(predictLabel(.1,model).state,'sad');assert.equal(predictLabel(.9,model).state,'happy');assert.equal(predictLabel(.5,model).state,'uncertain');
});
test('blank image is zero-ink',()=>{
  const rgba=new Uint8ClampedArray(32*32*4).fill(255);
  const got=preprocessRGBA(rgba,32,32);
  assert.equal(got.empty,true);assert.equal(got.pixels.reduce((a,b)=>a+b,0),0);
});

test('browser preprocessing classifies 10 bundled PNG samples',()=>{
  const samples=JSON.parse(readFileSync(new URL('./fixtures/raw_rgba.json',import.meta.url),'utf8'));
  for(const sample of samples){
    const result=preprocessRGBA(Uint8Array.from(sample.rgba),sample.w,sample.h);
    const probability=predictProbability(result.pixels,model);
    const actual=predictLabel(probability,model).state;
    assert.equal(actual,sample.class==='feliz'?'happy':'sad', sample.name);
  }
});
