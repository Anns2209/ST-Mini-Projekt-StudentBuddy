# Testiranje aplikacije

## 1. Namen testiranja

Testiranje je bilo izvedeno z več pristopi:

* ročno testiranje uporabniškega vmesnika,
* testiranje API-klicev z orodjem k6,
* obremenitveno testiranje backenda z orodjem k6,
* preverjanje PWA funkcionalnosti v Chrome DevTools,
* preverjanje dostopnosti z Lighthouse in ročnim testiranjem,
* preverjanje podpore bralnikom zaslona z NVDA oziroma ročnim pregledom ARIA oznak.

---

## 2. Testno okolje

Aplikacija je bila testirana lokalno.

| Del sistema | Naslov                  |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:5173` |
| Backend     | `http://localhost:3000` |

Uporabljena orodja:

| Orodje                  | Namen                                                   |
| ----------------------- | ------------------------------------------------------- |
| k6                      | API testiranje in obremenitveno testiranje backenda     |
| Chrome DevTools         | Service Worker, Cache Storage, IndexedDB, offline način |
| Lighthouse              | Dostopnost, performance, best practices                 |
| NVDA / ročno testiranje | Podpora bralnikom zaslona                               |
| Brskalnik Chrome        | Ročno funkcionalno testiranje                           |

---

## 3. Testiranje osnovnih funkcionalnosti

Osnovne funkcionalnosti so bile testirane ročno v uporabniškem vmesniku.

| Test                           | Koraki                                                                       | Pričakovani rezultat                                                                         | Dejanski rezultat |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------- |
| Dodajanje obveznosti           | Uporabnik vnese naslov, predmet, rok in prioriteto ter klikne “Dodaj nalogo” | Obveznost se prikaže v seznamu                                                               | Uspešno           |
| Prikaz obveznosti po osvežitvi | Uporabnik doda obveznost in osveži stran                                     | Obveznost ostane prikazana, ker je shranjena v IndexedDB                                     | Uspešno           |
| Urejanje obveznosti            | Uporabnik klikne “Uredi”, spremeni podatke in shrani                         | Podatki obveznosti se posodobijo v uporabniškem vmesniku                                     | Uspešno           |
| Brisanje obveznosti            | Uporabnik klikne “Izbriši”                                                   | Obveznost izgine iz seznama                                                                  | Uspešno           |
| Validacija obrazca             | Uporabnik odda prazen obrazec                                                | Prikažejo se dostopna sporočila o napakah                                                    | Uspešno           |
| Prikaz roka in prioritete      | Uporabnik doda obveznost z rokom in prioriteto                               | Rok in prioriteta sta prikazana pri obveznosti                                               | Uspešno           |
| Kopiranje povzetka             | Uporabnik klikne “Kopiraj” pri obveznosti                                    | Povzetek obveznosti se kopira v odložišče                                                    | Uspešno           |
| Današnji pregled               | Uporabnik doda obveznosti z različnimi roki in prioritetami                  | Dashboard prikaže naslednji rok, naloge za danes, visoko prioriteto in stanje sinhronizacije | Uspešno           |

---

## 4. Testiranje API-klicev z orodjem k6

API-klici so bili testirani z orodjem k6. Test se nahaja v datoteki:

```text
tests/k6/tasks-crud-test.js
```

Test preverja naslednje endpoint-e:

```text
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:serverId
DELETE /api/tasks/:serverId
```

Zagon testa:

```bash
k6 run tests/k6/tasks-crud-test.js --summary-export tests/results/tasks-crud-summary.json
```

### Rezultat testa

| Metrika | Rezultat |
|---|---:|
| Virtualni uporabniki | 1 |
| Iteracije | 5 |
| HTTP zahtevki | 20 |
| Skupno preverjanj | 40 |
| Uspešna preverjanja | 40 / 40 |
| Neuspešna preverjanja | 0 / 40 |
| Neuspešne HTTP zahteve | 0.00 % |
| Povprečen odzivni čas | 236.56 ms |
| Mediana odzivnega časa | 2.19 ms |
| p90 odzivni čas | 889.95 ms |
| p95 odzivni čas | 932.68 ms |
| Najdaljši odziv | 1.12 s |
| Rezultat | Uspešno |

