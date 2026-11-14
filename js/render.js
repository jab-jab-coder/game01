// Całe rysowanie: las, babcie, dzik, grzyby, HUD i ekrany. Grafika jest generowana kodem.
import * as C from './config.js';

const FONT = '"Baloo 2","Trebuchet MS",Verdana,sans-serif';
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

function txt(ctx, text, x, y, size, color = '#fff', align = 'center', outline = 5, weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = outline;
    ctx.strokeStyle = 'rgba(30,20,10,0.85)';
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ell(ctx, x, y, rx, ry, color, a0 = 0, a1 = TAU) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, a0, a1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------- tło ----------
let bgCache = { key: null, canvas: null };

function background(key) {
  if (bgCache.key === key) return bgCache.canvas;
  const cv = document.createElement('canvas');
  cv.width = C.W; cv.height = C.H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, C.H);
  g.addColorStop(0, '#5f9a3c'); g.addColorStop(1, '#4a8232');
  c.fillStyle = g; c.fillRect(0, 0, C.W, C.H);

  for (let i = 0; i < 70; i++) {            // plamy mchu i światła
    ell(c, rand(0, C.W), rand(0, C.H), rand(40, 130), rand(20, 60),
      Math.random() < 0.5 ? 'rgba(40,90,30,0.16)' : 'rgba(170,210,90,0.12)');
  }
  c.lineCap = 'round';                       // leśna ścieżka
  c.strokeStyle = 'rgba(196,165,110,0.55)'; c.lineWidth = 46;
  c.beginPath();
  c.moveTo(-30, rand(250, 600));
  c.bezierCurveTo(rand(250, 450), rand(150, 650), rand(750, 950), rand(150, 650), C.W + 30, rand(250, 600));
  c.stroke();
  c.strokeStyle = 'rgba(214,188,135,0.5)'; c.lineWidth = 26; c.stroke();

  for (let i = 0; i < 520; i++) {            // kępki trawy
    const x = rand(0, C.W), y = rand(C.HUD_H, C.H);
    c.strokeStyle = Math.random() < 0.5 ? 'rgba(35,85,28,0.5)' : 'rgba(150,200,80,0.45)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y); c.lineTo(x - 3, y - 8);
    c.moveTo(x, y); c.lineTo(x + 3, y - 9);
    c.stroke();
  }
  for (let i = 0; i < 46; i++) {             // kwiatki i szyszki
    const x = rand(20, C.W - 20), y = rand(C.HUD_H + 20, C.H - 10);
    const col = ['#fff', '#ffe36e', '#f6b3d0', '#6b4a2b'][(Math.random() * 4) | 0];
    ell(c, x, y, 3.5, 3.5, col);
    if (col !== '#6b4a2b') ell(c, x, y, 1.5, 1.5, '#e9a400');
  }
  // gęstwina dookoła
  for (let i = 0; i < 90; i++) {
    const side = i % 4, t = Math.random();
    const x = side === 0 ? rand(-10, 26) : side === 1 ? rand(C.W - 26, C.W + 10) : t * C.W;
    const y = side < 2 ? C.HUD_H + t * (C.H - C.HUD_H) : side === 2 ? rand(C.HUD_H - 6, C.HUD_H + 26) : rand(C.H - 12, C.H + 12);
    ell(c, x, y, rand(22, 40), rand(18, 30), ['#2c5a22', '#346a27', '#27501f'][i % 3]);
  }
  bgCache = { key, canvas: cv };
  return cv;
}

