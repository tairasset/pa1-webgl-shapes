(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('arena-canvas');
  const labels = { blaster: 'Blaster', scatter: 'Shotgun', rifle: 'Pulse rifle', marksman: 'Railgun' };
  const loadout = [...Object.keys(labels), 'cryo', 'pulse'];
  let arena, selected = 'blaster', lastWeapon, lastGadget, lastPhase;

  function showStatus(status) {
    if (lastWeapon !== status.weapon) {
      selected = lastWeapon = status.weapon;
      for (const button of document.querySelectorAll('[data-weapon]')) {
        button.setAttribute('aria-pressed', String(button.dataset.weapon === selected));
      }
      $('loadout-summary').textContent = 'Equipped: ' + labels[selected] + ' · Both gadgets included';
    }
    if (lastGadget !== status.gadget) {
      lastGadget = status.gadget;
      for (const button of document.querySelectorAll('[data-gadget]')) {
        button.setAttribute('aria-pressed', String(button.dataset.gadget === lastGadget));
      }
    }
    if (lastPhase !== status.phase) {
      lastPhase = status.phase;
      $('briefing').hidden = status.phase !== 'briefing';
      $('combat-controls').hidden = status.phase !== 'combat';
    }
  }

  function restart() {
    const keep = selected;
    $('results').hidden = true;
    lastPhase = null;
    arena.start(loadout);
    arena.equip(keep);
  }

  for (const button of document.querySelectorAll('[data-weapon]')) {
    button.addEventListener('click', () => {
      arena?.equip(button.dataset.weapon);
      canvas.focus({ preventScroll: true });
    });
  }
  for (const button of document.querySelectorAll('[data-gadget]')) {
    button.addEventListener('click', () => {
      arena?.chooseGadget(button.dataset.gadget);
      canvas.focus({ preventScroll: true });
    });
  }
  $('begin-round').addEventListener('click', () => arena?.beginRound());
  $('retry').addEventListener('click', restart);
  $('lock-mouse').addEventListener('click', async () => {
    const locked = await arena?.lockPointer();
    $('input-hint').textContent = locked ? 'Mouse look active. Esc releases the cursor.' : 'Drag the mouse or use arrow keys to look around.';
    canvas.focus({ preventScroll: true });
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) $('input-hint').textContent = 'Drag the mouse to look. Lock mouse enables free mouse look.';
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $('input-hint').textContent = 'Fullscreen is unavailable here. The game still works in this window.';
    }
    canvas.focus({ preventScroll: true });
  });
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    canvas.focus({ preventScroll: true });
  });
  window.addEventListener('pagehide', () => arena?.stop());

  try {
    arena = window.createArena(canvas, $('arena-hud'), text => {
      $('result-title').textContent = text;
      $('results').hidden = false;
      $('combat-controls').hidden = true;
      $('retry').focus({ preventScroll: true });
    }, () => {}, { environment: 'desert', onStatus: showStatus });
    restart();
    $('loading').hidden = true;
  } catch (error) {
    $('loading').textContent = 'The desert could not load. Check your connection and reload the page.';
    console.error(error);
  }
})();
