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

function background(key, game) {
  if (bgCache.key === key) return bgCache.canvas;
  const id = game?.map.id;
  const bor = id === 'staw', dz = id === 'dzialka', rz = id === 'rzeka';
  const cv = document.createElement('canvas');
  cv.width = C.W; cv.height = C.H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, C.H);
  g.addColorStop(0, bor ? '#6c8440' : dz ? '#74b04a' : rz ? '#5a9a4a' : '#5f9a3c');
  g.addColorStop(1, bor ? '#566b30' : dz ? '#63a03e' : rz ? '#437d3c' : '#4a8232');
  c.fillStyle = g; c.fillRect(0, 0, C.W, C.H);

  for (let i = 0; i < 70; i++) {            // plamy mchu i światła
    ell(c, rand(0, C.W), rand(0, C.H), rand(40, 130), rand(20, 60),
      Math.random() < 0.5 ? 'rgba(40,90,30,0.16)' : bor ? 'rgba(190,130,50,0.14)' : 'rgba(170,210,90,0.12)');
  }
  if (bor) {                                 // opadłe liście i igliwie
    for (let i = 0; i < 260; i++) {
      c.save();
      c.translate(rand(0, C.W), rand(C.HUD_H, C.H)); c.rotate(rand(0, 3.14));
      ell(c, 0, 0, rand(3, 6), rand(1.5, 3), ['rgba(214,150,40,0.7)', 'rgba(190,90,40,0.6)', 'rgba(230,190,70,0.6)'][i % 3]);
      c.restore();
    }
  }
  if (dz) {                                  // skoszony trawnik w pasy
    for (let x = 0; x < C.W; x += 96) { c.fillStyle = 'rgba(255,255,255,0.045)'; c.fillRect(x, C.HUD_H, 48, C.H); }
  }
  c.lineCap = 'round';                       // leśna ścieżka
  if (!dz) {
  c.strokeStyle = 'rgba(196,165,110,0.55)'; c.lineWidth = 46;
  c.beginPath();
  c.moveTo(-30, rand(250, 600));
  c.bezierCurveTo(rand(250, 450), rand(150, 650), rand(750, 950), rand(150, 650), C.W + 30, rand(250, 600));
  c.stroke();
  c.strokeStyle = 'rgba(214,188,135,0.5)'; c.lineWidth = 26; c.stroke();
  }
  if (rz) {                                  // rzeka z dwiema kładkami
    const rv = game.river;
    const path = () => {
      c.beginPath();
      for (let y = C.HUD_H - 30; y <= C.H + 30; y += 8) c.lineTo(rv.xAt(y), y);
    };
    c.lineCap = 'butt'; c.lineJoin = 'round';
    path(); c.strokeStyle = '#c9b57c'; c.lineWidth = (rv.hw + 16) * 2; c.stroke();     // piaszczysty brzeg
    path(); c.strokeStyle = '#2b6d8c'; c.lineWidth = rv.hw * 2; c.stroke();
    path(); c.strokeStyle = '#3c89a8'; c.lineWidth = rv.hw * 1.1; c.stroke();
    path(); c.setLineDash([18, 30]); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 14; i++) {             // kamienie
      const y = rand(C.HUD_H + 20, C.H - 10), x = rv.xAt(y) + rand(-rv.hw, rv.hw) * 0.8;
      ell(c, x, y, rand(5, 10), rand(3, 6), i % 2 ? '#9aa3a8' : '#7d868c');
    }
    for (const b of rv.bridges) {
      const bx = rv.xAt(b.y), w = rv.hw + 30;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx - w, b.y - 18, w * 2, 46);
      c.fillStyle = '#a9743c'; c.fillRect(bx - w, b.y - 24, w * 2, 46);
      c.strokeStyle = '#7a4f24'; c.lineWidth = 2;
      for (let x = bx - w; x <= bx + w; x += 13) { c.beginPath(); c.moveTo(x, b.y - 24); c.lineTo(x, b.y + 22); c.stroke(); }
      c.fillStyle = '#6b4526'; c.fillRect(bx - w, b.y - 28, w * 2, 5); c.fillRect(bx - w, b.y + 20, w * 2, 5);
    }
    c.lineCap = 'round';
  }
  if (dz) {                                  // grządki i dróżka do domku
    const h = game.rects[0];
    c.strokeStyle = 'rgba(214,188,135,0.75)'; c.lineWidth = 34;
    c.beginPath(); c.moveTo(h.x + h.w / 2, h.y + h.h); c.quadraticCurveTo(h.x + h.w / 2 - 30, C.H - 120, h.x + h.w / 2 + 40, C.H + 20); c.stroke();
    for (const [bx, by] of [[110, 170], [110, 590], [C.W - 250, 170], [C.W - 250, 600]]) {
      c.fillStyle = '#6b4a2b'; rrect(c, bx, by, 140, 54, 8); c.fill();
      for (let i = 0; i < 12; i++) {
        const px = bx + 14 + (i % 6) * 22, py = by + 16 + ((i / 6) | 0) * 24;
        ell(c, px, py, 7, 6, ['#3e8c3a', '#58a83c'][i % 2]);
        if (by > 300) ell(c, px, py - 1, 3, 3, ['#e8452f', '#f2c12e'][(bx > 600) ? 1 : 0]);
      }
    }
  }
  if (bor) {                                 // staw
    const w = game.pond;
    ell(c, w.x, w.y + 4, w.rx + 16, w.ry + 14, '#5a4a2c');
    ell(c, w.x, w.y, w.rx + 6, w.ry + 5, '#4c6a3a');
    ell(c, w.x, w.y, w.rx, w.ry, '#2c6976');
    ell(c, w.x - w.rx * 0.12, w.y - w.ry * 0.15, w.rx * 0.72, w.ry * 0.62, '#3a8391');
    ell(c, w.x - w.rx * 0.3, w.y - w.ry * 0.35, w.rx * 0.28, w.ry * 0.16, 'rgba(255,255,255,0.14)');
    for (let i = 0; i < 9; i++) {              // lilie wodne
      const a = rand(0, TAU), k = rand(0.2, 0.8);
      const lx = w.x + Math.cos(a) * w.rx * k, ly = w.y + Math.sin(a) * w.ry * k;
      ell(c, lx, ly, 11, 7, '#4f9a4a');
      if (i % 3 === 0) ell(c, lx + 2, ly - 2, 4, 3.5, '#fff3f8');
    }
    c.lineCap = 'round';
    for (let i = 0; i < 44; i++) {             // trzciny na brzegu
      const a = rand(0, TAU);
      const rx0 = w.x + Math.cos(a) * (w.rx + 4), ry0 = w.y + Math.sin(a) * (w.ry + 4);
      const h = rand(22, 40), lean = rand(-5, 5);
      c.strokeStyle = '#6f8f3c'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(rx0, ry0); c.lineTo(rx0 + lean, ry0 - h); c.stroke();
      if (i % 2) { c.strokeStyle = '#6b4526'; c.lineWidth = 5; c.beginPath(); c.moveTo(rx0 + lean, ry0 - h); c.lineTo(rx0 + lean * 1.2, ry0 - h - 9); c.stroke(); }
    }
  }

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
  if (dz) {                                  // płot ze sztachet zamiast gęstwiny
    c.fillStyle = '#b98a4e'; c.strokeStyle = '#7a5226'; c.lineWidth = 1.5;
    const picket = (x, y) => { c.beginPath(); c.moveTo(x - 6, y + 20); c.lineTo(x - 6, y - 12); c.lineTo(x, y - 20); c.lineTo(x + 6, y - 12); c.lineTo(x + 6, y + 20); c.closePath(); c.fill(); c.stroke(); };
    c.fillRect(0, C.HUD_H + 14, C.W, 5); c.fillRect(0, C.H - 14, C.W, 5);
    for (let x = 8; x < C.W; x += 18) { picket(x, C.HUD_H + 16); picket(x, C.H - 8); }
    for (let y = C.HUD_H + 30; y < C.H; y += 22) { picket(8, y); picket(C.W - 8, y); }
  }
  // gęstwina dookoła
  for (let i = 0; i < (dz ? 0 : 90); i++) {
    const side = i % 4, t = Math.random();
    const x = side === 0 ? rand(-10, 26) : side === 1 ? rand(C.W - 26, C.W + 10) : t * C.W;
    const y = side < 2 ? C.HUD_H + t * (C.H - C.HUD_H) : side === 2 ? rand(C.HUD_H - 6, C.HUD_H + 26) : rand(C.H - 12, C.H + 12);
    ell(c, x, y, rand(22, 40), rand(18, 30), (bor ? ['#2a4a26', '#31552a', '#243f20'] : ['#2c5a22', '#346a27', '#27501f'])[i % 3]);
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
    case 'amanita':                                            // czerwony w białe kropki
      if (true) {
        rrect(ctx, -4, -17, 8, 17, 3); ctx.fillStyle = '#f7f3ea'; ctx.fill();
        ell(ctx, 0, -9, 6.5, 2.2, '#e4dccb');
        halfCap(-13, 17, 14, '#d8271f');
        ell(ctx, 0, -13, 17, 3, '#b81d17');
        for (const [dx, dy, r] of [[-9, -18, 2.6], [-2, -23, 2.8], [7, -19, 2.4], [11, -15.5, 1.8], [-13, -15, 1.7], [3, -16.5, 1.6]]) ell(ctx, dx, dy, r, r * 0.8, '#fff');
      }
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
  if (t.kind === 2) {                       // brzoza: biały pień w czarne ciapki
    ctx.fillStyle = '#f1efe6'; ctx.fillRect(-8, -t.R * 1.1, 16, t.R * 1.1 + 2);
    ctx.fillStyle = '#d8d5c8'; ctx.fillRect(2, -t.R * 1.1, 6, t.R * 1.1 + 2);
    ctx.fillStyle = '#2b2b2b';
    for (let i = 0; i < 4; i++) ctx.fillRect(i % 2 ? -8 : 0, -t.R * (0.2 + i * 0.24), 7, 3);
  } else {
    ctx.fillStyle = '#6b4526';
    ctx.fillRect(-10, -t.R * 0.9, 20, t.R * 0.9 + 2);
    ctx.fillStyle = '#573619';
    ctx.fillRect(2, -t.R * 0.9, 8, t.R * 0.9 + 2);
  }
  const sway = Math.sin(time * 1.2 + t.seed * 10) * 2;
  if (fade) ctx.globalAlpha = 0.4;           // ktoś stoi za drzewem — korona robi się przezroczysta
  if (t.kind === 3) {                       // sosna: wysoki rudy pień, korona na czubku
    ctx.fillStyle = '#b5683a'; ctx.fillRect(-7, -t.R * 2.0, 14, t.R * 2.0 + 2);
    ctx.fillStyle = '#8f4f2a'; ctx.fillRect(1, -t.R * 2.0, 6, t.R * 2.0 + 2);
    const cy = -t.R * 2.1;
    ell(ctx, -t.R * 0.4 + sway, cy + 8, t.R * 0.6, t.R * 0.3, '#2c6a3f');
    ell(ctx, t.R * 0.42 + sway, cy + 4, t.R * 0.58, t.R * 0.3, '#266038');
    ell(ctx, sway, cy - 12, t.R * 0.7, t.R * 0.36, '#34784a');
  } else if (t.kind === 1) {                // świerk
    for (let i = 0; i < 3; i++) {
      const w = t.R * (1.0 - i * 0.24), y0 = -t.R * (0.5 + i * 0.62);
      ctx.fillStyle = ['#1f5a33', '#256b3c', '#2c7a45'][i];
      ctx.beginPath();
      ctx.moveTo(-w, y0); ctx.lineTo(w, y0); ctx.lineTo(sway * (i + 1) * 0.5, y0 - t.R * 0.95);
      ctx.closePath(); ctx.fill();
    }
  } else {                                  // drzewo liściaste
    const cy = -t.R * 1.35;
    const col = t.kind === 2 ? ['#b9a53a', '#a8932f', '#cdb848'] : ['#2f7030', '#2a652b', '#3b8438'];
    ell(ctx, -t.R * 0.45 + sway, cy + 12, t.R * 0.7, t.R * 0.62, col[0]);
    ell(ctx, t.R * 0.45 + sway, cy + 14, t.R * 0.68, t.R * 0.6, col[1]);
    ell(ctx, sway, cy - 8, t.R * 0.8, t.R * 0.72, col[2]);
    ell(ctx, -t.R * 0.2 + sway, cy - 22, t.R * 0.36, t.R * 0.26, 'rgba(180,230,110,0.25)');
  }
  ctx.restore();
}

