# PA3 AR floor speaker preview

Tair Asset · AIB-2401 · Student ID 242458

The application previews a one-metre floor speaker on a real surface. It uses Three.js **0.186.1**, a hand-written WebXR session lifecycle and native hit testing. Open `index.html` through a server, not by double-clicking the file.

Live HTTPS preview: **https://tairasset.github.io/pa1-webgl-shapes/**. The site is published from `gh-pages`; the complete PA3 project and its history are in `pa3-ar-speaker`. Desktop/iPhone preview is not an accepted device demo.

## Personal variant

Read 2458 from the right: **8, 5, 4, 2**.

| Rule | Calculation | Behaviour |
| --- | --- | --- |
| Product | Last digit 8 | Floor speaker, 0.25 W × 0.30 D × 1.00 H metres |
| Placement | 5 mod 2 = 1 | Single; each valid tap replaces the placement |
| Surface | 4 mod 3 = 1 | Maximum tilt 12 degrees |
| Facing | 2 mod 2 = 0 | Local +Z front faces the viewer at placement, yaw only |

The cabinet, baffle, driver surrounds, driver membranes and badge are primitives inside one `THREE.Group`. Its origin is the centre of the base. `Box3` verifies the full geometry; the measured code bounds are approximately **[0.25, 1.00, 0.300000005]** metres. This is a geometry check, not a real-world scale measurement.

## Run on a computer

From this `pa3` directory run:

```text
python -m http.server 8767 --bind 127.0.0.1
```

Open `http://localhost:8767/`. The desktop preview can rotate. An unsupported browser shows a visible explanation and disables START AR. Internet access is required for the pinned CDN module. No build step and no model assets are needed.

## Run on Android

For the published page, use the HTTPS link above in Chrome on an ARCore-compatible Android device with Google Play Services for AR. USB debugging, ADB and a local server are not needed for this hosted route. Record the actual device, OS and browser versions.

For local development instead, enable USB debugging, connect the device and allow the computer. Use Chrome's `chrome://inspect/#devices` port forwarding: map device port **8767** to **localhost:8767**, or run:

```text
adb reverse tcp:8767 tcp:8767
```

Open `http://localhost:8767/` in phone Chrome, grant the requested AR permission and press START AR. A local-network HTTP address such as `http://192.168...` is not a secure context. HTTPS hosting is an alternative. Do not bypass certificate warnings.

For GitHub Pages, publish this folder on the repository's chosen Pages branch. The import map already pins `three@0.186.1`; do not commit `node_modules`. The repository's existing PA1 page remains in its root.

## Device record and verification limits

The application was tested on a friend's Android phone, available for about one hour. The student's own phone is an iPhone, which is unsupported under this assignment's device rules. Limited device access prevented completion of all measurements and the continuous demo. The student also reported lag, delayed responses and difficulty capturing some actions; no diagnosis attributes these issues specifically to the device, browser or application. Actual sessions, placements, anchor creation, Clear and session end are recorded in the supplied JSON. Screenshots show anchors on and off. The user-agent reports Chrome 152.0.0.0; the exact model and actual OS version were not recorded. The token "Android 10; K" is not treated as a verified device specification. Device console errors were not checked. No continuous demo.mp4 was supplied. The assignment excludes iPhone Safari and a desktop emulator from the final device demo.

Development checks cover loading, preview, fallback, geometry and simulated lifecycle/placement logic. The final field report separately uses real evidence: same-session pose captures, a saved downward-normal hit, two labelled new-session surface trials and screenshots. Physical height and centimetre drift remain unmeasured. See writeup.pdf for the results and limitations.

## Controls and evidence

START AR requests `requiredFeatures: ['hit-test']`, normally with `optionalFeatures: ['anchors', 'dom-overlay']`. STOP ends the session. The system back gesture follows the same `end` cleanup. The status panel displays ID/variant, session, tracking, reticle/angle, anchors, count and overlay support. Clear removes every product and deletes resolved anchors. `beforexrselect` stops panel interactions from also placing a product.

