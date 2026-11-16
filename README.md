# Babcie na grzyby 🍄

Zręcznościowa gra dla dwóch osób na pady. Sąsiedzi z jednego bloku od lat rywalizują o lepszy koszyk grzybów. Po lesie krąży dzik, który nie lubi nikogo, i leśniczy, który strzyże wąsem i wlepia mandaty.

**Graj:** https://jab-jab-coder.github.io/game01/

## Jak uruchomić

Po otwarciu linku wybierz w menu (gałka / krzyżak góra–dół, **A**) jeden z trybów.

### Gra lokalna — dwa pady przy jednym komputerze

1. Podłącz dwa pady (Xbox / PlayStation, USB lub Bluetooth).
2. Każdy gracz wciska dowolny przycisk na swoim padzie — przeglądarka „widzi” pada dopiero po pierwszym wciśnięciu.
3. Gałką w lewo / prawo wybierz postać (babcia, dziadek, babcia Kasia albo łysy, wytatuowany dziadek Jacek) i zatwierdź **A**. Gra rusza, gdy oboje są gotowi.

### Gra online — każdy przy swoim komputerze

1. Gospodarz wybiera **Załóż pokój online** i dostaje 4-cyfrowy kod oraz link (klawisz `C` lub kliknięcie kopiuje link).
2. Drugi gracz otwiera link albo wybiera **Dołącz do pokoju** i wpisuje kod.
3. Każdy wciska przycisk na swoim padzie, wybiera postać i zatwierdza **A**. Gospodarz gra pierwszą postacią (po lewej), gość drugą.

Jak to działa: połączenie to WebRTC peer-to-peer przez bibliotekę [PeerJS](https://peerjs.com) (`vendor/peerjs.min.js`, licencja MIT). Publiczny serwer PeerJS tylko zestawia połączenie, potem gra leci bezpośrednio między przeglądarkami. Całą rozgrywkę liczy komputer gospodarza i 30 razy na sekundę wysyła gościowi stan świata; gość odsyła samo sterowanie, więc widzi swoje ruchy z opóźnieniem równym pingowi.

Ograniczenia: nie ma serwera pośredniczącego (TURN), więc w niektórych sieciach — część sieci firmowych i komórkowych — połączenia nie da się zestawić. Karta gospodarza musi być na wierzchu (przeglądarka wstrzymuje grę w karcie w tle). Własny serwer PeerJS można podać w adresie: `?peerhost=…&peerport=…&peersecure=1`.

**F11** lub dwuklik — pełny ekran. Kliknij raz myszką, żeby włączyć dźwięk. Bez padów da się grać na klawiaturze: `WSAD + F G H R` oraz `strzałki + K L J I`, w menu `Enter`.

## Sterowanie

| Pad | Klawiatura 1 / 2 | Akcja |
|---|---|---|
| lewa gałka / krzyżak | WSAD / strzałki | chodzenie |
| **A** | F / K | zbierz grzyba |
| **B** | G / L | łokieć — sąsiadce wypada grzyb, można go podebrać |
| **X** | H / J | „a sio!” — przeganianie dzika (muszą obie naraz) |
| **RT** / RB | R / I | zryw z laską (odnawia się 3 s) |
| Start | Enter / Esc | pauza |

## Zasady

- Runda trwa 90 sekund, gramy do 2 wygranych rund.
- Punkty: borowik **+5**, kania **+4**, podgrzybek **+3**, kurka **+1**.
- **Amanita** (czerwona w białe kropki): **+5**, ale jeśli zbierzesz ją, gdy leśniczy jest na planszy — **mandat −10**.
- **Muchomor** wygląda prawie jak kania (zielonkawy, gładki kapelusz bez łusek): **−3** i przez 5 s odwrócone sterowanie.
- **Dzik** wpada co 20–30 s, chwilę ryje w ziemi i szarżuje na bliższą babcię. Trafiona gubi pół koszyka — grzyby rozsypują się po lesie i może je zebrać każdy.
- Jeśli obie babcie staną w kręgu wokół dzika i razem wcisną **X**, dzik ucieka, a każda dostaje **+8**.
- Gdy różnica wynosi 5+ punktów, borowiki rosną bliżej przegrywającej.
- **Leśniczy** co jakiś czas robi obchód. Łokieć w jego polu widzenia (żółty krąg) to **mandat −2**.
- **Cztery plansze**, losowane w innej kolejności na każdy mecz: zagajnik, stary bór nad stawem, las nad rzeką (dwie kładki; brodzenie w wodzie spowalnia o połowę) i działka z drewnianym domkiem i granatowym Volvo. Planszę na pierwszą rundę można wymusić adresem, np. `?mapa=dzialka` (`zagajnik`, `staw`, `rzeka`, `dzialka`).
- **Wiewiórka** biega między drzewami i czasem kradnie grzyba z planszy. **Zając** tylko śmiesznie wygląda.
- Ostatnie 15 sekund to zmierzch: grzyby rosną dwa razy szybciej.

## Struktura

Czysty HTML + Canvas + JavaScript (moduły ES), bez zależności i bez builda — GitHub Pages serwuje pliki prosto z gałęzi `main`.

| Plik | Co robi |
|---|---|
| `js/config.js` | wszystkie parametry rozgrywki (punkty, czasy, prędkości, teksty w dymkach) |
| `js/input.js` | pady (Gamepad API), klawiatura, wibracje |
| `js/game.js` | logika: babcie, grzyby, dzik, punktacja |
| `js/render.js` | grafika rysowana kodem, HUD, ekrany |
| `js/audio.js` | dźwięki syntetyzowane w WebAudio |
| `js/net.js` | pokoje online: PeerJS / WebRTC |
| `js/main.js` | pętla gry, przejścia między ekranami, synchronizacja gospodarz → gość |

Lokalnie: `python3 -m http.server` w katalogu repo i `http://localhost:8000` (moduły ES nie działają z `file://`).

## Plan

- [x] **1. Rdzeń** — ruch, kolizje, zbieranie, punktacja, rundy
- [x] **2. Pady** — dołączanie graczy, wibracje, pauza przy odłączeniu pada
- [x] **3. Interakcje** — łokieć, zryw, muchomor, dzik, wspólne „a sio!”
- [x] **4. Oprawa** — rysowany las, dymki z tekstami, ważenie koszyków, dźwięki
- [ ] **5. Strojenie po pierwszych partiach na padach** — prędkości, zasięg łokcia, częstotliwość dzika (`js/config.js`)
- [x] **6. Więcej treści** — nowe teksty, leśniczy, wybór babcia / dziadek, druga mapa
- [x] **6b. Zwierzyna i plansze** — amanita, Kasia i Jacek, wiewiórka, zając, rzeka, działka
- [x] **6c. Gra online** — pokoje z kodem, WebRTC peer-to-peer (PeerJS)
- [ ] **6d. Jeszcze więcej żartu** — muzyczka, deszcz
- [ ] **7. Wygoda** — wybór długości meczu, tryb turniejowy, zapamiętywanie wyników