// ---------- babcie ----------
export function drawGranny(ctx, g, time, scale = 1) {
  const p = C.PLAYERS[g.id], kind = p.kind;
  const SKIN = '#f1c7a5', HAIR = '#8a4b22', INK = '#1f4d5c';
  const arm = kind === 'jacek' ? SKIN : p.dress;   // Jacek chodzi w podkoszulku
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
  const top = -52 - bob;
  if (kind === 'kasia') ell(ctx, -11, top + 12, 12, 31, HAIR);   // długie włosy spływają na plecy
  if (p.male) {
    // spodnie i sweter
    ctx.fillStyle = '#4b4f5c';
    ctx.fillRect(-13 + step * 0.6, -28, 11, 25); ctx.fillRect(3 - step * 0.6, -28, 11, 25);
    rrect(ctx, -16, top, 32, 30 + bob, 8); ctx.fillStyle = p.dress; ctx.fill();
    if (kind === 'jacek') {                                    // dekolt podkoszulka i tatuaż na piersi
      ell(ctx, 5, top + 1, 8, 6, SKIN);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(1, top + 2); ctx.lineTo(5, top + 5); ctx.lineTo(9, top + 2); ctx.stroke();
    } else {
      ctx.fillStyle = p.apron;                                 // kołnierzyk
      ctx.beginPath(); ctx.moveTo(1, top); ctx.lineTo(13, top); ctx.lineTo(8, top + 11); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;   // ściągacz swetra
    ctx.beginPath(); ctx.moveTo(-15, -27); ctx.lineTo(15, -27); ctx.stroke();
  } else {
    ctx.fillStyle = p.dress;
    ctx.beginPath();
    ctx.moveTo(-14, top); ctx.lineTo(14, top);
    ctx.quadraticCurveTo(24, -26, 22, -6); ctx.lineTo(-22, -6);
    ctx.quadraticCurveTo(-24, -26, -14, top);
    ctx.closePath(); ctx.fill();
    // fartuch (Kasia zamiast fartucha ma pasek i korale)
    ctx.fillStyle = kind === 'kasia' ? 'rgba(0,0,0,0)' : p.apron;
    ctx.beginPath();
    ctx.moveTo(-2, top + 10); ctx.lineTo(14, top + 10);
    ctx.quadraticCurveTo(21, -24, 19, -9); ctx.lineTo(-4, -9);
    ctx.closePath(); ctx.fill();
  }

  // koszyk
  const bx = 23, by = -24 - bob + (g.pickAnim > 0 ? 6 : 0);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(bx, by - 2, 11, Math.PI, TAU); ctx.stroke();
  const n = Math.min(g.basket.length, 5);
  for (let i = 0; i < n; i++) {
    const t = g.basket[g.basket.length - 1 - i];
    const col = { borowik: '#8f5226', kania: '#dcc7a0', podgrzybek: '#5a3920', kurka: '#ffc928', amanita: '#d8271f' }[t];
    ell(ctx, bx - 8 + i * 4, by - 2 - (i % 2) * 3, 5, 4, col);
  }
  if (kind === 'kasia') {
    ctx.fillStyle = p.scarf; ctx.fillRect(-18, -34 - bob * 0.5, 37, 4.5);
    for (let i = 0; i < 4; i++) ell(ctx, 1 + i * 3.6, top + 3 + Math.sin(i * 1.1) * 2.2, 1.8, 1.8, '#fff');
  }
  ell(ctx, bx, by, 13, 11, '#b07a3a', 0, Math.PI);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx - 11, by + 4); ctx.lineTo(bx + 11, by + 4); ctx.stroke();
  // ręka trzymająca koszyk
  ctx.strokeStyle = arm; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(10, top + 8); ctx.lineTo(bx - 2, by - 12); ctx.stroke();
  if (kind === 'jacek') {                                    // rękaw z tatuaży
    const ax = 10, ay = top + 8, ex = bx - 2, ey = by - 12;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
    for (const k of [0.2, 0.36, 0.52, 0.72]) {
      const px = ax + (ex - ax) * k, py = ay + (ey - ay) * k;
      ctx.beginPath(); ctx.moveTo(px - 2.4, py + 2.8); ctx.lineTo(px + 2.4, py - 2.8); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(ax + (ex - ax) * 0.88, ay + (ey - ay) * 0.88, 1.8, 0, TAU); ctx.stroke();
  }
  ell(ctx, bx - 1, by - 13, 4, 4, '#f1c7a5');

  // łokieć!
  if (g.elbowAnim > 0) {
    const k = Math.sin((1 - g.elbowAnim / 0.25) * Math.PI);
    ctx.strokeStyle = arm; ctx.lineWidth = 9;
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
    ctx.strokeStyle = arm; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(6, top + 8); ctx.lineTo(24, top - 18); ctx.stroke();
    ell(ctx, 25, top - 20, 5.5, 5.5, '#f1c7a5');
  }

  // głowa i chustka
  const hy = top - 11;
  ell(ctx, 0, hy, 15, 15, '#f1c7a5');
  if (kind === 'jacek') {                                    // łysina na błysk i tatuaż na czaszce
    ell(ctx, -15, hy + 2, 3, 4.5, '#e2b592');
    ell(ctx, -3, hy - 9, 6, 3, 'rgba(255,255,255,0.45)');
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.moveTo(-8 - Math.cos(a) * 4, hy - 3 - Math.sin(a) * 4); ctx.lineTo(-8 + Math.cos(a) * 4, hy - 3 + Math.sin(a) * 4); }
    ctx.stroke();
  } else if (kind === 'kasia') {                             // długie włosy z opaską
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0, hy, 16.8, Math.PI * 0.72, TAU * 0.99);
    ctx.quadraticCurveTo(9, hy - 9, 2, hy - 9.5);
    ctx.quadraticCurveTo(-8, hy - 7, -10, hy + 9);
    ctx.lineTo(-17, hy + 16);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = p.scarf; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.arc(0, hy, 16, Math.PI * 1.1, Math.PI * 1.8); ctx.stroke();
  } else if (p.male) {                                       // siwe włosy i kaszkiet
    ell(ctx, -10, hy + 3, 7, 9, '#dcdcdc');
    ctx.fillStyle = p.scarf;
    ctx.beginPath(); ctx.ellipse(-1, hy - 7, 17.5, 11, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
    ell(ctx, 12, hy - 7, 12, 3.6, p.scarf);
    ell(ctx, -1, hy - 17, 2.6, 2, p.scarf2);
  } else {
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
  }
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
  if (kind === 'jacek') {                                    // siwa bródka
    ell(ctx, 8, hy + 12.5, 6, 3.6, '#a9a9a9');
    ell(ctx, 4, hy + 6, 5, 2, '#8f8f8f'); ell(ctx, 12, hy + 6, 4.5, 2, '#8f8f8f');
  } else if (p.male) {                                       // wąsy
    ell(ctx, 4, hy + 6, 6, 2.6, '#ececec'); ell(ctx, 12, hy + 6, 5, 2.6, '#ececec');
  }
  if (kind === 'kasia' && g.stun <= 0) ell(ctx, 8, hy + 8.6, 3.2, 1.7, '#d8443c');   // szminka
  if (g.id === 1) {                                           // okulary
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

// ---------- wiewiórka ----------
function drawSquirrel(ctx, q, time) {
  const onTree = q.state === 'tree';
  const x = onTree ? q.tree.x + 6 : q.x;
  const y = onTree ? q.tree.y - q.tree.R * (q.tree.kind === 3 ? 2.0 : 1.45) : q.y - Math.abs(Math.sin(q.hop * 16)) * 9;
  ctx.save();
  ctx.translate(x, y);
  if (!onTree) ell(ctx, 0, q.y - y + 1, 12, 4, 'rgba(0,0,0,0.22)');
  ctx.scale(q.flip * 1.35, 1.35);
  ctx.save();                                               // kita
  ctx.translate(-9, -8); ctx.rotate(-0.35 + Math.sin(time * 9) * 0.12);
  ell(ctx, 0, -6, 6.5, 12, '#e08a45'); ell(ctx, 1, -7, 3.2, 8, '#f2b27a');
  ctx.restore();
  ell(ctx, 0, -6, 8.5, 6.5, '#c8642a');
  ell(ctx, 2, -4.5, 5, 3.6, '#f6dcc0');
  ell(ctx, 8, -12, 5.6, 5, '#c8642a');
  ctx.fillStyle = '#c8642a';
  ctx.beginPath(); ctx.moveTo(5, -15); ctx.lineTo(6, -22); ctx.lineTo(9.5, -16); ctx.closePath(); ctx.fill();
  ell(ctx, 10, -13, 1.3, 1.5, '#1a1008'); ell(ctx, 13.4, -11, 1.1, 1, '#3a2618');
  ctx.restore();
  if (q.carry) drawShroom(ctx, q.carry, x + q.flip * 16, y - 8, 0.7);
}

// ---------- zając ----------
function drawHare(ctx, h, time) {
  const sit = h.state === 'sit';
  const jump = sit ? 0 : Math.abs(Math.sin(h.hop * (h.scared ? 15 : 9))) * (h.scared ? 22 : 16);
  ctx.save();
  ctx.translate(h.x, h.y);
  ell(ctx, 0, 1, 18, 5, 'rgba(0,0,0,0.25)');
  ctx.translate(0, -jump);
  ctx.scale(h.flip * 1.3, 1.3);
  const up = sit ? 10 : 0;                                   // staje słupka
  ell(ctx, -12, -8, 4.5, 4.5, '#fff');                       // ogonek
  ell(ctx, -2, -9 - up * 0.5, 13, 9 + up * 0.6, '#b9a58c');
  ell(ctx, 0, -6 - up * 0.3, 7, 5 + up * 0.5, '#e6dac8');
  ell(ctx, -8, -2, 7, 3.5, '#a8947b'); ell(ctx, 6, -1.5, 5, 3, '#a8947b');   // skoki
  const hx = 10, hy = -20 - up;
  for (const [i, sgn] of [[0, -1], [1, 1]]) {                 // uszy do nieba, strzygą
    ctx.save();
    ctx.translate(hx - 2 + i * 4, hy - 6);
    ctx.rotate(sgn * 0.16 + Math.sin(time * (sit ? 11 : 5) + i * 2) * (sit ? 0.22 : 0.08) + (h.scared ? -0.5 : 0));
    ell(ctx, 0, -15, 3.6, 16, '#b9a58c'); ell(ctx, 0, -15, 1.7, 12, '#f0b6b6');
    ctx.restore();
  }
  ell(ctx, hx, hy, 8.5, 7.5, '#b9a58c');
  ell(ctx, hx + 5, hy + 3, 5, 4, '#e6dac8');
  const wide = h.scared ? 1.5 : 1;                           // zez zbieżny
  ell(ctx, hx + 1, hy - 2, 2.6 * wide, 3 * wide, '#fff'); ell(ctx, hx + 6.5, hy - 2.5, 2.4 * wide, 2.8 * wide, '#fff');
  ell(ctx, hx + 2.2, hy - 1.6, 1.2, 1.4, '#1a1008'); ell(ctx, hx + 5.4, hy - 2, 1.2, 1.4, '#1a1008');
  ell(ctx, hx + 8.4, hy + 1.6, 1.6, 1.2, '#e58a9a');
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8a7a66'; ctx.lineWidth = 0.6;   // zęby jak łopaty
  const chew = sit ? Math.sin(time * 14) * 0.8 : 0;
  ctx.fillRect(hx + 4.6, hy + 4 + chew, 2.4, 5); ctx.strokeRect(hx + 4.6, hy + 4 + chew, 2.4, 5);
  ctx.fillRect(hx + 7, hy + 4 + chew, 2.4, 5); ctx.strokeRect(hx + 7, hy + 4 + chew, 2.4, 5);
  ctx.restore();
  if (h.scared) txt(ctx, '!', h.x, h.y - 86 - jump, 30, '#ffcf2e');
}

// ---------- działka: domek i samochód ----------
function drawHouse(ctx, r, time, fade) {
  const x0 = r.x, x1 = r.x + r.w, yb = r.y + r.h, wallTop = yb - 100, roofTop = yb - 185;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0 - 6, yb - 6, r.w + 26, 14);
  if (fade) ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#7d7d7d'; ctx.fillRect(x1 - 60, roofTop - 22, 22, 50);       // komin
  ctx.fillStyle = '#5e5e5e'; ctx.fillRect(x1 - 63, roofTop - 26, 28, 7);
  ctx.fillStyle = '#b07a3f'; ctx.fillRect(x0, wallTop, r.w, 100);               // ściana z bali
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2;
  for (let y = wallTop + 12; y < yb; y += 12.5) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  ctx.fillStyle = '#8a5a2b';
  for (let y = wallTop + 6; y < yb; y += 12.5) { ctx.beginPath(); ctx.arc(x0 + 1, y, 5, 0, TAU); ctx.arc(x1 - 1, y, 5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6a2f22';                                                    // dach
  ctx.beginPath(); ctx.moveTo(x0 - 22, wallTop + 4); ctx.lineTo(x1 + 22, wallTop + 4); ctx.lineTo(x1 - 16, roofTop); ctx.lineTo(x0 + 16, roofTop); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4f2118'; ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) {
    const k = i / 5, y = roofTop + (wallTop + 4 - roofTop) * k;
    ctx.beginPath(); ctx.moveTo(x0 + 16 - 38 * k, y); ctx.lineTo(x1 - 16 + 38 * k, y); ctx.stroke();
  }
  const dx = x0 + r.w / 2 - 19;                                                 // drzwi
  ctx.fillStyle = '#5b3418'; ctx.fillRect(dx, yb - 66, 38, 66);
  ctx.strokeStyle = '#3d2210'; ctx.strokeRect(dx + 5, yb - 60, 28, 24); ctx.strokeRect(dx + 5, yb - 32, 28, 26);
  ell(ctx, dx + 31, yb - 32, 2.5, 2.5, '#e0b84a');
  ctx.fillStyle = '#9a8f80'; ctx.fillRect(dx - 8, yb - 4, 54, 8);               // schodek
  for (const wx of [x0 + 22, x1 - 64]) {                                        // okna z pelargoniami
    ctx.fillStyle = '#fff6dd'; ctx.fillRect(wx - 3, yb - 73, 48, 42);
    ctx.fillStyle = '#9fd0e6'; ctx.fillRect(wx, yb - 70, 42, 36);
    ctx.fillStyle = '#fff'; ctx.fillRect(wx, yb - 70, 9, 36); ctx.fillRect(wx + 33, yb - 70, 9, 36);   // firanki
    ctx.strokeStyle = '#fff6dd'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(wx + 21, yb - 70); ctx.lineTo(wx + 21, yb - 34); ctx.moveTo(wx, yb - 52); ctx.lineTo(wx + 42, yb - 52); ctx.stroke();
    ctx.fillStyle = '#6b4526'; ctx.fillRect(wx - 4, yb - 32, 50, 7);
    for (let i = 0; i < 5; i++) { ell(ctx, wx + 3 + i * 9, yb - 35, 4.5, 4, '#3e8c3a'); ell(ctx, wx + 3 + i * 9, yb - 38, 3, 3, i % 2 ? '#e8452f' : '#f06aa0'); }
  }
  for (let i = 0; i < 4; i++) {                                                 // dym z komina
    const k = (time * 0.35 + i / 4) % 1;
    ctx.globalAlpha = (fade ? 0.45 : 1) * (1 - k) * 0.6;
    ell(ctx, x1 - 49 + Math.sin(k * 5 + i) * 10 + k * 18, roofTop - 30 - k * 70, 8 + k * 12, 7 + k * 10, '#eee');
  }
  ctx.restore();
}

// Ciemnoniebieskie kombi-hatchback, stoi i ładnie wygląda
function drawCar(ctx, r, fade) {
  const x = r.x, yb = r.y + r.h + 2, w = r.w;
  ctx.save();
  ell(ctx, x + w / 2, yb - 1, w / 2 + 6, 9, 'rgba(0,0,0,0.3)');
  if (fade) ctx.globalAlpha = 0.5;
  const NAVY = '#14264d', NAVY2 = '#0e1b38';
  ctx.fillStyle = NAVY;                                                         // nadwozie
  ctx.beginPath();
  ctx.moveTo(x + 4, yb - 14);
  ctx.lineTo(x + 3, yb - 34);
  ctx.quadraticCurveTo(x + 6, yb - 42, x + 16, yb - 44);       // tylna klapa
  ctx.lineTo(x + 34, yb - 64);
  ctx.quadraticCurveTo(x + 62, yb - 70, x + 92, yb - 64);      // dach
  ctx.lineTo(x + 116, yb - 44);                                // szyba przednia
  ctx.quadraticCurveTo(x + 146, yb - 42, x + w - 2, yb - 32);  // maska
  ctx.lineTo(x + w, yb - 14);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = NAVY2; ctx.fillRect(x + 4, yb - 17, w - 4, 6);                // progi i zderzaki
  ctx.fillStyle = '#b9cbdb';                                                    // szyby
  ctx.beginPath(); ctx.moveTo(x + 22, yb - 45); ctx.lineTo(x + 37, yb - 61); ctx.lineTo(x + 60, yb - 63); ctx.lineTo(x + 60, yb - 45); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 65, yb - 45); ctx.lineTo(x + 65, yb - 63); ctx.lineTo(x + 90, yb - 61); ctx.lineTo(x + 109, yb - 45); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = NAVY2; ctx.lineWidth = 1.5;                                 // drzwi i klamki
  ctx.beginPath(); ctx.moveTo(x + 62.5, yb - 45); ctx.lineTo(x + 62.5, yb - 18); ctx.moveTo(x + 112, yb - 44); ctx.lineTo(x + 112, yb - 20); ctx.stroke();
  ctx.fillStyle = '#c9d2de'; ctx.fillRect(x + 50, yb - 39, 8, 2.5); ctx.fillRect(x + 98, yb - 39, 8, 2.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;                // połysk
  ctx.beginPath(); ctx.moveTo(x + 10, yb - 36); ctx.lineTo(x + w - 10, yb - 33); ctx.stroke();
  ctx.fillStyle = '#d8271f'; ctx.fillRect(x + 3, yb - 40, 5, 12);               // lampa tylna
  ctx.fillStyle = '#fff3c4'; ctx.fillRect(x + w - 9, yb - 33, 8, 6);            // reflektor
  ell(ctx, x + 113, yb - 47, 4, 3, NAVY2);                                      // lusterko
  for (const wx of [x + 33, x + w - 31]) {                                      // koła
    ell(ctx, wx, yb - 12, 15, 15, NAVY2);
    ell(ctx, wx, yb - 11, 12.5, 12.5, '#1b1b1b'); ell(ctx, wx, yb - 11, 6.5, 6.5, '#b8bec6'); ell(ctx, wx, yb - 11, 2, 2, '#555');
  }
  ctx.restore();
}

// ---------- leśniczy ----------
function drawForester(ctx, f, time) {
  const stop = f.state === 'stop';
  const step = stop ? 0 : Math.sin(f.walk) * 5, bob = stop ? 0 : Math.abs(Math.sin(f.walk)) * 2.5;
  ctx.save();
  ctx.translate(f.x, f.y); ctx.scale(1.25, 1.25);
  ell(ctx, 0, 0, 24, 8, 'rgba(0,0,0,0.28)');
  ctx.scale(f.dir, 1);
  ctx.fillStyle = '#3d4a2a';                                  // spodnie i buty
  ctx.fillRect(-11 + step * 0.6, -30, 10, 27); ctx.fillRect(2 - step * 0.6, -30, 10, 27);
  ell(ctx, -5 + step, -2, 8, 4.5, '#2a1c12'); ell(ctx, 9 - step, -2, 8, 4.5, '#2a1c12');
  const top = -62 - bob;
  rrect(ctx, -16, top, 32, 35, 8); ctx.fillStyle = '#4f7a3f'; ctx.fill();   // mundur
  ctx.fillStyle = '#3a2618'; ctx.fillRect(-16, top + 25, 32, 4);
  ell(ctx, 3, top + 27, 3, 3, '#e0b84a');
  ell(ctx, 5, top + 9, 1.8, 1.8, '#e0b84a'); ell(ctx, 5, top + 17, 1.8, 1.8, '#e0b84a');
  ctx.strokeStyle = '#2a1c12'; ctx.lineWidth = 2;             // lornetka na pasku
  ctx.beginPath(); ctx.moveTo(-10, top + 2); ctx.lineTo(-5, top + 14); ctx.stroke();
  ell(ctx, -5, top + 16, 5, 4, '#222');
  ctx.strokeStyle = '#4f7a3f'; ctx.lineWidth = 7; ctx.lineCap = 'round';      // ręka
  ctx.beginPath(); ctx.moveTo(9, top + 8);
  if (stop) ctx.lineTo(17, top - 3); else ctx.lineTo(11 + step, top + 24);
  ctx.stroke();
  const hy = top - 12;
  ell(ctx, 0, hy, 14, 14, f.whistle > 0 ? '#f0a08a' : '#f1c7a5');
  if (stop) ell(ctx, 17, top - 5, 4, 4, '#f1c7a5');           // dłoń przy wąsie
  ell(ctx, 1, hy - 9, 23, 5, '#35592c');                      // kapelusz z piórkiem
  ctx.fillStyle = '#3f6b33';
  ctx.beginPath(); ctx.ellipse(0, hy - 10, 13, 13, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a1c12'; ctx.fillRect(-13, hy - 14, 26, 3);
  ctx.strokeStyle = '#d8443c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, hy - 15); ctx.quadraticCurveTo(-16, hy - 24, -12, hy - 34); ctx.stroke();
  ell(ctx, 3.5, hy - 1, 1.8, 2.2, '#3a2618'); ell(ctx, 10, hy - 1, 1.8, 2.2, '#3a2618');
  ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0.5, hy - 5); ctx.lineTo(6, hy - 5.5); ctx.moveTo(8, hy - 5.5); ctx.lineTo(13, hy - 5); ctx.stroke();
  // wąsy — strzyże nimi bez przerwy, a na postoju szczególnie
  const tw = Math.sin(time * (stop ? 17 : 6)) * (stop ? 0.45 : 0.12);
  ctx.fillStyle = '#6b3f1d';
  for (const sgn of [-1, 1]) {
    ctx.save();
    ctx.translate(7, hy + 6); ctx.rotate(sgn * tw);
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.quadraticCurveTo(sgn * 10, -6, sgn * 17, -1);
    ctx.quadraticCurveTo(sgn * 19, -6, sgn * 21, -7);
    ctx.quadraticCurveTo(sgn * 20, 3, sgn * 12, 3);
    ctx.quadraticCurveTo(sgn * 5, 3, 0, 2.5);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (f.whistle > 0) { ell(ctx, 13, hy + 10, 4, 3, '#cfcfcf'); }
  ctx.restore();
  if (f.whistle > 0) txt(ctx, 'FIUUU!', f.x + f.dir * 46, f.y - 118 + Math.sin(time * 40) * 2, 24, '#ffcf2e');
}

function drawForesterGround(ctx, f, time) {
  if (f.state === 'idle' || !C.FORESTER_FINE) return;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(f.x, f.y, C.FORESTER_SIGHT, C.FORESTER_SIGHT * 0.92, 0, 0, TAU);
  ctx.fillStyle = 'rgba(255,225,110,0.06)'; ctx.fill();
  ctx.setLineDash([4, 12]); ctx.lineDashOffset = time * 12;
  ctx.strokeStyle = 'rgba(255,225,110,0.4)'; ctx.lineWidth = 3; ctx.stroke();
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
      txt(ctx, '★', x + dir * (200 + w * 30), 25, 28, w < game.wins[i] ? '#ffd23e' : 'rgba(255,255,255,0.18)', 'center', 0);
    }
    // podgląd koszyka
    C.TYPE_ORDER.forEach((t, k) => {
      const cnt = gr.basket.filter((b) => b === t).length;
      const sx = x + dir * (146 + k * 53);
      ctx.globalAlpha = cnt ? 1 : 0.35;
      drawShroom(ctx, t, sx, 70, 0.62);
      txt(ctx, `${cnt}`, sx + 14, 60, 18, '#fff', 'left', 3, 600);
      ctx.globalAlpha = 1;
    });
    if (gr.poison > 0) txt(ctx, `odwrócone! ${Math.ceil(gr.poison)}`, x + dir * 262, 25, 18, '#9be05a', align, 4, 600);
  });

  const tm = Math.ceil(game.time), dusk = game.time <= C.DUSK_TIME;
  const pulse = dusk ? 1 + Math.abs(Math.sin(time * 5)) * 0.08 : 1;
  txt(ctx, `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')}`, C.W / 2, 36, 46 * pulse, dusk ? '#ff7a5c' : '#fff');
  txt(ctx, dusk ? 'Zmierzcha się!' : `Runda ${game.round} · ${game.map.name}`, C.W / 2, 68, 17, dusk ? '#ffb38a' : '#d9c7a8', 'center', 3, 600);
}