// ---------- grzyby ----------
export function drawShroom(ctx, type, x, y, s = 1, age = 9) {
  const pop = age < 0.35 ? 0.2 + 0.8 * Math.sin((age / 0.35) * Math.PI / 2) * 1.08 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * pop, s * pop);
  ell(ctx, 0, 1, 13, 4, 'rgba(0,0,0,0.22)');
  const halfCap = (cy, rx, ry, col) => ell(ctx, 0, cy, rx, ry, col, Math.PI, TAU);
  switch (type) {
    case 'kurka':
      ctx.fillStyle = '#f2b824';
      ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(9, -15); ctx.lineTo(-9, -15); ctx.closePath(); ctx.fill();
      ell(ctx, 0, -15, 12, 5, '#ffc928');
      ell(ctx, 0, -14.5, 6, 2, '#e89e10');
      break;
    case 'podgrzybek':
      rrect(ctx, -3.5, -14, 7, 14, 3); ctx.fillStyle = '#e6d38f'; ctx.fill();
      halfCap(-11, 12, 10, '#5a3920');
      ell(ctx, -4, -16, 4, 2, 'rgba(255,255,255,0.18)');
      break;
    case 'borowik':
      ell(ctx, 0, -9, 9, 11, '#f4ecd6');
      halfCap(-15, 18, 13, '#8f5226');
      ell(ctx, -6, -22, 6, 3, 'rgba(255,255,255,0.25)');
      break;
    case 'kania':
    case 'muchomor': {
      const m = type === 'muchomor';
      if (m) ell(ctx, 0, -2, 6, 4, '#e9eedb');                     // bulwa u nasady
      rrect(ctx, -2.5, -30, 5, 30, 2); ctx.fillStyle = m ? '#edf1df' : '#e9dcc0'; ctx.fill();
      ell(ctx, 0, -19, 5.5, 2, m ? '#dfe6cb' : '#cdb890');         // pierścień
      ell(ctx, 0, -31, 19, 7.5, m ? '#c2cf97' : '#dcc7a0');
      if (m) {
        ell(ctx, 0, -32, 9, 3.5, '#aebd80');
      } else {
        ell(ctx, 0, -33, 5, 2.6, '#7a593a');
        ctx.fillStyle = '#9a7650';
        for (const [dx, dy] of [[-11, -31], [10, -30], [-6, -28], [5, -27], [-13, -34], [13, -34]]) ctx.fillRect(dx - 1.5, dy - 1, 3, 2);
      }
      break;
    }
  }
  ctx.restore();
}

// ---------- drzewa ----------
function drawTree(ctx, t, time, fade) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ell(ctx, 4, 2, t.R * 0.75, 12, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = '#6b4526';
  ctx.fillRect(-10, -t.R * 0.9, 20, t.R * 0.9 + 2);
  ctx.fillStyle = '#573619';
  ctx.fillRect(2, -t.R * 0.9, 8, t.R * 0.9 + 2);
  const sway = Math.sin(time * 1.2 + t.seed * 10) * 2;
  if (fade) ctx.globalAlpha = 0.4;           // ktoś stoi za drzewem — korona robi się przezroczysta
  if (t.kind === 1) {                       // świerk
    for (let i = 0; i < 3; i++) {
      const w = t.R * (1.0 - i * 0.24), y0 = -t.R * (0.5 + i * 0.62);
      ctx.fillStyle = ['#1f5a33', '#256b3c', '#2c7a45'][i];
      ctx.beginPath();
      ctx.moveTo(-w, y0); ctx.lineTo(w, y0); ctx.lineTo(sway * (i + 1) * 0.5, y0 - t.R * 0.95);
      ctx.closePath(); ctx.fill();
    }
  } else {                                  // drzewo liściaste
    const cy = -t.R * 1.35;
    ell(ctx, -t.R * 0.45 + sway, cy + 12, t.R * 0.7, t.R * 0.62, '#2f7030');
    ell(ctx, t.R * 0.45 + sway, cy + 14, t.R * 0.68, t.R * 0.6, '#2a652b');
    ell(ctx, sway, cy - 8, t.R * 0.8, t.R * 0.72, '#3b8438');
    ell(ctx, -t.R * 0.2 + sway, cy - 22, t.R * 0.36, t.R * 0.26, 'rgba(180,230,110,0.25)');
  }
  ctx.restore();
}

