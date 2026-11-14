// Logika jednej partii: babcie, grzyby, dzik. Nic tu nie rysuje — patrz render.js.
import * as C from './config.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Game {
  constructor(sfx, input) {
    this.sfx = sfx;
    this.input = input;
    this.wins = [0, 0];
    this.round = 0;
    // kolejność plansz losowana na mecz; ?mapa=dzialka (albo 1–4) wymusza pierwszą
    this.mapOrder = C.MAPS.map((_, i) => i).sort(() => Math.random() - 0.5);
    const want = new URLSearchParams(location.search).get('mapa');
    const forced = C.MAPS.findIndex((m, i) => m.id === want || String(i + 1) === want);
    if (forced >= 0) this.mapOrder = [forced, ...this.mapOrder.filter((i) => i !== forced)];
    this.newRound();
  }

  newRound() {
    this.round++;
    this.time = C.ROUND_TIME;
    this.over = false;
    this.shake = 0;
    this.particles = [];
    this.texts = [];
    this.shrooms = [];
    this.spawnT = 0;
    this.tickT = 0;
    this.grannies = [
      makeGranny(0, C.ARENA.x0 + 130, (C.ARENA.y0 + C.ARENA.y1) / 2),
      makeGranny(1, C.ARENA.x1 - 130, (C.ARENA.y0 + C.ARENA.y1) / 2),
    ];
    this.grannies[1].flip = -1;
    this.grannies[1].fx = -1;
    this.map = C.MAPS[this.mapOrder[(this.round - 1) % C.MAPS.length]];
    const midY = (C.ARENA.y0 + C.ARENA.y1) / 2;
    this.pond = this.map.id === 'staw'
      ? { x: C.W / 2 + rand(-70, 70), y: midY + rand(-30, 30), rx: rand(150, 185), ry: rand(82, 104) }
      : null;
    this.river = this.map.id === 'rzeka'
      ? {
        cx: C.W / 2 + rand(-40, 40), amp: rand(55, 80), wl: rand(95, 125), ph: rand(0, 6), hw: 46,
        bridges: [{ y: C.ARENA.y0 + rand(80, 130) }, { y: C.ARENA.y1 - rand(90, 140) }],   // kładki
        xAt(y) { return this.cx + this.amp * Math.sin(y / this.wl + this.ph); },
      }
      : null;
    // przeszkody prostokątne (podstawa): domek i samochód na działce; tall = ile wystają w górę
    this.rects = this.map.id === 'dzialka'
      ? [
        { kind: 'house', x: C.W / 2 - 170, y: midY - 30, w: 220, h: 80, tall: 180 },
        { kind: 'car', x: C.W / 2 + 112, y: midY + 6, w: 156, h: 44, tall: 62 },
      ]
      : [];
    this.trees = this.makeTrees();
    const t0 = pick(this.trees);
    this.squirrel = { state: 'tree', tree: t0, x: t0.x, y: t0.y, t: rand(3, 6), dest: null, target: null, carry: null, hop: 0, flip: 1 };
    this.hare = { state: 'idle', t: rand(5, 9), x: -100, y: 0, tx: 0, ty: 0, stops: 0, hop: 0, flip: 1, scared: false, exit: false };
    this.forester = { state: 'idle', t: rand(...C.FORESTER_FIRST), x: -200, y: 0, dir: 1, walk: 0, nextStop: 0, whistle: 0, bubble: '', bubbleT: 0 };
    this.boar = { state: 'idle', t: rand(...C.BOAR_FIRST), x: -200, y: 0, dx: 1, dy: 0, tx: 0, ty: 0, flip: 1 };
    for (let i = 0; i < 9; i++) this.spawnShroom();
    this.grannies.forEach((g) => this.say(g, C.line('start', g.id), 2.6));
  }

  score(g) {
    return g.basket.reduce((s, t) => s + C.TYPES[t].pts, 0) + g.bonus;
  }

  // ---------- mapa ----------
  makeTrees() {
    const trees = [];
    let guard = 0;
    while (trees.length < 9 && guard++ < 600) {
      const t = {
        x: rand(C.ARENA.x0 + 40, C.ARENA.x1 - 40),
        y: rand(C.ARENA.y0 + 70, C.ARENA.y1 - 10),
        r: 18, R: rand(40, 54), seed: Math.random(),
        // 0 = liściaste, 1 = świerk, 2 = brzoza, 3 = sosna
        kind: pick({ zagajnik: [0, 0, 0, 1, 1], staw: [2, 2, 1, 1], rzeka: [0, 0, 3, 3, 1], dzialka: [2, 2, 1, 1, 3, 3] }[this.map.id]),
      };
      if (trees.some((o) => dist(o, t) < 200)) continue;
      if (this.grannies.some((g) => dist(g, t) < 170)) continue;
      if (this.inWater(t, 60) || this.inWater({ x: t.x, y: t.y - 70 }, 40)) continue;
      if (this.rects.some((r) => t.x > r.x - 90 && t.x < r.x + r.w + 90 && t.y > r.y - r.tall - 30 && t.y < r.y + r.h + 150)) continue;
      trees.push(t);
    }
    return trees;
  }

  // Czy punkt jest w wodzie (staw albo rzeka); pad > 0 = z marginesem. Kładki są suche.
  inWater(p, pad = 0) {
    const w = this.pond, rv = this.river;
    if (w) return ((p.x - w.x) / (w.rx + pad)) ** 2 + ((p.y - w.y) / (w.ry + pad)) ** 2 < 1;
    if (rv) {
      if (Math.abs(p.x - rv.xAt(p.y)) >= rv.hw + pad) return false;
      return pad > 0 || !rv.bridges.some((b) => Math.abs(p.y - b.y) < 24);
    }
    return false;
  }

  freeSpot(p, pad = 0) {
    if (this.inWater(p, 28)) return false;
    for (const r of this.rects) {
      if (p.x > r.x - 34 && p.x < r.x + r.w + 34 && p.y > r.y - r.tall - 6 && p.y < r.y + r.h + 34) return false;
    }
    if (p.x < C.ARENA.x0 + 10 || p.x > C.ARENA.x1 - 10 || p.y < C.ARENA.y0 + 10 || p.y > C.ARENA.y1 - 10) return false;
    for (const t of this.trees) {
      if (dist(t, p) < t.r + 30 + pad) return false;
      // nie chowamy grzybów za koroną drzewa
      if (Math.hypot(t.x - p.x, t.y - t.R * 1.25 - p.y) < t.R * 0.95) return false;
    }
    return true;
  }

  // ---------- grzyby ----------
  spawnShroom() {
    const count = (t) => this.shrooms.filter((s) => s.type === t).length;
    let total = 0;
    const pool = Object.entries(C.TYPES).filter(([k]) =>
      !(k === 'muchomor' && count(k) >= C.MAX_MUCHOMORS) && !(k === 'amanita' && count(k) >= C.MAX_AMANITAS));
    pool.forEach(([, v]) => (total += v.w));
    let r = Math.random() * total, type = pool[0][0];
    for (const [k, v] of pool) { r -= v.w; if (r <= 0) { type = k; break; } }

    const cands = [];
    for (let i = 0; i < 40 && cands.length < 6; i++) {
      const p = { x: rand(C.ARENA.x0, C.ARENA.x1), y: rand(C.ARENA.y0, C.ARENA.y1) };
      if (!this.freeSpot(p)) continue;
      if (this.shrooms.some((s) => dist(s, p) < 48)) continue;
      if (this.grannies.some((g) => dist(g, p) < 80)) continue;
      cands.push(p);
    }
    if (!cands.length) return;

    // Przeciwwaga: borowik rośnie bliżej tej, która przegrywa
    let p = cands[0];
    const [a, b] = this.grannies;
    const diff = this.score(a) - this.score(b);
    if (type === 'borowik' && Math.abs(diff) >= C.CATCHUP_DIFF) {
      const loser = diff > 0 ? b : a;
      p = cands.reduce((best, c) => (dist(c, loser) < dist(best, loser) ? c : best));
    }
    this.shrooms.push({
      type, x: p.x, y: p.y, age: 0, vx: 0, vy: 0, delay: 0,
      ttl: type === 'muchomor' ? rand(11, 17) : rand(26, 38), dropped: false,
    });
  }

  dropShroom(type, x, y, vx, vy) {
    this.shrooms.push({ type, x, y, age: 1, vx, vy, delay: 0.4, ttl: 30, dropped: true });
  }

  // ---------- efekty ----------
  say(g, text, t = 1.6) { g.bubble = text; g.bubbleT = t; }

  floatText(x, y, text, color = '#fff', size = 30) {
    this.texts.push({ x, y, text, color, size, t: 0, life: 1.1 });
  }

  puff(x, y, n = 6, color = 'rgba(230,220,190,0.8)', sp = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rand(sp * 0.3, sp);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, life: rand(0.3, 0.7), size: rand(4, 10), color });
    }
  }

  // ---------- główna pętla ----------
  update(dt, inputs) {
    if (this.over) return;
    this.time -= dt;
    if (this.time <= 0) { this.time = 0; this.over = true; this.sfx.play('end'); return; }

    const dusk = this.time <= C.DUSK_TIME;
    if (this.time <= 10) {
      this.tickT -= dt;
      if (this.tickT <= 0) { this.tickT = 1; this.sfx.play('tick'); }
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = dusk ? C.SPAWN_EVERY_DUSK : C.SPAWN_EVERY;
      if (this.shrooms.filter((s) => !s.dropped).length < C.MAX_SHROOMS) this.spawnShroom();
    }

    this.grannies.forEach((g, i) => this.updateGranny(g, inputs[i], dt));
    this.separate();
    this.updateBoar(dt);
    this.updateForester(dt);
    this.updateSquirrel(dt);
    this.updateHare(dt);

    for (const s of this.shrooms) {
      s.age += dt; s.ttl -= dt; s.delay -= dt;
      if (s.vx || s.vy) {
        s.x = clamp(s.x + s.vx * dt, C.ARENA.x0, C.ARENA.x1);
        s.y = clamp(s.y + s.vy * dt, C.ARENA.y0, C.ARENA.y1);
        const f = Math.pow(0.004, dt);
        s.vx *= f; s.vy *= f;
        if (Math.hypot(s.vx, s.vy) < 6) { s.vx = 0; s.vy = 0; }
        for (const r of this.rects) pushOutRect(s, r, 34);   // żeby nic nie wpadło pod domek
      }
    }
    this.shrooms = this.shrooms.filter((s) => s.ttl > 0);

    for (const p of this.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const t of this.texts) { t.t += dt; t.y -= 46 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    this.shake = Math.max(0, this.shake - dt);
  }

  // ---------- babcie ----------
  updateGranny(g, inp, dt) {
    const o = this.grannies[1 - g.id];
    for (const k of ['stun', 'poison', 'dashCd', 'elbowCd', 'elbowAnim', 'immune', 'boarImmune', 'shooT', 'shooAnim', 'bubbleT', 'pickAnim']) {
      if (g[k] > 0) g[k] = Math.max(0, g[k] - dt);
    }
    let { mx, my } = inp;
    if (g.poison > 0) { mx = -mx; my = -my; }   // muchomor odwraca sterowanie

    g.moving = false;
    if (g.stun > 0) {
      g.x += g.kx * dt; g.y += g.ky * dt;
      const f = Math.pow(0.01, dt);
      g.kx *= f; g.ky *= f;
      g.dashT = 0;
      g.wet = this.inWater(g);
    } else {
      const mag = Math.hypot(mx, my);
      if (mag > 0.05) {
        g.fx = mx / mag; g.fy = my / mag;
        if (Math.abs(mx) > 0.15) g.flip = mx < 0 ? -1 : 1;
      }
      if (inp.dash && g.dashCd <= 0) {
        g.dashT = C.DASH_TIME; g.dashCd = C.DASH_CD;
        this.sfx.play('dash');
        this.puff(g.x, g.y - 6, 7);
      }
      const wasWet = g.wet;
      g.wet = this.inWater(g);
      const slow = g.wet ? C.POND_SLOW : 1;
      if (g.wet && !wasWet) {
        this.puff(g.x, g.y, 8, 'rgba(170,225,235,0.9)', 130);
        this.sfx.play('splash');
        if (Math.random() < 0.6) this.say(g, C.line('splash', g.id));
      }
      let vx, vy;
      if (g.dashT > 0) {
        g.dashT -= dt;
        vx = g.fx * C.SPEED * C.DASH_MULT * slow; vy = g.fy * C.SPEED * C.DASH_MULT * slow;
        if (Math.random() < 0.5) this.puff(g.x, g.y - 4, 1, 'rgba(230,220,190,0.6)', 40);
      } else {
        vx = mx * C.SPEED * slow; vy = my * C.SPEED * slow;
      }
      g.x += vx * dt; g.y += vy * dt;
      const sp = Math.hypot(vx, vy);
      g.moving = sp > 20;
      if (g.wet && g.moving && Math.random() < dt * 9) this.puff(g.x, g.y - 2, 1, 'rgba(170,225,235,0.8)', 60);
      g.walk += sp * dt * 0.06;

      if (inp.collect) this.tryCollect(g);
      if (inp.elbow && g.elbowCd <= 0) this.elbow(g, o);
      if (inp.shoo) {
        g.shooT = C.SHOO_WINDOW; g.shooAnim = 0.35;
        this.sfx.play('shoo');
        if (this.boar.state === 'paw' && dist(g, this.boar) < C.SHOO_R) this.say(g, C.line('shoo', g.id), 0.9);
      }
    }

    for (const t of this.trees) {
      const d = dist(g, t), min = t.r + 20;
      if (d < min && d > 0.001) { g.x = t.x + ((g.x - t.x) / d) * min; g.y = t.y + ((g.y - t.y) / d) * min; }
    }
    for (const r of this.rects) pushOutRect(g, r, 20);
    g.x = clamp(g.x, C.ARENA.x0, C.ARENA.x1);
    g.y = clamp(g.y, C.ARENA.y0, C.ARENA.y1);
  }

  separate() {
    const [a, b] = this.grannies;
    const d = dist(a, b), min = 44;
    if (d < min) {
      const nx = d > 0.001 ? (b.x - a.x) / d : 1, ny = d > 0.001 ? (b.y - a.y) / d : 0;
      const push = (min - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    }
  }

  tryCollect(g) {
    g.pickAnim = 0.2;
    let best = null, bd = C.PICK_RANGE;
    for (const s of this.shrooms) {
      if (s.delay > 0) continue;
      const d = dist(g, s);
      if (d < bd) { bd = d; best = s; }
    }
    if (!best) return;
    this.shrooms.splice(this.shrooms.indexOf(best), 1);
    const def = C.TYPES[best.type];
    if (best.type === 'amanita' && this.forester.state !== 'idle') {
      // amanita na oczach leśniczego: słony mandat
      const f = this.forester;
      g.bonus -= C.AMANITA_FINE;
      f.whistle = 1; f.dir = g.x < f.x ? -1 : 1; f.state = 'stop'; f.t = 1.8;
      this.say(f, C.line('amanitaFine'), 1.8);
      this.say(g, C.line('caught', g.id), 2);
      this.floatText(g.x, g.y - 110, `mandat −${C.AMANITA_FINE}`, '#ff5a5a', 38);
      this.sfx.play('whistle'); this.sfx.play('bad');
      this.input.rumble(g.id, 0.8, 400);
      this.shake = 0.15;
    } else if (best.type === 'muchomor') {
      g.bonus += def.pts;
      g.poison = C.POISON_TIME;
      this.say(g, C.line('poison', g.id), 2.2);
      this.floatText(g.x, g.y - 90, `${def.pts}`, '#ff5a5a', 36);
      this.puff(g.x, g.y - 40, 12, 'rgba(140,220,90,0.8)', 120);
      this.sfx.play('bad');
      this.input.rumble(g.id, 0.5, 400);
    } else {
      g.basket.push(best.type);
      this.floatText(g.x, g.y - 90, `+${def.pts}`, def.pts >= 4 ? '#ffe45c' : '#fff', 24 + def.pts * 3);
      this.sfx.play('pick', def.pts);
      if (best.type === 'borowik') this.say(g, C.line('borowik', g.id));
      else if (best.type === 'amanita') this.say(g, C.line('amanita', g.id));
      else if (best.dropped && Math.random() < 0.5) this.say(g, C.line('steal', g.id));
    }
  }

  elbow(g, o) {
    g.elbowCd = C.ELBOW_CD; g.elbowAnim = 0.25;
    this.sfx.play('whoosh');
    const dx = o.x - g.x, dy = o.y - g.y, d = Math.hypot(dx, dy) || 1;
    const facing = (dx * g.fx + dy * g.fy) / d;
    if (d > C.ELBOW_RANGE || o.immune > 0 || facing < -0.3) return;

    g.flip = dx < 0 ? -1 : 1;
    o.stun = C.ELBOW_STUN; o.immune = C.ELBOW_IMMUNE;
    o.kx = (dx / d) * 560; o.ky = (dy / d) * 560;
    this.say(g, C.line('elbow', g.id));
    this.say(o, C.line('hit', o.id));
    this.sfx.play('thump');
    this.puff((g.x + o.x) / 2, (g.y + o.y) / 2 - 40, 8, 'rgba(255,255,255,0.9)', 140);
    this.input.rumble(o.id, 0.7, 200);
    this.input.rumble(g.id, 0.3, 100);
    this.foresterSees(g);
    if (o.basket.length) {
      const type = o.basket.splice((Math.random() * o.basket.length) | 0, 1)[0];
      const a = Math.atan2(dy, dx) + rand(-0.9, 0.9);
      this.dropShroom(type, o.x, o.y, Math.cos(a) * 330, Math.sin(a) * 330);
    }
  }

  // ---------- leśniczy ----------
  updateForester(dt) {
    const f = this.forester;
    f.t -= dt;
    if (f.bubbleT > 0) f.bubbleT -= dt;
    if (f.whistle > 0) f.whistle -= dt;
    switch (f.state) {
      case 'idle':
        if (f.t <= 0 && this.time > 14) {
          f.dir = Math.random() < 0.5 ? 1 : -1;
          f.x = f.dir > 0 ? -70 : C.W + 70;
          let y = rand(C.ARENA.y0 + 50, C.ARENA.y1 - 20);
          // obchodzi staw i domek
          const band = this.pond ? [this.pond.y - this.pond.ry - 30, this.pond.y + this.pond.ry + 30]
            : this.rects.length ? [this.rects[0].y - 50, this.rects[0].y + this.rects[0].h + 40] : null;
          if (band && y > band[0] && y < band[1]) y = y < (band[0] + band[1]) / 2 ? band[0] - rand(10, 50) : band[1] + rand(10, 50);
          f.y = clamp(y, C.ARENA.y0 + 30, C.ARENA.y1);
          f.state = 'walk'; f.nextStop = rand(2.5, 4.5);
        }
        break;
      case 'walk':
        f.x += f.dir * C.FORESTER_SPEED * dt;
        f.walk += dt * 7;
        f.nextStop -= dt;
        if (f.nextStop <= 0 && f.x > 160 && f.x < C.W - 160) {
          f.state = 'stop'; f.t = 2.4;
          this.say(f, C.line('forester'), 2.2);
        }
        if (f.x < -90 || f.x > C.W + 90) { f.state = 'idle'; f.t = rand(...C.FORESTER_EVERY); }
        break;
      case 'stop':
        if (f.t <= 0) { f.state = 'walk'; f.nextStop = rand(3, 5.5); }
        break;
    }
  }

  // Łokieć na oczach leśniczego kończy się mandatem
  foresterSees(g) {
    const f = this.forester;
    if (!C.FORESTER_FINE || f.state === 'idle' || dist(g, f) > C.FORESTER_SIGHT) return;
    g.bonus -= C.FORESTER_FINE;
    f.whistle = 0.9;
    f.dir = g.x < f.x ? -1 : 1;
    f.state = 'stop'; f.t = 1.6;
    this.say(f, C.line('fine'), 1.6);
    this.say(g, C.line('fined', g.id), 1.8);
    this.floatText(g.x, g.y - 120, `mandat −${C.FORESTER_FINE}`, '#ff5a5a', 30);
    this.sfx.play('whistle');
    this.input.rumble(g.id, 0.5, 250);
  }

  // ---------- wiewiórka ----------
  // Siedzi na drzewie, biega między drzewami, a czasem schodzi i kradnie grzyba z planszy.
  updateSquirrel(dt) {
    const q = this.squirrel;
    q.hop += dt;
    const nearestTree = () => this.trees.reduce((a, t) => (dist(t, q) < dist(a, q) ? t : a));
    const go = (p, sp) => {
      const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
      if (d < 8) return true;
      q.x += (dx / d) * sp * dt; q.y += (dy / d) * sp * dt;
      if (Math.abs(dx) > 3) q.flip = dx < 0 ? -1 : 1;
      return false;
    };
    switch (q.state) {
      case 'tree':
        q.t -= dt;
        if (q.t <= 0) {
          q.carry = null;
          q.x = q.tree.x; q.y = q.tree.y + 8;
          const loot = this.shrooms.filter((s) => s.delay <= 0 && !s.vx && !s.vy && s.age > 1);
          if (loot.length && Math.random() < C.SQUIRREL_STEAL) { q.target = pick(loot); q.state = 'steal'; }
          else { q.dest = pick(this.trees.filter((t) => t !== q.tree)) || q.tree; q.state = 'run'; }
        }
        break;
      case 'steal':
        if (!this.shrooms.includes(q.target)) { q.dest = nearestTree(); q.state = 'run'; break; }   // ktoś był szybszy
        if (go(q.target, C.SQUIRREL_SPEED)) {
          this.shrooms.splice(this.shrooms.indexOf(q.target), 1);
          q.carry = q.target.type;
          this.floatText(q.x, q.y - 40, 'cap!', '#ffb36b', 24);
          this.sfx.play('squeak');
          const near = this.nearestGranny(q);
          if (dist(near, q) < 260) this.say(near, C.line('squirrel', near.id));
          q.dest = nearestTree(); q.state = 'run';
        }
        break;
      case 'run':
        if (go({ x: q.dest.x, y: q.dest.y + 8 }, C.SQUIRREL_SPEED * (q.carry ? 1.25 : 1))) {
          q.tree = q.dest; q.state = 'tree'; q.t = rand(4, 9);
        }
        break;
    }
  }

  // ---------- zając ----------
  // Czysta ozdoba: kica, staje słupka, strzyże uszami i ucieka, gdy ktoś podejdzie.
  updateHare(dt) {
    const h = this.hare;
    h.t -= dt; h.hop += dt;
    const leave = (scared) => {
      h.exit = true; h.scared = scared; h.state = 'hop';
      h.tx = h.x < C.W / 2 ? -80 : C.W + 80; h.ty = h.y + rand(-80, 80);
    };
    const spot = () => {
      for (let i = 0; i < 20; i++) {
        const p = { x: rand(C.ARENA.x0 + 60, C.ARENA.x1 - 60), y: rand(C.ARENA.y0 + 30, C.ARENA.y1 - 20) };
        if (this.freeSpot(p)) { h.tx = p.x; h.ty = p.y; return; }
      }
      h.tx = h.x; h.ty = h.y;
    };
    const spooked = this.grannies.some((g) => dist(g, h) < 105) || (this.boar.state === 'charge' && dist(this.boar, h) < 200);
    switch (h.state) {
      case 'idle':
        if (h.t <= 0) {
          h.x = Math.random() < 0.5 ? -60 : C.W + 60;
          h.y = rand(C.ARENA.y0 + 40, C.ARENA.y1 - 20);
          h.stops = 1 + ((Math.random() * 2) | 0); h.exit = false; h.scared = false;
          spot(); h.state = 'hop';
        }
        break;
      case 'hop': {
        const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy);
        if (!h.exit && spooked) { leave(true); break; }
        if (d < 10) {
          if (h.exit) { h.state = 'idle'; h.t = rand(...C.HARE_EVERY); h.x = -200; }
          else { h.state = 'sit'; h.t = rand(2.2, 4); }
          break;
        }
        const sp = h.scared ? 430 : 190;
        h.x += (dx / d) * sp * dt; h.y += (dy / d) * sp * dt;
        if (Math.abs(dx) > 3) h.flip = dx < 0 ? -1 : 1;
        break;
      }
      case 'sit':
        if (spooked) { leave(true); break; }
        if (h.t <= 0) {
          h.stops--;
          if (h.stops > 0) { spot(); h.state = 'hop'; } else leave(false);
        }
        break;
    }
  }

  // ---------- dzik ----------
  nearestGranny(p) {
    const [a, b] = this.grannies;
    return dist(a, p) <= dist(b, p) ? a : b;
  }

  updateBoar(dt) {
    const b = this.boar;
    b.t -= dt;
    const [g0, g1] = this.grannies;
    switch (b.state) {
      case 'idle':
        if (b.t <= 0 && this.time > 9) {
          const left = Math.random() < 0.5;
          b.x = left ? -90 : C.W + 90;
          b.y = rand(C.ARENA.y0 + 60, C.ARENA.y1 - 40);
          b.tx = clamp((g0.x + g1.x) / 2 + rand(-140, 140), C.ARENA.x0 + 180, C.ARENA.x1 - 180);
          b.ty = clamp((g0.y + g1.y) / 2 + rand(-110, 110), C.ARENA.y0 + 90, C.ARENA.y1 - 60);
          const spot = { x: b.tx, y: b.ty };
          for (const r of this.rects) pushOutRect(spot, r, 90);
          b.tx = spot.x; b.ty = spot.y;
          b.flip = left ? 1 : -1;
          b.state = 'warn'; b.t = 1.6;
          this.sfx.play('warn');
        }
        break;
      case 'warn':
        if (b.t <= 0) b.state = 'enter';
        break;
      case 'enter': {
        const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
        if (d < 10) { b.state = 'paw'; b.t = C.BOAR_PAW_TIME; this.sfx.play('warn'); break; }
        b.x += (dx / d) * 270 * dt; b.y += (dy / d) * 270 * dt;
        if (Math.abs(dx) > 5) b.flip = dx < 0 ? -1 : 1;
        break;
      }
      case 'paw': {
        const target = this.nearestGranny(b);
        b.flip = target.x < b.x ? -1 : 1;
        if (Math.random() < dt * 14) this.puff(b.x - b.flip * 30, b.y - 4, 1, 'rgba(160,120,70,0.8)', 70);
        const bothNear = dist(g0, b) < C.SHOO_R && dist(g1, b) < C.SHOO_R;
        if (bothNear && g0.shooT > 0 && g1.shooT > 0) { this.shooBoar(); break; }
        if (b.t <= 0) {
          const d = dist(target, b) || 1;
          b.dx = (target.x - b.x) / d; b.dy = (target.y - b.y) / d;
          b.state = 'charge';
          this.sfx.play('charge');
        }
        break;
      }
      case 'charge':
        b.x += b.dx * C.BOAR_SPEED * dt; b.y += b.dy * C.BOAR_SPEED * dt;
        if (Math.random() < 0.6) this.puff(b.x - b.dx * 40, b.y - 4, 1, 'rgba(160,120,70,0.7)', 50);
        for (const g of this.grannies) {
          if (g.boarImmune <= 0 && Math.hypot(g.x - b.x, g.y - 14 - b.y) < C.BOAR_HIT_R) this.boarHit(g);
        }
        if (b.x < -160 || b.x > C.W + 160 || b.y < -160 || b.y > C.H + 160) this.boarLeave();
        break;
      case 'flee':
        b.x += b.dx * 760 * dt; b.y += b.dy * 760 * dt;
        if (b.x < -160 || b.x > C.W + 160 || b.y < -160 || b.y > C.H + 160) this.boarLeave();
        break;
    }
  }

  boarLeave() {
    this.boar.state = 'idle';
    this.boar.t = rand(...C.BOAR_EVERY) - 8;   // wizyta trwa ok. 8 s, więc kolejna wypada co 20–30 s
    this.boar.x = -300;
  }

  boarHit(g) {
    const b = this.boar;
    g.boarImmune = 2; g.stun = 1.2; g.immune = 1.6;
    // odrzut w bok od toru szarży
    const side = (g.x - b.x) * -b.dy + (g.y - b.y) * b.dx >= 0 ? 1 : -1;
    g.kx = (-b.dy * side * 0.8 + b.dx * 0.5) * 520;
    g.ky = (b.dx * side * 0.8 + b.dy * 0.5) * 520;
    const n = Math.ceil(g.basket.length / 2);
    for (let i = 0; i < n; i++) {
      const type = g.basket.splice((Math.random() * g.basket.length) | 0, 1)[0];
      const a = Math.random() * Math.PI * 2, v = rand(160, 420);
      this.dropShroom(type, g.x, g.y, Math.cos(a) * v, Math.sin(a) * v);
    }
    this.say(g, C.line('boarHit', g.id), 1.8);
    if (n) this.floatText(g.x, g.y - 100, `−${n} grzyb${n === 1 ? '' : n < 5 ? 'y' : 'ów'}!`, '#ff5a5a', 30);
    this.puff(g.x, g.y - 30, 16, 'rgba(255,255,255,0.9)', 220);
    this.shake = 0.45;
    this.sfx.play('crash');
    this.input.rumble(g.id, 1, 450);
  }

  shooBoar() {
    const b = this.boar;
    const [g0, g1] = this.grannies;
    const mx = (g0.x + g1.x) / 2, my = (g0.y + g1.y) / 2;
    let dx = b.x - mx, dy = b.y - my;
    const d = Math.hypot(dx, dy);
    if (d < 20) { dx = b.flip * -1; dy = 0; } else { dx /= d; dy /= d; }
    if (Math.abs(dx) < 0.35) dx = dx < 0 ? -0.6 : 0.6;   // żeby szybko zniknął z ekranu
    const m = Math.hypot(dx, dy);
    b.dx = dx / m; b.dy = dy / m;
    b.flip = b.dx < 0 ? -1 : 1;
    b.state = 'flee';
    this.grannies.forEach((g) => {
      g.bonus += C.SHOO_BONUS;
      g.shooT = 0;
      this.floatText(g.x, g.y - 95, `+${C.SHOO_BONUS}`, '#7dff8a', 40);
      this.input.rumble(g.id, 0.4, 150);
    });
    const talker = pick(this.grannies);
    this.say(talker, C.line('shooOk', talker.id), 2.2);
    this.puff(b.x, b.y - 20, 14, 'rgba(255,255,255,0.9)', 200);
    this.sfx.play('squeal');
  }
}

// Wypycha punkt p (koło o promieniu rad) z prostokąta r
function pushOutRect(p, r, rad) {
  const cx = clamp(p.x, r.x, r.x + r.w), cy = clamp(p.y, r.y, r.y + r.h);
  const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
  if (d >= rad) return;
  if (d > 0.001) { p.x = cx + (dx / d) * rad; p.y = cy + (dy / d) * rad; return; }
  const l = p.x - r.x, rr = r.x + r.w - p.x, t = p.y - r.y, b = r.y + r.h - p.y, m = Math.min(l, rr, t, b);
  if (m === l) p.x = r.x - rad; else if (m === rr) p.x = r.x + r.w + rad;
  else if (m === t) p.y = r.y - rad; else p.y = r.y + r.h + rad;
}

function makeGranny(id, x, y) {
  return {
    id, x, y, fx: 1, fy: 0, flip: 1, kx: 0, ky: 0,
    basket: [], bonus: 0,
    stun: 0, poison: 0, dashT: 0, dashCd: 0, elbowCd: 0, elbowAnim: 0,
    immune: 0, boarImmune: 0, shooT: 0, shooAnim: 0, pickAnim: 0,
    bubble: '', bubbleT: 0, walk: 0, moving: false, wet: false,
  };
}
