import {FLUIDS,carvingDetails} from './sim.js';

// Outcome rules are shared by the achievement shelf and end-of-round evaluation.
export const ACHIEVEMENTS=[
 {id:'thanksgiving',name:'Against All Odds',description:'Score 80+ dinner with less than $100 damage.',matches:(s,r)=>r.score>=80&&r.damage<100},
 {id:'deck',name:'Dinner Saved, Deck Lost',description:'Score 65+ dinner and cause $10,000+ damage.',matches:(s,r)=>r.score>=65&&r.damage>=10000},
 {id:'insurance',name:'Act of Poultry',description:'Run up a $50,000 repair bill.',matches:(s,r)=>r.damage>=50000},
 {id:'glacier',name:'Baked Alaska',description:'Cook 75% of the outside while the center stays frozen.',matches:(s,r,d)=>d.outside.percent>=75&&d.inside.label==='Still frozen'},
 {id:'crouton',name:'The Largest Crouton',description:'Overcook an edible bird to an average of 110°C or more.',matches:s=>FLUIDS[s.setup.fluid].edible&&s.cells.reduce((a,c)=>a+c.t,0)/s.cells.length>=110},
 {id:'forbidden',name:'Forbidden Fondue',description:'Cook 50% of the outside in an inedible fluid.',matches:(s,r,d)=>!FLUIDS[s.setup.fluid].edible&&d.outside.percent>=50}
];

// Return all earned IDs for a completed run. Pure: storage and UI remain the caller's responsibility.
export function earnedAchievements(state,report){const details=carvingDetails(state);return ACHIEVEMENTS.filter(a=>a.matches(state,report,details)).map(a=>a.id);}
