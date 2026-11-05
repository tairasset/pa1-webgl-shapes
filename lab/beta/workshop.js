(function () {
  'use strict';

  const EYE = 1.62;
  const REACH = 4.2;
  const KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const stations = [
    { id: 'supply', x: 0, z: 2, title: '01  SUPPLIES', tint: 0xdcab71, halfWidth: 0.95, halfDepth: 0.54 },
    { id: 'copper', x: -4.4, z: -1.7, title: '02  COPPER POWDER', tint: 0xe49b65, halfWidth: 1.05, halfDepth: 0.62 },
    { id: 'charge', x: 4.4, z: -1.7, title: '03  POWER CELLS', tint: 0xbdd98b, halfWidth: 1.05, halfDepth: 0.62 },
    { id: 'bench', x: 0, z: -4.9, title: '04  WORKBENCH', tint: 0xe3c892, halfWidth: 1.3, halfDepth: 0.6 },
    { id: 'arena', x: 4.4, z: 4.8, title: '05  ARENA', tint: 0x80bbb4, halfWidth: 0.95, halfDepth: 0.3 }
  ];
  const limit = (value, min, max) => Math.min(max, Math.max(min, value));

  window.createWorkshop = function (canvas, onInteract, onTarget, onHint) {
    const T = window.AFRAME?.THREE;
    if (!T) throw new Error('The 3D workshop library did not load.');

    const renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene();
    scene.background = new T.Color(0x172321);
    scene.fog = new T.Fog(0x172321, 13, 28);
    const camera = new T.PerspectiveCamera(66, 1.6, 0.06, 38);
    const cube = new T.BoxGeometry(1, 1, 1);
    const surfaces = new Map();
    const direction = new T.Vector3();
    const pointer = { id: null, x: 0, y: 0, travel: 0, button: 0 };
    const raycaster = new T.Raycaster();
    const pickPoint = new T.Vector2();
    const pickTargets = [];
    const pickMaterial = new T.MeshBasicMaterial({ visible: false });
    const highlights = new Map();
    const keys = new Set();
    let x = 0, z = 4.45, yaw = 0, pitch = -0.04;
    let active = false, frame = 0, lastTime = 0, target = null;

    function material(color, glow = false) {
      const key = color + ':' + glow;
      if (!surfaces.has(key)) {
        const options = glow ? { color } : { color, roughness: 0.86 };
        const Material = glow ? T.MeshBasicMaterial : T.MeshStandardMaterial;
        surfaces.set(key, new Material(options));
      }
      return surfaces.get(key);
    }

    function box(parent, position, dimensions, color, glow = false) {
      const mesh = new T.Mesh(cube, material(color, glow));
      mesh.position.set(...position);
      mesh.scale.set(...dimensions);
      parent.add(mesh);
      return mesh;
    }

    function sign(parent, text, tint, y = 1.94) {
      const art = document.createElement('canvas');
      art.width = 512;
      art.height = 104;
      const pen = art.getContext('2d');
      pen.fillStyle = '#12211e';
      pen.fillRect(0, 0, art.width, art.height);
      pen.strokeStyle = '#' + new T.Color(tint).getHexString();
      pen.lineWidth = 5;
      pen.strokeRect(5, 5, 502, 94);
      pen.fillStyle = '#f4e7c9';
      pen.font = '700 33px system-ui';
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.fillText(text, 256, 52, 466);
      const texture = new T.CanvasTexture(art);
      texture.colorSpace = T.SRGBColorSpace;
      const label = new T.Sprite(new T.SpriteMaterial({ map: texture, fog: false }));
      label.position.set(0, y, 0);
      label.scale.set(2.58, 0.52, 1);
      parent.add(label);
    }

    function stationModel(station) {
      const group = new T.Group();
      group.userData.stationId = station.id;
      group.position.set(station.x, 0, station.z);
      scene.add(group);
      // A generous click area includes gaps between the visible crates and tools.
      const pickArea = new T.Mesh(cube, pickMaterial);
      pickArea.position.y = 1.1;
      pickArea.scale.set(station.halfWidth * 2.15, 2.1, station.halfDepth * 2.15);
      group.add(pickArea);
      pickTargets.push(pickArea);
      const highlight = new T.Mesh(
        new T.RingGeometry(1.35, 1.43, 48),
        new T.MeshBasicMaterial({ color: 0xcbe18f, side: T.DoubleSide })
      );
      highlight.rotation.x = -Math.PI / 2;
      highlight.position.y = 0.085;
      highlight.visible = false;
      group.add(highlight);
      highlights.set(station.id, highlight);
      const color = station.tint;
      const steel = 0x334943;
      const trim = 0x596c58;
      box(group, [0, 0.035, 0], [station.halfWidth * 2.6, 0.07, station.halfDepth * 2.8], color);
      if (station.id === 'arena') {
        for (const side of [-1, 1]) {
          box(group, [side * 0.72, 1.14, 0], [0.25, 2.28, 0.36], steel);
          box(group, [side * 0.72, 1.14, 0.19], [0.055, 1.75, 0.035], color, true);
        }
        box(group, [0, 2.23, 0], [1.72, 0.27, 0.37], steel);
        box(group, [0, 1.04, 0.02], [1.2, 2.05, 0.11], 0x3a5550);
        sign(group, station.title, color, 2.61);
        return;
      }
      box(group, [0, 0.45, 0], [station.halfWidth * 2, 0.82, station.halfDepth * 1.9], steel);
      box(group, [0, 0.9, 0], [station.halfWidth * 2.1, 0.17, station.halfDepth * 2], trim);
      box(group, [0, 0.63, station.halfDepth], [station.halfWidth * 1.67, 0.08, 0.035], color, true);
      if (station.id === 'supply') {
        box(group, [-0.44, 1.12, 0.03], [0.66, 0.28, 0.68], 0x996c48);
        box(group, [0.36, 1.16, -0.04], [0.65, 0.35, 0.52], 0x6e7953);
        for (let i = 0; i < 3; i++) box(group, [-0.59 + i * 0.15, 1.28, 0.08], [0.08, 0.085, 0.62], color);
      } else if (station.id === 'copper') {
        box(group, [-0.32, 1.17, 0], [0.85, 0.37, 0.67], 0x6f6250);
        box(group, [-0.32, 1.37, 0], [0.64, 0.08, 0.5], color, true);
        box(group, [0.42, 1.32, -0.1], [0.35, 0.7, 0.42], steel);
        box(group, [0.08, 1.57, -0.1], [0.78, 0.13, 0.15], color);
      } else if (station.id === 'charge') {
        for (let i = 0; i < 3; i++) {
          const slot = (i - 1) * 0.5;
          box(group, [slot, 1.21, 0], [0.32, 0.47, 0.53], steel);
          box(group, [slot, 1.23, 0.28], [0.16, 0.24, 0.045], color, true);
          box(group, [slot, 1.47, 0], [0.12, 0.08, 0.16], color);
        }
      } else {
        box(group, [0, 1.29, -0.38], [2.1, 0.61, 0.12], 0x6a593f);
        for (let i = 0; i < 4; i++) box(group, [-0.67 + i * 0.42, 1.34, -0.3], [0.12, 0.31, 0.08], color);
        box(group, [0.58, 1.03, 0.15], [0.5, 0.11, 0.32], 0x986e4b);
      }
      sign(group, station.title, color);
    }

    scene.add(new T.HemisphereLight(0xffefcd, 0x415a4d, 2.15));
    const keyLight = new T.DirectionalLight(0xffd7a2, 2.05);
    keyLight.position.set(-3, 6, 2);
    scene.add(keyLight);
    box(scene, [0, -0.14, 0], [14, 0.25, 13.7], 0x596257);
    const grid = new T.GridHelper(14, 28, 0x353e37, 0x49554b);
    grid.position.y = -0.01;
    scene.add(grid);
    for (const side of [-1, 1]) {
      box(scene, [side * 6.75, 1.2, 0], [0.28, 2.4, 13.5], 0x435651);
      box(scene, [0, 1.2, side * 6.6], [13.55, 2.4, 0.28], 0x435651);
      box(scene, [side * 6.58, 1.93, 0], [0.08, 0.11, 13.2], 0xad8b54);
      box(scene, [0, 1.93, side * 6.44], [13.2, 0.11, 0.08], 0xad8b54);
      for (let i = -2; i <= 2; i++) {
        box(scene, [side * 6.5, 1.12, i * 2.5], [0.29, 2.3, 0.36], 0x566a5d);
        box(scene, [i * 2.5, 1.12, side * 6.36], [0.34, 2.3, 0.28], 0x566a5d);
      }
    }
    for (const station of stations) stationModel(station);

    function blocked(nextX, nextZ) {
      if (Math.abs(nextX) > 6.2 || Math.abs(nextZ) > 6.05) return true;
      return stations.some(station =>
        Math.abs(nextX - station.x) < station.halfWidth + 0.25 &&
        Math.abs(nextZ - station.z) < station.halfDepth + 0.25);
    }

    function updateTarget() {
      const forwardX = Math.sin(yaw), forwardZ = -Math.cos(yaw);
      let best = -Infinity;
      let next = null;
      for (const station of stations) {
        const dx = station.x - x, dz = station.z - z;
        const range = Math.hypot(dx, dz);
        if (range > REACH || range < 0.15) continue;
        const alignment = (dx * forwardX + dz * forwardZ) / range;
        // Close stations remain usable without precise aiming.
        if (alignment < 0.35 && range > 2) continue;
        const score = alignment - range * 0.12;
        if (score > best) {
          best = score;
          next = station.id;
        }
      }
      if (target !== next) {
        target = next;
        for (const [id, highlight] of highlights) highlight.visible = id === target;
        onTarget?.(target);
      }
    }

    function clearInput() {
      keys.clear();
      pointer.id = null;
    }

    function interact() {
      if (!active) return;
      updateTarget();
      if (target) onInteract?.(target);
      else onHint?.('Walk closer to a station, then click it or press E.');
    }

    function clickStation(event) {
      const bounds = canvas.getBoundingClientRect();
      pickPoint.set((event.clientX - bounds.left) / bounds.width * 2 - 1,
        1 - (event.clientY - bounds.top) / bounds.height * 2);
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      raycaster.setFromCamera(pickPoint, camera);
      for (const hit of raycaster.intersectObjects(pickTargets, false)) {
        let group = hit.object;
        while (group && !group.userData.stationId) group = group.parent;
        if (!group) continue;
        const station = stations.find(item => item.id === group.userData.stationId);
        if (Math.hypot(station.x - x, station.z - z) > REACH) {
          onHint?.('Move a little closer to ' + station.title.slice(4).toLowerCase() + ', then click again.');
        } else {
          onInteract?.(station.id);
        }
        return;
      }
      onHint?.('Click a station or use the highlighted station with E. Drag to look around.');
    }

    canvas.addEventListener('pointerdown', event => {
      if (!active || (event.button !== 0 && event.button !== 2)) return;
      canvas.focus({ preventScroll: true });
      pointer.id = event.pointerId;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.travel = 0;
      pointer.button = event.button;
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!active || pointer.id !== event.pointerId) return;
      pointer.travel += Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
      yaw += (event.clientX - pointer.x) * 0.005;
      pitch = limit(pitch - (event.clientY - pointer.y) * 0.004, -0.65, 0.65);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    });
    canvas.addEventListener('pointerup', event => {
      if (pointer.id !== event.pointerId) return;
      const click = pointer.travel <= 8 && pointer.button === 0;
      pointer.id = null;
      if (active && click) clickStation(event);
    });
    for (const name of ['pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(name, event => { if (pointer.id === event.pointerId) pointer.id = null; });
    }
    canvas.addEventListener('contextmenu', event => { if (active) event.preventDefault(); });
    window.addEventListener('keydown', event => {
      if (!active || document.activeElement !== canvas) return;
      if (KEYS.has(event.code)) {
        event.preventDefault();
        keys.add(event.code);
      } else if (event.code === 'KeyE' && !event.repeat) {
        event.preventDefault();
        interact();
      }
    });
    window.addEventListener('keyup', event => keys.delete(event.code));
    window.addEventListener('blur', clearInput);
    canvas.addEventListener('blur', clearInput);

    function draw(time) {
      if (!active) return;
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = time;
      yaw += (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * dt * 1.9;
      pitch = limit(pitch + (Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'))) * dt * 1.25, -0.65, 0.65);
      const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
      const right = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const speed = dt * 4.35 / (Math.hypot(forward, right) || 1);
      const nextX = x + (Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed;
      const nextZ = z + (-Math.cos(yaw) * forward + Math.sin(yaw) * right) * speed;
      if (!blocked(nextX, z)) x = nextX;
      if (!blocked(x, nextZ)) z = nextZ;
      updateTarget();

      const width = Math.min(960, Math.round(canvas.clientWidth));
      const height = Math.round(width * 0.58);
      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      camera.position.set(x, EYE, z);
      direction.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(direction.add(camera.position));
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    }

    function start() {
      if (active) return;
      active = true;
      lastTime = 0;
      canvas.focus({ preventScroll: true });
      updateTarget();
      frame = requestAnimationFrame(draw);
    }

    function stop() {
      active = false;
      cancelAnimationFrame(frame);
      clearInput();
      target = null;
      for (const highlight of highlights.values()) highlight.visible = false;
      onTarget?.(null);
    }

    return { start, stop, interact };
  };
})();