// ---------- babcie ----------
export function drawGranny(ctx, g, time, scale = 1) {
  const p = C.PLAYERS[g.id];
  const bob = g.moving ? Math.abs(Math.sin(g.walk)) * 3.5 : Math.sin(time * 2.4 + g.id) * 1;
  const step = g.moving ? Math.sin(g.walk) * 5 : 0;
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.scale(scale, scale);
  ell(ctx, 0, 0, 25, 8, 'rgba(0,0,0,0.28)');
  if (g.poison > 0) ctx.rotate(Math.sin(time * 9) * 0.16);
  if (g.stun > 0) ctx.rotate(-0.4 * g.flip);
  if (g.immune > 0 && g.stun <= 0 && Math.floor(time * 16) % 2) ctx.globalAlpha = 0.6;
  ctx.scale(g.flip, 1);

  // kapcie
  ell(ctx, -8 + step, -2, 8, 4.5, '#3b2a1e');
  ell(ctx, 9 - step, -2, 8, 4.5, '#3b2a1e');
  // laska
  ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-23 - step * 0.4, -1); ctx.lineTo(-19, -40 - bob);
  ctx.arc(-14, -40 - bob, 5, Math.PI, TAU * 0.92);
  ctx.stroke();
  // sukienka
  const top = -52 - bob;
  ctx.fillStyle = p.dress;
  ctx.beginPath();
  ctx.moveTo(-14, top); ctx.lineTo(14, top);
  ctx.quadraticCurveTo(24, -26, 22, -6); ctx.lineTo(-22, -6);
  ctx.quadraticCurveTo(-24, -26, -14, top);
  ctx.closePath(); ctx.fill();
  // fartuch
  ctx.fillStyle = p.apron;
  ctx.beginPath();
  ctx.moveTo(-2, top + 10); ctx.lineTo(14, top + 10);
  ctx.quadraticCurveTo(21, -24, 19, -9); ctx.lineTo(-4, -9);
  ctx.closePath(); ctx.fill();

  // koszyk
  const bx = 23, by = -24 - bob + (g.pickAnim > 0 ? 6 : 0);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(bx, by - 2, 11, Math.PI, TAU); ctx.stroke();
  const n = Math.min(g.basket.length, 5);
  for (let i = 0; i < n; i++) {
    const t = g.basket[g.basket.length - 1 - i];
    const col = { borowik: '#8f5226', kania: '#dcc7a0', podgrzybek: '#5a3920', kurka: '#ffc928' }[t];
    ell(ctx, bx - 8 + i * 4, by - 2 - (i % 2) * 3, 5, 4, col);
  }
  ell(ctx, bx, by, 13, 11, '#b07a3a', 0, Math.PI);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx - 11, by + 4); ctx.lineTo(bx + 11, by + 4); ctx.stroke();
  // ręka trzymająca koszyk
  ctx.strokeStyle = p.dress; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(10, top + 8); ctx.lineTo(bx - 2, by - 12); ctx.stroke();
  ell(ctx, bx - 1, by - 13, 4, 4, '#f1c7a5');

  // łokieć!
  if (g.elbowAnim > 0) {
    const k = Math.sin((1 - g.elbowAnim / 0.25) * Math.PI);
    ctx.strokeStyle = p.dress; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(8, top + 10); ctx.lineTo(22 + k * 26, top + 14); ctx.stroke();
    ell(ctx, 24 + k * 26, top + 14, 6, 6, '#f1c7a5');
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(36 + k * 26, top + 14 + i * 9); ctx.lineTo(48 + k * 30, top + 14 + i * 15);
      ctx.stroke();
    }
  }
  // a sio! — ręka w górze
  if (g.shooAnim > 0) {
    ctx.strokeStyle = p.dress; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(6, top + 8); ctx.lineTo(24, top - 18); ctx.stroke();
    ell(ctx, 25, top - 20, 5.5, 5.5, '#f1c7a5');
  }

  // głowa i chustka
  const hy = top - 11;
  ell(ctx, 0, hy, 15, 15, '#f1c7a5');
  ctx.fillStyle = p.scarf;
  ctx.beginPath();
  ctx.arc(0, hy, 16.5, Math.PI * 0.95, TAU * 0.99);
  ctx.quadraticCurveTo(9, hy - 7, 3, hy - 8);
  ctx.quadraticCurveTo(-8, hy - 6, -13, hy + 12);
  ctx.quadraticCurveTo(-19, hy + 6, -16.4, hy + 2.5);
  ctx.closePath(); ctx.fill();
  ell(ctx, -6, hy - 10, 2, 2, p.scarf2); ell(ctx, 3, hy - 13, 2, 2, p.scarf2); ell(ctx, -12, hy - 3, 2, 2, p.scarf2);
  ctx.fillStyle = p.scarf;                                   // supeł pod brodą
  ctx.beginPath(); ctx.moveTo(-2, hy + 14); ctx.lineTo(8, hy + 13); ctx.lineTo(4, hy + 21); ctx.closePath(); ctx.fill();
  ell(ctx, 9, hy + 5, 4, 3, 'rgba(240,120,120,0.45)');        // rumieniec

  // twarz
  ctx.strokeStyle = '#3a2618'; ctx.fillStyle = '#3a2618'; ctx.lineWidth = 2;
  if (g.stun > 0) {
    for (const ex of [3, 11]) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.5, hy - 3); ctx.lineTo(ex + 2.5, hy + 2);
      ctx.moveTo(ex + 2.5, hy - 3); ctx.lineTo(ex - 2.5, hy + 2);
      ctx.stroke();
    }
    ell(ctx, 8, hy + 9, 3, 3.5, '#3a2618');
  } else if (g.poison > 0) {
    for (const ex of [3, 11]) {
      ctx.beginPath(); ctx.arc(ex, hy, 3, time * 8, time * 8 + 5); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(3, hy + 9); ctx.quadraticCurveTo(6, hy + 6, 9, hy + 9); ctx.quadraticCurveTo(11, hy + 11, 13, hy + 8); ctx.stroke();
  } else {
    ell(ctx, 3.5, hy, 2, 2.4, '#3a2618'); ell(ctx, 10.5, hy, 2, 2.4, '#3a2618');
    ctx.beginPath();                                          // brwi — zawzięte
    ctx.moveTo(0.5, hy - 6); ctx.lineTo(5.5, hy - 4.5);
    ctx.moveTo(13.5, hy - 6); ctx.lineTo(8.5, hy - 4.5);
    ctx.stroke();
    ctx.beginPath();
    if (g.elbowAnim > 0 || g.shooAnim > 0) ctx.ellipse(8, hy + 8, 3, 4, 0, 0, TAU);
    else { ctx.moveTo(4, hy + 8); ctx.quadraticCurveTo(8, hy + 10, 12, hy + 7); }
    ctx.stroke();
  }
  if (g.id === 1) {                                           // okulary Krystyny
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(3.5, hy, 4.4, 0, TAU); ctx.moveTo(15, hy); ctx.arc(10.6, hy, 4.4, 0, TAU);
    ctx.moveTo(-1, hy); ctx.lineTo(-10, hy - 2); ctx.stroke();
  }
  ctx.restore();

  // gwiazdki / bąbelki nad głową (bez odbicia lustrzanego)
  if (g.stun > 0 || g.poison > 0) {
    ctx.save();
    ctx.translate(g.x, g.y - 88 * scale);
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * TAU) / 3;
      txt(ctx, g.stun > 0 ? '★' : '●', Math.cos(a) * 20, Math.sin(a) * 6, 16, g.stun > 0 ? '#ffe45c' : '#9be05a', 'center', 3);
    }
    ctx.restore();
  }
}

