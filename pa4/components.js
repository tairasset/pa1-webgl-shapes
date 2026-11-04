/* PA4 / 242458. Metres, seconds, radians. Core A-Frame only. */
(function () {
  'use strict';
  const T = AFRAME.THREE;
  const MOTION = 'x2458-motion', EXHIBIT = 'x2458-exhibit', TEXTURE = 'x2458-texture';
  const log = (el, method, detail = {}) => {
    // A-Frame reuses oldData; retain the observation, not its mutable reference.
    const row = { method, entity: el.id, ms: Number(performance.now().toFixed(2)), ...structuredClone(detail) };
    console.info('[242458 lifecycle]', JSON.stringify(row));
    const system = el.sceneEl?.systems['x2458-gallery'];
    if (system) { system.journal.push(row); if (system.journal.length > 2500) system.journal.shift(); }
  };

  AFRAME.registerComponent(MOTION, {
    schema: {
      type: { type: 'string', oneOf: ['bob', 'orbit', 'pulse'], default: 'pulse' },
      amplitude: { type: 'number', default: 0.12 },
      period: { type: 'number', default: 4 },
      phase: { type: 'number', default: 0 }
    },
    init: function () {
      this.basePosition = this.el.object3D.position.clone();
      this.baseScale = this.el.object3D.scale.clone();
      this.angle = 0; this.elapsed = 0; this.running = false; this.firstTick = true; this.skipDelta = false;
      this.positionOffset = new T.Vector3(); this.scaleOffset = new T.Vector3();
      this.targetPosition = new T.Vector3(); this.targetScale = new T.Vector3();
      log(this.el, 'init');
    },
    target: function () {
      const d = this.data, a = Math.max(0, d.amplitude), s = Math.sin(this.angle + d.phase);
      this.targetPosition.copy(this.basePosition); this.targetScale.copy(this.baseScale);
      if (d.type === 'bob') this.targetPosition.y += a * s;
      else if (d.type === 'orbit') {
        this.targetPosition.x += a * Math.cos(this.angle + d.phase);
        this.targetPosition.z += a * s;
      } else this.targetScale.multiplyScalar(Math.max(0.05, 1 + a * s));
    },
    update: function (oldData) {
      const beforeP = this.el.object3D.position.clone(), beforeS = this.el.object3D.scale.clone();
      this.target();
      if (Object.keys(oldData).length) {
        // Keep this exact frame's pose, then settle onto the new trajectory.
        this.positionOffset.copy(beforeP).sub(this.targetPosition);
        this.scaleOffset.copy(beforeS).sub(this.targetScale);
      }
      log(this.el, 'update', { oldData, data: { ...this.data } });
    },
    tick: function (time, timeDelta) {
      if (!this.running || this.el.sceneEl.systems['x2458-gallery']?.motionPaused) return;
      const dt = this.skipDelta ? 0 : Math.max(0, Math.min(timeDelta || 0, 100)) / 1000;
      this.skipDelta = false;
      this.angle = (this.angle + dt * Math.PI * 2 / Math.max(0.05, this.data.period)) % (Math.PI * 2);
      this.elapsed += dt; this.target();
      const decay = Math.exp(-dt * 8);
      this.positionOffset.multiplyScalar(decay); this.scaleOffset.multiplyScalar(decay);
      this.el.object3D.position.copy(this.targetPosition).add(this.positionOffset);
      this.el.object3D.scale.copy(this.targetScale).add(this.scaleOffset);
      if (this.firstTick || this.elapsed >= 1) {
        log(this.el, 'tick', { time: Number(time.toFixed(2)), timeDelta });
        this.firstTick = false; this.elapsed = 0;
      }
    },
    pause: function () { this.running = false; log(this.el, 'pause'); },
    play: function () { this.running = true; this.skipDelta = true; log(this.el, 'play'); },
    remove: function () {
      this.el.object3D.position.copy(this.basePosition); this.el.object3D.scale.copy(this.baseScale);
      log(this.el, 'remove');
    }
  });

  AFRAME.registerComponent(TEXTURE, {
    schema: {
      src: { type: 'map' }, repeat: { type: 'vec2', default: { x: 1, y: 1 } },
      normalSrc: { type: 'map', default: '' }, anisotropy: { type: 'int', default: 8 }
    },
    init: function () {
      this.mesh = null; this.materials = []; this.texture = null; this.normalTexture = null;
      this.source = null; this.normalSource = null; this.tokens = { map: 0, normalMap: 0 };
      this.removed = false; this.loads = 0;
      this.onMesh = e => { if (e.detail.type === 'mesh') this.attach(); };
      this.el.addEventListener('object3dset', this.onMesh);
      this.attach();
    },
    attach: function () {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh || mesh === this.mesh || this.removed) return;
      this.restore(); this.mesh = mesh;
      mesh.traverse(object => {
        if (!object.isMesh) return;
        const original = object.material;
        const owned = Array.isArray(original) ? original.map(m => m.clone()) : original.clone();
        this.materials.push({ object, original, owned }); object.material = owned;
      });
      this.applyMaps(); this.update({});
    },
    url: function (source) { return source?.currentSrc || source?.src || source || ''; },
    update: function () {
      if (this.removed) return;
      const src = this.url(this.data.src), normal = this.url(this.data.normalSrc);
      if (src !== this.source) { this.source = src; this.load('map', src); }
      if (normal !== this.normalSource) { this.normalSource = normal; this.load('normalMap', normal); }
      this.configure(this.texture); this.configure(this.normalTexture); this.applyMaps();
    },
    load: function (slot, src) {
      const key = slot === 'map' ? 'texture' : 'normalTexture', token = ++this.tokens[slot];
      if (this[key]) this[key].dispose(); this[key] = null; this.applyMaps();
      if (!src) return;
      this.loads++;
      new T.TextureLoader().load(src, texture => {
        if (this.removed || token !== this.tokens[slot]) { texture.dispose(); return; }
        this[key] = texture;
        if (slot === 'map') texture.colorSpace = T.SRGBColorSpace;
        this.configure(texture); this.applyMaps(); this.el.emit('x2458-texture-ready', { slot });
      }, undefined, () => {
        if (!this.removed && token === this.tokens[slot]) console.error('[242458] Texture failed:', src);
      });
    },
    configure: function (texture) {
      if (!texture) return;
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(this.data.repeat.x, this.data.repeat.y);
      texture.minFilter = T.LinearMipmapLinearFilter; texture.magFilter = T.LinearFilter;
      texture.generateMipmaps = true;
      const maximum = this.el.sceneEl.renderer?.capabilities.getMaxAnisotropy() || 1;
      texture.anisotropy = Math.max(1, Math.min(this.data.anisotropy, maximum));
      texture.needsUpdate = true;
    },
    applyMaps: function () {
      this.materials.forEach(({ owned }) => (Array.isArray(owned) ? owned : [owned]).forEach(m => {
        m.map = this.texture; m.normalMap = this.normalTexture; m.needsUpdate = true;
      }));
    },
    restore: function () {
      this.materials.forEach(({ object, original, owned }) => {
        if (object.material === owned) object.material = original;
        (Array.isArray(owned) ? owned : [owned]).forEach(m => m.dispose());
      }); this.materials = [];
    },
    remove: function () {
      this.removed = true; this.tokens.map++; this.tokens.normalMap++;
      this.el.removeEventListener('object3dset', this.onMesh); this.restore();
      this.texture?.dispose(); this.normalTexture?.dispose();
      this.texture = this.normalTexture = this.mesh = null;
    }
  });

  AFRAME.registerComponent(EXHIBIT, {
    schema: { name: { type: 'string' }, info: { type: 'string' } },
    init: function () {
      this.gallery = this.el.sceneEl.systems['x2458-gallery'];
      this.selected = false; this.hovered = false;
      this.defaultAmplitude = this.el.getAttribute(MOTION)?.amplitude ?? 0.12;
      this.originalColor = this.el.getAttribute('material')?.color || '#64746c';
      this.panel = document.createElement('a-entity');
      this.panel.setAttribute('position', '0 1.65 0');
      this.panel.setAttribute('text', { value: `${this.data.name}\n${this.data.info}`, align: 'center', width: 2.1, color: '#fff3d7', wrapCount: 32 });
      this.panel.setAttribute('visible', false); this.el.appendChild(this.panel);
      // Cursor events on primitive children do not bubble by default.
      // Capture them and route the interaction through this exhibit's events map.
      this.forwardChild = event => {
        if (event.target === this.el) return;
        event.stopPropagation();
        this.el.emit(event.type, event.detail, false);
      };
      ['mouseenter', 'mouseleave', 'click'].forEach(name => this.el.addEventListener(name, this.forwardChild, true));
      this.gallery.register(this.el);
    },
    events: {
      mouseenter: function () { this.hovered = true; this.paint(); },
      mouseleave: function () { this.hovered = false; this.paint(); },
      click: function () { this.gallery.select(this.selected ? null : this.el); }
    },
    paint: function () {
      this.el.setAttribute('material', 'color', this.selected ? '#efb55c' : this.hovered ? '#e9dfbf' : this.originalColor);
    },
    setSelected: function (value) {
      if (this.selected === value) return;
      this.selected = value; this.panel.setAttribute('visible', value); this.paint();
      this.el.setAttribute(MOTION, 'amplitude', value ? this.defaultAmplitude * 2 : this.defaultAmplitude);
    },
    remove: function () {
      ['mouseenter', 'mouseleave', 'click'].forEach(name => this.el.removeEventListener(name, this.forwardChild, true));
      this.gallery.unregister(this.el);
      this.panel?.remove();
    }
  });

  AFRAME.registerSystem('x2458-gallery', {
    init: function () {
      this.exhibits = []; this.selected = null; this.motionPaused = false; this.journal = [];
      this.batches = []; this.hiddenMeshes = []; this.stressEntities = [];
      this.onKey = e => {
        if (e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code === 'KeyM') { this.motionPaused = !this.motionPaused; this.updatePanel(); }
        if (e.code === 'KeyX' && this.selected) {
          const el = this.selected; this.select(null); this.unregister(el); el.remove();
        }
      };
      this.onVR = event => {
        const camera = document.querySelector('#camera');
        // Only a WebXR session suspends desktop locomotion.
        if (event.type === 'enter-vr' && this.el.xrSession) camera.setAttribute('wasd-controls', 'enabled', false);
        if (event.type === 'exit-vr') camera.setAttribute('wasd-controls', 'enabled', true);
      };
      window.addEventListener('keydown', this.onKey);
      this.el.addEventListener('enter-vr', this.onVR); this.el.addEventListener('exit-vr', this.onVR);
      this.updatePanel();
    },
    register: function (el) { if (!this.exhibits.includes(el)) this.exhibits.push(el); this.updatePanel(); },
    unregister: function (el) {
      if (this.selected === el) this.select(null);
      const i = this.exhibits.indexOf(el); if (i !== -1) this.exhibits.splice(i, 1);
      if (this.batches.length) this.setBatchMode(false);
      this.updatePanel();
    },
    select: function (el) {
      if (el && !this.exhibits.includes(el)) return;
      if (this.selected === el) return;
      this.selected?.components[EXHIBIT]?.setSelected(false);
      this.selected = el; el?.components[EXHIBIT]?.setSelected(true); this.updatePanel();
    },
    updatePanel: function () {
      const selected = this.selected?.components[EXHIBIT]?.data.name || 'none';
      const n = this.selected ? this.exhibits.indexOf(this.selected) + 1 : 0;
      const value = `242458 | SCIENCE LAB\nPulse | Gaze 1.5 s | Ring 4 m\nSelected: ${selected} (${n} of ${this.exhibits.length})\nM: ${this.motionPaused ? 'resume' : 'pause'} motion | X: remove`;
      const panel = this.el.querySelector('#info-panel'); if (panel) panel.setAttribute('text', 'value', value);
      const dom = document.querySelector('#selection'); if (dom) dom.textContent = `${selected} (${n} of ${this.exhibits.length})`;
    },
    addStress: function (count = 60) {
      this.setBatchMode(false);
      const source = this.exhibits[0]; if (!source) return;
      for (let i = 0; i < count; i++) {
        const el = source.cloneNode(true);
        el.querySelectorAll('[text]').forEach(node => node.remove());
        el.removeAttribute('id'); el.id = `stress-${Date.now()}-${i}`;
        el.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        el.setAttribute('position', `${(i % 10 - 4.5) * 1.4} 0.25 ${-8 - Math.floor(i / 10) * 1.5}`);
        el.setAttribute(MOTION, { type: 'pulse', amplitude: 0.12, period: 4, phase: i * .47 });
        el.setAttribute(EXHIBIT, { name: `Sample ${i + 1}`, info: 'Repeated laboratory sample.' });
        this.el.appendChild(el); this.stressEntities.push(el);
      }
    },
    clearStress: function () {
      this.setBatchMode(false);
      [...this.stressEntities].forEach(el => { this.unregister(el); el.remove(); }); this.stressEntities = [];
    },
    setBatchMode: function (enabled) {
      this.batches.forEach(({ mesh }) => { mesh.removeFromParent(); mesh.dispose(); }); this.batches = [];
      this.hiddenMeshes.forEach(({ object, visible }) => { object.visible = visible; }); this.hiddenMeshes = [];
      if (!enabled) return;
      this.el.object3D.updateMatrixWorld(true);
      const groups = new Map();
      this.exhibits.forEach(el => el.object3D.traverse(object => {
        if (!object.isMesh || Array.isArray(object.material) || object.el?.hasAttribute('text')) return;
        // Geometries are cached by A-Frame. Match equivalent materials by values.
        const m = object.material;
        const key = [object.geometry.uuid, m.type, m.color?.getHex(), m.roughness, m.metalness, m.map?.uuid || ''].join('/');
        if (!groups.has(key)) groups.set(key, []); groups.get(key).push(object);
      }));
      for (const objects of groups.values()) {
        if (objects.length < 2) continue;
        const mesh = new T.InstancedMesh(objects[0].geometry, objects[0].material, objects.length);
        mesh.frustumCulled = false; this.el.object3D.add(mesh);
        objects.forEach(object => { this.hiddenMeshes.push({ object, visible: object.visible }); object.visible = false; });
        this.batches.push({ mesh, objects });
      }
      this.updateBatches();
    },
    updateBatches: function () {
      if (!this.batches.length) return;
      this.el.object3D.updateMatrixWorld(true);
      const inverse = new T.Matrix4().copy(this.el.object3D.matrixWorld).invert(), matrix = new T.Matrix4();
      this.batches.forEach(({ mesh, objects }) => {
        objects.forEach((object, i) => { matrix.multiplyMatrices(inverse, object.matrixWorld); mesh.setMatrixAt(i, matrix); });
        mesh.instanceMatrix.needsUpdate = true;
      });
    },
    tock: function () { this.updateBatches(); },
    remove: function () {
      window.removeEventListener('keydown', this.onKey);
      this.el.removeEventListener('enter-vr', this.onVR); this.el.removeEventListener('exit-vr', this.onVR);
      this.setBatchMode(false);
    }
  });

  // The following helpers drive the required experiments; they do not replace evidence.
  const lab = window.PA4 = {
    gallery: () => document.querySelector('a-scene').systems['x2458-gallery'],
    filter: function (mode) {
      const c = document.querySelector('#ground').components[TEXTURE], texture = c.texture;
      if (!texture) throw new Error('Ground texture is not ready');
      if (mode === 'chapter') {
        texture.anisotropy = 16; texture.minFilter = T.NearestFilter;
        texture.maxFilter = T.NearestFilter; // Deliberately reproduce Ch. 8's misspelling for E3.
      } else {
        delete texture.maxFilter;
        texture.minFilter = T.LinearMipmapLinearFilter; texture.magFilter = T.LinearFilter;
        texture.anisotropy = mode === 'defaults' ? 1 : Math.min(8, document.querySelector('a-scene').renderer.capabilities.getMaxAnisotropy());
      }
      texture.needsUpdate = true;
      return { mode, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
        maxFilterIsRealProperty: 'maxFilter' in new T.Texture(), three: T.REVISION };
    },
    counters: function () {
      const scene = document.querySelector('a-scene'), info = scene.renderer.info;
      return { fps: null, calls: info.render.calls, triangles: info.render.triangles, geometries: info.memory.geometries,
        textures: info.memory.textures, exhibits: lab.gallery().exhibits.length, xrPresenting: scene.renderer.xr.isPresenting };
    },
    measure: function (seconds = 5) {
      return new Promise(resolve => {
        let first, last, frames = 0, calls = [], triangles = [];
        function frame(now) {
          first ??= now; last = now; frames++;
          const info = lab.counters(); calls.push(info.calls); triangles.push(info.triangles);
          if (now - first < seconds * 1000) return requestAnimationFrame(frame);
          const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
          resolve({ ...info, fps: Number(((frames - 1) * 1000 / (last - first)).toFixed(2)),
            calls: Number(mean(calls).toFixed(1)), triangles: Math.round(mean(triangles)), durationMs: last - first,
            userAgent: navigator.userAgent });
        } requestAnimationFrame(frame);
      });
    },
    downloadLog: function () {
      const blob = new Blob([JSON.stringify({ id: '242458', exportedAt: new Date().toISOString(), events: lab.gallery().journal }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'), url = URL.createObjectURL(blob); a.href = url; a.download = 'PA4_242458_lifecycle.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    const ready = () => {
      lab.gallery().updatePanel(); document.querySelector('#loading').hidden = true;
      // Depth testing alone does not guarantee a cursor draws after opaque world meshes.
      document.querySelector('#gaze').getObject3D('mesh').renderOrder = 10000;
      const notice = document.querySelector('#notice');
      const fullscreen = document.querySelector('#fullscreen');
      fullscreen.onclick = async () => {
        fullscreen.blur();
        notice.textContent = '';
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else await document.documentElement.requestFullscreen();
        } catch {
          notice.textContent = 'Fullscreen was blocked. Open the page in Chrome and press F11.';
        }
      };
      document.addEventListener('fullscreenchange', () => {
        fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
      });
      const enterVR = document.querySelector('#enter-vr');
      const cachedHeadsetCheck = scene.checkHeadsetConnected.bind(scene);
      let immersiveVRSupported = false;
      // A-Frame's initial check can finish before the browser emulator is installed.
      scene.checkHeadsetConnected = () => immersiveVRSupported || cachedHeadsetCheck();
      enterVR.onclick = async () => {
        if (scene.xrSession) return;
        enterVR.blur();
        enterVR.disabled = true;
        notice.textContent = '';
        try {
          immersiveVRSupported = !!(await navigator.xr?.isSessionSupported('immersive-vr'));
          if (!immersiveVRSupported) {
            notice.textContent = 'VR requires a headset or Immersive Web Emulator. For desktop play, choose Fullscreen.';
            return;
          }
          scene.hasWebXR = true;
          await scene.enterVR();
        } catch (error) {
          notice.textContent = error.message;
        } finally {
          enterVR.disabled = false;
        }
      };
      document.querySelector('#save-log').onclick = lab.downloadLog;
      document.querySelector('#toggle-stats').onclick = () => scene.hasAttribute('stats') ? scene.removeAttribute('stats') : scene.setAttribute('stats', '');
    };
    if (scene.hasLoaded) ready(); else scene.addEventListener('loaded', ready, { once: true });
  });
}());
