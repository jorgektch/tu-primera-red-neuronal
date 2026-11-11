import test from 'node:test';
import assert from 'node:assert/strict';
import {isPointerInRevealZone} from '../assets/js/navigation.mjs';

const bar = {left:810,top:654,width:450,height:51};
const viewport = {width:1280,height:720};

test('pointer in bottom-right toolbar reveal zone returns true', () => {
  assert.equal(isPointerInRevealZone({x:1100,y:700},bar,viewport,90),true);
  assert.equal(isPointerInRevealZone({x:780,y:700},bar,viewport,90),true);
});

test('pointer outside the bottom-right region does not reveal controls', () => {
  assert.equal(isPointerInRevealZone({x:100,y:700},bar,viewport,90),false);
  assert.equal(isPointerInRevealZone({x:1130,y:400},bar,viewport,90),false);
});

test('zero-size and missing elements cannot reveal controls', () => {
  assert.equal(isPointerInRevealZone({x:1200,y:700}, {...bar,width:0}, viewport,90),false);
  assert.equal(isPointerInRevealZone(null,bar,viewport,90),false);
});

test('configurable zone height changes reveal proximity', () => {
  assert.equal(isPointerInRevealZone({x:1150,y:615},bar,viewport,90),false);
  assert.equal(isPointerInRevealZone({x:1150,y:615},bar,viewport,120),true);
});
