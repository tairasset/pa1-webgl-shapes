(function () {
  'use strict';

  const WIDTH = 960;
  const HEIGHT = 600;
  const WAVES = 3;
  const PLAYER_RADIUS = 16;
  const EYE_HEIGHT = 44;
  const SPAWN_RADIUS_X = WIDTH / 2 - 36;
  const SPAWN_RADIUS_Y = HEIGHT / 2 - 36;
  const weapons = {
    blaster: { label: 'Blaster', delay: 0.18, damage: 22, speed: 770, life: 0.85, angles: [0], color: '#ffcf6f' },
    scatter: { label: 'Shotgun', delay: 0.55, damage: 18, speed: 630, life: 0.32, angles: [-0.24, -0.12, 0, 0.12, 0.24], color: '#fb9d75' }
  };
  const gadgets = {
    cryo: { label: 'Cryo capsule', radius: 113, color: '#83def5' },
    pulse: { label: 'Pulse grenade', radius: 91, color: '#ffd785' }
  };
  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
  const action = new Set(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyE', 'KeyG', 'KeyQ', 'Space']);
  const limit = (value, min, max) => Math.min(max, Math.max(min, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  window.createArena = function (canvas, hud, onEnd, onBegin) {
    const view = window.createArenaView(canvas, { width: WIDTH, height: HEIGHT });
    const held = new Set();
    let firing = false;
    let pointer = null;
    let yaw = 0;
    let pitch = 0;
    let state = null;
    let frame = 0;
    let previousTime = null;
    let active = false;

    function clearInput() {
      held.clear();
      firing = false;
      pointer = null;
    }

    function stop() {
      active = false;
      cancelAnimationFrame(frame);
      clearInput();
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }

    function look(horizontal, vertical) {
      yaw = (yaw + horizontal) % (2 * Math.PI);
      pitch = limit(pitch + vertical, -0.85, 0.85);
    }

    window.addEventListener('mousemove', event => {
      if (active && document.pointerLockElement === canvas) {
        look(event.movementX * 0.0027, -event.movementY * 0.0027);
      }
    });
    canvas.addEventListener('pointerdown', event => {
      if (!active || (event.button !== 0 && event.button !== 2)) return;
      canvas.focus({ preventScroll: true });
      if (document.pointerLockElement === canvas) {
        if (event.button === 0) {
          firing = true;
          fireIfReady();
        }
        return;
      }
      if (pointer) return;
      pointer = { id: event.pointerId, button: event.button, x: event.clientX, y: event.clientY, moved: false };
    });
    window.addEventListener('pointermove', event => {
      if (!active || pointer?.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.moved && Math.hypot(dx, dy) < 4) return;
      pointer.moved = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      look(dx * 0.005, -dy * 0.005);
    });
    canvas.addEventListener('contextmenu', event => { if (active) event.preventDefault(); });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== canvas) {
        clearInput();
      } else if (!active) {
        document.exitPointerLock();
      }
    });
    window.addEventListener('pointerup', event => {
      if (event.button === 0) firing = false;
      if (pointer?.id !== event.pointerId || pointer.button !== event.button) return;
      const shouldFire = !pointer.moved && pointer.button === 0 && event.target === canvas;
      pointer = null;
      if (shouldFire) fireIfReady();
    });
    window.addEventListener('pointercancel', clearInput);
    window.addEventListener('blur', clearInput);
    canvas.addEventListener('blur', clearInput);

    window.addEventListener('keydown', event => {
      if (!active || document.activeElement !== canvas || (!movement.has(event.code) && !action.has(event.code))) return;
      event.preventDefault();
      if (state.phase === 'briefing' && event.code === 'Space') {
        if (!event.repeat) beginRound();
        return;
      }
      if (movement.has(event.code) || event.code === 'Space') {
        held.add(event.code);
        return;
      }
      if (event.repeat) return;
      if (event.code === 'Digit1' && state.loadout.includes('blaster')) state.weapon = 'blaster';
      if (event.code === 'Digit2' && state.loadout.includes('scatter')) state.weapon = 'scatter';
      if (event.code === 'KeyE' && state.phase === 'briefing' && state.aimedWeapon) state.weapon = state.aimedWeapon;
      if (event.code === 'Digit3' && state.loadout.includes('cryo')) state.gadget = 'cryo';
      if (event.code === 'Digit4' && state.loadout.includes('pulse')) state.gadget = 'pulse';
      if (event.code === 'KeyQ' && state.gadgetOrder.length > 1) {
        state.gadget = state.gadgetOrder.find(id => id !== state.gadget);
      }
      if (event.code === 'KeyG') throwGadget();
    });
    window.addEventListener('keyup', event => { held.delete(event.code); });

    function spawnWave(angleOffset = Math.random() * Math.PI * 2) {
      state.wave += 1;
      const count = 2 + state.wave * 2;
      state.robots = Array.from({ length: count }, (_, index) => {
        const angle = angleOffset + index * Math.PI * 2 / count;
        const heavy = state.wave > 1 && index % 3 === 0;
        const maxHealth = heavy ? 106 : 55 + 5 * state.wave;
        return {
          x: WIDTH / 2 + Math.cos(angle) * SPAWN_RADIUS_X,
          y: HEIGHT / 2 + Math.sin(angle) * SPAWN_RADIUS_Y,
          radius: heavy ? 22 : 16, speed: heavy ? 59 : 66 + 7 * state.wave,
          health: maxHealth, maxHealth, heavy, heading: 0, slowed: 0
        };
      });
      for (const id of state.gadgetOrder) state.charges[id] = 2;
    }

    function start(loadout) {
      stop();
      const chosen = [...new Set(Array.isArray(loadout) ? loadout : [])];
      const availableWeapons = Object.keys(weapons).filter(id => chosen.includes(id));
      if (!availableWeapons.length) {
        chosen.push('blaster');
        availableWeapons.push('blaster');
      }
      const gadgetOrder = Object.keys(gadgets).filter(id => chosen.includes(id));
      const weaponChoices = availableWeapons.map((id, index) => {
        const angle = (index - (availableWeapons.length - 1) / 2) * 1.14;
        return { id, label: weapons[id].label, x: WIDTH / 2 + 73 * Math.cos(angle), y: HEIGHT / 2 + 73 * Math.sin(angle) };
      });
      state = {
        phase: 'briefing', weaponChoices, aimedWeapon: null,
        loadout: chosen, weapon: availableWeapons[0], gadget: gadgetOrder[0], gadgetOrder, charges: {},
        player: { x: WIDTH / 2, y: HEIGHT / 2, health: 100, invulnerable: 0 },
        robots: [], shots: [], throws: [], effects: [], wave: 0, nextWave: 0,
        shotCooldown: 0, throwCooldown: 0, kills: 0
      };
      previousTime = null;
      yaw = 0;
      pitch = 0;
      active = true;
      canvas.focus({ preventScroll: true });
      draw();
      frame = requestAnimationFrame(loop);
    }

    function beginRound() {
      if (!active || state.phase !== 'briefing') return false;
      state.phase = 'combat';
      const firstSpawn = Math.atan2(Math.sin(yaw) / SPAWN_RADIUS_Y, Math.cos(yaw) / SPAWN_RADIUS_X);
      spawnWave(firstSpawn);
      onBegin?.();
      canvas.focus({ preventScroll: true });
      return true;
    }

    function updateAimedWeapon() {
      const player = state.player;
      let nearestDot = Math.cos(0.2);
      state.aimedWeapon = null;
      if (Math.abs(pitch) > 0.35) return;
      for (const choice of state.weaponChoices) {
        const gap = distance(choice, player);
        if (gap < 5 || gap > 150) continue;
        const dot = ((choice.x - player.x) * Math.cos(yaw) + (choice.y - player.y) * Math.sin(yaw)) / gap;
        if (dot > nearestDot) {
          nearestDot = dot;
          state.aimedWeapon = choice.id;
        }
      }
    }

    function fire(angle) {
      const gun = weapons[state.weapon];
      const player = state.player;
      state.shotCooldown = gun.delay;
      for (const offset of gun.angles) {
        const heading = angle + offset;
        const forwardSpeed = gun.speed * Math.cos(pitch);
        state.shots.push({
          x: player.x + 8 * Math.cos(heading), y: player.y + 8 * Math.sin(heading),
          height: EYE_HEIGHT + 8 * Math.tan(pitch), rise: gun.speed * Math.sin(pitch),
          vx: forwardSpeed * Math.cos(heading), vy: forwardSpeed * Math.sin(heading),
          life: gun.life, damage: gun.damage, color: gun.color
        });
      }
    }

    function fireIfReady() {
      if (active && state.phase === 'combat' && state.shotCooldown <= 0) fire(yaw);
    }

    function lockPointer() {
      if (!active || typeof canvas.requestPointerLock !== 'function') return Promise.resolve(false);
      if (document.pointerLockElement === canvas) return Promise.resolve(true);
      canvas.focus({ preventScroll: true });
      return new Promise(resolve => {
        function finish() {
          clearTimeout(timeout);
          document.removeEventListener('pointerlockchange', finish);
          document.removeEventListener('pointerlockerror', finish);
          resolve(document.pointerLockElement === canvas);
        }
        const timeout = setTimeout(finish, 1200);
        document.addEventListener('pointerlockchange', finish);
        document.addEventListener('pointerlockerror', finish);
        try { canvas.requestPointerLock()?.catch(finish); }
        catch { finish(); }
      });
    }

    function throwGadget() {
      const id = state.gadget;
      if (!id || !state.charges[id] || state.throwCooldown > 0) return;
      const player = state.player;
      const reach = limit(265 + pitch * 230, 75, 375);
      state.charges[id] -= 1;
      state.throwCooldown = 0.35;
      state.throws.push({
        id, x: player.x, y: player.y, elapsed: 0,
        targetX: limit(player.x + Math.cos(yaw) * reach, 5, WIDTH - 5),
        targetY: limit(player.y + Math.sin(yaw) * reach, 5, HEIGHT - 5)
      });
    }

    function advanceThrows(dt) {
      state.throws = state.throws.filter(item => {
        item.elapsed += dt;
        if (item.elapsed < 0.48) return true;
        const center = { x: item.targetX, y: item.targetY };
        const gadget = gadgets[item.id];
        const duration = item.id === 'cryo' ? 3.5 : 0.45;
        state.effects.push({ ...center, id: item.id, ...gadget, life: duration, duration });
        if (item.id === 'pulse') {
          for (const robot of state.robots) {
            if (distance(center, robot) < gadget.radius + robot.radius) robot.health -= 72;
          }
        }
        return false;
      });
      for (const effect of state.effects) effect.life -= dt;
      state.effects = state.effects.filter(effect => effect.life > 0);
    }

    function advanceShots(dt) {
      state.shots = state.shots.filter(shot => {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        shot.height += shot.rise * dt;
        shot.life -= dt;
        if (shot.life <= 0 || shot.height <= 0 || shot.x < 0 || shot.x > WIDTH || shot.y < 0 || shot.y > HEIGHT) return false;
        const hit = state.robots.find(robot =>
          robot.health > 0 && shot.height < robot.radius * 3.2 && distance(shot, robot) < robot.radius + 3);
        if (!hit) return true;
        hit.health -= shot.damage;
        return false;
      });
    }

    function advanceRobots(dt) {
      const player = state.player;
      const live = state.robots.filter(robot => robot.health > 0);
      state.kills += state.robots.length - live.length;
      state.robots = live;

      for (const robot of live) {
        const gap = distance(player, robot);
        if (state.effects.some(effect => effect.id === 'cryo' && distance(effect, robot) < effect.radius + robot.radius)) {
          robot.slowed = 0.4;
        } else robot.slowed -= dt;
        robot.heading = Math.atan2(player.y - robot.y, player.x - robot.x);
        const step = Math.min(gap, dt * robot.speed * (robot.slowed > 0 ? 0.37 : 1));
        robot.x += step * Math.cos(robot.heading);
        robot.y += step * Math.sin(robot.heading);
        for (const other of live) {
          if (other === robot) continue;
          const separation = distance(robot, other);
          const overlap = robot.radius + other.radius - separation;
          if (overlap <= 0 || separation <= 0.001) continue;
          robot.x += (robot.x - other.x) / separation * overlap * 0.3;
          robot.y += (robot.y - other.y) / separation * overlap * 0.3;
        }
        robot.x = limit(robot.x, robot.radius, WIDTH - robot.radius);
        robot.y = limit(robot.y, robot.radius, HEIGHT - robot.radius);
        if (distance(player, robot) < robot.radius + PLAYER_RADIUS && player.invulnerable <= 0) {
          player.health = Math.max(0, player.health - (robot.heavy ? 23 : 15));
          player.invulnerable = 0.62;
        }
      }
    }

    function finish(won) {
      stop();
      const text = won ? 'Arena cleared!' : 'Round ended.';
      onEnd?.(`${text} Robots disabled: ${state.kills}.`);
    }

    function advance(dt) {
      const player = state.player;
      look((Number(held.has('ArrowRight')) - Number(held.has('ArrowLeft'))) * 1.85 * dt,
        (Number(held.has('ArrowUp')) - Number(held.has('ArrowDown'))) * 1.2 * dt);
      const sideways = Number(held.has('KeyD')) - Number(held.has('KeyA'));
      const forwards = Number(held.has('KeyW')) - Number(held.has('KeyS'));
      const dx = Math.cos(yaw) * forwards - Math.sin(yaw) * sideways;
      const dy = Math.sin(yaw) * forwards + Math.cos(yaw) * sideways;
      const speed = 205 * dt / (Math.hypot(forwards, sideways) || 1);
      player.x = limit(player.x + dx * speed, PLAYER_RADIUS + 8, WIDTH - PLAYER_RADIUS - 8);
      player.y = limit(player.y + dy * speed, PLAYER_RADIUS + 8, HEIGHT - PLAYER_RADIUS - 8);
      if (state.phase === 'briefing') {
        updateAimedWeapon();
        return;
      }
      player.invulnerable -= dt;
      state.shotCooldown -= dt;
      state.throwCooldown -= dt;
      if (firing || held.has('Space')) fireIfReady();
      advanceThrows(dt);
      advanceShots(dt);
      advanceRobots(dt);
      if (player.health === 0) return finish(false);
      if (state.robots.length) return;
      if (state.wave === WAVES) return finish(true);
      if (state.nextWave === 0) state.nextWave = 1.6;
      state.nextWave -= dt;
      if (state.nextWave <= 0) {
        state.nextWave = 0;
        spawnWave();
      }
    }

    function draw(time = performance.now()) {
      view.draw(state, yaw, pitch, time);
      if (state.phase === 'briefing') {
        const aimed = state.aimedWeapon ? ` · E: equip ${weapons[state.aimedWeapon].label}` : '';
        const status = `Briefing · Equipped: ${weapons[state.weapon].label}${aimed} · 1/2: weapons · Space: start round`;
        if (hud.textContent !== status) hud.textContent = status;
        return;
      }
      const player = state.player;
      const gadget = state.gadget ? `${gadgets[state.gadget].label} ×${state.charges[state.gadget]}` : 'No gadgets';
      const wave = state.nextWave > 0 ? 'Next wave…' : `Wave ${state.wave}/${WAVES} · Robots ${state.robots.length}`;
      const status = `Health ${player.health}% · ${wave} · ${weapons[state.weapon].label} · ${gadget}`;
      if (hud.textContent !== status) hud.textContent = status;
    }

    function loop(time) {
      if (!active) return;
      const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.035);
      previousTime = time;
      advance(dt);
      draw(time);
      if (active) frame = requestAnimationFrame(loop);
    }

    return { start, stop, lockPointer, beginRound };
  };
})();
