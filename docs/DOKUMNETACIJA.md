# Dokumentacija aplikacije StudySync PWA

## 1. Opis ideje

StudySync je progresivna spletna aplikacija, namenjena organizaciji študijskih obveznosti. Aplikacija študentom omogoča dodajanje, urejanje, brisanje in pregled obveznosti, rokov ter prioritet. Poseben poudarek je na delovanju brez povezave, sinhronizaciji podatkov in dostopnosti.

Ideja aplikacije je rešiti problem organizacije študijskih nalog, rokov in obveznosti. Študenti imajo pogosto več predmetov, različne roke oddaj, izpite, kolokvije in druge zadolžitve. Če aplikacija deluje samo ob internetni povezavi, lahko uporabnik izgubi možnost dodajanja ali pregleda obveznosti v trenutkih, ko povezava ni dostopna.

StudySync zato uporablja offline-first pristop. Obveznosti se najprej shranijo lokalno v brskalniku, nato pa se ob ponovni dosegljivosti strežnika sinhronizirajo z backendom. S tem aplikacija ostane uporabna tudi v primeru slabše ali prekinjene povezave.

---

## 3. Ciljna skupina

Ciljna skupina aplikacije so predvsem:

* študenti,
* dijaki,
* tutorji,
* uporabniki, ki želijo organizirati učne obveznosti,
* uporabniki z nestabilno internetno povezavo,
* uporabniki, ki potrebujejo dostopen in pregleden planer.

Aplikacija je zasnovana tako, da jo lahko uporablja čim širši krog uporabnikov. Pri načrtovanju so bili upoštevani semantičen HTML, dostopni obrazci, jasen fokus, uporaba s tipkovnico, statusna sporočila in osnovna podpora bralnikom zaslona.

---

## 4. Glavne funkcionalnosti

Aplikacija omogoča:

* dodajanje nove študijske obveznosti,
* vnos naslova, predmeta, roka in prioritete,
* prikaz vseh obveznosti,
* prikaz današnjega pregleda,
* prikaz naslednjega roka,
* prikaz števila nalog z današnjim rokom,
* prikaz nalog z visoko prioriteto,
* prikaz statusa sinhronizacije,
* urejanje obveznosti,
* brisanje obveznosti,
* kopiranje povzetka obveznosti v odložišče,
* lokalno shranjevanje v IndexedDB,
* sinhronizacijo z backendom,
* delovanje brez povezave,
* potisna obvestila,
* opomnike za bližnje roke,
* možnost namestitve kot PWA aplikacija.

---

## 5. PWA zmožnosti

Aplikacija vključuje ključne elemente progresivne spletne aplikacije.

| PWA zmožnost         | Implementacija                               |
| -------------------- | -------------------------------------------- |
| Web App Manifest     | `frontend/manifest.json`                     |
| Service Worker       | `frontend/service-worker.js`                 |
| Predpomnjenje        | Cache API v Service Workerju                 |
| Offline delovanje    | `offline.html`, Cache API, IndexedDB         |
| Lokalno shranjevanje | IndexedDB v `frontend/src/db.js`             |
| Background Sync      | `sync-tasks` dogodek v Service Workerju      |
| Push Notifications   | Push API, Notification API in `web-push`     |
| Namestljivost        | Manifest + Service Worker + standalone način |
| Odziven vmesnik      | CSS media queries                            |

---

## 6. Web App Manifest

Aplikacija vsebuje veljaven Web App Manifest, ki določa osnovne podatke za namestitev aplikacije:

* ime aplikacije,
* kratko ime,
* opis,
* začetni URL,
* način prikaza,
* barvo teme,
* ozadje,
* jezik,
* ikono.

Primer ključnih nastavitev:

```json
{
  "name": "StudySync - študentski planer",
  "short_name": "StudySync",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#2563eb",
  "lang": "sl"
}
```

Nastavitev `display: "standalone"` omogoča, da se aplikacija po namestitvi odpre kot samostojna aplikacija in ne kot običajen zavihek v brskalniku.

---

## 7. Service Worker

Service Worker ima v aplikaciji aktivno vlogo. Ne gre samo za prazno registracijo, ampak Service Worker izvaja več pomembnih nalog:

* predpomni statične vire,
* prestreza omrežne zahteve,
* omogoča offline fallback,
* podpira Background Sync,
* sprejema Push Notifications,
* čisti stare verzije predpomnilnika.