Vsi funkcionalni API testi so bili uspešni. Test je preveril dodajanje, branje, urejanje in brisanje obveznosti. Ker aplikacija uporablja JSON datoteko kot preprosto shrambo podatkov, je bil CRUD test izveden zaporedno z enim virtualnim uporabnikom.

CRUD API test je bil uspešno izveden. Vseh 40 preverjanj je bilo uspešnih, delež neuspešnih HTTP zahtev pa je bil 0.00 %. Test je preveril dodajanje, branje, urejanje in brisanje obveznosti prek endpointov `POST /api/tasks`, `GET /api/tasks`, `PUT /api/tasks/:serverId` in `DELETE /api/tasks/:serverId`. Prag za p95 odzivni čas je bil nastavljen na 1500 ms, ker test vključuje tudi zapisovanje v datoteko `tasks.json`.

---

## 5. Testiranje endpointa `/api/health`

Endpoint `/api/health` je bil testiran z orodjem k6. Namen testa je preveriti, ali backend stabilno vrača odgovor, da strežnik deluje.

Datoteka testa:

```text
tests/k6/health-test.js
```

Zagon testa:

```bash
k6 run tests/k6/health-test.js --summary-export tests/results/health-summary.json
```

Pričakovani odgovor:

```json
{
  "status": "ok",
  "message": "StudySync backend deluje."
}
```

Rezultat:

| Test            | Pričakovani rezultat      | Dejanski rezultat |
| --------------- | ------------------------- | ----------------- |
| GET /api/health | Status 200                | Uspešno           |
| GET /api/health | JSON vsebuje `status: ok` | Uspešno           |

---

## 6. Obremenitveno testiranje strežniškega dela

Za obremenitveno testiranje je bilo uporabljeno orodje k6. Obremenitveno testiranje je bilo izvedeno na endpointu:

```text
GET /api/health
```

Razlog za izbiro tega endpointa je, da je stabilen in ne zapisuje v JSON datoteko. Ker aplikacija uporablja `tasks.json`, množično sočasno pisanje ni primerno za obremenitveni test.

Datoteka testa:

```text
tests/k6/health-load-test.js
```

Zagon testa:

```bash
k6 run tests/k6/health-load-test.js --summary-export tests/results/health-load-summary.json
```

Testna konfiguracija:

```text
10 s postopno do 10 virtualnih uporabnikov
20 s do 20 virtualnih uporabnikov
10 s postopno nazaj na 0 virtualnih uporabnikov
```

Rezultati:

| Metrika | Rezultat |
|---|---:|
| Največ virtualnih uporabnikov | 20 |
| Trajanje testa | 40 s |
| Število HTTP zahtevkov | 452 |
| Uspešna preverjanja | 452 / 452 |
| Neuspešna preverjanja | 0 / 452 |
| Neuspešne HTTP zahteve | 0.00 % |
| Povprečen odzivni čas | 0.89 ms |
| Mediana odzivnega časa | 0.96 ms |
| p90 odzivni čas | 1.44 ms |
| p95 odzivni čas | 1.54 ms |
| Najdaljši odzivni čas | 2.8 ms |
| Rezultat | Uspešno |

Test `health-load-test.js` je preveril odzivnost backend strežnika pri postopnem povečanju obremenitve do 20 virtualnih uporabnikov. V 40 sekundah je bilo izvedenih 452 HTTP zahtevkov. Vse zahteve so bile uspešne, delež neuspešnih HTTP zahtev je bil 0.00 %, p95 odzivni čas pa 1.54 ms, kar je bistveno pod nastavljenim pragom 500 ms.

---

## 7. Testiranje branja nalog pod obremenitvijo

