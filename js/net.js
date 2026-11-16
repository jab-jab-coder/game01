// Gra online: WebRTC peer-to-peer przez PeerJS.
// Gospodarz zakłada pokój (4-cyfrowy kod), gość się do niego łączy. Serwer PeerJS służy
// tylko do zestawienia połączenia — sama gra leci już bezpośrednio między przeglądarkami.

const PREFIX = 'babcie-na-grzyby-v1-';
let lib = null;

// Bibliotekę doładowujemy dopiero, gdy ktoś wybierze grę online
function loadPeerJs() {
  lib ||= new Promise((resolve, reject) => {
    if (window.Peer) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'vendor/peerjs.min.js';
    s.onload = () => resolve();
    s.onerror = () => { lib = null; reject(new Error('load')); };
    document.head.appendChild(s);
  });
  return lib;
}

// Liczby zaokrąglamy do 2 miejsc — pakiety są kilka razy mniejsze
const round2 = (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);

export class Net {
  constructor() {
    this.peer = null;
    this.onMessage = null;
    this.reset();
  }

  reset() {
    try { this.peer?.destroy(); } catch { /* już zamknięty */ }
    clearTimeout(this.timer);
    this.peer = null;
    this.conn = null;
    this.role = null;        // host | guest
    this.code = '';
    this.status = 'idle';    // idle | opening | waiting | connecting | connected | error | closed
    this.error = '';
    this.lastRecv = 0;
    this.gen = (this.gen || 0) + 1;   // unieważnia zdarzenia ze starych połączeń
  }

  // ?peerhost=…&peerport=… pozwala użyć własnego serwera PeerJS (domyślnie publiczny 0.peerjs.com)
  options() {
    const q = new URLSearchParams(location.search);
    const host = q.get('peerhost');
    if (!host) return { debug: 1 };
    return { host, port: +(q.get('peerport') || 9000), path: q.get('peerpath') || '/', secure: q.get('peersecure') === '1', debug: 1 };
  }

  fail(msg) {
    if (this.status === 'connected') return;
    this.status = 'error';
    this.error = msg;
  }

  async host() {
    this.reset();
    this.role = 'host';
    this.status = 'opening';
    const gen = this.gen;
    try { await loadPeerJs(); } catch { if (gen === this.gen) this.fail('Nie udało się wczytać biblioteki PeerJS.'); return; }
    if (gen === this.gen) this.openRoom(0);
  }

  openRoom(attempt) {
    const gen = this.gen;
    this.code = String(1000 + Math.floor(Math.random() * 9000));
    const peer = this.peer = new window.Peer(PREFIX + this.code, this.options());
    peer.on('open', () => { if (gen === this.gen) this.status = 'waiting'; });
    peer.on('connection', (c) => {
      if (gen !== this.gen) return;
      if (this.conn) { c.close(); return; }      // pokój jest dwuosobowy
      this.attach(c);
    });
    peer.on('disconnected', () => { if (gen === this.gen && this.status === 'waiting') try { peer.reconnect(); } catch { /* nic */ } });
    peer.on('error', (e) => {
      if (gen !== this.gen) return;
      if (e.type === 'unavailable-id' && attempt < 6) { peer.destroy(); this.openRoom(attempt + 1); return; }   // kod zajęty — losujemy inny
      this.fail(describe(e));
    });
  }

  async join(code) {
    this.reset();
    this.role = 'guest';
    this.code = code;
    this.status = 'connecting';
    const gen = this.gen;
    try { await loadPeerJs(); } catch { if (gen === this.gen) this.fail('Nie udało się wczytać biblioteki PeerJS.'); return; }
    if (gen !== this.gen) return;
    const peer = this.peer = new window.Peer(this.options());
    peer.on('open', () => {
      if (gen !== this.gen) return;
      this.attach(peer.connect(PREFIX + code, { reliable: true, serialization: 'json' }));
    });
    peer.on('error', (e) => { if (gen === this.gen) this.fail(describe(e)); });
    this.timer = setTimeout(() => {
      if (gen === this.gen && this.status === 'connecting') this.fail('Nie udało się połączyć. Sprawdź kod albo spróbuj z innej sieci.');
    }, 15000);
  }

  attach(conn) {
    const gen = this.gen;
    this.conn = conn;
    conn.on('open', () => {
      if (gen !== this.gen) return;
      this.status = 'connected';
      this.lastRecv = performance.now();
    });
    conn.on('data', (d) => {
      if (gen !== this.gen) return;
      this.lastRecv = performance.now();
      let m = d;
      if (typeof d === 'string') { try { m = JSON.parse(d); } catch { return; } }
      if (m && typeof m === 'object') this.onMessage?.(m);
    });
    const lost = () => { if (gen === this.gen && this.status === 'connected') this.status = 'closed'; };
    conn.on('close', lost);
    conn.on('error', lost);
  }

  send(msg) {
    if (this.status !== 'connected' || !this.conn?.open) return;
    try { this.conn.send(JSON.stringify(msg, round2)); } catch { /* zgubiony pakiet — następny zaraz */ }
  }

  // Druga strona milczy od kilku sekund (zamknięta karta, padnięte łącze)
  get stale() {
    return this.status === 'connected' && performance.now() - this.lastRecv > 7000;
  }
}

function describe(e) {
  switch (e?.type) {
    case 'peer-unavailable': return 'Nie ma pokoju o takim kodzie.';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed': return 'Brak połączenia z serwerem PeerJS. Sprawdź internet.';
    case 'browser-incompatible': return 'Ta przeglądarka nie obsługuje WebRTC.';
    case 'unavailable-id': return 'Nie udało się wylosować wolnego kodu pokoju.';
    case 'webrtc': return 'Nie udało się zestawić połączenia między komputerami.';
    default: return 'Błąd połączenia. Spróbuj ponownie.';
  }
}
