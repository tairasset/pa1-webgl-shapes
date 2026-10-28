import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';
import { VARIANT, variantFromId, tiltDegrees, acceptsTilt, facingYaw, buildProduct } from '../index.js';

test('242458 selects speaker, single placement, 12 degrees, facing user', () => {
  assert.deepEqual(VARIANT, { product: 8, mode: 'single', tolerance: 12, facesUser: true });
  assert.throws(() => variantFromId('58'));
});
test('tilt uses the matrix Y column, normalises it and rejects downward normals', () => {
  for (const angle of [0, 8, 12, 16, 45, 90, 180]) {
    const matrix = new THREE.Matrix4().makeRotationX(angle * Math.PI / 180);
    assert.ok(Math.abs(tiltDegrees(matrix.elements) - angle) < 1e-6);
  }
  assert.ok(acceptsTilt(12)); assert.ok(!acceptsTilt(12.001)); assert.ok(!acceptsTilt(NaN));
  assert.equal(tiltDegrees(new Array(16).fill(0)), 180);
});
test('front +Z faces four user positions using yaw only', () => {
  for (const viewer of [{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}]) {
    const yaw = facingYaw({x:0,z:0},viewer);
    assert.ok(new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).distanceTo(new THREE.Vector3(viewer.x,0,viewer.z)) < 1e-6);
  }
});
test('speaker physical bounds and base centre use real Three.js 0.186.1', () => {
  const product = buildProduct(THREE);
  const box = new THREE.Box3().setFromObject(product), size = box.getSize(new THREE.Vector3());
  for (const [actual, expected] of [[size.x,.25],[size.y,1],[size.z,.30]]) assert.ok(Math.abs(actual-expected)<1e-6);
  assert.ok(Math.abs(box.min.y)<1e-6);
  assert.ok(Math.abs((box.min.x+box.max.x)/2)<1e-6);
  assert.ok(Math.abs((box.min.z+box.max.z)/2)<1e-6);
  assert.ok(product.children.length >= 3);
  assert.ok(product.children.every(m => m.material.isMeshStandardMaterial));
  assert.ok(new THREE.Box3().setFromObject(product.children[3]).max.z > new THREE.Box3().setFromObject(product.children[2]).max.z);
});