Dodatno je bilo testirano branje obveznosti prek endpointa:

```text
GET /api/tasks
```

Datoteka testa:

```text
tests/k6/tasks-read-load-test.js
```

Zagon testa:

```bash
k6 run tests/k6/tasks-read-load-test.js --summary-export tests/results/tasks-read-load-summary.json
```

Ta test ne izvaja množičnega zapisovanja, ampak preverja, ali backend stabilno vrača seznam obveznosti pri več zaporednih zahtevah.

Rezultati:

| Metrika | Rezultat |
|---|---:|
| Virtualni uporabniki | 10 |
| Trajanje testa | 20 s |
| HTTP zahtevki | 200 |
| Skupno preverjanj | 400 |
| Uspešna preverjanja | 400 / 400 |
| Neuspešna preverjanja | 0 / 400 |
| Neuspešne HTTP zahteve | 0.00 % |
| Povprečen odzivni čas | 2.61 ms |
| Mediana odzivnega časa | 2.56 ms |
| p90 odzivni čas | 3.8 ms |
| p95 odzivni čas | 4.35 ms |
| Najdaljši odzivni čas | 5.87 ms |
| Rezultat | Uspešno |

Test `tasks-read-load-test.js` je preveril branje seznama obveznosti prek endpointa `GET /api/tasks` pri 10 virtualnih uporabnikih v trajanju 20 sekund. Skupno je bilo izvedenih 200 HTTP zahtevkov in 400 preverjanj. Vsa preverjanja so bila uspešna, delež neuspešnih HTTP zahtev je bil 0.00 %, p95 odzivni čas pa 4.35 ms, kar je pod nastavljenim pragom 500 ms.

---

## 8. Ugotovitev pri testiranju JSON datoteke

Med začetnim testiranjem z več sočasnimi zapisi je bilo ugotovljeno, da shranjevanje podatkov v `tasks.json` ni primerno za več hkratnih zapisov. Pri sočasnem pisanju lahko pride do poškodbe JSON strukture ali neuspešnih zahtev.

Zato je bil funkcionalni CRUD test izveden zaporedno z enim virtualnim uporabnikom, obremenitveno testiranje pa je bilo izvedeno na endpointih, ki ne izvajajo množičnega zapisovanja.

Za produkcijsko uporabo bi bilo smiselno uporabiti pravo podatkovno bazo, na primer SQLite, MySQL ali PostgreSQL.

---

## 9. Testiranje delovanja brez povezave

Offline delovanje je bilo testirano z ustavitvijo backend strežnika in z uporabo Chrome DevTools.

Postopek testiranja:

1. Backend je bil zagnan.
2. Uporabnik je dodal novo obveznost.
3. Obveznost se je sinhronizirala in zapisala v `tasks.json`.
4. Backend je bil ustavljen.
5. Uporabnik je dodal novo obveznost.
6. Obveznost se je shranila lokalno v IndexedDB.
7. Obveznost je dobila status “Čaka na sinhronizacijo”.
8. Stran je bila osvežena.
9. Obveznost je ostala prikazana.
10. Backend je bil ponovno zagnan.
11. Obveznost se je sinhronizirala in zapisala v `tasks.json`.

Rezultat:

| Test                           | Pričakovani rezultat                           | Dejanski rezultat |
| ------------------------------ | ---------------------------------------------- | ----------------- |
| Dodajanje brez backenda        | Obveznost se shrani lokalno                    | Uspešno           |
| Osvežitev strani brez backenda | Obveznost ostane prikazana                     | Uspešno           |
| Ponovna povezava               | Obveznost se sinhronizira z backendom          | Uspešno           |
| Urejanje brez backenda         | Sprememba se shrani lokalno                    | Uspešno           |
| Brisanje brez backenda         | Obveznost se pozneje izbriše tudi na strežniku | Uspešno           |

---

## 10. Testiranje strategij predpomnjenja

Strategije predpomnjenja so bile preverjene v Chrome DevTools:

