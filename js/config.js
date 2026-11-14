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
  muchomor:   { name: 'Muchomor',   pts: -3, w: 16 },   // sromotnikowy — udaje kanię
  amanita:    { name: 'Amanita',    pts: 5,  w: 9 },    // czerwony; +5, ale −10 gdy leśniczy jest w lesie
};
export const TYPE_ORDER = ['borowik', 'amanita', 'kania', 'podgrzybek', 'kurka'];
export const AMANITA_FINE = 10;
export const MAX_AMANITAS = 3;

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

// Leśniczy
export const FORESTER_FIRST = [7, 12];   // pierwszy obchód (s od startu rundy)
export const FORESTER_EVERY = [16, 26];  // przerwa między obchodami
export const FORESTER_SPEED = 75;
export const FORESTER_SIGHT = 240;       // w tym promieniu widzi łokcie
export const FORESTER_FINE = 2;          // mandat za łokieć na jego oczach (0 = leśniczy tylko ozdobny)

// Mapy: runda 1 → pierwsza, runda 2 → druga, runda 3 → znowu pierwsza
export const MAPS = [
  { id: 'zagajnik', name: 'Zagajnik za blokiem' },
  { id: 'staw', name: 'Stary bór nad stawem' },
  { id: 'rzeka', name: 'Las nad rzeką' },
  { id: 'dzialka', name: 'Działka' },
];

// Zwierzyna
export const SQUIRREL_SPEED = 230;
export const SQUIRREL_STEAL = 0.4;        // szansa, że po zejściu z drzewa ukradnie grzyba
export const HARE_EVERY = [9, 16];
export const POND_SLOW = 0.5;            // brodzenie w stawie spowalnia

// Gracze: kolory są stałe, postać (babcia / dziadek) wybiera się przed startem
export const KINDS = ['babcia', 'dziadek', 'kasia', 'jacek'];
export const KIND_LABEL = { babcia: 'babcia', dziadek: 'dziadek', kasia: 'babcia Kasia', jacek: 'dziadek Jacek' };
export const PLAYERS = [
  { kind: 'babcia', names: { babcia: 'Halina', dziadek: 'Zdzisław', kasia: 'Kasia', jacek: 'Jacek' },
    scarf: '#e8457e', scarf2: '#ffd1e0', dress: '#7b4fa6', apron: '#efe3f7', ui: '#ff6b9d' },
  { kind: 'babcia', names: { babcia: 'Krystyna', dziadek: 'Mieczysław', kasia: 'Kasia', jacek: 'Jacek' },
    scarf: '#2f8fd6', scarf2: '#cfe9ff', dress: '#c9772b', apron: '#fbeed6', ui: '#5bb6ff' },
];
for (const p of PLAYERS) {
  Object.defineProperty(p, 'name', { get() { return this.names[this.kind]; } });
  Object.defineProperty(p, 'male', { get() { return this.kind === 'dziadek' || this.kind === 'jacek'; } });
}