function drawBubble(ctx, g) {
  if (g.bubbleT <= 0 || !g.bubble) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, g.bubbleT * 4);
  ctx.font = `600 19px ${FONT}`;
  const w = ctx.measureText(g.bubble).width + 24, h = 32;
  const x = Math.max(8, Math.min(C.W - w - 8, g.x - w / 2));
  const y = Math.max(C.HUD_H + 4, g.y - 150);
  rrect(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#fffdf4'; ctx.fill();
  ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g.x - 7, y + h - 1); ctx.lineTo(g.x, y + h + 10); ctx.lineTo(g.x + 7, y + h - 1);
  ctx.fillStyle = '#fffdf4'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(g.x - 7, y + h); ctx.lineTo(g.x, y + h + 10); ctx.lineTo(g.x + 7, y + h); ctx.stroke();
  txt(ctx, g.bubble, x + w / 2, y + h / 2 + 1, 19, '#3a2618', 'center', 0, 600);
  ctx.restore();
}

// ---------- dzik ----------
function drawBoar(ctx, b, time) {
  const run = b.state === 'charge' || b.state === 'flee' || b.state === 'enter';
  const shakeX = b.state === 'paw' ? Math.sin(time * 40) * 2 : 0;
  const leg = run ? Math.sin(time * 30) * 7 : b.state === 'paw' ? Math.max(0, Math.sin(time * 12)) * 8 : 0;
  ctx.save();
  ctx.translate(b.x + shakeX, b.y);
  ell(ctx, 0, 2, 46, 11, 'rgba(0,0,0,0.3)');
  ctx.scale(b.flip, 1);
  ctx.fillStyle = '#2e2018';
  ctx.fillRect(-26 - leg, -14, 8, 16); ctx.fillRect(-12 + leg, -14, 8, 16);
  ctx.fillRect(12 - leg, -14, 8, 16); ctx.fillRect(24 + leg, -14, 8, 14);
  ell(ctx, -2, -32, 42, 25, '#5b4030');
  ell(ctx, -8, -42, 30, 12, '#4a3326');
  ctx.strokeStyle = '#3a271c'; ctx.lineWidth = 3; ctx.lineCap = 'round';      // szczecina
  for (let i = 0; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(-30 + i * 9, -52); ctx.lineTo(-34 + i * 9, -62); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-42, -36); ctx.quadraticCurveTo(-54, -44, -48, -30); ctx.stroke();   // ogon
  ell(ctx, 34, -28, 22, 19, '#644736');                       // łeb
  ell(ctx, 53, -22, 11, 9, '#8a6a58');                        // ryj
  ell(ctx, 56, -24, 2, 2.5, '#2e2018'); ell(ctx, 56, -19, 2, 2.5, '#2e2018');
  ctx.fillStyle = '#fff8e6';                                  // szable
  ctx.beginPath(); ctx.moveTo(44, -16); ctx.lineTo(50, -16); ctx.lineTo(49, -29); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3326';                                  // ucho
  ctx.beginPath(); ctx.moveTo(22, -42); ctx.lineTo(32, -44); ctx.lineTo(24, -56); ctx.closePath(); ctx.fill();
  const angry = b.state === 'paw' || b.state === 'charge';
  ell(ctx, 38, -33, 4, 4, angry ? '#ff3b30' : '#fff');
  ell(ctx, 39, -33, 2, 2, '#1a1008');
  if (angry) {
    ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(31, -40); ctx.lineTo(43, -36); ctx.stroke();
  }
  if (b.state === 'flee') txt(ctx, '💧', 20, -64, 20, '#fff', 'center', 0);
  ctx.restore();
}