```text
Application → Cache Storage
```

Preverjeno je bilo, da obstajajo cache vnosi za statične vire in API odgovore.

Uporabljene strategije:

| Vrsta vira                                    | Strategija                       | Rezultat |
| --------------------------------------------- | -------------------------------- | -------- |
| Statični viri: HTML, CSS, JS, manifest, ikone | Cache First                      | Uspešno  |
| Navigacija                                    | Network First + offline fallback | Uspešno  |
| API GET zahteve                               | Network First + Cache Fallback   | Uspešno  |
| Podatki obveznosti                            | IndexedDB + Background Sync      | Uspešno  |

Preverjeni elementi:

```text
frontend/index.html
frontend/offline.html
frontend/src/app.js
frontend/src/db.js
frontend/src/styles.css
frontend/manifest.json
frontend/icons/icon.svg
```

---

## 11. Testiranje Service Workerja

Service Worker je bil preverjen v Chrome DevTools:

```text
Application → Service Workers
```

Preverjeno je bilo:

| Test                             | Pričakovani rezultat                             | Dejanski rezultat |
| -------------------------------- | ------------------------------------------------ | ----------------- |
| Service Worker je registriran    | Status je activated/running                      | Uspešno           |
| Service Worker prestreza zahteve | Fetch event deluje                               | Uspešno           |
| Stari cache se izbriše           | Aktivacijski dogodek izbriše stare cache verzije | Uspešno           |
| Offline fallback                 | Ob nedosegljivi strani se uporabi `offline.html` | Uspešno           |

---

## 12. Testiranje Background Sync

Background Sync je bil testiran z dodajanjem, urejanjem in brisanjem obveznosti v času, ko backend ni bil dosegljiv.

Postopek:

1. Backend je bil ustavljen.
2. Uporabnik je dodal novo obveznost.
3. Obveznost se je shranila v IndexedDB s statusom `synced: false`.
4. Registriran je bil Background Sync z oznako `sync-tasks`.
5. Backend je bil ponovno zagnan.
6. Aplikacija je izvedla sinhronizacijo.
7. Obveznost se je zapisala v `tasks.json`.
8. Status se je spremenil v “Sinhronizirano”.

Testirana so bila tudi stanja:

| Stanje                | Pomen                                    | Rezultat |
| --------------------- | ---------------------------------------- | -------- |
| `synced: false`       | Nova obveznost čaka na sinhronizacijo    | Uspešno  |
| `pendingUpdate: true` | Urejena obveznost čaka na sinhronizacijo | Uspešno  |
| `pendingDelete: true` | Izbris čaka na sinhronizacijo            | Uspešno  |

---

## 13. Testiranje potisnih obvestil

Potisna obvestila so bila testirana ročno, ker zahtevajo dovoljenje uporabnika v brskalniku.

Postopek:

1. Uporabnik klikne “Omogoči obvestila”.
2. Brskalnik prikaže vprašanje za dovoljenje.
3. Uporabnik izbere “Dovoli”.
4. Aplikacija shrani naročnino na backend.
5. Uporabnik klikne “Pošlji testno obvestilo”.
6. Prikaže se testno obvestilo.
7. Uporabnik klikne “Preveri bližnje roke”.
8. Prikaže se opomnik za obveznosti z rokom danes ali jutri.

Rezultat:

| Test                        | Pričakovani rezultat           | Dejanski rezultat |
| --------------------------- | ------------------------------ | ----------------- |
| Omogočanje obvestil         | Brskalnik vpraša za dovoljenje | Uspešno           |
| Testno obvestilo            | Obvestilo se prikaže           | Uspešno           |
| Obvestilo ob sinhronizaciji | Uporabnik dobi obvestilo       | Uspešno           |
| Opomnik za bližnje roke     | Uporabnik dobi opomnik         | Uspešno           |

---

## 14. Testiranje odzivnosti

Odzivnost je bila testirana z orodjem Chrome DevTools:

