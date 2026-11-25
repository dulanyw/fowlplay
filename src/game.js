import {CONFIG,FLUIDS,createState,advance,endRun,assess} from './sim.js';
import {drawScene,drawCarving,bird} from './art.js';
const $=id=>document.getElementById(id);
const ctx=$('scene').getContext('2d');
let state,setup,active=false,paused=false,speed=1,accumulator=0,last=0,record=[],replay=null,replayIndex=0,finishedRecord=null,audio=null,sound=false,oscillator,gain,carveStart=0,report=null,visualTime=0,crankAngle=0,crankDrag=null,hoistPosition=0,screen='title';
let discovered={};try{discovered=JSON.parse(localStorage.getItem('fowl-discoveries')||'{}');}catch{}
for(const [id,f] of Object.entries(FLUIDS)){const o=document.createElement('option');o.value=id;o.textContent=f.name;$('fluid').append(o);}
const SCREEN_HEADINGS={title:'title-heading',setup:'setup-heading',cooking:'cooking-heading',carving:'carving-heading',scoring:'result-title'};
const CARVING_DURATION=5000;
// Show exactly one screen, update progress and focus its heading. No simulation is started here.
function showScreen(next){
 screen=next;
 for(const name of Object.keys(SCREEN_HEADINGS))$('screen-'+name).hidden=name!==next;
 for(const step of document.querySelectorAll('[data-step]')){if(step.dataset.step===next)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');}
 $(SCREEN_HEADINGS[next]).focus({preventScroll:true});
 window.scrollTo({top:0,behavior:'instant'});
}
// Draw the selected bird without exposing any cooking result.
function drawPrep(){const c=$('prep-bird').getContext('2d');c.clearRect(0,0,400,250);bird(c,200,120,.8+(+$('mass').value-3)*.035,0);if($('prep').value==='frozen'||$('prep').value==='partial'){c.fillStyle='#b3e3f0';c.font='bold 16px Trebuchet MS';c.textAlign='center';c.fillText($('prep').value==='frozen'?'❄ FROZEN':'❄ PARTLY FROZEN',200,235);}}
$('play').onclick=()=>showScreen('setup');
$('back-title').onclick=()=>showScreen('title');
$('score-me').onclick=()=>{if(state.ended&&!$('score-me').disabled)showScreen('scoring');};
$('inspect').onclick=()=>{showScreen('carving');};
// Read and constrain all editable setup values in one place.
function readSetup(){return{prep:$('prep').value,fluid:$('fluid').value,mass:+$('mass').value,fill:+$('fill').value,heat:+$('heat').value};}
// Reflect controls and preview setup; never reset an active simulation.
function updateControls(){for(const [id,unit] of [['mass',' kg'],['fill','%'],['heat','°C'],['burner','°C'],['depth','%']])$(id+'-out').textContent=$(id).value+unit;$('fluid-note').textContent=FLUIDS[$('fluid').value].note;if(!active&&!state?.ended){setup=readSetup();state=createState(setup);state.depth=+$('depth').value/100;}$('temperature').innerHTML=Math.round(state.temp)+'<span>°C</span>';drawPrep();}
for(const id of ['prep','mass','fluid','fill','heat','burner','depth'])$(id).addEventListener('input',()=>{updateControls();if(active&&!replay)recordControl();});
// Record final control values per fixed tick; coalescing limits replay growth during crank drags.
function recordControl(){const event=[Math.round(state.time/CONFIG.clockRate/CONFIG.step),+$('depth').value,+$('burner').value];if(record.length&&record.at(-1)[0]===event[0])record[record.length-1]=event;else record.push(event);}
// Map pointer positions to illustration coordinates, independent of responsive display size.
function scenePoint(e){const r=$('scene').getBoundingClientRect();return{x:(e.clientX-r.left)*1000/r.width,y:(e.clientY-r.top)*660/r.height};}
// Apply hoist motion through the existing input contract so replay recording stays identical.
function turnCrank(delta){if(!active||replay||state.ended)return;crankAngle+=delta;hoistPosition=Math.max(0,Math.min(100,hoistPosition+delta*100/(Math.PI*4)));$('depth').value=Math.round(hoistPosition);$('depth').dispatchEvent(new Event('input'));$('scene').setAttribute('aria-valuenow',$('depth').value);}
$('scene').addEventListener('pointerdown',e=>{const p=scenePoint(e);if(Math.hypot(p.x-248,p.y-278)>75||!active||replay||state.ended)return;e.preventDefault();crankDrag={id:e.pointerId,angle:Math.atan2(p.y-278,p.x-248)};$('scene').setPointerCapture(e.pointerId);$('scene').classList.add('cranking');});
$('scene').addEventListener('pointermove',e=>{if(!crankDrag||crankDrag.id!==e.pointerId)return;const p=scenePoint(e);if(Math.hypot(p.x-248,p.y-278)<12)return;const angle=Math.atan2(p.y-278,p.x-248);const delta=Math.atan2(Math.sin(angle-crankDrag.angle),Math.cos(angle-crankDrag.angle));crankDrag.angle=angle;turnCrank(delta);});
// Release capture on completion/cancellation, including gestures interrupted by the OS.
function releaseCrank(){crankDrag=null;$('scene').classList.remove('cranking');}
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(type,releaseCrank);
$('scene').addEventListener('keydown',e=>{if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();turnCrank((e.key==='ArrowDown'||e.key==='ArrowRight'?1:-1)*Math.PI/20);}});
// Lock immutable setup while preserving live heat and hoist controls.
function lockSetup(locked){for(const id of ['prep','mass','fluid','fill'])$(id).disabled=locked;}
// Start an isolated run, optionally applying a previously validated replay.
function startRun(playback=null){
 setup=playback?.setup||readSetup();state=createState(setup);active=true;paused=false;accumulator=0;speed=1;visualTime=0;crankAngle=0;hoistPosition=0;
 $('depth').value=0;$('burner').value=setup.heat;$('burner-out').textContent=setup.heat+'°C';$('scene').setAttribute('aria-valuenow','0');
 record=[[0,0,setup.heat]];replay=playback;replayIndex=0;finishedRecord=null;lockSetup(true);$('depth').disabled=!!playback;$('burner').disabled=!!playback;
 $('pause').disabled=false;$('pause').textContent='Ⅱ Pause';$('status').textContent=playback?'REPLAY':'COOKING';$('serve').disabled=!!playback;
 document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',b.dataset.speed==='1'));
 $('setup-summary').textContent=setup.mass+' kg · '+FLUIDS[setup.fluid].name;
 showScreen('cooking');
}
$('start').onclick=()=>startRun();$('serve').onclick=()=>{endRun(state);finishRun();};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'▶ Resume':'Ⅱ Pause';};
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));};
// Produce the report and persist only local discovery summaries, tolerating blocked storage.
function finishRun(){if(!active)return;active=false;report=assess(state);finishedRecord=replay||{v:CONFIG.version,setup,events:record,end:Math.round(state.time/CONFIG.clockRate/CONFIG.step)};$('status').textContent='DONE';$('pause').disabled=true;$('serve').disabled=true;$('result-title').textContent=report.title;$('dinner-score').textContent=report.score+'/100';$('damage-score').textContent='$'+report.damage.toLocaleString();$('assessment').textContent=FLUIDS[state.setup.fluid].edible?Math.round(state.cells.filter(c=>c.t>=68&&c.ice===0).length/state.cells.length*100)+'% cooked · '+(report.mean>110?'Overdone':report.cold<55?'Cold center':'Dinner is served'):'Inedible fluid. Dinner disqualified.';$('share-status').textContent='';discovered[state.setup.fluid]={score:report.score,title:report.title};try{localStorage.setItem('fowl-discoveries',JSON.stringify(discovered));}catch{}updateBook();carveStart=performance.now();$('score-me').disabled=true;$('carving-status').textContent='Carving…';showScreen('carving');}
// Reset the same setup for a fast experiment retry.
function resetRun(){
 active=false;paused=false;state=null;replay=null;report=null;crankAngle=0;hoistPosition=0;releaseCrank();
 $('scene').setAttribute('aria-valuenow','0');$('depth').disabled=false;$('burner').disabled=false;$('depth').value=0;lockSetup(false);$('status').textContent='READY';
 $('start').textContent='Ready to cook →';$('start').onclick=()=>startRun();updateControls();
}
// Retry uses the original setup, including its starting heat rather than the last burner setting.
$('again').onclick=()=>{const original={...state.setup};resetRun();for(const k of ['prep','mass','fluid','fill','heat'])$(k).value=original[k];updateControls();startRun();};
$('new-experiment').onclick=()=>{resetRun();showScreen('setup');};
// Build replay links from bounded plain data; the URL fragment stays on the client.
function replayURL(){const u=new URL(location.href);u.hash='run='+btoa(JSON.stringify(finishedRecord));return u.href;}
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(replayURL());$('share-status').textContent='Replay link copied. Let someone else explain this.';}catch{$('share-status').textContent='Clipboard unavailable. Copy this link: '+replayURL();}};
$('share').onclick=()=>{const u=new URL('https://bsky.app/intent/compose');u.searchParams.set('text',`🦃 FOWL PLAY\nDinner: ${report.score}/100 · Damage: $${report.damage.toLocaleString()}\n“${report.title}”\nReplay my incident: ${replayURL()}`);if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){$('share-status').textContent='Local preview links work only on this computer. Public replay sharing will work after GitHub Pages deployment.';return;}window.open(u.href,'_blank','noopener,noreferrer');};
// Generate the incident image locally; no upload, account or external service.
$('download').onclick=()=>{const c=document.createElement('canvas');c.width=1000;c.height=900;const g=c.getContext('2d');g.fillStyle='#191e24';g.fillRect(0,0,1000,900);g.fillStyle='#ffd267';g.font='bold 54px Trebuchet MS';g.fillText('FOWL PLAY',60,90);g.fillStyle='#f3ebdb';g.font='bold 33px Trebuchet MS';g.fillText(report.title,60,155);g.drawImage($('scene'),0,185,1000,500);g.fillStyle='#191e24';g.fillRect(0,690,1000,210);g.fillStyle='#ffd267';g.font='bold 32px Trebuchet MS';g.fillText(`Dinner ${report.score}/100  ·  Damage $${report.damage.toLocaleString()}`,60,750);g.font='20px Trebuchet MS';g.fillStyle='#f3ebdb';g.fillText(FLUIDS[state.setup.fluid].name+' / '+state.setup.prep+' / '+Math.round(state.time/60)+' simulated minutes',60,800);g.fillText('A backyard cooking incident. fowl play.',60,850);const a=document.createElement('a');a.download='fowl-play-incident.png';a.href=c.toDataURL('image/png');a.click();};
// Refresh the discovery list using text nodes, including data from local storage.
function updateBook(){$('count').textContent=Object.keys(FLUIDS).filter(k=>discovered[k]).length+'/6';$('discovery-list').replaceChildren();for(const [id,f] of Object.entries(FLUIDS)){const d=document.createElement('div');d.className='discovery';const title=document.createElement('strong');title.textContent=f.name+(discovered[id]?' ✓':' · Unexplored');const p=document.createElement('p');p.textContent=discovered[id]?`${discovered[id].title} Dinner: ${discovered[id].score}/100`:f.note;d.append(title,p);$('discovery-list').append(d);}}
$('scrapbook').onclick=()=>$('discoveries').showModal();$('close-book').onclick=()=>$('discoveries').close();
// Audio is synthesized only after a user gesture and stays muted by default.
$('sound').onclick=async()=>{sound=!sound;if(sound&&!audio){audio=new AudioContext();oscillator=audio.createOscillator();gain=audio.createGain();oscillator.type='sawtooth';oscillator.connect(gain);gain.connect(audio.destination);gain.gain.value=0;oscillator.start();}if(sound)await audio.resume();$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));if(!sound&&gain)gain.gain.value=0;};
// Validate untrusted replay inputs before allocating or running any simulation.
function parseReplay(){try{const hash=location.hash;if(!hash.startsWith('#run=')||hash.length>24000)return null;const r=JSON.parse(atob(hash.slice(5)));const s=r.setup;if(r.v!==1||!s||!FLUIDS[s.fluid]||!['thawed','damp','partial','frozen'].includes(s.prep)||!Number.isInteger(s.mass)||s.mass<3||s.mass>9||!Number.isFinite(s.fill)||s.fill<15||s.fill>90||!Number.isFinite(s.heat)||s.heat<20||s.heat>400||!Number.isInteger(r.end)||r.end<0||r.end>2000||!Array.isArray(r.events)||r.events.length>1500)return null;let previous=-1;for(const e of r.events){if(!Array.isArray(e)||e.length!==3||!e.every(Number.isFinite)||!Number.isInteger(e[0])||e[0]<previous||e[0]>2000||e[1]<0||e[1]>100||e[2]<20||e[2]>400)return null;previous=e[0];}return r;}catch{return null;}}
// Single animation orchestrator separates fixed-step physics from visual rendering.
function frame(now){const elapsed=Math.min(.1,(now-last)/1000||0);last=now;if(!paused&&!state.ended)visualTime+=elapsed*(active?speed:1);if(active&&!paused){accumulator+=elapsed*speed;let steps=0;while(accumulator>=CONFIG.step&&active&&steps++<100){const tick=Math.round(state.time/CONFIG.clockRate/CONFIG.step);if(replay){while(replayIndex<replay.events.length&&replay.events[replayIndex][0]<=tick){const e=replay.events[replayIndex++];$('depth').value=e[1];$('burner').value=e[2];$('burner-out').textContent=e[2]+'°C';$('scene').setAttribute('aria-valuenow',String(e[1]));crankAngle=e[1]/100*Math.PI*4;}if(tick>=replay.end)endRun(state);}advance(state,{depth:+$('depth').value,heat:+$('burner').value});accumulator-=CONFIG.step;if(state.ended)finishRun();}}
drawScene(ctx,state,FLUIDS[state.setup.fluid],visualTime,crankAngle);$('temperature').innerHTML=Math.round(state.temp)+'<span>°C</span>';$('clock').textContent=String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0');$('remark').textContent=state.damage>20000?'Fence: retired.':state.fire>.2?'Well, that’s on fire.':state.chaos>1.5?'Getting lively.':state.setup.fluid==='mercury'&&state.depth>.1?'It floats.':state.time?'↻ Lower · ↺ Raise':'Drag the crank · ↻ Lower · ↺ Raise';if(screen==='title')drawScene($('title-scene').getContext('2d'),state,FLUIDS[state.setup.fluid],visualTime,0);
if(screen==='carving'){const progress=Math.min(1,(now-carveStart)/CARVING_DURATION);drawCarving($('carving').getContext('2d'),state,progress);if(progress===1&&$('score-me').disabled){$('score-me').disabled=false;$('carving-status').textContent='Take a look. No rush.';}}
if(gain){gain.gain.value=sound&&active&&!paused?Math.min(.025,.003+state.chaos*.006):0;oscillator.frequency.value=50+state.chaos*35+Math.sin(now*.02)*10;}requestAnimationFrame(frame);}
updateControls();updateBook();const incoming=parseReplay();if(incoming){for(const k of ['prep','fluid','mass','fill','heat'])$(k).value=incoming.setup[k];updateControls();$('play').textContent='Watch shared incident →';$('play').onclick=()=>{showScreen('setup');$('start').textContent='Watch replay →';$('start').onclick=()=>startRun(incoming);};}requestAnimationFrame(frame);
