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
    line: winner >= 0 ? C.LINES.win[(Math.random() * C.LINES.win.length) | 0] : '',
  };
  setState('roundEnd');
}

function update(dt) {
  input.poll();
  if (input.sources().some((id) => input.isPad(id) && input.anyPressed(id))) sfx.unlock();

  switch (state) {
    case 'title': {
      // dołączanie: każde źródło, które wciśnie przycisk, zajmuje wolne miejsce
      for (const id of input.sources()) {
        if (input.slots.includes(id) || !input.anyPressed(id)) continue;
        const free = input.slots.indexOf(null);
        if (free < 0) break;
        input.slots[free] = id;
        sfx.play('join');
        input.rumble(free, 0.5, 150);
        stateT = 0;
      }
      // odłączony pad zwalnia miejsce
      input.slots.forEach((id, i) => { if (id && !input.state[id]) input.slots[i] = null; });
      const ready = input.slots.every(Boolean) && stateT > 0.5;
      if (ready && input.slots.some((id) => input.pressed(id, 'collect') || input.pressed(id, 'start'))) startMatch();
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
    R.drawTitle(ctx, input, time, input.slots.every(Boolean), sfx.muted);
    return;
  }
  R.drawWorld(ctx, game, time);
  if (state === 'countdown') R.drawCountdown(ctx, 3 - stateT);
  if (state === 'roundEnd') R.drawRoundEnd(ctx, game, result, stateT, time);
  if (paused && state !== 'roundEnd') {
    const missing = [0, 1].find((i) => !input.connected(i));
    R.drawPause(ctx, missing !== undefined ? `${C.PLAYERS[missing].name} zgubiła pada — podłącz go ponownie` : '');
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
