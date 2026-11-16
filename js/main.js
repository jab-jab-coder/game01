// Punkt wejścia: pętla gry i maszyna stanów
// (menu → [pokój online] → wybór postaci → odliczanie → runda → ważenie koszyków).
//
// Gra online: gospodarz liczy całą rozgrywkę i 30 razy na sekundę wysyła gościowi stan świata;
// gość odsyła tylko swoje sterowanie i rysuje to, co dostał.
import * as C from './config.js';
import { Input, BUTTONS } from './input.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';
import { Net } from './net.js';
import * as R from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input();
const sfx = new Sfx();
const net = new Net();

let scale = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = Math.min(innerWidth / C.W, innerHeight / C.H);
  canvas.style.width = `${Math.floor(C.W * s)}px`;
  canvas.style.height = `${Math.floor(C.H * s)}px`;
  canvas.width = Math.floor(C.W * s * dpr);
  canvas.height = Math.floor(C.H * s * dpr);
  scale = canvas.width / C.W;
}
addEventListener('resize', resize);
resize();

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

let state = 'menu';      // menu | hostWait | join | title | countdown | play | roundEnd
let stateT = 0;          // czas w bieżącym stanie
let mode = 'local';      // local | host | guest
let paused = false;
let game = null;
let result = null;
let lastBeep = 0;
let time = 0;
let ready = [false, false];   // wybór postaci zatwierdzony
let startIn = null;           // odliczanie do startu po zatwierdzeniu obu
const prevMx = [0, 0];

let menuIdx = 0;
let notice = '';
const joinDigits = [0, 0, 0, 0];
let joinPos = 0;
let copiedT = 0;
const prevAxis = {};

// sieć
const mySlot = () => (mode === 'guest' ? 1 : 0);
let evq = [];                 // dźwięki do odtworzenia u gościa
let rmq = [];                 // wibracje pada gościa
let frameNo = 0;
let lobT = 0;
const counters = {};          // liczniki wciśnięć gościa
let snapPrev = null, snapCur = null;

// Dźwięki gry: u gospodarza trafiają też do kolejki dla gościa
const gameSfx = {
  play(name, arg) { sfx.play(name, arg); if (mode === 'host') evq.push([name, arg]); },
};
input.onNetRumble = (strength, ms) => { if (mode === 'host') rmq.push([strength, ms]); };

function setState(s) { state = s; stateT = 0; }

function roomLink() {
  const q = new URLSearchParams(location.search);
  const keep = ['peerhost', 'peerport', 'peerpath', 'peersecure'].filter((k) => q.get(k)).map((k) => `&${k}=${encodeURIComponent(q.get(k))}`).join('');
  return `${location.origin}${location.pathname}?pokoj=${net.code}${keep}`;
}

function copyLink() {
  if (state !== 'hostWait' || net.status !== 'waiting') return;
  navigator.clipboard?.writeText(roomLink()).then(() => { copiedT = 2.5; }).catch(() => {});
}

addEventListener('keydown', (e) => {
  sfx.unlock();
  if (e.code === 'Escape' && mode !== 'guest' && (state === 'play' || state === 'countdown')) paused = !paused;
  if (e.code === 'KeyC') copyLink();
  if (state === 'join' && net.status !== 'connecting') {      // kod pokoju prosto z klawiatury
    if (/^(Digit|Numpad)\d$/.test(e.code)) {
      joinDigits[joinPos] = +e.code.slice(-1);
      joinPos = Math.min(3, joinPos + 1);
    } else if (e.code === 'Backspace') { joinPos = Math.max(0, joinPos - 1); e.preventDefault(); }
  }
});
addEventListener('pointerdown', () => { sfx.unlock(); copyLink(); });
canvas.addEventListener('dblclick', toggleFullscreen);

// ---------- menu i pokoje ----------
function goMenu(msg = '') {
  net.reset();
  input.resetNet(false);
  input.slots = [null, null];
  ready = [false, false];
  startIn = null;
  mode = 'local';
  game = null; snapPrev = snapCur = null;
  paused = false;
  notice = msg;
  setState('menu');
}

// Nawigacja po menu: dowolny pad albo klawiatura
function nav() {
  const n = { up: false, down: false, left: false, right: false, ok: false, back: false };
  for (const id of input.sources()) {
    if (id === 'net') continue;
    const st = input.state[id], p = prevAxis[id] || { x: 0, y: 0 };
    if (st.my < -0.6 && p.y >= -0.6) n.up = true;
    if (st.my > 0.6 && p.y <= 0.6) n.down = true;
    if (st.mx < -0.6 && p.x >= -0.6) n.left = true;
    if (st.mx > 0.6 && p.x <= 0.6) n.right = true;
    prevAxis[id] = { x: st.mx, y: st.my };
    if (input.pressed(id, 'collect') || input.pressed(id, 'start')) n.ok = true;
    if (input.pressed(id, 'elbow')) n.back = true;
  }
  return n;
}

