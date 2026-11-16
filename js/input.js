// Wejście: pady (Gamepad API) + zapasowo klawiatura.
// Każde źródło (pad lub zestaw klawiszy) może zająć jeden z dwóch slotów graczy.

const KB = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    collect: 'KeyF', elbow: 'KeyG', shoo: 'KeyH', dash: 'KeyR' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    collect: 'KeyK', elbow: 'KeyL', shoo: 'KeyJ', dash: 'KeyI' },
];
export const BUTTONS = ['collect', 'elbow', 'shoo', 'dash', 'start'];
const DEADZONE = 0.25;
const EMPTY = { mx: 0, my: 0, collect: false, elbow: false, shoo: false, dash: false, start: false };
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

export class Input {
  constructor() {
    this.keys = new Set();
    this.slots = [null, null];   // id źródła przypisanego do gracza
    this.state = {};
    this.prev = {};
    // gracz zdalny (gra online): wirtualne źródło 'net'
    this.netOn = false;
    this.remote = { mx: 0, my: 0, c: {} };   // c = liczniki wciśnięć przycisków
    this.netSeen = {};
    this.netPressed = {};
    this.onNetRumble = null;
    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (PREVENT.has(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  poll() {
    this.prev = this.state;
    const s = {};
    const k = this.keys;
    KB.forEach((m, i) => {
      s['kb' + i] = norm({
        mx: (k.has(m.right) ? 1 : 0) - (k.has(m.left) ? 1 : 0),
        my: (k.has(m.down) ? 1 : 0) - (k.has(m.up) ? 1 : 0),
        collect: k.has(m.collect), elbow: k.has(m.elbow),
        shoo: k.has(m.shoo), dash: k.has(m.dash),
        start: k.has('Enter') || k.has('Space'),
      });
    });
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const b = (i) => !!gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5);
      let mx = gp.axes[0] || 0, my = gp.axes[1] || 0;
      if (Math.hypot(mx, my) < DEADZONE) { mx = 0; my = 0; }
      if (b(14)) mx = -1; if (b(15)) mx = 1;       // krzyżak
      if (b(12)) my = -1; if (b(13)) my = 1;
      s['gp' + gp.index] = norm({
        mx, my,
        collect: b(0),            // A / krzyżyk
        elbow: b(1),              // B / kółko
        shoo: b(2),               // X / kwadrat
        dash: b(7) || b(5),       // RT lub RB
        start: b(9),              // Start / Options
      });
    }
    if (this.netOn) {
      // Wciśnięcia liczymy licznikami po stronie gościa — żadne nie zginie między pakietami
      const r = this.remote;
      for (const b of BUTTONS) {
        const n = +r.c?.[b] || 0;
        this.netPressed[b] = this.netSeen[b] !== undefined && n !== this.netSeen[b];
        this.netSeen[b] = n;
      }
      s.net = norm({ mx: clampAxis(r.mx), my: clampAxis(r.my), collect: false, elbow: false, shoo: false, dash: false, start: false });
    }
    this.state = s;
  }

  resetNet(on) {
    this.netOn = on;
    this.remote = { mx: 0, my: 0, c: {} };
    this.netSeen = {};
    this.netPressed = {};
  }

  sources() { return Object.keys(this.state); }
  isPad(id) { return !!id && id.startsWith('gp'); }
  pressed(id, btn) {
    if (id === 'net') return !!this.netPressed[btn];
    return !!this.state[id]?.[btn] && !this.prev[id]?.[btn];
  }
  anyPressed(id) { return BUTTONS.some((b) => this.pressed(id, b)); }
  connected(slot) { return !!this.slots[slot] && !!this.state[this.slots[slot]]; }

  // Stan dla gracza: ruch ciągły, przyciski jako "właśnie wciśnięto"
  forSlot(slot) {
    const id = this.slots[slot];
    const st = this.state[id];
    if (!st) return EMPTY;
    return {
      mx: st.mx, my: st.my,
      collect: this.pressed(id, 'collect'),
      elbow: this.pressed(id, 'elbow'),
      shoo: this.pressed(id, 'shoo'),
      dash: this.pressed(id, 'dash'),
      start: this.pressed(id, 'start'),
    };
  }

  label(slot) {
    const id = this.slots[slot];
    if (!id) return '';
    if (id === 'net') return 'online';
    return this.isPad(id) ? `Pad ${+id.slice(2) + 1}` : `Klawiatura ${+id.slice(2) + 1}`;
  }

  rumble(slot, strength = 0.6, ms = 180) {
    const id = this.slots[slot];
    if (id === 'net') { this.onNetRumble?.(strength, ms); return; }
    if (!this.isPad(id)) return;
    try {
      const gp = navigator.getGamepads()[+id.slice(2)];
      gp?.vibrationActuator?.playEffect?.('dual-rumble', {
        duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6,
      })?.catch?.(() => {});
    } catch { /* pad bez wibracji */ }
  }
}

const clampAxis = (v) => Math.max(-1, Math.min(1, +v || 0));

function norm(s) {
  const m = Math.hypot(s.mx, s.my);
  if (m > 1) { s.mx /= m; s.my /= m; }
  return s;
}