// ---------- świat ----------
export function drawWorld(ctx, game, time) {
  ctx.save();
  if (game.shake > 0) ctx.translate(rand(-1, 1) * game.shake * 22, rand(-1, 1) * game.shake * 22);
  ctx.drawImage(background(game.matchId + '-' + game.round, game), 0, 0);
  if (game.pond) {                           // zmarszczki na wodzie
    const w = game.pond;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const k = ((time * 0.25 + i / 3) % 1);
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.ellipse(w.x + (i - 1) * w.rx * 0.4, w.y + (i % 2 ? 12 : -10), w.rx * 0.3 * k + 6, w.ry * 0.3 * k + 3, 0, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawForesterGround(ctx, game.forester, time);
  drawBoarGround(ctx, game, time);

  const items = [];
  const movers = [...game.grannies, game.boar, game.forester];
  game.rects.forEach((r) => {
    const fade = movers.some((m) => m.y < r.y + 4 && m.y > r.y + r.h - r.tall - 30 && m.x > r.x - 26 && m.x < r.x + r.w + 26);
    items.push({ y: r.y + r.h, draw: () => (r.kind === 'house' ? drawHouse(ctx, r, time, fade) : drawCar(ctx, r, fade)) });
  });
  const sq = game.squirrel, hare = game.hare;
  items.push({ y: sq.state === 'tree' ? sq.tree.y + 1 : sq.y, draw: () => drawSquirrel(ctx, sq, time) });
  if (hare.state !== 'idle') items.push({ y: hare.y, draw: () => drawHare(ctx, hare, time) });
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
  game.grannies.forEach((g) => items.push({
    y: g.y, draw: () => {
      drawGranny(ctx, g, time, 1.2);
      if (g.wet) {                           // po kolana w stawie
        ell(ctx, g.x, g.y - 5, 31, 12, 'rgba(58,131,145,0.92)');
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(g.x, g.y - 5, 31 + Math.sin(time * 6) * 3, 12, 0, 0, TAU); ctx.stroke();
      }
    },
  }));
  const fo = game.forester;
  if (fo.state !== 'idle') items.push({ y: fo.y, draw: () => drawForester(ctx, fo, time) });
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
  if (fo.state !== 'idle') drawBubble(ctx, fo);
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

export function drawTitle(ctx, input, time, ready, muted, startIn, online) {
  ctx.drawImage(background('title'), 0, 0);
  ctx.fillStyle = 'rgba(20,35,15,0.35)'; ctx.fillRect(0, 0, C.W, C.H);

  ctx.save();
  ctx.translate(C.W / 2, 92); ctx.rotate(Math.sin(time * 1.5) * 0.015);
  txt(ctx, 'BABCIE NA GRZYBY', 0, 0, 92, '#ffe9b0', 'center', 14);
  ctx.restore();
  txt(ctx, 'sąsiedzi z jednej klatki · jeden las · jeden dzik', C.W / 2, 156, 26, '#fff', 'center', 5, 600);

  // karty graczy z wyborem postaci
  [0, 1].forEach((i) => {
    const p = C.PLAYERS[i], joined = !!input.slots[i];
    const x = i === 0 ? 70 : C.W - 70 - 300;
    panel(ctx, x, 200, 300, 300, joined ? 'rgba(42,29,18,0.92)' : 'rgba(42,29,18,0.7)');
    if (ready[i]) { ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 6; rrect(ctx, x, 200, 300, 300, 22); ctx.stroke(); }
    ctx.globalAlpha = joined ? 1 : 0.45;
    drawGranny(ctx, {
      id: i, x: x + 150, y: 392, flip: i === 0 ? 1 : -1, basket: ready[i] ? ['borowik', 'kurka', 'kania'] : [],
      moving: ready[i], walk: time * 7, stun: 0, poison: 0, immune: 0, elbowAnim: 0, shooAnim: 0, pickAnim: 0,
    }, time, 1.9);
    ctx.globalAlpha = 1;
    txt(ctx, p.name, x + 150, 232, 34, p.ui);
    if (!joined) {
      if (Math.sin(time * 5) > -0.4) txt(ctx, 'wciśnij przycisk na padzie', x + 150, 465, 21, '#fff', 'center', 4, 600);
      return;
    }
    if (input.slots[i] === 'net') {                            // gracz po drugiej stronie łącza
      txt(ctx, C.KIND_LABEL[p.kind], x + 150, 428, 24, '#cfd6dd', 'center', 4);
      if (ready[i]) txt(ctx, `${p.male ? 'gotowy' : 'gotowa'} ✓ · online`, x + 150, 466, 21, '#7dff8a', 'center', 4, 600);
      else txt(ctx, 'online · wybiera postać…', x + 150, 466, 20, '#9fd0ff', 'center', 4, 600);
      return;
    }
    const sel = ready[i] ? '#9aa' : '#ffe45c';
    txt(ctx, `◀  ${C.KIND_LABEL[p.kind]}  ▶`, x + 150, 428, 24, sel, 'center', 4);
    if (ready[i]) txt(ctx, `${p.male ? 'gotowy' : 'gotowa'} ✓ · ${input.label(i)}`, x + 150, 466, 21, '#7dff8a', 'center', 4, 600);
    else txt(ctx, '◀ ▶ postać · A — gotowe', x + 150, 466, 20, '#fff', 'center', 4, 600);
  });

  // środek: sterowanie i punktacja
  panel(ctx, 400, 200, 480, 300);
  txt(ctx, 'STEROWANIE', 640, 226, 20, '#c79a5b', 'center', 0);
  const rows = [
    ['A', '#3fae4f', 'zbierz grzyba'],
    ['B', '#d8443c', 'łokieć — wytrąca grzyba z koszyka'],
    ['X', '#2f7fe0', '„a sio!” — razem przeganiacie dzika'],
    ['RT', '#555', 'zryw z laską'],
  ];
  rows.forEach(([b, col, d], k) => {
    padBtn(ctx, 436, 258 + k * 34, b, col);
    txt(ctx, d, 462, 259 + k * 34, 20, '#fff', 'left', 0, 600);
  });
  txt(ctx, 'lewa gałka — chodzenie', 640, 258 + 4 * 34 - 4, 18, '#d9c7a8', 'center', 0, 600);
  ctx.fillStyle = 'rgba(199,154,91,0.4)'; ctx.fillRect(424, 408, 432, 2);
  const sc = [['borowik', '+5'], ['amanita', '±'], ['kania', '+4'], ['podgrzybek', '+3'], ['kurka', '+1'], ['muchomor', '−3']];
  sc.forEach(([t, pts], k) => {
    const sx = 442 + k * 75;
    drawShroom(ctx, t, sx, 462, 1.0);
    txt(ctx, pts, sx + 19, 448, 20, t === 'muchomor' ? '#ff7a6b' : t === 'amanita' ? '#ffb36b' : '#ffe45c', 'left', 0);
  });
  txt(ctx, 'czerwona amanita: +5, ale przy leśniczym −10', 640, 484, 16, '#d9c7a8', 'center', 0, 600);

  const joinedAll = input.slots.every(Boolean);
  if (startIn !== null) {
    txt(ctx, 'Idziemy do lasu!', C.W / 2, 560, 46 * (1 + Math.sin(time * 10) * 0.04), '#7dff8a', 'center', 8);
  } else if (joinedAll) {
    txt(ctx, 'Wybierzcie postacie (◀ ▶) i wciśnijcie A', C.W / 2, 556, 28, '#fff', 'center', 5, 600);
  } else {
    txt(ctx, online ? 'Wciśnij dowolny przycisk na swoim padzie' : 'Podłączcie dwa pady i wciśnijcie na każdym dowolny przycisk', C.W / 2, 556, 26, '#fff', 'center', 5, 600);
  }
  txt(ctx, 'Leśniczy patrzy: łokieć przy nim = mandat −2 · kania i muchomor wyglądają prawie tak samo', C.W / 2, 592, 18, '#ffe9a0', 'center', 4, 600);
  txt(ctx, 'Gramy do 2 wygranych rund · runda trwa 90 s · F11 lub dwuklik — pełny ekran', C.W / 2, 624, 19, '#e6d9bd', 'center', 4, 600);
  txt(ctx, 'Bez padów? Klawiatura: WSAD + F G H R   oraz   strzałki + K L J I', C.W / 2, 650, 17, '#cbbd9e', 'center', 4, 600);
  if (muted) txt(ctx, '🔇 kliknij myszką lub wciśnij klawisz, żeby włączyć dźwięk', C.W / 2, 690, 17, '#ffcf2e', 'center', 4, 600);
  if (online) txt(ctx, `gra online · pokój ${online}`, C.W - 24, 24, 20, '#9fd0ff', 'right', 4, 600);
  txt(ctx, 'B — wstecz', 24, 24, 18, '#cbbd9e', 'left', 4, 600);
}

// ---------- menu i ekrany gry online ----------
function menuBackdrop(ctx, time) {
  ctx.drawImage(background('title'), 0, 0);
  ctx.fillStyle = 'rgba(20,35,15,0.4)'; ctx.fillRect(0, 0, C.W, C.H);
  ctx.save();
  ctx.translate(C.W / 2, 92); ctx.rotate(Math.sin(time * 1.5) * 0.015);
  txt(ctx, 'BABCIE NA GRZYBY', 0, 0, 92, '#ffe9b0', 'center', 14);
  ctx.restore();
}

export function drawMenu(ctx, time, idx, notice, muted) {
  menuBackdrop(ctx, time);
  txt(ctx, 'sąsiedzi z jednej klatki · jeden las · jeden dzik', C.W / 2, 156, 26, '#fff', 'center', 5, 600);
  const items = [
    ['Gra lokalna', 'dwa pady przy jednym komputerze'],
    ['Załóż pokój online', 'dostaniesz kod dla drugiego gracza'],
    ['Dołącz do pokoju', 'wpisz kod od gospodarza'],
  ];
  items.forEach(([label, sub], i) => {
    const y = 226 + i * 112, on = i === idx, w = on ? 620 + Math.sin(time * 6) * 8 : 580;
    panel(ctx, C.W / 2 - w / 2, y, w, 92, on ? 'rgba(74,58,24,0.96)' : 'rgba(42,29,18,0.8)');
    if (on) { ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 6; rrect(ctx, C.W / 2 - w / 2, y, w, 92, 22); ctx.stroke(); }
    txt(ctx, label, C.W / 2, y + 36, 38, on ? '#ffe45c' : '#fff', 'center', 6);
    txt(ctx, sub, C.W / 2, y + 70, 19, on ? '#fff' : '#cbbd9e', 'center', 3, 600);
  });
  txt(ctx, '▲ ▼ wybór · A — dalej', C.W / 2, 590, 24, '#7dff8a', 'center', 5, 600);
  txt(ctx, 'Klawiatura: W / S lub strzałki, Enter', C.W / 2, 624, 17, '#cbbd9e', 'center', 4, 600);
  if (notice) txt(ctx, notice, C.W / 2, 662, 22, '#ff9a8a', 'center', 5, 600);
  if (muted) txt(ctx, '🔇 kliknij myszką lub wciśnij klawisz, żeby włączyć dźwięk', C.W / 2, 696, 17, '#ffcf2e', 'center', 4, 600);
}

// o = { screen: 'host' | 'join', status, error, code, link, copied, digits, pos }
export function drawNet(ctx, time, o) {
  menuBackdrop(ctx, time);
  panel(ctx, 240, 180, 800, 420);
  const dots = '.'.repeat(1 + (Math.floor(time * 2) % 3));
  if (o.screen === 'host') {
    txt(ctx, 'TWÓJ POKÓJ', C.W / 2, 222, 26, '#c79a5b', 'center', 0);
    if (o.status === 'error') {
      txt(ctx, o.error, C.W / 2, 360, 28, '#ff9a8a', 'center', 5, 600);
      txt(ctx, 'A — spróbuj jeszcze raz', C.W / 2, 420, 24, '#7dff8a', 'center', 5, 600);
    } else if (o.status !== 'waiting') {
      txt(ctx, `Zakładam pokój${dots}`, C.W / 2, 370, 36, '#fff', 'center', 6);
    } else {
      txt(ctx, o.code.split('').join(' '), C.W / 2, 318, 130, '#ffe45c', 'center', 14);
      txt(ctx, 'Podaj ten kod drugiemu graczowi albo wyślij mu link:', C.W / 2, 414, 22, '#fff', 'center', 4, 600);
      txt(ctx, o.link, C.W / 2, 452, 21, '#9fd0ff', 'center', 4, 600);
      txt(ctx, o.copied ? 'link skopiowany ✓' : 'C lub kliknięcie myszką — skopiuj link', C.W / 2, 486, 18, o.copied ? '#7dff8a' : '#cbbd9e', 'center', 3, 600);
      txt(ctx, `Czekam na drugiego gracza${dots}`, C.W / 2, 546, 28, '#7dff8a', 'center', 5, 600);
    }
  } else {
    txt(ctx, 'DOŁĄCZ DO POKOJU', C.W / 2, 222, 26, '#c79a5b', 'center', 0);
    const busy = o.status === 'connecting';
    o.digits.forEach((d, i) => {
      const x = C.W / 2 - 222 + i * 148, on = i === o.pos && !busy;
      panel(ctx, x - 55, 262, 110, 150, on ? 'rgba(74,58,24,0.96)' : 'rgba(20,14,8,0.9)');
      if (on) {
        ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 6; rrect(ctx, x - 55, 262, 110, 150, 22); ctx.stroke();
        txt(ctx, '▲', x, 244, 22, '#ffd23e', 'center', 4); txt(ctx, '▼', x, 432, 22, '#ffd23e', 'center', 4);
      }
      txt(ctx, `${d}`, x, 342, 104, busy ? '#9aa' : '#fff', 'center', 10);
    });
    if (busy) txt(ctx, `Łączę z pokojem ${o.code}${dots}`, C.W / 2, 500, 30, '#7dff8a', 'center', 5, 600);
    else {
      if (o.status === 'error') txt(ctx, o.error, C.W / 2, 478, 24, '#ff9a8a', 'center', 5, 600);
      txt(ctx, '◀ ▶ pozycja · ▲ ▼ cyfra · A — połącz', C.W / 2, 522, 24, '#7dff8a', 'center', 5, 600);
      txt(ctx, 'na klawiaturze można po prostu wpisać cyfry', C.W / 2, 556, 18, '#cbbd9e', 'center', 3, 600);
    }
  }
  txt(ctx, 'B — wróć do menu', C.W / 2, 640, 22, '#fff', 'center', 5, 600);
}

export function drawCountdown(ctx, t, game) {
  const n = Math.ceil(t), frac = t - Math.floor(t);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, C.HUD_H, C.W, C.H - C.HUD_H);
  txt(ctx, n > 0 ? `${n}` : 'START!', C.W / 2, C.H / 2 + 20, 150 * (0.8 + frac * 0.4), '#ffe9b0', 'center', 16);
  txt(ctx, `Runda ${game.round} · ${game.map.name}`, C.W / 2, C.H / 2 - 160, 44, '#ffe9b0', 'center', 8);
  txt(ctx, 'Na grzyby, gotowi…', C.W / 2, C.H / 2 - 110, 34, '#fff', 'center', 6, 600);
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
      if (t < 0.25 + row * 0.2) { row++; return; }
      const y = 236 + row * 38;
      drawIcon(x + 60, y + 14);
      txt(ctx, label, x + 96, y, 23, '#fff', 'left', 0, 600);
      txt(ctx, val, x + 360, y, 26, color, 'right', 0);
      row++;
    };
    C.TYPE_ORDER.forEach((type) => {
      const n = g.basket.filter((b) => b === type).length, pts = C.TYPES[type].pts;
      line((sx, sy) => drawShroom(ctx, type, sx, sy, 0.95), `${C.TYPES[type].name} × ${n}`, `${n * pts}`, n ? '#fff' : 'rgba(255,255,255,0.4)');
    });
    line((sx, sy) => txt(ctx, '±', sx, sy - 14, 28, '#d9c7a8', 'center', 0), 'dzik, mandaty, muchomory', `${g.bonus > 0 ? '+' : ''}${g.bonus}`.replace('-', '−'),
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
      : res.matchOver ? `${C.PLAYERS[res.winner].male ? 'Król' : 'Królowa'} lasu: ${C.PLAYERS[res.winner].name}!`
      : `Rundę wygrywa ${C.PLAYERS[res.winner].name}!`;
    txt(ctx, head, C.W / 2, 598, 46 * s, res.winner < 0 ? '#fff' : C.PLAYERS[res.winner].ui, 'center', 9);
    if (res.line) txt(ctx, `„${res.line}”`, C.W / 2, 642, 22, '#fff', 'center', 4, 600);
  }
  if (t > 2.4 && Math.sin(time * 5) > -0.5) {
    txt(ctx, res.matchOver ? 'A — rewanż · B — zmiana postaci' : 'A — następna runda', C.W / 2, 686, 24, '#7dff8a', 'center', 5, 600);
  }
}