function drawBoarGround(ctx, game, time) {
  const b = game.boar;
  if (b.state === 'warn') {
    const left = b.x < 0, x = left ? 46 : C.W - 46;
    const pulse = 1 + Math.sin(time * 14) * 0.15;
    ctx.save();
    ctx.translate(x, b.y - 30); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffcf2e'; ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(30, 22); ctx.lineTo(-30, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    txt(ctx, '!', 0, 4, 36, '#3a2618', 'center', 0);
    ctx.restore();
    txt(ctx, 'DZIK!', x + (left ? 62 : -62), b.y - 30, 28, '#ffcf2e', left ? 'left' : 'right');
  }
  if (b.state === 'paw') {
    const [g0, g1] = game.grannies;
    const near = (g) => Math.hypot(g.x - b.x, g.y - b.y) < C.SHOO_R;
    const both = near(g0) && near(g1);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(b.x, b.y, C.SHOO_R, C.SHOO_R * 0.92, 0, 0, TAU);
    ctx.fillStyle = both ? 'rgba(125,255,138,0.13)' : 'rgba(255,255,255,0.07)'; ctx.fill();
    ctx.setLineDash([14, 10]); ctx.lineDashOffset = -time * 40;
    ctx.strokeStyle = both ? 'rgba(125,255,138,0.9)' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    // pasek "zaraz ruszy"
    const k = Math.max(0, b.t / C.BOAR_PAW_TIME);
    rrect(ctx, b.x - 40, b.y - 92, 80, 10, 5); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
    rrect(ctx, b.x - 38, b.y - 90, 76 * k, 6, 3); ctx.fillStyle = k < 0.35 ? '#ff4d3d' : '#ffcf2e'; ctx.fill();
  }
}

function drawPrompts(ctx, game, time) {
  const b = game.boar;
  for (const g of game.grannies) {
    // pasek odnowienia zrywu
    if (g.dashCd > 0) {
      rrect(ctx, g.x - 20, g.y + 12, 40, 6, 3); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      rrect(ctx, g.x - 19, g.y + 13, 38 * (1 - g.dashCd / C.DASH_CD), 4, 2); ctx.fillStyle = '#fff'; ctx.fill();
    }
    if (b.state === 'paw' && Math.hypot(g.x - b.x, g.y - b.y) < C.SHOO_R && g.stun <= 0) {
      const ok = g.shooT > 0, s = 1 + Math.sin(time * 12) * 0.12;
      ctx.save();
      ctx.translate(g.x + 50, g.y - 92); ctx.scale(s, s);
      ell(ctx, 0, 0, 17, 17, '#1b1b1b'); ell(ctx, 0, 0, 14, 14, ok ? '#49d463' : '#2f7fe0');
      txt(ctx, ok ? '✓' : 'X', 0, 1, 20, '#fff', 'center', 0);
      ctx.restore();
    }
  }
}

