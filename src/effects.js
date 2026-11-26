// Game-time fluid effects. Rates are gameplay approximations in fill-fraction per second.
export const EFFECTS={evaporationRate:.003,spillRate:.7,fuelBurnRate:.0003,creepRate:.018,boredAfter:8,gooContact:.74,alienRate:1/25};
export const GOO_PATH=[[590,599],[660,578],[715,534],[738,490],[735,430],[744,367],[741,313],[783,302],[833,310],[870,350]];

// Advance loss, vapor, runoff and spill-fueled flame state. Mutates the provided run only.
// Geometry is shared with the renderer; hot fluid can evaporate even without a turkey in it.
export function updateFluidEffects(s,fluid,geometry,control,dt,reaction,plunge){
 const hot=s.fill>0&&s.temp>=fluid.boil-1;
 const targetVapor=hot?Math.min(3,.18+Math.max(0,s.temp-fluid.boil)/60+Math.max(0,control.heat-fluid.boil)/500):0;
 s.vapor+=(targetVapor-s.vapor)*Math.min(1,dt*2);
 const evaporation=Math.min(s.fill,s.vapor*EFFECTS.evaporationRate*dt);
 const surge=geometry.submerged>0?(reaction*.025+Math.min(2,plunge)*.035):0;
 const overflow=Math.max(0,geometry.level+surge-.96);
 const spilled=Math.min(Math.max(0,s.fill-evaporation),overflow*EFFECTS.spillRate*dt);
 s.overflowRate=spilled/dt;s.evaporated+=evaporation;s.fill=Math.max(0,s.fill-spilled-evaporation);s.spill+=spilled;
 s.temp-=evaporation*1100;
 if(fluid.flammable)s.spillFuel+=spilled;
 const ignited=fluid.flammable&&((s.spillFuel>.002&&s.temp>110)||(s.setup.fluid==='alcohol'&&s.vapor>.1));
 s.fire=Math.max(0,Math.min(1.5,s.fire+dt*(ignited?.025+s.chaos*.008:-.035)));
 s.spillFuel=Math.max(0,s.spillFuel-s.fire*EFFECTS.fuelBurnRate*dt);
 if(s.setup.fluid==='goo'&&s.spill>.002)s.gooCreep=Math.min(1,s.gooCreep+dt*EFFECTS.creepRate);
 // Contact at the neighbor's fence hand starts a permanent, gradual transformation.
 if(s.setup.fluid==='goo'&&s.gooCreep>=EFFECTS.gooContact&&s.damage<=30000)s.neighborTouched=true;
 if(s.neighborTouched)s.alienProgress=Math.min(1,s.alienProgress+dt*EFFECTS.alienRate);
 const visibleAction=s.chaos>.15||s.fire>.05||s.vapor>.15||s.overflowRate>.0001||plunge>.01||s.gooCreep>0;
 s.quietTime=visibleAction?0:s.quietTime+dt;
 return{overflow};
}
