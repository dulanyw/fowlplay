# Fowl Play

A dependency-free cartoon turkey cooking sandbox. All simulation, audio, saved achievements, replay decoding, and image export run in the browser.

## Run

With Node.js 22 or newer, run `npm start` and open http://localhost:41783. No install step is needed. Run `npm test` for simulation checks. Any static server can also serve the project.

## Play

Play opens setup: choose preparation, fluid, size, fill, and starting heat. Ready to cook opens the backyard. Turn the illustrated crank clockwise to lower or counterclockwise to raise (touch/mouse drag; arrow keys when focused), adjust the live burner target, and choose when to serve. Pause and speed controls affect simulation time. The cutaway shows immersion, not the hidden interior. A separate carving screen shows the whole turkey on a dining table, a knife stroke, and a sliding slice that reveals the modeled center. After the animation, Score me! opens the final verdict and sharing screen. Players may inspect the cut indefinitely. Retry setup starts a fresh round with the same initial choices; New experiment returns to setup. Catastrophic damage, inactivity, or the one-hour simulated limit ends a run.

## Publish to GitHub Pages

Push this repository to GitHub. In Settings → Pages, select deployment from the main branch and root directory. No build or backend is required. Share links use the deployed page URL and encode a versioned setup and input recording in the fragment. Localhost links are not publicly accessible; Bluesky sharing is disabled there with an explanation. The Bluesky composer accepts text and replay links; attach the downloaded incident card manually. Very long recordings can exceed practical URL or post length limits.

## Model and limitations

`src/sim.js` owns configuration and fixed-step simulation. A 19×19 elliptical center slice models neighboring heat transfer, simplified ice melting, cooking exposure, and drying. Displaced volume depends on size and immersion. Fluid properties drive heat transfer, overflow, bubbling, and ignition thresholds. This is a game approximation, not validated cooking, chemical, or fire guidance. It does not model a full 3D bird. Replay format v1 targets the same simulation version; future model changes need version retention or migration.

`src/art.js` draws original procedural illustrations. `src/game.js` owns UI, orchestration, sharing and local persistence. `tools/serve.mjs` serves local assets at the approved port. No analytics, external fonts, image assets, runtime packages, or account credentials are used. Six outcome achievements are stored locally; replay viewing does not unlock trophies. Sound is off by default. Native labeled controls support keyboard and touch; the animated canvas has a descriptive accessible label and live status text, but is not a complete nonvisual game experience.

All artwork and code were created for this project. A distribution license has not yet been selected.

Simulation v2 shares the same turkey/fluid geometry between drawing and heat transfer. Only cells below the visible liquid surface receive liquid heat. Air exchange uses ambient 22°C; hot plumes, steam convection, radiation, and fire-to-meat heating are not modeled. Older v1 replay links are not replayed under the changed model. `src/geometry.js` owns immersion and displacement geometry.

Simulation v3 adds measured overflow streams, finite spilled fuel, evaporation and cooling, quiet-time neighbor reactions, and persistent goo growth over the fence. All use fixed simulation time, so pause and speed controls apply consistently. `src/effects.js` owns these rates and state transitions. Evaporation removes liquid without immersion; the resulting vapor is visual and does not heat the turkey. Replay links must match the current simulation version (v3).

## Social preview

The static `assets/social-preview.png` is a 1200×630 PNG used by Open Graph and large-image Twitter cards. Metadata uses the public `https://dulanyw.github.io/fowlplay/` URL. Push both the HTML and asset for previews to work; social services may cache older cards. Rebuild the original illustrated card on Windows with `powershell -NoProfile -File tools/New-SocialCard.ps1`. Update the canonical, Open Graph, and Twitter URLs if the hosting address changes.
