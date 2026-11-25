import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,advance,assess,carvingDetails} from '../src/sim.js';
const setup={prep:'thawed',fluid:'oil',mass:5,fill:50,heat:180};
test('heat penetrates from edge toward core',()=>{const s=createState(setup);for(let i=0;i<400;i++)advance(s,{depth:100,heat:180});const center=s.cells.find(c=>c.x===9&&c.y===9);const edge=s.cells.find(c=>c.x===9&&c.y===18);assert.ok(edge.t>center.t);assert.ok(center.t>5);});
test('overflow removes fluid and causes escalating damage',()=>{const s=createState({...setup,fill:90,prep:'frozen',heat:300});for(let i=0;i<500;i++)advance(s,{depth:100,heat:300});assert.ok(s.spill>0);assert.ok(s.damage>0);assert.ok(s.fill<.9);});
test('mercury limits immersion and disqualifies dinner',()=>{const s=createState({...setup,fluid:'mercury'});advance(s,{depth:100,heat:180});assert.equal(s.depth,.3);assert.equal(assess(s).score,0);});
test('fixed inputs reproduce the same cooking and damage',()=>{const a=createState(setup),b=createState(setup);for(let i=0;i<300;i++){advance(a,{depth:i%100,heat:180});advance(b,{depth:i%100,heat:180});}assert.deepEqual(a,b);});
test('frozen turkey heats more slowly than thawed turkey',()=>{const a=createState(setup),b=createState({...setup,prep:'frozen'});for(let i=0;i<200;i++){advance(a,{depth:100,heat:180});advance(b,{depth:100,heat:180});}assert.ok(assess(a).mean>assess(b).mean);});

test('carving callouts distinguish cooked outer meat from a frozen center',()=>{
 const s=createState(setup);
 for(const c of s.cells){const r=((c.x-9)/8)**2+((c.y-9)/9)**2;c.t=r>=.65?90:-5;c.ice=r>=.65?0:10;}
 const result=carvingDetails(s);
 assert.equal(result.outside.percent,100);
 assert.equal(result.outside.label,'Cooked through');
 assert.equal(result.inside.percent,0);
 assert.equal(result.inside.label,'Still frozen');
});
test('overcooked meat retains 100 percent doneness but is labeled overdone',()=>{
 const s=createState(setup);for(const c of s.cells){c.t=150;c.ice=0;}
 const result=carvingDetails(s);assert.equal(result.inside.percent,100);assert.equal(result.inside.label,'Overdone');
});
