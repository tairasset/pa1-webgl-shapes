# FIELD / 2458 - PA4 science laboratory

Tair Asset / AIB-2401 / student ID 242458.

Source: https://github.com/tairasset/pa1-webgl-shapes/tree/pa4-science-lab/pa4

Live scene: https://tairasset.github.io/pa1-webgl-shapes/pa4/

Variant: x2458-; science lab (8), pulse (5 % 3 = 2), gaze fuse 1.5 seconds (4 % 2 = 0), six exhibits on a 4 m ring (2 % 2 = 0).

## Run
Serve this folder: `python -m http.server 8768 --bind 127.0.0.1`, then open http://localhost:8768/. Internet is needed for the pinned core A-Frame 1.8.0 and the default text font. No community components, add-ons or model files are used. components.js follows A-Frame in the head.

## Controls
WASD: desktop movement. Drag the mouse: look. Hold the centre gaze ring on an exhibit for 1.5 seconds: select; repeat to deselect. M: pause/resume exhibit motion. X: remove selected exhibit. Enter VR: headset or Immersive Web Emulator; the gaze ring follows the head. WASD is removed in VR to avoid smooth artificial locomotion. Show/hide stats displays actual performance. Download lifecycle log exports timestamped events.

## Textures and licences
All three 512 x 512 PNG images in textures/ are original procedural patterns authored for this project, dedicated under CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/. No third-party image is incorporated. floor-grid.png: laboratory floor tiles, repeated 16 x 16. brushed-alloy.png: brushed panel. ceramic.png: pedestal ceramic. Generation provenance is retained outside the submission.

## Components
x2458-motion: typed configuration, base transforms, phase-continuous period changes and decaying offsets for amplitude/type updates; local time freezes while paused. x2458-texture: configuration-only schema, safe mesh attachment, source-specific loading, owned texture/material cleanup and original material restoration. x2458-exhibit: events-map hover, gaze click, selection panel, motion changes through setAttribute. x2458-gallery: registration, single selection, M/X, live counts and experiment helpers.

## Experiment helpers
`PA4.gallery().addStress(60)` adds real exhibit entities; `clearStress()` removes them. `PA4.measure(5)` returns measured requestAnimationFrame FPS and renderer counters, including the renderer and browser context in the evidence record. `PA4.gallery().setBatchMode(true)` groups compatible meshes into Three.js InstancedMesh objects; false restores original meshes. This optimization is for the E5 comparison; normal interaction tests use unbatched objects. `PA4.filter('chapter'|'defaults'|'chosen')` reproduces the supplied Chapter 8 filter settings or applies the comparison settings. The intentionally misspelled chapter maxFilter exists only in that explicit experiment.

## Sources
Supplied PA4 assignment; supplied Baruah Chapter 8 PDF and its 17-slide presentation. A-Frame 1.8.0 source is inspected where E4 requires it. Experiment results and completion status are recorded separately; no measurements are inferred from code alone.

## Verified observations
Seventeen runtime checks passed in Chrome 156 on this laptop's Intel UHD graphics. Over three-second samples at 1440 x 900: six exhibits 59.67 FPS / 20 calls / 15,316 triangles; 66 exhibits 48 FPS / 380 calls / 250,518 triangles; instanced 66 exhibits 55.02 FPS / 77 calls / 254,578 triangles. The write-up includes the original captures and explanations; these are measurements, not guaranteed rates.

The official Immersive Web Emulator 2.0 was tested in a separate profile: immersive-vr was supported, renderer.xr.isPresenting became true, and the gaze dwell selected an exhibit. Enable the emulator for the site before loading the scene. If the emulator initializes after A-Frame, reload once after it is ready. Ordinary fullscreen is not proof of an XR session. demo.mp4 is a 77.8-second continuous automated browser recording; desktop movement uses actual keyboard input and selection uses the real fuse timer. The VR segment uses the emulator's virtual head pose. No physical-headset test is claimed.

The write-up contains 1,135 words including captions and page footers; E6 contains 120 words. Three supplied textures are 512 x 512. No unprefixed custom component, community add-on, model file or synthetic device measurement is included. Preparation notes and test-browser profiles stay outside this project.
