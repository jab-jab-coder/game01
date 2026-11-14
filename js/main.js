// Punkt wejścia: pętla gry i maszyna stanów (tytuł → odliczanie → runda → ważenie koszyków).
import * as C from './config.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { Game } from './game.js';
import * as R from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input();
const sfx = new Sfx();

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
addEventListener('keydown', (e) => {
  sfx.unlock();
  if (e.code === 'Escape' && (state === 'play' || state === 'countdown')) paused = !paused;
});
addEventListener('pointerdown', () => sfx.unlock());
canvas.addEventListener('dblclick', toggleFullscreen);

let state = 'title';     // title | countdown | play | roundEnd
let stateT = 0;          // czas w bieżącym stanie
let paused = false;
let game = null;
let result = null;
let lastBeep = 0;
let time = 0;
let ready = [false, false];   // wybór postaci zatwierdzony
let startIn = null;           // odliczanie do startu po zatwierdzeniu obu
const prevMx = [0, 0];

function setState(s) { state = s; stateT = 0; }

function startMatch() {
  game = new Game(sfx, input);
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

  switch (state) {
    case 'title': {
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
        if (id && !input.state[id]) { input.slots[i] = null; ready[i] = false; }   // odłączony pad zwalnia miejsce
        if (!input.slots[i] || justJoined.includes(i)) return;
        const st = input.state[input.slots[i]];
        // wybór postaci: lewo / prawo
        if (!ready[i] && Math.abs(st.mx) > 0.6 && Math.abs(prevMx[i]) <= 0.6) {
          C.PLAYERS[i].kind = C.PLAYERS[i].kind === 'babcia' ? 'dziadek' : 'babcia';
          sfx.play('select');
        }
        prevMx[i] = st.mx;
        if (!ready[i] && (input.pressed(input.slots[i], 'collect') || input.pressed(input.slots[i], 'start'))) {
          ready[i] = true; sfx.play('ready'); input.rumble(i, 0.4, 120);
        } else if (ready[i] && input.pressed(input.slots[i], 'elbow')) ready[i] = false;
      });
      if (ready[0] && ready[1]) {
        if (startIn === null) startIn = 0.9;
        startIn -= dt;
        if (startIn <= 0) { startIn = null; startMatch(); }
      } else startIn = null;
      break;
    }
    case 'countdown': {
      if (checkPause()) break;
      const left = 3 - stateT;
      if (Math.ceil(left) < lastBeep && left > 0) { lastBeep = Math.ceil(left); sfx.play('beep'); }
      if (left <= 0) { sfx.play('go'); setState('play'); }
      break;
    }
    case 'play': {
      if (checkPause()) break;
      game.update(dt, [input.forSlot(0), input.forSlot(1)]);
      if (game.over) finishRound();
      break;
    }
    case 'roundEnd': {
      if (stateT > 2.4 && input.slots.some((id) => input.pressed(id, 'collect') || input.pressed(id, 'start'))) {
        if (result.matchOver) startMatch();
        else { game.newRound(); lastBeep = 4; setState('countdown'); }
      } else if (stateT > 2.4 && result.matchOver && input.slots.some((id) => input.pressed(id, 'elbow'))) {
        ready = [false, false];
        setState('title');
      }
      break;
    }
  }
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
  if (state === 'title') {
    R.drawTitle(ctx, input, time, ready, sfx.muted, startIn);
    return;
  }
  R.drawWorld(ctx, game, time);
  if (state === 'countdown') R.drawCountdown(ctx, 3 - stateT, game);
  if (state === 'roundEnd') R.drawRoundEnd(ctx, game, result, stateT, time);
  if (paused && state !== 'roundEnd') {
    const missing = [0, 1].find((i) => !input.connected(i));
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
requestAnimationFrame(frame);

// Uchwyt do testów i majsterkowania z konsoli
window.__babcie = { get game() { return game; }, get state() { return state; }, input, sfx, config: C };
