// All lengths are metres. Product front is local +Z.
export const STUDENT_ID = '242458';
export function variantFromId(id) {
  if (!/^\d{4,}$/.test(id)) throw new Error('Student ID needs at least four digits.');
  const d = [...id.slice(-4)].map(Number);
  return { product: d[3], mode: d[2] % 2 ? 'single' : 'multi',
    tolerance: [8, 12, 16][d[1] % 3], facesUser: d[0] % 2 === 0 };
}
export const VARIANT = variantFromId(STUDENT_ID);
// Change these constants for the live code check; keep the submitted variant above.
export const SETTINGS = { mode: VARIANT.mode, tolerance: VARIANT.tolerance,
  facesUser: VARIANT.facesUser, capacity: 5, faceAway: false };
export function tiltDegrees(matrix) {
  const length = Math.hypot(matrix[4], matrix[5], matrix[6]);
  if (!Number.isFinite(length) || length === 0) return 180;
  return Math.acos(Math.min(1, Math.max(-1, matrix[5] / length))) * 180 / Math.PI;
}
export function facingYaw(position, viewer, away = false) {
  return Math.atan2(viewer.x - position.x, viewer.z - position.z) + (away ? Math.PI : 0);
}
export function acceptsTilt(angle, tolerance = SETTINGS.tolerance) {
  return Number.isFinite(angle) && angle <= tolerance + 1e-7;
}

let THREE;
export function buildProduct(library = THREE) {
  const T = library;
  const product = new T.Group();
  product.name = 'Floor speaker 242458';
  const cabinet = new T.MeshStandardMaterial({ color: 0x5b3d2c, roughness: 0.82 });
  const baffle = new T.MeshStandardMaterial({ color: 0x252823, roughness: 0.92 });
  const surround = new T.MeshStandardMaterial({ color: 0x343832, roughness: 0.86 });
  const cone = new T.MeshStandardMaterial({ color: 0xb6ac94, roughness: 0.67, metalness: 0.12 });
  const mesh = (geometry, material, x, y, z) => {
    const m = new T.Mesh(geometry, material); m.position.set(x, y, z); product.add(m); return m;
  };
  // Cabinet back is z=-0.15; frontmost driver is z=+0.15. Base y=0.
  mesh(new T.BoxGeometry(0.25, 1, 0.284), cabinet, 0, 0.5, -0.008);
  mesh(new T.BoxGeometry(0.226, 0.974, 0.006), baffle, 0, 0.5, 0.137);
  for (const [height, radius] of [[0.68, 0.087], [0.31, 0.087]]) {
    const driver = mesh(new T.CylinderGeometry(radius, radius, 0.006, 64), surround, 0, height, 0.144);
    driver.rotation.x = Math.PI / 2;
    const centre = mesh(new T.CylinderGeometry(radius * 0.72, radius * 0.72, 0.003, 48), cone, 0, height, 0.1485);
    centre.rotation.x = Math.PI / 2;
  }
  mesh(new T.BoxGeometry(0.04, 0.008, 0.002), cone, 0, 0.92, 0.142);
  product.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(product);
  const size = bounds.getSize(new T.Vector3());
  console.info('[PA3] product bounding box metres', size.toArray());
  if (Math.abs(size.x - .25) > .02 || Math.abs(size.y - 1) > .02 || Math.abs(size.z - .30) > .02 || Math.abs(bounds.min.y) > 1e-6) {
    throw new Error('Product dimensions or base origin are outside the variant specification.');
  }
  return product;
}

// Browser state is deliberately separate from the pure geometry and variant functions.
let scene, camera, renderer, controller, reticle, productTemplate;
let xrSession = null, localSpace = null, viewerSpace = null, hitTestSource = null;
let placeRequested = false, captureRequested = false, tracked = false;
let anchorsOn = false, lastAngle = null, sessionState = 'idle';
let generation = 0, currentHit = null, surfaceTrial = null, firstPoseLogged = false;
let previewRenderer, previewScene, previewCamera, previewProduct, previewTime = 0;
let rotating = false;
const placed = [], evidence = [];
const $ = id => document.getElementById(id);
const identity = { studentId: STUDENT_ID, variant: VARIANT, threeVersion: '0.186.1' };