`select` on `renderer.xr.getController(0)` only sets a flag. The next XR frame validates tracking and the current hit, then performs placement. A rejected request is consumed immediately; it cannot unexpectedly place later. Missing or emulated viewer position hides the reticle and blocks placement.

`visibilitychange` also handles interruptions that do not produce animation frames. Hidden or blurred sessions immediately hide spatial content, discard pending placement/capture requests and pause interaction without querying poses. Returning to visible enters `recovering`: the first fresh, non-emulated viewer pose and hit display a new reticle; placement requires a subsequent tap. Existing anchors are retained during a pause. Interrupted surface trials are logged as interrupted, never as search latency. STOP uses the same input reset; if it fails, the session must reacquire tracking before placement resumes. End/visibility callbacks and asynchronous reference-space results from an old session cannot mutate a newer session.

Live-check changes to SETTINGS update the displayed threshold, placement mode, count limit and facing rule after reload. The product remains the speaker assigned to 242458.

Capture pose records the camera in local space and the same hit in viewer and local spaces, including the 16 matrix elements, normal column and tilt. Download evidence JSON after leaving AR. Coordinates remain on the device until the user downloads/shares them. Camera frames are neither requested as raw images nor uploaded.

Choose the E4 surface **before START AR**. A fresh session automatically measures from source readiness to its first hit, with a 20-second timeout. PA3 requires three different surfaces; three trials per surface are recommended, not an extra course requirement. The timeout is our measurement protocol. A fresh session does not prove the device discarded an existing room map. The overlay timing controls are for explicit additional trials; do not present already-tracked repeated hits as cold-start measurements. Export before any page reload: the in-memory journal survives STOP/START but not reload.

For the E2 comparison, uncheck "Request anchors for the next session" before starting a fresh session. Only this explicit experiment omits anchors from the optional-feature request. Normal mode uses anchors whenever they appear in `session.enabledFeatures`. If unavailable, the page displays `anchors: off` and retains the placement matrix. When anchor creation itself fails, that placement is removed and an explanatory message is shown.

## Porting notes

1. **Renderer constructor.** Use a WebGL 2 context and pass the options object `new THREE.WebGLRenderer({ canvas, context: gl, alpha: true })`. The supplied Ch. 7 PDF p. 5 already uses the options object correctly; its p. 4 creates a legacy `webgl` context, which must become WebGL 2 for this release. Do not attribute a `WebGLRenderer(gl)` listing to that PDF. Create the context with `canvas.getContext('webgl2', { xrCompatible: true, alpha: true })` and check for null.
2. **Geometry names.** Use `RingGeometry`, `BoxGeometry` and `CylinderGeometry`. Old `*BufferGeometry` constructor aliases from the book are no longer exported. Modern geometries already derive from `BufferGeometry`. Rotate the ring's geometry into the XZ plane; its object matrix then receives the unmodified hit pose.
3. **Hit-test source lifetime.** Request the viewer reference space and a single hit-test source once in `onSessionStarted`, outside the frame loop. Frames call `getHitTestResults(source)` only. Cancel the source on end. A generation token also cancels a source that resolves after its session has already ended.

## Reference spaces and anchors

The viewer-space ray follows the device. Hit poses are read in local space so the model and camera share one scene coordinate system. Surface normal = matrix elements `[4, 5, 6]`; position = `[12, 13, 14]` in the column-major array. Tilt is `acos(n.y / length(n))` in degrees with a clamped cosine.

For the face-user rule, yaw = `atan2(viewer.x - hit.x, viewer.z - hit.z)`. The relative rotation offset is `inverse(R_hit) * R_yaw`; updating `M_anchor * R_offset` follows the anchor without losing the chosen facing. The keep-hit-orientation variant uses an identity offset. Anchor tracking may refine orientation afterwards; facing is chosen at placement, not billboarded continuously.

Every moved/removed object deletes its old anchor. An anchor promise resolving after Clear, replacement or end is deleted immediately. A temporarily unlocatable anchor hides its product until its pose returns. Anchors improve attachment as mapping changes; they do not guarantee zero drift or persistence after session end.

## E2 source inspection

Line numbers refer to the actual npm **0.186.1** file, which differs from the r186 tag:

`https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webxr/WebXRManager.js`

- `setSession`: line 410 onward.
- `makeXRCompatible`: lines 427–431.
- `XRWebGLLayer` creation and base-layer update: lines 451–453; the alternative projection layer is created/configured at 496–498.
- Requesting the configured reference space: lines 525–526.
- Attaching/starting the XR animation context: lines 528–529.

The supplied Ch. 7 PDF pp. 9–11 calls these the three critical tasks: (1) GL compatibility and XR layer setup, (2) `setReferenceSpaceType`, (3) `setSession`. Its slide 9 groups the same operations differently. `setSession` handles task 1; task 2 remains our explicit `setReferenceSpaceType('local')` call (setter at 311–315, default `local-floor` at line 45). It requests the selected type at 525–526; it does not choose `local` for us. Task 3 is our awaited `setSession(session)` call. A separate book-style `setupWebGLLayer()` would duplicate the layer setup and is unnecessary.

## Checks

Optional development dependencies are pinned in `package.json`. After `npm install`, run `npm test`. The suite uses real Three.js geometry and simulated XR frames. Simulations exercise tilt boundaries, four facing directions, tracking loss, emulated position, rejected taps, single-mode replacement, anchor deletion, pending asynchronous cleanup, source cancellation and restart. They are not device experiment results.

The current suite has 28 application tests. Run `python tools/test_measurements.py` for nine additional structural evidence-validation checks. The validator rejects empty device fields, invalid coordinates/matrices, a missing E3 placement matrix, non-finite measurements, repeated surface names and missing/outside-project screenshot paths. E1 uses paired `hit_viewer_matrix` / `hit_local_matrix` from one capture; E3 uses `placement_hit_matrix` from an actual `placement` event. Structure checks cannot authenticate a measurement or screenshot. The packaging tool uses the validator. The submitted report has 1,196 words including page footers; its E6 section is within the separate 150-word limit.

The report is `writeup.pdf`. Original selected photos, four JSON exports and provenance are in `evidence/`. Export-2 is included in export-3; it is not an independent repeat.

`tools/package.ps1` remains strict by default. At the user's explicit request to finalize without further recordings, `tools/package.ps1 -AllowIncompleteEvidence` creates the named available-evidence archive. Limitations are documented in writeup.pdf; no separate limitations notice is added. No fake demo.mp4 is generated. The missing video and experiments can affect the grade; this archive is not described as full compliance.

## Submission state

The working branch is `pa3-ar-speaker`. PA3 development spans 27 and 28 October 2026: the second day's substantive change adds session-interruption recovery and the associated regression checks. Verify the actual history with `git log --format="%h %cI %s" -- pa3`; do not change commit dates. The deadline is **28 October 2026, 22:00 Asia/Qyzylorda (Astana time)**. PA3 requires `index.html`, `index.js`, `README.md`, `writeup.pdf` and `demo.mp4` at the ZIP root. The limited final archive contains exactly index.html, index.js, README.md and writeup.pdf; the video requirement is unmet. The submitted ZIP was generated from commit `68aadb3` on 28 October 2026. Later repository housekeeping removes preparation documents; the submitted app and report remain unchanged. The app HTML/JS match the published version. Add the repository link in Moodle. The course document explicitly prohibits AI-generated code/write-ups; check with the instructor before using this work as assessed individual submission.

## Sources

- Supplied PA3 assignment (variant, Tasks A–E, experiments E1–E6 and submission rules).
- Supplied Baruah Ch. 5 PDF and corresponding 19-slide presentation: Three.js scene, meshes, lights, materials and units.
- Supplied Ch. 6 PDF and corresponding 17-slide presentation: WebXR lifecycle, secure context and device connection.
- Supplied Ch. 7 PDF and corresponding 20-slide presentation: reference spaces, AR lifecycle, hit testing and placement.
- [Pinned WebXRManager source, explicitly required by PA3 E2(c)](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webxr/WebXRManager.js).

No new external research was used for the lecture audit. Detailed VIO internals and a full privacy model of every WebXR extension are not supplied by these chapters. The report confines those explanations to the concepts named by E4 and the data actually read by this implementation.