// Teksty w dymkach. Para [żeńska, męska] = wersja zależna od wybranej postaci.
export const LINES = {
  elbow: ['Przepraszam bardzo!', ['Ja tu stałam!', 'Ja tu stałem!'], 'Tu jest kolejka!', 'Z drogi!', 'To moje miejsce!',
    'Łokieć też argument.', 'Na promocji w dyskoncie było gorzej.', 'Proszę się nie pchać. Ja się pcham.',
    'Za komuny to się umiało stać w kolejce!', ['Byłam zapisana!', 'Byłem zapisany!']],
  hit: ['Jezus Maria!', 'Moje biodro!', 'Bezczelność!', 'No wiecie co?!', 'Zgłoszę to na klatce!',
    'Napiszę do spółdzielni!', 'A w niedzielę pierwsza ławka!', 'Uwaga, endoproteza!', 'Powiem wszystkim pod blokiem!',
    'To się nagrywa!'],
  poison: ['To nie była kania…', 'Ojej, kręci mi się…', 'Kto zgasił las?', 'Ale kolory!', 'Widzę dwa dziki…',
    'W atlasie wyglądał inaczej.', 'Gdzie moje okulary?!', 'Lewo to teraz prawo?', 'Chyba dziś bez obiadu.'],
  borowik: ['Prawdziwek!', 'Będzie sos!', ['A nie mówiłam!', 'A nie mówiłem!'], 'Do słoika z nim!',
    'Taki to tylko ja znajdę.', 'Wnuki nie uwierzą!', 'Zdrowy, bez robaka!'],
  boarHit: ['Mój koszyk!', 'Ratunku!', 'Zwierzę jedno!', 'Tyle zbierania!', 'A kysz, świnio!', 'Moje podgrzybki!',
    'Ja cię na pasztet przerobię!'],
  shoo: ['A sio!', 'Poszedł!', 'Won mi stąd!', 'Sio, szczecino!', 'Do lasu! A, już jesteś.'],
  shooOk: ['I po sprawie.', 'Na nas nie ma mocnych.', 'Sojusz. Chwilowy.', 'To nie znaczy, że się lubimy.',
    'Jak za dawnych lat.', 'Dzik dzikiem, ale grzyby moje.'],
  steal: ['Znalezione nie kradzione!', 'Dziękuję, przyda się.', ['Leżało, to wzięłam.', 'Leżało, to wziąłem.'],
    'Las jest wspólny.', 'Samo wpadło do koszyka.'],
  start: ['Moje miejsca, moje grzyby.', ['Byłam tu pierwsza.', 'Byłem tu pierwszy.'],
    ['Wstałam o czwartej!', 'Wstałem o czwartej!'], 'Znam ten las od 1968.', 'Tylko bez numerów.',
    'Kto rano wstaje, ten ma borowiki.', 'Termos jest, kanapki są, do boju.', 'Dziś bez taryfy ulgowej.'],
  splash: ['Kalosze zostały w domu!', 'Zimna!', 'Reumatyzm murowany.', 'Tu kiedyś było sucho!'],
  fined: ['Ale panie leśniczy!', ['To nie ja zaczęłam!', 'To nie ja zacząłem!'], 'Za co?!', 'Z emerytury mam płacić?!',
    'Ja tylko poprawiam koszyk…'],
  win: ['Będzie sos na niedzielę!', 'A niech sąsiedzi patrzą.', 'Słoiki już czekają.', 'Wrzucę zdjęcie wnukom.',
    'I kto tu zna las?', 'Suszarka do grzybów już grzeje.', 'Pierogi z grzybami dla całej klatki. No, prawie całej.'],
  forester: ['Hm, hm.', 'Porządek w lesie musi być.', 'Dzień dobry państwu.', 'Ściółki nie grabić!',
    'Dzika ktoś widział?', 'Mchu nie deptać.', 'Za moich czasów grzyby były większe.', 'Tylko spokojnie tam.',
    'Wąs mi mówi, że będzie padać.', 'Ja tu wszystko widzę.'],
  amanita: ['Na muchy. Oczywiście, że na muchy.', 'Do celów naukowych.', 'Ładny, to biorę.', 'Na nalewkę. Zdrowotną.',
    'Do wazonu jak znalazł.'],
  caught: ['To dla ozdoby!', 'Podrzucono mi!', ['Myślałam, że to pomidor.', 'Myślałem, że to pomidor.'],
    'To nie moje, ja tylko trzymam!', 'Okulary mi zaparowały!'],
  amanitaFine: ['Muchomor?! Mandat!', 'Dziesięć punktów karnych!', 'Tego się nie zbiera, obywatelu!',
    'Wąs mi się zjeżył!'],
  squirrel: ['Złodziejka!', 'Oddawaj, ruda!', 'To był mój grzyb!', 'A masz ty rozum?!', 'Zgłoszę to leśniczemu!'],
  fine: ['Mandat!', 'Nie szarpać się w lesie!', 'Spokój w moim rewirze!', 'Dwa punkty karne!', 'Las to nie bazar!'],
};

// Losowy tekst dla gracza i (uwzględnia babcia / dziadek)
export function line(key, i = 0) {
  const arr = LINES[key];
  const l = arr[(Math.random() * arr.length) | 0];
  return Array.isArray(l) ? l[PLAYERS[i].male ? 1 : 0] : l;
}