// ---------- HUD ----------
function drawHud(ctx, game, time) {
  const g = ctx.createLinearGradient(0, 0, 0, C.HUD_H);
  g.addColorStop(0, '#3b2a1c'); g.addColorStop(1, '#2a1d12');
  ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.HUD_H);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, C.HUD_H - 4, C.W, 4);

  game.grannies.forEach((gr, i) => {
    const p = C.PLAYERS[i], left = i === 0, dir = left ? 1 : -1;
    const x = left ? 50 : C.W - 50, align = left ? 'left' : 'right';
    ell(ctx, x, 42, 30, 30, p.ui);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, 42, 27, 0, TAU); ctx.clip();
    ell(ctx, x, 42, 27, 27, '#f6ead4');
    drawGranny(ctx, { ...gr, x, y: 98, flip: dir, moving: false, stun: 0, poison: 0, immune: 0, elbowAnim: 0, shooAnim: 0, pickAnim: 0, basket: [] }, 0, 1.15);
    ctx.restore();
    txt(ctx, p.name, x + dir * 42, 24, 22, p.ui, align, 4);
    txt(ctx, `${game.score(gr)}`, x + dir * 42, 55, 40, '#fff', align, 5);
    for (let w = 0; w < C.WINS_NEEDED; w++) {
      txt(ctx, '★', x + dir * (190 + w * 30), 25, 28, w < game.wins[i] ? '#ffd23e' : 'rgba(255,255,255,0.18)', 'center', 0);
    }
    // podgląd koszyka
    C.TYPE_ORDER.forEach((t, k) => {
      const cnt = gr.basket.filter((b) => b === t).length;
      const sx = x + dir * (150 + k * 62);
      ctx.globalAlpha = cnt ? 1 : 0.35;
      drawShroom(ctx, t, sx, 70, 0.62);
      txt(ctx, `${cnt}`, sx + 14, 60, 18, '#fff', 'left', 3, 600);
      ctx.globalAlpha = 1;
    });
    if (gr.poison > 0) txt(ctx, `odwrócone! ${Math.ceil(gr.poison)}`, x + dir * 250, 25, 18, '#9be05a', align, 4, 600);
  });

  const tm = Math.ceil(game.time), dusk = game.time <= C.DUSK_TIME;
  const pulse = dusk ? 1 + Math.abs(Math.sin(time * 5)) * 0.08 : 1;
  txt(ctx, `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, C.W / 2, 36, 46 * pulse, dusk ? '#ff7a5c' : '#fff');
  txt(ctx, dusk ? 'Zmierzcha się!' : `Runda ${game.round}`, C.W / 2, 68, 17, dusk ? '#ffb38a' : '#d9c7a8', 'center', 3, 600);
}

// ---------- świat ----------
export function drawWorld(ctx, game, time) {
  ctx.save();
  if (game.shake > 0) ctx.translate(rand(-1, 1) * game.shake * 22, rand(-1, 1) * game.shake * 22);
  ctx.drawImage(background('r' + game.round + '-' + game.wins.join('')), 0, 0);
  drawBoarGround(ctx, game, time);

  const items = [];
  const movers = [...game.grannies, game.boar];
  game.trees.forEach((t) => {
    const fade = movers.some((m) => m.y < t.y && m.y > t.y - t.R * 2.6 && Math.abs(m.x - t.x) < t.R * 1.3);
    items.push({ y: t.y, draw: () => drawTree(ctx, t, time, fade) });
  });
  game.shrooms.forEach((s) => items.push({
    y: s.y - 6, draw: () => {
      ctx.globalAlpha = Math.min(1, s.ttl);
      drawShroom(ctx, s.type, s.x, s.y, 1.7, s.age);
      if (s.type === 'borowik' && Math.sin(time * 5 + s.x) > 0.75) txt(ctx, '✦', s.x + 22, s.y - 46, 20, '#fff7c2', 'center', 0);
      ctx.globalAlpha = 1;
    },
  }));
  game.grannies.forEach((g) => items.push({ y: g.y, draw: () => drawGranny(ctx, g, time, 1.2) }));
  const b = game.boar;
  if (b.state !== 'idle' && b.state !== 'warn') items.push({ y: b.y, draw: () => drawBoar(ctx, b, time) });
  items.sort((a, c) => a.y - c.y).forEach((it) => it.draw());

  for (const p of game.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ell(ctx, p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  drawPrompts(ctx, game, time);
  game.grannies.forEach((g) => drawBubble(ctx, g));
  for (const t of game.texts) {
    ctx.globalAlpha = Math.min(1, (t.life - t.t) * 3);
    txt(ctx, t.text, t.x, t.y, t.size * (1 + Math.max(0, 0.2 - t.t) * 2), t.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (game.time <= C.DUSK_TIME) {            // zmierzch
    const k = 1 - game.time / C.DUSK_TIME;
    const g = ctx.createRadialGradient(C.W / 2, C.H / 2, 200, C.W / 2, C.H / 2, 800);
    g.addColorStop(0, `rgba(255,140,60,${0.06 * k})`);
    g.addColorStop(1, `rgba(40,20,80,${0.5 * k})`);
    ctx.fillStyle = g; ctx.fillRect(0, C.HUD_H, C.W, C.H - C.HUD_H);
  }
  drawHud(ctx, game, time);
}

// ---------- ekrany ----------
function panel(ctx, x, y, w, h, fill = 'rgba(42,29,18,0.9)') {
  rrect(ctx, x, y, w, h, 22);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = '#c79a5b'; ctx.lineWidth = 4; ctx.stroke();
}

function padBtn(ctx, x, y, label, color) {
  ell(ctx, x, y, 15, 15, '#1b1b1b'); ell(ctx, x, y, 12.5, 12.5, color);
  txt(ctx, label, x, y + 1, label.length > 1 ? 12 : 17, '#fff', 'center', 0);
}

export function drawTitle(ctx, input, time, canStart, muted) {
  ctx.drawImage(background('title'), 0, 0);
  ctx.fillStyle = 'rgba(20,35,15,0.35)'; ctx.fillRect(0, 0, C.W, C.H);

  ctx.save();
  ctx.translate(C.W / 2, 92); ctx.rotate(Math.sin(time * 1.5) * 0.015);
  txt(ctx, 'BABCIE NA GRZYBY', 0, 0, 92, '#ffe9b0', 'center', 14);
  ctx.restore();
  txt(ctx, 'dwie sąsiadki · jeden las · jeden dzik', C.W / 2, 156, 26, '#fff', 'center', 5, 600);

  // karty graczy
  [0, 1].forEach((i) => {
    const p = C.PLAYERS[i], joined = !!input.slots[i];
    const x = i === 0 ? 70 : C.W - 70 - 300;
    panel(ctx, x, 200, 300, 300, joined ? 'rgba(42,29,18,0.92)' : 'rgba(42,29,18,0.7)');
    ctx.globalAlpha = joined ? 1 : 0.45;
    drawGranny(ctx, {
      id: i, x: x + 150, y: 400, flip: i === 0 ? 1 : -1, basket: joined ? ['borowik', 'kurka', 'kania'] : [],
      moving: joined, walk: time * 7, stun: 0, poison: 0, immune: 0, elbowAnim: 0, shooAnim: 0, pickAnim: 0,
    }, time, 2);
    ctx.globalAlpha = 1;
    txt(ctx, p.name, x + 150, 232, 34, p.ui);
    if (joined) txt(ctx, `gotowa · ${input.label(i)}`, x + 150, 465, 22, '#7dff8a', 'center', 4, 600);
    else if (Math.sin(time * 5) > -0.4) txt(ctx, 'wciśnij przycisk na padzie', x + 150, 465, 21, '#fff', 'center', 4, 600);
  });

  // środek: sterowanie i punktacja
  panel(ctx, 400, 200, 480, 300);
  txt(ctx, 'STEROWANIE', 640, 226, 20, '#c79a5b', 'center', 0);
  const rows = [
    ['A', '#3fae4f', 'zbierz grzyba'],
    ['B', '#d8443c', 'łokieć — sąsiadce wypada grzyb'],
    ['X', '#2f7fe0', '„a sio!” — razem przeganiacie dzika'],
    ['RT', '#555', 'zryw z laską'],
  ];
  rows.forEach(([b, col, d], k) => {
    padBtn(ctx, 436, 258 + k * 34, b, col);
    txt(ctx, d, 462, 259 + k * 34, 20, '#fff', 'left', 0, 600);
  });
  txt(ctx, 'lewa gałka — chodzenie', 640, 258 + 4 * 34 - 4, 18, '#d9c7a8', 'center', 0, 600);
  ctx.fillStyle = 'rgba(199,154,91,0.4)'; ctx.fillRect(424, 408, 432, 2);
  const sc = [['borowik', '+5'], ['kania', '+4'], ['podgrzybek', '+3'], ['kurka', '+1'], ['muchomor', '−3']];
  sc.forEach(([t, pts], k) => {
    const sx = 448 + k * 92;
    drawShroom(ctx, t, sx, 462, 1.1);
    txt(ctx, pts, sx + 22, 448, 22, t === 'muchomor' ? '#ff7a6b' : '#ffe45c', 'left', 0);
  });
  txt(ctx, 'kania czy muchomor? patrz uważnie…', 640, 484, 16, '#d9c7a8', 'center', 0, 600);

  if (canStart) {
    const s = 1 + Math.sin(time * 6) * 0.04;
    txt(ctx, 'Wciśnij A — idziemy do lasu!', C.W / 2, 560, 44 * s, '#7dff8a', 'center', 8);
  } else {
    txt(ctx, 'Podłączcie dwa pady i wciśnijcie na każdym dowolny przycisk', C.W / 2, 556, 26, '#fff', 'center', 5, 600);
  }
  txt(ctx, 'Gramy do 2 wygranych rund · runda trwa 90 s · F11 lub dwuklik — pełny ekran', C.W / 2, 618, 19, '#e6d9bd', 'center', 4, 600);
  txt(ctx, 'Bez padów? Klawiatura: WSAD + F G H R   oraz   strzałki + K L J I', C.W / 2, 650, 17, '#cbbd9e', 'center', 4, 600);
  if (muted) txt(ctx, '🔇 kliknij myszką lub wciśnij klawisz, żeby włączyć dźwięk', C.W / 2, 690, 17, '#ffcf2e', 'center', 4, 600);
}

export function drawCountdown(ctx, t) {
  const n = Math.ceil(t), frac = t - Math.floor(t);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, C.HUD_H, C.W, C.H - C.HUD_H);
  txt(ctx, n > 0 ? `${n}` : 'START!', C.W / 2, C.H / 2 + 20, 150 * (0.8 + frac * 0.4), '#ffe9b0', 'center', 16);
  txt(ctx, 'Na grzyby, gotowe…', C.W / 2, C.H / 2 - 110, 34, '#fff', 'center', 6, 600);
}

export function drawPause(ctx, reason) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, C.W, C.H);
  txt(ctx, 'PAUZA', C.W / 2, C.H / 2 - 30, 90, '#ffe9b0', 'center', 12);
  txt(ctx, reason || 'Start — wracamy do lasu', C.W / 2, C.H / 2 + 50, 28, '#fff', 'center', 5, 600);
}

// Ważenie koszyków po rundzie; res = { winner: 0|1|-1, matchOver, line }
export function drawRoundEnd(ctx, game, res, t, time) {
  ctx.fillStyle = 'rgba(10,15,8,0.72)'; ctx.fillRect(0, 0, C.W, C.H);
  txt(ctx, res.matchOver ? 'KONIEC GRZYBOBRANIA' : `KONIEC RUNDY ${game.round}`, C.W / 2, 70, 58, '#ffe9b0', 'center', 10);
  txt(ctx, 'ważenie koszyków', C.W / 2, 116, 22, '#d9c7a8', 'center', 4, 600);

  game.grannies.forEach((g, i) => {
    const p = C.PLAYERS[i], x = i === 0 ? 150 : C.W - 150 - 400, won = res.winner === i;
    panel(ctx, x, 150, 400, 400, won ? 'rgba(60,48,20,0.95)' : 'rgba(42,29,18,0.92)');
    if (won) { ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 6; rrect(ctx, x, 150, 400, 400, 22); ctx.stroke(); }
    txt(ctx, p.name, x + 200, 186, 36, p.ui);
    let row = 0;
    const line = (drawIcon, label, val, color = '#fff') => {
      if (t < 0.25 + row * 0.22) { row++; return; }
      const y = 242 + row * 44;
      drawIcon(x + 60, y + 14);
      txt(ctx, label, x + 96, y, 23, '#fff', 'left', 0, 600);
      txt(ctx, val, x + 360, y, 26, color, 'right', 0);
      row++;
    };
    C.TYPE_ORDER.forEach((type) => {
      const n = g.basket.filter((b) => b === type).length, pts = C.TYPES[type].pts;
      line((sx, sy) => drawShroom(ctx, type, sx, sy, 0.95), `${C.TYPES[type].name} × ${n}`, `${n * pts}`, n ? '#fff' : 'rgba(255,255,255,0.4)');
    });
    line((sx, sy) => txt(ctx, '±', sx, sy - 14, 28, '#d9c7a8', 'center', 0), 'dzik i muchomory', `${g.bonus > 0 ? '+' : ''}${g.bonus}`.replace('-', '−'),
      g.bonus < 0 ? '#ff7a6b' : g.bonus > 0 ? '#7dff8a' : 'rgba(255,255,255,0.4)');
    if (t > 1.5) {
      ctx.fillStyle = 'rgba(199,154,91,0.5)'; ctx.fillRect(x + 36, 462, 328, 2);
      txt(ctx, 'RAZEM', x + 96, 502, 26, '#d9c7a8', 'left', 0);
      txt(ctx, `${game.score(g)}`.replace('-', '−'), x + 360, 500, 56, won ? '#ffd23e' : '#fff', 'right', 6);
      for (let w = 0; w < C.WINS_NEEDED; w++) txt(ctx, '★', x + 44 + w * 26, 500, 26, w < game.wins[i] ? '#ffd23e' : 'rgba(255,255,255,0.18)', 'center', 0);
    }
  });

  if (t > 1.5) {
    const s = 1 + Math.sin(time * 5) * 0.03;
    const head = res.winner < 0 ? 'Remis! Dzik jest rozczarowany.'
      : res.matchOver ? `Królowa lasu: ${C.PLAYERS[res.winner].name}!`
      : `Rundę wygrywa ${C.PLAYERS[res.winner].name}!`;
    txt(ctx, head, C.W / 2, 598, 46 * s, res.winner < 0 ? '#fff' : C.PLAYERS[res.winner].ui, 'center', 9);
    if (res.line) txt(ctx, `„${res.line}”`, C.W / 2, 642, 22, '#fff', 'center', 4, 600);
  }
  if (t > 2.4 && Math.sin(time * 5) > -0.5) {
    txt(ctx, res.matchOver ? 'A — rewanż' : 'A — następna runda', C.W / 2, 686, 24, '#7dff8a', 'center', 5, 600);
  }
}