Service Worker se registrira v `frontend/src/app.js`, glavna logika pa je v datoteki `frontend/service-worker.js`.

---

## 8. Strategije predpomnjenja

V aplikaciji je uporabljenih več strategij predpomnjenja, odvisno od vrste vira.

| Vrsta vira                                    | Strategija                       | Razlog                                                                            |
| --------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| Statični viri: HTML, CSS, JS, manifest, ikone | Cache First                      | Ti viri se ne spreminjajo pogosto, zato se lahko hitro naložijo iz predpomnilnika |
| Navigacija                                    | Network First + offline fallback | Če je povezava na voljo, se naloži sveža stran; če ni, se prikaže offline stran   |
| API GET zahteve                               | Network First + Cache Fallback   | Podatki naj bodo čim bolj sveži, ob napaki pa se uporabi zadnja znana kopija      |
| Podatki obveznosti                            | IndexedDB + Background Sync      | Spremembe se shranijo lokalno in pozneje sinhronizirajo                           |

S tem Service Worker skrbi za hitrejšo in zanesljivejšo uporabniško izkušnjo.

---

## 9. Offline-first delovanje

StudySync uporablja offline-first pristop. To pomeni, da se podatki najprej shranijo lokalno, nato pa se sinhronizirajo s strežnikom.

Ko uporabnik doda novo obveznost:

1. obveznost se shrani v IndexedDB,
2. če je backend dosegljiv, se takoj pošlje na strežnik,
3. če backend ni dosegljiv, obveznost dobi status “Čaka na sinhronizacijo”,
4. ob ponovni dosegljivosti strežnika se podatki sinhronizirajo,
5. status se spremeni v “Sinhronizirano”.

Offline delovanje podpira tudi urejanje in brisanje obveznosti. Pri brisanju se obveznost označi s `pendingDelete: true`, pri urejanju pa s `pendingUpdate: true`, dokler sprememba ni uspešno poslana na strežnik.

---

## 10. Sinhronizacija lokalnih in strežniških podatkov

Aplikacija uporablja dva vira podatkov:

* lokalna shramba: IndexedDB,
* strežniška shramba: `backend/data/tasks.json`.

Vsaka obveznost ima lokalni `clientId`. Po uspešni sinhronizaciji dobi tudi `serverId`, ki omogoča urejanje in brisanje na strežniku.

Sinhronizacija podpira:

| Operacija                      | Lokalno stanje        | Sinhronizacija               |
| ------------------------------ | --------------------- | ---------------------------- |
| Dodajanje                      | `synced: false`       | Pošlje se na backend         |
| Urejanje                       | `pendingUpdate: true` | Posodobi se na backendu      |
| Brisanje                       | `pendingDelete: true` | Izbriše se iz backenda       |
| Manjkajoča naloga na strežniku | obstaja v IndexedDB   | ponovno se pošlje na backend |

Aplikacija vsebuje tudi funkcijo, ki preveri, ali lokalne obveznosti manjkajo na strežniku. Če obstajajo lokalno, vendar niso prisotne v `tasks.json`, se ponovno sinhronizirajo.

---

## 11. Background Sync

Background Sync se uporablja za odloženo pošiljanje podatkov, ko povezava ali backend ponovno postane dosegljiv.

V aplikaciji se uporablja oznaka:

```text
sync-tasks
```

Ko uporabnik doda, uredi ali izbriše obveznost brez dosegljivega backenda, se sprememba shrani lokalno in registrira Background Sync. Service Worker nato ob ponovni povezavi izvede sinhronizacijo.

Background Sync obdeluje:

* nove nesinhronizirane obveznosti,
* čakajoče posodobitve,
* čakajoča brisanja.

---

## 12. Push Notifications

Aplikacija uporablja potisna obvestila za pomembne dogodke.

Uporabnik lahko omogoči obvestila z gumbom v aplikaciji. Po dovoljenju se ustvari naročnina, ki se shrani na backendu v datoteko `subscriptions.json`.

Potisna obvestila se uporabljajo za:

* testno obvestilo,
* obvestilo ob uspešni sinhronizaciji,
* opomnike za obveznosti z rokom danes ali jutri.

Na backendu je za pošiljanje obvestil uporabljena knjižnica `web-push`.

---

## 13. Uporabljeni sodobni spletni API-ji

Aplikacija uporablja več sodobnih spletnih API-jev.

