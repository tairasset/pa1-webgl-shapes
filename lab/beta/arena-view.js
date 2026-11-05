(function () {
  'use strict';

  const SCALE = 0.04;
  const EYE_HEIGHT = 44 * SCALE;
  const THROW_DURATION = 0.48;

  window.createArenaView = function (canvas, { width, height, environment = 'indoor' }) {
    const T = window.AFRAME?.THREE;
    if (!T) throw new Error('The 3D library did not load. Check your internet connection and reload.');

    const renderer = new T.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x171e1b);

    const desert = environment === 'desert';
    const scene = new T.Scene();
    scene.fog = new T.Fog(desert ? 0xe8ad78 : 0x171e1b, desert ? 20 : 19, desert ? 150 : 44);
    const camera = new T.PerspectiveCamera(67, width / height, 0.07, desert ? 380 : 75);
    scene.add(camera);

    const ambient = new T.HemisphereLight(desert ? 0xffe2bc : 0xd5e6ec, desert ? 0x876650 : 0x555046, desert ? 1.45 : 2);
    const key = new T.DirectionalLight(0xffe5c7, 2.1);
    key.position.set(-5, 12, -8);
    const fill = new T.DirectionalLight(0x8ab0c2, 0.9);
    fill.position.set(12, 5, 9);
    scene.add(ambient, key, fill);

    const unitBox = new T.BoxGeometry();
    const unitCircle = new T.CircleGeometry(1, 36).rotateX(-Math.PI / 2);
    const unitRing = new T.RingGeometry(0.97, 1, 40).rotateX(-Math.PI / 2);
    const sphere = new T.IcosahedronGeometry(1, 1);
    const standard = (color, roughness = 0.7) => new T.MeshStandardMaterial({ color, roughness });
    const flat = color => new T.MeshBasicMaterial({ color });
    const floorMat = standard(0x303b38);
    const wall = standard(0x444e48);
    const steel = standard(0x263332, 0.46);
    const lightSteel = standard(0x6d7875, 0.45);
    const amber = flat(0xe9b86a);
    const warmLight = flat(0xffe4a0);
    const dark = flat(0x141c1b);
    const copper = standard(0xbb6447, 0.45);
    const heavyCopper = standard(0x893e34, 0.54);
    const icy = standard(0x55b6ca, 0.34);
    const visor = flat(0xffb271);
    const coldVisor = flat(0xb0edff);
    const barMat = flat(0xf08b59);
    const selectedLight = flat(0xe6f5ae);

    function part(parent, material, x, y, z, w, h, d) {
      const object = new T.Mesh(unitBox, material);
      object.position.set(x, y, z);
      object.scale.set(w, h, d);
      parent.add(object);
      return object;
    }

    const worldWidth = width * SCALE;
    const worldDepth = height * SCALE;
    const midX = worldWidth / 2;
    const midZ = worldDepth / 2;
    const hallHeight = 5.6;
    if (desert) {
      if (typeof window.createDesertLandscape !== 'function') throw new Error('The desert landscape did not load. Reload the page.');
      const landscape = window.createDesertLandscape();
      landscape.position.set(midX, 0, midZ);
      scene.add(landscape);
      // Boundary rails match the playable area's edges while leaving the mountains visible.
      const fence = standard(0x66564a, 0.88);
      for (const edgeZ of [0.18, worldDepth - 0.18]) {
        part(scene, fence, midX, 0.56, edgeZ, worldWidth, 0.075, 0.08);
        for (let x = 0.4; x < worldWidth; x += 3.8) {
          part(scene, fence, x, 0.56, edgeZ, 0.15, 1.12, 0.15);
          part(scene, amber, x, 1.05, edgeZ, 0.18, 0.08, 0.18);
        }
      }
      for (const edgeX of [0.18, worldWidth - 0.18]) {
        part(scene, fence, edgeX, 0.56, midZ, 0.08, 0.075, worldDepth);
        for (let z = 0.4; z < worldDepth; z += 3.8) {
          part(scene, fence, edgeX, 0.56, z, 0.15, 1.12, 0.15);
          part(scene, amber, edgeX, 1.05, z, 0.18, 0.08, 0.18);
        }
      }
    } else {
    part(scene, floorMat, midX, -0.12, midZ, worldWidth, 0.24, worldDepth);
    part(scene, wall, midX, hallHeight / 2, 0, worldWidth, hallHeight, 0.30);
    part(scene, wall, midX, hallHeight / 2, worldDepth, worldWidth, hallHeight, 0.30);
    part(scene, wall, 0, hallHeight / 2, midZ, 0.30, hallHeight, worldDepth);
    part(scene, wall, worldWidth, hallHeight / 2, midZ, 0.30, hallHeight, worldDepth);
    part(scene, steel, midX, hallHeight, midZ, worldWidth, 0.24, worldDepth);

    const gridVertices = [];
    for (let x = 2; x < worldWidth; x += 2) gridVertices.push(x, .012, 0, x, .012, worldDepth);
    for (let z = 2; z < worldDepth; z += 2) gridVertices.push(0, .012, z, worldWidth, .012, z);
    const gridGeometry = new T.BufferGeometry();
    gridGeometry.setAttribute('position', new T.Float32BufferAttribute(gridVertices, 3));
    scene.add(new T.LineSegments(gridGeometry, new T.LineBasicMaterial({ color: 0x48554f })));

    for (const z of [0.22, worldDepth - 0.22]) {
      part(scene, amber, midX, 0.12, z, worldWidth, 0.08, 0.05);
      for (let x = 2; x < worldWidth; x += 4.9) {
        part(scene, steel, x, 2.6, z, 0.38, 5.2, 0.35);
        part(scene, warmLight, x, 4.3, z === 0.22 ? 0.42 : worldDepth - 0.42, 0.09, 1.0, 0.03);
      }
    }
    for (const x of [0.22, worldWidth - 0.22]) {
      part(scene, amber, x, 0.12, midZ, 0.05, 0.08, worldDepth);
      for (let z = 2; z < worldDepth; z += 4.9) {
        part(scene, steel, x, 2.6, z, 0.35, 5.2, 0.38);
        part(scene, warmLight, x === 0.22 ? 0.42 : worldWidth - 0.42, 4.3, z, 0.03, 1.0, 0.09);
      }
    }
    for (const x of [8, 17, 26, 35]) {
      part(scene, lightSteel, x, hallHeight - 0.25, midZ, 0.38, 0.33, worldDepth);
      for (const z of [5.5, worldDepth - 5.5]) part(scene, warmLight, x, hallHeight - 0.43, z, 0.15, 0.04, 4.0);
    }
    for (const x of [1.1, worldWidth - 1.1]) part(scene, amber, x, 0.025, midZ, 0.07, 0.02, worldDepth - 2.2);
    for (const z of [1.1, worldDepth - 1.1]) part(scene, amber, midX, 0.025, z, worldWidth - 2.2, 0.02, 0.07);
    }
    const startRing = new T.Mesh(unitRing, amber);
    startRing.position.set(midX, 0.025, midZ);
    startRing.scale.set(2.1, 1, 2.1);
    scene.add(startRing);

    function makeRobot() {
      const group = new T.Group();
      scene.add(group);
      const plating = [
        part(group, copper, 0, 1.06, 0, 0.91, 1.02, 0.83),
        part(group, copper, 0.04, 1.77, 0, 0.82, 0.50, 0.78),
        part(group, copper, 0.03, 1.20, 0.55, 0.51, 0.54, 0.19),
        part(group, copper, 0.03, 1.20, -0.55, 0.51, 0.54, 0.19)
      ];
      part(group, lightSteel, 0.49, 1.14, 0, 0.09, 0.53, 0.61);
      const eye = part(group, visor, 0.47, 1.81, 0, 0.04, 0.12, 0.58);
      part(group, steel, 0.04, 2.07, 0.23, 0.09, 0.20, 0.09);
      const legs = [0.25, -0.25].map(z => {
        const leg = new T.Group();
        leg.position.set(0, 0.65, z);
        part(leg, steel, 0, -0.23, 0, 0.26, 0.45, 0.26);
        part(leg, lightSteel, 0.07, -0.49, 0, 0.42, 0.16, 0.34);
        group.add(leg);
        return leg;
      });
      const health = new T.Group();
      part(health, dark, 0, 0, 0, 0.98, 0.065, 0.025);
      const meter = part(health, barMat, 0, 0, 0.017, 0.94, 0.04, 0.010);
      scene.add(health);
      return { group, plating, eye, legs, health, meter };
    }

    function makeMarker() {
      const group = new T.Group();
      const material = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false });
      const disc = new T.Mesh(unitCircle, material);
      const rim = new T.Mesh(unitRing, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      rim.position.y = 0.012;
      group.add(disc, rim);
      scene.add(group);
      return { group, disc, rim };
    }

    const robotPool = [];
    const bulletPool = [];
    const throwPool = [];
    const effectPool = [];
    const weaponDisplays = new Map();
    const lightMaterials = new Map();

    function glow(color) {
      if (!lightMaterials.has(color)) lightMaterials.set(color, flat(color));
      return lightMaterials.get(color);
    }

    function orb() {
      const group = new T.Mesh(sphere, warmLight);
      scene.add(group);
      return { group };
    }

    function sync(pool, list, make, update) {
      list.forEach((item, i) => {
        if (!pool[i]) pool[i] = make();
        pool[i].group.visible = true;
        if (pool[i].health) pool[i].health.visible = true;
        update(pool[i], item, i);
      });
      for (let i = list.length; i < pool.length; i++) {
        pool[i].group.visible = false;
        if (pool[i].health) pool[i].health.visible = false;
      }
    }

    const rifleColor = standard(0x587b73, 0.48);
    const marksmanColor = standard(0x807b59, 0.54);
    function weaponModel(id) {
      const model = new T.Group();
      const wide = id === 'scatter';
      const long = id === 'rifle' || id === 'marksman';
      const bodyMat = wide ? heavyCopper : id === 'rifle' ? rifleColor : id === 'marksman' ? marksmanColor : copper;
      part(model, bodyMat, 0, 0, 0.01, wide ? .33 : .25, .23, long ? .78 : .58);
      part(model, steel, 0, -.17, .12, .14, .26, .16);
      part(model, lightSteel, 0, .115, -.1, .20, .065, long ? .7 : .42);
      if (wide) {
        // The shotgun has two separate wide barrels and a broad foregrip.
        for (const x of [-.105, .105]) part(model, lightSteel, x, .015, -.49, .13, .14, .52);
        part(model, steel, 0, -.055, -.31, .34, .13, .25);
      } else {
        part(model, id === 'blaster' ? amber : steel, 0, .015, long ? -.63 : -.42,
          id === 'blaster' ? .16 : .10, .12, id === 'marksman' ? .84 : long ? .58 : .32);
      }
      if (long) {
        part(model, bodyMat, 0, -.025, .49, .17, .25, .3);
        part(model, steel, 0, -.19, -.10, .12, .26, .19);
      }
      if (id === 'marksman') {
        part(model, steel, 0, .26, -.11, .13, .15, .40);
        part(model, icy, 0, .26, -.32, .105, .105, .025);
      } else if (id === 'rifle') {
        part(model, selectedLight, .133, .025, -.03, .025, .055, .35);
        part(model, steel, 0, .21, -.04, .10, .13, .12);
      } else part(model, amber, .135, .02, .02, .026, .04, .19);
      return model;
    }

    const gun = new T.Group();
    camera.add(gun);
    const heldModels = new Map(['blaster', 'scatter', 'rifle', 'marksman'].map(id => {
      const model = weaponModel(id);
      gun.add(model);
      return [id, model];
    }));
    const flash = new T.Mesh(sphere, warmLight);
    flash.position.set(0, 0.02, -0.55);
    gun.add(flash);
    const previousPlayer = new T.Vector2();
    const forward = new T.Vector3();

    function weaponDisplay(choice) {
      const group = new T.Group();
      group.position.set(choice.x * SCALE, 0, choice.y * SCALE);
      scene.add(group);
      part(group, steel, 0, 0.55, 0, 0.88, 1.1, 0.88);
      part(group, lightSteel, 0, 1.15, 0, 1.0, 0.1, 1.0);
      const band = part(group, amber, 0, 1.08, 0, 0.96, 0.065, 0.96);
      const model = weaponModel(choice.id);
      group.add(model);
      const pickVolume = new T.Mesh(unitBox, new T.MeshBasicMaterial({ visible: false }));
      pickVolume.position.y = 1.15;
      pickVolume.scale.set(1.35, 2.3, 1.35);
      group.add(pickVolume);
      group.userData.weaponId = choice.id;
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 320;
      labelCanvas.height = 72;
      const ink = labelCanvas.getContext('2d');
      ink.fillStyle = '#182423';
      ink.fillRect(0, 0, 320, 72);
      ink.fillStyle = '#e7c886';
      ink.fillRect(0, 68, 320, 4);
      ink.fillStyle = '#fff4db';
      ink.font = '600 31px system-ui, sans-serif';
      ink.textAlign = 'center';
      ink.textBaseline = 'middle';
      ink.fillText(`${choice.key || (choice.id === 'scatter' ? '2' : '1')} · ${choice.label}`, 160, 36, 300);
      const labelTexture = new T.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = T.SRGBColorSpace;
      const label = new T.Sprite(new T.SpriteMaterial({ map: labelTexture, toneMapped: false }));
      label.position.y = 2.18;
      label.scale.set(1.72, 0.39, 1);
      group.add(label);
      return { group, model, band };
    }

    function drawWeaponChoices(state, time) {
      const briefing = state.phase === 'briefing';
      for (const display of weaponDisplays.values()) display.group.visible = false;
      if (!briefing) {
        startRing.scale.set(2.1, 1, 2.1);
        return;
      }
      startRing.scale.set(desert ? 4 : 2.92, 1, desert ? 4 : 2.92);
      for (const choice of state.weaponChoices) {
        if (!weaponDisplays.has(choice.id)) weaponDisplays.set(choice.id, weaponDisplay(choice));
        const display = weaponDisplays.get(choice.id);
        display.group.visible = true;
        display.group.position.set(choice.x * SCALE, 0, choice.y * SCALE);
        display.band.material = state.weapon === choice.id || state.aimedWeapon === choice.id ? selectedLight : amber;
        display.model.position.y = 1.7 + Math.sin(time * 0.003) * 0.09;
        display.model.rotation.y = time * 0.0013;
      }
    }

    function draw(state, yaw, pitch, time) {
      const renderWidth = Math.max(1, Math.round(canvas.clientWidth || width));
      const renderHeight = Math.max(1, Math.round(canvas.clientHeight || height));
      const actualSize = renderer.getSize(renderSize);
      if (actualSize.x !== renderWidth || actualSize.y !== renderHeight) {
        renderer.setSize(renderWidth, renderHeight, false);
        camera.aspect = renderWidth / renderHeight;
        camera.updateProjectionMatrix();
      }
      const { player } = state;
      const px = player.x * SCALE;
      const pz = player.y * SCALE;
      const moving = previousPlayer.distanceToSquared({ x: px, y: pz }) > 0.000005;
      previousPlayer.set(px, pz);
      camera.position.set(px, EYE_HEIGHT, pz);
      const horizontal = Math.cos(pitch);
      forward.set(Math.cos(yaw) * horizontal, Math.sin(pitch), Math.sin(yaw) * horizontal).add(camera.position);
      camera.lookAt(forward);
      drawWeaponChoices(state, time);

      sync(robotPool, state.robots, makeRobot, (model, robot, i) => {
        const { group, plating, eye, legs, health, meter } = model;
        const size = robot.radius / 16;
        const chilled = robot.slowed > 0;
        group.position.set(robot.x * SCALE, 0, robot.y * SCALE);
        group.rotation.y = -robot.heading;
        group.scale.setScalar(size);
        for (const mesh of plating) mesh.material = chilled ? icy : robot.heavy ? heavyCopper : copper;
        eye.material = chilled ? coldVisor : visor;
        const gait = Math.sin(time * (chilled ? .003 : .012) + i);
        legs[0].rotation.z = gait * 0.32;
        legs[1].rotation.z = -legs[0].rotation.z;
        health.position.set(group.position.x, 2.37 * size, group.position.z);
        health.quaternion.copy(camera.quaternion);
        const fraction = Math.max(0, robot.health / robot.maxHealth);
        meter.scale.x = 0.94 * fraction;
        meter.position.x = -(0.94 - meter.scale.x) / 2;
      });

      sync(effectPool, state.effects, makeMarker, ({ group, disc, rim }, effect) => {
        group.position.set(effect.x * SCALE, 0.036, effect.y * SCALE);
        const radius = effect.radius * SCALE;
        group.scale.set(radius, 1, radius);
        disc.material.color.set(effect.color);
        rim.material.color.set(effect.color);
        const progress = effect.life / effect.duration;
        disc.material.opacity = effect.id === 'cryo' ? 0.24 : progress * 0.45;
        rim.material.opacity = effect.id === 'cryo' ? 0.8 : progress;
      });
      sync(throwPool, state.throws, orb, ({ group }, item) => {
        const f = item.elapsed / THROW_DURATION;
        group.position.set(
          (item.x + (item.targetX - item.x) * f) * SCALE,
          EYE_HEIGHT * (1 - f) + Math.sin(Math.PI * f) * 1.85,
          (item.y + (item.targetY - item.y) * f) * SCALE
        );
        group.material = glow(item.id === 'cryo' ? '#83def5' : '#ffd785');
        group.scale.setScalar(0.14);
      });
      sync(bulletPool, state.shots, orb, ({ group }, shot) => {
        group.position.set(shot.x * SCALE, (shot.height ?? 44) * SCALE, shot.y * SCALE);
        group.material = glow(shot.color);
        group.scale.set(0.17, 0.045, 0.055);
        group.rotation.y = -Math.atan2(shot.vy, shot.vx);
      });

      gun.visible = state.phase !== 'briefing';
      for (const [id, model] of heldModels) model.visible = id === state.weapon;
      const delays = {blaster: .18, scatter: .55, rifle: .10, marksman: .95};
      const delay = delays[state.weapon] || .18;
      const recoil = Math.max(0, state.shotCooldown / delay) * .11;
      const bob = moving ? Math.sin(time * 0.015) * 0.024 : 0;
      gun.position.set(0.41 + bob, -0.37 - Math.abs(bob), -0.85 + recoil * 0.9);
      gun.rotation.x = recoil * 0.7;
      flash.position.z = state.weapon === 'marksman' ? -1.05 : state.weapon === 'rifle' ? -.94 : -.77;
      flash.visible = state.shotCooldown > delay - .045;
      flash.scale.setScalar(Math.min(.19, recoil * 1.8));
      renderer.render(scene, camera);
    }

    const renderSize = new T.Vector2();
    const picker = new T.Raycaster();
    const pointer = new T.Vector2();
    function pickWeapon(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.set((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2);
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      picker.setFromCamera(pointer, camera);
      const visible = [...weaponDisplays.values()].filter(display => display.group.visible).map(display => display.group);
      for (const hit of picker.intersectObjects(visible, true)) {
        let object = hit.object;
        while (object && !object.userData.weaponId) object = object.parent;
        if (object?.userData.weaponId) return object.userData.weaponId;
      }
      return null;
    }

    return { draw, pickWeapon };
  };
})();
