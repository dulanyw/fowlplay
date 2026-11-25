// Shared illustration-space geometry: the thermal grid covers the breast, not decorative bones.
export const GEOMETRY={birdStart:215,hoistTravel:240,birdRadius:79*.83,potBottom:542,fluidHeight:176,maxFill:.96,volumePerKg:.045};

// Resolve displaced volume and surface height together. A submerged spherical-cap approximation
// gives a continuous volume fraction; bisection avoids oscillating when displacement raises the surface.
// Returns geometry only; no mutation, heat transfer, or buoyancy policy is applied here.
export function immersionGeometry(depth,fill,mass){
 const g=GEOMETRY,center=g.birdStart+depth*g.hoistTravel;
 const fractionAt=surface=>{const h=Math.max(0,Math.min(1,(center+g.birdRadius-surface)/(2*g.birdRadius)));return h*h*(3-2*h);};
 let low=g.potBottom-g.maxFill*g.fluidHeight,high=g.potBottom;
 for(let i=0;i<32;i++){const middle=(low+high)/2;const target=g.potBottom-Math.min(g.maxFill,fill+fractionAt(middle)*mass*g.volumePerKg)*g.fluidHeight;if(middle<target)low=middle;else high=middle;}
 const surface=(low+high)/2,submerged=fractionAt(surface);
 return{center,surface,submerged,level:fill+submerged*mass*g.volumePerKg,top:center-g.birdRadius,bottom:center+g.birdRadius};
}

// Test a thermal cell at the same vertical location painted in the backyard breast silhouette.
export function cellIsImmersed(cell,geometry,gridSize){return geometry.top+(cell.y/(gridSize-1))*(geometry.bottom-geometry.top)>=geometry.surface;}