function record(type, data = {}) {
  const row = { event: type, at: new Date().toISOString(), elapsedMs: Math.round(performance.now()), ...data };
  evidence.push(row);
  console.info('[PA3]', type, data);
  $('log').textContent = evidence.slice(-14).map(e => JSON.stringify(e)).join('\n');
}
function message(text) { $('fallback').hidden = !text; $('fallback').textContent = text; }
function setStatus() {
  $('session-status').textContent = sessionState;
  $('tracking-status').textContent = tracked ? 'normal' : 'waiting / lost';
  $('reticle-status').textContent = !reticle?.visible ? 'none' : `${acceptsTilt(lastAngle) ? 'valid' : 'too tilted'} ${lastAngle.toFixed(1)}°`;
  $('reticle-status').style.color = reticle?.visible ? (acceptsTilt(lastAngle) ? '#9fe6a5' : '#ffb4a5') : '#fff';
  $('anchors-status').textContent = anchorsOn ? 'on' : 'off';
  $('count-status').textContent = `${placed.length} / ${SETTINGS.mode === 'single' ? 1 : SETTINGS.capacity}`;
  $('overlay-status').textContent = xrSession?.domOverlayState ? 'on' : 'off';
}
function lights(target) {
  target.add(new THREE.HemisphereLight(0xfff4dc, 0x4c5550, 2.5));
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(1.5, 3, 2); target.add(sun);
}
function loadScene() {
  const canvas = document.createElement('canvas'); canvas.className = 'xr-canvas';
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, xrCompatible: true });
  if (!gl) throw new Error('WebGL 2 is unavailable. Try a current browser with hardware acceleration.');
  // r186 needs WebGL2 and a parameter dictionary, not new WebGLRenderer(gl).
  renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight); renderer.setClearColor(0x000000, 0);
  renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local');
  document.body.append(canvas);
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, .01, 100);
  lights(scene); productTemplate = buildProduct();
  const ring = new THREE.RingGeometry(.075, .095, 64).rotateX(-Math.PI / 2);
  reticle = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0x4ee26c, side: THREE.DoubleSide, depthTest: false }));
  reticle.matrixAutoUpdate = false; reticle.visible = false; reticle.renderOrder = 10; scene.add(reticle);
  controller = renderer.xr.getController(0);
  // XRHitTestResult and XRFrame must be used during the current frame callback.
  controller.addEventListener('select', () => { placeRequested = true; }); scene.add(controller);
  $('overlay').addEventListener('beforexrselect', event => event.preventDefault());
  $('start').addEventListener('click', onRequestSession);
  $('stop').addEventListener('click', endXRSession);
  $('clear').addEventListener('click', () => { clearProducts(); record('clear'); });
  $('capture').addEventListener('click', () => { captureRequested = true; });
  $('export').addEventListener('click', downloadEvidence);
  $('surface-test').addEventListener('click', () => startSurfaceTrial($('surface').value));
  $('xr-surface-test').addEventListener('click', () => startSurfaceTrial($('xr-surface').value));
  renderer.setAnimationLoop(render);
}
function loadPreview() {
  const canvas = $('preview');
  previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  previewRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  previewScene = new THREE.Scene(); lights(previewScene);
  previewCamera = new THREE.PerspectiveCamera(33, 1, .01, 20);
  previewCamera.position.set(1.25, .95, 2.25); previewCamera.lookAt(0, .49, 0);
  previewProduct = productTemplate.clone(true); previewProduct.rotation.y = -.25; previewScene.add(previewProduct);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.15, 96), new THREE.MeshStandardMaterial({ color: 0xd6d2c4, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.001; previewScene.add(ground);
  $('turn').addEventListener('click', () => { rotating = !rotating; $('turn').textContent = rotating ? 'Pause rotation' : 'Rotate preview'; });
  new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    previewCamera.aspect = width / height; previewCamera.updateProjectionMatrix();
    previewRenderer.setSize(width, height, false);
  }).observe(canvas);
}
async function detectSupport() {
  if (!window.isSecureContext) { $('start').textContent = 'HTTPS required'; message('AR needs HTTPS or localhost. Use the secure URL or ADB port forwarding.'); return; }
  if (!navigator.xr) { $('start').textContent = 'AR unavailable'; message('This browser does not expose WebXR immersive AR. On iPhone, use this preview; the required AR demo needs Android with ARCore or Quest 3 / 3S.'); return; }
  try {
    if (!await navigator.xr.isSessionSupported('immersive-ar')) { $('start').textContent = 'AR unavailable'; message('Immersive AR is not supported on this device. Use Android + ARCore + Chrome, or Quest 3 / 3S.'); return; }
    $('start').disabled = false; $('start').textContent = 'START AR'; message('');
  } catch (error) { $('start').textContent = 'AR check failed'; message(`Could not check AR support: ${error.message}`); }
}
async function onRequestSession() {
  if (xrSession || sessionState === 'starting') return;
  sessionState = 'starting'; $('start').disabled = true; $('start').textContent = 'Starting…';
  const optionalFeatures = $('request-anchors').checked ? ['anchors', 'dom-overlay'] : ['dom-overlay'];
  try {
    // Called directly from the button gesture; no ARButton helper.
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'], optionalFeatures, domOverlay: { root: $('overlay') }
    });
    await onSessionStarted(session);
  } catch (error) {
    record('session-error', { name: error.name, message: error.message });
    if (xrSession) { try { await xrSession.end(); } catch { /* Already ended by the system. */ } }
    onSessionEnd(); message(`AR could not start: ${error.message}. Check camera permission, ARCore and HTTPS.`);
  }
}
async function onSessionStarted(session) {
  xrSession = session; const token = ++generation;
  session.addEventListener('end', onSessionEnd, { once: true });
  anchorsOn = Array.from(session.enabledFeatures || []).includes('anchors');
  renderer.xr.setReferenceSpaceType('local');
  await renderer.xr.setSession(session);
  if (token !== generation || xrSession !== session) return;
  localSpace = renderer.xr.getReferenceSpace();
  viewerSpace = await session.requestReferenceSpace('viewer');
  if (token !== generation || xrSession !== session) return;
  // Exactly one request per session, outside the render loop.
  const source = await session.requestHitTestSource({ space: viewerSpace });
  if (token !== generation || xrSession !== session) { source.cancel(); return; }
  hitTestSource = source; sessionState = 'running'; firstPoseLogged = false;
  // E4 timing begins when hit testing is ready, before the first processed frame.
  surfaceTrial = { surface: $('surface').value, started: performance.now() };
  record('surface-trial-start', { surface: surfaceTrial.surface, method: 'first frame after source ready' });
  document.body.classList.add('xr-active'); $('start').textContent = 'AR running';
  $('request-anchors').disabled = true;
  record('session-start', { ...identity, requestedAnchors: $('request-anchors').checked,
    enabledFeatures: Array.from(session.enabledFeatures || []), anchorsOn,
    domOverlay: session.domOverlayState?.type || 'off', userAgent: navigator.userAgent });
  message(session.domOverlayState ? '' : 'DOM overlay unavailable. Use the system back gesture to leave AR.');
  animate(); setStatus();
}
function animate() { renderer.setAnimationLoop(render); }
function startSurfaceTrial(surface) {
  if (!xrSession) { message('Start an AR session before timing a surface trial.'); return; }
  surfaceTrial = { surface, started: performance.now() };
  record('surface-trial-start', { surface });
}
function render(time, frame) {
  if (frame && xrSession && localSpace) {
    currentHit = null; reticle.visible = false; lastAngle = null;
    const viewerPose = frame.getViewerPose(localSpace);
    tracked = !!viewerPose && !viewerPose.emulatedPosition;
    $('tracking-message').textContent = tracked ? 'Aim at a surface. Tap outside this panel to place.' : 'Tracking lost — move the phone slowly';
    if (surfaceTrial && performance.now() - surfaceTrial.started >= 20000) {
      record('surface-trial-timeout', { surface: surfaceTrial.surface, seconds: 20, success: false }); surfaceTrial = null;
    }
    if (tracked && hitTestSource && sessionState === 'running') {
      if (!firstPoseLogged) { record('camera-at-session-start', { position: viewerPose.transform.position.toJSON?.() || vectorJSON(viewerPose.transform.position) }); firstPoseLogged = true; }
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length) {
        const pose = hits[0].getPose(localSpace);
        if (pose) {
          currentHit = hits[0]; reticle.matrix.fromArray(pose.transform.matrix);
          reticle.matrixWorldNeedsUpdate = true; lastAngle = tiltDegrees(pose.transform.matrix);
          reticle.material.color.setHex(acceptsTilt(lastAngle) ? 0x4ee26c : 0xf34e39); reticle.visible = true;
          if (surfaceTrial) {
            record('surface-trial-first-hit', { surface: surfaceTrial.surface, seconds: (performance.now() - surfaceTrial.started) / 1000, tilt: lastAngle, valid: acceptsTilt(lastAngle) });
            surfaceTrial = null;
          }
        }
      }
      if (captureRequested) {
        record('pose-capture', { cameraLocal: vectorJSON(viewerPose.transform.position),
          hitViewer: currentHit ? Array.from(currentHit.getPose(viewerSpace)?.transform.matrix || []) : null,
          hitLocal: currentHit ? Array.from(currentHit.getPose(localSpace)?.transform.matrix || []) : null,
          tilt: lastAngle, normalColumn: currentHit ? Array.from(reticle.matrix.elements.slice(4, 7)) : null });
      }
      if (placeRequested && currentHit && acceptsTilt(lastAngle)) placeProduct(currentHit, viewerPose);
    }
    // Consume the request even after a rejected tap; it must never place later on its own.
    placeRequested = false; captureRequested = false;
    for (const entry of placed) {
      if (!entry.anchor) { entry.object.visible = tracked; continue; }
      const anchorPose = frame.getPose(entry.anchor.anchorSpace, localSpace);
      entry.object.visible = tracked && !!anchorPose;
      if (anchorPose) { entry.object.matrix.fromArray(anchorPose.transform.matrix).multiply(entry.rotationOffset); entry.object.matrixWorldNeedsUpdate = true; }
    }
    setStatus();
  } else if (!xrSession && previewRenderer) {
    if (rotating) previewProduct.rotation.y += Math.min((time - previewTime) / 1000, .05) * .35;
    previewRenderer.render(previewScene, previewCamera);
  }
  previewTime = time;
  if (xrSession) renderer.render(scene, camera);
}
function vectorJSON(v) { return { x: v.x, y: v.y, z: v.z }; }
function placeProduct(hit, viewerPose) {
  const token = generation;
  const poseMatrix = reticle.matrix.clone();
  const position = new THREE.Vector3().setFromMatrixPosition(poseMatrix);
  const hitRotation = new THREE.Quaternion().setFromRotationMatrix(poseMatrix);
  let rotationOffset = new THREE.Matrix4();
  let yaw = null;
  if (SETTINGS.facesUser) {
    yaw = facingYaw(position, viewerPose.transform.position, SETTINGS.faceAway);
    const desiredRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    // M_anchor * inverse(R_hit) * R_yaw: front faces the user without initial pitch/roll.
    rotationOffset.makeRotationFromQuaternion(hitRotation.clone().invert().multiply(desiredRotation));
  }
  const object = productTemplate.clone(true); object.matrixAutoUpdate = false;
  object.matrix.copy(poseMatrix).multiply(rotationOffset); object.matrixWorldNeedsUpdate = true;
  const entry = { object, anchor: null, rotationOffset, yaw, alive: true };
  if (SETTINGS.mode === 'single') clearProducts();
  else if (placed.length >= SETTINGS.capacity) removeEntry(placed[0]);
  placed.push(entry); scene.add(object);
  record('placement', { matrix: Array.from(poseMatrix.elements), position: position.toArray(),
    normal: poseMatrix.elements.slice(4, 7), tilt: lastAngle, yaw, anchorsOn, productCount: placed.length });
  if (anchorsOn) {
    // Invoke createAnchor synchronously inside this frame; resolve it safely later.
    let pending;
    try { pending = hit.createAnchor(); }
    catch (error) { anchorFailed(entry, error); return; }
    Promise.resolve(pending).then(anchor => {
      if (!entry.alive || token !== generation || !xrSession) { anchor.delete(); return; }
      entry.anchor = anchor; record('anchor-created');
    }).catch(error => { if (entry.alive && token === generation) anchorFailed(entry, error); });
  }
}
function anchorFailed(entry, error) {
  // A failed anchor must not look like a successfully anchored product.
  removeEntry(entry); record('anchor-failed', { name: error.name, message: error.message });
  $('tracking-message').textContent = 'Anchor could not be created. Scan slowly and tap again.';
}
function removeEntry(entry) {
  entry.alive = false;
  if (entry.anchor) { entry.anchor.delete(); entry.anchor = null; }
  scene.remove(entry.object);
  const index = placed.indexOf(entry); if (index >= 0) placed.splice(index, 1);
}
function clearProducts() {
  for (const entry of [...placed]) removeEntry(entry);
  placeRequested = false; setStatus();
}
async function endXRSession() {
  if (!xrSession || sessionState === 'stopping') return;
  sessionState = 'stopping'; setStatus();
  try { await xrSession.end(); }
  catch (error) { sessionState = 'running'; record('stop-failed', { message: error.message }); setStatus(); }
  // The shared 'end' event performs cleanup for STOP and the system exit.
}
function onSessionEnd() {
  generation++;
  if (hitTestSource) { hitTestSource.cancel(); hitTestSource = null; }
  if (surfaceTrial) { record('surface-trial-ended-without-hit', { surface: surfaceTrial.surface, observedSeconds: (performance.now() - surfaceTrial.started) / 1000 }); surfaceTrial = null; }
  clearProducts(); xrSession = null; localSpace = null; viewerSpace = null;
  tracked = false; anchorsOn = false; currentHit = null; lastAngle = null;
  captureRequested = false; reticle.visible = false; sessionState = 'idle';
  document.body.classList.remove('xr-active'); $('start').disabled = false; $('start').textContent = 'START AR';
  $('request-anchors').disabled = false; record('session-end'); setStatus(); animate();
}
function downloadEvidence() {
  const blob = new Blob([JSON.stringify({ ...identity, exportedAt: new Date().toISOString(), events: evidence }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `PA3_${STUDENT_ID}_evidence.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function boot() {
  $('runtime-info').textContent = navigator.userAgent;
  try { THREE = await import('three'); loadScene(); loadPreview(); await detectSupport(); }
  catch (error) { $('start').disabled = true; $('start').textContent = 'Preview unavailable'; message(`Could not initialise the page: ${error.message}. The pinned Three.js module needs an internet connection.`); console.warn('[PA3] Initialisation failed', error.message); }
}
if (typeof document !== 'undefined') boot();
