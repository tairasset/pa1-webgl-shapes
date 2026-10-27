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
  const elements = new Map();
  const element = id => { if (!elements.has(id)) elements.set(id, {textContent:'',style:{},checked:true,disabled:false}); return elements.get(id); };
  const context = vm.createContext({ console:{info(){},warn(){}}, performance:{now:()=>1000}, Date,
    document:{ getElementById:element, body:{classList:{remove(){},add(){}}} }, navigator:{userAgent:'SIMULATED'},
    THREE_LIB:THREE, Blob, URL, setTimeout });
  let source = await fs.readFile(new URL('../index.js',import.meta.url),'utf8');
  source = source.replace("if (typeof document !== 'undefined') boot();",'');
  source += `\nexport function setup(){
    THREE=THREE_LIB;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera();productTemplate=buildProduct();
    reticle=new THREE.Mesh(new THREE.RingGeometry(.075,.095,16),new THREE.MeshBasicMaterial());reticle.matrixAutoUpdate=false;reticle.visible=false;
    renderer={xr:{setReferenceSpaceType(){},getReferenceSpace(){return {};},async setSession(){}},setAnimationLoop(){},render(){}};
    xrSession={enabledFeatures:[],domOverlayState:{type:'screen'}};localSpace={};viewerSpace={};hitTestSource={cancel(){}};sessionState='running';
  }
  export function state(){return {placed,tracked,placeRequested,reticle,xrSession,sessionState,evidence,hitTestSource};}
  export function request(){placeRequested=true;}
  export function anchorMode(v){anchorsOn=v;}
  export {render,clearProducts,onSessionEnd,onSessionStarted};`;
  const module = new vm.SourceTextModule(source,{context}); await module.link(()=>{}); await module.evaluate();
  const api=module.namespace; api.setup(); api.anchorMode(anchors);
  let tracked=true,emulated=false,angle=0,hasHit=true,deletes=0;
  const hit = {getPose(){return {transform:{matrix:new THREE.Matrix4().makeRotationX(angle*Math.PI/180).setPosition(.2,0,-1).elements}}},createAnchor(){return anchorPromise || Promise.resolve({anchorSpace:{},delete(){deletes++;}});}};
  const frame={getViewerPose(){return tracked?{emulatedPosition:emulated,transform:{position:{x:0,y:1.6,z:0}}}:null;},getHitTestResults(){return hasHit?[hit]:[];},getPose(){return hit.getPose();}};
  return {api,frame,elements,set(values){if ('tracked'in values)tracked=values.tracked;if('emulated'in values)emulated=values.emulated;if('angle'in values)angle=values.angle;if('hasHit'in values)hasHit=values.hasHit;},deletes:()=>deletes};
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
