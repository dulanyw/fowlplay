# Fowl Play

A dependency-free cartoon turkey cooking sandbox. All simulation, audio, saved discoveries, replay decoding, and image export run in the browser.

## Run

With Node.js 22 or newer, run `npm start` and open http://localhost:41783. No install step is needed. Run `npm test` for simulation checks. Any static server can also serve the project.

## Play

Choose preparation, fluid, size, fill, and heat. Start the experiment, lower the hoist with its slider, adjust heat, and choose when to serve. Pause and speed controls affect simulation time. The cutaway shows immersion, not the hidden interior. Carving reveals the modeled center slice. Catastrophic damage, inactivity, or the one-hour simulated limit ends a run.

## Publish to GitHub Pages

Push this repository to GitHub. In Settings → Pages, select deployment from the main branch and root directory. No build or backend is required. Share links use the deployed page URL and encode a versioned setup and input recording in the fragment. Localhost links are not publicly accessible; Bluesky sharing is disabled there with an explanation. The Bluesky composer accepts text and replay links; attach the downloaded incident card manually. Very long recordings can exceed practical URL or post length limits.

## Model and limitations

`src/sim.js` owns configuration and fixed-step simulation. A 19×19 elliptical center slice models neighboring heat transfer, simplified ice melting, cooking exposure, and drying. Displaced volume depends on size and immersion. Fluid properties drive heat transfer, overflow, bubbling, and ignition thresholds. This is a game approximation, not validated cooking, chemical, or fire guidance. It does not model a full 3D bird. Replay format v1 targets the same simulation version; future model changes need version retention or migration.

`src/art.js` draws original procedural illustrations. `src/game.js` owns UI, orchestration, sharing and local persistence. `tools/serve.mjs` serves local assets at the approved port. No analytics, external fonts, image assets, runtime packages, or account credentials are used. Sound is off by default. Native labeled controls support keyboard and touch; the animated canvas has a descriptive accessible label and live status text, but is not a complete nonvisual game experience.

All artwork and code were created for this project. A distribution license has not yet been selected.