```text
Toggle device toolbar
```

Preverjene so bile različne velikosti zaslona:

| Pogled          | Pričakovani rezultat                       | Dejanski rezultat |
| --------------- | ------------------------------------------ | ----------------- |
| Mobilni telefon | Elementi se prikažejo v enem stolpcu       | Uspešno           |
| Tablica         | Postavitev ostane pregledna                | Uspešno           |
| Namizni zaslon  | Kartice in obrazec so pravilno razporejeni | Uspešno           |
| Povečava 200 %  | Vsebina ostane berljiva in se ne prekriva  | Uspešno           |

Aplikacija uporablja media queries in relativne enote, zato se prilagaja različnim velikostim zaslona.

---

## 15. Testiranje dostopnosti

Dostopnost je bila testirana z ročnim pregledom, uporabo tipkovnice, Lighthouse in bralnikom zaslona NVDA oziroma pregledom ARIA oznak.

Preverjeno je bilo:

| Test                  | Pričakovani rezultat                                        | Dejanski rezultat |
| --------------------- | ----------------------------------------------------------- | ----------------- |
| Semantičen HTML       | Uporabljeni so `header`, `nav`, `main`, `section`, `form`   | Uspešno           |
| Struktura naslovov    | Naslovi so v logičnem vrstnem redu                          | Uspešno           |
| Uporaba s tipkovnico  | Do vseh interaktivnih elementov je mogoče priti s tipko Tab | Uspešno           |
| Skip link             | Prvi fokus omogoča preskok na glavno vsebino                | Uspešno           |
| Vidni fokus           | Fokus je jasno viden                                        | Uspešno           |
| Obrazci               | Vsa polja imajo pripadajoče `label` elemente                | Uspešno           |
| Napake                | Napake so jasne in povezane s polji                         | Uspešno           |
| Statusna sporočila    | Uporabljena sta `role="status"` in `aria-live`              | Uspešno           |
| Gumbi pri obveznostih | Gumbi imajo razumljiva imena oziroma `aria-label`           | Uspešno           |
| Povečava besedila     | Aplikacija ostane uporabna pri 200 % povečavi               | Uspešno           |

Lighthouse rezultati:

| Kategorija     |       Rezultat |
| -------------- | -------------: |
| Performance    | 100 |
| Accessibility  | 100 |
| Best Practices | 100 |
| SEO            | 90 |

---

## 16. PWA preverjanje v Chrome DevTools

Ker v novejših različicah Lighthouse ni vedno posebne PWA kategorije, so bile PWA funkcionalnosti preverjene ročno v Chrome DevTools.

| Element            | Orodje                            | Rezultat |
| ------------------ | --------------------------------- | -------- |
| Web App Manifest   | Application → Manifest            | Uspešno  |
| Service Worker     | Application → Service Workers     | Uspešno  |
| Cache Storage      | Application → Cache Storage       | Uspešno  |
| IndexedDB          | Application → IndexedDB           | Uspešno  |
| Offline delovanje  | Network → Offline                 | Uspešno  |
| Možnost namestitve | Browser install option / Manifest | Uspešno  |

---


## 17. Sklep testiranja

Testiranje je pokazalo, da aplikacija StudySync pravilno podpira osnovne funkcionalnosti, API-klice, offline delovanje, predpomnjenje, Background Sync, potisna obvestila, odzivnost, zmogljivost strežniškega dela in dostopnost.

Najpomembnejša ugotovitev je, da aplikacija ostane uporabna tudi takrat, ko backend ni dosegljiv. Uporabnik lahko dodaja, ureja in briše obveznosti, spremembe pa se shranijo lokalno in se pozneje sinhronizirajo s strežnikom.

Pri testiranju z orodjem k6 je bilo ugotovljeno, da JSON datoteka ni primerna za večje število hkratnih zapisov. Zato je za produkcijsko uporabo priporočljiva uporaba prave podatkovne baze, kot je SQLite, MySQL ali PostgreSQL.