// Execute the actual runtime functions with a simulated XRFrame. This is logic
// verification, not real device tracking or evidence for experiments E1-E6.
async function harness({anchors=false, anchorPromise=null}={}) {
  let clockMs=1000;
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, {textContent:'',style:{},checked:true,disabled:false}); return elements.get(id); };
  const context = vm.createContext({ console:{info(){},warn(){}}, performance:{now:()=>clockMs}, Date,
    document:{ getElementById:element, body:{classList:{remove(){},add(){}}} }, navigator:{userAgent:'SIMULATED'},
    THREE_LIB:THREE, Blob, URL, setTimeout });
  let source = await fs.readFile(new URL('../index.js',import.meta.url),'utf8');
  source = source.replace("if (typeof document !== 'undefined') boot();",'');
  source += `\nexport function setup(){
    THREE=THREE_LIB;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera();productTemplate=buildProduct();
    reticle=new THREE.Mesh(new THREE.RingGeometry(.075,.095,16),new THREE.MeshBasicMaterial());reticle.matrixAutoUpdate=false;reticle.visible=false;
    renderer={xr:{setReferenceSpaceType(){},getReferenceSpace(){return {};},async setSession(){}},setAnimationLoop(){},render(){}};
    xrSession={enabledFeatures:[],domOverlayState:{type:'screen'},visibilityState:'visible'};localSpace={};viewerSpace={};hitTestSource={cancel(){}};sessionState='running';
  }
  export function state(){return {placed,tracked,placeRequested,captureRequested,reticle,xrSession,sessionState,evidence,hitTestSource,viewerSpace,awaitingFreshHit,surfaceTrial};}
  export function request(){placeRequested=true;}
  export function requestCapture(){captureRequested=true;}
  export function anchorMode(v){anchorsOn=v;}
  export function sourceForTest(v){hitTestSource=v;}
  export {render,clearProducts,onSessionEnd,onSessionStarted,onVisibilityChange,startSurfaceTrial,setStatus,onRequestSession,detectSupport,endXRSession};`;
  const module = new vm.SourceTextModule(source,{context}); await module.link(()=>{}); await module.evaluate();
  const api=module.namespace; api.setup(); api.anchorMode(anchors);
  let tracked=true,emulated=false,angle=0,hasHit=true,deletes=0,anchorLocated=true;
  const reads={viewer:0,hits:0,anchor:0};
  const hit = {getPose(){return {transform:{matrix:new THREE.Matrix4().makeRotationX(angle*Math.PI/180).setPosition(.2,0,-1).elements}}},createAnchor(){return anchorPromise || Promise.resolve({anchorSpace:{},delete(){deletes++;}});}};
  const frame={getViewerPose(){reads.viewer++;return tracked?{emulatedPosition:emulated,transform:{position:{x:0,y:1.6,z:0}}}:null;},getHitTestResults(){reads.hits++;return hasHit?[hit]:[];},getPose(){reads.anchor++;return anchorLocated?hit.getPose():null;}};
  return {api,frame,elements,context,reads,set(values){if ('tracked'in values)tracked=values.tracked;if('emulated'in values)emulated=values.emulated;if('angle'in values)angle=values.angle;if('hasHit'in values)hasHit=values.hasHit;if('anchorLocated'in values)anchorLocated=values.anchorLocated;},time(ms){clockMs=ms;},visibility(value){const session=api.state().xrSession;session.visibilityState=value;api.onVisibilityChange(session);},deletes:()=>deletes};
}
test('red and missing hits consume tap without delayed placement', async()=>{
  const h=await harness(); h.set({angle:20});h.api.request();h.api.render(1,h.frame);assert.equal(h.api.state().placed.length,0);
  h.set({angle:0});h.api.render(2,h.frame);assert.equal(h.api.state().placed.length,0);
  h.set({hasHit:false});h.api.request();h.api.render(3,h.frame);assert.equal(h.api.state().reticle.visible,false);
});
test('tracking loss and emulated position hide reticle and block placement',async()=>{
  const h=await harness();
  for(const values of [{tracked:false},{tracked:true,emulated:true}]){h.set(values);h.api.request();h.api.render(1,h.frame);assert.equal(h.api.state().placed.length,0);assert.equal(h.api.state().reticle.visible,false);}
});
test('single placement replaces anchor and clear deletes the current anchor',async()=>{
  const h=await harness({anchors:true});
  h.api.request();h.api.render(1,h.frame);await new Promise(setImmediate);assert.equal(h.api.state().placed.length,1);
  h.api.request();h.api.render(2,h.frame);await new Promise(setImmediate);assert.equal(h.api.state().placed.length,1);assert.equal(h.deletes(),1);
  h.api.clearProducts();assert.equal(h.deletes(),2);assert.equal(h.api.state().placed.length,0);
});
test('anchor resolved after Clear is deleted and never reinserted',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r);const h=await harness({anchors:true,anchorPromise:pending});
  h.api.request();h.api.render(1,h.frame);h.api.clearProducts();let deleted=false;resolve({anchorSpace:{},delete(){deleted=true;}});await new Promise(setImmediate);
  assert.ok(deleted);assert.equal(h.api.state().placed.length,0);
});
test('system end clears source, products, flags and permits a clean new session',async()=>{
  const h=await harness();h.api.request();h.api.render(1,h.frame);h.api.onSessionEnd();
  assert.equal(h.api.state().xrSession,null);assert.equal(h.api.state().hitTestSource,null);assert.equal(h.api.state().placed.length,0);assert.equal(h.api.state().sessionState,'idle');
  let sources=0,cancelled=0;const session={enabledFeatures:[],domOverlayState:{type:'screen'},addEventListener(){},async requestReferenceSpace(){return {};},async requestHitTestSource(){sources++;return {cancel(){cancelled++;}};}};
  await h.api.onSessionStarted(session);for(let i=0;i<10;i++)h.api.render(i,h.frame);assert.equal(sources,1);h.api.onSessionEnd();assert.equal(cancelled,1);
});
test('pending source from an ended session is cancelled rather than leaked',async()=>{
  const h=await harness();let resolve,cancelled=0;const pending=new Promise(r=>resolve=r);
  const session={enabledFeatures:[],addEventListener(){},async requestReferenceSpace(){return {};},requestHitTestSource(){return pending;}};
  const start=h.api.onSessionStarted(session);await new Promise(setImmediate);h.api.onSessionEnd();resolve({cancel(){cancelled++;}});await start;
  assert.equal(cancelled,1);assert.equal(h.api.state().hitTestSource,null);
});
test('system invalidation of a source cannot abort reset',async()=>{
  const h=await harness();h.api.sourceForTest({cancel(){const error=new Error('Inactive source');error.name='InvalidStateError';throw error;}});
  assert.doesNotThrow(()=>h.api.onSessionEnd());assert.equal(h.api.state().xrSession,null);assert.equal(h.api.state().hitTestSource,null);
});
test('multi mode keeps five items and deletes the oldest on the sixth tap',async()=>{
  const h=await harness({anchors:true});h.api.SETTINGS.mode='multi';
  for(let i=0;i<6;i++){h.api.request();h.api.render(i,h.frame);await new Promise(setImmediate);}
  assert.equal(h.api.state().placed.length,5);assert.equal(h.deletes(),1);h.api.clearProducts();assert.equal(h.deletes(),6);
});
test('a hidden-session event clears requests and hides content without waiting for a frame',async()=>{
  const h=await harness();h.api.request();h.api.render(1,h.frame);const object=h.api.state().placed[0].object;
  h.api.request();h.api.requestCapture();h.visibility('hidden');
  assert.equal(h.api.state().sessionState,'paused');assert.equal(h.api.state().placeRequested,false);assert.equal(h.api.state().captureRequested,false);
  assert.equal(h.api.state().reticle.visible,false);assert.equal(object.visible,false);assert.equal(h.elements.get('capture').disabled,true);
});
test('blurred and hidden sessions do not query viewer, hit or anchor poses',async()=>{
  const h=await harness({anchors:true});h.api.request();h.api.render(1,h.frame);await new Promise(setImmediate);
  for(const state of ['visible-blurred','hidden']){
    h.visibility(state);const before={...h.reads};h.api.request();h.api.render(2,h.frame);
    assert.deepEqual(h.reads,before);assert.equal(h.api.state().placed.length,1);assert.equal(h.api.state().reticle.visible,false);
  }
});
test('resume requires a fresh pose and hit, then a fresh tap',async()=>{
  const h=await harness();h.visibility('hidden');h.visibility('visible');
  h.set({tracked:false});h.api.request();h.api.render(1,h.frame);assert.equal(h.api.state().placed.length,0);
  h.set({tracked:true,emulated:true});h.api.request();h.api.render(2,h.frame);assert.equal(h.api.state().placed.length,0);
  h.set({emulated:false,hasHit:false});h.api.request();h.api.render(3,h.frame);assert.equal(h.api.state().sessionState,'recovering');
  h.set({hasHit:true});h.api.request();h.api.render(4,h.frame);assert.equal(h.api.state().placed.length,0);assert.equal(h.api.state().sessionState,'running');
  h.api.request();h.api.render(5,h.frame);assert.equal(h.api.state().placed.length,1);
});
test('ordinary tracking loss also discards a tap until a new reticle is shown',async()=>{
  const h=await harness();h.set({tracked:false});h.api.request();h.api.render(1,h.frame);
  h.set({tracked:true});h.api.request();h.api.render(2,h.frame);assert.equal(h.api.state().placed.length,0);
  h.api.request();h.api.render(3,h.frame);assert.equal(h.api.state().placed.length,1);
});
test('a visibility interruption cannot be reported as a slow or successful surface trial',async()=>{
  const h=await harness();h.api.startSurfaceTrial('White table');h.time(5000);h.visibility('hidden');
  h.time(45000);h.visibility('visible');h.api.render(1,h.frame);
  const events=h.api.state().evidence;
  assert.ok(events.some(e=>e.event==='surface-trial-interrupted'));
  assert.ok(!events.some(e=>e.event==='surface-trial-timeout'||e.event==='surface-trial-first-hit'));
});
function fakeSession(visibilityState='visible') {
  const listeners=new Map();let sources=0,cancels=0;
  return {visibilityState,enabledFeatures:[],domOverlayState:{type:'screen'},listeners,
    addEventListener(name,fn){listeners.set(name,fn);},removeEventListener(name,fn){if(listeners.get(name)===fn)listeners.delete(name);},
    async requestReferenceSpace(){return {};},async requestHitTestSource(){sources++;return {cancel(){cancels++;}};},
    sourceCount:()=>sources,cancelCount:()=>cancels};
}
test('session starting behind system UI requests one source and stays paused',async()=>{
  const h=await harness();const session=fakeSession('visible-blurred');await h.api.onSessionStarted(session);
  assert.equal(h.api.state().sessionState,'paused');assert.equal(session.sourceCount(),1);
  session.visibilityState='visible';session.listeners.get('visibilitychange')();h.api.render(1,h.frame);
  assert.equal(h.api.state().sessionState,'running');assert.equal(session.sourceCount(),1);
  h.api.onSessionEnd();assert.equal(session.listeners.size,0);assert.equal(session.cancelCount(),1);
});
test('late end and visibility events from an old session cannot reset the new one',async()=>{
  const h=await harness();const oldSession=fakeSession();await h.api.onSessionStarted(oldSession);
  const oldEnd=oldSession.listeners.get('end'), oldVisibility=oldSession.listeners.get('visibilitychange');
  h.api.onSessionEnd();const newSession=fakeSession();await h.api.onSessionStarted(newSession);
  oldSession.visibilityState='hidden';oldVisibility();oldEnd();
  assert.equal(h.api.state().xrSession,newSession);assert.equal(h.api.state().sessionState,'running');
});
test('a late reference-space result cannot overwrite a newer session viewer space',async()=>{
  const h=await harness();let resolve;const pending=new Promise(r=>resolve=r);const oldSession=fakeSession();oldSession.requestReferenceSpace=()=>pending;
  const oldStart=h.api.onSessionStarted(oldSession);await new Promise(setImmediate);h.api.onSessionEnd();
  const newSession=fakeSession();await h.api.onSessionStarted(newSession);const newSpace=h.api.state().viewerSpace;
  resolve({old:true});await oldStart;assert.equal(h.api.state().viewerSpace,newSpace);assert.equal(h.api.state().xrSession,newSession);
});
test('missing anchor pose hides a placed product until its pose returns',async()=>{
  const h=await harness({anchors:true});h.api.request();h.api.render(1,h.frame);await new Promise(setImmediate);
  h.set({anchorLocated:false});h.api.render(2,h.frame);assert.equal(h.api.state().placed[0].object.visible,false);
  h.set({anchorLocated:true});h.api.render(3,h.frame);assert.equal(h.api.state().placed[0].object.visible,true);assert.equal(h.deletes(),0);
});
test('anchor creation failure removes the placement and keeps an actionable message visible',async()=>{
  let reject;const pending=new Promise((_,r)=>reject=r);const h=await harness({anchors:true,anchorPromise:pending});
  h.api.request();h.api.render(1,h.frame);reject(new Error('Test anchor failure'));await new Promise(setImmediate);h.api.render(2,h.frame);
  assert.equal(h.api.state().placed.length,0);assert.match(h.elements.get('tracking-message').textContent,/Anchor could not be created/);
});
test('live settings update the displayed tolerance, mode and facing labels',async()=>{
  const h=await harness();Object.assign(h.api.SETTINGS,{mode:'multi',capacity:3,tolerance:16,faceAway:true});h.api.setStatus();
  assert.match(h.elements.get('variant-header').textContent,/Multi up to 3.*16°.*Faces away/);
  assert.match(h.elements.get('variant-overlay').textContent,/16°/);assert.equal(h.elements.get('count-status').textContent,'0 / 3');
});
test('placement on a tolerated tilted surface faces the viewer with no initial pitch',async()=>{
  const h=await harness();h.set({angle:10});h.api.request();h.api.render(1,h.frame);
  const matrix=h.api.state().placed[0].object.matrix;
  const up=new THREE.Vector3(0,1,0).transformDirection(matrix);assert.ok(up.distanceTo(new THREE.Vector3(0,1,0))<1e-6);
  const front=new THREE.Vector3(0,0,1).transformDirection(matrix);assert.ok(front.distanceTo(new THREE.Vector3(-.2,0,1).normalize())<1e-6);
});
test('keep-hit orientation retains the full hit rotation',async()=>{
  const h=await harness();h.api.SETTINGS.facesUser=false;h.set({angle:10});h.api.request();h.api.render(1,h.frame);
  const matrix=h.api.state().placed[0].object.matrix;const expected=new THREE.Matrix4().makeRotationX(10*Math.PI/180).setPosition(.2,0,-1);
  assert.ok(matrix.elements.every((v,i)=>Math.abs(v-expected.elements[i])<1e-6));
});
test('requestSession negotiates required hit-test and both normal optional features',async()=>{
  const h=await harness();h.api.onSessionEnd();let options;
  h.context.navigator.xr={async requestSession(mode,init){assert.equal(mode,'immersive-ar');options=init;return fakeSession();}};
  await h.api.onRequestSession();assert.deepEqual(Array.from(options.requiredFeatures),['hit-test']);assert.deepEqual(Array.from(options.optionalFeatures),['anchors','dom-overlay']);
  assert.equal(h.api.state().sessionState,'running');
});
test('permission denial resets controls and shows a visible fallback',async()=>{
  const h=await harness();h.api.onSessionEnd();h.context.navigator.xr={async requestSession(){throw new Error('Permission denied');}};
  await h.api.onRequestSession();assert.equal(h.api.state().sessionState,'idle');assert.equal(h.elements.get('start').disabled,false);assert.match(h.elements.get('fallback').textContent,/Permission denied/);
});
test('a failed STOP discards pending input and requires reacquisition before retrying placement',async()=>{
  const h=await harness();h.api.state().xrSession.end=async()=>{throw new Error('Test stop rejection');};
  h.api.request();await h.api.endXRSession();assert.equal(h.api.state().sessionState,'recovering');assert.equal(h.api.state().placeRequested,false);
  h.api.render(1,h.frame);assert.equal(h.api.state().placed.length,0);assert.equal(h.api.state().sessionState,'running');
  h.api.request();h.api.render(2,h.frame);assert.equal(h.api.state().placed.length,1);
});
