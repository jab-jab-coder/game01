// Wszystkie "pokrętła" gry w jednym miejscu — tu najłatwiej stroić rozgrywkę.

export const W = 1280;
export const H = 720;
export const HUD_H = 84;

// Pole gry (babcie i grzyby nie wychodzą poza ten prostokąt)
export const ARENA = { x0: 46, y0: HUD_H + 40, x1: W - 46, y1: H - 26 };

export const ROUND_TIME = 90;      // sekundy
export const WINS_NEEDED = 2;      // gramy do dwóch wygranych rund
export const DUSK_TIME = 15;       // ostatnie sekundy: "zmierzcha się", grzyby rosną szybciej

// Grzyby: pts = punkty, w = waga losowania
export const TYPES = {
  borowik:    { name: 'Borowik',    pts: 5,  w: 8 },
  kania:      { name: 'Kania',      pts: 4,  w: 11 },
  podgrzybek: { name: 'Podgrzybek', pts: 3,  w: 25 },
  kurka:      { name: 'Kurka',      pts: 1,  w: 40 },
  muchomor:   { name: 'Muchomor',   pts: -3, w: 16 },
};
export const TYPE_ORDER = ['borowik', 'kania', 'podgrzybek', 'kurka'];

export const MAX_SHROOMS = 16;
export const MAX_MUCHOMORS = 4;
export const SPAWN_EVERY = 0.85;       // s
export const SPAWN_EVERY_DUSK = 0.4;   // s
export const CATCHUP_DIFF = 5;         // od tylu punktów różnicy borowiki rosną bliżej przegrywającej

// Babcie
export const SPEED = 235;          // px/s
export const DASH_MULT = 2.8;
export const DASH_TIME = 0.22;
export const DASH_CD = 3;
export const PICK_RANGE = 52;
export const ELBOW_RANGE = 84;
export const ELBOW_CD = 0.9;
export const ELBOW_STUN = 0.55;
export const ELBOW_IMMUNE = 1.6;   // chwila spokoju po oberwaniu łokciem
export const POISON_TIME = 5;

// Dzik
export const BOAR_FIRST = [12, 17];    // pierwsza wizyta (s od startu rundy)
export const BOAR_EVERY = [20, 30];    // kolejne wizyty
export const BOAR_PAW_TIME = 3.2;      // ile ryje w ziemi, zanim ruszy
export const BOAR_SPEED = 650;
export const BOAR_HIT_R = 54;
export const SHOO_R = 200;             // jak blisko trzeba stać, żeby przegonić
export const SHOO_WINDOW = 0.6;        // obie muszą krzyknąć w tym oknie czasu
export const SHOO_BONUS = 8;

export const PLAYERS = [
  { name: 'Halina',   scarf: '#e8457e', scarf2: '#ffd1e0', dress: '#7b4fa6', apron: '#efe3f7', ui: '#ff6b9d' },
  { name: 'Krystyna', scarf: '#2f8fd6', scarf2: '#cfe9ff', dress: '#c9772b', apron: '#fbeed6', ui: '#5bb6ff' },
];

// Teksty w dymkach
export const LINES = {
  elbow:   ['Przepraszam bardzo!', 'Ja tu stałam!', 'Pani tu nie stała!', 'Z drogi!', 'To moje miejsce!'],
  hit:     ['Jezus Maria!', 'Moje biodro!', 'Bezczelna!', 'No wie pani co?!', 'Zgłoszę to na klatce!'],
  poison:  ['To nie była kania…', 'Ojej, kręci mi się…', 'Kto zgasił las?', 'Ale kolory!'],
  borowik: ['Prawdziwek!', 'Będzie sos!', 'A nie mówiłam!'],
  boarHit: ['Mój koszyk!', 'Ratunku!', 'Zwierzę jedno!'],
  shoo:    ['A sio!', 'Poszedł!', 'Won mi stąd!'],
  shooOk:  ['I po sprawie.', 'Na nas nie ma mocnych.', 'Sojusz. Chwilowy.'],
  steal:   ['Znalezione nie kradzione!', 'Dziękuję, przyda się.'],
  start:   ['Moje miejsca, moje grzyby.', 'Byłam tu pierwsza.', 'Wstałam o czwartej!', 'Znam ten las od 1968.'],
  win:     ['Będzie sos na niedzielę!', 'A niech sąsiadki patrzą.', 'Słoiki już czekają.'],
};