| API                 | Namen                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Service Worker API  | Offline delovanje, prestrezanje zahtev, Background Sync, Push Notifications |
| Cache API           | Predpomnjenje statičnih virov in API odgovorov                              |
| IndexedDB API       | Lokalno shranjevanje obveznosti                                             |
| Background Sync API | Odložena sinhronizacija podatkov                                            |
| Push API            | Naročanje uporabnika na potisna obvestila                                   |
| Notification API    | Prikaz obvestil uporabniku                                                  |
| Clipboard API       | Kopiranje povzetka obveznosti v odložišče                                   |
| Fetch API           | Komunikacija med frontend aplikacijo in backendom                           |
| Web App Manifest    | Namestljivost in standalone prikaz aplikacije                               |

Posebej je dodan Clipboard API, ki uporabniku omogoča kopiranje povzetka posamezne obveznosti. To je uporabno, kadar želi študent hitro deliti nalogo, rok ali prioriteto v zapiskih, sporočilu ali drugi aplikaciji.

---

## 14. Strežniški del

Strežniški del je implementiran z Node.js in Express.

Backend omogoča:

* preverjanje delovanja strežnika,
* pridobivanje vseh obveznosti,
* dodajanje obveznosti,
* urejanje obveznosti,
* brisanje obveznosti,
* shranjevanje naročnin za obvestila,
* pošiljanje testnega obvestila,
* pošiljanje opomnikov za bližnje roke.

Glavni endpointi:

```text
GET    /api/health
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:serverId
DELETE /api/tasks/:serverId

GET    /api/push/public-key
POST   /api/push/subscribe
POST   /api/push/test
POST   /api/push/due-reminders
```

Podatki se za potrebe mini projekta shranjujejo v JSON datoteke:

```text
backend/data/tasks.json
backend/data/subscriptions.json
```

Za produkcijsko uporabo bi bila primernejša prava podatkovna baza, saj JSON datoteka ni primerna za večje število hkratnih zapisov.

---

## 15. Dostopnost

Dostopnost je bila upoštevana že pri načrtovanju aplikacije. Uporabljeni so:

* semantični HTML elementi,
* pravilna struktura naslovov,
* dostopni obrazci z `label`,
* jasen fokus,
* uporaba s tipkovnico,
* `aria-live` statusna sporočila,
* dostopna sporočila o napakah,
* `aria-label` za gumbe pri obveznostih,
* odzivna postavitev,
* podpora povečavi besedila.

Primeri:

* status povezave uporablja `role="status"` in `aria-live="polite"`,
* napake v obrazcu so povezane s polji prek `aria-describedby`,
* gumbi za urejanje, brisanje in kopiranje imajo jasne oznake,
* aplikacija vsebuje povezavo “Preskoči na glavno vsebino”.

Podrobno poročilo je v dokumentu `docs/DOSTOPNOST.md`.

---

## 16. Testiranje

Aplikacija je bila testirana z več orodji in metodami:

* ročno testiranje osnovnih funkcionalnosti,
* k6 za API-klice in zmogljivost backenda,
* Chrome DevTools za Service Worker, Cache Storage, IndexedDB in offline delovanje,
* Lighthouse za dostopnost, performance in best practices,
* ročno testiranje potisnih obvestil,
* ročno testiranje uporabe s tipkovnico in bralnikom zaslona.

Podrobno testiranje je opisano v dokumentu `docs/TESTIRANJE.md`.

---

## 17. Omejitve trenutne rešitve

Trenutna rešitev ima nekaj omejitev:

* podatki se shranjujejo v JSON datoteko in ne v pravo podatkovno bazo,
* aplikacija nima uporabniških računov,
* obvestila niso vezana na posameznega uporabnika,
* Periodic Background Sync ni implementiran zaradi omejene podpore v brskalnikih,
* Background Fetch ni implementiran, ker aplikacija ne prenaša večjih datotek.

---

## 18. Možne nadgradnje

Možne nadgradnje aplikacije so:

* uporaba SQLite, MySQL ali PostgreSQL baze,
* dodajanje uporabniških računov,
* razvrščanje in filtriranje obveznosti po predmetu,
* koledarski pogled,
* ponavljajoči se opomniki,
* glasovni zapiski z Media Capture API,
* uvoz in izvoz podatkov,
* večjezična podpora,
* avtomatsko preverjanje bližnjih rokov v ozadju.
