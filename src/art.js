import {immersionGeometry} from './geometry.js';
import {EFFECTS} from './effects.js';
// Canvas illustration helpers accept a context; they have no DOM or simulation side effects.
function shape(c,fill,draw,stroke='#20262a',width=5){c.beginPath();draw();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}}
function oval(c,x,y,rx,ry,fill){shape(c,fill,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2));}
function box(c,x,y,w,h,fill,r=8){shape(c,fill,()=>c.roundRect(x,y,w,h,r));}
function line(c,x,y,xx,yy,color='#20262a',w=5){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke();}
function text(c,t,x,y,size=18,color='#f3ebdb'){c.fillStyle=color;c.font=`bold ${size}px Trebuchet MS`;c.textAlign='center';c.fillText(t,x,y);}
// Render continuous rim-to-ground runoff and a widening pool from measured spill volume.
function drawRunoff(c,s,fluid,time){
 if(s.spill>.0001){const width=Math.min(245,30+s.spill*1400);oval(c,470,605,width,16,fluid.color);}
 if(s.overflowRate>.0001){for(const side of [-1,1]){const x=440+side*145;const width=Math.min(23,5+s.overflowRate*550);c.beginPath();c.moveTo(x-side*12,370);c.bezierCurveTo(x+side*25,359,x+side*17,430,x+side*20,481);c.bezierCurveTo(x+side*18,540,x+side*49,561,x+side*43,602);c.strokeStyle='#26302d';c.lineWidth=width+5;c.stroke();c.strokeStyle=fluid.color;c.lineWidth=width;c.stroke();for(let i=0;i<6;i++){const phase=(time*1.7+i/6)%1;oval(c,x+side*(18+phase*25),385+phase*211,3,7,'#ecdab1');}}}
}
// Vapor billows are translucent and borderless, with intensity driven by actual evaporation.
function drawVapor(c,s,fluid,surface,time){
 if(s.vapor<=.01)return;
 c.save();for(let i=0;i<Math.ceil(s.vapor*9);i++){const age=(time*.28+i*.137)%1;const x=325+(i*47)%230+age*65;const y=surface-15-age*230;const radius=14+age*47;c.globalAlpha=(1-age)*Math.min(.24,s.vapor*.14);shape(c,s.setup.fluid==='alcohol'?'#ded8ed':'#edf1e9',()=>{c.ellipse(x,y,radius*1.35,radius,0,0,Math.PI*2);},null);}c.restore();
}
// Goo follows an uphill path then scales the fence; growth is simulation state, not wall time.
function drawGoo(c,s){
 if(s.gooCreep<=0)return;const points=[[590,599],[660,578],[715,534],[738,490],[735,430],[744,367],[741,313],[783,302],[833,310],[870,350]];
 const length=s.gooCreep*(points.length-1),whole=Math.floor(length);c.beginPath();c.moveTo(...points[0]);for(let i=1;i<=whole;i++)c.lineTo(...points[i]);if(whole<points.length-1){const a=points[whole],b=points[whole+1],t=length-whole;c.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);}c.lineJoin='round';c.lineCap='round';c.strokeStyle='#29372b';c.lineWidth=25;c.stroke();c.strokeStyle='#a5dc76';c.lineWidth=18;c.stroke();
}
// Draw a cartoon turkey; browning changes the exterior without exposing its center.
export function bird(c,x,y,scale=1,brown=0){c.save();c.translate(x,y);c.scale(scale,scale);const skin=brown>2?'#594132':brown>.6?'#c57b3e':'#e5ac74';oval(c,0,0,66,79,skin);oval(c,-55,29,23,36,skin);oval(c,55,29,23,36,skin);line(c,-45,58,-57,88,'#f1dfba',12);line(c,45,58,57,88,'#f1dfba',12);oval(c,-58,91,11,7,'#f1dfba');oval(c,58,91,11,7,'#f1dfba');line(c,-15,-42,-30,-20,'#f6cc91',5);c.restore();}
// Draw warm fall scenery behind the fence; all dimensions use canvas coordinates.
function drawAutumn(c){
 const sky=c.createLinearGradient(0,0,0,460);sky.addColorStop(0,'#86b9c9');sky.addColorStop(1,'#f2d9a1');c.fillStyle=sky;c.fillRect(0,0,1000,660);
 oval(c,865,104,45,45,'#ffe7a1');
 for(const [x,y,k] of [[65,232,.9],[185,255,.8],[710,215,1],[970,235,1.1]]){c.save();c.translate(x,y);c.scale(k,k);line(c,0,130,0,-60,'#71523b',18);line(c,0,20,-57,-48,'#71523b',10);line(c,0,-5,56,-75,'#71523b',9);for(let j=0;j<9;j++){const angle=j*2.4;oval(c,Math.sin(angle)*67,-70+Math.cos(angle)*50,44,42,['#bd633c','#d7863c','#e8b650','#a94e38'][j%4]);}line(c,0,115,0,-10,'#71523b',12);line(c,0,25,35,-12,'#71523b',7);c.restore();}
 c.fillStyle='#a7a267';c.fillRect(0,440,1000,220);c.fillStyle='#858951';c.fillRect(0,540,1000,120);
 // Long afternoon shadows and fallen leaves lie in front of the fence.
 shape(c,'#6e774e',()=>{c.moveTo(225,570);c.lineTo(470,655);c.lineTo(620,655);c.lineTo(650,570);},null);
 for(let i=0;i<48;i++){const x=(i*173)%1000,y=500+(i*47)%155;c.save();c.translate(x,y);c.rotate(i);oval(c,0,0,6,3,['#c47d3f','#e0b253','#a65636'][i%3]);c.restore();}
}
// Render scenery, neighbor, fence, then apparatus so the neighbor is occluded correctly.
export function drawScene(c,s,fluid,visualTime,crankAngle=0){c.clearRect(0,0,1000,660);drawAutumn(c);
const panic=s.fire>.2||s.chaos>1.8||s.gooCreep>.6;const bored=!panic&&s.quietTime>EFFECTS.boredAfter;const ny=s.damage>30000?395:282;
box(c,775,ny+22,73,85,'#7c9ea5',20);oval(c,810,ny,34,39,'#e7b584');shape(c,'#d7c39d',()=>{c.moveTo(770,ny-21);c.lineTo(777,ny-46);c.lineTo(836,ny-46);c.lineTo(850,ny-20);});line(c,768,ny-21,854,ny-21,'#23282b',6);oval(c,799,ny,3,4,'#23282b');oval(c,821,ny,3,4,'#23282b');if(panic){box(c,786,ny-10,47,17,'#a4d2d4',5);oval(c,812,ny+22,7,10,'#65453c');}else line(c,804,ny+20,818,ny+20);
for(let x=0;x<1040;x+=52){box(c,x,310,48,190,s.damage>20000&&x>680?'#493f34':'#a1815e',5);line(c,x+15,333,x+15,479,'#8e7051',2);}line(c,0,382,1000,382,'#70593f',10);
if(s.damage<=30000){oval(c,773,315,14,9,'#e7b584');oval(c,852,315,14,9,'#e7b584');}
if(bored&&s.damage<=30000){line(c,792,281,805,281,'#e7b584',8);line(c,815,281,828,281,'#e7b584',8);line(c,795,283,804,283,'#23282b',3);line(c,817,283,826,283,'#23282b',3);if(Math.sin(visualTime*.6)>.25)oval(c,811,301,7,10,'#805346');else{line(c,795,300,822,300,'#23282b',3);box(c,848,276,17,28,'#677a7d',4);line(c,850,285,860,285,'#bed3c7',2);}}
drawGoo(c,s);
// Gantry and fixed vertical rope.
line(c,215,565,270,80,'#20262a',24);line(c,665,565,610,80,'#20262a',24);line(c,215,565,270,80,'#9aa5a3',13);line(c,665,565,610,80,'#9aa5a3',13);line(c,267,80,613,80,'#20262a',24);line(c,267,80,613,80,'#9aa5a3',13);oval(c,440,84,19,19,'#d4a85d');const geometry=immersionGeometry(s.depth,s.fill,s.setup.mass);const by=geometry.center;line(c,440,100,440,by-77,'#dfc599',5);line(c,260,160,260,278,'#dfc599',4);oval(c,248,278,26,26,'#bd8c59');const hx=248+Math.cos(crankAngle)*39,hy=278+Math.sin(crankAngle)*39;line(c,248,278,hx,hy,'#20262a',8);oval(c,hx,hy,11,11,'#ffd267');
// Pot silhouette, bird, translucent cutaway, then fluid surface.
oval(c,440,580,196,27,'#35443b');box(c,291,358,298,192,'#6a8288',26);box(c,264,377,27,45,'#8ba0a2');box(c,589,377,27,45,'#8ba0a2');bird(c,440,by,.83,s.brown);const surface=geometry.surface;c.save();c.beginPath();c.roundRect(299,365,282,177,18);c.clip();c.globalAlpha=.68;c.fillStyle=fluid.color;c.fillRect(299,surface,282,190);c.globalAlpha=1;line(c,299,surface,581,surface,fluid.color,5);for(let i=0;i<Math.min(65,s.chaos*18);i++){const phase=(visualTime*(1+i%4*.2)+i*1.73)%2;oval(c,310+(i*43)%263,surface+140-phase*85,3+i%5,3+i%5,fluid.color);}c.restore();line(c,300,365,580,365,'#c3d0ce',7);line(c,307,374,307,524,'#b3cbcb',3);for(let i=0;i<4;i++){line(c,552,398+i*37,570,398+i*37,'#d2dddd',2);}
box(c,329,551,222,18,'#242a2b');line(c,349,570,331,605,'#242a2b',9);line(c,531,570,549,605,'#242a2b',9);for(let i=0;i<7;i++){const h=13+Math.sin(visualTime*9+i)*6;shape(c,'#f6ba58',()=>{c.moveTo(366+i*23,554);c.quadraticCurveTo(361+i*23,543,373+i*23,554-h);c.quadraticCurveTo(390+i*23,547,382+i*23,554);});}
drawRunoff(c,s,fluid,visualTime);drawVapor(c,s,fluid,surface,visualTime);for(let i=0;i<s.chaos*12;i++){const p=(visualTime*.8+i*.123)%1;const side=i%2?1:-1;oval(c,440+side*(80+p*190),surface-Math.sin(p*Math.PI)*(70+s.chaos*26)+p*70,4+i%4,6+i%5,fluid.color);}
for(let i=0;i<Math.ceil(s.fire*32);i++){const x=280+(i*71)%420;const base=580-(i%4)*17;const h=(35+Math.sin(visualTime*8+i)*15)*s.fire;shape(c,i%2?'#ffbc50':'#f16c3c',()=>{c.moveTo(x-15,base);c.quadraticCurveTo(x-28,base-h*.4,x+3,base-h);c.quadraticCurveTo(x+29,base-h*.2,x+15,base);});}}
// Map each modeled cell to a visible food color; reused for both exposed cut faces.
function meatColor(cell){return cell.ice>0||cell.t<0?'#a9dfed':cell.t<55?'#df9f9e':cell.t<68?'#ecc0ae':cell.t<90?'#f3dfb4':cell.t<120?'#c7a27a':'#795c43';}
// Paint a quantized cross-section, clipped to a breast-shaped ellipse at the requested position.
function cutFace(c,s,x,y,rx,ry){
 oval(c,x,y,rx+7,ry+7,s.brown>2?'#594132':'#bf7c3c');
 c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();c.fillStyle='#e8bc8c';c.fillRect(x-rx,y-ry,rx*2,ry*2);
 for(const cell of s.cells){c.fillStyle=meatColor(cell);c.fillRect(x+(cell.x-9)*rx/8-rx/16,y+(cell.y-9)*ry/9-ry/18,rx/8+1,ry/9+1);}c.restore();
}
// Stage a whole turkey, descending knife, then sliding slice. Progress is normalized wall time.
// No simulation is changed; the exposed faces use the completed run's actual tissue grid.
export function drawCarving(c,s,progress=1){
 c.clearRect(0,0,1000,560);
 const wall=c.createLinearGradient(0,0,0,400);wall.addColorStop(0,'#354747');wall.addColorStop(1,'#53615a');c.fillStyle=wall;c.fillRect(0,0,1000,560);
 // Dining-room window and afternoon light.
 box(c,70,38,180,150,'#a7c9cb',5);line(c,160,40,160,185,'#ddccb0',8);line(c,72,112,248,112,'#ddccb0',8);
 c.fillStyle='#a47b54';c.fillRect(0,330,1000,230);for(let y=350;y<560;y+=55)line(c,0,y,1000,y,'#8d6748',2);
 shape(c,'#b98f63',()=>{c.moveTo(200,330);c.lineTo(570,560);c.lineTo(920,560);c.lineTo(450,330);},null);
 oval(c,510,385,325,81,'#6d513b');oval(c,500,358,330,94,'#b8c6bb');oval(c,500,350,300,76,'#e3e2cb');
 const cut=Math.max(0,Math.min(1,(progress-.22)/.35));const slide=Math.max(0,Math.min(1,(progress-.62)/.28));const eased=slide*slide*(3-2*slide);
 // The intact body has wings, drumsticks, highlights and a roast silhouette.
 bird(c,440,282,1.1,s.brown);
 const skin=s.brown>2?'#594132':s.brown>.6?'#b87539':'#dca16a';
 shape(c,skin,()=>{c.moveTo(350,345);c.bezierCurveTo(280,230,350,172,461,182);c.bezierCurveTo(560,176,619,234,594,333);c.bezierCurveTo(530,370,413,369,350,345);});
 line(c,370,230,404,210,s.brown>2?'#77553b':'#efbf84',7);
 // Foreground wing and drumstick keep the whole roast recognizable on the platter.
 oval(c,369,302,44,25,skin);
 c.save();c.translate(452,340);c.rotate(-.45);oval(c,0,0,30,43,skin);line(c,0,34,0,66,'#efdfbb',14);oval(c,-5,69,10,7,'#efdfbb');oval(c,7,69,10,7,'#efdfbb');c.restore();
 // The slice starts flush; separation exposes the body and a matching cut surface.
 if(slide>0){cutFace(c,s,568,280,61,80);c.save();c.translate(44*eased,11*eased);cutFace(c,s,610+86*eased,280,56,75);c.restore();}
 else{oval(c,588,280,64,84,skin);line(c,618,247,626,274,s.brown>2?'#77553b':'#efbf84',5);}
 // A knife enters above the seam, saws downward, then withdraws before the slice moves.
 if(progress>=.18&&progress<.68){const lift=progress>.57?(progress-.57)/.11:0;const knifeY=115+cut*204-lift*340;const saw=Math.sin(cut*35)*9;c.save();c.translate(566+saw,knifeY);c.rotate(-.18);shape(c,'#dce6df',()=>{c.moveTo(-8,-125);c.lineTo(15,-125);c.lineTo(15,0);c.quadraticCurveTo(-6,11,-8,-14);});line(c,-4,-112,-4,-20,'#ffffff',2);box(c,-12,-181,31,60,'#785740',5);oval(c,3,-157,3,3,'#d0b992');c.restore();}
 if(progress>.4&&slide===0)line(c,566,203,566,203+cut*139,'#765236',3);
}
