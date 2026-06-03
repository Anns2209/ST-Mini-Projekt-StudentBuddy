# StudySync PWA

StudySync je progresivna spletna aplikacija za študente, namenjena organizaciji študijskih obveznosti, rokov in prioritet. Aplikacija omogoča dodajanje, urejanje, brisanje in pregled obveznosti ter deluje tudi ob slabši ali prekinjeni povezavi.

Podatki se najprej shranijo lokalno v brskalniku z uporabo IndexedDB. Ko je strežnik ponovno dosegljiv, se lokalne spremembe sinhronizirajo z backendom. Aplikacija podpira tudi potisna obvestila, delovanje brez povezave, predpomnjenje, Background Sync in namestitev kot PWA aplikacija.

---

## 1. Glavne funkcionalnosti

* dodajanje študijskih obveznosti,
* urejanje obveznosti,
* brisanje obveznosti,
* prikaz roka in prioritete,
* današnji pregled najpomembnejših obveznosti,
* lokalno shranjevanje podatkov v IndexedDB,
* sinhronizacija z backendom,
* delovanje brez povezave,
* potisna obvestila,
* kopiranje povzetka obveznosti z uporabo Clipboard API,
* dostopen uporabniški vmesnik.

---

## 2. Uporabljene tehnologije

### Frontend

* HTML
* CSS
* JavaScript
* Web App Manifest
* Service Worker
* Cache API
* IndexedDB
* Background Sync API
* Push API
* Notification API
* Clipboard API
* Fetch API

### Backend

* Node.js
* Express
* CORS
* web-push
* JSON datoteke za shranjevanje podatkov

### Testiranje

* k6
* Chrome DevTools
* Lighthouse
* ročno testiranje
* NVDA oziroma preverjanje podpore bralnikom zaslona

---

## 3. Struktura projekta

```text
ST-Mini-Projekt-StudentBuddy/
│
├── frontend/
│   ├── index.html
│   ├── manifest.json
│   ├── offline.html
│   ├── service-worker.js
│   ├── icons/
│   │   └── icon.svg
│   └── src/
│       ├── app.js
│       ├── db.js
│       └── styles.css
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── data/
│   │   ├── tasks.json
│   │   └── subscriptions.json
│   └── benchmark.js
│
├── tests/
│   ├── k6/
│   │   ├── health-test.js
│   │   ├── tasks-crud-test.js
│   │   ├── health-load-test.js
│   │   └── tasks-read-load-test.js
│   └── results/
│
├── docs/
│   ├── DOKUMENTACIJA.md
│   ├── TESTIRANJE.md
│   ├── DOSTOPNOST.md
│   ├── PRIMERJAVA_BACKEND.md
│   └── slike/
│
└── README.md
```

---

## 4. Namestitev in zagon

Za zagon aplikacije sta potrebna dva dela:

1. backend strežnik,
2. frontend aplikacija.

---

## 5. Zagon backenda

Najprej odpri terminal v glavni mapi projekta in pojdi v mapo `backend`:

```bash
cd backend
```

Namesti odvisnosti:

```bash
npm install
```

Zaženi backend:

```bash
node server.js
```

Backend se zažene na naslovu:

```text
http://localhost:3000
```

Delovanje backenda lahko preveriš na naslovu:

```text
http://localhost:3000/api/health
```

Pričakovan odgovor:

```json
{
  "status": "ok",
  "message": "StudySync backend deluje."
}
```

---

## 6. Zagon frontenda

V drugem terminalu pojdi v mapo `frontend`:

```bash
cd frontend
```

Zaženi lokalni strežnik:

```bash
npm run dev
```

Frontend aplikacija je dostopna na naslovu:

```text
http://localhost:5173
```

---

## 7. Delovanje prek localhost

Aplikacija v razvojni fazi deluje lokalno prek `localhost`. To omogoča uporabo Service Workerja, Cache API, IndexedDB, Background Sync in drugih PWA funkcionalnosti brez HTTPS certifikata.

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

Pri produkcijski objavi bi bilo treba aplikacijo objaviti prek HTTPS povezave.

---

## 8. Testiranje

Testiranje je razdeljeno na več delov:

* testiranje osnovnih funkcionalnosti,
* testiranje API-klicev,
* testiranje delovanja brez povezave,
* testiranje strategij predpomnjenja,
* testiranje Background Sync,
* testiranje potisnih obvestil,
* testiranje odzivnosti,
* testiranje zmogljivosti backenda,
* testiranje dostopnosti.

k6 testi se nahajajo v mapi:

```text
tests/k6/
```

Primer zagona CRUD API testa:

```bash
k6 run tests/k6/tasks-crud-test.js --summary-export tests/results/tasks-crud-summary.json
```

Primer zagona obremenitvenega testa:

```bash
k6 run tests/k6/health-load-test.js --summary-export tests/results/health-load-summary.json
```

Podrobnejši opis testiranja je v dokumentu:

```text
docs/TESTIRANJE.md
```

---

## 9. PWA funkcionalnosti

Aplikacija vključuje ključne PWA elemente:

* Web App Manifest,
* registriran Service Worker,
* predpomnjenje statičnih virov,
* offline fallback stran,
* IndexedDB za lokalno shranjevanje,
* Background Sync za kasnejšo sinhronizacijo,
* Push Notifications,
* možnost namestitve aplikacije,
* odziven uporabniški vmesnik.

PWA funkcionalnosti je mogoče preveriti v Chrome DevTools:

```text
Application → Manifest
Application → Service Workers
Application → Cache Storage
Application → IndexedDB
```

---

## 10. Dostopnost

Aplikacija je zasnovana z mislijo na dostopnost. Uporablja:

* semantične HTML elemente,
* pravilno strukturo naslovov,
* navigacijo s tipkovnico,
* jasen fokus,
* dostopne obrazce,
* sporočila o napakah,
* `aria-live` statusna sporočila,
* `aria-label` za gumbe,
* odziven prikaz,
* podporo za povečavo besedila.

Podrobnejše poročilo je v dokumentu:

```text
docs/DOSTOPNOST.md
```

---

## 11. Strežniški del

Backend je implementiran z Node.js in Express. Omogoča CRUD operacije za obveznosti in podporo za potisna obvestila.

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

Za produkcijsko uporabo bi bila primernejša prava podatkovna baza, na primer SQLite, MySQL ali PostgreSQL.

---

## 12. Dokumentacija

Dodatna dokumentacija je v mapi `docs`:

```text
docs/DOKUMENTACIJA.md
docs/TESTIRANJE.md
docs/DOSTOPNOST.md
docs/PRIMERJAVA_BACKEND.md
```

Ti dokumenti vsebujejo opis ideje, ciljne skupine, PWA zmožnosti, spletnih API-jev, strežniškega dela, primerjave okolij, testiranja in dostopnosti.
