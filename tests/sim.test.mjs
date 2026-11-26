import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,advance,assess,carvingDetails} from '../src/sim.js';
import {earnedAchievements} from '../src/achievements.js';
import {immersionGeometry,cellIsImmersed} from '../src/geometry.js';
import {EFFECTS} from '../src/effects.js';
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

test('achievement rules reward distinct outcomes and respect thresholds',()=>{
 const s=createState(setup);
 assert.deepEqual(earnedAchievements(s,{score:79,damage:99}),[]);
 assert.ok(earnedAchievements(s,{score:80,damage:99}).includes('thanksgiving'));
 assert.ok(!earnedAchievements(s,{score:80,damage:100}).includes('thanksgiving'));
 assert.ok(earnedAchievements(s,{score:65,damage:10000}).includes('deck'));
 assert.ok(earnedAchievements(s,{score:0,damage:50000}).includes('insurance'));
 for(const c of s.cells){c.t=150;c.ice=0;}
 assert.ok(earnedAchievements(s,{score:0,damage:0}).includes('crouton'));
 s.setup.fluid='mercury';
 const forbidden=earnedAchievements(s,{score:0,damage:0});
 assert.ok(forbidden.includes('forbidden'));assert.ok(!forbidden.includes('crouton'));
 s.setup.fluid='oil';for(const c of s.cells){const r=((c.x-9)/8)**2+((c.y-9)/9)**2;c.t=r>=.65?80:-5;c.ice=r>=.65?0:10;}
 assert.ok(earnedAchievements(s,{score:0,damage:0}).includes('glacier'));
});

test('mercury cannot cook a bird suspended visibly above the fluid',()=>{
 for(const fill of [15,50,90]){
  const s=createState({...setup,fluid:'mercury',fill,heat:400});
  for(let i=0;i<2100&&!s.ended;i++)advance(s,{depth:100,heat:400});
  const geometry=immersionGeometry(s.depth,s.fill,s.setup.mass);
  assert.ok(geometry.bottom<geometry.surface);
  assert.equal(geometry.submerged,0);
  assert.ok(s.cells.every(c=>c.t<=22));
  assert.equal(s.brown,0);assert.equal(s.spill,0);
  assert.equal(carvingDetails(s).outside.percent,0);
 }
});

test('thermal immersion matches the shared drawn surface and depends on fill',()=>{
 const low=immersionGeometry(.8,.15,5),high=immersionGeometry(.8,.9,5);
 assert.ok(high.submerged>low.submerged);
 const s=createState(setup);
 for(const c of s.cells){const y=low.top+c.y/18*(low.bottom-low.top);assert.equal(cellIsImmersed(c,low,19),y>=low.surface);}
});

test('hot water evaporates without immersion and never fuels fire',()=>{
 const s=createState({...setup,fluid:'water',heat:180});
 for(let i=0;i<150;i++)advance(s,{depth:0,heat:180});
 assert.ok(s.evaporated>.01);assert.ok(s.fill<.5);assert.ok(s.vapor>.01);
 assert.equal(s.spill,0);assert.equal(s.fire,0);assert.ok(s.cells.every(c=>c.t<=22));
});

test('overflow produces runoff before feeding oil flames',()=>{
 const s=createState({...setup,fill:90,heat:250});
 advance(s,{depth:100,heat:250});assert.ok(s.overflowRate>0);assert.ok(s.spill>0);
 for(let i=0;i<200;i++)advance(s,{depth:100,heat:250});
 assert.ok(s.spillFuel>0);assert.ok(s.fire>0);
});

test('quiet runs bore the neighbor while spilled goo climbs',()=>{
 const quiet=createState({...setup,heat:20});
 for(let i=0;i<100;i++)advance(quiet,{depth:0,heat:20});
 assert.ok(quiet.quietTime>=8);
 const goo=createState({...setup,fluid:'goo',fill:90,heat:80});
 for(let i=0;i<300;i++)advance(goo,{depth:100,heat:80});
 assert.ok(goo.spill>.002);assert.ok(goo.gooCreep>.3);assert.equal(goo.fire,0);
});

test('alien transformation starts only after goo contact and grows gradually',()=>{
 const s=createState({...setup,fluid:'goo',heat:20});
 s.gooCreep=EFFECTS.gooContact-.01;
 advance(s,{depth:0,heat:20});assert.equal(s.neighborTouched,false);assert.equal(s.alienProgress,0);
 s.gooCreep=EFFECTS.gooContact;
 advance(s,{depth:0,heat:20});assert.equal(s.neighborTouched,true);assert.ok(s.alienProgress>0&&s.alienProgress<.01);
 for(let i=0;i<100;i++)advance(s,{depth:0,heat:20});assert.ok(s.alienProgress>.3&&s.alienProgress<.6);
 for(let i=0;i<200;i++)advance(s,{depth:0,heat:20});assert.equal(s.alienProgress,1);
 const other=createState({...setup,heat:20});other.gooCreep=1;advance(other,{depth:0,heat:20});assert.equal(other.alienProgress,0);
});