function enterLobby() {
  input.resetNet(true);
  input.slots = mode === 'host' ? [null, 'net'] : ['net', null];
  ready = [false, false];
  startIn = null;
  for (const b of BUTTONS) counters[b] = 0;
  evq = []; rmq = [];
  snapPrev = snapCur = null;
  net.onMessage = onNet;
  sfx.play('join');
  setState('title');
}

function startJoin() {
  mode = 'guest';
  net.join(joinDigits.join(''));
}

// ---------- komunikaty sieciowe ----------
function onNet(m) {
  const other = 1 - mySlot();
  switch (m.t) {
    case 'lob':                       // wybór postaci drugiej strony
      if (C.KINDS.includes(m.kind)) C.PLAYERS[other].kind = m.kind;
      ready[other] = !!m.ready;
      if (mode === 'guest' && state !== 'title') {   // gospodarz wrócił do wyboru postaci
        ready[1] = false; snapPrev = snapCur = null;
        setState('title');
      }
      break;
    case 'in':                        // sterowanie gościa
      if (mode === 'host') input.remote = { mx: m.mx, my: m.my, c: m.c && typeof m.c === 'object' ? m.c : {} };
      break;
    case 's':                         // stan świata od gospodarza
      if (mode === 'guest') applySnapshot(m);
      break;
  }
}

function snapshot() {
  const g = game, r = g.river;
  return {
    t: 's', ph: state, st: stateT, paused, res: result, kinds: C.PLAYERS.map((p) => p.kind),
    mid: g.matchId, round: g.round, wins: g.wins, map: g.map.id, time: g.time, shake: g.shake,
    trees: g.trees, pond: g.pond, rects: g.rects,
    river: r && { cx: r.cx, amp: r.amp, wl: r.wl, ph: r.ph, hw: r.hw, bridges: r.bridges },
    gr: g.grannies, boar: g.boar, fo: g.forester, hare: g.hare,
    sq: { ...g.squirrel, tree: g.trees.indexOf(g.squirrel.tree), dest: null, target: null },
    sh: g.shrooms.map((s) => [s.type, s.x, s.y, s.age, s.ttl]),
    pa: g.particles.map((p) => [p.x, p.y, p.t, p.life, p.size, p.color]),
    tx: g.texts, ev: evq.splice(0), rm: rmq.splice(0),
  };
}

function applySnapshot(m) {
  if (!Array.isArray(m.gr) || !Array.isArray(m.trees) || !Array.isArray(m.sh)) return;
  (m.kinds || []).forEach((k, i) => { if (C.KINDS.includes(k)) C.PLAYERS[i].kind = k; });
  const river = m.river && { ...m.river, xAt(y) { return this.cx + this.amp * Math.sin(y / this.wl + this.ph); } };
  const view = {
    matchId: m.mid, round: m.round, wins: m.wins, time: m.time, shake: m.shake,
    map: C.MAPS.find((x) => x.id === m.map) || C.MAPS[0],
    trees: m.trees, pond: m.pond, rects: m.rects || [], river,
    grannies: m.gr, boar: m.boar, forester: m.fo, hare: m.hare,
    squirrel: { ...m.sq, tree: m.trees[m.sq.tree] || m.trees[0] },
    shrooms: m.sh.map((a) => ({ type: a[0], x: a[1], y: a[2], age: a[3], ttl: a[4] })),
    particles: (m.pa || []).map((a) => ({ x: a[0], y: a[1], t: a[2], life: a[3], size: a[4], color: a[5] })),
    texts: m.tx || [],
    score: Game.prototype.score,
  };
  snapPrev = snapCur;
  snapCur = { view, at: performance.now() };
  state = m.ph; stateT = m.st; paused = !!m.paused; result = m.res;
  for (const [name, arg] of m.ev || []) sfx.play(name, arg);
  for (const [strength, ms] of m.rm || []) input.rumble(1, strength, ms);
}

