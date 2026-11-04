(() => {
  'use strict';
  const recipes = [
    { id: 'blaster', icon: 'gun', name: 'Blaster', copper: 2, charge: 1, info: 'Fast, accurate shots.' },
    { id: 'scatter', icon: 'gun', name: 'Shotgun', copper: 3, charge: 2, info: 'Fires several pellets at once.' },
    { id: 'cryo', icon: 'cryo', name: 'Cryo capsule', copper: 1, charge: 2, info: 'Slows robots in the affected area.' },
    { id: 'pulse', icon: 'pulse', name: 'Pulse grenade', copper: 2, charge: 2, info: 'Damages groups of robots.' }
  ];
  const $ = id => document.getElementById(id);
  const feedback = $('lab-feedback');
  const stock = { copper: 0, charge: 0 };
  const supplies = { copper: 0, charge: 0 };
  const made = new Set();
  let collected = false;
  const gear = new Set();
  const loadout = new Set();
  const buttons = new Map();
  const stationLabels = {
    supply: 'Supply station · pick up raw materials',
    copper: 'Copper station · make copper powder',
    charge: 'Power cell station · make a batch',
    bench: 'Workbench · open recipes',
    arena: 'Exit · enter the arena'
  };
  let arena;
  let workshop;
  function onRoundEnd(result) {
    $('arena-result').textContent = result;
    $('arena-actions').hidden = false;
    $('retry').focus();
  }
  const canCraft = item => stock.copper >= item.copper && stock.charge >= item.charge;
  const hasWeapon = () => loadout.has('blaster') || loadout.has('scatter');

  function updateLab() {
    $('stock-copper').textContent = stock.copper;
    $('stock-charge').textContent = stock.charge;
    $('stock-gear').textContent = gear.size + ' / ' + recipes.length;
    $('arena-tab').disabled = !hasWeapon();
    $('start').disabled = !hasWeapon();
    $('lab-objective').textContent = hasWeapon() ? 'Step 4 of 4 · Enter the arena when ready.' :
      made.size === 2 ? 'Step 3 of 4 · Craft a weapon at the workbench and take it.' :
      collected ? 'Step 2 of 4 · Make copper powder and power cells at the two stations.' :
      'Step 1 of 4 · Pick up raw materials from the supply station.';
    for (const item of recipes) {
      const button = buttons.get(item.id);
      const ready = gear.has(item.id);
      const carried = loadout.has(item.id);
      button.disabled = !ready && !canCraft(item);
      button.textContent = carried ? 'Leave' : ready ? 'Take' : 'Craft';
      button.setAttribute('aria-label', button.textContent + ': ' + item.name);
    }
  }

  for (const item of recipes) {
    const card = document.createElement('article');
    card.className = 'recipe';
    card.innerHTML = '<svg class="recipe-icon" aria-hidden="true"><use href="#' + item.icon +
      '"></use></svg><h3>' + item.name + '</h3><p>' + item.info +
      '</p><span class="cost">Copper ' + item.copper + ' · Cells ' + item.charge +
      '</span><button type="button">Craft</button>';
    const button = card.querySelector('button');
    button.addEventListener('click', () => {
      if ($('bench').hidden) return;
      if (!gear.has(item.id)) {
        if (!canCraft(item)) return;
        stock.copper -= item.copper;
        stock.charge -= item.charge;
        gear.add(item.id);
        feedback.textContent = 'Crafted: ' + item.name + '. Press Take to bring it into the arena.';
      } else if (loadout.delete(item.id)) {
        feedback.textContent = item.name + ' stays in the workshop.';
      } else {
        loadout.add(item.id);
        feedback.textContent = item.name + ' is in your loadout.' + (hasWeapon() ? ' The arena is open.' : '');
      }
      updateLab();
    });
    buttons.set(item.id, button);
    $('recipes').append(card);
  }

  function showTarget(id) {
    $('station-prompt').textContent = stationLabels[id] || 'Walk up to a station and aim at it.';
    $('station-action').disabled = !stationLabels[id];
  }

  function interactWithStation(id) {
    switch (id) {
      case 'supply':
        collected = true;
        supplies.copper += 2;
        supplies.charge += 3;
        feedback.textContent = 'Raw materials collected. Find the copper and power cell stations.';
        break;
      case 'copper':
      case 'charge':
        if (supplies[id] === 0) {
          feedback.textContent = 'This station is out of raw materials. Pick up more at the supply station.';
          return;
        }
        supplies[id]--;
        stock[id] += id === 'copper' ? 4 : 3;
        made.add(id);
        feedback.textContent = id === 'copper' ? 'Produced 4 units of copper powder.' : 'Produced 3 power cells.';
        break;
      case 'bench':
        $('bench').hidden = false;
        $('bench').scrollIntoView({ block: 'nearest' });
        ($('recipes').querySelector('button:enabled') || $('close-bench')).focus({ preventScroll: true });
        feedback.textContent = 'Choose an item, press Craft, then Take.';
        break;
      case 'arena':
        if (hasWeapon()) startArena();
        else feedback.textContent = 'Craft a weapon at the workbench and press Take.';
        break;
    }
    updateLab();
  }

  function focusWorkshop() {
    const canvas = $('workshop-canvas');
    canvas.scrollIntoView({ block: 'nearest' });
    canvas.focus({ preventScroll: true });
  }

  function showLab() {
    if ($('arena').hidden) return;
    arena.stop();
    $('arena').hidden = true;
    $('lab').hidden = false;
    $('lab-tab').setAttribute('aria-pressed', 'true');
    $('arena-tab').setAttribute('aria-pressed', 'false');
    window.scrollTo(0, 0);
    workshop?.start();
  }

  function startArena() {
    if (!hasWeapon()) return;
    if (!arena) {
      try {
        arena = window.createArena($('arena-canvas'), $('arena-hud'), onRoundEnd, () => {
          $('briefing').hidden = true;
        });
      } catch (error) {
        feedback.textContent = 'The 3D arena could not start. Check your internet connection and enable hardware acceleration in your browser.';
        console.error(error);
        return;
      }
    }
    $('arena-actions').hidden = true;
    $('briefing').hidden = false;
    $('arena-result').textContent = '';
    $('arena').hidden = false;
    $('lab').hidden = true;
    $('bench').hidden = true;
    workshop?.stop();
    $('lab-tab').setAttribute('aria-pressed', 'false');
    $('arena-tab').setAttribute('aria-pressed', 'true');
    window.scrollTo(0, 0);
    arena.start([...loadout]);
  }

  $('lab-tab').addEventListener('click', showLab);
  $('return').addEventListener('click', showLab);
  $('arena-tab').addEventListener('click', () => {
    if ($('arena').hidden) startArena();
  });
  $('start').addEventListener('click', startArena);
  $('retry').addEventListener('click', startArena);
  $('begin-round').addEventListener('click', () => {
    $('arena-canvas').focus({ preventScroll: true });
    arena?.beginRound();
  });
  $('lock-mouse').addEventListener('click', async () => {
    const locked = await arena?.lockPointer();
    $('arena-input').textContent = locked
      ? 'Mouse locked. Press Esc to release the cursor.'
      : 'Drag with either mouse button or use the arrow keys to turn.';
  });
  document.addEventListener('pointerlockchange', () => {
    if (!$('arena').hidden && document.pointerLockElement !== $('arena-canvas')) {
      $('arena-input').textContent = 'Mouse unlocked. Drag or use the arrow keys to turn.';
    }
  });
  $('station-action').addEventListener('click', () => {
    focusWorkshop();
    workshop?.interact();
  });
  $('close-bench').addEventListener('click', () => {
    $('bench').hidden = true;
    focusWorkshop();
  });
  $('workshop-canvas').addEventListener('pointerdown', () => { $('bench').hidden = true; });
  updateLab();
  try {
    workshop = window.createWorkshop($('workshop-canvas'), interactWithStation, showTarget);
    workshop.start();
  } catch (error) {
    feedback.textContent = 'The workshop could not load. Open it in Chrome and check your internet connection and hardware acceleration.';
    console.error(error);
  }
})();