// Gość rysuje świat płynnie: pozycje postaci wygładza między dwoma ostatnimi pakietami
function guestView() {
  if (!snapCur) return null;
  if (!snapPrev || snapPrev.view.round !== snapCur.view.round) return snapCur.view;
  const a = snapPrev.view, b = snapCur.view;
  const k = Math.min(1, (performance.now() - snapCur.at) / Math.max(16, snapCur.at - snapPrev.at));
  const mix = (p, q) => (!p || Math.hypot(q.x - p.x, q.y - p.y) > 160 ? q : { ...q, x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
  return {
    ...b,
    grannies: b.grannies.map((g, i) => mix(a.grannies[i], g)),
    boar: mix(a.boar, b.boar), forester: mix(a.forester, b.forester), hare: mix(a.hare, b.hare),
    squirrel: a.squirrel.state === b.squirrel.state ? mix(a.squirrel, b.squirrel) : b.squirrel,
  };
}

function netTick(dt) {
  if (mode === 'local' || net.status === 'idle') return;
  if (state !== 'hostWait' && state !== 'join' && (net.status === 'closed' || net.status === 'error' || net.stale)) {
    goMenu('Połączenie z drugim graczem zostało przerwane.');
    return;
  }
  if (net.status !== 'connected') return;
  frameNo++;
  if (state === 'title') {
    lobT -= dt;
    if (lobT <= 0) { lobT = 0.1; net.send({ t: 'lob', kind: C.PLAYERS[mySlot()].kind, ready: ready[mySlot()] }); }
  } else if (mode === 'host') {
    if (frameNo % 2 === 0 && game) net.send(snapshot());
  } else {
    const id = input.slots[1], st = input.state[id];
    if (st) {
      for (const b of BUTTONS) if (input.pressed(id, b)) counters[b]++;
      net.send({ t: 'in', mx: st.mx, my: st.my, c: counters });
    }
  }
}

// ---------- rozgrywka ----------
function startMatch() {
  game = new Game(gameSfx, input);
  lastBeep = 4;
  setState('countdown');
}

function finishRound() {
  const [a, b] = game.grannies.map((g) => game.score(g));
  const winner = a === b ? -1 : a > b ? 0 : 1;
  if (winner >= 0) game.wins[winner]++;
  const matchOver = winner >= 0 && game.wins[winner] >= C.WINS_NEEDED;
  result = {
    winner, matchOver,
    line: winner >= 0 ? C.line('win', winner) : '',
  };
  setState('roundEnd');
}

function update(dt) {
  input.poll();
  if (input.sources().some((id) => input.isPad(id) && input.anyPressed(id))) sfx.unlock();
  if (copiedT > 0) copiedT -= dt;

  switch (state) {
    case 'menu': {
      const n = nav();
      if (n.up) { menuIdx = (menuIdx + 2) % 3; sfx.play('select'); }
      if (n.down) { menuIdx = (menuIdx + 1) % 3; sfx.play('select'); }
      if (n.ok) {
        notice = '';
        sfx.play('ready');
        if (menuIdx === 0) { mode = 'local'; setState('title'); }
        else if (menuIdx === 1) { mode = 'host'; net.host(); setState('hostWait'); }
        else { mode = 'guest'; joinPos = 0; setState('join'); }
      }
      break;
    }
    case 'hostWait': {
      const n = nav();
      if (net.status === 'connected') { enterLobby(); break; }
      if (n.back) { goMenu(); break; }
      if (n.ok && net.status === 'error') net.host();
      break;
    }
    case 'join': {
      const n = nav();
      if (net.status === 'connected') { enterLobby(); break; }
      if (n.back) { goMenu(); break; }
      if (net.status === 'connecting') break;
      if (n.left) joinPos = (joinPos + 3) % 4;
      if (n.right) joinPos = (joinPos + 1) % 4;
      if (n.up) joinDigits[joinPos] = (joinDigits[joinPos] + 1) % 10;
      if (n.down) joinDigits[joinPos] = (joinDigits[joinPos] + 9) % 10;
      if (n.up || n.down || n.left || n.right) sfx.play('select');
      if (n.ok) { sfx.play('ready'); startJoin(); }
      break;
    }
    case 'title': {
      // B, gdy nikt przy tym komputerze jeszcze nie dołączył: powrót do menu
      const local = (id) => id && id !== 'net';
      if (!input.slots.some(local) && input.sources().some((id) => id !== 'net' && input.pressed(id, 'elbow'))) { goMenu(); break; }
      // dołączanie: każde źródło, które wciśnie przycisk, zajmuje wolne miejsce
      const justJoined = [];
      for (const id of input.sources()) {
        if (input.slots.includes(id) || !input.anyPressed(id)) continue;
        const free = input.slots.indexOf(null);
        if (free < 0) break;
        input.slots[free] = id;
        justJoined.push(free);
        sfx.play('join');
        input.rumble(free, 0.5, 150);
      }
      input.slots.forEach((id, i) => {
        if (id === 'net') return;                                                  // tym miejscem steruje druga strona
        if (id && !input.state[id]) { input.slots[i] = null; ready[i] = false; }   // odłączony pad zwalnia miejsce
        if (!input.slots[i] || justJoined.includes(i)) return;
        const st = input.state[input.slots[i]];
        // wybór postaci: lewo / prawo
        if (!ready[i] && Math.abs(st.mx) > 0.6 && Math.abs(prevMx[i]) <= 0.6) {
          const n = C.KINDS.length, k = C.KINDS.indexOf(C.PLAYERS[i].kind);
          C.PLAYERS[i].kind = C.KINDS[(k + (st.mx > 0 ? 1 : n - 1)) % n];
          sfx.play('select');
        }
        prevMx[i] = st.mx;
        if (!ready[i] && (input.pressed(id, 'collect') || input.pressed(id, 'start'))) {
          ready[i] = true; sfx.play('ready'); input.rumble(i, 0.4, 120);
        } else if (ready[i] && input.pressed(id, 'elbow')) ready[i] = false;
        else if (!ready[i] && input.pressed(id, 'elbow')) input.slots[i] = null;   // B: oddaj miejsce
      });
      if (ready[0] && ready[1]) {
        if (startIn === null) startIn = 0.9;
        startIn = Math.max(0, startIn - dt);
        if (startIn <= 0 && mode !== 'guest') { startIn = null; startMatch(); }   // gość czeka na gospodarza
      } else startIn = null;
      break;
    }
    case 'countdown': {
      if (mode === 'guest') break;
      if (checkPause()) break;
      const left = 3 - stateT;
      if (Math.ceil(left) < lastBeep && left > 0) { lastBeep = Math.ceil(left); gameSfx.play('beep'); }
      if (left <= 0) { gameSfx.play('go'); setState('play'); }
      break;
    }
    case 'play': {
      if (mode === 'guest') break;
      if (checkPause()) break;
      game.update(dt, [input.forSlot(0), input.forSlot(1)]);
      if (game.over) finishRound();
      break;
    }
    case 'roundEnd': {
      if (mode === 'guest') break;
      if (stateT > 2.4 && input.slots.some((id) => input.pressed(id, 'collect') || input.pressed(id, 'start'))) {
        if (result.matchOver) startMatch();
        else { game.newRound(); lastBeep = 4; setState('countdown'); }
      } else if (stateT > 2.4 && result.matchOver && input.slots.some((id) => input.pressed(id, 'elbow'))) {
        ready = [false, false];
        lobT = 0;
        setState('title');
      }
      break;
    }
  }
  netTick(dt);
}

// Pauza: Start na padzie, Esc, albo odłączony pad. Zwraca true, gdy gra stoi.
function checkPause() {
  const missing = [0, 1].some((i) => !input.connected(i));
  if (missing) paused = true;
  if (!missing && input.slots.some((id) => input.pressed(id, 'start'))) paused = !paused;
  if (paused) stateT -= lastDt;   // zamrażamy czas stanu
  return paused;
}

function draw() {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (state === 'menu') { R.drawMenu(ctx, time, menuIdx, notice, sfx.muted); return; }
  if (state === 'hostWait' || state === 'join') {
    R.drawNet(ctx, time, {
      screen: state === 'hostWait' ? 'host' : 'join', status: net.status, error: net.error, code: net.code,
      link: state === 'hostWait' && net.code ? roomLink() : '', copied: copiedT > 0, digits: joinDigits, pos: joinPos,
    });
    return;
  }
  const view = mode === 'guest' ? guestView() : game;
  if (state === 'title' || !view) {
    R.drawTitle(ctx, input, time, ready, sfx.muted, startIn, mode === 'local' ? '' : net.code);
    return;
  }
  R.drawWorld(ctx, view, time);
  if (state === 'countdown') R.drawCountdown(ctx, 3 - stateT, view);
  if (state === 'roundEnd' && result) R.drawRoundEnd(ctx, view, result, stateT, time);
  if (paused && state !== 'roundEnd') {
    const missing = mode === 'guest' ? undefined : [0, 1].find((i) => !input.connected(i));
    R.drawPause(ctx, missing !== undefined ? `${C.PLAYERS[missing].name}: pad odłączony — podłącz go ponownie` : '');
  }
}

let last = performance.now();
let lastDt = 0;
function frame(now) {
  lastDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += lastDt;
  stateT += lastDt;
  update(lastDt);
  draw();
  requestAnimationFrame(frame);
}

// Link z kodem pokoju (?pokoj=1234) od razu łączy z gospodarzem
const invited = new URLSearchParams(location.search).get('pokoj');
if (invited && /^\d{4}$/.test(invited)) {
  invited.split('').forEach((d, i) => { joinDigits[i] = +d; });
  setState('join');
  startJoin();
}
requestAnimationFrame(frame);

// Uchwyt do testów i majsterkowania z konsoli
window.__babcie = { get game() { return game; }, get state() { return state; }, get mode() { return mode; }, input, sfx, net, config: C };
